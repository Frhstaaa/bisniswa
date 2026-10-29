<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Device;
use App\Models\Message;
use App\Models\Subscription;
use App\Models\User;
use App\Models\Workspace;
use App\Rules\SafePublicUrlRule;
use App\Services\WhatsApp\WhatsAppGatewayService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function __construct(
        protected WhatsAppGatewayService $gateway
    ) {}

    protected function getWorkspace(Request $request): Workspace
    {
        return $request->user()?->workspace ?? Workspace::firstOrCreate(
            ['slug' => 'digital-sukses-mandiri'],
            ['name' => 'PT Digital Sukses Mandiri', 'uuid' => (string) Str::uuid()]
        );
    }

    /**
     * Generate normalized phone number variants (+62, 62, 0)
     *
     * @return array<int, string>
     */
    protected function normalizePhoneVariants(string $phone): array
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);
        if (empty($clean)) {
            return [$phone];
        }

        $variants = [$phone, $clean];
        if (str_starts_with($clean, '62')) {
            $variants[] = '+'.$clean;
            $variants[] = '0'.substr($clean, 2);
        } elseif (str_starts_with($clean, '0')) {
            $variants[] = '+62'.substr($clean, 1);
            $variants[] = '62'.substr($clean, 1);
        } else {
            $variants[] = '+62'.$clean;
            $variants[] = '62'.$clean;
            $variants[] = '0'.$clean;
        }

        return array_values(array_unique(array_filter($variants)));
    }

    /**
     * Get grouped conversations for the workspace
     *
     * @return array<int, array<string, mixed>>
     */
    protected function getConversations(Workspace $workspace): array
    {
        return Message::where('workspace_id', $workspace->id)
            ->selectRaw('receiver_number, MAX(created_at) as last_activity, COUNT(id) as total_messages')
            ->groupBy('receiver_number')
            ->orderByDesc('last_activity')
            ->limit(50)
            ->get()
            ->map(function ($conv) use ($workspace) {
                $lastMsg = Message::where('workspace_id', $workspace->id)
                    ->where('receiver_number', $conv->receiver_number)
                    ->latest('id')
                    ->first();

                $variants = $this->normalizePhoneVariants($conv->receiver_number);
                $contact = Contact::where('workspace_id', $workspace->id)
                    ->whereIn('phone', $variants)
                    ->first();

                $knownUser = User::whereIn('phone', $variants)->first();
                $displayName = $contact ? $contact->name : ($knownUser ? $knownUser->name : 'Pelanggan '.substr($conv->receiver_number, -4));

                return [
                    'phone' => $conv->receiver_number,
                    'name' => $displayName,
                    'last_message' => $lastMsg ? $lastMsg->content : '',
                    'last_direction' => $lastMsg ? $lastMsg->direction : 'outbound',
                    'last_time' => $lastMsg ? $lastMsg->created_at->diffForHumans(null, true) : '',
                    'timestamp' => $lastMsg ? $lastMsg->created_at->format('H.i') : '',
                    'status' => $lastMsg ? $lastMsg->status : 'delivered',
                ];
            })
            ->values()
            ->all();
    }

    public function index(Request $request): Response
    {
        $workspace = $this->getWorkspace($request);
        $conversations = $this->getConversations($workspace);

        $activePhone = $request->query('phone');

        // If no active phone selected, default to first conversation
        if (! $activePhone && ! empty($conversations)) {
            $activePhone = $conversations[0]['phone'];
        }

        $activeMessages = [];
        if ($activePhone) {
            $variants = $this->normalizePhoneVariants($activePhone);
            $activeMessages = Message::where('workspace_id', $workspace->id)
                ->whereIn('receiver_number', $variants)
                ->orderBy('created_at', 'asc')
                ->limit(200)
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'direction' => $m->direction,
                    'receiver_number' => $m->receiver_number,
                    'message_type' => $m->message_type,
                    'content' => $m->content,
                    'media_url' => $m->media_url,
                    'status' => $m->status,
                    'created_at' => $m->created_at->toISOString(),
                ]);
        }

        $devices = Device::where('workspace_id', $workspace->id)
            ->where('status', 'connected')
            ->get();

        if ($devices->isEmpty()) {
            $devices = Device::where('workspace_id', $workspace->id)->get();
        }

        $cannedResponses = [
            'Halo Kak, terima kasih telah menghubungi kami. Ada yang bisa kami bantu hari ini?',
            'Mohon menunggu sebentar, tim kami sedang memverifikasi data dan berkas Anda.',
            'Pembayaran tagihan dapat dilakukan melalui QRIS instan atau Transfer Bank resmi.',
            'Pendaftaran akun Anda telah aktif dan siap digunakan. Silakan akses portal layanan.',
            'Baik Kak, informasi Anda telah kami catat dalam sistem. Terima kasih dan salam hangat!',
        ];

        $subscription = Subscription::with('plan')->where('workspace_id', $workspace->id)->first();

        return Inertia::render('Inbox/Index', [
            'conversations' => $conversations,
            'activePhone' => $activePhone,
            'activeMessages' => $activeMessages,
            'devices' => $devices,
            'cannedResponses' => $cannedResponses,
            'subscription' => $subscription,
        ]);
    }

    public function sendMessage(Request $request): Response|RedirectResponse|JsonResponse
    {
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'phone' => ['required', 'string'],
            'message' => ['required', 'string'],
            'device_id' => [
                'nullable',
                Rule::exists('devices', 'id')->where('workspace_id', $workspace->id),
            ],
            'media_url' => ['nullable', 'url', 'max:500', new SafePublicUrlRule],
        ]);

        $rawPhone = preg_replace('/[^0-9]/', '', $validated['phone']);
        if (str_starts_with($rawPhone, '0')) {
            $rawPhone = '62'.substr($rawPhone, 1);
        } elseif (! str_starts_with($rawPhone, '62') && strlen($rawPhone) <= 12) {
            $rawPhone = '62'.$rawPhone;
        }
        $normalizedPhone = '+'.$rawPhone;

        // Check if subscription message quota is exhausted
        $subscription = Subscription::where('workspace_id', $workspace->id)->first();
        if ($subscription && $subscription->remaining_message_quota <= 0) {
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Sisa kuota pesan WhatsApp Anda sudah habis (0). Harap lakukan top up saldo kuota atau perbarui paket langganan.',
                ], 422);
            }

            return redirect()->route('inbox.index', ['phone' => $normalizedPhone])
                ->with('error', 'Sisa kuota pesan WhatsApp Anda sudah habis (0). Harap lakukan top up saldo kuota atau perbarui paket langganan.');
        }

        $device = ! empty($validated['device_id'])
            ? Device::where('workspace_id', $workspace->id)->find($validated['device_id'])
            : (Device::where('workspace_id', $workspace->id)->where('status', 'connected')->first()
                ?? Device::where('workspace_id', $workspace->id)->first());

        $dispatchStatus = 'delivered';
        $errorMessage = null;

        if ($device) {
            $dispatch = $this->gateway->sendMessage($device, $normalizedPhone, $validated['message'], $validated['media_url'] ?? null);
            $dispatchStatus = $dispatch['status'] ?? 'delivered';
            if (isset($dispatch['success']) && ! $dispatch['success']) {
                $errorMessage = $dispatch['error'] ?? 'Pengiriman pesan WhatsApp gagal.';
            }
        }

        // Save outbound message
        $message = Message::create([
            'workspace_id' => $workspace->id,
            'device_id' => $device ? $device->id : null,
            'direction' => 'outbound',
            'receiver_number' => $normalizedPhone,
            'message_type' => ! empty($validated['media_url']) ? 'media' : 'text',
            'content' => $validated['message'],
            'media_url' => $validated['media_url'] ?? null,
            'status' => $errorMessage ? 'failed' : $dispatchStatus,
            'sent_at' => Carbon::now(),
        ]);

        // Deduct subscription message quota if subscription exists
        if ($subscription && $subscription->remaining_message_quota > 0) {
            $subscription->decrement('remaining_message_quota');
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => ! $errorMessage,
                'error' => $errorMessage,
                'message' => [
                    'id' => $message->id,
                    'direction' => $message->direction,
                    'receiver_number' => $message->receiver_number,
                    'message_type' => $message->message_type,
                    'content' => $message->content,
                    'media_url' => $message->media_url,
                    'status' => $message->status,
                    'created_at' => $message->created_at->toISOString(),
                ],
                'remaining_quota' => $subscription?->fresh()->remaining_message_quota,
            ], $errorMessage ? 400 : 200);
        }

        if ($errorMessage) {
            return redirect()->route('inbox.index', ['phone' => $normalizedPhone])
                ->with('error', $errorMessage);
        }

        return redirect()->route('inbox.index', ['phone' => $normalizedPhone]);
    }

    /**
     * Real-time silent sync endpoint (polling without page refresh)
     */
    public function sync(Request $request): JsonResponse
    {
        $workspace = $this->getWorkspace($request);
        $phone = $request->query('phone');
        $afterId = $request->query('after_id');

        $newMessages = [];
        if ($phone) {
            $variants = $this->normalizePhoneVariants($phone);
            $query = Message::where('workspace_id', $workspace->id)
                ->whereIn('receiver_number', $variants);

            if ($afterId) {
                $query->where('id', '>', (int) $afterId);
            }

            $newMessages = $query->orderBy('created_at', 'asc')
                ->limit(100)
                ->get()
                ->map(fn ($m) => [
                    'id' => $m->id,
                    'direction' => $m->direction,
                    'receiver_number' => $m->receiver_number,
                    'message_type' => $m->message_type,
                    'content' => $m->content,
                    'media_url' => $m->media_url,
                    'status' => $m->status,
                    'created_at' => $m->created_at->toISOString(),
                ]);
        }

        $conversations = $this->getConversations($workspace);
        $subscription = Subscription::where('workspace_id', $workspace->id)->first();

        return response()->json([
            'success' => true,
            'messages' => $newMessages,
            'conversations' => $conversations,
            'remaining_quota' => $subscription?->remaining_message_quota,
        ]);
    }

    /**
     * Get all messages for a specific conversation phone
     */
    public function conversationMessages(Request $request): JsonResponse
    {
        $workspace = $this->getWorkspace($request);
        $phone = $request->query('phone');

        if (! $phone) {
            return response()->json(['success' => false, 'messages' => []]);
        }

        $variants = $this->normalizePhoneVariants($phone);
        $messages = Message::where('workspace_id', $workspace->id)
            ->whereIn('receiver_number', $variants)
            ->orderBy('created_at', 'asc')
            ->limit(200)
            ->get()
            ->map(fn ($m) => [
                'id' => $m->id,
                'direction' => $m->direction,
                'receiver_number' => $m->receiver_number,
                'message_type' => $m->message_type,
                'content' => $m->content,
                'media_url' => $m->media_url,
                'status' => $m->status,
                'created_at' => $m->created_at->toISOString(),
            ]);

        return response()->json([
            'success' => true,
            'phone' => $phone,
            'messages' => $messages,
        ]);
    }
}
