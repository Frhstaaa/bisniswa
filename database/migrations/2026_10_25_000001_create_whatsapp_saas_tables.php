<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Workspaces (Tenants)
        Schema::create('workspaces', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('phone')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 2. Add workspace & role to users
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('workspace_id')->nullable()->constrained('workspaces')->nullOnDelete();
            $table->string('role')->default('client'); // superadmin, owner, admin, operator
            $table->string('phone')->nullable();
            $table->string('avatar_url')->nullable();
        });

        // 3. Plans
        Schema::create('plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->decimal('price_monthly', 12, 2)->default(0);
            $table->decimal('price_annually', 12, 2)->default(0);
            $table->jsonb('limits'); // max_devices, monthly_message_quota, daily_broadcast_limit, max_contacts, api_rate_limit_per_minute
            $table->jsonb('features'); // webhook_access, schedule_broadcast, auto_reply, spintax_enabled, etc.
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // 4. Subscriptions
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('plans');
            $table->string('status')->default('active'); // active, grace_period, suspended, paused, terminated
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at');
            $table->integer('grace_period_days')->default(3);
            $table->timestampTz('paused_at')->nullable();
            $table->integer('monthly_message_quota')->default(5000);
            $table->integer('remaining_message_quota')->default(5000);
            $table->timestamps();

            $table->index(['status', 'ends_at']);
        });

        // 5. Subscription Audits (Admin Duration Adjustments & Quota Topups)
        Schema::create('subscription_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $table->foreignId('admin_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action'); // EXTEND_DAYS, REDUCE_DAYS, SET_DATES, TOPUP_QUOTA, PAUSE, RESUME
            $table->jsonb('previous_value');
            $table->jsonb('new_value');
            $table->text('reason');
            $table->timestamps();
        });

        // 6. Devices (WhatsApp Sessions)
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('phone_number')->nullable();
            $table->string('name');
            $table->string('engine')->default('wwebjs'); // wwebjs | baileys
            $table->string('status')->default('disconnected'); // disconnected, qr_ready, connecting, connected
            $table->text('qr_code')->nullable();
            $table->integer('battery_level')->nullable();
            $table->timestamp('last_connected_at')->nullable();
            $table->timestamps();
        });

        // 7. Contact Groups & Contacts
        Schema::create('contact_groups', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('contacts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('group_id')->nullable()->constrained('contact_groups')->nullOnDelete();
            $table->string('name');
            $table->string('phone');
            $table->jsonb('custom_fields')->nullable();
            $table->boolean('is_blacklisted')->default(false);
            $table->timestamps();

            $table->index(['workspace_id', 'phone']);
        });

        // 8. Campaigns & Broadcasts
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained('devices')->nullOnDelete();
            $table->string('name');
            $table->text('message');
            $table->string('media_url')->nullable();
            $table->integer('total_recipients')->default(0);
            $table->integer('sent_count')->default(0);
            $table->integer('failed_count')->default(0);
            $table->integer('min_delay_seconds')->default(8);
            $table->integer('max_delay_seconds')->default(18);
            $table->string('status')->default('draft'); // draft, scheduled, processing, paused, completed, cancelled
            $table->timestampTz('scheduled_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->timestamps();
        });

        // 9. Messages
        Schema::create('messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('device_id')->nullable()->constrained('devices')->nullOnDelete();
            $table->foreignId('campaign_id')->nullable()->constrained('campaigns')->nullOnDelete();
            $table->string('direction')->default('outbound'); // outbound | inbound
            $table->string('receiver_number');
            $table->string('message_type')->default('text'); // text, media, document, button
            $table->text('content');
            $table->string('media_url')->nullable();
            $table->string('status')->default('queued'); // queued, sending, sent, delivered, read, failed
            $table->text('error_message')->nullable();
            $table->string('external_id')->nullable();
            $table->timestampTz('scheduled_at')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
            $table->index(['workspace_id', 'created_at']);
        });

        // 10. API Keys
        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('name');
            $table->string('key_hash', 64)->unique(); // SHA-256
            $table->string('prefix', 12)->default('bk_live_');
            $table->jsonb('scopes'); // ["messages:send", "devices:read", "contacts:manage"]
            $table->jsonb('ip_whitelist')->nullable();
            $table->timestampTz('last_used_at')->nullable();
            $table->timestamps();
        });

        // 11. Webhooks
        Schema::create('webhooks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->string('url');
            $table->string('secret');
            $table->jsonb('events'); // ["message.received", "message.status", "device.status"]
            $table->boolean('is_active')->default(true);
            $table->timestampTz('last_triggered_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webhooks');
        Schema::dropIfExists('api_keys');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('campaigns');
        Schema::dropIfExists('contacts');
        Schema::dropIfExists('contact_groups');
        Schema::dropIfExists('devices');
        Schema::dropIfExists('subscription_audits');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['workspace_id']);
            $table->dropColumn(['workspace_id', 'role', 'phone', 'avatar_url']);
        });
        Schema::dropIfExists('workspaces');
    }
};
