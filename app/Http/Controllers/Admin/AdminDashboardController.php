<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\SuperAdminService;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function __construct(
        protected SuperAdminService $adminService
    ) {}

    public function index(): Response
    {
        $stats = $this->adminService->getOverviewStats();

        return Inertia::render('Admin/Dashboard', [
            'metrics' => $stats['metrics'],
            'engineHealth' => $stats['engine_health'],
            'recentPayments' => $stats['recent_payments'],
            'recentClients' => $stats['recent_clients'],
        ]);
    }
}
