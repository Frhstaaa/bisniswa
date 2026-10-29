<?php

namespace Tests\Feature;

use App\Models\AutoReply;
use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\Device;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class EnterpriseFeaturesTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected Workspace $workspace;

    protected Plan $plan;

    protected Subscription $subscription;

    protected Device $device;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workspace = Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => 'PT Digital Sukses Mandiri',
            'slug' => 'digital-sukses-mandiri',
            'is_active' => true,
        ]);

        $this->user = User::factory()->create([
            'workspace_id' => $this->workspace->id,
            'email' => 'client@enterprise.com',
            'role' => 'client',
        ]);

        $this->plan = Plan::create([
            'name' => 'Enterprise Pro',
            'slug' => 'enterprise-pro',
            'price_monthly' => 299000,
            'price_annually' => 2890000,
            'limits' => [
                'max_devices' => 5,
                'monthly_message_quota' => 50000,
            ],
            'features' => [
                'auto_reply' => true,
                'spintax_enabled' => true,
                'webhook_access' => true,
            ],
            'is_active' => true,
        ]);

        $this->subscription = Subscription::create([
            'workspace_id' => $this->workspace->id,
            'plan_id' => $this->plan->id,
            'status' => 'active',
            'starts_at' => now(),
            'ends_at' => now()->addDays(30),
            'grace_period_days' => 3,
            'monthly_message_quota' => 50000,
            'remaining_message_quota' => 50000,
        ]);

        $this->device = Device::create([
            'workspace_id' => $this->workspace->id,
            'name' => 'Gateway Utama',
            'engine' => 'wwebjs',
            'status' => 'connected',
            'phone_number' => '+6281234567890',
        ]);
    }

    public function test_contacts_page_renders_and_contacts_can_be_stored_and_imported(): void
    {
        $this->actingAs($this->user);

        // 1. Visit contacts page
        $res = $this->get('/contacts');
        $res->assertStatus(200);

        // 2. Create contact group
        $groupRes = $this->post('/contacts/groups', [
            'name' => 'Mahasiswa Baru 2026',
            'description' => 'Segmentasi mahasiswa angkatan baru',
        ]);
        $groupRes->assertRedirect();
        $this->assertDatabaseHas('contact_groups', ['name' => 'Mahasiswa Baru 2026']);
        $group = ContactGroup::where('name', 'Mahasiswa Baru 2026')->first();

        // 3. Store single contact
        $contactRes = $this->post('/contacts', [
            'name' => 'Budi Santoso',
            'phone' => '081234567899',
            'group_id' => $group->id,
        ]);
        $contactRes->assertRedirect();
        $this->assertDatabaseHas('contacts', [
            'phone' => '+6281234567899',
            'name' => 'Budi Santoso',
        ]);

        // 4. Batch Import CSV
        $csvText = "Siti Rahma, 081987654321, Lunas, Manajemen\nAhmad Fauzi, 085712345678";
        $importRes = $this->post('/contacts/import', [
            'group_id' => $group->id,
            'csv_data' => $csvText,
        ]);
        $importRes->assertRedirect();

        $this->assertDatabaseHas('contacts', ['phone' => '+6281987654321', 'name' => 'Siti Rahma']);
        $this->assertDatabaseHas('contacts', ['phone' => '+6285712345678', 'name' => 'Ahmad Fauzi']);
    }

    public function test_auto_reply_rules_and_live_simulation(): void
    {
        $this->actingAs($this->user);

        // 1. Visit auto-reply page
        $res = $this->get('/auto-reply');
        $res->assertStatus(200);

        // 2. Create keyword rule
        $createRule = $this->post('/auto-reply', [
            'name' => 'Info Pendaftaran',
            'trigger_type' => 'contains',
            'keyword' => 'daftar',
            'reply_message' => 'Halo! Pendaftaran dibuka sampai akhir bulan ini.',
        ]);
        $createRule->assertRedirect();
        $this->assertDatabaseHas('auto_replies', ['keyword' => 'daftar']);

        // 3. Simulate matching keyword
        $matchRes = $this->postJson('/auto-reply/simulate', [
            'message' => 'Halo Kak mau tanya info cara daftar kuliah dong',
        ]);
        $matchRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'source' => 'keyword_rule',
                'reply' => 'Halo! Pendaftaran dibuka sampai akhir bulan ini.',
            ]);

        // 4. Update rule with multi-keyword alias via PUT /auto-reply/{id}
        $rule = AutoReply::where('keyword', 'daftar')->first();
        $updateRes = $this->put("/auto-reply/{$rule->id}", [
            'name' => 'Info Pendaftaran & Penerimaan',
            'trigger_type' => 'contains',
            'keyword' => '1, info daftar, registrasi',
            'reply_message' => 'Halo! Pendaftaran dibuka sampai akhir bulan ini. Silakan siapkan berkas.',
            'is_active' => true,
        ]);
        $updateRes->assertRedirect();
        $this->assertDatabaseHas('auto_replies', [
            'id' => $rule->id,
            'name' => 'Info Pendaftaran & Penerimaan',
            'keyword' => '1, info daftar, registrasi',
        ]);

        // 5. Test number menu selection (user inputs '1' or 'menu 1')
        $numberRes = $this->postJson('/auto-reply/simulate', [
            'message' => '1',
        ]);
        $numberRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'source' => 'keyword_rule',
                'reply' => 'Halo! Pendaftaran dibuka sampai akhir bulan ini. Silakan siapkan berkas.',
            ]);

        // 6. Test auto menu generator (user inputs 'menu')
        $menuRes = $this->postJson('/auto-reply/simulate', [
            'message' => 'menu',
            'device_id' => $this->device->id,
        ]);
        $menuRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'source' => 'auto_menu',
            ]);
        $this->assertStringContainsString('DAFTAR MENU', $menuRes->json('reply'));
        $this->assertStringContainsString('Info Pendaftaran & Penerimaan', $menuRes->json('reply'));

        // 7. Test greeting & inquiry triggers: user inputs 'info' or 'hi' on target device
        $infoRes = $this->postJson('/auto-reply/simulate', [
            'message' => 'info',
            'device_id' => $this->device->id,
        ]);
        $infoRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'source' => 'auto_menu',
            ]);

        $hiRes = $this->postJson('/auto-reply/simulate', [
            'message' => 'hi',
            'device_id' => $this->device->id,
        ]);
        $hiRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'source' => 'auto_menu',
            ]);

        // 8. Update Menu Configuration
        $configRes = $this->post('/auto-reply/menu-config', [
            'enabled' => true,
            'keywords' => 'hi, halo, info, menu, bantuan, p',
            'device_id' => $this->device->id,
            'header' => '📋 *MENU RESMI {target}*',
            'footer' => '_Ketik nomor untuk info lebih lanjut._',
        ]);
        $configRes->assertRedirect();
        $this->assertEquals('hi, halo, info, menu, bantuan, p', SystemSetting::get("greeting_menu_keywords_{$this->workspace->id}"));

        // 9. Load Starter Template Rules ala BPJS CHIKA & Pandawa
        $seedRes = $this->post('/auto-reply/seed-templates');
        $seedRes->assertRedirect();
        $this->assertDatabaseHas('auto_replies', [
            'workspace_id' => $this->workspace->id,
            'name' => 'Administrasi',
            'cta_text' => 'Isi Formulir',
        ]);

        // 9b. Test interactive quick reply buttons and CTA simulation
        $btnRes = $this->postJson('/auto-reply/simulate', [
            'message' => 'hi',
            'device_id' => $this->device->id,
        ]);
        $btnRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'source' => 'auto_menu',
                'menu_style' => 'buttons',
            ]);
        $this->assertNotEmpty($btnRes->json('buttons'));
        $this->assertEquals('Administrasi', $btnRes->json('buttons')[0]['label']);

        // 9c. Test clicking 'Administrasi' button triggers rule with CTA URL button
        $adminRes = $this->postJson('/auto-reply/simulate', [
            'message' => 'Administrasi',
            'device_id' => $this->device->id,
        ]);
        $adminRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'source' => 'keyword_rule',
                'cta_text' => 'Isi Formulir',
                'cta_url' => 'https://pmb.mardira.ac.id/form',
            ]);

        // 10. Simulate unmatched message (triggers AI Fallback)
        $aiRes = $this->postJson('/auto-reply/simulate', [
            'message' => 'Apakah kampus menyediakan fasilitas kolam renang olympic?',
        ]);
        $aiRes->assertStatus(200)
            ->assertJson([
                'success' => true,
                'source' => 'ai_gemini',
            ]);
    }

    public function test_inbox_renders_and_can_send_live_chat_message(): void
    {
        $this->actingAs($this->user);

        $initialQuota = $this->subscription->remaining_message_quota;

        // 1. Visit live chat inbox
        $res = $this->get('/inbox');
        $res->assertStatus(200);

        // 2. Send live message to a customer
        $sendRes = $this->post('/inbox/send', [
            'phone' => '+6281999888777',
            'message' => 'Halo Kak, tagihan semester Anda sudah terbit.',
            'device_id' => $this->device->id,
        ]);
        $sendRes->assertRedirect();

        $this->assertDatabaseHas('messages', [
            'receiver_number' => '+6281999888777',
            'direction' => 'outbound',
            'content' => 'Halo Kak, tagihan semester Anda sudah terbit.',
        ]);

        // Assert message quota is decremented by 1
        $this->assertEquals($initialQuota - 1, $this->subscription->fresh()->remaining_message_quota);
    }

    public function test_automated_qris_checkout_instant_activation(): void
    {
        $this->actingAs($this->user);

        $initialQuota = $this->subscription->remaining_message_quota;

        // Perform instant QRIS checkout
        $checkoutRes = $this->post('/subscriptions/checkout', [
            'plan_id' => $this->plan->id,
            'payment_method' => 'qris',
        ]);
        $checkoutRes->assertRedirect();

        // Assert payment is created and marked paid
        $this->assertDatabaseHas('payments', [
            'workspace_id' => $this->workspace->id,
            'plan_id' => $this->plan->id,
            'payment_method' => 'qris',
            'status' => 'paid',
        ]);

        // Assert quota was topped up
        $this->subscription->refresh();
        $this->assertEquals($initialQuota + 50000, $this->subscription->remaining_message_quota);

        // Assert audit log was recorded
        $this->assertDatabaseHas('subscription_audits', [
            'subscription_id' => $this->subscription->id,
            'action' => 'PAYMENT_APPROVED',
        ]);
    }

    public function test_profile_page_renders_and_updates_successfully(): void
    {
        $this->actingAs($this->user);

        $res = $this->get('/profile');
        $res->assertStatus(200);

        $updateRes = $this->post('/profile', [
            'name' => 'Budi Santoso MBA',
            'email' => 'budi.santoso@enterprise.com',
            'phone' => '+6281234567890',
            'workspace_name' => 'PT Mardira Sukses Mandiri',
        ]);
        $updateRes->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'name' => 'Budi Santoso MBA',
            'email' => 'budi.santoso@enterprise.com',
        ]);

        $this->assertDatabaseHas('workspaces', [
            'id' => $this->workspace->id,
            'name' => 'PT Mardira Sukses Mandiri',
        ]);
    }

    public function test_postman_collection_download(): void
    {
        $this->actingAs($this->user);

        $res = $this->get('/api-access/download-postman');
        $res->assertStatus(200);
        $res->assertHeader('content-disposition', 'attachment; filename=MARDIRA_WA_Postman_Collection.json');
    }

    public function test_bridging_documentation_download(): void
    {
        $this->actingAs($this->user);

        $res = $this->get('/api-access/download-docs');
        $res->assertStatus(200);
        $res->assertHeader('content-disposition', 'attachment; filename=MARDIRA_WA_Dokumentasi_Bridging_API.md');
    }

    public function test_webhook_test_ping(): void
    {
        $this->actingAs($this->user);

        // Save webhook URL first
        $this->post('/api-access/webhooks', [
            'url' => 'https://webhook.site/test-uuid',
        ]);

        $res = $this->postJson('/api-access/test-ping');
        $res->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status_code' => 200,
            ]);
    }

    public function test_invoice_printable_view(): void
    {
        $this->actingAs($this->user);

        $payment = Payment::create([
            'workspace_id' => $this->workspace->id,
            'plan_id' => $this->plan->id,
            'invoice_number' => 'INV-TEST9999',
            'amount' => 299000,
            'payment_method' => 'qris',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        $res = $this->get("/subscriptions/invoice/{$payment->invoice_number}");
        $res->assertStatus(200);
    }
}
