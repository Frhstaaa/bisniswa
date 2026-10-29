<?php

namespace App\Repositories\Contracts;

use App\Models\Payment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PaymentRepositoryInterface
{
    public function getAllPaginated(int $perPage = 15, ?string $status = null, ?string $search = null): LengthAwarePaginator;

    public function findById(int $id): ?Payment;

    public function recordPayment(array $data): Payment;

    public function markAsPaid(Payment $payment, ?string $notes = null): Payment;

    public function getTotalRevenue(): float;

    public function getRecentPayments(int $limit = 5): Collection;
}
