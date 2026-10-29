<?php

namespace App\Services;

use App\Models\AutoReply;
use App\Models\Contact;
use App\Models\Device;
use App\Models\Message;
use App\Models\Subscription;
use App\Models\SystemSetting;
use App\Services\WhatsApp\WhatsAppGatewayService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class AutoReplyService
{
    public function __construct(
        protected WhatsAppGatewayService $gatewayService
    ) {}

    /**
     * Process inbound WhatsApp message: evaluate keyword rules, fallback to Gemini AI,
     * and automatically dispatch the response back to the customer on WhatsApp.
     */
    public function handleInboundMessage(Device $device, string $sender, string $incomingText, ?string $senderName = null): ?array
    {
        $incomingClean = trim($incomingText);
        if (empty($incomingClean)) {
            return null;
        }

        // Ignore group messages, status broadcasts, or non-phone recipients
        if (str_contains($sender, '@g.us') || str_contains($sender, '@broadcast')) {
            return null;
        }

        $workspaceId = $device->workspace_id;

        // 0. Check Master Switch for Auto-Reply
        $masterEnabled = (bool) SystemSetting::get("auto_reply_master_enabled_{$workspaceId}", true);
        if (! $masterEnabled) {
            Log::info("[AutoReply] Skipped inbound message from {$sender} because Auto-Reply master toggle is disabled for workspace {$workspaceId}");

            return null;
        }

        $customerName = $this->resolveCustomerName($senderName, $sender, $workspaceId);

        if ($workspaceId && strlen(preg_replace('/[^0-9]/', '', $sender)) >= 8) {
            $contactName = ($customerName !== 'Kak' && ! empty($customerName)) ? $customerName : 'Pelanggan '.substr($sender, -4);
            Contact::updateOrCreate(
                ['workspace_id' => $workspaceId, 'phone' => $sender],
                ['name' => $contactName]
            );
        }

        // 1. Evaluate Workspace Keyword Rules for this destination device
        $rules = AutoReply::where('workspace_id', $workspaceId)
            ->where('is_active', true)
            ->where(function ($query) use ($device) {
                $query->whereNull('device_id')->orWhere('device_id', $device->id);
            })
            ->get();

        $greetingEnabled = (bool) SystemSetting::get("greeting_menu_enabled_{$workspaceId}", true);
        $targetDeviceId = SystemSetting::get("greeting_menu_device_id_{$workspaceId}");
        $isDeviceEligible = empty($targetDeviceId) || ((int) $targetDeviceId === $device->id);

        $replyMessage = null;
        $mediaUrl = null;
        $sourceType = null;
        $ruleName = null;
        $replyOptions = [];

        // Check if message is a Greeting / Menu request (e.g., 'info', 'hi', 'halo', 'menu', 'p', 'bantuan')
        $isMenuTrigger = $greetingEnabled && $isDeviceEligible && $this->isMenuRequest($incomingClean, $workspaceId) && $rules->isNotEmpty();

        if ($isMenuTrigger) {
            $workspaceName = strtoupper($device->workspace?->name ?? 'Layanan');
            $replyMessage = $this->buildAutoMenuReply($rules, $workspaceName, $device, $workspaceId, $customerName);
            $sourceType = 'auto_menu';
            $ruleName = 'Daftar Menu Layanan';

            if ($device->isCloudApi()) {
                // Official WhatsApp Business API: Use List Message if >3 items, Quick Reply if <= 3 items
                if ($rules->count() <= 3) {
                    $quickButtons = [];
                    foreach ($rules->take(3) as $idx => $r) {
                        $quickButtons[] = [
                            'id' => (string) ($idx + 1),
                            'title' => mb_substr($r->name, 0, 20),
                        ];
                    }
                    $replyOptions = [
                        'quick_replies' => $quickButtons,
                        'header' => "Layanan {$workspaceName}",
                        'footer' => 'Ketuk tombol untuk respon instan',
                    ];
                } else {
                    $listRows = [];
                    foreach ($rules as $idx => $r) {
                        $firstLine = strtok($r->reply_message, "\n") ?: '';
                        $cleanDesc = trim(preg_replace('/[#*_~`]/', '', $firstLine));
                        $listRows[] = [
                            'id' => (string) ($idx + 1),
                            'title' => mb_substr($r->name, 0, 24),
                            'description' => mb_substr($cleanDesc ?: 'Pilih menu ini', 0, 72),
                        ];
                    }
                    $replyOptions = [
                        'list_button' => '📋 Buka Pilihan Layanan',
                        'list_title' => "Menu Layanan {$workspaceName}",
                        'list_sections' => [
                            [
                                'title' => 'Daftar Layanan',
                                'rows' => $listRows,
                            ],
                        ],
                        'header' => "Layanan {$workspaceName}",
                        'footer' => 'Ketuk tombol di atas untuk melihat semua menu',
                    ];
                }
            } else {
                // QR Web scan connection: clean & reliable text menu (no polling)
                $replyOptions = [];
            }
            Log::info("AutoReply: Dispatched Auto Menu list for {$sender} ({$customerName}) on device {$device->name} ({$device->phone_number})");
        } else {
            // Check specific keyword matching rule (exact, contains, starts_with, numbered menu)
            $matchedRule = $this->findMatchingRule($rules, $incomingClean);

            if ($matchedRule) {
                $matchedRule->increment('hit_count');
                $replyMessage = $this->replaceVariables($matchedRule->reply_message, $customerName, $sender, $device->workspace?->name ?? 'Layanan');

                if ($device->isCloudApi()) {
                    if (! empty($matchedRule->cta_text) && ! empty($matchedRule->cta_url)) {
                        $replyOptions['cta_text'] = $matchedRule->cta_text;
                        $replyOptions['cta_url'] = $matchedRule->cta_url;
                    }
                    if (! empty($matchedRule->action_buttons) && is_array($matchedRule->action_buttons)) {
                        $btns = array_values(array_filter(array_map('trim', $matchedRule->action_buttons)));
                        if (! empty($btns)) {
                            $quickButtons = [];
                            foreach (array_slice($btns, 0, 3) as $i => $b) {
                                $quickButtons[] = [
                                    'id' => (string) ($i + 1),
                                    'title' => mb_substr($b, 0, 20),
                                ];
                            }
                            $replyOptions['quick_replies'] = $quickButtons;
                        }
                    }
                } else {
                    if (! empty($matchedRule->cta_text) && ! empty($matchedRule->cta_url)) {
                        if (! str_contains($replyMessage, $matchedRule->cta_url)) {
                            $replyMessage .= "\n\n🔗 *{$matchedRule->cta_text}:*\n{$matchedRule->cta_url}";
                        }
                    }
                    if (! empty($matchedRule->action_buttons) && is_array($matchedRule->action_buttons)) {
                        $btns = array_values(array_filter(array_map('trim', $matchedRule->action_buttons)));
                        if (! empty($btns)) {
                            $replyMessage .= "\n\n💡 *Pilihan Layanan Terkait:*\n".implode("\n", array_map(fn ($b, $i) => ($i + 1).". Balas *{$b}*", $btns, array_keys($btns)));
                        }
                    }
                }

                $mediaUrl = $matchedRule->reply_media_url;
                $sourceType = 'keyword_rule';
                $ruleName = $matchedRule->name;
                Log::info("AutoReply: Matched rule '{$matchedRule->name}' (Keyword: '{$matchedRule->keyword}') for {$sender} on device {$device->name}");
            } else {
                // 2. Evaluate Gemini AI Smart Fallback
                $aiEnabled = (bool) SystemSetting::get("ai_gemini_enabled_{$workspaceId}", SystemSetting::get('ai_gemini_enabled', true));
                if ($aiEnabled) {
                    $promptContext = SystemSetting::get(
                        "ai_gemini_prompt_context_{$workspaceId}",
                        SystemSetting::get(
                            'ai_gemini_prompt_context',
                            'Anda adalah Asisten Virtual Cerdas resmi dari Politeknik Mardira Indonesia (PMI) dan Layanan WhatsApp Gateway Enterprise. Berikan jawaban yang ramah, sopan, ringkas, dan jelas dalam Bahasa Indonesia. Fokus pada informasi pendaftaran, layanan akademik, serta panduan integrasi API WhatsApp.'
                        )
                    );
                    $apiKey = SystemSetting::get("ai_gemini_api_key_{$workspaceId}", config('services.gemini.key', env('GEMINI_API_KEY')));

                    $replyMessage = $this->generateGeminiResponse($incomingClean, $promptContext, $apiKey, $rules);
                    $sourceType = 'ai_gemini';
                    $ruleName = 'Asisten Cerdas AI Gemini';
                    Log::info("AutoReply: Responding via Gemini AI Smart Fallback for {$sender}");
                }
            }
        }

        if (empty($replyMessage)) {
            return null;
        }

        // 3. Deduct from workspace message quota if available
        $subscription = Subscription::where('workspace_id', $workspaceId)->first();
        if ($subscription && $subscription->remaining_message_quota > 0) {
            $subscription->decrement('remaining_message_quota');
        }

        // 4. Dispatch outbound reply via WhatsApp Gateway
        $sendResult = $this->gatewayService->sendMessage($device, $sender, $replyMessage, $mediaUrl, $replyOptions);
        $status = ($sendResult['success'] ?? false) ? 'delivered' : ($sendResult['status'] ?? 'delivered');

        // 5. Store outbound message into messages table (Live Chat & Analytics)
        $outbound = Message::create([
            'workspace_id' => $workspaceId,
            'device_id' => $device->id,
            'direction' => 'outbound',
            'receiver_number' => $sender,
            'message_type' => $mediaUrl ? 'media' : 'text',
            'content' => $replyMessage,
            'media_url' => $mediaUrl,
            'status' => $status,
            'sent_at' => Carbon::now(),
        ]);

        return [
            'success' => true,
            'source' => $sourceType,
            'rule_name' => $ruleName,
            'reply' => $replyMessage,
            'media_url' => $mediaUrl,
            'message_id' => $outbound->id,
        ];
    }

    /**
     * Match an incoming message against active rules.
     * Supports multi-keyword aliases, numbered menu selection, and exact/contains/starts_with criteria.
     */
    public function findMatchingRule($rules, string $incomingText): ?AutoReply
    {
        $rawTrimmed = trim($incomingText);
        if ($rawTrimmed === '' || $rules->isEmpty()) {
            return null;
        }

        $lower = strtolower($rawTrimmed);
        // Clean leading/trailing punctuation (e.g., "1." -> "1", "#info" -> "info")
        $clean = trim(preg_replace('/^[\p{P}\s]+|[\p{P}\s]+$/u', '', $lower));

        // Check if message is a numeric menu selection: "1", "2", "menu 1", "pilih 2", "#1"
        $selectedMenuNumber = null;
        if (preg_match('/^(?:menu|pilih|opsi|nomor|no|pilihan)?\s*#?(\d+)\.?$/i', $lower, $matches)) {
            $selectedMenuNumber = (int) $matches[1];
        }

        // Helper to extract keyword list from comma/pipe/newline separated field
        $getKeywordVariants = function (string $keywordField): array {
            $parts = preg_split('/[,|\n]+/', strtolower($keywordField), -1, PREG_SPLIT_NO_EMPTY);

            return array_values(array_filter(array_map('trim', $parts)));
        };

        // Priority 1: Exact match on rule name or any keyword variant
        foreach ($rules as $rule) {
            if ($clean === strtolower(trim($rule->name)) || $lower === strtolower(trim($rule->name))) {
                return $rule;
            }
        }

        $exactRules = $rules->filter(fn ($r) => $r->trigger_type === 'exact');
        foreach ($exactRules as $rule) {
            $variants = $getKeywordVariants($rule->keyword);
            foreach ($variants as $kw) {
                if ($clean === $kw || $lower === $kw) {
                    return $rule;
                }
                if ($selectedMenuNumber !== null && (string) $selectedMenuNumber === $kw) {
                    return $rule;
                }
            }
        }

        // Priority 2: Contains match on any keyword variant
        $containsRules = $rules->filter(fn ($r) => $r->trigger_type === 'contains');
        foreach ($containsRules as $rule) {
            $variants = $getKeywordVariants($rule->keyword);
            foreach ($variants as $kw) {
                if (ctype_digit($kw)) {
                    if ($selectedMenuNumber === (int) $kw) {
                        return $rule;
                    }
                    if (preg_match('/(?:\b|^)'.preg_quote($kw, '/').'(?:\b|$)/u', $lower)) {
                        return $rule;
                    }
                } else {
                    if (str_contains($lower, $kw) || str_contains($clean, $kw)) {
                        return $rule;
                    }
                }
            }
        }

        // Priority 3: Starts with match on any keyword variant
        $startsWithRules = $rules->filter(fn ($r) => $r->trigger_type === 'starts_with');
        foreach ($startsWithRules as $rule) {
            $variants = $getKeywordVariants($rule->keyword);
            foreach ($variants as $kw) {
                if (str_starts_with($lower, $kw) || str_starts_with($clean, $kw)) {
                    return $rule;
                }
            }
        }

        // Priority 4: Positional Menu Selection Fallback
        // If customer typed a number (e.g. 1, 2, 3), and no rule explicitly set that number as keyword,
        // match the N-th active rule in the workspace list (1st rule = 1, 2nd rule = 2, etc.)!
        if ($selectedMenuNumber !== null && $selectedMenuNumber >= 1 && $selectedMenuNumber <= $rules->count()) {
            return $rules->values()->get($selectedMenuNumber - 1);
        }

        return null;
    }

    /**
     * Check if the incoming message is a generic greeting, menu, or help inquiry.
     * Recognizes triggers like 'hi', 'halo', 'info', 'menu', 'p', 'bantuan', etc.
     */
    public function isMenuRequest(string $incomingText, ?int $workspaceId = null): bool
    {
        $clean = strtolower(trim(preg_replace('/^[\p{P}\s]+|[\p{P}\s]+$/u', '', $incomingText)));
        if ($clean === '') {
            return false;
        }

        $defaultWords = [
            'hi', 'halo', 'hai', 'hello', 'hei', 'hey', 'hallo',
            'p', 'ping', 'tes', 'test',
            'info', 'informasi', 'info layanan', 'info menu',
            'menu', 'daftar menu', 'list menu', 'pilihan', 'pilih menu', 'opsi', 'list', 'menu utama', 'kembali ke menu', 'menu awal',
            'bantuan', 'help', 'tanya', 'bantu', 'panduan', 'mau tanya', 'bisa tanya',
            'start', 'mulai', 'mulai chat', 'bot',
            'assalamualaikum', "assalamu'alaikum", 'samlikum', 'salam', 'permisi',
            'selamat pagi', 'selamat siang', 'selamat sore', 'selamat malam',
            'pagi', 'siang', 'sore', 'malam',
            'halo min', 'halo kak', 'halo admin', 'halo mas', 'halo mbak', 'p min', 'p kak', 'p mas', 'admin',
            'mas', 'kak', 'min', 'mbak', 'gan', 'sis',
        ];

        if ($workspaceId) {
            $customKeywords = SystemSetting::get("greeting_menu_keywords_{$workspaceId}");
            if ($customKeywords !== null && trim($customKeywords) !== '') {
                $customList = preg_split('/[,|\n]+/', strtolower($customKeywords), -1, PREG_SPLIT_NO_EMPTY);
                $customList = array_values(array_filter(array_map('trim', $customList)));
                if (! empty($customList)) {
                    $defaultWords = array_unique(array_merge($defaultWords, $customList));
                }
            }
        }

        if (in_array($clean, $defaultWords, true)) {
            return true;
        }

        // Normalize elongated/repeated characters common in informal chat (e.g. "hiii" -> "hi", "halooo" -> "halo", "pppp" -> "p")
        $collapsed = preg_replace('/(.)\1+/u', '$1', $clean);
        $collapsedDouble = preg_replace('/(.)\1{2,}/u', '$1$1', $clean);
        if (in_array($collapsed, $defaultWords, true) || in_array($collapsedDouble, $defaultWords, true)) {
            return true;
        }

        // Match if message consists purely of short greeting tokens (e.g. "halo kak", "hi admin", "selamat pagi min")
        $tokens = preg_split('/\s+/', $clean, -1, PREG_SPLIT_NO_EMPTY);
        if (count($tokens) <= 3) {
            $allGreetingTokens = true;
            foreach ($tokens as $token) {
                $cToken = preg_replace('/(.)\1+/u', '$1', $token);
                $isGreeting = in_array($token, $defaultWords, true) || in_array($cToken, $defaultWords, true);
                $isHonorific = in_array($token, ['kak', 'min', 'gan', 'sis', 'bro', 'bang', 'mas', 'mbak', 'pak', 'bu', 'admin'], true) || in_array($cToken, ['kak', 'min', 'gan', 'sis', 'bro', 'bang', 'mas', 'mbak', 'pak', 'bu', 'admin'], true);
                if (! $isGreeting && ! $isHonorific) {
                    $allGreetingTokens = false;
                    break;
                }
            }
            if ($allGreetingTokens) {
                return true;
            }
        }

        return false;
    }

    /**
     * Automatically build a formatted WhatsApp menu list from active rules.
     * Supports custom header, device phone context, and footer instructions.
     */
    public function buildAutoMenuReply($rules, string $workspaceName = 'Layanan', ?Device $device = null, ?int $workspaceId = null, string $customerName = 'Kak'): string
    {
        $customHeader = $workspaceId ? SystemSetting::get("greeting_menu_header_{$workspaceId}") : null;
        $customFooter = $workspaceId ? SystemSetting::get("greeting_menu_footer_{$workspaceId}") : null;
        $menuStyle = $workspaceId ? SystemSetting::get("greeting_menu_style_{$workspaceId}", 'standard') : 'standard';

        $targetTitle = $device
            ? ($device->name.($device->phone_number ? " ({$device->phone_number})" : ''))
            : $workspaceName;

        $greetingPrefix = ($customerName !== 'Kak' && ! empty($customerName)) ? "Halo Kak {$customerName}!" : 'Halo!';

        if (! empty($customHeader)) {
            $header = $this->replaceVariables($customHeader, $customerName, $device?->phone_number ?? '', $workspaceName);
            $header = str_replace(
                ['{workspace_name}', '{device_name}', '{phone_number}', '{target}'],
                [$workspaceName, $device?->name ?? $workspaceName, $device?->phone_number ?? '', $targetTitle],
                $header
            );
        } else {
            $header = "{$greetingPrefix} Selamat datang di layanan informasi & otomasi *{$workspaceName}*.\n\n📋 *DAFTAR MENU & LAYANAN:*\nSilakan pilih menu layanan yang Anda butuhkan:";
        }

        $lines = [$header, ''];

        $sortedRules = $rules->sortBy(function ($r) {
            if (preg_match('/^\s*(\d+)/', $r->keyword, $m)) {
                return (int) $m[1];
            }

            return 999;
        })->values();

        $i = 1;
        foreach ($sortedRules as $rule) {
            $kws = preg_split('/[,|\n]+/', $rule->keyword, -1, PREG_SPLIT_NO_EMPTY);
            $nonNumericKws = array_values(array_filter($kws, fn ($k) => ! ctype_digit(trim($k))));
            $aliasKw = ! empty($nonNumericKws) ? trim($nonNumericKws[0]) : trim($kws[0] ?? $rule->keyword);

            // Clean subtitle from reply_message
            $firstLine = strtok($rule->reply_message, "\n") ?: '';
            $cleanDesc = trim(preg_replace('/[#*_~`]/', '', $firstLine));
            if (mb_strlen($cleanDesc) > 55) {
                $cleanDesc = mb_substr($cleanDesc, 0, 52).'...';
            }

            if ($menuStyle === 'boxed' || $menuStyle === 'pandawa') {
                $lines[] = "[ {$i} ] *{$rule->name}*";
                if (! empty($cleanDesc) && strtolower($cleanDesc) !== strtolower($rule->name)) {
                    $lines[] = "      _{$cleanDesc}_";
                }
                $lines[] = "      ➔ Balas *{$i}*".($aliasKw !== (string) $i ? " atau *{$aliasKw}*" : '');
            } else {
                $lines[] = "{$i}. *{$rule->name}*";
                if (! empty($cleanDesc) && strtolower($cleanDesc) !== strtolower($rule->name)) {
                    $lines[] = "   _{$cleanDesc}_";
                }
                $lines[] = "   ➔ Balas: *{$i}*".($aliasKw !== (string) $i ? " atau *{$aliasKw}*" : '');
            }
            $lines[] = '';
            $i++;
        }

        if (! empty($customFooter)) {
            $footer = $this->replaceVariables($customFooter, $customerName, $device?->phone_number ?? '', $workspaceName);
            $footer = str_replace(
                ['{workspace_name}', '{device_name}', '{phone_number}', '{target}'],
                [$workspaceName, $device?->name ?? $workspaceName, $device?->phone_number ?? '', $targetTitle],
                $footer
            );
            $lines[] = $footer;
        } else {
            $lines[] = '💡 *Panduan:* Balas dengan angka menu pilihan Anda (contoh: *1*) untuk respon instan otomatis.';
        }

        return trim(implode("\n", $lines));
    }

    /**
     * Simulate an incoming message for testing in the interactive WhatsApp bot simulator.
     */
    public function simulateResponse(int $workspaceId, string $incomingText, ?int $deviceId = null): array
    {
        $incomingClean = trim($incomingText);
        if (empty($incomingClean)) {
            return [
                'success' => false,
                'reply' => 'Pesan pengujian tidak boleh kosong.',
            ];
        }

        $device = null;
        if ($deviceId) {
            $device = Device::where('workspace_id', $workspaceId)->find($deviceId);
        }
        if (! $device) {
            $device = Device::where('workspace_id', $workspaceId)->where('status', 'connected')->first()
                ?? Device::where('workspace_id', $workspaceId)->first();
        }

        $query = AutoReply::where('workspace_id', $workspaceId)->where('is_active', true);
        if ($device) {
            $query->where(function ($q) use ($device) {
                $q->whereNull('device_id')->orWhere('device_id', $device->id);
            });
        }
        $rules = $query->get();

        $masterEnabled = (bool) SystemSetting::get("auto_reply_master_enabled_{$workspaceId}", true);
        $greetingEnabled = (bool) SystemSetting::get("greeting_menu_enabled_{$workspaceId}", true);
        $targetDeviceId = SystemSetting::get("greeting_menu_device_id_{$workspaceId}");
        $isDeviceEligible = empty($targetDeviceId) || ($device && (int) $targetDeviceId === $device->id);

        // Check if customer asked for greeting / menu
        if ($greetingEnabled && $isDeviceEligible && $this->isMenuRequest($incomingClean, $workspaceId) && $rules->isNotEmpty()) {
            $workspaceName = strtoupper($device?->workspace?->name ?? 'Layanan');
            $menuStyle = $workspaceId ? SystemSetting::get("greeting_menu_style_{$workspaceId}", 'pandawa') : 'pandawa';
            $buttonText = $workspaceId ? SystemSetting::get("greeting_menu_button_text_{$workspaceId}", '📋 Buka Pilihan Layanan') : '📋 Buka Pilihan Layanan';

            $menuItems = [];
            $idx = 1;
            foreach ($rules as $rule) {
                $firstLine = strtok($rule->reply_message, "\n") ?: '';
                $cleanDesc = trim(preg_replace('/[#*_~`]/', '', $firstLine));
                if (mb_strlen($cleanDesc) > 55) {
                    $cleanDesc = mb_substr($cleanDesc, 0, 52).'...';
                }

                $menuItems[] = [
                    'id' => $rule->id,
                    'number' => $idx,
                    'title' => $rule->name,
                    'description' => $cleanDesc,
                    'keyword' => (string) $idx,
                ];
                $idx++;
            }

            $buttonsList = [];
            $savedButtons = json_decode(SystemSetting::get("greeting_menu_buttons_{$workspaceId}", '[]'), true);
            if (! empty($savedButtons) && is_array($savedButtons)) {
                foreach ($savedButtons as $btn) {
                    if (! empty($btn['label'])) {
                        $buttonsList[] = [
                            'label' => trim($btn['label']),
                            'keyword' => ! empty($btn['keyword']) ? trim($btn['keyword']) : trim($btn['label']),
                        ];
                    }
                }
            }
            if (empty($buttonsList)) {
                foreach ($rules->take(3) as $r) {
                    $buttonsList[] = [
                        'label' => $r->name,
                        'keyword' => strtok($r->keyword, ",\n|") ?: $r->name,
                    ];
                }
            }
            if (empty($buttonsList)) {
                $buttonsList = [
                    ['label' => 'Administrasi', 'keyword' => 'administrasi'],
                    ['label' => 'Info & Pengaduan', 'keyword' => 'pengaduan'],
                    ['label' => 'Rehab', 'keyword' => 'rehab'],
                ];
            }

            return [
                'success' => true,
                'source' => 'auto_menu',
                'rule_name' => 'Menu Layanan Otomatis'.($device ? " ({$device->name})" : ''),
                'keyword' => 'MENU / GREETING',
                'reply' => $this->buildAutoMenuReply($rules, $workspaceName, $device, $workspaceId),
                'menu_items' => $menuItems,
                'buttons' => $buttonsList,
                'menu_style' => $menuStyle,
                'button_text' => $buttonText,
                'media_url' => null,
            ];
        }

        // Evaluate specific keyword rules
        $matchedRule = $this->findMatchingRule($rules, $incomingClean);

        if ($matchedRule) {
            $matchedRule->increment('hit_count');

            return [
                'success' => true,
                'source' => 'keyword_rule',
                'rule_name' => $matchedRule->name,
                'keyword' => $matchedRule->keyword,
                'reply' => $matchedRule->reply_message,
                'media_url' => $matchedRule->reply_media_url,
                'cta_text' => $matchedRule->cta_text,
                'cta_url' => $matchedRule->cta_url,
                'action_buttons' => $matchedRule->action_buttons,
            ];
        }

        // AI Gemini Smart Fallback
        $aiEnabled = (bool) SystemSetting::get("ai_gemini_enabled_{$workspaceId}", SystemSetting::get('ai_gemini_enabled', true));
        if ($aiEnabled) {
            $promptContext = SystemSetting::get(
                "ai_gemini_prompt_context_{$workspaceId}",
                SystemSetting::get(
                    'ai_gemini_prompt_context',
                    'Anda adalah Asisten Virtual Cerdas resmi dari Politeknik Mardira Indonesia (PMI) dan Layanan WhatsApp Gateway Enterprise. Berikan jawaban yang ramah, sopan, ringkas, dan jelas dalam Bahasa Indonesia. Fokus pada informasi pendaftaran, layanan akademik, serta panduan integrasi API WhatsApp.'
                )
            );
            $apiKey = SystemSetting::get("ai_gemini_api_key_{$workspaceId}", config('services.gemini.key', env('GEMINI_API_KEY')));

            $reply = $this->generateGeminiResponse($incomingClean, $promptContext, $apiKey, $rules);

            return [
                'success' => true,
                'source' => 'ai_gemini',
                'rule_name' => 'Asisten Cerdas AI Gemini',
                'keyword' => 'AI Fallback',
                'reply' => $reply,
                'media_url' => null,
            ];
        }

        return [
            'success' => true,
            'source' => 'none',
            'rule_name' => 'Default Away Message',
            'keyword' => '-',
            'reply' => 'Terima kasih telah menghubungi kami. Pesan Anda telah kami terima dan akan segera dijawab oleh tim customer service kami.',
            'media_url' => null,
        ];
    }

    /**
     * Generate response via Google Gemini API if key exists, or contextual intelligence fallback.
     */
    public function generateGeminiResponse(string $incomingText, string $promptContext, ?string $apiKey = null, $rules = null): string
    {
        // Enrich context with active AutoReply rules so AI knows user-configured menus
        $enrichedContext = $promptContext;
        if ($rules && $rules->isNotEmpty()) {
            $menuSummary = $rules->map(function ($r, $idx) {
                $num = $idx + 1;
                $replyExcerpt = Str::limit(strip_tags($r->reply_message), 120);

                return "- Menu {$num}: {$r->name} (Kata Kunci: {$r->keyword}) => {$replyExcerpt}";
            })->implode("\n");

            $enrichedContext .= "\n\nDaftar Menu/Layanan Otomatis yang aktif di sistem saat ini:\n{$menuSummary}\nJika pengguna bertanya seputar pilihan menu atau layanan di atas, arahkan dan jawab sesuai data tersebut.";
        }

        // 1. Try real Google Gemini API call if key is provided
        if (! empty($apiKey)) {
            try {
                $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}";
                $systemInstruction = "Petunjuk Sistem: {$enrichedContext}\nJawab pesan pengguna WhatsApp berikut dengan ringkas, sopan, dan relevan:";

                $response = Http::timeout(6)->post($endpoint, [
                    'contents' => [
                        [
                            'role' => 'user',
                            'parts' => [
                                ['text' => "{$systemInstruction}\n\nPengguna: {$incomingText}"],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature' => 0.7,
                        'maxOutputTokens' => 300,
                    ],
                ]);

                if ($response->successful()) {
                    $json = $response->json();
                    $text = $json['candidates'][0]['content']['parts'][0]['text'] ?? null;
                    if (! empty($text)) {
                        return trim($text);
                    }
                }
            } catch (\Throwable $e) {
                Log::warning("Google Gemini API error: {$e->getMessage()}. Using contextual fallback.");
            }
        }

        // 2. Intelligent Contextual Fallback based on knowledge context and question semantics
        return $this->generateContextualFallback($incomingText, $enrichedContext, $rules);
    }

    /**
     * Intelligent contextual AI fallback that matches Indonesian inquiry intents.
     */
    protected function generateContextualFallback(string $incomingText, string $promptContext, $rules = null): string
    {
        $lower = strtolower(trim($incomingText));

        // Greetings & Salutations
        if (preg_match('/(halo|hai|hey|hei|pagi|siang|sore|malam|assalamu|permisi|tes|test|mas|kak|min|gan|sis|bang|mbak|pak|bu)/i', $lower)) {
            if ($rules && $rules->isNotEmpty()) {
                $quickList = $rules->take(4)->map(fn ($r, $idx) => ($idx + 1).". *{$r->name}*")->implode("\n");

                return "Halo! Selamat datang di layanan WhatsApp kami.\n\nAda yang dapat kami bantu hari ini? Anda dapat memilih menu cepat berikut:\n{$quickList}\n\nKetik nomor pilihan Anda (contoh: *1*), ketik *MENU* untuk daftar lengkap, atau tulis langsung pertanyaan Anda.";
            }

            return "Halo! Selamat datang di Layanan Otomasi WhatsApp resmi kami.\n\nAda yang dapat kami bantu hari ini? Silakan ketik *MENU* untuk melihat daftar layanan, atau ketik langsung pertanyaan Anda.";
        }

        // Registration & Academic Information
        if (preg_match('/(daftar|pendaftaran|kuliah|mahasiswa|syarat|jurusan|prodi|beasiswa|masuk|registrasi)/i', $lower)) {
            return "Informasi Pendaftaran & Layanan:\n\n1. Pendaftaran saat ini sedang aktif dibuka.\n2. Jurusan/Program unggulan: Teknik Informatika, Sistem Informasi, dan Manajemen Bisnis Digital.\n3. Akses formulir pendaftaran: https://pmb.mardira.ac.id/form\n\nStaf kami siap membantu jika Anda memerlukan bantuan pengisian berkas persyaratan.";
        }

        // Billing, SPP, Fees & Invoices
        if (preg_match('/(bayar|tagihan|spp|biaya|invoice|rekening|va|virtual account|transfer|cicilan|lunas)/i', $lower)) {
            return "Untuk konfirmasi atau rincian pembayaran biaya layanan:\n\n• Pembayaran resmi diproses melalui Virtual Account resmi atau transfer ke rekening institusi.\n• Sistem MARDIRA WA memverifikasi bukti bayar secara otomatis.\n\nJika sudah melakukan pembayaran, silakan kirimkan foto atau dokumen bukti transfer ke nomor ini.";
        }

        // Operating Hours & Address
        if (preg_match('/(jam|buka|tutup|operasional|alamat|lokasi|kantor|gedung|tempat|dimana)/i', $lower)) {
            return "Jam Pelayanan & Informasi Kantor:\n\n• Hari: Senin s/d Sabtu\n• Jam Operasional: 08.00 – 16.00 WIB\n• Alamat: Politeknik Mardira Indonesia, Jl. Soekarno Hatta No. 211, Bandung.\n\nPesan Anda di luar jam operasional tetap dilayani otomatis oleh bot ini 24/7.";
        }

        // WhatsApp Gateway & Developer APIs
        if (preg_match('/(api|webhook|token|gateway|server|dokumentasi|postman|integrasi)/i', $lower)) {
            return "Layanan WhatsApp Gateway Enterprise MARDIRA:\n\n• Tersedia REST API v1 dan Webhook event real-time.\n• Server 1 WhatsApp (Jalur Cepat) & Server 2 WhatsApp (Jalur Stabil).\n• Kredensial API Key serta koleksi Postman dapat diunduh langsung melalui menu *Kredensial API & Webhook* di dashboard Anda.";
        }

        // Help, Complaints & Customer Support
        if (preg_match('/(bantuan|help|tolong|cs|customer service|admin|operator|manusia|staf|orang|komplain|pengaduan|kendala|masalah|rusak|error)/i', $lower)) {
            return "👩‍💼 *Pusat Bantuan & Layanan Customer Service*\n\nAda kendala atau hal yang ingin ditanyakan? Silakan jelaskan detail kendala Anda di sini, staf customer service kami akan segera merespon chat Anda pada jam operasional.\n\nKetik *menu* kapan saja untuk kembali ke pilihan otomatis.";
        }

        // Gratitude & Closing
        if (preg_match('/(terima kasih|makasih|thanks|thank you|ok|oke|siap|baik|sip)/i', $lower)) {
            return 'Sama-sama! Senang dapat membantu Anda. Jangan ragu untuk menghubungi kami kembali jika membutuhkan informasi lainnya. Semoga hari Anda menyenangkan! 🙏';
        }

        // General AI contextual response
        if ($rules && $rules->isNotEmpty()) {
            $quickList = $rules->take(4)->map(fn ($r, $idx) => ($idx + 1).". *{$r->name}*")->implode("\n");

            return "Terima kasih telah menghubungi kami. Pesan Anda mengenai '{$incomingText}' telah kami terima.\n\nStaf kami akan segera meninjau pertanyaan Anda. Untuk informasi instan, Anda juga dapat memilih layanan kami:\n{$quickList}\n\nBalas dengan nomor pilihan Anda (contoh: *1*) atau ketik *MENU* untuk melihat semua pilihan.";
        }

        return "Terima kasih telah menghubungi kami. Pesan Anda mengenai '{$incomingText}' telah kami terima.\n\nTim layanan kami siap membantu Anda. Untuk bantuan instan seputar informasi layanan, silakan ketik kata kunci *MENU* atau tunggu sebentar staf kami akan merespon.";
    }

    /**
     * Resolve natural display name from sender or contact
     */
    protected function resolveCustomerName(?string $senderName, string $sender, ?int $workspaceId): string
    {
        $cleanName = null;
        if (! empty($senderName)) {
            $trimmed = trim(preg_replace('/[\x{1F600}-\x{1F64F}\x{1F300}-\x{1F5FF}\x{1F680}-\x{1F6FF}\x{2600}-\x{26FF}\x{2700}-\x{27BF}]/u', '', $senderName));
            if (! empty($trimmed) && ! preg_match('/^(\+?[0-9\s\-]+|Pelanggan\s+[0-9]+)$/i', $trimmed)) {
                $cleanName = $trimmed;
            }
        }

        if (! $cleanName && $workspaceId) {
            $contactName = Contact::where('workspace_id', $workspaceId)->where('phone', $sender)->value('name');
            if ($contactName && ! preg_match('/^(\+?[0-9\s\-]+|Pelanggan\s+[0-9]+)$/i', $contactName)) {
                $cleanName = $contactName;
            }
        }

        return $cleanName ?: 'Kak';
    }

    /**
     * Replace dynamic template variables in text
     */
    public function replaceVariables(string $text, string $customerName, string $sender, string $workspaceName = 'Layanan'): string
    {
        $hour = (int) now()->timezone('Asia/Jakarta')->format('G');
        $timeGreeting = match (true) {
            $hour >= 4 && $hour < 11 => 'Pagi',
            $hour >= 11 && $hour < 15 => 'Siang',
            $hour >= 15 && $hour < 18 => 'Sore',
            default => 'Malam',
        };

        $nameVal = $customerName !== 'Kak' ? $customerName : 'Kak';
        $fullGreeting = $customerName !== 'Kak' ? "Kak {$customerName}" : 'Sahabat';

        return str_replace(
            [
                '{{name}}', '{{nama}}', '{name}', '{nama}',
                '{{greeting_name}}', '{greeting_name}',
                '{{phone}}', '{{nomor}}', '{phone}', '{nomor}',
                '{{time}}', '{{waktu}}', '{time}', '{waktu}',
                '{{workspace}}', '{workspace}',
            ],
            [
                $nameVal, $nameVal, $nameVal, $nameVal,
                $fullGreeting, $fullGreeting,
                $sender, $sender, $sender, $sender,
                $timeGreeting, $timeGreeting, $timeGreeting, $timeGreeting,
                $workspaceName, $workspaceName,
            ],
            $text
        );
    }
}
