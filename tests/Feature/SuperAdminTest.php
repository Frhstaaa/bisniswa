<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SuperAdminTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $superAdmin;

    protected User $regularClient;

    protected Workspace $workspace;

    protected Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'PT Uji Mandiri',
            'slug' => 'pt-uji-mandiri',
            'phone' => '+6281234567890',
            'is_active' => true,
        ]);

        $this->superAdmin = Admin::create([
            'name' => 'Super Administrator',
            'email' => 'superadmin@kirimwa.pro',
            'password' => bcrypt('password'),
            'role' => 'superadmin',
            'is_active' => true,
        ]);

        $this->regularClient = User::create([
            'name' => 'Regular Client',
            'email' => 'client@kirimwa.pro',
            'password' => bcrypt('password'),
            'role' => 'client',
            'workspace_id' => $this->workspace->id,
        ]);

        $this->plan = Plan::create([
            'name' => 'Starter Lite',
            'slug' => 'starter-test',
            'price_monthly' => 99000,
            'price_annually' => 990000,
            'limits' => [
                'max_devices' => 1,
                'monthly_message_quota' => 5000,
            ],
            'features' => [
                'webhook_access' => false,
            ],
        ]);
    }

    public function test_guest_is_redirected_from_admin_dashboard(): void
    {
        $response = $this->get('/admin/dashboard');

        $response->assertRedirect('/admin/login');
    }

    public function test_regular_client_is_forbidden_from_admin_dashboard(): void
    {
        $response = $this->actingAs($this->regularClient)->get('/admin/dashboard');

        $response->assertRedirect('/admin/login');
    }

    public function test_super_admin_can_access_admin_dashboard(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')->get('/admin/dashboard');

        $response->assertStatus(200);
    }

    public function test_super_admin_can_view_and_toggle_client_workspace_status(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')->get('/admin/clients');
        $response->assertStatus(200);

        $this->assertTrue($this->workspace->is_active);

        $toggleResponse = $this->actingAs($this->superAdmin, 'admin')
            ->post("/admin/clients/{$this->workspace->id}/toggle-status");

        $toggleResponse->assertRedirect();
        $this->assertFalse($this->workspace->fresh()->is_active);
    }

    public function test_super_admin_can_approve_payment_and_auto_activate_subscription(): void
    {
        $payment = Payment::create([
            'invoice_number' => 'INV-TEST-001',
            'workspace_id' => $this->workspace->id,
            'plan_id' => $this->plan->id,
            'amount' => 99000,
            'payment_method' => 'bank_transfer',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->post("/admin/payments/{$payment->id}/approve");

        $response->assertRedirect();

        $this->assertEquals('paid', $payment->fresh()->status);
        $this->assertNotNull($this->workspace->fresh()->subscription);
        $this->assertEquals('active', $this->workspace->fresh()->subscription->status);
        $this->assertEquals(5000, $this->workspace->fresh()->subscription->remaining_message_quota);
    }

    public function test_super_admin_can_update_production_settings(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')->post('/admin/settings', [
            'settings' => [
                'platform_name' => 'MARDIRA WA Gateway Pro',
                'support_phone' => '+628999999999',
            ],
        ]);

        $response->assertRedirect();

        $this->assertEquals('MARDIRA WA Gateway Pro', SystemSetting::get('platform_name'));
        $this->assertEquals('+628999999999', SystemSetting::get('support_phone'));
    }

    public function test_super_admin_can_adjust_subscription_duration(): void
    {
        $sub = Subscription::create([
            'workspace_id' => $this->workspace->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'grace_period_days' => 3,
            'monthly_message_quota' => 5000,
            'remaining_message_quota' => 5000,
        ]);

        $response = $this->actingAs($this->superAdmin, 'admin')
            ->post('/admin/subscriptions/adjust-duration', [
                'subscription_id' => $sub->id,
                'days' => 15,
                'reason' => 'Perpanjangan promo pengujian unit test',
            ]);

        $response->assertRedirect();

        $this->assertGreaterThan(now()->addDays(40)->timestamp, $sub->fresh()->ends_at->timestamp);
    }

    public function test_super_admin_can_view_all_management_pages(): void
    {
        $this->actingAs($this->superAdmin, 'admin')->get('/admin/payments')->assertStatus(200);
        $this->actingAs($this->superAdmin, 'admin')->get('/admin/subscriptions')->assertStatus(200);
        $this->actingAs($this->superAdmin, 'admin')->get('/admin/gateways')->assertStatus(200);
        $this->actingAs($this->superAdmin, 'admin')->get('/admin/settings')->assertStatus(200);
    }

    public function test_super_admin_can_restart_gateways(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')
            ->post('/admin/gateways/restart', ['engine' => 'baileys']);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    public function test_super_admin_can_login_via_admin_login_page(): void
    {
        $response = $this->post('/admin/login', [
            'email' => 'superadmin@kirimwa.pro',
            'password' => 'password',
        ]);

        $response->assertRedirect('/admin/dashboard');
        $this->assertAuthenticated('admin');
    }

    public function test_super_admin_cannot_login_with_invalid_password(): void
    {
        $response = $this->post('/admin/login', [
            'email' => 'superadmin@kirimwa.pro',
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors(['email']);
        $this->assertGuest('admin');
    }

    public function test_super_admin_can_logout_via_admin_logout_route(): void
    {
        $response = $this->actingAs($this->superAdmin, 'admin')->post('/admin/logout');

        $response->assertRedirect('/admin/login');
        $this->assertGuest('admin');
    }

    public function test_tenant_user_cannot_login_via_admin_login_page(): void
    {
        $response = $this->post('/admin/login', [
            'email' => 'client@kirimwa.pro',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors(['email']);
        $this->assertGuest('admin');
    }

    public function test_admin_attempting_login_on_client_login_page_gets_guidance(): void
    {
        $response = $this->post('/login', [
            'email' => 'superadmin@kirimwa.pro',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors(['email']);
        $this->assertGuest('web');
    }
}
