<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AdminPlanController extends Controller
{
    /**
     * Display a listing of all subscription packages / plans.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search', '');
        $statusFilter = $request->query('status', 'all');

        $query = Plan::withCount(['subscriptions as active_subscriptions_count' => function ($q) {
            $q->whereIn('status', ['active', 'grace_period']);
        }]);

        if (! empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('slug', 'ilike', "%{$search}%");
            });
        }

        if ($statusFilter === 'active') {
            $query->where('is_active', true);
        } elseif ($statusFilter === 'inactive') {
            $query->where('is_active', false);
        }

        $plans = $query->orderBy('price_monthly', 'asc')->get();

        $metrics = [
            'total_plans' => Plan::count(),
            'active_plans' => Plan::where('is_active', true)->count(),
            'inactive_plans' => Plan::where('is_active', false)->count(),
            'total_subscribers' => (int) Plan::withCount(['subscriptions' => function ($q) {
                $q->whereIn('status', ['active', 'grace_period']);
            }])->get()->sum('subscriptions_count'),
        ];

        return Inertia::render('Admin/Plans/Index', [
            'plans' => $plans,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search,
                'status' => $statusFilter,
            ],
        ]);
    }

    /**
     * Store a newly created plan in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:plans,slug',
            'price_monthly' => 'required|numeric|min:0',
            'price_annually' => 'required|numeric|min:0',
            'max_devices' => 'required|integer|min:1|max:100',
            'monthly_message_quota' => 'required|integer|min:100',
            'daily_broadcast_limit' => 'required|integer|min:50',
            'api_rate_limit_per_minute' => 'required|integer|min:5|max:1000',
            'spintax_enabled' => 'boolean',
            'auto_reply' => 'boolean',
            'webhook_access' => 'boolean',
            'schedule_broadcast' => 'boolean',
            'multi_agent' => 'boolean',
            'ai_bot' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : Str::slug($validated['name']);

        // Ensure unique slug
        $baseSlug = $slug;
        $counter = 1;
        while (Plan::where('slug', $slug)->exists()) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        $limits = [
            'max_devices' => (int) $validated['max_devices'],
            'monthly_message_quota' => (int) $validated['monthly_message_quota'],
            'daily_broadcast_limit' => (int) $validated['daily_broadcast_limit'],
            'api_rate_limit_per_minute' => (int) $validated['api_rate_limit_per_minute'],
        ];

        $features = [
            'spintax_enabled' => $request->boolean('spintax_enabled'),
            'auto_reply' => $request->boolean('auto_reply'),
            'webhook_access' => $request->boolean('webhook_access'),
            'schedule_broadcast' => $request->boolean('schedule_broadcast'),
            'multi_agent' => $request->boolean('multi_agent'),
            'ai_bot' => $request->boolean('ai_bot'),
        ];

        Plan::create([
            'name' => $validated['name'],
            'slug' => $slug,
            'price_monthly' => $validated['price_monthly'],
            'price_annually' => $validated['price_annually'],
            'limits' => $limits,
            'features' => $features,
            'is_active' => $request->boolean('is_active', true),
        ]);

        Cache::forget('public_plans');

        return back()->with('success', "Paket langganan '{$validated['name']}' berhasil ditambahkan.");
    }

    /**
     * Update the specified plan in storage.
     */
    public function update(Request $request, int $id): RedirectResponse
    {
        $plan = Plan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'nullable|string|max:100|unique:plans,slug,'.$plan->id,
            'price_monthly' => 'required|numeric|min:0',
            'price_annually' => 'required|numeric|min:0',
            'max_devices' => 'required|integer|min:1|max:100',
            'monthly_message_quota' => 'required|integer|min:100',
            'daily_broadcast_limit' => 'required|integer|min:50',
            'api_rate_limit_per_minute' => 'required|integer|min:5|max:1000',
            'spintax_enabled' => 'boolean',
            'auto_reply' => 'boolean',
            'webhook_access' => 'boolean',
            'schedule_broadcast' => 'boolean',
            'multi_agent' => 'boolean',
            'ai_bot' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $slug = ! empty($validated['slug'])
            ? Str::slug($validated['slug'])
            : $plan->slug;

        $limits = [
            'max_devices' => (int) $validated['max_devices'],
            'monthly_message_quota' => (int) $validated['monthly_message_quota'],
            'daily_broadcast_limit' => (int) $validated['daily_broadcast_limit'],
            'api_rate_limit_per_minute' => (int) $validated['api_rate_limit_per_minute'],
        ];

        $features = [
            'spintax_enabled' => $request->boolean('spintax_enabled'),
            'auto_reply' => $request->boolean('auto_reply'),
            'webhook_access' => $request->boolean('webhook_access'),
            'schedule_broadcast' => $request->boolean('schedule_broadcast'),
            'multi_agent' => $request->boolean('multi_agent'),
            'ai_bot' => $request->boolean('ai_bot'),
        ];

        $plan->update([
            'name' => $validated['name'],
            'slug' => $slug,
            'price_monthly' => $validated['price_monthly'],
            'price_annually' => $validated['price_annually'],
            'limits' => $limits,
            'features' => $features,
            'is_active' => $request->boolean('is_active'),
        ]);

        Cache::forget('public_plans');

        return back()->with('success', "Paket langganan '{$plan->name}' berhasil diperbarui.");
    }

    /**
     * Toggle active/inactive status of a plan.
     */
    public function toggleStatus(int $id): RedirectResponse
    {
        $plan = Plan::findOrFail($id);
        $plan->is_active = ! $plan->is_active;
        $plan->save();

        Cache::forget('public_plans');

        $statusStr = $plan->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Paket '{$plan->name}' berhasil {$statusStr}.");
    }

    /**
     * Remove the specified plan from storage.
     */
    public function destroy(int $id): RedirectResponse
    {
        $plan = Plan::findOrFail($id);

        $activeSubscriptions = $plan->subscriptions()
            ->whereIn('status', ['active', 'grace_period'])
            ->count();

        if ($activeSubscriptions > 0) {
            return back()->with('error', "Paket '{$plan->name}' tidak dapat dihapus karena masih digunakan oleh {$activeSubscriptions} pelanggan aktif. Silakan nonaktifkan paket jika tidak ingin dipublikasikan lagi.");
        }

        $planName = $plan->name;
        $plan->delete();

        Cache::forget('public_plans');

        return back()->with('success', "Paket langganan '{$planName}' berhasil dihapus.");
    }
}
