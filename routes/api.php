<?php

use App\Http\Controllers\Api\EmailValidationController;
use App\Http\Controllers\Api\InternalGatewayWebhookController;
use App\Http\Controllers\Api\MetaWebhookController;
use App\Http\Controllers\Api\V1\MessageApiController;
use Illuminate\Support\Facades\Route;

// Public Real-time Email Validity Checker (Rate Limited for Anti-Enumeration)
Route::post('/check-email', [EmailValidationController::class, 'check'])->middleware('throttle:20,1');

// Meta WhatsApp Business Cloud API Webhooks
Route::get('/webhook/meta-whatsapp', [MetaWebhookController::class, 'verify']);
Route::post('/webhook/meta-whatsapp', [MetaWebhookController::class, 'handle']);

Route::prefix('v1')->middleware('throttle:60,1')->group(function () {
    Route::get('/quota', [MessageApiController::class, 'quota']);
    Route::get('/status', [MessageApiController::class, 'quota']);
    Route::post('/messages/send', [MessageApiController::class, 'send']);
    Route::post('/messages/send-media', [MessageApiController::class, 'send']);
});

// Internal Microservice Webhooks (Protected by X-Internal-Secret)
Route::prefix('internal')->group(function () {
    Route::post('/devices/webhook', [InternalGatewayWebhookController::class, 'deviceStatusWebhook']);
    Route::post('/messages/receive', [InternalGatewayWebhookController::class, 'receiveMessageWebhook']);
});
