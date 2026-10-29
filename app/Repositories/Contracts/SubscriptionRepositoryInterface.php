<?php

namespace App\Repositories\Contracts;

use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;

interface SubscriptionRepositoryInterface
{
    public function findByWorkspaceId(int $workspaceId): ?Subscription;

    public function findById(int $id): ?Subscription;

    public function extendDuration(Subscription $subscription, int $days, string $reason, ?int $adminId = null): Subscription;

    public function setCustomDates(Subscription $subscription, Carbon $startDate, Carbon $endDate, string $reason, ?int $adminId = null): Subscription;

    public function topupQuota(Subscription $subscription, int $additionalQuota, string $reason, ?int $adminId = null): Subscription;

    public function togglePause(Subscription $subscription, string $reason, ?int $adminId = null): Subscription;

    public function getAllWithWorkspaces(): Collection;
}
