<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    use HasFactory;

    /**
     * In-memory static cache for ultra-fast zero-query lookups per request lifecycle.
     *
     * @var array<string, mixed>
     */
    protected static array $memoryCache = [];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'key',
        'value',
        'group',
        'description',
    ];

    /**
     * Retrieve a setting value by key with multi-tier caching (Memory + Application Cache).
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        if (app()->runningUnitTests()) {
            $setting = static::where('key', $key)->first();

            return $setting ? $setting->value : $default;
        }

        if (array_key_exists($key, static::$memoryCache)) {
            return static::$memoryCache[$key];
        }

        $value = Cache::remember("sys_setting_{$key}", 3600, function () use ($key) {
            $setting = static::where('key', $key)->first();

            return $setting ? $setting->value : '__SYS_SETTING_NOT_FOUND__';
        });

        if ($value === '__SYS_SETTING_NOT_FOUND__') {
            static::$memoryCache[$key] = $default;

            return $default;
        }

        static::$memoryCache[$key] = $value;

        return $value;
    }

    /**
     * Set or update a setting value by key and refresh multi-tier caches.
     */
    public static function set(string $key, mixed $value, ?string $group = 'general', ?string $description = null): static
    {
        $stringValue = is_array($value) ? json_encode($value) : (string) $value;

        $record = static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $stringValue,
                'group' => $group ?? 'general',
                'description' => $description,
            ]
        );

        static::$memoryCache[$key] = $stringValue;
        Cache::put("sys_setting_{$key}", $stringValue, 3600);

        return $record;
    }

    /**
     * Flush memory and repository cache for settings.
     */
    public static function clearCache(?string $key = null): void
    {
        if ($key) {
            unset(static::$memoryCache[$key]);
            Cache::forget("sys_setting_{$key}");
        } else {
            static::$memoryCache = [];
        }
    }
}
