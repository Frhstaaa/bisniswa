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
        // 1. Payments / Invoices table
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('workspace_id')->constrained('workspaces')->cascadeOnDelete();
            $table->foreignId('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->foreignId('plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('payment_method')->default('bank_transfer'); // bank_transfer, qris, manual_admin, etc.
            $table->string('status')->default('pending'); // pending, paid, failed, expired
            $table->timestampTz('paid_at')->nullable();
            $table->string('proof_url')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['workspace_id', 'status']);
            $table->index(['status', 'created_at']);
        });

        // 2. System Settings table
        Schema::create('system_settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('group')->default('general'); // general, whatsapp, throttle, payment, notification
            $table->string('description')->nullable();
            $table->timestamps();

            $table->index('group');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_settings');
        Schema::dropIfExists('payments');
    }
};
