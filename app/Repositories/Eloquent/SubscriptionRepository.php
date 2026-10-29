<?php

namespace App\Repositories\Eloquent;

use App\Models\Subscription;
use App\Models\SubscriptionAudit;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class SubscriptionRepository implements SubscriptionRepositoryInterface
{
    public function findByWorkspaceId(int $workspaceId): ?Subscription
    {
        return Subscription::with(['plan', 'audits.admin'])
            ->where('workspace_id', $workspaceId)
            ->first();
    }

    public function findById(int $id): ?Subscription
    {
        return Subscription::with(['workspace', 'plan', 'audits.admin'])->find($id);
    }

    public function extendDuration(Subscription $subscription, int $days, string $reason, ?int $adminId = null): Subscription
    {
        return DB::transaction(function () use ($subscription, $days, $reason, $adminId) {
            $prevEnd = $subscription->ends_at;
            $newEnd = $subscription->ends_at
                ? $subscription->ends_at->copy()->addDays($days)
                : Carbon::now()->addDays($days);

            $subscription->ends_at = $newEnd;
            if ($subscription->status === 'suspended' && $newEnd->isFuture()) {
                $subscription->status = 'active';
            }
            $subscription->save();

            SubscriptionAudit::create([
                'subscription_id' => $subscription->id,
                'admin_user_id' => $adminId,
                'action' => $days >= 0 ? 'EXTEND_DAYS' : 'REDUCE_DAYS',
                'previous_value' => ['ends_at' => $prevEnd?->toIso8601String()],
                'new_value' => ['ends_at' => $newEnd->toIso8601String(), 'days_adjusted' => $days],
                'reason' => $reason,
            ]);

            return $subscription;
        });
    }

    public function setCustomDates(Subscription $subscription, Carbon $startDate, Carbon $endDate, string $reason, ?int $adminId = null): Subscription
    {
        return DB::transaction(function () use ($subscription, $startDate, $endDate, $reason, $adminId) {
            $prev = [
                'starts_at' => $subscription->starts_at?->toIso8601String(),
                'ends_at' => $subscription->ends_at?->toIso8601String(),
            ];

            $subscription->starts_at = $startDate;
            $subscription->ends_at = $endDate;
            $subscription->status = $endDate->isFuture() ? 'active' : 'suspended';
            $subscription->save();

            SubscriptionAudit::create([
                'subscription_id' => $subscription->id,
                'admin_user_id' => $adminId,
                'action' => 'SET_DATES',
                'previous_value' => $prev,
                'new_value' => [
                    'starts_at' => $startDate->toIso8601String(),
                    'ends_at' => $endDate->toIso8601String(),
                ],
                'reason' => $reason,
            ]);

            return $subscription;
        });
    }

    public function topupQuota(Subscription $subscription, int $additionalQuota, string $reason, ?int $adminId = null): Subscription
    {
        return DB::transaction(function () use ($subscription, $additionalQuota, $reason, $adminId) {
            $prevQuota = $subscription->remaining_message_quota;
            $newQuota = max(0, $prevQuota + $additionalQuota);

            $subscription->remaining_message_quota = $newQuota;
            $subscription->save();

            SubscriptionAudit::create([
                'subscription_id' => $subscription->id,
                'admin_user_id' => $adminId,
                'action' => 'TOPUP_QUOTA',
                'previous_value' => ['remaining_message_quota' => $prevQuota],
                'new_value' => ['remaining_message_quota' => $newQuota, 'added' => $additionalQuota],
                'reason' => $reason,
            ]);

            return $subscription;
        });
    }

    public function togglePause(Subscription $subscription, string $reason, ?int $adminId = null): Subscription
    {
        return DB::transaction(function () use ($subscription, $reason, $adminId) {
            $wasPaused = $subscription->paused_at !== null;

            if ($wasPaused) {
                // Resume: calculate freeze duration and shift ends_at
                $freezeDurationDays = (int) $subscription->paused_at->diffInDays(Carbon::now());
                $subscription->ends_at = $subscription->ends_at->addDays($freezeDurationDays);
                $subscription->paused_at = null;
                $subscription->status = 'active';
                $action = 'RESUME';
            } else {
                // Pause
                $subscription->paused_at = Carbon::now();
                $subscription->status = 'paused';
                $action = 'PAUSE';
            }

            $subscription->save();

            SubscriptionAudit::create([
                'subscription_id' => $subscription->id,
                'admin_user_id' => $adminId,
                'action' => $action,
                'previous_value' => ['paused_at' => $wasPaused ? $subscription->paused_at?->toIso8601String() : null],
                'new_value' => ['paused_at' => $subscription->paused_at?->toIso8601String()],
                'reason' => $reason,
            ]);

            return $subscription;
        });
    }

    public function getAllWithWorkspaces(): Collection
    {
        return Subscription::with(['workspace', 'plan', 'audits.admin'])
            ->orderByDesc('id')
            ->get();
    }
}
