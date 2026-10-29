<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionAudit;
use App\Models\User;
use App\Models\Workspace;
use App\Rules\ValidDeliverableEmailRule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            return redirect()->intended('/dashboard')->with('success', 'Selamat datang kembali!');
        }

        return back()->withErrors([
            'email' => 'Email atau password yang Anda masukkan tidak sesuai.',
        ])->onlyInput('email');
    }

    public function showRegister(Request $request): Response
    {
        $plans = Plan::where('is_active', true)->get();
        $selectedPlanSlug = preg_replace('/[^a-zA-Z0-9\-_]/', '', (string) $request->query('plan', 'enterprise-pro'));

        return Inertia::render('Auth/Register', [
            'plans' => $plans,
            'selectedPlanSlug' => $selectedPlanSlug,
        ]);
    }

    public function register(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'email' => ['required', 'string', 'max:150', 'unique:users,email', new ValidDeliverableEmailRule],
            'password' => ['required', 'confirmed', Password::min(6)],
            'workspace_name' => 'required|string|max:150',
            'phone' => 'required|string|max:30',
            'plan_id' => 'required|exists:plans,id',
        ], [
            'name.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.unique' => 'Alamat email ini sudah terdaftar. Silakan masuk atau gunakan email lain.',
            'password.required' => 'Kata sandi wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'workspace_name.required' => 'Nama workspace / kampus wajib diisi.',
            'phone.required' => 'Nomor WhatsApp wajib diisi.',
        ]);

        $cleanName = strip_tags(trim($validated['name']));
        $cleanWorkspace = strip_tags(trim($validated['workspace_name']));
        $cleanPhone = preg_replace('/[^\d\+]/', '', trim($validated['phone']));

        $baseSlug = Str::slug($cleanWorkspace);
        if (empty($baseSlug)) {
            $baseSlug = 'workspace-'.rand(1000, 9999);
        }
        $slug = $baseSlug.'-'.rand(100, 999);

        // 1. Create Workspace
        $workspace = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => $cleanWorkspace,
            'slug' => $slug,
            'phone' => $cleanPhone,
            'is_active' => true,
        ]);

        // 2. Create User
        $user = User::create([
            'name' => $cleanName,
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'role' => 'owner',
            'workspace_id' => $workspace->id,
            'phone' => $cleanPhone,
        ]);

        // 3. Create Subscription
        $plan = Plan::findOrFail($validated['plan_id']);
        $monthlyQuota = $plan->limits['monthly_message_quota'] ?? 5000;

        $subscription = Subscription::create([
            'workspace_id' => $workspace->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'grace_period_days' => 3,
            'monthly_message_quota' => $monthlyQuota,
            'remaining_message_quota' => $monthlyQuota,
        ]);

        // 4. Record Audit
        SubscriptionAudit::create([
            'subscription_id' => $subscription->id,
            'admin_user_id' => $user->id,
            'action' => 'REGISTRATION_NEW',
            'previous_value' => [],
            'new_value' => ['plan' => $plan->name, 'duration_days' => 30, 'quota' => $monthlyQuota],
            'reason' => 'Pendaftaran akun baru dan aktivasi paket '.$plan->name,
        ]);

        // 5. Generate Initial API Key for Client Integration
        $plainApiKey = 'bk_live_'.Str::random(32);
        ApiKey::create([
            'workspace_id' => $workspace->id,
            'name' => 'Default Production API Key',
            'key_hash' => hash('sha256', $plainApiKey),
            'prefix' => substr($plainApiKey, 0, 8),
            'scopes' => ['messages:send', 'devices:read', 'contacts:sync'],
        ]);

        // 6. Log the user in
        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/dashboard')
            ->with('success', "Akun dan langganan paket {$plan->name} berhasil diaktifkan!")
            ->with('new_api_key', $plainApiKey);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/')->with('success', 'Anda telah berhasil keluar.');
    }
}
