<?php

namespace Database\Seeders;

use App\Models\ApiKey;
use App\Models\Device;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\SubscriptionAudit;
use App\Models\SystemSetting;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Workspace
        $workspace = Workspace::firstOrCreate([
            'slug' => 'digital-sukses-mandiri',
        ], [
            'uuid' => (string) Str::uuid(),
            'name' => 'PT Digital Sukses Mandiri',
            'phone' => '+6281298430911',
            'is_active' => true,
        ]);

        // 2. Create Super Admin & Workspace Owner
        $admin = User::firstOrCreate([
            'email' => 'admin@kirimwa.pro',
        ], [
            'name' => 'Super Administrator',
            'password' => bcrypt('password'),
            'role' => 'superadmin',
            'workspace_id' => $workspace->id,
            'phone' => '+6281298430911',
        ]);

        // 3. Create Plans
        $planStarter = Plan::firstOrCreate(['slug' => 'starter'], [
            'name' => 'Starter Lite',
            'price_monthly' => 99000,
            'price_annually' => 990000,
            'limits' => [
                'max_devices' => 1,
                'monthly_message_quota' => 5000,
                'daily_broadcast_limit' => 500,
                'max_contacts' => 1000,
                'api_rate_limit_per_minute' => 30,
            ],
            'features' => [
                'webhook_access' => false,
                'schedule_broadcast' => false,
                'auto_reply' => true,
                'spintax_enabled' => false,
            ],
        ]);

        $planProBisnis = Plan::firstOrCreate(['slug' => 'pro-bisnis'], [
            'name' => 'Pro Bisnis',
            'price_monthly' => 179000,
            'price_annually' => 1790000,
            'limits' => [
                'max_devices' => 3,
                'monthly_message_quota' => 15000,
                'daily_broadcast_limit' => 1500,
                'max_contacts' => 5000,
                'api_rate_limit_per_minute' => 60,
            ],
            'features' => [
                'webhook_access' => true,
                'schedule_broadcast' => true,
                'auto_reply' => true,
                'spintax_enabled' => true,
            ],
        ]);

        $planPro = Plan::firstOrCreate(['slug' => 'enterprise-pro'], [
            'name' => 'Enterprise Pro',
            'price_monthly' => 299000,
            'price_annually' => 2890000,
            'limits' => [
                'max_devices' => 5,
                'monthly_message_quota' => 50000,
                'daily_broadcast_limit' => 5000,
                'max_contacts' => 25000,
                'api_rate_limit_per_minute' => 120,
            ],
            'features' => [
                'webhook_access' => true,
                'schedule_broadcast' => true,
                'auto_reply' => true,
                'spintax_enabled' => true,
            ],
        ]);

        // 4. Create Active Subscription (Ends in 24 days)
        $startsAt = now()->subDays(6);
        $endsAt = now()->addDays(24);

        $subscription = Subscription::firstOrCreate([
            'workspace_id' => $workspace->id,
        ], [
            'plan_id' => $planPro->id,
            'status' => 'active',
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'grace_period_days' => 3,
            'monthly_message_quota' => 50000,
            'remaining_message_quota' => 38450,
        ]);

        // 5. Create Subscription Audits
        SubscriptionAudit::firstOrCreate([
            'subscription_id' => $subscription->id,
            'action' => 'EXTEND_DAYS',
            'reason' => 'Perpanjangan bulanan via Invoice #INV-8812 (Paid)',
        ], [
            'admin_user_id' => $admin->id,
            'previous_value' => ['ends_at' => $startsAt->toIso8601String()],
            'new_value' => ['ends_at' => $endsAt->toIso8601String(), 'days_adjusted' => 30],
        ]);

        SubscriptionAudit::firstOrCreate([
            'subscription_id' => $subscription->id,
            'action' => 'TOPUP_QUOTA',
            'reason' => 'Bonus promo pendaftaran awal Majalengka',
        ], [
            'admin_user_id' => $admin->id,
            'previous_value' => ['remaining_message_quota' => 28450],
            'new_value' => ['remaining_message_quota' => 38450, 'added' => 10000],
        ]);

        // 6. Create Connected Devices (wwebjs and baileys)
        $device1 = Device::firstOrCreate([
            'workspace_id' => $workspace->id,
            'phone_number' => '+6281298430911',
        ], [
            'name' => 'CS Toko Online Utama',
            'engine' => 'wwebjs',
            'status' => 'connected',
            'battery_level' => 88,
            'last_connected_at' => now()->subMinutes(12),
        ]);

        $device2 = Device::firstOrCreate([
            'workspace_id' => $workspace->id,
            'phone_number' => '+6285811209943',
        ], [
            'name' => 'OTP Notifier Server',
            'engine' => 'baileys',
            'status' => 'connected',
            'battery_level' => 100,
            'last_connected_at' => now()->subMinutes(4),
        ]);

        // 7. Seed Recent Messages
        Message::firstOrCreate([
            'external_id' => 'MSG_SEED_1',
        ], [
            'workspace_id' => $workspace->id,
            'device_id' => $device1->id,
            'direction' => 'outbound',
            'receiver_number' => '+6285223491823',
            'message_type' => 'text',
            'content' => 'Halo Kak Budi, pesanan #INV-291 telah dikirim via JNE. No Resi: JNE019283749. Terima kasih telah berbelanja!',
            'status' => 'delivered',
            'sent_at' => now()->subMinutes(14),
        ]);

        Message::firstOrCreate([
            'external_id' => 'MSG_SEED_2',
        ], [
            'workspace_id' => $workspace->id,
            'device_id' => $device2->id,
            'direction' => 'outbound',
            'receiver_number' => '+6281987123910',
            'message_type' => 'text',
            'content' => 'Kode OTP Verifikasi Anda adalah 849182. Berlaku selama 5 menit. JANGAN berikan kode ini kepada siapapun.',
            'status' => 'read',
            'sent_at' => now()->subMinutes(28),
        ]);

        // 8. Seed API Key
        $sampleKey = 'bk_live_84f93820948192830192837465928192';
        ApiKey::firstOrCreate([
            'workspace_id' => $workspace->id,
            'name' => 'Production ERP Backend',
        ], [
            'key_hash' => hash('sha256', $sampleKey),
            'prefix' => 'bk_live_',
            'scopes' => ['messages:send', 'devices:read'],
            'last_used_at' => now()->subMinutes(5),
        ]);

        // 9. Additional Workspaces / Clients for Super Admin Showcase
        $client2 = Workspace::firstOrCreate(['slug' => 'kampus-mardira'], [
            'uuid' => (string) Str::uuid(),
            'name' => 'Politeknik Mardira Indonesia (Pusat Data)',
            'phone' => '+6282219800212',
            'is_active' => true,
        ]);
        User::firstOrCreate(['email' => 'baak@mardira.ac.id'], [
            'name' => 'BAAK Kampus Mardira',
            'password' => bcrypt('password'),
            'role' => 'client',
            'workspace_id' => $client2->id,
            'phone' => '+6282219800212',
        ]);
        $sub2 = Subscription::firstOrCreate(['workspace_id' => $client2->id], [
            'plan_id' => $planPro->id,
            'status' => 'active',
            'starts_at' => now()->subDays(10),
            'ends_at' => now()->addDays(355),
            'grace_period_days' => 3,
            'monthly_message_quota' => 50000,
            'remaining_message_quota' => 47200,
        ]);
        Device::firstOrCreate(['phone_number' => '+6282219800212'], [
            'workspace_id' => $client2->id,
            'name' => 'Server Siakad & Broadcast Mahasiswa',
            'engine' => 'wwebjs',
            'status' => 'connected',
            'battery_level' => 95,
            'last_connected_at' => now()->subMinutes(8),
        ]);

        $client3 = Workspace::firstOrCreate(['slug' => 'cv-majalengka-berkah'], [
            'uuid' => (string) Str::uuid(),
            'name' => 'CV Majalengka Berkah Abadi',
            'phone' => '+6281312345678',
            'is_active' => true,
        ]);
        User::firstOrCreate(['email' => 'owner@majalengkaberkah.com'], [
            'name' => 'H. Asep Kurniawan',
            'password' => bcrypt('password'),
            'role' => 'client',
            'workspace_id' => $client3->id,
            'phone' => '+6281312345678',
        ]);
        $sub3 = Subscription::firstOrCreate(['workspace_id' => $client3->id], [
            'plan_id' => $planStarter->id,
            'status' => 'active',
            'starts_at' => now()->subDays(2),
            'ends_at' => now()->addDays(28),
            'grace_period_days' => 3,
            'monthly_message_quota' => 5000,
            'remaining_message_quota' => 4920,
        ]);

        $client4 = Workspace::firstOrCreate(['slug' => 'klinik-pratama-sehat'], [
            'uuid' => (string) Str::uuid(),
            'name' => 'Klinik Pratama Sehat Medika',
            'phone' => '+6281987654321',
            'is_active' => true,
        ]);
        User::firstOrCreate(['email' => 'admin@sehatmedika.id'], [
            'name' => 'dr. Nita Anggraeni',
            'password' => bcrypt('password'),
            'role' => 'client',
            'workspace_id' => $client4->id,
            'phone' => '+6281987654321',
        ]);
        $sub4 = Subscription::firstOrCreate(['workspace_id' => $client4->id], [
            'plan_id' => $planStarter->id,
            'status' => 'grace_period',
            'starts_at' => now()->subDays(31),
            'ends_at' => now()->subDays(1),
            'grace_period_days' => 3,
            'monthly_message_quota' => 5000,
            'remaining_message_quota' => 120,
        ]);

        // 10. Payments / Invoices Seed
        Payment::firstOrCreate(['invoice_number' => 'INV-202610-001'], [
            'workspace_id' => $workspace->id,
            'subscription_id' => $subscription->id,
            'plan_id' => $planPro->id,
            'amount' => 299000,
            'payment_method' => 'bank_transfer',
            'status' => 'paid',
            'paid_at' => now()->subDays(6),
            'notes' => 'Pembayaran lunas via Transfer Bank Mandiri',
        ]);

        Payment::firstOrCreate(['invoice_number' => 'INV-202610-002'], [
            'workspace_id' => $client2->id,
            'subscription_id' => $sub2->id,
            'plan_id' => $planPro->id,
            'amount' => 2890000,
            'payment_method' => 'bank_transfer',
            'status' => 'paid',
            'paid_at' => now()->subDays(10),
            'notes' => 'Pembayaran Tahunan Enterprise Pro Kampus Mardira',
        ]);

        Payment::firstOrCreate(['invoice_number' => 'INV-202610-003'], [
            'workspace_id' => $client3->id,
            'subscription_id' => $sub3->id,
            'plan_id' => $planStarter->id,
            'amount' => 99000,
            'payment_method' => 'qris',
            'status' => 'pending',
            'notes' => 'Menunggu verifikasi pembayaran QRIS otomatis',
        ]);

        Payment::firstOrCreate(['invoice_number' => 'INV-202610-004'], [
            'workspace_id' => $client4->id,
            'subscription_id' => $sub4->id,
            'plan_id' => $planStarter->id,
            'amount' => 99000,
            'payment_method' => 'manual_admin',
            'status' => 'pending',
            'notes' => 'Tagihan perpanjangan grace period klinik',
        ]);

        // 11. System Settings Seed for Production Readiness
        $settings = [
            // General & Branding
            ['key' => 'platform_name', 'value' => 'MARDIRA WA Gateway', 'group' => 'general', 'description' => 'Nama brand portal resmi WhatsApp Gateway.'],
            ['key' => 'organization_name', 'value' => 'Politeknik Mardira Indonesia', 'group' => 'general', 'description' => 'Nama institusi/organisasi pengelola SaaS.'],
            ['key' => 'support_phone', 'value' => '+6281298430911', 'group' => 'general', 'description' => 'Nomor WhatsApp resmi Customer Support.'],
            ['key' => 'support_email', 'value' => 'helpdesk@mardira.ac.id', 'group' => 'general', 'description' => 'Email bantuan operasional klien.'],
            ['key' => 'maintenance_mode', 'value' => 'false', 'group' => 'general', 'description' => 'Status pemeliharaan darurat platform (true/false).'],

            // WhatsApp Microservice & Cluster
            ['key' => 'whatsapp_gateway_endpoint', 'value' => 'http://127.0.0.1:3000', 'group' => 'whatsapp', 'description' => 'Endpoint REST/WebSocket Node.js Cluster.'],
            ['key' => 'default_engine', 'value' => 'wwebjs', 'group' => 'whatsapp', 'description' => 'Engine bawaan default untuk sesi baru (BisnisWA UltraSync Engine).'],
            ['key' => 'cluster_heartbeat_interval', 'value' => '15', 'group' => 'whatsapp', 'description' => 'Interval ping monitor socket gateway dalam detik.'],
            ['key' => 'max_sessions_per_node', 'value' => '50', 'group' => 'whatsapp', 'description' => 'Batas maksimal instance WhatsApp per node microservice.'],

            // Anti-Ban & Quota Throttle
            ['key' => 'default_min_delay', 'value' => '8', 'group' => 'throttle', 'description' => 'Jeda minimum pengiriman broadcast pesan acak (detik).'],
            ['key' => 'default_max_delay', 'value' => '18', 'group' => 'throttle', 'description' => 'Jeda maksimum pengiriman broadcast pesan acak (detik).'],
            ['key' => 'default_grace_period_days', 'value' => '3', 'group' => 'throttle', 'description' => 'Toleransi masa tenggang langganan sebelum suspend.'],
            ['key' => 'trial_quota', 'value' => '500', 'group' => 'throttle', 'description' => 'Kuota pesan gratis otomatis bagi pendaftar baru.'],
            ['key' => 'max_messages_per_hour', 'value' => '300', 'group' => 'throttle', 'description' => 'Throughput aman per perangkat untuk proteksi banned.'],

            // Payment Gateways & Manual Accounts
            ['key' => 'payment_gateway_provider', 'value' => 'manual_transfer', 'group' => 'payment', 'description' => 'Provider aktif: manual_transfer, midtrans, atau xendit.'],
            ['key' => 'bank_bca_account', 'value' => 'BCA 819-203-912 a/n Politeknik Mardira Indonesia', 'group' => 'payment', 'description' => 'Rekening transfer Bank BCA.'],
            ['key' => 'bank_mandiri_account', 'value' => 'Mandiri 132-001-928-374 a/n Yayasan Mardira', 'group' => 'payment', 'description' => 'Rekening transfer Bank Mandiri.'],
            ['key' => 'midtrans_server_key', 'value' => 'SB-Mid-server-PRD8912048X', 'group' => 'payment', 'description' => 'Server Key Midtrans Snap API (Production/Sandbox).'],
            ['key' => 'midtrans_client_key', 'value' => 'SB-Mid-client-KL91823901', 'group' => 'payment', 'description' => 'Client Key Midtrans JS SDK.'],
        ];

        foreach ($settings as $setting) {
            SystemSetting::updateOrCreate(
                ['key' => $setting['key']],
                [
                    'value' => $setting['value'],
                    'group' => $setting['group'],
                    'description' => $setting['description'],
                ]
            );
        }
    }
}
