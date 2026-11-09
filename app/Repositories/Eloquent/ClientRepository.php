<?php

namespace App\Repositories\Eloquent;

use App\Models\Workspace;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ClientRepository implements ClientRepositoryInterface
{
    public function getAllWithStats(int $perPage = 15, ?string $search = null, ?string $status = null): LengthAwarePaginator
    {
        $query = Workspace::with([
            'users',
            'subscription.plan',
            'devices',
        ])
            ->withCount(['devices', 'messages', 'contacts'])
            ->latest();

        if ($search) {
            $like = DB::connection()->getDriverName() === 'pgsql' ? 'ilike' : 'like';
            $query->where(function ($q) use ($search, $like) {
                $q->where('name', $like, "%{$search}%")
                    ->orWhere('slug', $like, "%{$search}%")
                    ->orWhere('phone', $like, "%{$search}%")
                    ->orWhereHas('users', function ($uq) use ($search, $like) {
                        $uq->where('name', $like, "%{$search}%")
                            ->orWhere('email', $like, "%{$search}%");
                    });
            });
        }

        if ($status === 'active') {
            $query->where('is_active', true);
        } elseif ($status === 'suspended') {
            $query->where('is_active', false);
        }

        return $query->paginate($perPage);
    }

    public function findById(int $id): ?Workspace
    {
        return Workspace::with([
            'users',
            'subscription.plan',
            'devices',
            'apiKeys',
            'webhooks',
        ])
            ->withCount(['devices', 'messages', 'contacts'])
            ->find($id);
    }

    public function toggleWorkspaceStatus(Workspace $workspace): Workspace
    {
        $workspace->update([
            'is_active' => ! $workspace->is_active,
        ]);

        return $workspace->fresh();
    }

    public function getTotalCount(): int
    {
        return Workspace::count();
    }

    public function getActiveCount(): int
    {
        return Workspace::where('is_active', true)->count();
    }
}
