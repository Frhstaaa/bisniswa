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
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search', '');
        $roleFilter = $request->query('role', 'all');

        $query = User::whereIn('role', ['superadmin', 'admin', 'marketing', 'support']);

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        if ($roleFilter !== 'all' && in_array($roleFilter, ['superadmin', 'admin', 'marketing', 'support'], true)) {
            $query->where('role', $roleFilter);
        }

        $staff = $query->orderByRaw("CASE WHEN role = 'superadmin' THEN 1 WHEN role = 'admin' THEN 2 WHEN role = 'marketing' THEN 3 ELSE 4 END")
            ->orderBy('name', 'asc')
            ->get();

        $metrics = [
            'total_staff' => User::whereIn('role', ['superadmin', 'admin', 'marketing', 'support'])->count(),
            'superadmin_count' => User::where('role', 'superadmin')->count(),
            'admin_count' => User::where('role', 'admin')->count(),
            'marketing_count' => User::where('role', 'marketing')->count(),
            'support_count' => User::where('role', 'support')->count(),
        ];

        return Inertia::render('Admin/Staff/Index', [
            'staff' => $staff,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
            ],
            'availableRoles' => [
                [
                    'value' => 'admin',
                    'label' => 'Admin Operasional',
                    'description' => 'Akses kelola klien, langganan, verifikasi pembayaran, paket layanan, dan monitoring gateway.',
                    'color' => 'emerald',
                ],
                [
                    'value' => 'marketing',
                    'label' => 'Marketing & Billing',
                    'description' => 'Akses kelola paket langganan, lihat transaksi pembayaran, dan laporan pendapatan SaaS.',
                    'color' => 'blue',
                ],
                [
                    'value' => 'support',
                    'label' => 'Customer Support',
                    'description' => 'Akses bantuan klien, pemecahan masalah perangkat, dan monitoring sesi WhatsApp.',
                    'color' => 'purple',
                ],
            ],
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

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:30',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|in:admin,marketing,support',
        ], [
            'role.in' => 'Pilihan role staff hanya boleh: Admin, Marketing, atau Support.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'password.min' => 'Kata sandi minimal 8 karakter.',
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
     * Note: Superadmin role CANNOT be changed or assigned.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        if ($user->role === 'superadmin' || $user->id === 1) {
            // Cannot modify role of root superadmin
            if ($request->filled('role') && $request->input('role') !== 'superadmin') {
                return back()->with('error', 'Role Super Administrator utama dilindungi dan tidak dapat diubah.');
            }
        }

        if ($request->input('role') === 'superadmin' && $user->role !== 'superadmin') {
            return back()->withErrors([
                'role' => 'Role Superadmin tidak dapat diberikan ke akun staff.',
            ]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:30',
            'password' => 'nullable|string|min:8|confirmed',
            'role' => $user->isSuperAdmin() ? 'nullable|string' : 'required|string|in:admin,marketing,support',
        ], [
            'role.in' => 'Pilihan role staff hanya boleh: Admin, Marketing, atau Support.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? null,
        ];

        if (! $user->isSuperAdmin() && ! empty($validated['role'])) {
            $updateData['role'] = $validated['role'];
        }

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
    public function toggleStatus(int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        if ($user->role === 'superadmin' || $user->id === 1) {
            return back()->with('error', 'Akun Super Administrator utama dilindungi dan tidak dapat dinonaktifkan.');
        }

        if ($user->id === auth()->id()) {
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
    public function destroy(int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        if ($user->role === 'superadmin' || $user->id === 1) {
            return back()->with('error', 'Akun Super Administrator utama dilindungi dan tidak dapat dihapus.');
        }

        if ($user->id === auth()->id()) {
            return back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.');
        }

        $userName = $user->name;
        $user->delete();

        return back()->with('success', "Akun staff '{$userName}' berhasil dihapus.");
    }
}
