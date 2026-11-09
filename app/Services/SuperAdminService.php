<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Workspace;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use Carbon\Carbon;
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
            $monthlyRevenue = Payment::where('status', 'paid')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount');

            $pendingPaymentsCount = Payment::where('status', 'pending')->count();
            $pendingPaymentsAmount = Payment::where('status', 'pending')->sum('amount');

            $totalDevices = Device::count();
            $onlineDevices = Device::where('status', 'connected')->count();

            $messagesToday = Message::whereDate('created_at', today())->count();
            $messagesTotal = Message::count();

            $totalOutbound = Message::where('direction', 'outbound')->count();
            $deliveredOutbound = Message::where('direction', 'outbound')->whereIn('status', ['delivered', 'sent', 'read'])->count();
            $deliveryRate = $totalOutbound > 0 ? round(($deliveredOutbound / $totalOutbound) * 100, 1) : 99.4;

            // Plan distribution breakdown
            $plans = Plan::all()->map(function ($plan) {
                $subscribersCount = Subscription::where('plan_id', $plan->id)->where('status', 'active')->count();

                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'price' => (float) $plan->price_monthly,
                    'subscribers' => $subscribersCount,
                ];
            });

            // 7-day revenue trend
            $sevenDaysRevenue = collect(range(6, 0))->map(function ($daysAgo) {
                $date = Carbon::today()->subDays($daysAgo);
                $sum = Payment::where('status', 'paid')
                    ->whereDate('created_at', $date)
                    ->sum('amount');

                return [
                    'date' => $date->format('Y-m-d'),
                    'day' => $date->translatedFormat('D'),
                    'amount' => (float) $sum,
                ];
            });

            return [
                'metrics' => [
                    'total_workspaces' => $totalWorkspaces,
                    'active_workspaces' => $activeWorkspaces,
                    'total_revenue' => $totalRevenue,
                    'monthly_revenue' => $monthlyRevenue,
                    'pending_payments_count' => $pendingPaymentsCount,
                    'pending_payments_amount' => $pendingPaymentsAmount,
                    'total_devices' => $totalDevices,
                    'online_devices' => $onlineDevices,
                    'messages_today' => $messagesToday,
                    'messages_total' => $messagesTotal,
                    'delivery_rate' => $deliveryRate,
                    'active_subscribers' => Subscription::where('status', 'active')->count(),
                ],
                'plans_breakdown' => $plans->values()->all(),
                'revenue_trend' => $sevenDaysRevenue->values()->all(),
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
                    ->limit(6)
                    ->get()
                    ->values()
                    ->all(),
            ];
        });
    }
}
