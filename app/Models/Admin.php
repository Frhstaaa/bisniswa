<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'admins';

    /**
     * Default model attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_active' => true,
        'role' => 'admin',
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'avatar_url',
        'is_active',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get the dynamic RBAC role definition for this admin.
     *
     * @return BelongsTo<AdminRole, $this>
     */
    public function adminRole(): BelongsTo
    {
        return $this->belongsTo(AdminRole::class, 'role', 'slug');
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isSaaSStaff(): bool
    {
        return ! empty($this->role);
    }

    /**
     * Dynamically check if this admin has permission for a specific page/module.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (! $this->is_active) {
            return false;
        }

        $roleModel = AdminRole::where('slug', $this->role)->first();

        if ($roleModel) {
            return $roleModel->hasPermission($permission);
        }

        return false;
    }

    public function canManageStaff(): bool
    {
        return $this->hasPermission('manage_staff');
    }

    public function canManageSettings(): bool
    {
        return $this->hasPermission('manage_settings');
    }

    public function canManagePlans(): bool
    {
        return $this->hasPermission('manage_plans');
    }

    public function canManagePayments(): bool
    {
        return $this->hasPermission('manage_payments');
    }

    public function canManageGateways(): bool
    {
        return $this->hasPermission('manage_gateways');
    }

    public function canManageClients(): bool
    {
        return $this->hasPermission('manage_clients');
    }

    public function canManageSubscriptions(): bool
    {
        return $this->hasPermission('manage_subscriptions');
    }
}
