<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Contact extends Model
{
    use HasFactory;

    protected $fillable = [
        'workspace_id',
        'group_id',
        'name',
        'phone',
        'custom_fields',
        'is_blacklisted',
    ];

    protected function casts(): array
    {
        return [
            'custom_fields' => 'array',
            'is_blacklisted' => 'boolean',
        ];
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(ContactGroup::class, 'group_id');
    }
}
