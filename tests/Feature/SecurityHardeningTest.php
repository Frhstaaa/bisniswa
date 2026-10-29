<?php

namespace Tests\Feature;

use App\Models\ContactGroup;
use App\Models\Device;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspaceA;

    protected Workspace $workspaceB;

    protected User $userA;

    protected User $userB;

    protected Device $deviceB;

    protected Subscription $subscriptionA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspaceA = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Workspace A',
            'slug' => 'workspace-a',
            'is_active' => true,
        ]);

        $this->workspaceB = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Workspace B',
            'slug' => 'workspace-b',
            'is_active' => true,
        ]);

        $this->userA = User::factory()->create([
            'workspace_id' => $this->workspaceA->id,
            'role' => 'client',
            'email' => 'clienta@test.com',
        ]);

        $this->userB = User::factory()->create([
            'workspace_id' => $this->workspaceB->id,
            'role' => 'client',
            'email' => 'clientb@test.com',
        ]);

        $this->deviceB = Device::create([
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Device B',
            'engine' => 'wwebjs',
            'status' => 'connected',
            'phone_number' => '+6281987654321',
        ]);

        $plan = Plan::create([
            'name' => 'Enterprise Pro',
            'slug' => 'enterprise-pro',
            'price_monthly' => 299000,
            'price_annually' => 2890000,
            'limits' => ['max_devices' => 5],
            'features' => ['webhook_access' => true],
        ]);

        $this->subscriptionA = Subscription::create([
            'workspace_id' => $this->workspaceA->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'monthly_message_quota' => 5000,
            'remaining_message_quota' => 5000,
        ]);
    }

    public function test_regular_client_cannot_tamper_with_subscription_quota(): void
    {
        $this->actingAs($this->userA);

        $response = $this->post('/subscriptions/topup-quota', [
            'subscription_id' => $this->subscriptionA->id,
            'additional_quota' => 100000,
            'reason' => 'Free quota attempt',
        ]);

        $response->assertStatus(403);
    }

    public function test_client_cannot_broadcast_using_another_workspaces_device(): void
    {
        $this->actingAs($this->userA);

        $response = $this->post('/broadcast', [
            'name' => 'Cross-Tenant Exploit Campaign',
            'device_id' => $this->deviceB->id, // Belongs to workspaceB!
            'message' => 'Spam message',
            'target_type' => 'manual',
            'recipients_raw' => '+6281234567890',
            'min_delay' => 8,
            'max_delay' => 18,
            'schedule_option' => 'now',
        ]);

        $response->assertSessionHasErrors(['device_id']);
    }

    public function test_client_cannot_view_another_workspaces_invoice(): void
    {
        $paymentB = Payment::create([
            'workspace_id' => $this->workspaceB->id,
            'plan_id' => 1,
            'invoice_number' => 'INV-SECRET99',
            'amount' => 500000,
            'payment_method' => 'bank_transfer',
            'status' => 'pending',
        ]);

        $this->actingAs($this->userA);

        $response = $this->get("/subscriptions/invoice/{$paymentB->invoice_number}");
        $response->assertStatus(404);
    }

    public function test_client_cannot_link_contact_to_another_workspaces_group(): void
    {
        $groupB = ContactGroup::create([
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Private Group B',
        ]);

        $this->actingAs($this->userA);

        $response = $this->post('/contacts', [
            'name' => 'Intruder Contact',
            'phone' => '+6281234567899',
            'group_id' => $groupB->id,
        ]);

        $response->assertSessionHasErrors(['group_id']);
    }

    public function test_ssrf_media_url_is_rejected(): void
    {
        $this->actingAs($this->userA);

        // Attempt SSRF against local loopback
        $response = $this->post('/inbox/send', [
            'phone' => '+6281234567890',
            'message' => 'SSRF test message',
            'media_url' => 'http://127.0.0.1:8001/admin/dashboard',
        ]);

        $response->assertSessionHasErrors(['media_url']);
    }

    public function test_ssrf_cloud_metadata_and_ipv6_loopback_are_rejected(): void
    {
        $this->actingAs($this->userA);

        $cloudResponse = $this->post('/inbox/send', [
            'phone' => '+6281234567890',
            'message' => 'SSRF test message',
            'media_url' => 'http://169.254.169.254/latest/meta-data/',
        ]);
        $cloudResponse->assertSessionHasErrors(['media_url']);

        $ipv6Response = $this->post('/inbox/send', [
            'phone' => '+6281234567890',
            'message' => 'SSRF test message',
            'media_url' => 'http://[::1]:8080/secret',
        ]);
        $ipv6Response->assertSessionHasErrors(['media_url']);
    }

    public function test_security_headers_are_present_and_x_powered_by_is_stripped(): void
    {
        $response = $this->get('/login');

        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $this->assertFalse($response->headers->has('X-Powered-By'));
    }

    public function test_malicious_cve_and_traversal_probes_are_blocked_with_400(): void
    {
        // CVE-2024-4577 probe
        $response = $this->call('GET', '/login?-d+allow_url_include=1');
        $response->assertStatus(400);

        // Path traversal probe
        $responseTraversal = $this->call('GET', '/login?file=../../../../etc/passwd');
        $responseTraversal->assertStatus(400);

        // Sensitive env file probe
        $responseEnv = $this->call('GET', '/.env');
        $responseEnv->assertStatus(400);
    }
}
