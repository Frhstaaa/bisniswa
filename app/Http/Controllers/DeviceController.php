<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Subscription;
use App\Models\Workspace;
use App\Services\WhatsApp\WhatsAppGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    public function __construct(
        protected WhatsAppGatewayService $gatewayService
    ) {}

    protected function getWorkspace(Request $request): Workspace
    {
        return $request->user()?->workspace ?? Workspace::firstOrCreate(
            ['slug' => 'digital-sukses-mandiri'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'PT Digital Sukses Mandiri',
                'phone' => '+6281298430911',
                'is_active' => true,
            ]
        );
    }

    public function index(Request $request): Response
    {
        $workspace = $this->getWorkspace($request);

        $subscription = Subscription::with('plan')->where('workspace_id', $workspace->id)->first();
        $plan = $subscription?->plan;
        $maxDevices = (int) ($plan?->limits['max_devices'] ?? 1);

        $devices = Device::where('workspace_id', $workspace->id)
            ->withCount(['messages' => function ($q) {
                $q->whereDate('created_at', today());
            }])
            ->get();

        return Inertia::render('Devices/Index', [
            'workspace' => $workspace,
            'devices' => $devices,
            'subscription' => $subscription,
            'plan' => $plan,
            'maxDevices' => $maxDevices,
            'canAddDevice' => $devices->count() < $maxDevices,
        ]);
    }

    public function store(Request $request): RedirectResponse|JsonResponse
    {
        $workspace = $this->getWorkspace($request);

        $subscription = Subscription::with('plan')->where('workspace_id', $workspace->id)->first();
        $plan = $subscription?->plan;
        $maxDevices = (int) ($plan?->limits['max_devices'] ?? 1);

        $currentDevicesCount = Device::where('workspace_id', $workspace->id)->count();

        // Enforce max device limit for the subscription plan
        if ($currentDevicesCount >= $maxDevices) {
            $planName = $plan?->name ?? 'Starter Lite';
            $errorMessage = "Batas kuota perangkat untuk paket {$planName} ({$maxDevices} perangkat) telah tercapai. Harap upgrade ke paket Enterprise Pro untuk menambah hingga 5 perangkat WhatsApp.";

            if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->isJson())) {
                return response()->json([
                    'success' => false,
                    'message' => $errorMessage,
                    'error' => 'device_limit_reached',
                    'current_count' => $currentDevicesCount,
                    'max_devices' => $maxDevices,
                ], 422);
            }

            return redirect()->back()
                ->with('error', $errorMessage)
                ->withErrors(['device_limit' => $errorMessage]);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'engine' => 'required|in:wwebjs,baileys,cloud_api',
            'phone_number' => 'nullable|string|max:30',
            'meta_phone_number_id' => 'nullable|string|max:100',
            'meta_access_token' => 'nullable|string',
            'meta_waba_id' => 'nullable|string|max:100',
            'meta_verify_token' => 'nullable|string|max:100',
        ]);

        $status = $validated['engine'] === 'cloud_api' && ! empty($validated['meta_access_token'])
            ? 'connected'
            : 'initializing';

        $device = Device::create([
            'workspace_id' => $workspace->id,
            'name' => $validated['name'],
            'engine' => $validated['engine'],
            'phone_number' => $validated['phone_number'],
            'meta_phone_number_id' => $validated['meta_phone_number_id'] ?? null,
            'meta_access_token' => $validated['meta_access_token'] ?? null,
            'meta_waba_id' => $validated['meta_waba_id'] ?? null,
            'meta_verify_token' => $validated['meta_verify_token'] ?? null,
            'status' => $status,
        ]);

        // Request real WhatsApp session from Gateway or activate Cloud API
        $session = $this->gatewayService->initializeDeviceSession($device);

        if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->isJson())) {
            return response()->json([
                'success' => true,
                'device' => $device,
                'session' => $session,
            ]);
        }

        $engineLabel = match ($device->engine) {
            'cloud_api' => 'Meta WhatsApp Business Cloud API',
            'baileys' => 'Server 1 WhatsApp (Baileys)',
            default => 'Server 2 WhatsApp (Chromium)',
        };

        return redirect()->back()
            ->with('success', "Perangkat '{$device->name}' berhasil didaftarkan ({$engineLabel}).")
            ->with('created_device', [
                'id' => $device->id,
                'name' => $device->name,
                'engine' => $device->engine,
                'status' => $session['status'] ?? 'qr_ready',
                'qr' => $session['qr'] ?? null,
            ]);
    }

    /**
     * Live Polling Endpoint for QR Code & Connection Status
     */
    public function status(Request $request, int $id): JsonResponse
    {
        $workspace = $this->getWorkspace($request);
        $device = Device::where('workspace_id', $workspace->id)->findOrFail($id);

        $sessionStatus = $this->gatewayService->getSessionStatus($device);

        return response()->json([
            'status' => $sessionStatus['status'] ?? $device->status,
            'qr' => $sessionStatus['qr'] ?? $device->qr_code,
            'phone_number' => $sessionStatus['phone_number'] ?? $device->phone_number,
            'device_id' => $device->id,
            'engine' => $device->engine,
        ]);
    }

    public function simulateConnect(Request $request, int $id): RedirectResponse|JsonResponse
    {
        $workspace = $this->getWorkspace($request);
        $device = Device::where('workspace_id', $workspace->id)->findOrFail($id);

        $result = $this->gatewayService->connectDevice($device);

        if (! $request->header('X-Inertia') && ($request->wantsJson() || $request->isJson())) {
            return response()->json([
                'success' => true,
                'status' => 'connected',
                'device' => $device->fresh(),
            ]);
        }

        return redirect()->back()->with('success', "Perangkat {$device->name} berhasil terhubung ({$result['phone_number']}).");
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $device = Device::where('workspace_id', $workspace->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'nullable|string|max:100',
            'phone_number' => 'nullable|string|max:30',
            'engine' => 'nullable|in:wwebjs,baileys,cloud_api',
            'meta_phone_number_id' => 'nullable|string|max:100',
            'meta_access_token' => 'nullable|string',
            'meta_waba_id' => 'nullable|string|max:100',
            'meta_verify_token' => 'nullable|string|max:100',
            'battery_level' => 'nullable|integer|min:0|max:100',
            'use_cloud_mode' => 'nullable|boolean',
        ]);

        $updates = [];
        foreach (['name', 'phone_number', 'engine', 'meta_phone_number_id', 'meta_access_token', 'meta_waba_id', 'meta_verify_token'] as $field) {
            if ($request->has($field)) {
                $updates[$field] = $validated[$field];
            }
        }

        if ($request->has('engine') && $validated['engine'] === 'cloud_api') {
            $updates['status'] = ! empty($validated['meta_access_token'] ?? $device->meta_access_token) ? 'connected' : 'disconnected';
            $updates['qr_code'] = null;
        }

        if ($request->boolean('use_cloud_mode')) {
            $updates['battery_level'] = null;
        } elseif (array_key_exists('battery_level', $validated)) {
            $updates['battery_level'] = $validated['battery_level'];
        }

        if (! empty($updates)) {
            $device->update($updates);
        }

        return redirect()->back()->with('success', "Informasi perangkat '{$device->name}' berhasil diperbarui.");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $device = Device::where('workspace_id', $workspace->id)->findOrFail($id);

        $this->gatewayService->disconnectDevice($device);
        $device->delete();

        return redirect()->back()->with('success', 'Perangkat berhasil diputuskan dan dihapus.');
    }
}
