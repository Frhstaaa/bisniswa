<?php

use App\Http\Controllers\Admin\AdminClientController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\AdminGatewayController;
use App\Http\Controllers\Admin\AdminPaymentController;
use App\Http\Controllers\Admin\AdminPlanController;
use App\Http\Controllers\Admin\AdminSettingController;
use App\Http\Controllers\Admin\AdminStaffController;
use App\Http\Controllers\Admin\AdminSubscriptionController;
use App\Http\Controllers\ApiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AutoReplyController;
use App\Http\Controllers\BroadcastController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\InboxController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SubscriptionController;
use Illuminate\Support\Facades\Route;

// Public Landing Page & Dedicated Feature Pages
Route::get('/', [LandingController::class, 'index'])->name('home');
Route::get('/cara-pakai', [LandingController::class, 'howItWorks'])->name('landing.cara-pakai');
Route::get('/dual-engine', [LandingController::class, 'dualEngine'])->name('landing.dual-engine');
Route::get('/rest-api', [LandingController::class, 'restApi'])->name('landing.rest-api');
Route::get('/harga', [LandingController::class, 'pricing'])->name('landing.pricing');
Route::get('/paket-harga', [LandingController::class, 'pricing'])->name('landing.paket-harga');
Route::get('/faq', [LandingController::class, 'faq'])->name('landing.faq');

// Authentication
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1');
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:5,1');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

// Password Reset via Email
Route::get('/forgot-password', [PasswordResetController::class, 'showForgotPassword'])->name('password.request');
Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLinkEmail'])->name('password.email')->middleware('throttle:6,1');
Route::get('/reset-password/{token}', [PasswordResetController::class, 'showResetPassword'])->name('password.reset');
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])->name('password.update')->middleware('throttle:6,1');

// Authenticated Client / Tenant Dashboard SPA
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Devices
    Route::get('/devices', [DeviceController::class, 'index'])->name('devices.index');
    Route::post('/devices', [DeviceController::class, 'store'])->name('devices.store');
    Route::get('/devices/{id}/status', [DeviceController::class, 'status'])->name('devices.status');
    Route::put('/devices/{id}', [DeviceController::class, 'update'])->name('devices.update');
    Route::post('/devices/{id}/connect', [DeviceController::class, 'simulateConnect'])->name('devices.connect');
    Route::delete('/devices/{id}', [DeviceController::class, 'destroy'])->name('devices.destroy');

    // Broadcast / Campaigns
    Route::get('/broadcast', [BroadcastController::class, 'index'])->name('broadcast.index');
    Route::post('/broadcast', [BroadcastController::class, 'store'])->name('broadcast.store');
    Route::post('/broadcast/{id}/toggle-pause', [BroadcastController::class, 'togglePause'])->name('broadcast.toggle-pause');
    Route::get('/broadcast/{id}/export', [BroadcastController::class, 'exportCsv'])->name('broadcast.export');

    // Contacts & Audiences (CRM)
    Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
    Route::post('/contacts', [ContactController::class, 'storeContact'])->name('contacts.store');
    Route::put('/contacts/{id}', [ContactController::class, 'updateContact'])->name('contacts.update');
    Route::delete('/contacts/{id}', [ContactController::class, 'destroyContact'])->name('contacts.destroy');
    Route::post('/contacts/groups', [ContactController::class, 'storeGroup'])->name('contacts.groups.store');
    Route::put('/contacts/groups/{id}', [ContactController::class, 'updateGroup'])->name('contacts.groups.update');
    Route::delete('/contacts/groups/{id}', [ContactController::class, 'destroyGroup'])->name('contacts.groups.destroy');
    Route::post('/contacts/import', [ContactController::class, 'importCsv'])->name('contacts.import');

    // Auto-Reply & Gemini AI Bot
    Route::get('/auto-reply', [AutoReplyController::class, 'index'])->name('auto-reply.index');
    Route::post('/auto-reply/master-toggle', [AutoReplyController::class, 'toggleMaster'])->name('auto-reply.master-toggle');
    Route::post('/auto-reply', [AutoReplyController::class, 'store'])->name('auto-reply.store');
    Route::put('/auto-reply/{id}', [AutoReplyController::class, 'update'])->name('auto-reply.update');
    Route::post('/auto-reply/{id}/toggle', [AutoReplyController::class, 'toggle'])->name('auto-reply.toggle');
    Route::delete('/auto-reply/{id}', [AutoReplyController::class, 'destroy'])->name('auto-reply.destroy');
    Route::post('/auto-reply/menu-config', [AutoReplyController::class, 'updateMenuConfig'])->name('auto-reply.menu-config');
    Route::post('/auto-reply/seed-templates', [AutoReplyController::class, 'seedTemplateRules'])->name('auto-reply.seed-templates');
    Route::post('/auto-reply/ai-config', [AutoReplyController::class, 'updateAiConfig'])->name('auto-reply.ai-config');
    Route::post('/auto-reply/simulate', [AutoReplyController::class, 'simulate'])->name('auto-reply.simulate');

    // Live Chat Inbox (Shared Team Inbox)
    Route::get('/inbox', [InboxController::class, 'index'])->name('inbox.index');
    Route::post('/inbox/send', [InboxController::class, 'sendMessage'])->name('inbox.send');
    Route::get('/inbox/sync', [InboxController::class, 'sync'])->name('inbox.sync');
    Route::get('/inbox/conversation-messages', [InboxController::class, 'conversationMessages'])->name('inbox.conversation-messages');

    // Subscription & Automated Checkout
    Route::get('/subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::get('/subscriptions/invoice/{invoice_number}', [SubscriptionController::class, 'showInvoice'])->name('subscriptions.invoice');
    Route::post('/subscriptions/checkout', [SubscriptionController::class, 'checkout'])->name('subscriptions.checkout');

    // Superadmin Subscription Adjustments (Protected)
    Route::middleware('superadmin')->group(function () {
        Route::post('/subscriptions/adjust-duration', [SubscriptionController::class, 'adjustDuration'])->name('subscriptions.adjust-duration');
        Route::post('/subscriptions/set-custom-dates', [SubscriptionController::class, 'setCustomDates'])->name('subscriptions.set-custom-dates');
        Route::post('/subscriptions/topup-quota', [SubscriptionController::class, 'topupQuota'])->name('subscriptions.topup-quota');
        Route::post('/subscriptions/toggle-pause', [SubscriptionController::class, 'togglePause'])->name('subscriptions.toggle-pause');
    });

    // API & Webhooks
    Route::get('/api-access', [ApiController::class, 'index'])->name('api.index');
    Route::get('/api-access/download-postman', [ApiController::class, 'downloadPostmanCollection'])->name('api.download-postman');
    Route::get('/api-access/download-docs', [ApiController::class, 'downloadDocs'])->name('api.download-docs');
    Route::post('/api-access/test-ping', [ApiController::class, 'testWebhookPing'])->name('api.test-ping');
    Route::post('/api-access/keys', [ApiController::class, 'generateApiKey'])->name('api.keys.store');
    Route::delete('/api-access/keys/{id}', [ApiController::class, 'deleteApiKey'])->name('api.keys.destroy');
    Route::post('/api-access/webhooks', [ApiController::class, 'saveWebhook'])->name('api.webhooks.store');

    // Profile & Account Settings
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::post('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
});

// ==========================================
// Super Admin SaaS Management Routes
// ==========================================
Route::middleware(['auth', 'superadmin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', fn () => redirect()->route('admin.dashboard'));
    Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

    // Clients / Tenants Management
    Route::middleware('superadmin:manage_clients')->group(function () {
        Route::get('/clients', [AdminClientController::class, 'index'])->name('clients.index');
        Route::get('/clients/{id}', [AdminClientController::class, 'show'])->name('clients.show');
        Route::post('/clients/{id}/toggle-status', [AdminClientController::class, 'toggleStatus'])->name('clients.toggle-status');
    });

    // Centralized Subscription & Duration Controls
    Route::middleware('superadmin:manage_subscriptions')->group(function () {
        Route::get('/subscriptions', [AdminSubscriptionController::class, 'index'])->name('subscriptions.index');
        Route::post('/subscriptions/adjust-duration', [AdminSubscriptionController::class, 'adjustDuration'])->name('subscriptions.adjust-duration');
        Route::post('/subscriptions/set-custom-dates', [AdminSubscriptionController::class, 'setCustomDates'])->name('subscriptions.set-custom-dates');
        Route::post('/subscriptions/topup-quota', [AdminSubscriptionController::class, 'topupQuota'])->name('subscriptions.topup-quota');
        Route::post('/subscriptions/toggle-pause', [AdminSubscriptionController::class, 'togglePause'])->name('subscriptions.toggle-pause');
    });

    // Invoices & Payments
    Route::middleware('superadmin:manage_payments')->group(function () {
        Route::get('/payments', [AdminPaymentController::class, 'index'])->name('payments.index');
        Route::post('/payments', [AdminPaymentController::class, 'store'])->name('payments.store');
        Route::post('/payments/{id}/approve', [AdminPaymentController::class, 'approve'])->name('payments.approve');
    });

    // WhatsApp Gateways & Microservices Monitor
    Route::middleware('superadmin:manage_gateways')->group(function () {
        Route::get('/gateways', [AdminGatewayController::class, 'index'])->name('gateways.index');
        Route::post('/gateways/restart', [AdminGatewayController::class, 'restartEngine'])->name('gateways.restart');
    });

    // Subscription Packages / Plans Management (Superadmin, Admin, Marketing)
    Route::middleware('superadmin:manage_plans')->group(function () {
        Route::get('/plans', [AdminPlanController::class, 'index'])->name('plans.index');
        Route::post('/plans', [AdminPlanController::class, 'store'])->name('plans.store');
        Route::put('/plans/{id}', [AdminPlanController::class, 'update'])->name('plans.update');
        Route::post('/plans/{id}/toggle-status', [AdminPlanController::class, 'toggleStatus'])->name('plans.toggle-status');
        Route::delete('/plans/{id}', [AdminPlanController::class, 'destroy'])->name('plans.destroy');
    });

    // SaaS Internal Team & RBAC Management (Superadmin Only)
    Route::middleware('superadmin:manage_staff')->group(function () {
        Route::get('/staff', [AdminStaffController::class, 'index'])->name('staff.index');
        Route::post('/staff', [AdminStaffController::class, 'store'])->name('staff.store');
        Route::put('/staff/{id}', [AdminStaffController::class, 'update'])->name('staff.update');
        Route::post('/staff/{id}/toggle-status', [AdminStaffController::class, 'toggleStatus'])->name('staff.toggle-status');
        Route::delete('/staff/{id}', [AdminStaffController::class, 'destroy'])->name('staff.destroy');
    });

    // Production Readiness Settings (Superadmin Only)
    Route::middleware('superadmin:manage_settings')->group(function () {
        Route::get('/settings', [AdminSettingController::class, 'index'])->name('settings.index');
        Route::post('/settings', [AdminSettingController::class, 'update'])->name('settings.update');
    });
});
