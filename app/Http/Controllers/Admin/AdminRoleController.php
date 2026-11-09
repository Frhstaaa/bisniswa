<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminRoleController extends Controller
{
    /**
     * Store a newly created dynamic role / group in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $currentUser = $request->user('admin') ?? $request->user();

        if (! $currentUser->isSuperAdmin()) {
            abort(403, 'Hanya Super Administrator yang berhak membuat grup peran & hak akses baru.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:50|regex:/^[a-zA-Z0-9_\-]+$/|unique:admin_roles,slug',
            'description' => 'nullable|string|max:255',
            'badge_color' => 'nullable|string|in:emerald,blue,purple,amber,rose,indigo,cyan,slate',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:manage_clients,manage_subscriptions,manage_payments,manage_plans,manage_gateways,manage_staff,manage_settings',
        ], [
            'name.required' => 'Nama grup peran wajib diisi.',
            'slug.unique' => 'Slug grup peran ini sudah digunakan.',
            'slug.regex' => 'Format slug hanya boleh berupa huruf, angka, underscore, dan strip.',
            'permissions.array' => 'Format hak akses harus berupa daftar checklist.',
        ]);

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'], '_')
            : Str::slug($validated['name'], '_');

        if (in_array($slug, ['superadmin'], true)) {
            return back()->withErrors(['slug' => 'Slug "superadmin" dilindungi oleh sistem inti.']);
        }

        if (AdminRole::where('slug', $slug)->exists()) {
            return back()->withErrors(['slug' => "Slug '{$slug}' sudah terdaftar. Silakan gunakan nama atau slug lain."]);
        }

        $role = AdminRole::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'badge_color' => $validated['badge_color'] ?? 'emerald',
            'permissions' => $validated['permissions'] ?? [],
            'is_system' => false,
        ]);

        $permCount = count($role->permissions ?? []);

        return back()->with('success', "Grup peran baru '{$role->name}' berhasil dibuat dengan {$permCount} izin akses modul.");
    }

    /**
     * Update an existing role / group and its page access permissions.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user('admin') ?? $request->user();

        if (! $currentUser->isSuperAdmin()) {
            abort(403, 'Hanya Super Administrator yang berhak mengedit grup dan hak akses.');
        }

        $role = AdminRole::findOrFail($id);

        if ($role->slug === 'superadmin') {
            return back()->with('error', 'Grup Super Administrator memiliki hak akses penuh permanen dan tidak dapat dibatasi.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'badge_color' => 'nullable|string|in:emerald,blue,purple,amber,rose,indigo,cyan,slate',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|in:manage_clients,manage_subscriptions,manage_payments,manage_plans,manage_gateways,manage_staff,manage_settings',
        ], [
            'name.required' => 'Nama grup peran wajib diisi.',
            'permissions.array' => 'Format hak akses harus berupa array daftar modul.',
        ]);

        $role->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'badge_color' => $validated['badge_color'] ?? $role->badge_color,
            'permissions' => $validated['permissions'] ?? [],
        ]);

        $permCount = count($role->permissions ?? []);

        return back()->with('success', "Hak akses grup '{$role->name}' berhasil diperbarui ({$permCount} modul aktif).");
    }

    /**
     * Delete a custom role / group.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user('admin') ?? $request->user();

        if (! $currentUser->isSuperAdmin()) {
            abort(403, 'Hanya Super Administrator yang berhak menghapus grup peran.');
        }

        $role = AdminRole::findOrFail($id);

        if ($role->is_system || $role->slug === 'superadmin') {
            return back()->with('error', "Grup sistem '{$role->name}' dilindungi secara arsitektural dan tidak dapat dihapus.");
        }

        $staffUsingCount = Admin::where('role', $role->slug)->count();

        if ($staffUsingCount > 0) {
            return back()->with('error', "Grup '{$role->name}' masih digunakan oleh {$staffUsingCount} akun staff. Ubah peran akun staff tersebut terlebih dahulu sebelum menghapus grup.");
        }

        $roleName = $role->name;
        $role->delete();

        return back()->with('success', "Grup peran '{$roleName}' berhasil dihapus.");
    }
}
