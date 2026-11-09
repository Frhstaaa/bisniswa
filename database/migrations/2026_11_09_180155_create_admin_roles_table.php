<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('admin_roles', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 50)->unique();
            $table->string('name', 100);
            $table->text('description')->nullable();
            $table->string('badge_color', 30)->default('emerald');
            $table->json('permissions');
            $table->boolean('is_system')->default(false);
            $table->timestamps();
        });

        // Seed default roles with initial permissions
        $now = now();
        DB::table('admin_roles')->insert([
            [
                'slug' => 'superadmin',
                'name' => 'Super Administrator',
                'description' => 'Root Master — Akses penuh ke seluruh modul dan konfigurasi sistem tanpa batasan.',
                'badge_color' => 'amber',
                'permissions' => json_encode(['*']),
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'admin',
                'name' => 'Admin Operasional',
                'description' => 'Manajemen harian klien, langganan, verifikasi pembayaran, paket layanan, dan monitoring gateway.',
                'badge_color' => 'emerald',
                'permissions' => json_encode([
                    'manage_clients',
                    'manage_subscriptions',
                    'manage_payments',
                    'manage_plans',
                    'manage_gateways',
                    'manage_staff',
                ]),
                'is_system' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'marketing',
                'name' => 'Marketing & Billing',
                'description' => 'Pengelolaan paket langganan, peninjauan tagihan invoice pembayaran, dan data klien.',
                'badge_color' => 'blue',
                'permissions' => json_encode([
                    'manage_plans',
                    'manage_payments',
                ]),
                'is_system' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'slug' => 'support',
                'name' => 'Customer Support',
                'description' => 'Bantuan klien, pemecahan masalah sesi gateway WhatsApp, dan monitoring perangkat.',
                'badge_color' => 'purple',
                'permissions' => json_encode([
                    'manage_clients',
                    'manage_gateways',
                ]),
                'is_system' => false,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_roles');
    }
};
