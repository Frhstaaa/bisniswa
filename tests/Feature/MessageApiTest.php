<?php

namespace Tests\Feature;

use App\Models\ApiKey;
use App\Models\Device;
use App\Models\Message;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class MessageApiTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspace;

    protected User $user;

    protected Plan $plan;

    protected Subscription $subscription;

    protected Device $device;

    protected ApiKey $apiKey;

    protected string $plainToken = 'bk_live_test_api_key_1234567890';

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'PT Test Indonesia',
            'slug' => 'pt-test-indonesia',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'email' => 'client@test.com',
            'role' => 'client',
        ]);

        $this->plan = Plan::create([
            'name' => 'Starter Lite',
            'slug' => 'starter',
            'price_monthly' => 99000,
            'price_annually' => 950000,
            'limits' => [
                'max_devices' => 1,
                'monthly_message_quota' => 5000,
            ],
            'features' => ['auto_reply' => true],
            'is_active' => true,
        ]);

        $this->subscription = Subscription::create([
            'workspace_id' => $this->workspace->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
            'starts_at' => now()->subDay(),
            'ends_at' => now()->addDays(29),
            'grace_period_days' => 3,
            'monthly_message_quota' => 5000,
            'remaining_message_quota' => 5000,
        ]);

        $this->device = Device::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Device Server 1',
            'phone_number' => '+628123456789',
            'status' => 'connected',
            'engine' => 'baileys',
            'last_connected_at' => now(),
        ]);

        $this->apiKey = ApiKey::create([
            'workspace_id' => $this->workspace->id,
            'device_id' => $this->device->id,
            'name' => 'Test API Key',
            'prefix' => 'bk_live_',
            'key_hash' => hash('sha256', $this->plainToken),
            'scopes' => ['messages:send', 'messages:read'],
        ]);
    }

    public function test_cannot_access_without_bearer_token(): void
    {
        $response = $this->postJson('/api/v1/messages/send', [
            'phone' => '081234567890',
            'message' => 'Halo dunia',
        ]);

        $response->assertStatus(401)
            ->assertJson([
                'status' => false,
                'error_code' => 'UNAUTHORIZED',
            ]);
    }

    public function test_cannot_access_with_invalid_token(): void
    {
        $response = $this->withToken('bk_live_invalid_token_999')
            ->postJson('/api/v1/messages/send', [
                'phone' => '081234567890',
                'message' => 'Halo dunia',
            ]);

        $response->assertStatus(401)
            ->assertJson([
                'status' => false,
                'error_code' => 'UNAUTHORIZED',
            ]);
    }

    public function test_can_query_quota_via_get_endpoint(): void
    {
        $response = $this->withToken($this->plainToken)
            ->getJson('/api/v1/quota');

        $response->assertStatus(200)
            ->assertHeader('X-Quota-Limit', '5000')
            ->assertHeader('X-Quota-Remaining', '5000')
            ->assertHeader('X-Quota-Used', '0')
            ->assertJson([
                'status' => true,
                'workspace' => [
                    'id' => $this->workspace->id,
                    'name' => $this->workspace->name,
                ],
                'plan' => [
                    'name' => 'Starter Lite',
                    'status' => 'active',
                ],
                'quota' => [
                    'monthly_total' => 5000,
                    'remaining' => 5000,
                    'used' => 0,
                    'can_send' => true,
                ],
                'devices' => [
                    'total' => 1,
                    'connected' => 1,
                ],
            ]);
    }

    public function test_send_message_deducts_quota_on_success(): void
    {
        Http::fake([
            '*/messages/send' => Http::response([
                'success' => true,
                'message_id' => 'MSG_TEST_99',
                'status' => 'delivered',
            ], 200),
        ]);

        $response = $this->withToken($this->plainToken)
            ->postJson('/api/v1/messages/send', [
                'phone' => '081234567890',
                'message' => 'Notifikasi Pembayaran SPP',
            ]);

        $response->assertStatus(200)
            ->assertHeader('X-Quota-Limit', '5000')
            ->assertHeader('X-Quota-Remaining', '4999')
            ->assertHeader('X-Quota-Used', '1')
            ->assertJson([
                'status' => true,
                'data' => [
                    'server' => 'wwebjs',
                    'recipient' => '+6281234567890',
                    'status' => 'delivered',
                ],
                'quota' => [
                    'monthly_total' => 5000,
                    'remaining' => 4999,
                    'used' => 1,
                ],
            ]);

        // Subscription quota must be decremented in DB
        $this->subscription->refresh();
        $this->assertEquals(4999, $this->subscription->remaining_message_quota);

        // Outbound message record must exist
        $this->assertDatabaseHas('messages', [
            'workspace_id' => $this->workspace->id,
            'direction' => 'outbound',
            'receiver_number' => '+6281234567890',
            'status' => 'delivered',
        ]);
    }

    public function test_send_message_does_not_deduct_quota_on_dispatch_failure(): void
    {
        Http::fake([
            '*/messages/send' => Http::response([
                'success' => false,
                'error' => 'Perangkat WhatsApp terputus dari jaringan.',
            ], 500),
        ]);

        $response = $this->withToken($this->plainToken)
            ->postJson('/api/v1/messages/send', [
                'phone' => '081234567890',
                'message' => 'Pesan pengujian gagal',
            ]);

        $response->assertStatus(502)
            ->assertJson([
                'status' => false,
                'error_code' => 'DISPATCH_FAILED',
                'quota' => [
                    'monthly_total' => 5000,
                    'remaining' => 5000,
                    'used' => 0,
                ],
            ]);

        // Quota must remain untouched
        $this->subscription->refresh();
        $this->assertEquals(5000, $this->subscription->remaining_message_quota);

        // Failed message record should exist with error
        $this->assertDatabaseHas('messages', [
            'workspace_id' => $this->workspace->id,
            'status' => 'failed',
        ]);
    }

    public function test_send_message_fails_when_quota_is_exhausted(): void
    {
        $this->subscription->update(['remaining_message_quota' => 0]);

        $response = $this->withToken($this->plainToken)
            ->postJson('/api/v1/messages/send', [
                'phone' => '081234567890',
                'message' => 'Pesan saat kuota habis',
            ]);

        $response->assertStatus(402)
            ->assertJson([
                'status' => false,
                'error_code' => 'QUOTA_EXHAUSTED',
                'quota' => [
                    'remaining' => 0,
                    'can_send' => false,
                ],
            ]);
    }

    public function test_send_message_fails_when_no_device_connected(): void
    {
        $this->device->update(['status' => 'disconnected']);

        $response = $this->withToken($this->plainToken)
            ->postJson('/api/v1/messages/send', [
                'phone' => '081234567890',
                'message' => 'Pesan saat perangkat offline',
            ]);

        $response->assertStatus(422)
            ->assertJson([
                'status' => false,
                'error_code' => 'BOUND_DEVICE_DISCONNECTED',
            ]);

        $this->subscription->refresh();
        $this->assertEquals(5000, $this->subscription->remaining_message_quota);
    }

    public function test_user_can_generate_api_key_bound_to_device(): void
    {
        $response = $this->actingAs($this->user)
            ->post('/api-access/keys', [
                'name' => 'Aplikasi Notifikasi Perkuliahan',
                'device_id' => $this->device->id,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('new_api_key');

        $this->assertDatabaseHas('api_keys', [
            'workspace_id' => $this->workspace->id,
            'device_id' => $this->device->id,
            'name' => 'Aplikasi Notifikasi Perkuliahan',
        ]);
    }

    public function test_user_cannot_generate_api_key_without_device(): void
    {
        $response = $this->actingAs($this->user)
            ->post('/api-access/keys', [
                'name' => 'API Key Tanpa Device',
            ]);

        $response->assertSessionHasErrors(['device_id']);
    }

    public function test_user_can_delete_api_key(): void
    {
        $response = $this->actingAs($this->user)
            ->delete("/api-access/keys/{$this->apiKey->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('api_keys', [
            'id' => $this->apiKey->id,
        ]);
    }
}
