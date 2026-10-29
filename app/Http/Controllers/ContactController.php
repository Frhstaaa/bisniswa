<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    protected function getWorkspace(Request $request): Workspace
    {
        return $request->user()?->workspace ?? Workspace::firstOrCreate(
            ['slug' => 'digital-sukses-mandiri'],
            ['name' => 'PT Digital Sukses Mandiri', 'uuid' => (string) Str::uuid()]
        );
    }

    public function index(Request $request): Response
    {
        $workspace = $this->getWorkspace($request);

        $groups = ContactGroup::where('workspace_id', $workspace->id)
            ->withCount('contacts')
            ->orderBy('name')
            ->get();

        $selectedGroupId = $request->query('group_id');
        $search = $request->query('search');

        $contactsQuery = Contact::where('workspace_id', $workspace->id)
            ->with('group')
            ->when($selectedGroupId, function ($q, $groupId) {
                if ($groupId === 'none') {
                    return $q->whereNull('group_id');
                }

                return $q->where('group_id', $groupId);
            })
            ->when($search, function ($q, $search) {
                return $q->where(function ($sub) use ($search) {
                    $sub->whereRaw('LOWER(name) LIKE ?', ['%'.strtolower($search).'%'])
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest('id');

        $contacts = $contactsQuery->paginate(15)->withQueryString();

        $totalContactsCount = Contact::where('workspace_id', $workspace->id)->count();
        $unassignedContactsCount = Contact::where('workspace_id', $workspace->id)->whereNull('group_id')->count();

        return Inertia::render('Contacts/Index', [
            'groups' => $groups,
            'contacts' => $contacts,
            'filters' => [
                'group_id' => $selectedGroupId,
                'search' => $search,
            ],
            'stats' => [
                'total_contacts' => $totalContactsCount,
                'total_groups' => $groups->count(),
                'unassigned_contacts' => $unassignedContactsCount,
            ],
        ]);
    }

    public function storeContact(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:25'],
            'group_id' => [
                'nullable',
                Rule::exists('contact_groups', 'id')->where('workspace_id', $workspace->id),
            ],
            'custom_fields' => ['nullable'],
        ]);

        // Normalize phone number to international format
        $clean = preg_replace('/[^0-9]/', '', $validated['phone']);
        if (str_starts_with($clean, '0')) {
            $clean = '62'.substr($clean, 1);
        } elseif (! str_starts_with($clean, '62') && strlen($clean) <= 12) {
            $clean = '62'.$clean;
        }
        $phone = '+'.$clean;

        $customFields = $this->sanitizeCustomFields($validated['custom_fields'] ?? null);

        Contact::updateOrCreate(
            [
                'workspace_id' => $workspace->id,
                'phone' => $phone,
            ],
            [
                'group_id' => $validated['group_id'] ?: null,
                'name' => trim($validated['name']),
                'custom_fields' => $customFields,
            ]
        );

        return back()->with('success', 'Kontak berhasil disimpan.');
    }

    public function updateContact(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $contact = Contact::where('workspace_id', $workspace->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:25'],
            'group_id' => [
                'nullable',
                Rule::exists('contact_groups', 'id')->where('workspace_id', $workspace->id),
            ],
            'custom_fields' => ['nullable'],
        ]);

        // Normalize phone number to international format
        $clean = preg_replace('/[^0-9]/', '', $validated['phone']);
        if (str_starts_with($clean, '0')) {
            $clean = '62'.substr($clean, 1);
        } elseif (! str_starts_with($clean, '62') && strlen($clean) <= 12) {
            $clean = '62'.$clean;
        }
        $phone = '+'.$clean;

        // Ensure uniqueness of phone within the same workspace
        $duplicate = Contact::where('workspace_id', $workspace->id)
            ->where('phone', $phone)
            ->where('id', '!=', $contact->id)
            ->exists();

        if ($duplicate) {
            return back()->withErrors(['phone' => "Nomor WhatsApp {$phone} sudah digunakan oleh kontak lain di workspace ini."]);
        }

        $customFields = $this->sanitizeCustomFields($validated['custom_fields'] ?? null);

        $contact->update([
            'name' => trim($validated['name']),
            'phone' => $phone,
            'group_id' => $validated['group_id'] ?: null,
            'custom_fields' => $customFields,
        ]);

        return back()->with('success', "Kontak '{$contact->name}' berhasil diperbarui.");
    }

    public function destroyContact(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        Contact::where('workspace_id', $workspace->id)->where('id', $id)->delete();

        return back()->with('success', 'Kontak berhasil dihapus.');
    }

    public function storeGroup(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        ContactGroup::create([
            'workspace_id' => $workspace->id,
            'name' => trim($validated['name']),
            'description' => $validated['description'] ? trim($validated['description']) : null,
        ]);

        return back()->with('success', 'Grup kontak berhasil dibuat.');
    }

    public function updateGroup(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $group = ContactGroup::where('workspace_id', $workspace->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:255'],
        ]);

        $group->update([
            'name' => trim($validated['name']),
            'description' => $validated['description'] ? trim($validated['description']) : null,
        ]);

        return back()->with('success', "Grup '{$group->name}' berhasil diperbarui.");
    }

    public function destroyGroup(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        ContactGroup::where('workspace_id', $workspace->id)->where('id', $id)->delete();

        return back()->with('success', 'Grup kontak berhasil dihapus.');
    }

    protected function sanitizeCustomFields(mixed $fields): ?array
    {
        if (empty($fields)) {
            return null;
        }

        if (is_string($fields)) {
            $decoded = json_decode($fields, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $fields = $decoded;
            } else {
                return null;
            }
        }

        if (! is_array($fields)) {
            return null;
        }

        $clean = [];
        foreach ($fields as $key => $value) {
            $k = trim((string) $key);
            $v = is_string($value) ? trim($value) : $value;
            if ($k !== '' && $v !== '' && $v !== null) {
                $clean[$k] = $v;
            }
        }

        return ! empty($clean) ? $clean : null;
    }

    public function importCsv(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $request->validate([
            'group_id' => [
                'nullable',
                Rule::exists('contact_groups', 'id')->where('workspace_id', $workspace->id),
            ],
            'csv_data' => ['required', 'string'],
        ]);

        $lines = preg_split('/\r\n|\r|\n/', trim($request->input('csv_data')));
        $importedCount = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Supports format: name,phone or just phone or name,phone,tagihan,jurusan
            $parts = str_getcsv($line);
            if (count($parts) === 1) {
                $name = 'Kontak '.substr($parts[0], -4);
                $rawPhone = $parts[0];
                $customFields = [];
            } else {
                $name = trim($parts[0]);
                $rawPhone = trim($parts[1]);
                $customFields = [];
                if (isset($parts[2])) {
                    $customFields['tagihan'] = trim($parts[2]);
                }
                if (isset($parts[3])) {
                    $customFields['jurusan'] = trim($parts[3]);
                }
            }

            $phone = preg_replace('/[^0-9]/', '', $rawPhone);
            if (empty($phone)) {
                continue;
            }
            if (str_starts_with($phone, '0')) {
                $phone = '62'.substr($phone, 1);
            }
            if (! str_starts_with($phone, '+')) {
                $phone = '+'.$phone;
            }

            Contact::updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'phone' => $phone,
                ],
                [
                    'group_id' => $request->input('group_id') ?: null,
                    'name' => $name,
                    'custom_fields' => ! empty($customFields) ? $customFields : null,
                ]
            );

            $importedCount++;
        }

        return back()->with('success', "Berhasil mengimpor {$importedCount} nomor kontak.");
    }
}
