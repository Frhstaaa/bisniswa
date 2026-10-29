<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subscription;
use App\Models\SubscriptionAudit;
use App\Services\Billing\SubscriptionService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminSubscriptionController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService
    ) {}

    public function index(): Response
    {
        $subscriptions = Subscription::with(['workspace', 'plan'])
            ->latest()
            ->paginate(15);

        $audits = SubscriptionAudit::with(['subscription.workspace', 'adminUser'])
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Admin/Subscriptions/Index', [
            'subscriptions' => $subscriptions,
            'audits' => $audits,
        ]);
    }

    public function adjustDuration(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
            'days' => 'required|integer',
            'reason' => 'required|string|min:3',
        ]);

        $adminId = $request->user()?->id;

        $this->subscriptionService->adjustDuration(
            (int) $validated['subscription_id'],
            (int) $validated['days'],
            $validated['reason'],
            $adminId
        );

        return back()->with('success', 'Masa aktif langganan berhasil disesuaikan.');
    }

    public function setCustomDates(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
            'reason' => 'required|string|min:3',
        ]);

        $adminId = $request->user()?->id;

        $this->subscriptionService->setCustomDates(
            (int) $validated['subscription_id'],
            Carbon::parse($validated['starts_at']),
            Carbon::parse($validated['ends_at']),
            $validated['reason'],
            $adminId
        );

        return back()->with('success', 'Rentang tanggal custom langganan berhasil diperbarui.');
    }

    public function topupQuota(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
            'additional_quota' => 'required|integer|min:100',
            'reason' => 'required|string|min:3',
        ]);

        $adminId = $request->user()?->id;

        $this->subscriptionService->topupQuota(
            (int) $validated['subscription_id'],
            (int) $validated['additional_quota'],
            $validated['reason'],
            $adminId
        );

        return back()->with('success', 'Penambahan kuota pesan berhasil dialokasikan.');
    }

    public function togglePause(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subscription_id' => 'required|exists:subscriptions,id',
            'reason' => 'required|string|min:3',
        ]);

        $adminId = $request->user()?->id;

        $this->subscriptionService->togglePause(
            (int) $validated['subscription_id'],
            $validated['reason'],
            $adminId
        );

        return back()->with('success', 'Status jeda (pause/resume) langganan berhasil diubah.');
    }
}
