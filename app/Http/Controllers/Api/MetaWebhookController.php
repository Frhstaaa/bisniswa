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
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;

class MetaWebhookController extends Controller
{
    public function __construct(
        protected AutoReplyService $autoReplyService
    ) {}

    /**
     * Verification endpoint for Meta Webhook setup (GET)
     */
    public function verify(Request $request): Response
    {
        $mode = $request->query('hub_mode') ?? $request->query('hub.mode');
        $token = $request->query('hub_verify_token') ?? $request->query('hub.verify_token');
        $challenge = $request->query('hub_challenge') ?? $request->query('hub.challenge');

        $defaultToken = config('services.meta.verify_token', 'bisniswa_meta_token');
        $deviceMatch = Device::where('meta_verify_token', $token)->exists();

        if ($mode === 'subscribe' && ($token === $defaultToken || $deviceMatch)) {
            Log::info("Meta Webhook verification succeeded with token: {$token}");

            return response((string) $challenge, 200)->header('Content-Type', 'text/plain');
        }

        Log::warning("Meta Webhook verification failed for token: {$token}");

        return response('Forbidden', 403);
    }

    /**
     * Handle incoming notifications from Meta WhatsApp Cloud API (POST)
     */
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();

        if (empty($payload['entry'])) {
            return response()->json(['status' => 'ignored']);
        }

        foreach ($payload['entry'] as $entry) {
            foreach ($entry['changes'] ?? [] as $change) {
                if (($change['field'] ?? '') !== 'messages') {
                    continue;
                }

                $value = $change['value'] ?? [];
                $metadata = $value['metadata'] ?? [];
                $phoneId = $metadata['phone_number_id'] ?? null;

                // Find device registered with this Meta Phone Number ID
                $device = null;
                if ($phoneId) {
                    $device = Device::where('meta_phone_number_id', $phoneId)->first();
                }

                if (! $device && ! empty($metadata['display_phone_number'])) {
                    $cleanDisplay = preg_replace('/[^0-9]/', '', $metadata['display_phone_number']);
                    $device = Device::where('phone_number', 'like', "%{$cleanDisplay}%")->first();
                }

                if (! $device) {
                    Log::warning("Meta Webhook: No matching Device found for PhoneId {$phoneId}");

                    continue;
                }

                // Extract contact pushName/profile name
                $contactProfiles = [];
                foreach ($value['contacts'] ?? [] as $c) {
                    $cWaId = $c['wa_id'] ?? '';
                    $cName = $c['profile']['name'] ?? '';
                    if ($cWaId && $cName) {
                        $contactProfiles[$cWaId] = $cName;
                    }
                }

                foreach ($value['messages'] ?? [] as $msg) {
                    $this->processIncomingMetaMessage($device, $msg, $contactProfiles);
                }
            }
        }

        return response()->json(['status' => 'success']);
    }

    /**
     * Process single message from Meta
     */
    protected function processIncomingMetaMessage(Device $device, array $msg, array $contactProfiles): void
    {
        $fromWaId = $msg['from'] ?? '';
        if (empty($fromWaId)) {
            return;
        }

        $sender = '+'.preg_replace('/[^0-9]/', '', $fromWaId);
        $senderName = $contactProfiles[$fromWaId] ?? null;

        $type = $msg['type'] ?? 'text';
        $body = '';

        if ($type === 'text') {
            $body = $msg['text']['body'] ?? '';
        } elseif ($type === 'interactive') {
            $interactive = $msg['interactive'] ?? [];
            if (($interactive['type'] ?? '') === 'button_reply') {
                $body = $interactive['button_reply']['title'] ?? $interactive['button_reply']['id'] ?? '';
            } elseif (($interactive['type'] ?? '') === 'list_reply') {
                $body = $interactive['list_reply']['title'] ?? $interactive['list_reply']['id'] ?? '';
            }
        } elseif ($type === 'button') {
            $body = $msg['button']['text'] ?? $msg['button']['payload'] ?? '';
        } elseif (in_array($type, ['image', 'video', 'document', 'audio'])) {
            $body = $msg[$type]['caption'] ?? "[{$type}]";
        }

        if (empty($body)) {
            return;
        }

        $workspaceId = $device->workspace_id;

        // Save message to inbox
        $message = Message::create([
            'workspace_id' => $workspaceId,
            'device_id' => $device->id,
            'direction' => 'inbound',
            'receiver_number' => $sender,
            'message_type' => $type,
            'content' => $body,
            'status' => 'delivered',
            'sent_at' => Carbon::now(),
        ]);

        // Auto-save contact with profile name
        $contactData = ['workspace_id' => $workspaceId, 'phone' => $sender];
        $contactName = ! empty($senderName) ? $senderName : 'Pelanggan '.substr($sender, -4);
        Contact::updateOrCreate(
            $contactData,
            ['name' => $contactName]
        );

        Log::info("Meta Cloud API Message received from {$sender} ({$contactName}) on Device {$device->name}: '{$body}'");

        // Trigger Auto-Reply with personalization
        try {
            $this->autoReplyService->handleInboundMessage($device, $sender, $body, $senderName);
        } catch (\Throwable $e) {
            Log::error("Failed executing auto-reply for Meta message from {$sender}: {$e->getMessage()}");
        }
    }
}
