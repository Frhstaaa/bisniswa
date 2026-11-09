<?php

namespace Tests\Feature;

use App\Models\Contact;
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

class MultiTenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspaceA;

    protected Workspace $workspaceB;

    protected User $userA;

    protected User $userB;

    protected Plan $plan;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            '*/sessions/*' => Http::response(['status' => 'success'], 200),
            '*/messages/*' => Http::response(['status' => 'sent', 'message_id' => 'msg_fake_123'], 200),
        ]);

        $this->plan = Plan::create([
            'name' => 'Enterprise Pro',
            'slug' => 'enterprise-pro',
            'price_monthly' => 299000,
            'price_annually' => 2990000,
            'limits' => ['max_devices' => 5],
            'features' => ['webhook_access' => true],
        ]);

        // Tenant A Setup
        $this->workspaceA = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Tenant Alpha Corp',
            'slug' => 'tenant-alpha',
            'phone' => '+628111111111',
            'is_active' => true,
        ]);

        $this->userA = User::factory()->create([
            'name' => 'Owner Alpha',
            'email' => 'owner@alpha.test',
            'phone' => '+628111111111',
            'workspace_id' => $this->workspaceA->id,
            'role' => 'owner',
        ]);

        Subscription::create([
            'workspace_id' => $this->workspaceA->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'grace_period_days' => 3,
            'monthly_message_quota' => 10000,
            'remaining_message_quota' => 10000,
        ]);

        // Tenant B Setup
        $this->workspaceB = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Tenant Beta Ltd',
            'slug' => 'tenant-beta',
            'phone' => '+628222222222',
            'is_active' => true,
        ]);

        $this->userB = User::factory()->create([
            'name' => 'Owner Beta',
            'email' => 'owner@beta.test',
            'phone' => '+628222222222',
            'workspace_id' => $this->workspaceB->id,
            'role' => 'owner',
        ]);

        Subscription::create([
            'workspace_id' => $this->workspaceB->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'grace_period_days' => 3,
            'monthly_message_quota' => 10000,
            'remaining_message_quota' => 10000,
        ]);
    }

    public function test_tenant_b_cannot_view_or_manage_tenant_a_devices(): void
    {
        $deviceA = Device::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Device Alpha 1',
            'phone_number' => '+628190000001',
            'status' => 'connected',
            'engine' => 'baileys',
        ]);

        $response = $this->actingAs($this->userB)->delete("/devices/{$deviceA->id}");
        $response->assertNotFound();

        $this->assertDatabaseHas('devices', [
            'id' => $deviceA->id,
            'workspace_id' => $this->workspaceA->id,
        ]);
    }

    public function test_tenant_b_cannot_register_device_with_phone_number_already_connected_by_tenant_a(): void
    {
        Device::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Device Alpha Active',
            'phone_number' => '+6281987654321',
            'status' => 'connected',
            'engine' => 'baileys',
        ]);

        $response = $this->actingAs($this->userB)->postJson('/devices', [
            'name' => 'Device Beta Hijack Attempt',
            'phone_number' => '+6281987654321',
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('error', 'duplicate_phone_conflict');

        $this->assertDatabaseMissing('devices', [
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Device Beta Hijack Attempt',
        ]);
    }

    public function test_gateway_webhook_rejects_connecting_phone_already_connected_in_another_workspace(): void
    {
        $secret = config('services.whatsapp_node.secret', 'internal_secret_token');

        // Existing active device in Workspace A
        Device::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Device Alpha Active',
            'phone_number' => '+6281987654321',
            'status' => 'connected',
            'engine' => 'baileys',
        ]);

        // Device in Workspace B attempting to connect with the exact same phone
        $deviceB = Device::create([
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Device Beta Clashing',
            'status' => 'qr_ready',
            'engine' => 'baileys',
        ]);

        $response = $this->withHeaders(['X-Internal-Secret' => $secret])
            ->postJson('/api/internal/devices/webhook', [
                'device_id' => $deviceB->id,
                'status' => 'connected',
                'phone_number' => '+6281987654321',
            ]);

        $response->assertStatus(409)
            ->assertJsonPath('error', 'PHONE_CONFLICT');

        $deviceB->refresh();
        $this->assertEquals('disconnected', $deviceB->status);
    }

    public function test_inbound_gateway_message_is_strictly_scoped_to_target_tenant_workspace(): void
    {
        $secret = config('services.whatsapp_node.secret', 'internal_secret_token');

        $deviceA = Device::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Alpha CS',
            'phone_number' => '+628111222333',
            'status' => 'connected',
            'engine' => 'baileys',
        ]);

        $response = $this->withHeaders(['X-Internal-Secret' => $secret])
            ->postJson('/api/internal/messages/receive', [
                'device_id' => $deviceA->id,
                'sender' => '+628999888777',
                'sender_name' => 'Customer Budi',
                'message' => 'Halo Alpha Store, apakah barang ready?',
            ]);

        $response->assertOk()
            ->assertJsonPath('success', true);

        // Assert message exists in Workspace A
        $this->assertDatabaseHas('messages', [
            'workspace_id' => $this->workspaceA->id,
            'device_id' => $deviceA->id,
            'receiver_number' => '+628999888777',
            'direction' => 'inbound',
        ]);

        // Assert message DOES NOT exist in Workspace B
        $this->assertDatabaseMissing('messages', [
            'workspace_id' => $this->workspaceB->id,
        ]);

        // Assert contact auto-created for Workspace A, NOT Workspace B
        $this->assertDatabaseHas('contacts', [
            'workspace_id' => $this->workspaceA->id,
            'phone' => '+628999888777',
            'name' => 'Customer Budi',
        ]);

        $this->assertDatabaseMissing('contacts', [
            'workspace_id' => $this->workspaceB->id,
            'phone' => '+628999888777',
        ]);
    }

    public function test_inbound_message_deduplication_prevents_duplicate_records(): void
    {
        $secret = config('services.whatsapp_node.secret', 'internal_secret_token');

        $deviceA = Device::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Alpha CS',
            'phone_number' => '+628111222333',
            'status' => 'connected',
            'engine' => 'baileys',
        ]);

        $payload = [
            'device_id' => $deviceA->id,
            'sender' => '+628999888777',
            'sender_name' => 'Customer Budi',
            'message' => 'Halo Alpha Store, apakah barang ready?',
        ];

        // First delivery
        $res1 = $this->withHeaders(['X-Internal-Secret' => $secret])
            ->postJson('/api/internal/messages/receive', $payload);
        $res1->assertOk();

        // Second delivery within 10s (reconnect / duplicate socket event)
        $res2 = $this->withHeaders(['X-Internal-Secret' => $secret])
            ->postJson('/api/internal/messages/receive', $payload);
        $res2->assertOk()->assertJsonPath('duplicate', true);

        // Exactly one inbound message in DB
        $inboundCount = Message::where('workspace_id', $this->workspaceA->id)
            ->where('direction', 'inbound')
            ->where('receiver_number', '+628999888777')
            ->count();
        $this->assertEquals(1, $inboundCount);
    }

    public function test_inbox_controller_does_not_leak_user_names_across_workspaces(): void
    {
        // User A belongs to Workspace A and has phone +628111111111
        // Create an incoming message in Workspace B from +628111111111
        Message::create([
            'workspace_id' => $this->workspaceB->id,
            'direction' => 'inbound',
            'receiver_number' => '+628111111111',
            'content' => 'Halo dari luar',
            'status' => 'delivered',
        ]);

        // When User B opens Inbox, they should NOT see User A's name "Owner Alpha"
        $response = $this->actingAs($this->userB)->get('/inbox');
        $response->assertOk();

        $page = $response->viewData('page');
        $conversations = $page['props']['conversations'] ?? [];

        $found = collect($conversations)->firstWhere('phone', '+628111111111');
        $this->assertNotNull($found);
        // It must NOT be User A's name
        $this->assertNotEquals('Owner Alpha', $found['name']);
        $this->assertEquals('Pelanggan 1111', $found['name']);
    }

    public function test_device_deletion_triggers_session_destroy(): void
    {
        $deviceA = Device::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Device To Delete',
            'phone_number' => '+628190000009',
            'status' => 'connected',
            'engine' => 'baileys',
        ]);

        $response = $this->actingAs($this->userA)->delete("/devices/{$deviceA->id}");
        $response->assertRedirect();

        $this->assertDatabaseMissing('devices', ['id' => $deviceA->id]);

        Http::assertSent(function ($request) use ($deviceA) {
            return str_contains($request->url(), '/sessions/destroy') &&
                   $request['device_id'] === $deviceA->id;
        });
    }
}
