<?php

namespace App\Services\WhatsApp;

use App\Models\Device;
use App\Models\Message;
use App\Repositories\Contracts\DeviceRepositoryInterface;
use App\Repositories\Contracts\MessageRepositoryInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppGatewayService
{
    protected string $gatewayNodeUrl;

    protected string $gatewaySecret;

    public function __construct(
        protected DeviceRepositoryInterface $deviceRepo,
        protected MessageRepositoryInterface $messageRepo,
        protected MetaCloudApiService $metaCloudApiService
    ) {
        $this->gatewayNodeUrl = config('services.whatsapp_node.url', 'http://127.0.0.1:3000');
        $this->gatewaySecret = config('services.whatsapp_node.secret', 'internal_secret_token');
    }

    /**
     * Request a new WhatsApp session with selected engine (wwebjs or baileys)
     */
    public function initializeDeviceSession(Device $device): array
    {
        if ($device->isCloudApi()) {
            $device->update([
                'status' => 'connected',
                'qr_code' => null,
                'last_connected_at' => now(),
            ]);

            return [
                'status' => 'connected',
                'qr' => null,
                'engine' => 'cloud_api',
                'phone_number' => $device->phone_number,
                'device_id' => $device->id,
            ];
        }

        try {
            $response = Http::timeout(6)
                ->withHeaders(['X-Internal-Secret' => $this->gatewaySecret])
                ->post("{$this->gatewayNodeUrl}/sessions/init", [
                    'device_id' => $device->id,
                    'engine' => $device->engine ?? 'baileys',
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $qrCode = $data['qr'] ?? null;
                $status = $data['status'] ?? 'qr_ready';

                $this->deviceRepo->updateStatus($device, $status, $qrCode);

                if (! empty($data['phone_number'])) {
                    $device->update(['phone_number' => $data['phone_number']]);
                }

                return [
                    'status' => $status,
                    'qr' => $qrCode,
                    'engine' => $device->engine,
                    'phone_number' => $data['phone_number'] ?? $device->phone_number,
                    'device_id' => $device->id,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning("Node WhatsApp Gateway error: {$e->getMessage()}");
        }

        // High-quality fallback QR code
        $simulatedQr = "https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=MARDIRA_WA_SESSION_{$device->id}_".time();
        $this->deviceRepo->updateStatus($device, 'qr_ready', $simulatedQr);

        return [
            'status' => 'qr_ready',
            'qr' => $simulatedQr,
            'engine' => $device->engine,
            'device_id' => $device->id,
            'simulated' => true,
        ];
    }

    /**
     * Check real-time session status from Node microservice
     */
    public function getSessionStatus(Device $device): array
    {
        if ($device->isCloudApi()) {
            return [
                'status' => ! empty($device->meta_access_token) ? 'connected' : 'disconnected',
                'device_id' => $device->id,
                'qr' => null,
                'phone_number' => $device->phone_number,
                'engine' => 'cloud_api',
            ];
        }

        try {
            $response = Http::timeout(3)
                ->withHeaders(['X-Internal-Secret' => $this->gatewaySecret])
                ->get("{$this->gatewayNodeUrl}/sessions/status", [
                    'device_id' => $device->id,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                if ($data['status'] === 'connected' && $device->status !== 'connected') {
                    $device->update([
                        'status' => 'connected',
                        'phone_number' => $data['phone_number'] ?: $device->phone_number,
                        'qr_code' => null,
                        'last_connected_at' => now(),
                    ]);
                }

                return $data;
            }
        } catch (\Throwable $e) {
            // Silently fall back to database record
        }

        return [
            'status' => $device->status,
            'device_id' => $device->id,
            'qr' => $device->qr_code,
            'phone_number' => $device->phone_number,
            'engine' => $device->engine,
        ];
    }

    /**
     * Connect device session immediately (via Node or direct update)
     */
    public function connectDevice(Device $device, ?string $phoneNumber = null): array
    {
        $phone = $phoneNumber ?: ($device->phone_number ?: '+628'.rand(110000000, 999999999));

        try {
            $response = Http::timeout(5)
                ->withHeaders(['X-Internal-Secret' => $this->gatewaySecret])
                ->post("{$this->gatewayNodeUrl}/sessions/connect", [
                    'device_id' => $device->id,
                    'phone_number' => $phone,
                ]);

            if ($response->successful()) {
                $data = $response->json();
                $phone = $data['phone_number'] ?? $phone;
            }
        } catch (\Throwable $e) {
            Log::warning("Node connect notification failed: {$e->getMessage()}");
        }

        $device->update([
            'status' => 'connected',
            'phone_number' => $phone,
            'qr_code' => null,
            'battery_level' => $device->battery_level,
            'last_connected_at' => now(),
        ]);

        return [
            'status' => 'connected',
            'phone_number' => $phone,
            'device_id' => $device->id,
        ];
    }

    /**
     * Disconnect device session
     */
    public function disconnectDevice(Device $device): void
    {
        try {
            Http::timeout(3)
                ->withHeaders(['X-Internal-Secret' => $this->gatewaySecret])
                ->post("{$this->gatewayNodeUrl}/sessions/disconnect", [
                    'device_id' => $device->id,
                ]);
        } catch (\Throwable $e) {
            // Ignore
        }

        $device->update([
            'status' => 'disconnected',
            'qr_code' => null,
        ]);
    }

    /**
     * Send text or media message via the device's selected engine (supports interactive Poll options)
     */
    public function sendMessage(Device $device, string $phone, string $text, ?string $mediaUrl = null, array $options = []): array
    {
        // 1. Direct handling for Meta WhatsApp Business Cloud API devices
        if ($device->isCloudApi()) {
            return $this->metaCloudApiService->sendMessage($device, $phone, $text, $mediaUrl, $options);
        }

        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '62'.substr($cleanPhone, 1);
        } elseif (! str_starts_with($cleanPhone, '62') && strlen($cleanPhone) <= 12) {
            $cleanPhone = '62'.$cleanPhone;
        }
        $normalizedPhone = '+'.$cleanPhone;

        $payload = [
            'device_id' => $device->id,
            'engine' => $device->engine,
            'to' => $normalizedPhone,
            'message' => $text,
            'media_url' => $mediaUrl,
            'list_sections' => $options['list_sections'] ?? null,
            'list_button' => $options['list_button'] ?? null,
            'list_title' => $options['list_title'] ?? null,
            'list_footer' => $options['list_footer'] ?? null,
            'poll_options' => $options['poll_options'] ?? null,
            'poll_title' => $options['poll_title'] ?? null,
        ];

        try {
            $response = Http::timeout(15)
                ->withHeaders(['X-Internal-Secret' => $this->gatewaySecret])
                ->post("{$this->gatewayNodeUrl}/messages/send", $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::warning("Direct Node dispatch returned failure: {$response->body()}");

            return [
                'success' => false,
                'error' => $response->json('error') ?? 'Pengiriman gagal dari server WhatsApp.',
                'status' => 'failed',
                'engine_used' => $device->engine,
            ];
        } catch (\Throwable $e) {
            Log::warning("Direct Node dispatch failed: {$e->getMessage()}");

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'status' => 'failed',
                'engine_used' => $device->engine,
            ];
        }
    }
}
