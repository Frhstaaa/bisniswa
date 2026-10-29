<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutoReply extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'device_id',
        'name',
        'trigger_type',
        'keyword',
        'reply_message',
        'reply_media_url',
        'cta_text',
        'cta_url',
        'action_buttons',
        'is_active',
        'hit_count',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'hit_count' => 'integer',
            'action_buttons' => 'array',
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
