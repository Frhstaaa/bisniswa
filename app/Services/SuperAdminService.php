<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Workspace;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use Illuminate\Support\Facades\Cache;

class SuperAdminService
{
    public function __construct(
        protected ClientRepositoryInterface $clientRepo,
        protected PaymentRepositoryInterface $paymentRepo
    ) {}

    /**
     * Aggregate system-wide operational metrics for the Super Admin overview.
     * Cached with short TTL for snappy, low-latency SPA navigation.
     *
     * @return array<string, mixed>
     */
    public function getOverviewStats(): array
    {
        return Cache::remember('admin_overview_stats', 5, function () {
            $totalWorkspaces = $this->clientRepo->getTotalCount();
            $activeWorkspaces = $this->clientRepo->getActiveCount();
            $totalRevenue = $this->paymentRepo->getTotalRevenue();
            $pendingPaymentsCount = Payment::where('status', 'pending')->count();

            $totalDevices = Device::count();
            $onlineDevices = Device::where('status', 'connected')->count();

            $messagesToday = Message::whereDate('created_at', today())->count();
            $messagesTotal = Message::count();

            return [
                'metrics' => [
                    'total_workspaces' => $totalWorkspaces,
                    'active_workspaces' => $activeWorkspaces,
                    'total_revenue' => $totalRevenue,
                    'pending_payments_count' => $pendingPaymentsCount,
                    'total_devices' => $totalDevices,
                    'online_devices' => $onlineDevices,
                    'messages_today' => $messagesToday,
                    'messages_total' => $messagesTotal,
                ],
                'engine_health' => [
                    'baileys' => [
                        'active_instances' => $onlineDevices,
                        'status' => 'operational',
                        'estimated_ram_mb' => $onlineDevices * 25,
                        'engine_version' => 'BisnisWA Baileys Engine (WebSocket Native)',
                    ],
                    'wwebjs' => [
                        'active_instances' => $onlineDevices,
                        'status' => 'operational',
                        'estimated_ram_mb' => $onlineDevices * 25,
                        'engine_version' => 'BisnisWA Baileys Engine (WebSocket Native)',
                    ],
                ],
                'recent_payments' => $this->paymentRepo->getRecentPayments(6)->values()->all(),
                'recent_clients' => Workspace::with(['users', 'subscription.plan'])
                    ->latest()
                    ->limit(5)
                    ->get()
                    ->values()
                    ->all(),
            ];
        });
    }
}
