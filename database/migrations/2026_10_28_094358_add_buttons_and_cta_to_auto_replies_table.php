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
        Schema::table('auto_replies', function (Blueprint $table) {
            $table->string('cta_text', 100)->nullable()->after('reply_media_url');
            $table->string('cta_url', 500)->nullable()->after('cta_text');
            $table->json('action_buttons')->nullable()->after('cta_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auto_replies', function (Blueprint $table) {
            $table->dropColumn(['cta_text', 'cta_url', 'action_buttons']);
        });
    }
};
