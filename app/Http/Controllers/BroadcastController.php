<?php

namespace App\Http\Controllers;

use App\Models\Campaign;
use App\Models\Contact;
use App\Models\ContactGroup;
use App\Models\Device;
use App\Models\Message;
use App\Models\Subscription;
use App\Models\Workspace;
use App\Rules\SafePublicUrlRule;
use App\Services\WhatsApp\AntiBanThrottleService;
use App\Services\WhatsApp\WhatsAppGatewayService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class BroadcastController extends Controller
{
    public function __construct(
        protected AntiBanThrottleService $throttleService,
        protected WhatsAppGatewayService $gatewayService
    ) {}

    protected function getWorkspace(Request $request): Workspace
    {
        return $request->user()?->workspace ?? Workspace::firstOrCreate(
            ['slug' => 'digital-sukses-mandiri'],
            ['name' => 'PT Digital Sukses Mandiri', 'uuid' => (string) Str::uuid()]
        );
    }

    public function index(Request $request): Response
    {
        $workspace = $this->getWorkspace($request);

        $devices = Device::where('workspace_id', $workspace->id)
            ->where('status', 'connected')
            ->get();

        if ($devices->isEmpty()) {
            $devices = Device::where('workspace_id', $workspace->id)->get();
        }

        $campaigns = Campaign::with('device')
            ->where('workspace_id', $workspace->id)
            ->latest('id')
            ->get();

        $groups = ContactGroup::where('workspace_id', $workspace->id)
            ->withCount('contacts')
            ->orderBy('name')
            ->get();

        $subscription = Subscription::where('workspace_id', $workspace->id)->first();

        return Inertia::render('Broadcast/Index', [
            'workspace' => $workspace,
            'devices' => $devices,
            'campaigns' => $campaigns,
            'groups' => $groups,
            'subscription' => $subscription,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $subscription = Subscription::where('workspace_id', $workspace->id)->first();

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'device_id' => [
                'required',
                Rule::exists('devices', 'id')->where('workspace_id', $workspace->id),
            ],
            'message' => 'required|string',
            'target_type' => 'required|in:manual,group',
            'group_id' => [
                'nullable',
                Rule::exists('contact_groups', 'id')->where('workspace_id', $workspace->id),
            ],
            'recipients_raw' => 'nullable|string',
            'media_url' => ['nullable', 'url', 'max:500', new SafePublicUrlRule],
            'min_delay' => 'required|integer|min:3|max:60',
            'max_delay' => 'required|integer|gte:min_delay|max:120',
            'schedule_option' => 'required|in:now,scheduled',
            'scheduled_at' => 'nullable|date',
        ]);

        $recipients = [];

        if ($validated['target_type'] === 'group' && ! empty($validated['group_id'])) {
            $contacts = Contact::where('workspace_id', $workspace->id)
                ->where('group_id', $validated['group_id'])
                ->where('is_blacklisted', false)
                ->get();

            foreach ($contacts as $c) {
                $recipients[] = [
                    'phone' => $c->phone,
                    'name' => $c->name,
                    'custom' => $c->custom_fields ?? [],
                ];
            }
        } else {
            $numbers = array_filter(array_map('trim', preg_split('/[\r\n,]+/', (string) ($validated['recipients_raw'] ?? ''))));
            foreach ($numbers as $num) {
                $raw = preg_replace('/[^0-9]/', '', $num);
                if (str_starts_with($raw, '0')) {
                    $raw = '62'.substr($raw, 1);
                } elseif (! str_starts_with($raw, '62') && strlen($raw) <= 12) {
                    $raw = '62'.$raw;
                }
                $normalized = '+'.$raw;

                $recipients[] = [
                    'phone' => $normalized,
                    'name' => 'Pelanggan '.substr($normalized, -4),
                    'custom' => [],
                ];
            }
        }

        $totalRecipients = count($recipients);

        if ($totalRecipients === 0) {
            return redirect()->back()->withErrors(['recipients_raw' => 'Minimal 1 nomor penerima atau 1 grup berisi kontak harus dipilih.']);
        }

        if ($subscription && $subscription->remaining_message_quota < $totalRecipients) {
            return redirect()->back()->withErrors(['recipients_raw' => "Sisa kuota pesan ({$subscription->remaining_message_quota}) tidak mencukupi untuk broadcast ({$totalRecipients} nomor)."]);
        }

        $isScheduled = ($validated['schedule_option'] === 'scheduled' && ! empty($validated['scheduled_at']));
        $scheduleTime = $isScheduled ? Carbon::parse($validated['scheduled_at']) : Carbon::now();

        $campaign = Campaign::create([
            'workspace_id' => $workspace->id,
            'device_id' => $validated['device_id'],
            'name' => $validated['name'],
            'message' => $validated['message'],
            'media_url' => $validated['media_url'] ?? null,
            'total_recipients' => $totalRecipients,
            'sent_count' => $isScheduled ? 0 : $totalRecipients,
            'failed_count' => 0,
            'min_delay_seconds' => $validated['min_delay'],
            'max_delay_seconds' => $validated['max_delay'],
            'status' => $isScheduled ? 'scheduled' : 'completed',
            'scheduled_at' => $scheduleTime,
            'completed_at' => $isScheduled ? null : Carbon::now(),
        ]);

        // Create individual queued/delivered messages with spintax randomized
        foreach ($recipients as $recipient) {
            $personalized = $this->throttleService->resolveSpintax($validated['message']);
            $placeholders = array_merge([
                'nama' => $recipient['name'],
                'nomor' => $recipient['phone'],
            ], $recipient['custom']);

            $personalized = $this->throttleService->replacePlaceholders($personalized, $placeholders);

            $device = Device::where('workspace_id', $workspace->id)->find($validated['device_id']);
            $dispatchStatus = $isScheduled ? 'queued' : 'delivered';

            if (! $isScheduled && $device) {
                $dispatch = $this->gatewayService->sendMessage($device, $recipient['phone'], $personalized, $validated['media_url'] ?? null);
                $dispatchStatus = $dispatch['status'] ?? 'delivered';
            }

            Message::create([
                'workspace_id' => $workspace->id,
                'device_id' => $validated['device_id'],
                'campaign_id' => $campaign->id,
                'direction' => 'outbound',
                'receiver_number' => $recipient['phone'],
                'message_type' => ! empty($validated['media_url']) ? 'media' : 'text',
                'content' => $personalized,
                'media_url' => $validated['media_url'] ?? null,
                'status' => $dispatchStatus,
                'scheduled_at' => $isScheduled ? $scheduleTime : null,
                'sent_at' => $isScheduled ? null : Carbon::now(),
            ]);
        }

        if (! $isScheduled && $subscription) {
            $subscription->decrement('remaining_message_quota', $totalRecipients);
        }

        $statusText = $isScheduled
            ? 'dijadwalkan untuk dikirim pada '.$scheduleTime->format('d M Y, H:i').' WIB'
            : "berhasil diproses dan dikirim ke {$totalRecipients} nomor";

        return redirect()->back()->with('success', "Kampanye broadcast '{$campaign->name}' {$statusText}.");
    }

    public function togglePause(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $campaign = Campaign::where('workspace_id', $workspace->id)->findOrFail($id);

        if ($campaign->status === 'scheduled') {
            $campaign->update(['status' => 'paused']);
            $msg = 'Kampanye broadcast berhasil dijeda (paused).';
        } elseif ($campaign->status === 'paused') {
            $campaign->update(['status' => 'scheduled']);
            $msg = 'Kampanye broadcast dilanjutkan kembali (resumed).';
        } else {
            $msg = 'Status kampanye tidak dapat diubah.';
        }

        return redirect()->back()->with('success', $msg);
    }

    public function exportCsv(Request $request, int $id): StreamedResponse
    {
        $workspace = $this->getWorkspace($request);
        $campaign = Campaign::where('workspace_id', $workspace->id)->findOrFail($id);
        $messages = Message::where('campaign_id', $campaign->id)->get();

        $sanitizeFormula = static function (?string $value): string {
            if ($value === null || $value === '') {
                return '';
            }
            if (in_array($value[0], ['=', '+', '-', '@'], true)) {
                return "'".$value;
            }

            return $value;
        };

        return response()->streamDownload(function () use ($messages, $sanitizeFormula) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Nomor WhatsApp', 'Status', 'Isi Pesan', 'Waktu Pengiriman']);

            foreach ($messages as $msg) {
                fputcsv($handle, [
                    $sanitizeFormula($msg->receiver_number),
                    strtoupper($msg->status),
                    $sanitizeFormula($msg->content),
                    $msg->sent_at ? $msg->sent_at->format('Y-m-d H:i:s') : '-',
                ]);
            }
            fclose($handle);
        }, 'Laporan_Broadcast_'.Str::slug($campaign->name).'.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }
}
