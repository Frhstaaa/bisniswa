<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Workspace;
use App\Repositories\Contracts\PaymentRepositoryInterface;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminPaymentController extends Controller
{
    public function __construct(
        protected PaymentRepositoryInterface $paymentRepo,
        protected PaymentService $paymentService
    ) {}

    public function index(Request $request): Response
    {
        $status = $request->query('status');
        $search = $request->query('search');

        $payments = $this->paymentRepo->getAllPaginated(15, $status, $search);
        $totalRevenue = $this->paymentRepo->getTotalRevenue();
        $pendingCount = Payment::where('status', 'pending')->count();
        $paidCount = Payment::where('status', 'paid')->count();

        $workspaces = Workspace::select('id', 'name')->orderBy('name')->get();
        $plans = Plan::select('id', 'name', 'price_monthly')->get();

        return Inertia::render('Admin/Payments/Index', [
            'payments' => $payments,
            'filters' => [
                'status' => $status ?? 'all',
                'search' => $search,
            ],
            'stats' => [
                'total_revenue' => $totalRevenue,
                'pending_count' => $pendingCount,
                'paid_count' => $paidCount,
            ],
            'workspaces' => $workspaces,
            'plans' => $plans,
        ]);
    }

    public function approve(Request $request, int $id): RedirectResponse
    {
        $payment = Payment::findOrFail($id);
        $adminId = $request->user()?->id;

        $this->paymentService->approvePayment($payment, $adminId, 'Disetujui secara manual oleh Super Admin');

        return back()->with('success', "Invoice {$payment->invoice_number} berhasil dikonfirmasi lunas. Langganan klien telah aktif & kuota pesan telah ditambahkan.");
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'workspace_id' => 'required|exists:workspaces,id',
            'plan_id' => 'required|exists:plans,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'status' => 'required|in:pending,paid',
            'notes' => 'nullable|string',
        ]);

        $adminId = $request->user()?->id;
        $payment = $this->paymentService->createManualPayment($validated, $adminId);

        return back()->with('success', "Pembayaran baru dengan No. Invoice {$payment->invoice_number} berhasil dicatat.");
    }
}
