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
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                    'phone' => $request->user()->phone,
                    'is_active' => (bool) $request->user()->is_active,
                    'is_superadmin' => $request->user()->isSuperAdmin(),
                    'is_saas_staff' => $request->user()->isSaaSStaff(),
                    'permissions' => [
                        'can_manage_staff' => $request->user()->canManageStaff(),
                        'can_manage_settings' => $request->user()->canManageSettings(),
                        'can_manage_plans' => $request->user()->canManagePlans(),
                        'can_manage_payments' => $request->user()->canManagePayments(),
                        'can_manage_gateways' => $request->user()->canManageGateways(),
                        'can_manage_clients' => $request->user()->canManageClients(),
                        'can_manage_subscriptions' => $request->user()->canManageSubscriptions(),
                    ],
                    'workspace_id' => $request->user()->workspace_id,
                    'workspace_name' => $request->user()->workspace?->name,
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
