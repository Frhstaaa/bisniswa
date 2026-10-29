<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Workspace;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;

class SuperAdminService
{
    public function __construct(
        protected ClientRepositoryInterface $clientRepo,
        protected PaymentRepositoryInterface $paymentRepo
    ) {}

    /**
     * Aggregate system-wide operational metrics for the Super Admin overview.
     *
     * @return array<string, mixed>
     */
    public function getOverviewStats(): array
    {
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
                'wwebjs' => [
                    'active_instances' => $onlineDevices,
                    'status' => 'operational',
                    'estimated_ram_mb' => $onlineDevices * 120,
                    'engine_version' => 'BisnisWA UltraSync Engine v2.0 (Enterprise Native)',
                ],
            ],
            'recent_payments' => $this->paymentRepo->getRecentPayments(6),
            'recent_clients' => Workspace::with(['users', 'subscription.plan'])
                ->latest()
                ->limit(5)
                ->get(),
        ];
    }
}
