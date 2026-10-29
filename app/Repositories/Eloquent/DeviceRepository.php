<?php

namespace App\Repositories\Eloquent;

use App\Models\Device;
use App\Repositories\Contracts\DeviceRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class DeviceRepository implements DeviceRepositoryInterface
{
    public function getByWorkspace(int $workspaceId): Collection
    {
        return Device::where('workspace_id', $workspaceId)
            ->withCount(['messages' => function ($q) {
                $q->whereDate('created_at', today());
            }])
            ->orderBy('id')
            ->get();
    }

    public function findById(int $id): ?Device
    {
        return Device::find($id);
    }

    public function create(array $data): Device
    {
        return Device::create($data);
    }

    public function updateStatus(Device $device, string $status, ?string $qr = null): Device
    {
        $device->status = $status;
        if ($qr !== null) {
            $device->qr_code = $qr;
        }
        if ($status === 'connected') {
            $device->last_connected_at = now();
            $device->qr_code = null;
        }
        $device->save();

        return $device;
    }

    public function delete(Device $device): bool
    {
        return $device->delete();
    }
}
