<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
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
