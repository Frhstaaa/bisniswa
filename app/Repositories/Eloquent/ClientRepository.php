<?php

namespace App\Repositories\Eloquent;

use App\Models\Workspace;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

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
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('slug', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%")
                    ->orWhereHas('users', function ($uq) use ($search) {
                        $uq->where('name', 'ilike', "%{$search}%")
                            ->orWhere('email', 'ilike', "%{$search}%");
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
