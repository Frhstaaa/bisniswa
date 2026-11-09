<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AdminRole extends Model
{
    use HasFactory;

    protected $table = 'admin_roles';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'slug',
        'name',
        'description',
        'badge_color',
        'permissions',
        'is_system',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'permissions' => 'array',
            'is_system' => 'boolean',
        ];
    }

    /**
     * Get all staff members assigned to this role.
     *
     * @return HasMany<Admin, $this>
     */
    public function admins(): HasMany
    {
        return $this->hasMany(Admin::class, 'role', 'slug');
    }

    /**
     * Check if this role grants a specific permission.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->slug === 'superadmin' || in_array('*', $this->permissions ?? [], true)) {
            return true;
        }

        return in_array($permission, $this->permissions ?? [], true);
    }

    /**
     * Return all modular pages & system permissions available for RBAC assignment.
     *
     * @return array<string, array<string, string>>
     */
    public static function availablePermissions(): array
    {
        return [
            'manage_clients' => [
                'key' => 'manage_clients',
                'label' => 'Klien & Workspace',
                'route' => '/admin/clients',
                'icon' => 'Users',
                'description' => 'Melihat daftar klien, profil workspace tenant, dan mengaktifkan/menonaktifkan (suspend) status akun.',
                'group' => 'Operasional',
            ],
            'manage_subscriptions' => [
                'key' => 'manage_subscriptions',
                'label' => 'Langganan & Durasi',
                'route' => '/admin/subscriptions',
                'icon' => 'Calendar',
                'description' => 'Mengatur masa aktif paket langganan, perpanjangan tanggal jatuh tempo, dan top-up kuota pesan klien.',
                'group' => 'Operasional',
            ],
            'manage_payments' => [
                'key' => 'manage_payments',
                'label' => 'Pembayaran & Invoice',
                'route' => '/admin/payments',
                'icon' => 'Receipt',
                'description' => 'Melihat transaksi pembayaran, invoice langganan, dan memverifikasi transfer bank manual klien.',
                'group' => 'Keuangan',
            ],
            'manage_plans' => [
                'key' => 'manage_plans',
                'label' => 'Paket Layanan (Plans)',
                'route' => '/admin/plans',
                'icon' => 'Package',
                'description' => 'Membuat paket baru, mengubah harga bulanan/tahunan, dan mengatur batasan kuota & fitur paket.',
                'group' => 'Keuangan',
            ],
            'manage_gateways' => [
                'key' => 'manage_gateways',
                'label' => 'WhatsApp Gateway & Server',
                'route' => '/admin/gateways',
                'icon' => 'Cpu',
                'description' => 'Monitoring status microservice engine Baileys/WWebJS dan me-restart koneksi mesin yang macet.',
                'group' => 'Teknis',
            ],
            'manage_staff' => [
                'key' => 'manage_staff',
                'label' => 'Tim Staff & Akses RBAC',
                'route' => '/admin/staff',
                'icon' => 'ShieldCheck',
                'description' => 'Mengelola akun staf internal SaaS, setup grup peran baru, dan mengedit izin akses per halaman.',
                'group' => 'Keamanan',
            ],
            'manage_settings' => [
                'key' => 'manage_settings',
                'label' => 'Pengaturan Platform & Sistem',
                'route' => '/admin/settings',
                'icon' => 'Settings',
                'description' => 'Konfigurasi nama platform SaaS, nomor bantuan CS, integrasi gateway, dan parameter produksi.',
                'group' => 'Sistem',
            ],
        ];
    }
}
