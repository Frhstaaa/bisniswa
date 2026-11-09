<?php

namespace App\Http\Controllers;

use App\Models\AutoReply;
use App\Models\Device;
use App\Models\SystemSetting;
use App\Rules\SafePublicUrlRule;
use App\Services\AutoReplyService;
use App\Traits\HasWorkspaceContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AutoReplyController extends Controller
{
    use HasWorkspaceContext;

    public function __construct(
        protected AutoReplyService $autoReplyService
    ) {}

    public function index(Request $request): Response
    {
        $workspace = $this->getWorkspace($request);

        $autoReplies = AutoReply::where('workspace_id', $workspace->id)
            ->with('device')
            ->latest('id')
            ->get();

        $devices = Device::where('workspace_id', $workspace->id)->get();

        // AI Gemini Configuration
        $aiEnabled = (bool) SystemSetting::get("ai_gemini_enabled_{$workspace->id}", SystemSetting::get('ai_gemini_enabled', true));
        $aiPromptContext = SystemSetting::get(
            "ai_gemini_prompt_context_{$workspace->id}",
            SystemSetting::get(
                'ai_gemini_prompt_context',
                'Anda adalah Asisten Virtual Customer Service resmi dari '.$workspace->name.'. Berikan jawaban yang ramah, sopan, ringkas, dan jelas dalam Bahasa Indonesia untuk membantu kebutuhan pelanggan.'
            )
        );
        $aiApiKey = SystemSetting::get("ai_gemini_api_key_{$workspace->id}", '');
        $aiPersona = SystemSetting::get("ai_gemini_persona_{$workspace->id}", 'cs_friendly');
        $aiKnowledgeBase = SystemSetting::get("ai_gemini_knowledge_base_{$workspace->id}", '');

        // Menu & Greeting Configuration
        $rawButtons = SystemSetting::get("greeting_menu_buttons_{$workspace->id}");
        $menuButtons = ! empty($rawButtons) ? json_decode($rawButtons, true) : null;
        if (empty($menuButtons) || ! is_array($menuButtons)) {
            $menuButtons = [
                ['label' => 'Katalog Produk', 'keyword' => 'katalog'],
                ['label' => 'Format Pemesanan', 'keyword' => 'order'],
                ['label' => 'Bantuan & CS', 'keyword' => 'cs'],
            ];
        }

        $menuConfig = [
            'enabled' => (bool) SystemSetting::get("greeting_menu_enabled_{$workspace->id}", true),
            'style' => SystemSetting::get("greeting_menu_style_{$workspace->id}", 'buttons'),
            'button_text' => SystemSetting::get("greeting_menu_button_text_{$workspace->id}", '📋 Buka Pilihan Layanan'),
            'keywords' => SystemSetting::get(
                "greeting_menu_keywords_{$workspace->id}",
                'hi, halo, hai, hello, hei, p, info, informasi, menu, bantuan, help, list, daftar menu, pilihan, start, mulai, assalamualaikum, salam, permisi, siang, pagi, sore, malam, tes, test, ping, admin, cs'
            ),
            'device_id' => SystemSetting::get("greeting_menu_device_id_{$workspace->id}", ''),
            'header' => SystemSetting::get("greeting_menu_header_{$workspace->id}", ''),
            'footer' => SystemSetting::get("greeting_menu_footer_{$workspace->id}", ''),
            'buttons' => $menuButtons,
        ];

        // Business Working Hours & Away Schedule Configuration
        $businessHours = $this->autoReplyService->checkBusinessHours($workspace->id);
        $scheduleConfig = [
            'enabled' => (bool) SystemSetting::get("auto_reply_schedule_enabled_{$workspace->id}", false),
            'days' => $businessHours['days'],
            'start' => $businessHours['start'],
            'end' => $businessHours['end'],
            'timezone' => 'Asia/Jakarta',
            'away_message' => $businessHours['away_message'],
            'away_mode' => $businessHours['away_mode'],
            'is_currently_outside' => $businessHours['is_outside'],
            'operating_text' => $businessHours['operating_text'],
        ];

        $masterEnabled = (bool) SystemSetting::get("auto_reply_master_enabled_{$workspace->id}", true);

        // Predefined Multi-Industry Templates metadata for frontend preview & quick loading
        $industryTemplates = [
            [
                'id' => 'ecommerce',
                'title' => 'Toko Online / Retail / E-Commerce',
                'description' => 'Sangat cocok untuk jualan online, fashion, kecantikan, barang elektronik & reseller.',
                'badge' => 'Paling Populer',
                'rules_count' => 5,
                'sample_rules' => ['Katalog & Daftar Harga', 'Format Pemesanan Cepat', 'Cek Resi & Pengiriman', 'Rekening Resmi Pembayaran', 'Hubungi Customer Service'],
            ],
            [
                'id' => 'fnb',
                'title' => 'Resto, Cafe & Kuliner (F&B)',
                'description' => 'Cocok untuk cafe, rumah makan, catering, bakery, dan usaha makanan/minuman.',
                'badge' => 'F&B Spesial',
                'rules_count' => 4,
                'sample_rules' => ['Buku Menu Makanan & Minuman', 'Reservasi Meja & Tempat', 'Layanan Delivery / Antar', 'Lokasi Outlet & Jam Buka'],
            ],
            [
                'id' => 'services',
                'title' => 'Klinik, Salon & Jasa Profesional',
                'description' => 'Ideal untuk klinik kecantikan/gigi, salon, barbershop, bengkel & konsultan.',
                'badge' => 'Jasa & Booking',
                'rules_count' => 4,
                'sample_rules' => ['Daftar Layanan & Paket Treatment', 'Jadwal Dokter & Terapis', 'Booking Janji Temu (Appointment)', 'Lokasi & Kontak Darurat'],
            ],
            [
                'id' => 'corporate',
                'title' => 'B2B, IT, Software & Agensi',
                'description' => 'Dirancang untuk agensi kreatif, software house, supplier & perusahaan jasa korporat.',
                'badge' => 'Enterprise & B2B',
                'rules_count' => 4,
                'sample_rules' => ['Company Profile & Portofolio', 'Paket Solusi Bisnis & Harga', 'Jadwalkan Demo / Meeting Zoom', 'Dokumentasi API & Teknis'],
            ],
            [
                'id' => 'education',
                'title' => 'Sekolah, Kampus, Bimbel & Kursus',
                'description' => 'Khusus untuk penerimaan siswa/mahasiswa baru, info kurikulum & pembayaran SPP.',
                'badge' => 'Akademik',
                'rules_count' => 4,
                'sample_rules' => ['Informasi Pendaftaran Siswa Baru', 'Daftar Program / Jurusan', 'Rincian Biaya Pendidikan / SPP', 'Jam Operasional & Alamat Kampus'],
            ],
        ];

        return Inertia::render('AutoReply/Index', [
            'masterEnabled' => $masterEnabled,
            'autoReplies' => $autoReplies,
            'devices' => $devices,
            'menuConfig' => $menuConfig,
            'scheduleConfig' => $scheduleConfig,
            'industryTemplates' => $industryTemplates,
            'aiConfig' => [
                'enabled' => (bool) $aiEnabled,
                'prompt_context' => $aiPromptContext,
                'api_key' => $aiApiKey,
                'persona' => $aiPersona,
                'knowledge_base' => $aiKnowledgeBase,
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
            'category' => ['nullable', 'string', 'max:50'],
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
            'category' => $validated['category'] ?? 'general',
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
            'category' => ['nullable', 'string', 'max:50'],
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
            'category' => $validated['category'] ?? ($rule->category ?? 'general'),
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

    public function updateScheduleConfig(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'days' => ['required', 'array'],
            'days.*' => ['integer', 'between:1,7'],
            'start' => ['required', 'string', 'regex:/^(?:2[0-3]|[01][0-9]):[0-5][0-9]$/'],
            'end' => ['required', 'string', 'regex:/^(?:2[0-3]|[01][0-9]):[0-5][0-9]$/'],
            'away_message' => ['required', 'string', 'max:2000'],
            'away_mode' => ['required', 'string', 'in:fallback_only,always_prepend,always_away'],
        ]);

        SystemSetting::set("auto_reply_schedule_enabled_{$workspace->id}", $validated['enabled']);
        SystemSetting::set("auto_reply_schedule_days_{$workspace->id}", json_encode($validated['days']));
        SystemSetting::set("auto_reply_schedule_start_{$workspace->id}", $validated['start']);
        SystemSetting::set("auto_reply_schedule_end_{$workspace->id}", $validated['end']);
        SystemSetting::set("auto_reply_away_message_{$workspace->id}", $validated['away_message']);
        SystemSetting::set("auto_reply_away_mode_{$workspace->id}", $validated['away_mode']);

        return back()->with('success', 'Jadwal jam kerja & pesan luar jam operasional berhasil disimpan.');
    }

    public function updateAiConfig(Request $request): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);

        $validated = $request->validate([
            'enabled' => ['required', 'boolean'],
            'prompt_context' => ['required', 'string', 'max:3000'],
            'api_key' => ['nullable', 'string', 'max:255'],
            'persona' => ['nullable', 'string', 'max:50'],
            'knowledge_base' => ['nullable', 'string', 'max:5000'],
        ]);

        SystemSetting::set("ai_gemini_enabled_{$workspace->id}", $validated['enabled']);
        SystemSetting::set("ai_gemini_prompt_context_{$workspace->id}", $validated['prompt_context']);
        if (array_key_exists('api_key', $validated)) {
            SystemSetting::set("ai_gemini_api_key_{$workspace->id}", (string) $validated['api_key']);
        }
        if (array_key_exists('persona', $validated)) {
            SystemSetting::set("ai_gemini_persona_{$workspace->id}", (string) $validated['persona']);
        }
        if (array_key_exists('knowledge_base', $validated)) {
            SystemSetting::set("ai_gemini_knowledge_base_{$workspace->id}", (string) $validated['knowledge_base']);
        }

        if ($request->user()?->isSuperAdmin()) {
            SystemSetting::set('ai_gemini_enabled', $validated['enabled']);
            SystemSetting::set('ai_gemini_prompt_context', $validated['prompt_context']);
        }

        return back()->with('success', 'Konfigurasi Asisten AI Gemini & Basis Pengetahuan berhasil disimpan.');
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
        $industry = $request->input('industry', 'standard');
        $mode = $request->input('mode', 'append'); // 'replace' or 'append'

        $standardRules = [
            [
                'name' => 'Administrasi',
                'category' => 'Pendaftaran',
                'trigger_type' => 'contains',
                'keyword' => '1, administrasi, daftar, pendaftaran, berkas, syarat',
                'reply_message' => "Halo Kak {nama}! Untuk pengurusan administrasi atau pendaftaran, silakan akses tautan formulir online resmi kami:\n\n🔗 Formulir Pendaftaran: https://pmb.mardira.ac.id/form\n\nStaf kami akan segera memverifikasi berkas yang telah Anda kirimkan.",
                'cta_text' => 'Isi Formulir',
                'cta_url' => 'https://pmb.mardira.ac.id/form',
                'action_buttons' => ['Bantuan & Pengaduan', 'Jam Operasional'],
            ],
            [
                'name' => 'Bantuan & Pengaduan',
                'category' => 'Layanan & CS',
                'trigger_type' => 'contains',
                'keyword' => '2, bantuan, pengaduan, komplain, kendala, keluhan',
                'reply_message' => "👩‍💼 *Pusat Bantuan & Pengaduan Layanan*\n\nAda kendala atau hal yang ingin disampaikan? Silakan ketikkan detail pertanyaan atau kendala Anda di sini. Tim support kami akan segera merespon.",
                'cta_text' => 'Pusat Bantuan',
                'cta_url' => 'https://pmb.mardira.ac.id/bantuan',
                'action_buttons' => ['Administrasi', 'Jam Operasional'],
            ],
            [
                'name' => 'Jam Operasional & Alamat',
                'category' => 'Informasi',
                'trigger_type' => 'contains',
                'keyword' => '3, jam, operasional, kantor, lokasi, alamat',
                'reply_message' => "🏢 *Jam Operasional & Lokasi Layanan*\n\n📅 Senin - Jumat: 08.00 - 16.00 WIB\n📅 Sabtu: 08.00 - 13.00 WIB\n📍 Alamat: Politeknik Mardira Indonesia, Jl. Soekarno Hatta No. 211, Bandung.\n\nKetik *menu* kapan saja untuk kembali ke daftar pilihan.",
                'cta_text' => null,
                'cta_url' => null,
                'action_buttons' => ['Administrasi'],
            ],
            [
                'name' => 'Hubungi Customer Service Langsung',
                'category' => 'Layanan & CS',
                'trigger_type' => 'contains',
                'keyword' => '4, cs, admin, operator, staf, manusia',
                'reply_message' => "👩‍💼 *Terhubung dengan Tim Customer Service*\n\nSilakan tinggalkan pesan Anda secara lengkap, staf customer service kami akan segera membalas chat Anda secepat mungkin. Terima kasih telah menghubungi kami!",
                'cta_text' => null,
                'cta_url' => null,
                'action_buttons' => ['Administrasi', 'Bantuan & Pengaduan'],
            ],
        ];

        $definitions = [
            'standard' => [
                'name_label' => 'Standar Layanan & Kampus',
                'buttons' => [
                    ['label' => 'Administrasi', 'keyword' => 'administrasi'],
                    ['label' => 'Bantuan & Pengaduan', 'keyword' => 'bantuan'],
                    ['label' => 'Jam Operasional & Alamat', 'keyword' => 'jam'],
                ],
                'rules' => $standardRules,
            ],
            'education' => [
                'name_label' => 'Pendidikan & Kampus',
                'buttons' => [
                    ['label' => 'Administrasi', 'keyword' => 'administrasi'],
                    ['label' => 'Bantuan & Pengaduan', 'keyword' => 'bantuan'],
                    ['label' => 'Jam Operasional', 'keyword' => 'jam'],
                ],
                'rules' => $standardRules,
            ],
            'ecommerce' => [
                'name_label' => 'Toko Online / Retail',
                'buttons' => [
                    ['label' => 'Katalog Produk', 'keyword' => 'katalog'],
                    ['label' => 'Format Pemesanan', 'keyword' => 'order'],
                    ['label' => 'Rekening Pembayaran', 'keyword' => 'bayar'],
                ],
                'rules' => [
                    [
                        'name' => 'Katalog & Daftar Harga Produk',
                        'category' => 'Penjualan',
                        'trigger_type' => 'contains',
                        'keyword' => '1, katalog, produk, harga, daftar harga, pricelist',
                        'reply_message' => "🛍️ *KATALOG PRODUK & DAFTAR HARGA*\n\nHalo Kak {nama}! Selamat datang di toko resmi {workspace}. Berikut koleksi produk terlaris kami:\n\n1. Paket Best Seller Glow Up - Rp 85.000\n2. Paket Serum Intensive Care - Rp 125.000\n3. Paket Eksklusif Complete Set - Rp 195.000\n\n📌 *Jaminan:* Semua produk 100% Original, BPOM & Siap Kirim Hari Ini.\n\nKetik *2* untuk Format Pemesanan Cepat atau *4* untuk Cek Rekening Pembayaran.",
                        'cta_text' => 'Lihat Katalog Lengkap',
                        'cta_url' => 'https://wa.me/?text=InfoKatalogLengkap',
                        'action_buttons' => ['Format Order', 'Rekening & Bayar', 'Hubungi CS'],
                    ],
                    [
                        'name' => 'Format Pemesanan Cepat',
                        'category' => 'Penjualan',
                        'trigger_type' => 'contains',
                        'keyword' => '2, order, pesan, beli, cara order, format order, checkout',
                        'reply_message' => "📝 *FORMAT PEMESANAN CEPAT*\n\nSilakan lengkapi format order di bawah ini lalu kirimkan kembali ke chat ini ya Kak:\n\n• Nama Penerima: {nama}\n• Nomor HP: {nomor}\n• Alamat Lengkap: (Jl, No Rumah, RT/RW, Kelurahan, Kecamatan, Kota, Kode Pos)\n• Nama Produk & Jumlah:\n• Pilihan Ekspedisi: (JNE / J&T / SiCepat)\n• Metode Pembayaran: (Transfer BCA / Mandiri / QRIS)\n\nSetelah format dikirimkan, Admin kami akan segera menghitung total belanja beserta subsidi ongkirnya! 🙏",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Katalog Produk', 'Rekening Resmi'],
                    ],
                    [
                        'name' => 'Cek Resi & Pengiriman',
                        'category' => 'Layanan & CS',
                        'trigger_type' => 'contains',
                        'keyword' => '3, resi, lacak, status kirim, ongkir, ekspedisi, paket',
                        'reply_message' => "📦 *CEK STATUS RESI & PENGIRIMAN*\n\n• Jadwal Pengiriman: Senin s/d Sabtu pukul 15.00 WIB.\n• Nomor resi otomatis diperbarui H+1 setelah paket diserahkan ke kurir.\n• Untuk bantuan lacak posisi paket Anda, silakan ketik *Nomor Invoice* atau *Nama Penerima* di sini. CS kami siap membantu mengecek status pengiriman.",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Format Pemesanan', 'Hubungi CS'],
                    ],
                    [
                        'name' => 'Rekening Resmi Pembayaran',
                        'category' => 'Penjualan',
                        'trigger_type' => 'contains',
                        'keyword' => '4, bayar, pembayaran, rekening, transfer, qris, dana',
                        'reply_message' => "💳 *REKENING RESMI PEMBAYARAN*\n\nSilakan transfer pembayaran pesanan Anda ke rekening resmi {workspace} berikut:\n\n🏦 *BCA:* 891-012-3456 (a.n {workspace})\n🏦 *Mandiri:* 130-00-9876543-2 (a.n {workspace})\n📱 *QRIS All Payment:* Hubungi CS untuk barcode QRIS instan.\n\n⚠️ *Penting:* Harap waspada penipuan! Kami tidak pernah meminta transfer selain ke rekening atas nama di atas. Setelah transfer, kirimkan bukti foto ke nomor ini ya Kak.",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Konfirmasi Transfer', 'Format Pemesanan'],
                    ],
                    [
                        'name' => 'Customer Service & Bantuan',
                        'category' => 'Layanan & CS',
                        'trigger_type' => 'contains',
                        'keyword' => '5, cs, admin, bantuan, kendala, komplain, operator',
                        'reply_message' => "👩‍💼 *PUSAT LAYANAN CUSTOMER SERVICE*\n\nHalo Kak {nama}! Ada pertanyaan atau kendala seputar produk atau pesanan Anda? Silakan sampaikan pesan Anda, tim CS kami siap membantu dengan senang hati pada jam operasional ({jam_operasional}).",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Katalog Produk', 'Menu Utama'],
                    ],
                ],
            ],

            'fnb' => [
                'name_label' => 'Resto, Cafe & F&B',
                'buttons' => [
                    ['label' => 'Buku Menu', 'keyword' => 'menu'],
                    ['label' => 'Pesan Antar', 'keyword' => 'delivery'],
                    ['label' => 'Reservasi Meja', 'keyword' => 'reservasi'],
                ],
                'rules' => [
                    [
                        'name' => 'Buku Menu Makanan & Minuman',
                        'category' => 'Menu',
                        'trigger_type' => 'contains',
                        'keyword' => '1, menu, makanan, minuman, daftar menu, coffee, cemilan',
                        'reply_message' => "🍽️ *DAFTAR MENU SPESIAL HARI INI*\n\nHalo Kak {nama}! Selamat datang di {workspace}. Silakan cek hidangan lezat favorit pelanggan kami:\n\n🍛 *Menu Makanan:*\n• Nasi Goreng Spesial Rempah - Rp 28.000\n• Ayam Bakar Madu Pedas Manis - Rp 32.000\n• Mie Nyemek Telur Gurih - Rp 22.000\n\n☕ *Menu Minuman:*\n• Kopi Susu Aren Signature - Rp 18.000\n• Matcha Creamy Latte - Rp 22.000\n• Es Lemon Tea Segar - Rp 12.000\n\nBalas *2* untuk Pesan Antar / Takeaway atau *3* untuk Reservasi Meja.",
                        'cta_text' => 'Lihat Foto Menu',
                        'cta_url' => 'https://wa.me/?text=BukuMenuLengkap',
                        'action_buttons' => ['Pesan Antar', 'Reservasi Meja'],
                    ],
                    [
                        'name' => 'Pesan Antar / Delivery',
                        'category' => 'Penjualan',
                        'trigger_type' => 'contains',
                        'keyword' => '2, delivery, antar, takeaway, pesan antar, bungkus',
                        'reply_message' => "🛵 *LAYANAN PESAN ANTAR (DELIVERY)*\n\nSilakan isi format pesanan hangat untuk diantar langsung ke lokasi Anda:\n• Nama: {nama}\n• Nomor HP: {nomor}\n• Alamat Pengantaran:\n• Pesanan & Jumlah Porsi:\n• Catatan Tambahan (Pedas / Sedang):\n\nKirim format ini, pesanan Anda akan segera disiapkan oleh dapur kami!",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Buku Menu', 'Reservasi Meja'],
                    ],
                    [
                        'name' => 'Reservasi Meja & Tempat',
                        'category' => 'Layanan & CS',
                        'trigger_type' => 'contains',
                        'keyword' => '3, reservasi, booking, meja, pesan tempat, rombongan',
                        'reply_message' => "🪑 *RESERVASI MEJA & BOOKING TEMPAT*\n\nIngin acara kumpul, ulang tahun, meeting atau nongkrong? Silakan kirimkan data reservasi:\n• Nama Pemesan: {nama}\n• Tanggal & Jam Kedatangan:\n• Jumlah Orang:\n• Pilihan Area: (Indoor AC / Outdoor Garden)\n\nTim kami akan mengonfirmasi ketersediaan meja dalam hitungan menit.",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Buku Menu', 'Lokasi & Jam Buka'],
                    ],
                    [
                        'name' => 'Lokasi Outlet & Jam Buka',
                        'category' => 'Informasi',
                        'trigger_type' => 'contains',
                        'keyword' => '4, lokasi, alamat, jam buka, gmaps, petunjuk rute',
                        'reply_message' => "📍 *LOKASI OUTLET & JAM BUKA*\n\n🕒 *Jam Buka:* Buka Setiap Hari (10.00 - 22.00 WIB)\n📍 *Alamat:* {workspace}, Jl. Kenangan Kuliner No. 88.\n🗺️ *Google Maps:* https://maps.google.com/?q={workspace}\n\nTersedia area parkir luas, Wi-Fi kencang, mushola, dan colokan listrik di setiap meja.",
                        'cta_text' => 'Buka Google Maps',
                        'cta_url' => 'https://maps.google.com/?q={workspace}',
                        'action_buttons' => ['Buku Menu', 'Reservasi Meja'],
                    ],
                ],
            ],

            'services' => [
                'name_label' => 'Klinik, Salon & Jasa',
                'buttons' => [
                    ['label' => 'Daftar Layanan', 'keyword' => 'layanan'],
                    ['label' => 'Booking Jadwal', 'keyword' => 'booking'],
                    ['label' => 'Lokasi Klinik', 'keyword' => 'lokasi'],
                ],
                'rules' => [
                    [
                        'name' => 'Daftar Layanan & Paket Treatment',
                        'category' => 'Layanan',
                        'trigger_type' => 'contains',
                        'keyword' => '1, layanan, perawatan, paket, treatment, konsultasi, jasa',
                        'reply_message' => "✨ *DAFTAR LAYANAN & TREATMENT UNGGULAN*\n\nHalo Kak {nama}! Di {workspace}, kami menyediakan perawatan terbaik dengan teknologi modern:\n\n1. Facial Brightening & Deep Cleansing - Rp 150.000\n2. Treatment Acne Laser Therapy - Rp 250.000\n3. Paket Relaksasi & Spa Refreshing - Rp 180.000\n\nSemua tindakan ditangani langsung oleh tenaga medis & profesional bersertifikat.\n\nKetik *2* untuk Cek Jadwal atau *3* untuk Booking Janji Temu.",
                        'cta_text' => 'Konsultasi Online',
                        'cta_url' => 'https://wa.me/?text=TanyaTreatment',
                        'action_buttons' => ['Booking Janji Temu', 'Jadwal Dokter'],
                    ],
                    [
                        'name' => 'Jadwal Dokter & Terapis',
                        'category' => 'Layanan',
                        'trigger_type' => 'contains',
                        'keyword' => '2, jadwal, dokter, terapis, praktek, jam praktek',
                        'reply_message' => "📅 *JADWAL PRAKTEK DOKTER & TERAPIS*\n\n• Sesi Pagi: 09.00 - 13.00 WIB\n• Sesi Sore: 15.00 - 20.00 WIB\n• Hari: Senin s/d Sabtu (Minggu dengan perjanjian khusus)\n\nSilakan pilih waktu yang Anda inginkan untuk menghindari antrean di klinik.",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Booking Janji Temu', 'Daftar Layanan'],
                    ],
                    [
                        'name' => 'Booking Janji Temu (Appointment)',
                        'category' => 'Penjualan',
                        'trigger_type' => 'contains',
                        'keyword' => '3, booking, janji, temu, appointment, daftar, antrian',
                        'reply_message' => "📋 *FORMAT BOOKING JANJI TEMU*\n\nSilakan kirimkan data janji temu Anda:\n• Nama Pasien / Tamu: {nama}\n• Nomor HP: {nomor}\n• Treatment yang Dipilih:\n• Hari & Jam Rencana Datang:\n\nStaf reservasi kami akan segera mengunci slot jadwal untuk Anda.",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Daftar Layanan', 'Lokasi & Alamat'],
                    ],
                    [
                        'name' => 'Lokasi & Kontak Darurat',
                        'category' => 'Informasi',
                        'trigger_type' => 'contains',
                        'keyword' => '4, lokasi, alamat, gmaps, telepon, darurat',
                        'reply_message' => "📍 *LOKASI KLINIK & KONTAK KAMI*\n\n📍 Alamat: {workspace}, Jl. Sehat Makmur No. 12.\n🕒 Jam Buka: 08.30 - 20.30 WIB\n🗺️ Peta Lokasi: https://maps.google.com/?q={workspace}",
                        'cta_text' => 'Buka Peta Lokasi',
                        'cta_url' => 'https://maps.google.com/?q={workspace}',
                        'action_buttons' => ['Booking Jadwal', 'Daftar Layanan'],
                    ],
                ],
            ],

            'corporate' => [
                'name_label' => 'Corporate, IT & B2B',
                'buttons' => [
                    ['label' => 'Profil Perusahaan', 'keyword' => 'profil'],
                    ['label' => 'Paket Solusi Bisnis', 'keyword' => 'solusi'],
                    ['label' => 'Jadwal Demo Meeting', 'keyword' => 'demo'],
                ],
                'rules' => [
                    [
                        'name' => 'Company Profile & Portofolio',
                        'category' => 'Informasi',
                        'trigger_type' => 'contains',
                        'keyword' => '1, profil, tentang, company profile, portofolio, klien',
                        'reply_message' => "🏢 *COMPANY PROFILE & PORTOFOLIO BISNIS*\n\n{workspace} adalah penyedia solusi teknologi enterprise terdepan:\n\n• Solusi WhatsApp Gateway Berkecepatan Tinggi (Multi-Device Cluster)\n• Sistem CRM Otomatisasi & Asisten AI 24/7\n• Integrasi REST API & Real-time Webhook\n• Lebih dari 500+ Klien Bisnis Aktif di Indonesia\n\nBalas *2* untuk Rincian Paket Harga atau *3* untuk Jadwalkan Demo Meeting.",
                        'cta_text' => 'Unduh Company Profile',
                        'cta_url' => 'https://wa.me/?text=UnduhProposalB2B',
                        'action_buttons' => ['Paket Solusi Bisnis', 'Jadwalkan Demo'],
                    ],
                    [
                        'name' => 'Paket Solusi Bisnis & Harga',
                        'category' => 'Penjualan',
                        'trigger_type' => 'contains',
                        'keyword' => '2, paket, harga, quotation, biaya, proposal, solusi',
                        'reply_message' => "💼 *PAKET LAYANAN & INVESTASI BISNIS*\n\n1. *Starter Business:* Cocok untuk UKM & Olshop (1 Device, 5.000 Pesan/bln)\n2. *Pro Growth:* Bisnis Menengah (3 Device, 25.000 Pesan/bln, Auto-Reply AI)\n3. *Enterprise Dedicated:* Perusahaan Besar (Custom Server, SLA 99.9%, Multi-CS)\n\nKonsultasikan kebutuhan spesifik perusahaan Anda dengan tim konsultan kami.",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Jadwalkan Demo Meeting', 'Profil Perusahaan'],
                    ],
                    [
                        'name' => 'Jadwalkan Demo & Konsultasi',
                        'category' => 'Penjualan',
                        'trigger_type' => 'contains',
                        'keyword' => '3, demo, meeting, zoom, konsultasi, jadwal',
                        'reply_message' => "📅 *JADWALKAN DEMO LIVE & KONSULTASI*\n\nSilakan isi detail perusahaan Anda:\n• Nama Representatif: {nama}\n• Nama Perusahaan / Bisnis:\n• Jumlah Volume Pesan / Bulan:\n• Jadwal Zoom yang Diinginkan:\n\nAccount Executive kami akan segera mengirimkan tautan undangan meeting Zoom resmi.",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Paket Layanan', 'Profil Perusahaan'],
                    ],
                    [
                        'name' => 'Dokumentasi API & Integrasi Teknis',
                        'category' => 'Teknis',
                        'trigger_type' => 'contains',
                        'keyword' => '4, api, teknis, webhook, integrasi, postman, dokumentasi',
                        'reply_message' => "⚙️ *DOKUMENTASI REST API & WEBHOOK*\n\n• Endpoint API v1: /api/v1/messages/send\n• Webhook Event: incoming_message, message_status\n• Koleksi Postman & SDK dapat diakses melalui Dashboard Pengembang MARDIRA WA.\n\nTim teknis kami siap memberikan panduan bridging sistem ERP/CRM Anda.",
                        'cta_text' => null,
                        'cta_url' => null,
                        'action_buttons' => ['Profil Perusahaan', 'Jadwalkan Demo'],
                    ],
                ],
            ],
        ];

        $selected = $definitions[$industry] ?? $definitions['ecommerce'];

        if ($mode === 'replace') {
            AutoReply::where('workspace_id', $workspace->id)->delete();
        }

        foreach ($selected['rules'] as $tpl) {
            AutoReply::updateOrCreate(
                [
                    'workspace_id' => $workspace->id,
                    'name' => $tpl['name'],
                ],
                [
                    'category' => $tpl['category'] ?? 'general',
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

        SystemSetting::set("greeting_menu_buttons_{$workspace->id}", json_encode($selected['buttons']));
        SystemSetting::set("greeting_menu_style_{$workspace->id}", 'buttons');

        return back()->with('success', "Template bisnis {$selected['name_label']} berhasil dimuat.");
    }

    public function simulate(Request $request): JsonResponse
    {
        $workspace = $this->getWorkspace($request);
        $incomingMessage = trim($request->input('message', ''));
        $deviceId = $request->input('device_id') ? (int) $request->input('device_id') : null;
        $simulateOutsideHours = (bool) $request->input('simulate_outside_hours', false);

        $result = $this->autoReplyService->simulateResponse($workspace->id, $incomingMessage, $deviceId, $simulateOutsideHours);

        return response()->json($result);
    }
}
