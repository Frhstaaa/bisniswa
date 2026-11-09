<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AdminRole;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $currentUser = $request->user('admin') ?? $request->user();
        $isSuperAdmin = $currentUser->isSuperAdmin();

        $search = $request->query('search', '');
        $roleFilter = $request->query('role', 'all');

        $query = Admin::with('adminRole');

        // Explicit security rule: Subordinate staff (Admin, Marketing, Support) cannot see Superadmin
        if (! $isSuperAdmin) {
            $query->where('role', '!=', 'superadmin');
        }

        if (! empty($search)) {
            $like = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('name', $like, "%{$search}%")
                    ->orWhere('email', $like, "%{$search}%")
                    ->orWhere('phone', $like, "%{$search}%");
            });
        }

        if ($roleFilter !== 'all') {
            if ($roleFilter === 'superadmin' && ! $isSuperAdmin) {
                // Non-superadmin filtering for superadmin gets empty result
                $query->whereRaw('1 = 0');
            } else {
                $query->where('role', $roleFilter);
            }
        }

        $staff = $query->orderByRaw("CASE WHEN role = 'superadmin' THEN 1 WHEN role = 'admin' THEN 2 ELSE 3 END")
            ->orderBy('name', 'asc')
            ->get();

        $allRoles = AdminRole::withCount('admins')
            ->orderBy('is_system', 'desc')
            ->orderBy('name', 'asc')
            ->get();

        $metrics = [
            'total_staff' => $isSuperAdmin ? Admin::count() : Admin::where('role', '!=', 'superadmin')->count(),
            'superadmin_count' => $isSuperAdmin ? Admin::where('role', 'superadmin')->count() : 0,
            'roles_count' => $allRoles->count(),
            'admin_count' => Admin::where('role', 'admin')->count(),
            'marketing_count' => Admin::where('role', 'marketing')->count(),
            'support_count' => Admin::where('role', 'support')->count(),
        ];

        // Roles available to be assigned based on who is logged in
        $availableRoles = $allRoles->filter(function ($r) use ($isSuperAdmin) {
            if ($r->slug === 'superadmin') {
                return false;
            }
            if (! $isSuperAdmin && $r->slug === 'admin') {
                return false;
            }

            return true;
        })->map(function ($r) {
            return [
                'value' => $r->slug,
                'label' => $r->name,
                'description' => $r->description ?? '',
                'color' => $r->badge_color ?? 'emerald',
                'permissions' => $r->permissions ?? [],
            ];
        })->values()->toArray();

        return Inertia::render('Admin/Staff/Index', [
            'staff' => $staff,
            'metrics' => $metrics,
            'isSuperAdmin' => $isSuperAdmin,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
            'availableRoles' => $availableRoles,
            'roles' => $allRoles,
            'availablePermissions' => array_values(AdminRole::availablePermissions()),
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

        $currentUser = $request->user('admin') ?? $request->user();
        $allowedRolesQuery = AdminRole::where('slug', '!=', 'superadmin');
        if (! $currentUser->isSuperAdmin()) {
            $allowedRolesQuery->where('slug', '!=', 'admin');
        }
        $allowedRoles = $allowedRolesQuery->pluck('slug')->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:admins,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:'.implode(',', $allowedRoles),
        ], [
            'role.in' => 'Pilihan grup peran staff tidak valid.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
            'email.unique' => 'Email ini sudah terdaftar di sistem.',
        ]);

        Admin::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'is_active' => true,
        ]);

        return back()->with('success', "Staff baru '{$validated['name']}' ({$validated['role']}) berhasil ditambahkan.");
    }

    /**
     * Update the specified staff member in storage.
     * Allows Superadmin to edit their own email, name, phone, and password.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user('admin') ?? $request->user();
        $admin = Admin::findOrFail($id);

        // Security: Non-superadmin cannot see or edit superadmin!
        if ($admin->isSuperAdmin()) {
            if (! $currentUser->isSuperAdmin()) {
                abort(404);
            }

            // Superadmin updating their OWN account:
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:admins,email,'.$admin->id,
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

            $admin->update($updateData);

            return back()->with('success', 'Email, data akun & kata sandi Super Administrator berhasil diperbarui.');
        }

        // Subordinate staff update
        if ($request->input('role') === 'superadmin') {
            return back()->withErrors([
                'role' => 'Role Superadmin tidak dapat diberikan ke akun staff.',
            ]);
        }

        $allowedRolesQuery = AdminRole::where('slug', '!=', 'superadmin');
        if (! $currentUser->isSuperAdmin()) {
            $allowedRolesQuery->where('slug', '!=', 'admin');
        }
        $allowedRoles = $allowedRolesQuery->pluck('slug')->toArray();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:admins,email,'.$admin->id,
            'phone' => 'nullable|string|max:30',
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|in:'.implode(',', $allowedRoles),
        ], [
            'role.in' => 'Pilihan grup peran staff tidak valid.',
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

        $admin->update($updateData);

        return back()->with('success', "Data staff '{$admin->name}' berhasil diperbarui.");
    }

    /**
     * Toggle active/inactive status of a staff member.
     * Note: Root Superadmin CANNOT be deactivated.
     */
    public function toggleStatus(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user('admin') ?? $request->user();
        $admin = Admin::findOrFail($id);

        if ($admin->isSuperAdmin()) {
            if (! $currentUser->isSuperAdmin()) {
                abort(404);
            }

            return back()->with('error', 'Akun Super Administrator utama dilindungi dan tidak dapat dinonaktifkan.');
        }

        if ($admin->id === $currentUser->id) {
            return back()->with('error', 'Anda tidak dapat menonaktifkan akun Anda sendiri.');
        }

        $admin->is_active = ! $admin->is_active;
        $admin->save();

        $statusStr = $admin->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Akun staff '{$admin->name}' berhasil {$statusStr}.");
    }

    /**
     * Remove the specified staff user from storage.
     * Note: Root Superadmin CANNOT be deleted.
     */
    public function destroy(Request $request, int $id): RedirectResponse
    {
        $currentUser = $request->user('admin') ?? $request->user();
        $admin = Admin::findOrFail($id);

        if ($admin->isSuperAdmin()) {
            if (! $currentUser->isSuperAdmin()) {
                abort(404);
            }

            return back()->with('error', 'Akun Super Administrator utama dilindungi dan tidak dapat dihapus.');
        }

        if ($admin->id === $currentUser->id) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
        }

        $adminName = $admin->name;
        $admin->delete();

        return back()->with('success', "Akun staff '{$adminName}' berhasil dihapus.");
    }
}
