<?php

namespace Tests\Feature;

use App\Models\ApiKey;
use App\Models\Device;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class WhatsAppSaasTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;

    protected Subscription $subscription;

    protected Device $device;

    protected User $user;

    protected string $plainApiKey;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'PT Digital Sukses Mandiri',
            'slug' => 'digital-sukses-mandiri',
            'phone' => '+6281298430911',
        ]);

        $plan = Plan::create([
            'name' => 'Enterprise Pro',
            'slug' => 'enterprise-pro',
            'price_monthly' => 299000,
            'price_annually' => 2890000,
            'limits' => ['max_devices' => 5],
            'features' => ['webhook_access' => true],
        ]);

        $this->subscription = Subscription::create([
            'workspace_id' => $this->workspace->id,
            'plan_id' => $plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'grace_period_days' => 3,
            'monthly_message_quota' => 50000,
            'remaining_message_quota' => 50000,
        ]);

        $this->device = Device::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'CS Utama',
            'phone_number' => '+6281298430911',
            'engine' => 'wwebjs',
            'status' => 'connected',
        ]);

        $this->plainApiKey = 'bk_live_testkey12345678901234567890';
        ApiKey::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Backend Test Key',
            'key_hash' => hash('sha256', $this->plainApiKey),
            'prefix' => 'bk_live_',
            'scopes' => ['messages:send'],
        ]);

        $this->user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'role' => 'owner',
        ]);
        $this->actingAs($this->user);
    }

    public function test_dashboard_renders_successfully(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function test_devices_page_renders_successfully(): void
    {
        $response = $this->get('/devices');
        $response->assertStatus(200);
    }

    public function test_super_admin_can_adjust_subscription_duration(): void
    {
        $this->user->update(['role' => 'superadmin']);

        $response = $this->post('/subscriptions/adjust-duration', [
            'subscription_id' => $this->subscription->id,
            'days' => 15,
            'reason' => 'Perpanjangan promo kompensasi',
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('subscription_audits', [
            'subscription_id' => $this->subscription->id,
            'action' => 'EXTEND_DAYS',
            'reason' => 'Perpanjangan promo kompensasi',
        ]);
    }

    public function test_regular_user_cannot_adjust_subscription_duration(): void
    {
        // Ensure user is regular owner, not superadmin
        $this->user->update(['role' => 'owner']);

        $response = $this->post('/subscriptions/adjust-duration', [
            'subscription_id' => $this->subscription->id,
            'days' => 30,
            'reason' => 'Mencoba tambah hari sendiri',
        ]);

        $response->assertStatus(403);
    }

    public function test_client_app_can_send_message_via_rest_api(): void
    {
        Http::fake([
            '*/messages/send' => Http::response([
                'success' => true,
                'message_id' => 'MSG_TEST_SAAS',
                'status' => 'delivered',
            ], 200),
        ]);

        $response = $this->withHeader('Authorization', 'Bearer '.$this->plainApiKey)
            ->postJson('/api/v1/messages/send', [
                'phone' => '+6281234567890',
                'message' => 'Halo! Ini pesan uji coba dari API.',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => true,
                'data' => [
                    'recipient' => '+6281234567890',
                    'engine' => 'wwebjs',
                ],
            ]);

        $this->assertDatabaseHas('messages', [
            'receiver_number' => '+6281234567890',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_device_creation_initializes_session(): void
    {
        $response = $this->postJson('/devices', [
            'name' => 'CS WhatsApp Live',
            'engine' => 'wwebjs',
            'phone_number' => '+6281299998888',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'device' => [
                    'name' => 'CS WhatsApp Live',
                    'engine' => 'wwebjs',
                ],
            ]);

        $this->assertDatabaseHas('devices', [
            'name' => 'CS WhatsApp Live',
            'workspace_id' => $this->workspace->id,
        ]);
    }

    public function test_device_creation_is_rejected_when_max_devices_limit_reached(): void
    {
        // Change plan limit to max_devices = 1
        $this->subscription->plan->update([
            'limits' => ['max_devices' => 1],
        ]);

        // Existing device count is already 1 ($this->device)
        $this->assertEquals(1, $this->workspace->devices()->count());

        // Attempt to create a 2nd device
        $response = $this->postJson('/devices', [
            'name' => 'Device Kedua Ilegal',
            'engine' => 'baileys',
            'phone_number' => '+6281200001111',
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'error' => 'device_limit_reached',
            ]);

        // Ensure database count is still 1
        $this->assertEquals(1, $this->workspace->devices()->count());
        $this->assertDatabaseMissing('devices', [
            'name' => 'Device Kedua Ilegal',
        ]);
    }

    public function test_device_status_polling_endpoint(): void
    {
        $response = $this->getJson("/devices/{$this->device->id}/status");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'device_id',
                'engine',
            ]);
    }

    public function test_internal_webhook_updates_device_status(): void
    {
        $response = $this->withHeader('X-Internal-Secret', 'internal_secret_token')
            ->postJson('/api/internal/devices/webhook', [
                'device_id' => $this->device->id,
                'status' => 'connected',
                'phone_number' => '+6281122334455',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('devices', [
            'id' => $this->device->id,
            'status' => 'connected',
            'phone_number' => '+6281122334455',
        ]);
    }

    public function test_internal_webhook_receives_inbound_message_to_inbox(): void
    {
        $response = $this->withHeader('X-Internal-Secret', 'internal_secret_token')
            ->postJson('/api/internal/messages/receive', [
                'device_id' => $this->device->id,
                'sender' => '+6287766554433',
                'message' => 'Halo min, mau tanya info pendaftaran mahasiswa baru',
            ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('messages', [
            'workspace_id' => $this->workspace->id,
            'direction' => 'inbound',
            'receiver_number' => '+6287766554433',
            'content' => 'Halo min, mau tanya info pendaftaran mahasiswa baru',
        ]);
    }
}
