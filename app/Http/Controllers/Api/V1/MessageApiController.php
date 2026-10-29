<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use App\Models\Device;
use App\Models\Message;
use App\Rules\SafePublicUrlRule;
use App\Services\Billing\SubscriptionService;
use App\Services\WhatsApp\WhatsAppGatewayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageApiController extends Controller
{
    public function __construct(
        protected SubscriptionService $subscriptionService,
        protected WhatsAppGatewayService $gatewayService
    ) {}

    /**
     * Helper to authenticate Bearer token to ApiKey with workspace & subscription.
     */
    protected function authenticateApiKey(Request $request): ?ApiKey
    {
        $token = $request->bearerToken();
        if (! $token) {
            return null;
        }

        $keyHash = hash('sha256', $token);

        return ApiKey::with(['workspace.subscription.plan', 'device'])->where('key_hash', $keyHash)->first();
    }

    /**
     * Check workspace quota & subscription status.
     * GET /api/v1/quota
     * GET /api/v1/status
     */
    public function quota(Request $request): JsonResponse
    {
        $apiKey = $this->authenticateApiKey($request);
        if (! $apiKey) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized: API Key tidak valid atau belum disertakan pada header Authorization.',
                'error_code' => 'UNAUTHORIZED',
            ], 401);
        }

        $workspace = $apiKey->workspace;
        $subscription = $workspace->subscription;

        $monthlyQuota = (int) ($subscription?->monthly_message_quota ?? 5000);
        $remainingQuota = (int) ($subscription?->remaining_message_quota ?? $monthlyQuota);
        $usedQuota = max(0, $monthlyQuota - $remainingQuota);

        $connectedDevices = Device::where('workspace_id', $workspace->id)
            ->where('status', 'connected')
            ->count();
        $totalDevices = Device::where('workspace_id', $workspace->id)->count();

        $boundDeviceData = null;
        if ($apiKey->device) {
            $d = $apiKey->device;
            $serverLabel = match ($d->engine) {
                'baileys' => 'Server 1 WhatsApp',
                'wwebjs' => 'Server 2 WhatsApp',
                default => 'Server WhatsApp',
            };
            $boundDeviceData = [
                'id' => $d->id,
                'name' => $d->name,
                'phone_number' => $d->phone_number,
                'server' => $d->engine === 'baileys' ? 'server_1' : 'server_2',
                'server_label' => $serverLabel,
                'status' => $d->status,
                'is_connected' => $d->status === 'connected',
            ];
        }

        return response()->json([
            'status' => true,
            'workspace' => [
                'id' => $workspace->id,
                'name' => $workspace->name,
            ],
            'api_key' => [
                'name' => $apiKey->name,
                'prefix' => $apiKey->prefix,
                'bound_device' => $boundDeviceData,
            ],
            'plan' => [
                'name' => $subscription?->plan?->name ?? 'Starter Lite',
                'status' => $subscription?->status ?? 'active',
                'ends_at' => $subscription?->ends_at?->toIso8601String(),
                'days_remaining' => $subscription?->daysRemaining() ?? 30,
            ],
            'quota' => [
                'monthly_total' => $monthlyQuota,
                'remaining' => $remainingQuota,
                'used' => $usedQuota,
                'percentage_remaining' => $monthlyQuota > 0 ? round(($remainingQuota / $monthlyQuota) * 100, 2) : 0,
                'can_send' => $this->subscriptionService->canSend($workspace->id),
            ],
            'devices' => [
                'total' => $totalDevices,
                'connected' => $connectedDevices,
            ],
        ], 200, [
            'X-Quota-Limit' => (string) $monthlyQuota,
            'X-Quota-Remaining' => (string) $remainingQuota,
            'X-Quota-Used' => (string) $usedQuota,
        ]);
    }

    /**
     * Dispatch WhatsApp message via API Gateway and deduct quota upon successful delivery.
     * POST /api/v1/messages/send
     * POST /api/v1/messages/send-media
     */
    public function send(Request $request): JsonResponse
    {
        // 1. Authenticate via Bearer Token (Hashed SHA-256)
        $apiKey = $this->authenticateApiKey($request);
        if (! $apiKey) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized: API Key tidak valid atau belum disertakan pada header Authorization.',
                'error_code' => 'UNAUTHORIZED',
            ], 401);
        }

        // 2. Validate Input
        $validated = $request->validate([
            'phone' => 'required|string',
            'message' => 'nullable|string',
            'caption' => 'nullable|string',
            'device_id' => 'nullable|integer',
            'media_url' => ['nullable', 'url', 'max:500', new SafePublicUrlRule],
        ]);

        $messageContent = $validated['message'] ?? $validated['caption'] ?? '';
        if (empty($messageContent) && empty($validated['media_url'])) {
            return response()->json([
                'status' => false,
                'message' => 'Parameter message atau media_url wajib diisi.',
                'error_code' => 'EMPTY_MESSAGE_CONTENT',
            ], 422);
        }

        $rawPhone = $validated['phone'];
        $cleanPhone = preg_replace('/[^0-9]/', '', $rawPhone);
        if (str_starts_with($cleanPhone, '0')) {
            $cleanPhone = '62'.substr($cleanPhone, 1);
        } elseif (! str_starts_with($cleanPhone, '62') && strlen($cleanPhone) <= 12) {
            $cleanPhone = '62'.$cleanPhone;
        }
        $normalizedPhone = '+'.$cleanPhone;

        $workspace = $apiKey->workspace;
        $subscription = $workspace->subscription;

        // 3. Verify Subscription & Quota
        if (! $subscription || ! $this->subscriptionService->canSend($workspace->id)) {
            $monthly = (int) ($subscription?->monthly_message_quota ?? 0);
            $remaining = (int) ($subscription?->remaining_message_quota ?? 0);

            return response()->json([
                'status' => false,
                'message' => 'Payment Required: Langganan tidak aktif, expired, atau sisa kuota pesan telah habis.',
                'error_code' => 'QUOTA_EXHAUSTED',
                'quota' => [
                    'monthly_total' => $monthly,
                    'remaining' => $remaining,
                    'used' => max(0, $monthly - $remaining),
                    'can_send' => false,
                ],
            ], 402, [
                'X-Quota-Limit' => (string) $monthly,
                'X-Quota-Remaining' => (string) $remaining,
                'X-Quota-Used' => (string) max(0, $monthly - $remaining),
            ]);
        }

        // 4. Find Connected Device (Specific to bound Device or Auto-Routed)
        if ($apiKey->device_id) {
            $device = Device::where('workspace_id', $workspace->id)
                ->where('id', $apiKey->device_id)
                ->first();

            if (! $device) {
                return response()->json([
                    'status' => false,
                    'message' => 'Perangkat WhatsApp yang dialokasikan untuk API Key ini tidak ditemukan di workspace Anda.',
                    'error_code' => 'BOUND_DEVICE_NOT_FOUND',
                ], 422);
            }

            if ($device->status !== 'connected') {
                $serverLabel = match ($device->engine) {
                    'baileys' => 'Server 1 WhatsApp',
                    'wwebjs' => 'Server 2 WhatsApp',
                    default => 'Server WhatsApp',
                };

                return response()->json([
                    'status' => false,
                    'message' => "Perangkat WhatsApp terikat ({$device->name} - {$device->phone_number} via {$serverLabel}) sedang tidak aktif/terhubung. Pastikan sesi WhatsApp aktif di Manajemen Gateway.",
                    'error_code' => 'BOUND_DEVICE_DISCONNECTED',
                    'data' => [
                        'device_id' => $device->id,
                        'device_name' => $device->name,
                        'phone_number' => $device->phone_number,
                        'server' => $device->engine === 'baileys' ? 'server_1' : 'server_2',
                        'status' => $device->status,
                    ],
                ], 422);
            }
        } else {
            $deviceQuery = Device::where('workspace_id', $workspace->id)->where('status', 'connected');
            if (! empty($validated['device_id'])) {
                $deviceQuery->where('id', $validated['device_id']);
            }
            $device = $deviceQuery->first();

            if (! $device) {
                return response()->json([
                    'status' => false,
                    'message' => 'Tidak ada perangkat WhatsApp yang aktif/terhubung di workspace ini.',
                    'error_code' => 'NO_CONNECTED_DEVICE',
                ], 422);
            }
        }

        // 5. Dispatch Message through WhatsApp Gateway Service
        $dispatch = $this->gatewayService->sendMessage($device, $normalizedPhone, $messageContent, $validated['media_url'] ?? null);
        $isSuccess = ($dispatch['status'] ?? '') !== 'failed' && ($dispatch['success'] ?? true);

        // 6. Create Message Record
        $message = Message::create([
            'workspace_id' => $workspace->id,
            'device_id' => $device->id,
            'direction' => 'outbound',
            'receiver_number' => $normalizedPhone,
            'message_type' => ! empty($validated['media_url']) ? 'media' : 'text',
            'content' => $messageContent,
            'media_url' => $validated['media_url'] ?? null,
            'status' => $isSuccess ? ($dispatch['status'] ?? 'delivered') : 'failed',
            'error_message' => $isSuccess ? null : ($dispatch['error'] ?? 'Pengiriman gagal dari server WhatsApp.'),
            'sent_at' => now(),
        ]);

        $monthlyQuota = (int) $subscription->monthly_message_quota;

        // 7. Handle Dispatch Failure: Do NOT deduct quota on failure
        if (! $isSuccess) {
            $remainingQuota = (int) $subscription->remaining_message_quota;
            $usedQuota = max(0, $monthlyQuota - $remainingQuota);

            return response()->json([
                'status' => false,
                'message' => 'Gagal mengirim pesan: '.($dispatch['error'] ?? 'Server WhatsApp tidak dapat dihubungi.'),
                'error_code' => 'DISPATCH_FAILED',
                'data' => [
                    'message_id' => $message->id,
                    'device_id' => $device->id,
                    'status' => 'failed',
                ],
                'quota' => [
                    'monthly_total' => $monthlyQuota,
                    'remaining' => $remainingQuota,
                    'used' => $usedQuota,
                    'percentage_remaining' => $monthlyQuota > 0 ? round(($remainingQuota / $monthlyQuota) * 100, 2) : 0,
                ],
            ], 502, [
                'X-Quota-Limit' => (string) $monthlyQuota,
                'X-Quota-Remaining' => (string) $remainingQuota,
                'X-Quota-Used' => (string) $usedQuota,
            ]);
        }

        // 8. On Success: Safely Decrement Remaining Quota & Update Timestamp
        $subscription->decrement('remaining_message_quota');
        $subscription->refresh();
        $apiKey->update(['last_used_at' => now()]);

        $remainingQuota = (int) $subscription->remaining_message_quota;
        $usedQuota = max(0, $monthlyQuota - $remainingQuota);

        // Mask engine name to neutral server label as required
        $serverLabel = match ($device->engine) {
            'baileys' => 'Server 1 WhatsApp',
            'wwebjs' => 'Server 2 WhatsApp',
            default => 'Server WhatsApp',
        };
        $serverCode = match ($device->engine) {
            'baileys' => 'server_1',
            'wwebjs' => 'server_2',
            default => 'server_default',
        };

        return response()->json([
            'status' => true,
            'message' => "Pesan berhasil diproses dan dikirim via {$serverLabel}",
            'data' => [
                'message_id' => $message->id,
                'device_id' => $device->id,
                'engine' => $device->engine,
                'server' => $serverCode,
                'recipient' => $message->receiver_number,
                'status' => $message->status,
                'created_at' => $message->created_at->toIso8601String(),
            ],
            'quota' => [
                'monthly_total' => $monthlyQuota,
                'remaining' => $remainingQuota,
                'used' => $usedQuota,
                'percentage_remaining' => $monthlyQuota > 0 ? round(($remainingQuota / $monthlyQuota) * 100, 2) : 0,
            ],
        ], 200, [
            'X-Quota-Limit' => (string) $monthlyQuota,
            'X-Quota-Remaining' => (string) $remainingQuota,
            'X-Quota-Used' => (string) $usedQuota,
        ]);
    }
}
