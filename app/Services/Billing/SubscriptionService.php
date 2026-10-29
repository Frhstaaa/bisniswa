<?php

namespace App\Services\Billing;

use App\Models\Subscription;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class SubscriptionService
{
    public function __construct(
        protected SubscriptionRepositoryInterface $subscriptionRepo
    ) {}

    public function adjustDuration(int $subscriptionId, int $days, string $reason, ?int $adminId = null): Subscription
    {
        $subscription = $this->subscriptionRepo->findById($subscriptionId);
        if (! $subscription) {
            throw ValidationException::withMessages(['subscription' => 'Subscription tidak ditemukan.']);
        }

        return $this->subscriptionRepo->extendDuration($subscription, $days, $reason, $adminId);
    }

    public function setCustomDates(int $subscriptionId, string $startDate, string $endDate, string $reason, ?int $adminId = null): Subscription
    {
        $subscription = $this->subscriptionRepo->findById($subscriptionId);
        if (! $subscription) {
            throw ValidationException::withMessages(['subscription' => 'Subscription tidak ditemukan.']);
        }

        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        if ($end->lessThan($start)) {
            throw ValidationException::withMessages(['end_date' => 'Tanggal berakhir tidak boleh mendahului tanggal mulai.']);
        }

        return $this->subscriptionRepo->setCustomDates($subscription, $start, $end, $reason, $adminId);
    }

    public function topupQuota(int $subscriptionId, int $additionalQuota, string $reason, ?int $adminId = null): Subscription
    {
        $subscription = $this->subscriptionRepo->findById($subscriptionId);
        if (! $subscription) {
            throw ValidationException::withMessages(['subscription' => 'Subscription tidak ditemukan.']);
        }

        return $this->subscriptionRepo->topupQuota($subscription, $additionalQuota, $reason, $adminId);
    }

    public function togglePause(int $subscriptionId, string $reason, ?int $adminId = null): Subscription
    {
        $subscription = $this->subscriptionRepo->findById($subscriptionId);
        if (! $subscription) {
            throw ValidationException::withMessages(['subscription' => 'Subscription tidak ditemukan.']);
        }

        return $this->subscriptionRepo->togglePause($subscription, $reason, $adminId);
    }

    public function canSend(int $workspaceId): bool
    {
        $subscription = $this->subscriptionRepo->findByWorkspaceId($workspaceId);
        if (! $subscription) {
            return false;
        }

        // Check if paused
        if ($subscription->paused_at !== null) {
            return false;
        }

        // Check quota
        if ($subscription->remaining_message_quota <= 0) {
            return false;
        }

        // Check if active or in grace period
        if (! $subscription->isExpired()) {
            return true;
        }

        return $subscription->isInGracePeriod();
    }
}
