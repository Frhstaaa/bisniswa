<?php

namespace App\Repositories\Contracts;

use App\Models\Workspace;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface ClientRepositoryInterface
{
    public function getAllWithStats(int $perPage = 15, ?string $search = null, ?string $status = null): LengthAwarePaginator;

    public function findById(int $id): ?Workspace;

    public function toggleWorkspaceStatus(Workspace $workspace): Workspace;

    public function getTotalCount(): int;

    public function getActiveCount(): int;
}
