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
        Schema::create('admins', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('admin'); // superadmin, admin, marketing, support
            $table->string('phone')->nullable();
            $table->string('avatar_url')->nullable();
            $table->boolean('is_active')->default(true);
            $table->rememberToken();
            $table->timestamps();
        });

        // Migrate existing SaaS staff / superadmin accounts from users table to admins table
        if (Schema::hasTable('users')) {
            $staffUsers = DB::table('users')
                ->whereIn('role', ['superadmin', 'admin', 'marketing', 'support'])
                ->get();

            foreach ($staffUsers as $staff) {
                DB::table('admins')->insertOrIgnore([
                    'id' => $staff->id,
                    'name' => $staff->name,
                    'email' => $staff->email,
                    'password' => $staff->password,
                    'role' => $staff->role,
                    'phone' => $staff->phone ?? null,
                    'avatar_url' => $staff->avatar_url ?? null,
                    'is_active' => $staff->is_active ?? true,
                    'created_at' => $staff->created_at ?? now(),
                    'updated_at' => $staff->updated_at ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};
