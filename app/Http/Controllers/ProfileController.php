<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Workspace;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    protected function getWorkspace(Request $request): Workspace
    {
        return $request->user()?->workspace ?? Workspace::firstOrCreate(
            ['slug' => 'digital-sukses-mandiri'],
            ['name' => 'PT Digital Sukses Mandiri', 'uuid' => (string) Str::uuid()]
        );
    }

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
            'phone' => ['nullable', 'string', 'max:25'],
            'workspace_name' => ['required', 'string', 'max:255'],
        ]);

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        $workspace->update([
            'name' => $validated['workspace_name'],
            'phone' => $validated['phone'] ?? $workspace->phone,
        ]);

        return back()->with('success', 'Profil akun dan data workspace berhasil diperbarui.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $user = $request->user() ?? User::first();

        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
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
