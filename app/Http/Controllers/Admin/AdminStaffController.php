<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class AdminStaffController extends Controller
{
    /**
     * Display a listing of SaaS internal staff & RBAC roles.
     * Note: Non-superadmin users (like Admin Operasional) CANNOT see the Superadmin account.
     */
    public function index(Request $request): Response
    {
        $currentUser = $request->user();
        $isSuperAdmin = $currentUser->isSuperAdmin();

        $search = $request->query('search', '');
        $roleFilter = $request->query('role', 'all');

        $query = User::whereIn('role', ['superadmin', 'admin', 'marketing', 'support']);

        // Explicit security rule: Subordinate staff (Admin, Marketing, Support) cannot see Superadmin
        if (! $isSuperAdmin) {
            $query->where('role', '!=', 'superadmin');
        }

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        if ($roleFilter !== 'all') {
            if ($roleFilter === 'superadmin' && ! $isSuperAdmin) {
                // Non-superadmin filtering for superadmin gets empty result
                $query->whereRaw('1 = 0');
            } elseif (in_array($roleFilter, ['superadmin', 'admin', 'marketing', 'support'], true)) {
                $query->where('role', $roleFilter);
            }
        }

        $staff = $query->orderByRaw("CASE WHEN role = 'superadmin' THEN 1 WHEN role = 'admin' THEN 2 WHEN role = 'marketing' THEN 3 ELSE 4 END")
            ->orderBy('name', 'asc')
            ->get();

        $metrics = [
            'total_staff' => $isSuperAdmin
                ? User::whereIn('role', ['superadmin', 'admin', 'marketing', 'support'])->count()
                : User::whereIn('role', ['admin', 'marketing', 'support'])->count(),
            'superadmin_count' => $isSuperAdmin ? User::where('role', 'superadmin')->count() : 0,
            'admin_count' => User::where('role', 'admin')->count(),
            'marketing_count' => User::where('role', 'marketing')->count(),
            'support_count' => User::where('role', 'support')->count(),
        ];

        // Roles available to be assigned based on who is logged in
        $availableRoles = [];
        if ($isSuperAdmin) {
            $availableRoles[] = [
                'value' => 'admin',
                'label' => 'Admin Operasional',
                'description' => 'Akses kelola klien, langganan, verifikasi pembayaran, paket layanan, dan monitoring gateway.',
                'color' => 'emerald',
            ];
        }
        $availableRoles[] = [
            'value' => 'marketing',
            'label' => 'Marketing & Billing',
            'description' => 'Akses kelola paket langganan, lihat transaksi pembayaran, dan laporan pendapatan SaaS.',
            'color' => 'blue',
        ];
        $availableRoles[] = [
            'value' => 'support',
            'label' => 'Customer Support',
            'description' => 'Akses bantuan klien, pemecahan masalah perangkat, dan monitoring sesi WhatsApp.',
            'color' => 'purple',
        ];

        return Inertia::render('Admin/Staff/Index', [
            'staff' => $staff,
            'metrics' => $metrics,
            'isSuperAdmin' => $isSuperAdmin,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
            'availableRoles' => $availableRoles,
        ]);
    }

    /**
     * Store a newly created SaaS staff user in storage.
     * Note: Superadmin role CANNOT be created via this form.
     */
    public function store(Request $request): RedirectResponse
    {
        if ($request->input('role') === 'superadmin') {
            return back()->withErrors([
                'role' => 'Role Superadmin dilindungi secara sistem dan tidak dapat ditambahkan.',
            ]);
        }

        $allowedRoles = $request->user()->isSuperAdmin() ? 'admin,marketing,support' : 'marketing,support';

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:'.$allowedRoles,
        ], [
            'role.in' => 'Pilihan role staff tidak valid.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'email.unique' => 'Email ini sudah terdaftar di sistem.',
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
            'workspace_id' => null, // SaaS internal staff are global across workspaces
        ]);

        return back()->with('success', "Staff baru '{$validated['name']}' ({$validated['role']}) berhasil ditambahkan.");
    }

    /**
     * Update the specified staff member in storage.
     * Allows Superadmin to edit their own email, name, phone, and password.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user();
        $user = User::findOrFail($id);

        // Security: Non-superadmin cannot see or edit superadmin!
        if ($user->isSuperAdmin()) {
            if (! $currentUser->isSuperAdmin()) {
                abort(404);
            }

            // Superadmin updating their OWN account:
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
                'phone' => 'nullable|string|max:30',
                'password' => 'nullable|string|min:8|confirmed',
            ], [
                'email.unique' => 'Email ini sudah digunakan oleh akun lain.',
                'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
                'password.min' => 'Kata sandi minimal 8 karakter.',
            ]);

            $updateData = [
                'name' => $validated['name'],
                'email' => strtolower($validated['email']),
                'phone' => $validated['phone'] ?? null,
            ];

            if (! empty($validated['password'])) {
                $updateData['password'] = Hash::make($validated['password']);
            }

            $user->update($updateData);

            return back()->with('success', 'Email, data akun & kata sandi Super Administrator berhasil diperbarui.');
        }

        // Subordinate staff update
        if ($request->input('role') === 'superadmin') {
            return back()->withErrors([
                'role' => 'Role Superadmin tidak dapat diberikan ke akun staff.',
            ]);
        }

        $allowedRoles = $currentUser->isSuperAdmin() ? 'admin,marketing,support' : 'marketing,support';

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:30',
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|in:'.$allowedRoles,
        ], [
            'role.in' => 'Pilihan role staff tidak valid.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'email.unique' => 'Email ini sudah digunakan oleh akun lain.',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        return back()->with('success', "Data staff '{$user->name}' berhasil diperbarui.");
    }

    /**
     * Toggle active/inactive status of a staff member.
     * Note: Root Superadmin CANNOT be deactivated.
     */
    public function toggleStatus(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user();
        $user = User::findOrFail($id);

        if ($user->isSuperAdmin()) {
            if (! $currentUser->isSuperAdmin()) {
                abort(404);
            }

            return back()->with('error', 'Akun Super Administrator utama dilindungi dan tidak dapat dinonaktifkan.');
        }

        if ($user->id === $currentUser->id) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        $user->is_active = ! $user->is_active;
        $user->save();

        $statusStr = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Akun staff '{$user->name}' berhasil {$statusStr}.");
    }

    /**
     * Remove the specified staff user from storage.
     * Note: Root Superadmin CANNOT be deleted.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user();
        $user = User::findOrFail($id);

        if ($user->isSuperAdmin()) {
            if (! $currentUser->isSuperAdmin()) {
                abort(404);
            }

            return back()->with('error', 'Akun Super Administrator utama dilindungi dan tidak dapat dihapus.');
        }

        if ($user->id === $currentUser->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
        }

        $userName = $user->name;
        $user->delete();

        return back()->with('success', "Akun staff '{$userName}' berhasil dihapus.");
    }
}
