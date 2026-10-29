<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'device_id',
        'name',
        'key_hash',
        'prefix',
        'scopes',
        'ip_whitelist',
        'last_used_at',
    ];

    protected function casts(): array
    {
        return [
            'scopes' => 'array',
            'ip_whitelist' => 'array',
            'last_used_at' => 'datetime',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class);
    }
}
