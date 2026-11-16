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
        // 1. Messages table performance composite indexes
        Schema::table('messages', function (Blueprint $table) {
            $table->index(['workspace_id', 'receiver_number', 'created_at'], 'idx_messages_ws_receiver_created');
            $table->index(['workspace_id', 'direction', 'created_at'], 'idx_messages_ws_direction_created');
        });

        // 2. AutoReplies table performance index
        Schema::table('auto_replies', function (Blueprint $table) {
            $table->index(['workspace_id', 'is_active'], 'idx_autoreplies_ws_active');
        });

        // 3. Devices table performance composite index
        Schema::table('devices', function (Blueprint $table) {
            $table->index(['workspace_id', 'status'], 'idx_devices_ws_status');
        });

        // 4. Contacts table group lookup index
        Schema::table('contacts', function (Blueprint $table) {
            $table->index(['workspace_id', 'group_id'], 'idx_contacts_ws_group');
        });

        // 5. Campaigns table workspace & status index
        Schema::table('campaigns', function (Blueprint $table) {
            $table->index(['workspace_id', 'status'], 'idx_campaigns_ws_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex('idx_messages_ws_receiver_created');
            $table->dropIndex('idx_messages_ws_direction_created');
        });

        Schema::table('auto_replies', function (Blueprint $table) {
            $table->dropIndex('idx_autoreplies_ws_active');
        });

        Schema::table('devices', function (Blueprint $table) {
            $table->dropIndex('idx_devices_ws_status');
        });

        Schema::table('contacts', function (Blueprint $table) {
            $table->dropIndex('idx_contacts_ws_group');
        });

        Schema::table('campaigns', function (Blueprint $table) {
            $table->dropIndex('idx_campaigns_ws_status');
        });
    }
};
