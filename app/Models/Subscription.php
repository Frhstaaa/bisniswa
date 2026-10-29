<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'plan_id',
        'status',
        'starts_at',
        'ends_at',
        'grace_period_days',
        'paused_at',
        'monthly_message_quota',
        'remaining_message_quota',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'paused_at' => 'datetime',
            'grace_period_days' => 'integer',
            'monthly_message_quota' => 'integer',
            'remaining_message_quota' => 'integer',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function audits(): HasMany
    {
        return $this->hasMany(SubscriptionAudit::class);
    }

    public function isExpired(): bool
    {
        return $this->ends_at && Carbon::now()->greaterThan($this->ends_at);
    }

    public function isInGracePeriod(): bool
    {
        if (! $this->isExpired()) {
            return false;
        }

        $graceEnd = $this->ends_at->copy()->addDays($this->grace_period_days);

        return Carbon::now()->lessThanOrEqualTo($graceEnd);
    }

    public function daysRemaining(): int
    {
        if ($this->isExpired()) {
            return 0;
        }

        return max(0, (int) Carbon::now()->diffInDays($this->ends_at, false));
    }
}
