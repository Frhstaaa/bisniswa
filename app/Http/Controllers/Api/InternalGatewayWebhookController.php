<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\Device;
use App\Models\Message;
use App\Services\AutoReplyService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InternalGatewayWebhookController extends Controller
{
    public function __construct(
        protected AutoReplyService $autoReplyService
    ) {}

    protected function verifySecret(Request $request): bool
    {
        $secret = $request->header('X-Internal-Secret');
        $expected = config('services.whatsapp_node.secret', 'internal_secret_token');

        return hash_equals($expected, (string) $secret);
    }

    /**
     * Webhook for device status & QR changes from Node Gateway
     */
    public function deviceStatusWebhook(Request $request): JsonResponse
    {
        if (! $this->verifySecret($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $deviceId = $request->input('device_id');
        $device = Device::find($deviceId);

        if (! $device) {
            return response()->json(['error' => 'Device not found'], 404);
        }

        $updates = [];

        if ($request->has('status')) {
            $updates['status'] = $request->input('status');
        }

        if ($request->has('qr_code')) {
            $updates['qr_code'] = $request->input('qr_code');
        }

        if ($request->has('phone_number') && ! empty($request->input('phone_number'))) {
            $updates['phone_number'] = $request->input('phone_number');
        }

        if ($request->input('status') === 'connected') {
            $updates['qr_code'] = null;
            $updates['last_connected_at'] = Carbon::now();
            if ($request->has('battery_level')) {
                $updates['battery_level'] = $request->input('battery_level');
            }
        }

        if (! empty($updates)) {
            $device->update($updates);
            Log::info("Device {$deviceId} status updated via Gateway Webhook: {$device->status}");
        }

        return response()->json(['success' => true]);
    }

    /**
     * Webhook for receiving incoming WhatsApp messages from customers
     */
    public function receiveMessageWebhook(Request $request): JsonResponse
    {
        if (! $this->verifySecret($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $deviceId = $request->input('device_id');
        $sender = $request->input('sender');
        $body = $request->input('message');
        $senderName = $request->input('sender_name') ?? $request->input('push_name');

        if (! $deviceId || ! $sender || ! $body) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        $device = Device::find($deviceId);
        if (! $device) {
            return response()->json(['error' => 'Device not found'], 404);
        }

        $workspaceId = $device->workspace_id;

        // Save incoming message to Live Chat Inbox
        $message = Message::create([
            'workspace_id' => $workspaceId,
            'device_id' => $device->id,
            'direction' => 'inbound',
            'receiver_number' => $sender,
            'message_type' => 'text',
            'content' => $body,
            'status' => 'delivered',
            'sent_at' => Carbon::now(),
        ]);

        // Auto-save to contacts if not existing and is a valid individual phone number (max 15 digits)
        $cleanDigits = preg_replace('/[^0-9]/', '', $sender);
        if (strlen($cleanDigits) >= 8 && strlen($cleanDigits) <= 15 && ! str_contains($sender, '@g.us') && ! str_contains($sender, '@broadcast')) {
            $contactName = ! empty($senderName) ? trim($senderName) : 'Pelanggan '.substr($sender, -4);
            Contact::updateOrCreate(
                ['workspace_id' => $workspaceId, 'phone' => $sender],
                ['name' => $contactName]
            );
        }

        Log::info("Inbound WhatsApp message from {$sender} recorded for Workspace {$workspaceId}");

        // Automatically trigger Auto-Reply / Gemini AI bot with personalization
        $replyResult = null;
        try {
            $replyResult = $this->autoReplyService->handleInboundMessage($device, $sender, $body, $senderName);
        } catch (\Throwable $e) {
            Log::error("Failed executing auto-reply for {$sender}: {$e->getMessage()}");
        }

        return response()->json([
            'success' => true,
            'message_id' => $message->id,
            'auto_reply' => $replyResult,
        ]);
    }
}
