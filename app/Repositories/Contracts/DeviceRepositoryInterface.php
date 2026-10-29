<?php

namespace App\Repositories\Contracts;

use App\Models\Device;
use Illuminate\Database\Eloquent\Collection;

interface DeviceRepositoryInterface
{
    public function getByWorkspace(int $workspaceId): Collection;

    public function findById(int $id): ?Device;

    public function create(array $data): Device;

    public function updateStatus(Device $device, string $status, ?string $qr = null): Device;

    public function delete(Device $device): bool;
}
