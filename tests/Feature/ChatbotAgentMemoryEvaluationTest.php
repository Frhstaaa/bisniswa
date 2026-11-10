<?php

namespace Tests\Feature;

use App\Models\AutoReply;
use App\Models\Device;
use App\Models\Message;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Workspace;
use App\Services\AutoReplyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class ChatbotAgentMemoryEvaluationTest extends TestCase
{
    use RefreshDatabase;

    protected Workspace $workspaceA;

    protected Workspace $workspaceB;

    protected User $userA;

    protected User $userB;

    protected Device $deviceA;

    protected Device $deviceB;

    protected Plan $plan;

    protected AutoReplyService $autoReplyService;

    protected function setUp(): void
    {
        parent::setUp();

        Http::fake([
            '*/messages/*' => Http::response(['status' => 'sent', 'message_id' => 'msg_fake_999'], 200),
        ]);

        $this->plan = Plan::create([
            'name' => 'Enterprise Pro',
            'slug' => 'enterprise-pro',
            'price_monthly' => 299000,
            'price_annually' => 2990000,
            'limits' => ['max_devices' => 5],
            'features' => ['webhook_access' => true],
        ]);

        // Tenant A
        $this->workspaceA = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Klinik Medika Alpha',
            'slug' => 'klinik-medika-alpha',
            'phone' => '+628111111111',
            'is_active' => true,
        ]);

        $this->userA = User::factory()->create([
            'name' => 'Admin Alpha',
            'email' => 'alpha@klinik.test',
            'workspace_id' => $this->workspaceA->id,
            'role' => 'owner',
        ]);

        Subscription::create([
            'workspace_id' => $this->workspaceA->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'monthly_message_quota' => 5000,
            'remaining_message_quota' => 5000,
        ]);

        $this->deviceA = Device::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Alpha CS WhatsApp',
            'phone_number' => '+628111111111',
            'status' => 'connected',
            'engine' => 'baileys',
        ]);

        // Tenant B
        $this->workspaceB = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Toko Busana Beta',
            'slug' => 'toko-busana-beta',
            'phone' => '+628222222222',
            'is_active' => true,
        ]);

        $this->userB = User::factory()->create([
            'name' => 'Admin Beta',
            'email' => 'beta@busana.test',
            'workspace_id' => $this->workspaceB->id,
            'role' => 'owner',
        ]);

        Subscription::create([
            'workspace_id' => $this->workspaceB->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'monthly_message_quota' => 5000,
            'remaining_message_quota' => 5000,
        ]);

        $this->deviceB = Device::create([
            'workspace_id' => $this->workspaceB->id,
            'name' => 'Beta Sales WhatsApp',
            'phone_number' => '+628222222222',
            'status' => 'connected',
            'engine' => 'baileys',
        ]);

        $this->autoReplyService = app(AutoReplyService::class);
    }

    /**
     * Agent Memory Systems: Verified isolation of semantic knowledge base & prompt context.
     */
    public function test_tenant_scoped_chatbot_memory_isolation_and_cross_identity_rejection(): void
    {
        // 1. Tenant A saves medical knowledge base and persona
        $this->actingAs($this->userA)->post('/auto-reply/ai-config', [
            'enabled' => true,
            'prompt_context' => 'Anda adalah Dokter Spesialis AI Klinik Medika Alpha.',
            'persona' => 'expert_formal',
            'knowledge_base' => 'Klinik kami melayani poli gigi, dokter anak, dan tes laboratorium PCR.',
        ])->assertRedirect();

        // 2. Tenant B saves fashion retail knowledge base
        $this->actingAs($this->userB)->post('/auto-reply/ai-config', [
            'enabled' => true,
            'prompt_context' => 'Anda adalah Stylist Fashion AI Toko Busana Beta.',
            'persona' => 'cs_friendly',
            'knowledge_base' => 'Kami menjual gamis katun, kemeja batik pria, dan jilbab voal.',
        ])->assertRedirect();

        // 3. Verify memory records in SystemSetting are strictly isolated by workspace ID
        $this->assertEquals(
            'Klinik kami melayani poli gigi, dokter anak, dan tes laboratorium PCR.',
            SystemSetting::get("ai_gemini_knowledge_base_{$this->workspaceA->id}")
        );
        $this->assertEquals(
            'Kami menjual gamis katun, kemeja batik pria, dan jilbab voal.',
            SystemSetting::get("ai_gemini_knowledge_base_{$this->workspaceB->id}")
        );

        // 4. Verify Tenant A dashboard only receives Tenant A's AI memory
        $responseA = $this->actingAs($this->userA)->get('/auto-reply');
        $responseA->assertOk();
        $responseA->assertInertia(fn ($page) => $page
            ->where('aiConfig.persona', 'expert_formal')
            ->where('aiConfig.knowledge_base', 'Klinik kami melayani poli gigi, dokter anak, dan tes laboratorium PCR.')
        );

        // 5. Verify Tenant B dashboard only receives Tenant B's AI memory
        $responseB = $this->actingAs($this->userB)->get('/auto-reply');
        $responseB->assertOk();
        $responseB->assertInertia(fn ($page) => $page
            ->where('aiConfig.persona', 'cs_friendly')
            ->where('aiConfig.knowledge_base', 'Kami menjual gamis katun, kemeja batik pria, dan jilbab voal.')
        );
    }

    /**
     * Agent Memory Systems: Cross-identity mutation rejection.
     */
    public function test_tenant_b_cannot_update_delete_or_toggle_tenant_a_autoreply_rules(): void
    {
        $ruleA = AutoReply::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Jadwal Dokter Alpha',
            'trigger_type' => 'contains',
            'keyword' => 'dokter,jadwal',
            'reply_message' => 'Dokter praktek Senin s/d Jumat pukul 09.00 - 15.00 WIB.',
            'is_active' => true,
        ]);

        // Tenant B attempts to update Tenant A's rule -> Must 404 (or not found)
        $updateAttempt = $this->actingAs($this->userB)->put("/auto-reply/{$ruleA->id}", [
            'name' => 'Hacked Rule Name',
            'trigger_type' => 'exact',
            'keyword' => 'hacked',
            'reply_message' => 'Hacked message',
        ]);
        $updateAttempt->assertNotFound();

        // Tenant B attempts to toggle Tenant A's rule -> Must 404
        $toggleAttempt = $this->actingAs($this->userB)->post("/auto-reply/{$ruleA->id}/toggle");
        $toggleAttempt->assertNotFound();

        // Tenant B attempts to delete Tenant A's rule -> Rule in Workspace A must remain intact
        $deleteAttempt = $this->actingAs($this->userB)->delete("/auto-reply/{$ruleA->id}");
        $this->assertDatabaseHas('auto_replies', [
            'id' => $ruleA->id,
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Jadwal Dokter Alpha',
        ]);
    }

    /**
     * Agent Evaluation: Simulator isolates rules and ignores foreign device IDs.
     */
    public function test_simulator_strictly_scopes_rules_and_rejects_foreign_devices(): void
    {
        AutoReply::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Alpha Secret Info',
            'trigger_type' => 'exact',
            'keyword' => 'rahasia',
            'reply_message' => 'Informasi khusus pasien Klinik Alpha.',
            'is_active' => true,
        ]);

        // 1. Tenant A simulates 'rahasia' -> matches rule
        $simA = $this->actingAs($this->userA)->postJson('/auto-reply/simulate', [
            'message' => 'rahasia',
        ]);
        $simA->assertOk();
        $simA->assertJsonPath('success', true);
        $simA->assertJsonPath('rule_name', 'Alpha Secret Info');

        // 2. Tenant B simulates 'rahasia' with foreign deviceId of Tenant A
        // Must NOT match Tenant A's rule because it is scoped to Workspace B!
        $simB = $this->actingAs($this->userB)->postJson('/auto-reply/simulate', [
            'message' => 'rahasia',
            'device_id' => $this->deviceA->id, // Passing foreign device ID
        ]);
        $simB->assertOk();
        $simB->assertJsonPath('success', true);
        // Tenant B has no 'rahasia' rule, so it falls back to none or AI, NEVER Alpha's rule
        $this->assertNotEquals('Alpha Secret Info', $simB->json('rule_name'));
    }

    /**
     * Agent Memory Systems: Procedural memory for order formats, catalog, and payments.
     */
    public function test_chatbot_procedural_memory_for_orders_catalogs_and_payments(): void
    {
        // 1. Order format query
        $orderRes = $this->autoReplyService->simulateResponse($this->workspaceA->id, 'Bagaimana cara order / pesan?');
        $this->assertTrue($orderRes['success']);
        $this->assertStringContainsString('Format Pemesanan Cepat', $orderRes['reply']);
        $this->assertStringContainsString('Nama Lengkap', $orderRes['reply']);
        $this->assertStringContainsString('Metode Bayar', $orderRes['reply']);

        // 2. Catalog & price query
        $catalogRes = $this->autoReplyService->simulateResponse($this->workspaceA->id, 'Boleh minta daftar harga dan katalog?');
        $this->assertTrue($catalogRes['success']);
        $this->assertStringContainsString('Informasi Produk & Harga', $catalogRes['reply']);

        // 3. Payment & bank account query
        $paymentRes = $this->autoReplyService->simulateResponse($this->workspaceA->id, 'Nomor rekening untuk transfer dan bayar tagihan apa ya?');
        $this->assertTrue($paymentRes['success']);
        $this->assertStringContainsString('Pembayaran Resmi', $paymentRes['reply']);
        $this->assertStringContainsString('QRIS', $paymentRes['reply']);
    }

    /**
     * Agent Evaluation: Numbered menu navigation and multi-keyword aliases.
     */
    public function test_chatbot_menu_number_and_alias_intent_resolution(): void
    {
        $rulePoli = AutoReply::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Poli Umum',
            'trigger_type' => 'exact',
            'keyword' => '1, poli umum, umum',
            'reply_message' => 'Layanan Poli Umum buka setiap hari.',
            'is_active' => true,
        ]);

        $ruleGigi = AutoReply::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Poli Gigi',
            'trigger_type' => 'exact',
            'keyword' => '2, poli gigi, gigi',
            'reply_message' => 'Layanan Poli Gigi dokter drg. Siti.',
            'is_active' => true,
        ]);

        // 1. Customer sends menu greeting "menu" -> receives menu
        $menuRes = $this->autoReplyService->simulateResponse($this->workspaceA->id, 'menu');
        $this->assertTrue($menuRes['success']);
        $this->assertEquals('auto_menu', $menuRes['source']);
        $this->assertStringContainsString('DAFTAR MENU & LAYANAN', $menuRes['reply']);
        $this->assertStringContainsString('Poli Umum', $menuRes['reply']);
        $this->assertStringContainsString('Poli Gigi', $menuRes['reply']);

        // 2. Customer selects by digit: "1"
        $choice1 = $this->autoReplyService->simulateResponse($this->workspaceA->id, '1');
        $this->assertEquals('keyword_rule', $choice1['source']);
        $this->assertEquals('Poli Umum', $choice1['rule_name']);

        // 3. Customer selects with prefix: "menu 2"
        $choice2 = $this->autoReplyService->simulateResponse($this->workspaceA->id, 'menu 2');
        $this->assertEquals('keyword_rule', $choice2['source']);
        $this->assertEquals('Poli Gigi', $choice2['rule_name']);

        // 4. Customer selects by keyword alias: "gigi"
        $choiceAlias = $this->autoReplyService->simulateResponse($this->workspaceA->id, 'gigi');
        $this->assertEquals('keyword_rule', $choiceAlias['source']);
        $this->assertEquals('Poli Gigi', $choiceAlias['rule_name']);
    }

    /**
     * Agent Evaluation: Business hours schedule modes (always_away, fallback_only, always_prepend).
     */
    public function test_business_hours_schedule_memory_and_away_modes(): void
    {
        // 1. Configure schedule in workspace A: Mode = always_away
        SystemSetting::set("auto_reply_schedule_enabled_{$this->workspaceA->id}", true);
        SystemSetting::set("auto_reply_schedule_start_{$this->workspaceA->id}", '08:00');
        SystemSetting::set("auto_reply_schedule_end_{$this->workspaceA->id}", '17:00');
        SystemSetting::set("auto_reply_away_mode_{$this->workspaceA->id}", 'always_away');
        SystemSetting::set("auto_reply_away_message_{$this->workspaceA->id}", 'Mohon maaf, saat ini sedang di LUAR JAM OPERASIONAL.');

        // Test outside hours simulation with always_away
        $resAway = $this->autoReplyService->simulateResponse($this->workspaceA->id, 'tes pesan', null, true);
        $this->assertEquals('away_schedule', $resAway['source']);
        $this->assertStringContainsString('LUAR JAM OPERASIONAL', $resAway['reply']);

        // 2. Change mode to always_prepend
        SystemSetting::set("auto_reply_away_mode_{$this->workspaceA->id}", 'always_prepend');
        AutoReply::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Harga Alpha',
            'trigger_type' => 'exact',
            'keyword' => 'biaya',
            'reply_message' => 'Biaya pendaftaran adalah Rp 50.000.',
            'is_active' => true,
        ]);

        $resPrepend = $this->autoReplyService->simulateResponse($this->workspaceA->id, 'biaya', null, true);
        $this->assertEquals('keyword_rule', $resPrepend['source']);
        $this->assertStringContainsString('Luar Jam Operasional', $resPrepend['reply']);
        $this->assertStringContainsString('Biaya pendaftaran adalah Rp 50.000', $resPrepend['reply']);
    }

    /**
     * Agent Evaluation: Inbound message handling decrements quota and records conversation.
     */
    public function test_inbound_message_quota_memory_decrement_and_conversation_persistence(): void
    {
        $subscription = Subscription::where('workspace_id', $this->workspaceA->id)->first();
        $initialQuota = $subscription->remaining_message_quota;

        AutoReply::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Info Tes Laboratorium',
            'trigger_type' => 'contains',
            'keyword' => 'lab,darah',
            'reply_message' => 'Hasil tes laboratorium darah keluar dalam 2 jam.',
            'is_active' => true,
        ]);

        // Process inbound message
        $result = $this->autoReplyService->handleInboundMessage(
            $this->deviceA,
            '+6281234567890',
            'Kapan hasil tes darah saya selesai ya kak?',
            'Bpk Rahmat'
        );

        $this->assertNotNull($result);
        $this->assertTrue($result['success']);
        $this->assertEquals('keyword_rule', $result['source']);
        $this->assertEquals('Info Tes Laboratorium', $result['rule_name']);

        // Verify quota decremented by exactly 1
        $subscription->refresh();
        $this->assertEquals($initialQuota - 1, $subscription->remaining_message_quota);

        // Verify outbound message stored in DB
        $this->assertDatabaseHas('messages', [
            'workspace_id' => $this->workspaceA->id,
            'device_id' => $this->deviceA->id,
            'direction' => 'outbound',
            'receiver_number' => '+6281234567890',
        ]);
    }

    /**
     * Agent Evaluation: Master toggle halts auto-reply processing cleanly.
     */
    public function test_master_toggle_disables_all_autoreply_responses(): void
    {
        AutoReply::create([
            'workspace_id' => $this->workspaceA->id,
            'name' => 'Halo Rule',
            'trigger_type' => 'exact',
            'keyword' => 'halo',
            'reply_message' => 'Halo ada yang bisa dibantu?',
            'is_active' => true,
        ]);

        // Toggle master switch to OFF
        SystemSetting::set("auto_reply_master_enabled_{$this->workspaceA->id}", false);

        $result = $this->autoReplyService->handleInboundMessage(
            $this->deviceA,
            '+6281234567890',
            'halo',
            'Pelanggan'
        );

        // Must return null (no message dispatched)
        $this->assertNull($result);
    }
}
