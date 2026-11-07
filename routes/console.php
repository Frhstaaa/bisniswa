<?php

use Illuminate\Foundation\DevCommands;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

if (class_exists(DevCommands::class)) {
    DevCommands::artisan('serve', 'server');
}

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
