<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Default model attributes.
     *
     * @var array<string, mixed>
     */
    protected $attributes = [
        'is_active' => true,
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
        'workspace_id',
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
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    public function isSaaSStaff(): bool
    {
        return in_array($this->role, ['superadmin', 'admin', 'marketing', 'support'], true);
    }

    public function canManageStaff(): bool
    {
        return in_array($this->role, ['superadmin', 'admin'], true);
    }

    public function canManageSettings(): bool
    {
        return $this->isSuperAdmin();
    }

    public function canManagePlans(): bool
    {
        return in_array($this->role, ['superadmin', 'admin', 'marketing'], true);
    }

    public function canManagePayments(): bool
    {
        return in_array($this->role, ['superadmin', 'admin', 'marketing'], true);
    }

    public function canManageGateways(): bool
    {
        return in_array($this->role, ['superadmin', 'admin', 'support'], true);
    }

    public function canManageClients(): bool
    {
        return in_array($this->role, ['superadmin', 'admin', 'support'], true);
    }

    public function canManageSubscriptions(): bool
    {
        return in_array($this->role, ['superadmin', 'admin'], true);
    }
}
