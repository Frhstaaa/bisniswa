<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $webUser = $request->user('web');
        $adminUser = $request->user('admin');
        $activeUser = $adminUser ?: $webUser;

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $activeUser ? [
                    'id' => $activeUser->id,
                    'name' => $activeUser->name,
                    'email' => $activeUser->email,
                    'role' => $activeUser->role,
                    'phone' => $activeUser->phone,
                    'is_active' => (bool) $activeUser->is_active,
                    'is_superadmin' => method_exists($activeUser, 'isSuperAdmin') ? $activeUser->isSuperAdmin() : false,
                    'is_saas_staff' => method_exists($activeUser, 'isSaaSStaff') ? $activeUser->isSaaSStaff() : false,
                    'permissions' => [
                        'can_manage_staff' => method_exists($activeUser, 'canManageStaff') ? $activeUser->canManageStaff() : false,
                        'can_manage_settings' => method_exists($activeUser, 'canManageSettings') ? $activeUser->canManageSettings() : false,
                        'can_manage_plans' => method_exists($activeUser, 'canManagePlans') ? $activeUser->canManagePlans() : false,
                        'can_manage_payments' => method_exists($activeUser, 'canManagePayments') ? $activeUser->canManagePayments() : false,
                        'can_manage_gateways' => method_exists($activeUser, 'canManageGateways') ? $activeUser->canManageGateways() : false,
                        'can_manage_clients' => method_exists($activeUser, 'canManageClients') ? $activeUser->canManageClients() : false,
                        'can_manage_subscriptions' => method_exists($activeUser, 'canManageSubscriptions') ? $activeUser->canManageSubscriptions() : false,
                    ],
                    'workspace_id' => $webUser ? $webUser->workspace_id : null,
                    'workspace_name' => $webUser ? $webUser->workspace?->name : 'SaaS Central Platform',
                ] : null,
                'admin' => $adminUser ? [
                    'id' => $adminUser->id,
                    'name' => $adminUser->name,
                    'email' => $adminUser->email,
                    'role' => $adminUser->role,
                    'phone' => $adminUser->phone,
                    'is_active' => (bool) $adminUser->is_active,
                    'is_superadmin' => $adminUser->isSuperAdmin(),
                    'is_saas_staff' => $adminUser->isSaaSStaff(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'status' => fn () => $request->session()->get('status'),
                'preview_url' => fn () => $request->session()->get('preview_url'),
                'wa_sent' => fn () => $request->session()->get('wa_sent'),
                'user_phone' => fn () => $request->session()->get('user_phone'),
                'new_api_key' => fn () => $request->session()->get('new_api_key'),
                'created_device' => fn () => $request->session()->get('created_device'),
            ],
        ];
    }
}
