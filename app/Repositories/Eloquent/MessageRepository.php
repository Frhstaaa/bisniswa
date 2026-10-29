<?php

namespace App\Repositories\Eloquent;

use App\Models\Message;
use App\Repositories\Contracts\MessageRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class MessageRepository implements MessageRepositoryInterface
{
    public function getRecentByWorkspace(int $workspaceId, int $limit = 10): Collection
    {
        return Message::with('device')
            ->where('workspace_id', $workspaceId)
            ->latest('id')
            ->take($limit)
            ->get();
    }

    public function paginateByWorkspace(int $workspaceId, int $perPage = 20): LengthAwarePaginator
    {
        return Message::with('device')
            ->where('workspace_id', $workspaceId)
            ->latest('id')
            ->paginate($perPage);
    }

    public function create(array $data): Message
    {
        return Message::create($data);
    }

    public function getTodaySentCount(int $workspaceId): int
    {
        return Message::where('workspace_id', $workspaceId)
            ->whereDate('created_at', today())
            ->whereIn('status', ['sent', 'delivered', 'read'])
            ->count();
    }
}
