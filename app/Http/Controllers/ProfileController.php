<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Traits\HasWorkspaceContext;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    use HasWorkspaceContext;

    public function edit(Request $request): Response
    {
        $user = $request->user() ?? User::first();
        $workspace = $this->getWorkspace($request);

        return Inertia::render('Profile/Index', [
            'user' => $user,
            'workspace' => $workspace,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user = $request->user() ?? User::first();
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$user->id],
            'phone' => ['nullable', 'string', 'max:25', 'regex:/^[\+]?[0-9\s\-]{8,20}$/'],
            'workspace_name' => [$user->workspace ? 'required' : 'nullable', 'string', 'max:255'],
        ], [
            'name.required' => 'Nama penanggung jawab wajib diisi.',
            'email.required' => 'Alamat email wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
            'email.unique' => 'Alamat email sudah digunakan oleh akun lain.',
            'phone.regex' => 'Nomor WhatsApp harus berisi 8–20 digit angka yang valid.',
            'workspace_name.required' => 'Nama workspace / perusahaan wajib diisi.',
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $validated['phone'] ?? $user->phone,
        ]);

        if ($user->workspace && ! empty($validated['workspace_name'])) {
            $workspace->update([
                'name' => $validated['workspace_name'],
                'phone' => $validated['phone'] ?? $workspace->phone,
            ]);
        }

        return back()->with('success', 'Profil akun dan kredensial berhasil diperbarui.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $user = $request->user() ?? User::first();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ], [
            'current_password.required' => 'Kata sandi saat ini wajib diisi.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi baru minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ]);

        if (! Hash::check($validated['current_password'], $user->password)) {
            return back()->withErrors(['current_password' => 'Kata sandi saat ini tidak cocok dengan catatan kami.']);
        }

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return back()->with('success', 'Kata sandi berhasil diperbarui dengan aman.');
    }
}
