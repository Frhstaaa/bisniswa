<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuthController extends Controller
{
    /**
     * Show the Superadmin / SaaS Staff login page.
     */
    public function showLogin(): Response|RedirectResponse
    {
        if (Auth::guard('admin')->check()) {
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Admin/Auth/Login');
    }

    /**
     * Handle incoming admin login attempt.
     */
    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ], [
            'email.required' => 'Email administrator wajib diisi.',
            'email.email' => 'Format email administrator tidak valid.',
            'password.required' => 'Kata sandi wajib diisi.',
        ]);

        if (Auth::guard('admin')->attempt($credentials, $request->boolean('remember'))) {
            $admin = Auth::guard('admin')->user();

            if (! $admin->is_active) {
                Auth::guard('admin')->logout();

                return back()->withErrors([
                    'email' => 'Akun Administrator Anda telah dinonaktifkan oleh Superadmin.',
                ])->onlyInput('email');
            }

            $request->session()->regenerate();

            return redirect()->intended(route('admin.dashboard'))
                ->with('success', "Selamat datang di Portal Administrasi Sistem, {$admin->name}!");
        }

        // If email belongs to a tenant user, provide clear guidance
        if (User::where('email', $credentials['email'])->exists()) {
            return back()->withErrors([
                'email' => 'Akun ini terdaftar sebagai Klien / Tenant. Silakan masuk melalui halaman login klien di /login.',
            ])->onlyInput('email');
        }

        return back()->withErrors([
            'email' => 'Kredensial administrator (email atau kata sandi) tidak valid.',
        ])->onlyInput('email');
    }

    /**
     * Log the admin out of the session.
     */
    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('admin')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('admin.login')
            ->with('success', 'Anda telah berhasil keluar dari Portal Administrasi.');
    }
}
