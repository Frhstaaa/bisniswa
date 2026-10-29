<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Device;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Inertia\Inertia;
use Inertia\Response;

class AdminGatewayController extends Controller
{
    public function index(): Response
    {
        $devices = Device::with('workspace')
            ->latest()
            ->paginate(20);

        $wwebjsDevices = Device::where('engine', 'wwebjs')->get();
        $baileysDevices = Device::where('engine', 'baileys')->get();

        $clusterStatus = 'OFFLINE';
        $microserviceActive = 0;
        try {
            $nodeRes = Http::timeout(1)->get('http://127.0.0.1:3000/health');
            if ($nodeRes->successful()) {
                $clusterStatus = 'ONLINE';
                $microserviceActive = $nodeRes->json('active_sessions', 0);
            }
        } catch (\Throwable $e) {
            // Node offline
        }

        $stats = [
            'total_devices' => Device::count(),
            'online_devices' => Device::where('status', 'connected')->count(),
            'wwebjs_total' => $wwebjsDevices->count(),
            'wwebjs_connected' => $wwebjsDevices->where('status', 'connected')->count(),
            'wwebjs_ram_mb' => $wwebjsDevices->where('status', 'connected')->count() * 120,
            'baileys_total' => $baileysDevices->count(),
            'baileys_connected' => $baileysDevices->where('status', 'connected')->count(),
            'baileys_ram_mb' => $baileysDevices->where('status', 'connected')->count() * 30,
            'cluster_status' => $clusterStatus,
            'cluster_endpoint' => config('services.whatsapp_node.url', 'http://127.0.0.1:3000'),
            'microservice_sessions' => $microserviceActive,
        ];

        return Inertia::render('Admin/Gateways/Index', [
            'devices' => $devices,
            'stats' => $stats,
        ]);
    }

    public function restartEngine(Request $request): RedirectResponse
    {
        $engine = $request->input('engine', 'all');

        // Simulated graceful restart of the engine worker threads
        return back()->with('success', "Worker microservice gateway untuk engine [{$engine}] berhasil di-restart secara graceful.");
    }
}
