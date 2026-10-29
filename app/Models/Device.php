<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'phone_number',
        'name',
        'engine',
        'meta_phone_number_id',
        'meta_access_token',
        'meta_waba_id',
        'meta_verify_token',
        'status',
        'qr_code',
        'battery_level',
        'last_connected_at',
    ];

    public function isCloudApi(): bool
    {
        return $this->engine === 'cloud_api';
    }

    protected function casts(): array
    {
        return [
            'last_connected_at' => 'datetime',
            'battery_level' => 'integer',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(Campaign::class);
    }
}
