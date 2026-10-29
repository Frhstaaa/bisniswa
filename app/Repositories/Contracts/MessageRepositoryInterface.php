<?php

namespace App\Repositories\Contracts;

use App\Models\Message;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface MessageRepositoryInterface
{
    public function getRecentByWorkspace(int $workspaceId, int $limit = 10): Collection;

    public function paginateByWorkspace(int $workspaceId, int $perPage = 20): LengthAwarePaginator;

    public function create(array $data): Message;

    public function getTodaySentCount(int $workspaceId): int;
}
