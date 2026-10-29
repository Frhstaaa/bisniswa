<?php

namespace App\Repositories\Eloquent;

use App\Models\SystemSetting;
use App\Repositories\Contracts\SettingRepositoryInterface;

class SettingRepository implements SettingRepositoryInterface
{
    /**
     * Retrieve all settings grouped by group category.
     *
     * @return array<string, array<string, mixed>>
     */
    public function getAllGrouped(): array
    {
        $all = SystemSetting::all();
        $grouped = [];

        foreach ($all as $item) {
            $value = $item->value;
            // Attempt json decode if valid
            $decoded = json_decode($value, true);
            if (json_last_error() === JSON_ERROR_NONE && (is_array($decoded) || is_object($decoded))) {
                $value = $decoded;
            }

            $grouped[$item->group][$item->key] = [
                'value' => $value,
                'description' => $item->description,
            ];
        }

        return $grouped;
    }

    /**
     * Update a batch of settings.
     *
     * @param  array<string, mixed>  $settings
     */
    public function updateBatch(array $settings): void
    {
        foreach ($settings as $key => $value) {
            $stringValue = is_array($value) ? json_encode($value) : (string) $value;
            SystemSetting::where('key', $key)->update(['value' => $stringValue]);
        }
    }

    /**
     * Get a specific setting value.
     */
    public function get(string $key, mixed $default = null): mixed
    {
        return SystemSetting::get($key, $default);
    }
}
