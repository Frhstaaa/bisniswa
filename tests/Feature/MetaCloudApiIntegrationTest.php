<?php

namespace Tests\Feature;

use App\Models\AutoReply;
use App\Models\Contact;
use App\Models\Device;
use App\Models\Workspace;
use App\Services\AutoReplyService;
use App\Services\WhatsApp\MetaCloudApiService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class MetaCloudApiIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function createWorkspace(string $name = 'PT Digital Mandiri'): Workspace
    {
        return Workspace::create([
            'uuid' => (string) Str::uuid(),
            'name' => $name,
            'slug' => Str::slug($name).'-'.rand(100, 999),
            'phone' => '+6281298430911',
            'is_active' => true,
        ]);
    }

    public function test_meta_webhook_verification_challenge(): void
    {
        $response = $this->get('/api/webhook/meta-whatsapp?hub.mode=subscribe&hub.verify_token=bisniswa_meta_token&hub.challenge=CHALLENGE_CODE_123');

        $response->assertStatus(200);
        $this->assertEquals('CHALLENGE_CODE_123', $response->getContent());
    }

    public function test_meta_webhook_verification_fails_with_invalid_token(): void
    {
        $response = $this->get('/api/webhook/meta-whatsapp?hub.mode=subscribe&hub.verify_token=wrong_token&hub.challenge=CHALLENGE_CODE_123');

        $response->assertStatus(403);
    }

    public function test_personalization_replaces_name_and_greeting(): void
    {
        $workspace = $this->createWorkspace('Klinik Sehat');
        $device = Device::create([
            'workspace_id' => $workspace->id,
            'name' => 'CS Klinik',
            'engine' => 'wwebjs',
            'phone_number' => '+6285199297774',
            'status' => 'connected',
        ]);

        AutoReply::create([
            'workspace_id' => $workspace->id,
            'name' => 'Konsultasi',
            'keyword' => 'konsultasi',
            'reply_message' => 'Halo {{name}}, terima kasih telah menghubungi kami. Selamat {{time}}!',
            'is_active' => true,
        ]);

        $service = app(AutoReplyService::class);
        $result = $service->handleInboundMessage($device, '+628386012467', 'konsultasi', 'Prabu Tiyas');

        $this->assertNotNull($result);
        $this->assertStringContainsString('Halo Prabu Tiyas', $result['reply']);

        // Check contact was recorded
        $contact = Contact::where('workspace_id', $workspace->id)->where('phone', '+628386012467')->first();
        $this->assertNotNull($contact);
    }

    public function test_meta_cloud_api_service_sends_quick_reply_buttons(): void
    {
        Http::fake([
            'graph.facebook.com/*' => Http::response([
                'messaging_product' => 'whatsapp',
                'contacts' => [['input' => '628386012467', 'wa_id' => '628386012467']],
                'messages' => [['id' => 'wamid.HBgTEST123']],
            ], 200),
        ]);

        $workspace = $this->createWorkspace('Test Workspace');
        $device = Device::create([
            'workspace_id' => $workspace->id,
            'name' => 'Meta Cloud Device',
            'engine' => 'cloud_api',
            'meta_phone_number_id' => '104829104829104',
            'meta_access_token' => 'TEST_TOKEN',
            'status' => 'connected',
        ]);

        $metaService = app(MetaCloudApiService::class);
        $result = $metaService->sendMessage($device, '+628386012467', 'Silakan pilih menu:', null, [
            'quick_replies' => [
                ['id' => '1', 'title' => 'Administrasi'],
                ['id' => '2', 'title' => 'Pengaduan'],
                ['id' => '3', 'title' => 'Rehab'],
            ],
        ]);

        $this->assertTrue($result['success']);
        $this->assertEquals('wamid.HBgTEST123', $result['message_id']);

        Http::assertSent(function ($request) {
            $data = $request->data();

            return $request->url() === 'https://graph.facebook.com/v21.0/104829104829104/messages'
                && $data['interactive']['type'] === 'button'
                && count($data['interactive']['action']['buttons']) === 3;
        });
    }

    public function test_meta_cloud_api_service_sends_list_menu(): void
    {
        Http::fake([
            'graph.facebook.com/*' => Http::response([
                'messaging_product' => 'whatsapp',
                'messages' => [['id' => 'wamid.HBgLIST123']],
            ], 200),
        ]);

        $workspace = $this->createWorkspace('Test Workspace');
        $device = Device::create([
            'workspace_id' => $workspace->id,
            'name' => 'Meta Cloud Device',
            'engine' => 'cloud_api',
            'meta_phone_number_id' => '104829104829104',
            'meta_access_token' => 'TEST_TOKEN',
            'status' => 'connected',
        ]);

        $metaService = app(MetaCloudApiService::class);
        $result = $metaService->sendMessage($device, '+628386012467', 'Silakan buka daftar menu:', null, [
            'list_button' => '📋 Buka Menu',
            'list_sections' => [
                [
                    'title' => 'Layanan Utama',
                    'rows' => [
                        ['id' => '1', 'title' => 'Administrasi', 'description' => 'Pengurusan berkas'],
                        ['id' => '2', 'title' => 'Pengaduan', 'description' => 'Pusat keluhan'],
                        ['id' => '3', 'title' => 'Rehab', 'description' => 'Cicilan SPP'],
                        ['id' => '4', 'title' => 'PMB', 'description' => 'Pendaftaran online'],
                    ],
                ],
            ],
        ]);

        $this->assertTrue($result['success']);

        Http::assertSent(function ($request) {
            $data = $request->data();

            return $data['interactive']['type'] === 'list'
                && $data['interactive']['action']['button'] === '📋 Buka Menu'
                && count($data['interactive']['action']['sections'][0]['rows']) === 4;
        });
    }

    public function test_meta_webhook_inbound_processes_incoming_message(): void
    {
        $workspace = $this->createWorkspace('Test Workspace');
        $device = Device::create([
            'workspace_id' => $workspace->id,
            'name' => 'Meta Cloud Device',
            'engine' => 'cloud_api',
            'meta_phone_number_id' => '9988776655',
            'meta_access_token' => 'VALID_TOKEN',
            'status' => 'connected',
        ]);

        AutoReply::create([
            'workspace_id' => $workspace->id,
            'name' => 'Info Biaya',
            'keyword' => 'biaya',
            'reply_message' => 'Rincian biaya kuliah per semester adalah Rp 2.500.000.',
            'is_active' => true,
        ]);

        Http::fake([
            'graph.facebook.com/*' => Http::response(['messages' => [['id' => 'wamid.REPLY123']]], 200),
        ]);

        $payload = [
            'object' => 'whatsapp_business_account',
            'entry' => [
                [
                    'id' => 'WABA_123',
                    'changes' => [
                        [
                            'field' => 'messages',
                            'value' => [
                                'messaging_product' => 'whatsapp',
                                'metadata' => [
                                    'display_phone_number' => '628123456789',
                                    'phone_number_id' => '9988776655',
                                ],
                                'contacts' => [
                                    [
                                        'profile' => ['name' => 'Budi Santoso'],
                                        'wa_id' => '6281234567890',
                                    ],
                                ],
                                'messages' => [
                                    [
                                        'from' => '6281234567890',
                                        'id' => 'wamid.INBOUND123',
                                        'timestamp' => '1730000000',
                                        'type' => 'text',
                                        'text' => ['body' => 'biaya'],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $response = $this->postJson('/api/webhook/meta-whatsapp', $payload);
        $response->assertStatus(200);

        // Verify contact was updated with Budi Santoso
        $contact = Contact::where('workspace_id', $workspace->id)->where('phone', '+6281234567890')->first();
        $this->assertNotNull($contact);
        $this->assertEquals('Budi Santoso', $contact->name);
    }
}
