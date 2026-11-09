<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSuperAdmin
{
    /**
     * Handle an incoming request for SaaS Admin Platform.
     * Allows Superadmin and authorized SaaS Staff (admin, marketing, support) based on permissions.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $permission = null): Response
    {
        $user = $request->user('admin') ?? $request->user();

        if (! $user) {
            return redirect()->route('admin.login');
        }

        if ($user->is_active === false) {
            auth('admin')->logout();
            auth()->logout();

            return redirect()->route('admin.login')->withErrors(['email' => 'Akun Administrator Anda telah dinonaktifkan.']);
        }

        if (! method_exists($user, 'isSaaSStaff') || ! $user->isSaaSStaff()) {
            abort(403, 'Akses ditolak. Fitur ini khusus untuk Tim Manajemen SaaS.');
        }

        if ($permission) {
            $method = 'can'.str_replace('_', '', ucwords($permission, '_'));
            if (method_exists($user, $method) && ! $user->{$method}()) {
                abort(403, 'Akses ditolak. Peran Anda ('.ucfirst($user->role).') tidak memiliki izin untuk mengakses modul ini.');
            }
        }

        return $next($request);
    }
}
