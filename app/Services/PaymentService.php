<?php

namespace App\Services;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionAudit;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Repositories\Contracts\SubscriptionRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Support\Str;

class PaymentService
{
    public function __construct(
        protected PaymentRepositoryInterface $paymentRepo,
        protected SubscriptionRepositoryInterface $subscriptionRepo
    ) {}

    /**
     * Approve and mark a payment as paid.
     * Automatically activates/extends the tenant's subscription and top-ups message quota.
     */
    public function approvePayment(Payment $payment, ?int $adminId = null, ?string $notes = null): Payment
    {
        $paidPayment = $this->paymentRepo->markAsPaid($payment, $notes);

        $workspace = $payment->workspace;
        $plan = $payment->plan ?? Plan::first();

        if ($workspace && $plan) {
            $subscription = $workspace->subscription;

            if ($subscription) {
                // Determine new end date
                $currentEnd = Carbon::parse($subscription->ends_at);
                $baseDate = $currentEnd->isPast() ? now() : $currentEnd;
                $newEndDate = $baseDate->copy()->addDays(30);

                $previousEnd = $subscription->ends_at;
                $previousQuota = $subscription->remaining_message_quota;

                $addedQuota = $plan->limits['monthly_message_quota'] ?? 5000;
                $newQuota = $subscription->remaining_message_quota + $addedQuota;

                $subscription->update([
                    'status' => 'active',
                    'ends_at' => $newEndDate,
                    'remaining_message_quota' => $newQuota,
                    'paused_at' => null,
                ]);

                // Create audit log
                SubscriptionAudit::create([
                    'subscription_id' => $subscription->id,
                    'admin_user_id' => $adminId,
                    'action' => 'PAYMENT_APPROVED',
                    'reason' => "Pembayaran Invoice {$payment->invoice_number} sebesar Rp ".number_format($payment->amount, 0, ',', '.').' disetujui.',
                    'previous_value' => [
                        'ends_at' => $previousEnd instanceof Carbon ? $previousEnd->toIso8601String() : $previousEnd,
                        'remaining_message_quota' => $previousQuota,
                        'status' => $subscription->getOriginal('status'),
                    ],
                    'new_value' => [
                        'ends_at' => $newEndDate->toIso8601String(),
                        'remaining_message_quota' => $newQuota,
                        'status' => 'active',
                    ],
                ]);
            } else {
                // Create brand new subscription
                $startsAt = now();
                $endsAt = now()->addDays(30);
                $quota = $plan->limits['monthly_message_quota'] ?? 5000;

                $newSubscription = Subscription::create([
                    'workspace_id' => $workspace->id,
                    'plan_id' => $plan->id,
                    'status' => 'active',
                    'starts_at' => $startsAt,
                    'ends_at' => $endsAt,
                    'grace_period_days' => 3,
                    'monthly_message_quota' => $quota,
                    'remaining_message_quota' => $quota,
                ]);

                SubscriptionAudit::create([
                    'subscription_id' => $newSubscription->id,
                    'admin_user_id' => $adminId,
                    'action' => 'PAYMENT_APPROVED_NEW_SUBSCRIPTION',
                    'reason' => "Aktivasi langganan baru via Invoice {$payment->invoice_number}.",
                    'previous_value' => [],
                    'new_value' => [
                        'ends_at' => $endsAt->toIso8601String(),
                        'remaining_message_quota' => $quota,
                        'status' => 'active',
                    ],
                ]);

                $paidPayment->update(['subscription_id' => $newSubscription->id]);
            }
        }

        return $paidPayment->fresh();
    }

    /**
     * Create a manual payment recorded by Super Admin.
     */
    public function createManualPayment(array $data, ?int $adminId = null): Payment
    {
        $invoiceNumber = 'INV-'.now()->format('Ymd').'-'.strtoupper(Str::random(5));

        $payment = $this->paymentRepo->recordPayment([
            'invoice_number' => $invoiceNumber,
            'workspace_id' => $data['workspace_id'],
            'subscription_id' => $data['subscription_id'] ?? null,
            'plan_id' => $data['plan_id'] ?? null,
            'amount' => $data['amount'],
            'payment_method' => $data['payment_method'] ?? 'manual_admin',
            'status' => $data['status'] ?? 'pending',
            'paid_at' => ($data['status'] ?? '') === 'paid' ? now() : null,
            'notes' => $data['notes'] ?? 'Dibuat secara manual oleh Super Admin',
        ]);

        if ($payment->status === 'paid') {
            $this->approvePayment($payment, $adminId, $payment->notes);
        }

        return $payment;
    }
}
