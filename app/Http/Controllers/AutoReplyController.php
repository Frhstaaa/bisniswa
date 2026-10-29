<?php

namespace App\Http\Controllers;

use App\Models\AutoReply;
use App\Models\Device;
use App\Models\SystemSetting;
use App\Models\Workspace;
use App\Rules\SafePublicUrlRule;
use App\Services\AutoReplyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AutoReplyController extends Controller
{
    public function __construct(
        protected AutoReplyService $autoReplyService
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

        $autoReplies = AutoReply::where('workspace_id', $workspace->id)
            ->with('device')
            ->latest('id')
            ->get();

        $devices = Device::where('workspace_id', $workspace->id)->get();

        $aiEnabled = (bool) SystemSetting::get("ai_gemini_enabled_{$workspace->id}", SystemSetting::get('ai_gemini_enabled', true));
        $aiPromptContext = SystemSetting::get(
            "ai_gemini_prompt_context_{$workspace->id}",
            SystemSetting::get(
                'ai_gemini_prompt_context',
                'Anda adalah Asisten Virtual Cerdas resmi dari Politeknik Mardira Indonesia (PMI) dan Layanan WhatsApp Gateway Enterprise. Berikan jawaban yang ramah, sopan, ringkas, dan jelas dalam Bahasa Indonesia. Fokus pada informasi pendaftaran, layanan akademik, serta panduan integrasi API WhatsApp.'
            )
        );
        $aiApiKey = SystemSetting::get("ai_gemini_api_key_{$workspace->id}", '');

        $rawButtons = SystemSetting::get("greeting_menu_buttons_{$workspace->id}");
        $menuButtons = ! empty($rawButtons) ? json_decode($rawButtons, true) : null;
        if (empty($menuButtons) || ! is_array($menuButtons)) {
            $menuButtons = [
                ['label' => 'Administrasi', 'keyword' => 'administrasi'],
                ['label' => 'Info & Pengaduan', 'keyword' => 'pengaduan'],
                ['label' => 'Rehab', 'keyword' => 'rehab'],
            ];
        }

        $menuConfig = [
            'enabled' => (bool) SystemSetting::get("greeting_menu_enabled_{$workspace->id}", true),
            'style' => SystemSetting::get("greeting_menu_style_{$workspace->id}", 'buttons'),
            'button_text' => SystemSetting::get("greeting_menu_button_text_{$workspace->id}", '📋 Buka Pilihan Layanan'),
            'keywords' => SystemSetting::get(
                "greeting_menu_keywords_{$workspace->id}",
                'hi, halo, hai, hello, hei, p, info, informasi, menu, bantuan, help, list, daftar menu, pilihan, start, mulai, assalamualaikum, salam, permisi, siang, pagi, sore, malam, tes, test, ping, admin'
            ),
            'device_id' => SystemSetting::get("greeting_menu_device_id_{$workspace->id}", ''),
            'header' => SystemSetting::get("greeting_menu_header_{$workspace->id}", ''),
            'footer' => SystemSetting::get("greeting_menu_footer_{$workspace->id}", ''),
            'buttons' => $menuButtons,
        ];

        $masterEnabled = (bool) SystemSetting::get("auto_reply_master_enabled_{$workspace->id}", true);

        return Inertia::render('AutoReply/Index', [
            'masterEnabled' => $masterEnabled,
            'autoReplies' => $autoReplies,
            'devices' => $devices,
            'menuConfig' => $menuConfig,
            'aiConfig' => [
                'enabled' => (bool) $aiEnabled,
                'prompt_context' => $aiPromptContext,
                'api_key' => $aiApiKey,
            ],
            'stats' => [
                'total_rules' => $autoReplies->count(),
                'active_rules' => $autoReplies->where('is_active', true)->count(),
                'total_hits' => $autoReplies->sum('hit_count'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trigger_type' => ['required', 'in:exact,contains,starts_with,ai_gemini'],
            'keyword' => ['required', 'string', 'max:255'],
            'reply_message' => ['required', 'string'],
            'device_id' => [
                'nullable',
                Rule::exists('devices', 'id')->where('workspace_id', $workspace->id),
            ],
            'reply_media_url' => ['nullable', 'url', 'max:500', new SafePublicUrlRule],
            'cta_text' => ['nullable', 'string', 'max:100'],
            'cta_url' => ['nullable', 'url', 'max:500', new SafePublicUrlRule],
            'action_buttons' => ['nullable'],
        ]);

        $rawActions = $request->input('action_buttons');
        if (is_string($rawActions)) {
            $rawActions = preg_split('/[,|\n]+/', $rawActions, -1, PREG_SPLIT_NO_EMPTY);
        }
        $actionButtons = is_array($rawActions)
            ? array_values(array_filter(array_map('trim', $rawActions)))
            : null;

        AutoReply::create([
            'workspace_id' => $workspace->id,
            'device_id' => $validated['device_id'] ?? null,
            'name' => $validated['name'],
            'trigger_type' => $validated['trigger_type'],
            'keyword' => strtolower(trim($validated['keyword'])),
            'reply_message' => $validated['reply_message'],
            'reply_media_url' => $validated['reply_media_url'] ?? null,
            'cta_text' => $validated['cta_text'] ?? null,
            'cta_url' => $validated['cta_url'] ?? null,
            'action_buttons' => $actionButtons,
            'is_active' => true,
        ]);

        return back()->with('success', 'Aturan balasan otomatis berhasil dibuat.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $rule = AutoReply::where('workspace_id', $workspace->id)->findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'trigger_type' => ['required', 'in:exact,contains,starts_with,ai_gemini'],
            'keyword' => ['required', 'string', 'max:255'],
            'reply_message' => ['required', 'string'],
            'device_id' => [
                'nullable',
                Rule::exists('devices', 'id')->where('workspace_id', $workspace->id),
            ],
            'reply_media_url' => ['nullable', 'url', 'max:500', new SafePublicUrlRule],
            'cta_text' => ['nullable', 'string', 'max:100'],
            'cta_url' => ['nullable', 'url', 'max:500', new SafePublicUrlRule],
            'action_buttons' => ['nullable'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $rawActions = $request->input('action_buttons');
        if (is_string($rawActions)) {
            $rawActions = preg_split('/[,|\n]+/', $rawActions, -1, PREG_SPLIT_NO_EMPTY);
        }
        $actionButtons = is_array($rawActions)
            ? array_values(array_filter(array_map('trim', $rawActions)))
            : null;

        $updateData = [
            'device_id' => $validated['device_id'] ?? null,
            'name' => $validated['name'],
            'trigger_type' => $validated['trigger_type'],
            'keyword' => strtolower(trim($validated['keyword'])),
            'reply_message' => $validated['reply_message'],
            'reply_media_url' => $validated['reply_media_url'] ?? null,
            'cta_text' => $validated['cta_text'] ?? null,
            'cta_url' => $validated['cta_url'] ?? null,
            'action_buttons' => $actionButtons,
        ];

        if (array_key_exists('is_active', $validated) && $validated['is_active'] !== null) {
            $updateData['is_active'] = (bool) $validated['is_active'];
        }

        $rule->update($updateData);

        return back()->with('success', 'Aturan balasan otomatis berhasil diperbarui.');
    }

    public function toggle(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $rule = AutoReply::where('workspace_id', $workspace->id)->findOrFail($id);
        $rule->update(['is_active' => ! $rule->is_active]);

        return back()->with('success', 'Status aturan auto-reply berhasil diubah.');
    }

    public function toggleMaster(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $current = (bool) SystemSetting::get("auto_reply_master_enabled_{$workspace->id}", true);
        $newState = ! $current;
        SystemSetting::set("auto_reply_master_enabled_{$workspace->id}", $newState);

        $statusText = $newState ? 'diaktifkan' : 'dinonaktifkan';

        return back()->with('success', "Fitur Auto-Reply & Asisten AI berhasil {$statusText}.");
    }

    public function destroy(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        AutoReply::where('workspace_id', $workspace->id)->where('id', $id)->delete();

        return back()->with('success', 'Aturan balasan otomatis berhasil dihapus.');
    }

    public function updateAiConfig(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'prompt_context' => ['required', 'string', 'max:2000'],
            'api_key' => ['nullable', 'string', 'max:255'],
        ]);

        SystemSetting::set("ai_gemini_enabled_{$workspace->id}", $validated['enabled']);
        SystemSetting::set("ai_gemini_prompt_context_{$workspace->id}", $validated['prompt_context']);
        if (array_key_exists('api_key', $validated)) {
            SystemSetting::set("ai_gemini_api_key_{$workspace->id}", (string) $validated['api_key']);
        }

        if ($request->user()?->isSuperAdmin()) {
            SystemSetting::set('ai_gemini_enabled', $validated['enabled']);
            SystemSetting::set('ai_gemini_prompt_context', $validated['prompt_context']);
        }

        return back()->with('success', 'Konfigurasi Asisten AI Gemini berhasil disimpan.');
    }

    public function updateMenuConfig(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'style' => ['nullable', 'string', 'in:pandawa,interactive,buttons,compact,standard,boxed'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'keywords' => ['required', 'string', 'max:1000'],
            'device_id' => [
                'nullable',
                Rule::exists('devices', 'id')->where('workspace_id', $workspace->id),
            ],
            'header' => ['nullable', 'string', 'max:1000'],
            'footer' => ['nullable', 'string', 'max:1000'],
            'buttons' => ['nullable', 'array'],
            'buttons.*.label' => ['nullable', 'string', 'max:50'],
            'buttons.*.keyword' => ['nullable', 'string', 'max:100'],
        ]);

        SystemSetting::set("greeting_menu_enabled_{$workspace->id}", $validated['enabled']);
        SystemSetting::set("greeting_menu_style_{$workspace->id}", $validated['style'] ?? 'buttons');
        SystemSetting::set("greeting_menu_button_text_{$workspace->id}", $validated['button_text'] ?? '📋 Buka Pilihan Layanan');
        SystemSetting::set("greeting_menu_keywords_{$workspace->id}", strtolower(trim($validated['keywords'])));
        SystemSetting::set("greeting_menu_device_id_{$workspace->id}", $validated['device_id'] ?? null);
        SystemSetting::set("greeting_menu_header_{$workspace->id}", $validated['header'] ?? '');
        SystemSetting::set("greeting_menu_footer_{$workspace->id}", $validated['footer'] ?? '');

        if (isset($validated['buttons']) && is_array($validated['buttons'])) {
            $sanitizedButtons = [];
            foreach ($validated['buttons'] as $btn) {
                if (! empty($btn['label'])) {
                    $sanitizedButtons[] = [
                        'label' => trim($btn['label']),
                        'keyword' => ! empty($btn['keyword']) ? trim($btn['keyword']) : trim($btn['label']),
                    ];
                }
            }
            SystemSetting::set("greeting_menu_buttons_{$workspace->id}", json_encode($sanitizedButtons));
        }

        return back()->with('success', 'Pengaturan Respon Sambutan & Menu Otomatis berhasil disimpan.');
    }

    public function seedTemplateRules(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $templates = [
            [
                'name' => 'Administrasi',
                'trigger_type' => 'contains',
                'keyword' => '1, administrasi, daftar, pendaftaran, berkas, syarat',
                'reply_message' => "Halo Kak {nama}! Untuk pengurusan administrasi atau pendaftaran, silakan akses tautan formulir online resmi kami:\n\n🔗 Formulir Pendaftaran: https://pmb.mardira.ac.id/form\n\nStaf kami akan segera memverifikasi berkas yang telah Anda kirimkan.",
                'cta_text' => 'Isi Formulir',
                'cta_url' => 'https://pmb.mardira.ac.id/form',
                'action_buttons' => ['Bantuan & Pengaduan', 'Jam Operasional'],
            ],
            [
                'name' => 'Bantuan & Pengaduan',
                'trigger_type' => 'contains',
                'keyword' => '2, bantuan, pengaduan, komplain, kendala, keluhan',
                'reply_message' => "👩‍💼 *Pusat Bantuan & Pengaduan Layanan*\n\nAda kendala atau hal yang ingin disampaikan? Silakan ketikkan detail pertanyaan atau kendala Anda di sini. Tim support kami akan segera merespon.",
                'cta_text' => 'Pusat Bantuan',
                'cta_url' => 'https://pmb.mardira.ac.id/bantuan',
                'action_buttons' => ['Layanan Administrasi & Pendaftaran', 'Menu Utama'],
            ],
            [
                'name' => 'Jam Operasional & Alamat',
                'trigger_type' => 'contains',
                'keyword' => '3, jam, operasional, kantor, lokasi, alamat',
                'reply_message' => "🏢 *Jam Operasional & Lokasi Layanan*\n\n📅 Senin - Jumat: 08.00 - 16.00 WIB\n📅 Sabtu: 08.00 - 13.00 WIB\n📍 Alamat: Jl. Soekarno Hatta No. 211, Bandung.\n\nKetik *menu* kapan saja untuk kembali ke daftar pilihan.",
                'cta_text' => null,
                'cta_url' => null,
                'action_buttons' => ['Layanan Administrasi & Pendaftaran'],
            ],
            [
                'name' => 'Hubungi Customer Service Langsung',
                'trigger_type' => 'contains',
                'keyword' => '4, cs, admin, operator, staf, manusia',
                'reply_message' => "👩‍💼 *Terhubung dengan Tim Customer Service*\n\nSilakan tinggalkan pesan Anda secara lengkap, staf customer service kami akan segera membalas chat Anda secepat mungkin. Terima kasih telah menghubungi kami!",
                'cta_text' => null,
                'cta_url' => null,
                'action_buttons' => ['Menu Utama'],
            ],
        ];

        foreach ($templates as $tpl) {
            AutoReply::updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'name' => $tpl['name'],
                ],
                [
                    'trigger_type' => $tpl['trigger_type'],
                    'keyword' => $tpl['keyword'],
                    'reply_message' => $tpl['reply_message'],
                    'cta_text' => $tpl['cta_text'] ?? null,
                    'cta_url' => $tpl['cta_url'] ?? null,
                    'action_buttons' => $tpl['action_buttons'] ?? null,
                    'is_active' => true,
                    'hit_count' => 0,
                ]
            );
        }

        SystemSetting::set("greeting_menu_buttons_{$workspace->id}", json_encode([
            ['label' => 'Administrasi', 'keyword' => 'administrasi'],
            ['label' => 'Bantuan & Pengaduan', 'keyword' => 'bantuan'],
            ['label' => 'Jam Operasional & Alamat', 'keyword' => 'jam'],
        ]));
        SystemSetting::set("greeting_menu_style_{$workspace->id}", 'buttons');

        return back()->with('success', 'Template menu standar berhasil dimuat.');
    }

    public function simulate(Request $request): JsonResponse
    {
        $workspace = $this->getWorkspace($request);
        $incomingMessage = trim($request->input('message', ''));
        $deviceId = $request->input('device_id') ? (int) $request->input('device_id') : null;

        $result = $this->autoReplyService->simulateResponse($workspace->id, $incomingMessage, $deviceId);

        return response()->json($result);
    }
}
