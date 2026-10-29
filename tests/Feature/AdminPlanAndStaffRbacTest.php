<?php

namespace Tests\Feature;

use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminPlanAndStaffRbacTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;

    protected User $adminStaff;

    protected User $marketingStaff;

    protected User $supportStaff;

    protected User $regularClient;

    protected Workspace $workspace;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'PT Mardira Test',
            'slug' => 'pt-mardira-test',
            'phone' => '+6281234567890',
            'is_active' => true,
        ]);

        $this->superAdmin = User::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@kirimwa.pro',
            'password' => bcrypt('password'),
            'role' => 'superadmin',
            'is_active' => true,
        ]);

        $this->adminStaff = User::create([
            'name' => 'Admin Operasional',
            'email' => 'admin@kirimwa.pro',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->marketingStaff = User::create([
            'name' => 'Marketing Officer',
            'email' => 'marketing@kirimwa.pro',
            'password' => bcrypt('password'),
            'role' => 'marketing',
            'is_active' => true,
        ]);

        $this->supportStaff = User::create([
            'name' => 'Support Agent',
            'email' => 'support@kirimwa.pro',
            'password' => bcrypt('password'),
            'role' => 'support',
            'is_active' => true,
        ]);

        $this->regularClient = User::create([
            'name' => 'Client User',
            'email' => 'client@kirimwa.pro',
            'password' => bcrypt('password'),
            'role' => 'client',
            'is_active' => true,
            'workspace_id' => $this->workspace->id,
        ]);
    }

    // ==========================================
    // 1. Plan Management Tests
    // ==========================================

    public function test_superadmin_and_marketing_can_view_plans_list(): void
    {
        $this->actingAs($this->superAdmin)->get('/admin/plans')->assertStatus(200);
        $this->actingAs($this->adminStaff)->get('/admin/plans')->assertStatus(200);
        $this->actingAs($this->marketingStaff)->get('/admin/plans')->assertStatus(200);
    }

    public function test_support_and_regular_client_are_forbidden_from_plans(): void
    {
        $this->actingAs($this->supportStaff)->get('/admin/plans')->assertStatus(403);
        $this->actingAs($this->regularClient)->get('/admin/plans')->assertStatus(403);
    }

    public function test_superadmin_can_create_new_plan_and_cache_is_cleared(): void
    {
        Cache::put('public_plans', ['dummy_plan'], 3600);

        $payload = [
            'name' => 'Startup Booster',
            'slug' => 'startup-booster',
            'price_monthly' => 129000,
            'price_annually' => 1290000,
            'max_devices' => 2,
            'monthly_message_quota' => 10000,
            'daily_broadcast_limit' => 2000,
            'api_rate_limit_per_minute' => 45,
            'spintax_enabled' => true,
            'auto_reply' => true,
            'webhook_access' => true,
            'schedule_broadcast' => true,
            'multi_agent' => false,
            'ai_bot' => false,
            'is_active' => true,
        ];

        $response = $this->actingAs($this->superAdmin)->post('/admin/plans', $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('plans', [
            'slug' => 'startup-booster',
            'price_monthly' => 129000,
        ]);

        $this->assertNull(Cache::get('public_plans'));
    }

    public function test_superadmin_can_update_existing_plan(): void
    {
        $plan = Plan::create([
            'name' => 'Old Plan Name',
            'slug' => 'old-plan',
            'price_monthly' => 80000,
            'price_annually' => 800000,
            'limits' => ['max_devices' => 1, 'monthly_message_quota' => 2000, 'daily_broadcast_limit' => 500, 'api_rate_limit_per_minute' => 20],
            'features' => ['spintax_enabled' => false],
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)->put("/admin/plans/{$plan->id}", [
            'name' => 'New Plan Name',
            'slug' => 'new-plan',
            'price_monthly' => 95000,
            'price_annually' => 950000,
            'max_devices' => 2,
            'monthly_message_quota' => 4000,
            'daily_broadcast_limit' => 1000,
            'api_rate_limit_per_minute' => 30,
            'spintax_enabled' => true,
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $this->assertEquals('New Plan Name', $plan->fresh()->name);
        $this->assertEquals(95000, (int) $plan->fresh()->price_monthly);
    }

    public function test_superadmin_can_toggle_plan_status(): void
    {
        $plan = Plan::create([
            'name' => 'Toggle Test Plan',
            'slug' => 'toggle-test',
            'price_monthly' => 50000,
            'price_annually' => 500000,
            'limits' => ['max_devices' => 1, 'monthly_message_quota' => 1000, 'daily_broadcast_limit' => 500, 'api_rate_limit_per_minute' => 10],
            'features' => [],
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)->post("/admin/plans/{$plan->id}/toggle-status");
        $response->assertRedirect();
        $this->assertFalse($plan->fresh()->is_active);

        $response2 = $this->actingAs($this->superAdmin)->post("/admin/plans/{$plan->id}/toggle-status");
        $response2->assertRedirect();
        $this->assertTrue($plan->fresh()->is_active);
    }

    public function test_plan_with_active_subscriptions_cannot_be_deleted(): void
    {
        $plan = Plan::create([
            'name' => 'In-Use Plan',
            'slug' => 'in-use-plan',
            'price_monthly' => 150000,
            'price_annually' => 1500000,
            'limits' => ['max_devices' => 3, 'monthly_message_quota' => 15000, 'daily_broadcast_limit' => 2000, 'api_rate_limit_per_minute' => 50],
            'features' => [],
            'is_active' => true,
        ]);

        Subscription::create([
            'workspace_id' => $this->workspace->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'monthly_message_quota' => 15000,
            'remaining_message_quota' => 15000,
        ]);

        $response = $this->actingAs($this->superAdmin)->delete("/admin/plans/{$plan->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('plans', ['id' => $plan->id]);
    }

    public function test_unused_plan_can_be_deleted(): void
    {
        $plan = Plan::create([
            'name' => 'Unused Plan',
            'slug' => 'unused-plan',
            'price_monthly' => 50000,
            'price_annually' => 500000,
            'limits' => ['max_devices' => 1, 'monthly_message_quota' => 1000, 'daily_broadcast_limit' => 500, 'api_rate_limit_per_minute' => 10],
            'features' => [],
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->superAdmin)->delete("/admin/plans/{$plan->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('plans', ['id' => $plan->id]);
    }

    // ==========================================
    // 2. Staff Management & RBAC Tests
    // ==========================================

    public function test_only_superadmin_can_access_staff_management(): void
    {
        $this->actingAs($this->superAdmin)->get('/admin/staff')->assertStatus(200);

        // All non-superadmin users get 403
        $this->actingAs($this->adminStaff)->get('/admin/staff')->assertStatus(403);
        $this->actingAs($this->marketingStaff)->get('/admin/staff')->assertStatus(403);
        $this->actingAs($this->supportStaff)->get('/admin/staff')->assertStatus(403);
        $this->actingAs($this->regularClient)->get('/admin/staff')->assertStatus(403);
    }

    public function test_superadmin_can_create_staff_with_allowed_roles(): void
    {
        $payload = [
            'name' => 'Staff Marketing Baru',
            'email' => 'newmarketing@kirimwa.pro',
            'phone' => '+628111222333',
            'role' => 'marketing',
            'password' => 'secret12345',
            'password_confirmation' => 'secret12345',
        ];

        $response = $this->actingAs($this->superAdmin)->post('/admin/staff', $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'email' => 'newmarketing@kirimwa.pro',
            'role' => 'marketing',
            'is_active' => true,
        ]);
    }

    public function test_superadmin_role_cannot_be_created_via_rbac_form(): void
    {
        $payload = [
            'name' => 'Fake Super Admin',
            'email' => 'fake_superadmin@kirimwa.pro',
            'role' => 'superadmin',
            'password' => 'secret12345',
            'password_confirmation' => 'secret12345',
        ];

        $response = $this->actingAs($this->superAdmin)->post('/admin/staff', $payload);

        $response->assertSessionHasErrors(['role']);
        $this->assertDatabaseMissing('users', ['email' => 'fake_superadmin@kirimwa.pro']);
    }

    public function test_superadmin_cannot_be_deleted(): void
    {
        $response = $this->actingAs($this->superAdmin)->delete("/admin/staff/{$this->superAdmin->id}");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertDatabaseHas('users', ['id' => $this->superAdmin->id]);
    }

    public function test_superadmin_cannot_be_deactivated(): void
    {
        $response = $this->actingAs($this->superAdmin)->post("/admin/staff/{$this->superAdmin->id}/toggle-status");

        $response->assertRedirect();
        $response->assertSessionHas('error');
        $this->assertTrue($this->superAdmin->fresh()->is_active);
    }

    public function test_superadmin_can_toggle_and_delete_other_staff(): void
    {
        $staff = User::create([
            'name' => 'Staff To Delete',
            'email' => 'delete_me@kirimwa.pro',
            'password' => bcrypt('password'),
            'role' => 'support',
            'is_active' => true,
        ]);

        // Toggle status
        $toggleResp = $this->actingAs($this->superAdmin)->post("/admin/staff/{$staff->id}/toggle-status");
        $toggleResp->assertRedirect();
        $this->assertFalse($staff->fresh()->is_active);

        // Delete
        $deleteResp = $this->actingAs($this->superAdmin)->delete("/admin/staff/{$staff->id}");
        $deleteResp->assertRedirect();
        $deleteResp->assertSessionHas('success');
        $this->assertDatabaseMissing('users', ['id' => $staff->id]);
    }

    public function test_marketing_cannot_access_gateways_or_settings(): void
    {
        $this->actingAs($this->marketingStaff)->get('/admin/gateways')->assertStatus(403);
        $this->actingAs($this->marketingStaff)->get('/admin/settings')->assertStatus(403);
    }

    public function test_support_can_access_gateways_but_not_payments(): void
    {
        $this->actingAs($this->supportStaff)->get('/admin/gateways')->assertStatus(200);
        $this->actingAs($this->supportStaff)->get('/admin/payments')->assertStatus(403);
    }
}
