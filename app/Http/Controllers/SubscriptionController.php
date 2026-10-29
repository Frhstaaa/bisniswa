<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\Workspace;
use App\Services\Billing\SubscriptionService;
use App\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class SubscriptionController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService,
        protected PaymentService $paymentService
    ) {}

    protected function getWorkspace(Request $request): Workspace
    {
        return $request->user()?->workspace ?? Workspace::firstOrCreate(
            ['slug' => 'digital-sukses-mandiri'],
            ['name' => 'PT Digital Sukses Mandiri', 'uuid' => (string) Str::uuid()]
        );
    }

    public function index(Request $request): Response
    {
        $workspace = $this->getWorkspace($request);

        $subscription = Subscription::with(['plan', 'audits.admin'])
            ->where('workspace_id', $workspace->id)
            ->first();

        $plans = Plan::where('is_active', true)->get();

        $payments = Payment::with('plan')
            ->where('workspace_id', $workspace->id)
            ->latest('id')
            ->limit(10)
            ->get();

        return Inertia::render('Subscriptions/Index', [
            'workspace' => $workspace,
            'subscription' => $subscription,
            'plans' => $plans,
            'payments' => $payments,
            'audits' => $subscription?->audits()->latest('id')->limit(10)->get() ?? [],
        ]);
    }

    public function checkout(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'payment_method' => 'required|in:qris,bca_va,bank_transfer',
        ]);

        $plan = Plan::findOrFail($validated['plan_id']);
        $invoiceNumber = 'INV-'.strtoupper(Str::random(8));

        $payment = Payment::create([
            'workspace_id' => $workspace->id,
            'plan_id' => $plan->id,
            'subscription_id' => $workspace->subscription?->id,
            'invoice_number' => $invoiceNumber,
            'amount' => $plan->price_monthly,
            'payment_method' => $validated['payment_method'],
            'status' => 'pending',
        ]);

        // If automated gateway (QRIS or Virtual Account), process instant approval
        if (in_array($validated['payment_method'], ['qris', 'bca_va'])) {
            $this->paymentService->approvePayment($payment, null, 'Otomatis terkonfirmasi via Payment Gateway Webhook');

            return redirect()->back()->with('success', "Pembayaran {$plan->name} via ".strtoupper(str_replace('_', ' ', $validated['payment_method'])).' berhasil! Kuota dan masa aktif Anda langsung diperpanjang.');
        }

        return redirect()->back()->with('success', "Invoice {$invoiceNumber} diterbitkan. Silakan unggah bukti transfer untuk verifikasi admin.");
    }

    public function adjustDuration(Request $request): RedirectResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            abort(403, 'Akses ditolak. Fitur penyesuaian langganan hanya untuk Super Administrator.');
        }

        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
            'days' => 'required|integer',
            'reason' => 'required|string|max:255',
        ]);

        $this->subscriptionService->adjustDuration(
            subscriptionId: $validated['subscription_id'],
            days: $validated['days'],
            reason: $validated['reason'],
            adminId: auth()->id()
        );

        return redirect()->back()->with('success', 'Masa aktif langganan berhasil disesuaikan.');
    }

    public function setCustomDates(Request $request): RedirectResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            abort(403, 'Akses ditolak. Fitur penyesuaian tanggal hanya untuk Super Administrator.');
        }

        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string|max:255',
        ]);

        $this->subscriptionService->setCustomDates(
            subscriptionId: $validated['subscription_id'],
            startDate: $validated['start_date'],
            endDate: $validated['end_date'],
            reason: $validated['reason'],
            adminId: auth()->id()
        );

        return redirect()->back()->with('success', 'Tanggal mulai dan berakhir langganan berhasil diperbarui.');
    }

    public function topupQuota(Request $request): RedirectResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            abort(403, 'Akses ditolak. Fitur penambahan bonus kuota hanya untuk Super Administrator.');
        }

        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
            'additional_quota' => 'required|integer|min:1',
            'reason' => 'required|string|max:255',
        ]);

        $this->subscriptionService->topupQuota(
            subscriptionId: $validated['subscription_id'],
            additionalQuota: $validated['additional_quota'],
            reason: $validated['reason'],
            adminId: auth()->id()
        );

        return redirect()->back()->with('success', 'Bonus kuota berhasil ditambahkan ke akun.');
    }

    public function togglePause(Request $request): RedirectResponse
    {
        if (! $request->user()?->isSuperAdmin()) {
            abort(403, 'Akses ditolak. Fitur pembekuan akun hanya untuk Super Administrator.');
        }

        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
            'reason' => 'required|string|max:255',
        ]);

        $this->subscriptionService->togglePause(
            subscriptionId: $validated['subscription_id'],
            reason: $validated['reason'],
            adminId: auth()->id()
        );

        return redirect()->back()->with('success', 'Status pembekuan langganan berhasil diubah.');
    }

    public function showInvoice(Request $request, string $invoice_number): Response
    {
        $workspace = $this->getWorkspace($request);
        $user = $request->user();

        $query = Payment::with(['plan', 'workspace'])
            ->where('invoice_number', $invoice_number);

        // IDOR Prevention: regular clients may only view their own workspace invoices
        if (! $user?->isSuperAdmin()) {
            $query->where('workspace_id', $workspace->id);
        }

        $payment = $query->firstOrFail();

        return Inertia::render('Subscriptions/Invoice', [
            'payment' => $payment,
            'workspace' => $payment->workspace,
        ]);
    }
}
