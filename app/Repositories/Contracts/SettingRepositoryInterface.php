<?php

namespace App\Repositories\Contracts;

interface SettingRepositoryInterface
{
    /**
     * Retrieve all settings grouped by group category.
     *
     * @return array<string, array<string, mixed>>
     */
    public function getAllGrouped(): array;

    /**
     * Update a batch of settings.
     *
     * @param  array<string, mixed>  $settings
     */
    public function updateBatch(array $settings): void;

    /**
     * Get a specific setting value.
     */
    public function get(string $key, mixed $default = null): mixed;
}
