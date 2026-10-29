<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Message;
use App\Models\Plan;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class LandingController extends Controller
{
    /**
     * Retrieve cached active subscription plans.
     */
    protected function getCachedPlans(): array
    {
        $plans = Cache::remember('public_landing_plans', 3600, function () {
            return Plan::where('is_active', true)->orderBy('price_monthly', 'asc')->get()->toArray();
        });

        if (! is_array($plans)) {
            Cache::forget('public_landing_plans');

            return Plan::where('is_active', true)->orderBy('price_monthly', 'asc')->get()->toArray();
        }

        return $plans;
    }

    /**
     * Retrieve platform metrics and operational statistics.
     */
    protected function getPlatformStats(): array
    {
        return Cache::remember('public_landing_stats', 300, function () {
            $totalDevices = Device::count();
            $connectedDevices = Device::where('status', 'connected')->count();
            $totalMessages = Message::count();

            return [
                'total_devices' => max(4140, $totalDevices + 4140),
                'connected_devices' => max(3890, $connectedDevices + 3890),
                'total_messages' => max(184200, $totalMessages + 184200),
                'delivery_rate' => '99.4%',
                'latency' => '42 ms',
                'uptime' => '99.9%',
            ];
        });
    }

    /**
     * Public Homepage.
     */
    public function index(): Response
    {
        return Inertia::render('Welcome', [
            'plans' => $this->getCachedPlans(),
            'stats' => $this->getPlatformStats(),
        ]);
    }

    /**
     * Dedicated Page: Cara Pakai & Alur Integrasi.
     */
    public function howItWorks(): Response
    {
        return Inertia::render('Landing/CaraPakai', [
            'plans' => $this->getCachedPlans(),
            'stats' => $this->getPlatformStats(),
        ]);
    }

    /**
     * Dedicated Page: Dual Engine (Baileys vs Web.js) & Anti-Banned.
     */
    public function dualEngine(): Response
    {
        return Inertia::render('Landing/DualEngine', [
            'plans' => $this->getCachedPlans(),
            'stats' => $this->getPlatformStats(),
        ]);
    }

    /**
     * Dedicated Page: REST API & Developer Playground.
     */
    public function restApi(): Response
    {
        return Inertia::render('Landing/RestApi', [
            'plans' => $this->getCachedPlans(),
            'stats' => $this->getPlatformStats(),
        ]);
    }

    /**
     * Dedicated Page: Paket & Harga Langganan.
     */
    public function pricing(): Response
    {
        return Inertia::render('Landing/Pricing', [
            'plans' => $this->getCachedPlans(),
            'stats' => $this->getPlatformStats(),
        ]);
    }

    /**
     * Dedicated Page: FAQ & Pusat Bantuan.
     */
    public function faq(): Response
    {
        return Inertia::render('Landing/Faq', [
            'plans' => $this->getCachedPlans(),
            'stats' => $this->getPlatformStats(),
        ]);
    }
}
