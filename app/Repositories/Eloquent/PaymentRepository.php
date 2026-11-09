<?php

namespace App\Repositories\Eloquent;

use App\Models\Payment;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PaymentRepository implements PaymentRepositoryInterface
{
    public function getAllPaginated(int $perPage = 15, ?string $status = null, ?string $search = null): LengthAwarePaginator
    {
        $query = Payment::with(['workspace', 'subscription.plan', 'plan'])
            ->latest();

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        if ($search) {
            $like = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('invoice_number', $like, "%{$search}%")
                    ->orWhereHas('workspace', function ($wq) use ($search, $like) {
                        $wq->where('name', $like, "%{$search}%");
                    });
            });
        }

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?Payment
    {
        return Payment::with(['workspace', 'subscription.plan', 'plan'])->find($id);
    }

    public function recordPayment(array $data): Payment
    {
        return Payment::create($data);
    }

    public function markAsPaid(Payment $payment, ?string $notes = null): Payment
    {
        $payment->update([
            'status' => 'paid',
            'paid_at' => now(),
            'notes' => $notes ?? $payment->notes,
        ]);

        return $payment->fresh();
    }

    public function getTotalRevenue(): float
    {
        return (float) Payment::where('status', 'paid')->sum('amount');
    }

    public function getRecentPayments(int $limit = 5): Collection
    {
        return Payment::with(['workspace', 'plan'])
            ->latest()
            ->limit($limit)
            ->get();
    }
}
