<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Message;
use App\Models\Subscription;
use App\Models\Workspace;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    protected function getWorkspace(Request $request): Workspace
    {
        return $request->user()?->workspace ?? Workspace::firstOrCreate(
            ['slug' => 'digital-sukses-mandiri'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'PT Digital Sukses Mandiri',
                'phone' => '+6281298430911',
                'is_active' => true,
            ]
        );
    }

    public function index(Request $request): Response
    {
        $workspace = $this->getWorkspace($request);

        $subscription = Subscription::with('plan')->where('workspace_id', $workspace->id)->first();
        $devices = Device::where('workspace_id', $workspace->id)->get();
        $recentMessages = Message::with('device')
            ->where('workspace_id', $workspace->id)
            ->latest('id')
            ->take(8)
            ->get();

        $maxDevices = $subscription?->plan?->limits['max_devices'] ?? 1;
        $monthlyQuota = $subscription?->monthly_message_quota ?? 5000;
        $remainingQuota = $subscription?->remaining_message_quota ?? $monthlyQuota;

        $workspaceMessages = Message::where('workspace_id', $workspace->id);
        $totalMessagesCount = (clone $workspaceMessages)->count();
        $sentToday = (clone $workspaceMessages)->whereDate('created_at', today())->count();
        $deliveredCount = (clone $workspaceMessages)->where('status', '!=', 'failed')->count();
        $deliveryRate = $totalMessagesCount > 0 ? round(($deliveredCount / $totalMessagesCount) * 100, 1) : 100.0;

        // Determine actual peak hour of activity for this workspace (database-agnostic)
        $busyHourRow = (clone $workspaceMessages)->latest('id')->take(200)->get()
            ->groupBy(fn ($m) => $m->created_at?->format('H'))
            ->sortByDesc(fn ($group) => $group->count())
            ->keys()
            ->first();
        $busyHourStr = $busyHourRow !== null ? sprintf('%02d:00 – %02d:00 WIB', (int) $busyHourRow, ((int) $busyHourRow + 2) % 24) : '10:00 – 15:00 WIB';

        $stats = [
            'total_devices' => $devices->count(),
            'connected_devices' => $devices->where('status', 'connected')->count(),
            'max_devices' => $maxDevices,
            'sent_today' => $sentToday,
            'total_messages' => $totalMessagesCount,
            'delivery_rate' => $deliveryRate.'%',
            'busiest_hour' => $busyHourStr,
            'monthly_quota' => $monthlyQuota,
            'remaining_quota' => $remainingQuota,
            'days_remaining' => $subscription?->daysRemaining() ?? 30,
            'subscription_status' => $subscription?->status ?? 'active',
            'plan_name' => $subscription?->plan?->name ?? 'Starter Lite',
            'ends_at' => $subscription?->ends_at?->translatedFormat('d F Y') ?? now()->addDays(30)->translatedFormat('d F Y'),
        ];

        $chartData = $this->computeRealtimeChartData($workspace->id);

        return Inertia::render('Dashboard', [
            'workspace' => $workspace,
            'subscription' => $subscription,
            'stats' => $stats,
            'chartData' => $chartData,
            'recentMessages' => $recentMessages,
            'devices' => $devices,
        ]);
    }

    /**
     * Compute realtime analytics datasets (24h, 7d, 30d) based on authentic database records.
     */
    protected function computeRealtimeChartData(int $workspaceId): array
    {
        $messages = Message::where('workspace_id', $workspaceId)
            ->where('created_at', '>=', now()->subDays(30)->startOfDay())
            ->get(['id', 'direction', 'campaign_id', 'status', 'created_at']);

        return [
            '24h' => $this->compute24hData($messages),
            '7d' => $this->compute7dData($messages),
            '30d' => $this->compute30dData($messages),
        ];
    }

    /**
     * Compute 24-hour intraday throughput broken into 3-hour blocks.
     */
    protected function compute24hData($messages): array
    {
        $todayMessages = $messages->filter(fn ($m) => $m->created_at >= now()->startOfDay());
        $slices = [0, 3, 6, 9, 12, 15, 18, 21];
        $currentHour = now()->hour;
        $result = [];

        foreach ($slices as $h) {
            $sliceStart = now()->startOfDay()->setHour($h);
            $sliceEnd = (clone $sliceStart)->addHours(3);

            $sliceMsg = $todayMessages->filter(function ($m) use ($sliceStart, $sliceEnd) {
                return $m->created_at >= $sliceStart && $m->created_at < $sliceEnd;
            });

            $tot = $sliceMsg->count();
            $bcast = $sliceMsg->whereNotNull('campaign_id')->count();
            $trans = $sliceMsg->whereNull('campaign_id')->where('direction', 'outbound')->count();
            $inbox = $sliceMsg->where('direction', 'inbound')->count();
            $failed = $sliceMsg->where('status', 'failed')->count();
            $succ = $tot > 0 ? round((($tot - $failed) / $tot) * 100, 1).'%' : '100%';
            $isCurrent = $currentHour >= $h && $currentHour < ($h + 3);

            $result[] = [
                'time' => sprintf('%02d:00', $h),
                'label' => sprintf('%02d:00 – %02d:59 WIB', $h, $h + 2),
                'broadcast' => $bcast,
                'transactional' => $trans,
                'inbox' => $inbox,
                'total' => $tot,
                'successRate' => $succ,
                'current' => $isCurrent,
                'peak' => false,
            ];
        }

        $max24h = collect($result)->max('total');
        if ($max24h > 0) {
            foreach ($result as &$item) {
                if ($item['total'] === $max24h) {
                    $item['peak'] = true;
                    break;
                }
            }
        }

        return $result;
    }

    /**
     * Compute 7-day throughput grouped by calendar day.
     */
    protected function compute7dData($messages): array
    {
        $dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        $result = [];

        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $ymd = $date->format('Y-m-d');

            $dayMsg = $messages->filter(fn ($m) => $m->created_at->format('Y-m-d') === $ymd);
            $tot = $dayMsg->count();
            $bcast = $dayMsg->whereNotNull('campaign_id')->count();
            $trans = $dayMsg->whereNull('campaign_id')->where('direction', 'outbound')->count();
            $inbox = $dayMsg->where('direction', 'inbound')->count();
            $failed = $dayMsg->where('status', 'failed')->count();
            $succ = $tot > 0 ? round((($tot - $failed) / $tot) * 100, 1).'%' : '100%';

            $result[] = [
                'time' => $dayNames[$date->dayOfWeek],
                'label' => $date->translatedFormat('l, d M'),
                'broadcast' => $bcast,
                'transactional' => $trans,
                'inbox' => $inbox,
                'total' => $tot,
                'successRate' => $succ,
                'current' => $i === 0,
                'peak' => false,
            ];
        }

        $max7d = collect($result)->max('total');
        if ($max7d > 0) {
            foreach ($result as &$item) {
                if ($item['total'] === $max7d) {
                    $item['peak'] = true;
                    break;
                }
            }
        }

        return $result;
    }

    /**
     * Compute 30-day throughput grouped into 10 multi-day buckets.
     */
    protected function compute30dData($messages): array
    {
        $result = [];

        for ($b = 9; $b >= 0; $b--) {
            $bucketEnd = now()->subDays($b * 3)->endOfDay();
            $bucketStart = (clone $bucketEnd)->subDays(2)->startOfDay();

            $bucketMsg = $messages->filter(function ($m) use ($bucketStart, $bucketEnd) {
                return $m->created_at >= $bucketStart && $m->created_at <= $bucketEnd;
            });

            $tot = $bucketMsg->count();
            $bcast = $bucketMsg->whereNotNull('campaign_id')->count();
            $trans = $bucketMsg->whereNull('campaign_id')->where('direction', 'outbound')->count();
            $inbox = $bucketMsg->where('direction', 'inbound')->count();
            $failed = $bucketMsg->where('status', 'failed')->count();
            $succ = $tot > 0 ? round((($tot - $failed) / $tot) * 100, 1).'%' : '100%';

            $result[] = [
                'time' => $bucketEnd->format('d M'),
                'label' => $bucketStart->format('d M').' – '.$bucketEnd->format('d M'),
                'broadcast' => $bcast,
                'transactional' => $trans,
                'inbox' => $inbox,
                'total' => $tot,
                'successRate' => $succ,
                'current' => $b === 0,
                'peak' => false,
            ];
        }

        $max30d = collect($result)->max('total');
        if ($max30d > 0) {
            foreach ($result as &$item) {
                if ($item['total'] === $max30d) {
                    $item['peak'] = true;
                    break;
                }
            }
        }

        return $result;
    }
}
