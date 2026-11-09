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
     * Check if workspace is currently within business operating hours.
     */
    public function checkBusinessHours(int $workspaceId): array
    {
        $enabled = (bool) SystemSetting::get("auto_reply_schedule_enabled_{$workspaceId}", false);
        if (! $enabled) {
            return [
                'enabled' => false,
                'is_outside' => false,
                'start' => '08:00',
                'end' => '17:00',
                'days' => [1, 2, 3, 4, 5, 6],
                'away_message' => '',
                'away_mode' => 'fallback_only',
                'operating_text' => '24/7 (Non-stop)',
            ];
        }

        $tz = 'Asia/Jakarta';
        $now = Carbon::now($tz);
        $currentDay = (int) $now->dayOfWeekIso; // 1 = Monday ... 7 = Sunday
        $currentTime = $now->format('H:i');

        $rawDays = SystemSetting::get("auto_reply_schedule_days_{$workspaceId}");
        $activeDays = ! empty($rawDays) ? (is_array($rawDays) ? $rawDays : json_decode($rawDays, true)) : [1, 2, 3, 4, 5, 6];
        if (! is_array($activeDays)) {
            $activeDays = [1, 2, 3, 4, 5, 6];
        }

        $startTime = SystemSetting::get("auto_reply_schedule_start_{$workspaceId}", '08:00');
        $endTime = SystemSetting::get("auto_reply_schedule_end_{$workspaceId}", '17:00');
        $awayMode = SystemSetting::get("auto_reply_away_mode_{$workspaceId}", 'fallback_only');
        $awayMessage = SystemSetting::get(
            "auto_reply_away_message_{$workspaceId}",
            "Halo Kak {nama}! 👋\n\nTerima kasih telah menghubungi {workspace}. Saat ini tim kami sedang berada di *LUAR JAM OPERASIONAL* (Buka: Senin - Sabtu, {jam_operasional}).\n\nPesan Anda telah kami simpan dan akan segera dibalas oleh Customer Service kami saat jam kerja dimulai kembali.\n\n💡 Ketik *MENU* untuk melihat informasi mandiri 24/7."
        );

        $isDayActive = in_array($currentDay, array_map('intval', $activeDays), true);
        $isTimeActive = ($currentTime >= $startTime && $currentTime <= $endTime);
        $isOutside = ! ($isDayActive && $isTimeActive);

        $dayNames = [
            1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu',
        ];
        $activeDayLabels = array_map(fn ($d) => $dayNames[$d] ?? '', $activeDays);
        $operatingText = implode(', ', array_filter($activeDayLabels))." ({$startTime} - {$endTime} WIB)";

        return [
            'enabled' => true,
            'is_outside' => $isOutside,
            'start' => $startTime,
            'end' => $endTime,
            'days' => $activeDays,
            'away_message' => $awayMessage,
            'away_mode' => $awayMode,
            'operating_text' => $operatingText,
        ];
    }

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

        // Check Operating Hours & Schedule
        $businessHours = $this->checkBusinessHours($workspaceId);
        $isOutsideHours = $businessHours['is_outside'];
        $operatingText = $businessHours['operating_text'];
        $workspaceName = strtoupper($device->workspace?->name ?? 'Layanan');

        $customerName = $this->resolveCustomerName($senderName, $sender, $workspaceId);

        if ($workspaceId && strlen(preg_replace('/[^0-9]/', '', $sender)) >= 8) {
            $contactName = ($customerName !== 'Kak' && ! empty($customerName)) ? $customerName : 'Pelanggan '.substr($sender, -4);
            Contact::updateOrCreate(
                ['workspace_id' => $workspaceId, 'phone' => $sender],
                ['name' => $contactName]
            );
        }

        // Handle Strict "Always Away" Outside Hours Mode
        if ($isOutsideHours && $businessHours['away_mode'] === 'always_away') {
            $replyMessage = $this->replaceVariables($businessHours['away_message'], $customerName, $sender, $device->workspace?->name ?? 'Layanan', $operatingText);
            $sourceType = 'away_schedule';
            $ruleName = 'Respon Luar Jam Kerja (Away Message)';
            Log::info("AutoReply: Sent Always-Away message for {$sender} outside operating hours ({$operatingText})");

            return $this->dispatchOutboundReply($device, $sender, $replyMessage, null, [], $workspaceId, $sourceType, $ruleName);
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
            $replyMessage = $this->buildAutoMenuReply($rules, $workspaceName, $device, $workspaceId, $customerName);
            $sourceType = 'auto_menu';
            $ruleName = 'Daftar Menu Layanan';

            if ($device->isCloudApi()) {
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
                $replyOptions = [];
            }
            Log::info("AutoReply: Dispatched Auto Menu list for {$sender} ({$customerName}) on device {$device->name} ({$device->phone_number})");
        } else {
            // Check specific keyword matching rule (exact, contains, starts_with, numbered menu)
            $matchedRule = $this->findMatchingRule($rules, $incomingClean);

            if ($matchedRule) {
                $matchedRule->increment('hit_count');
                $replyMessage = $this->replaceVariables($matchedRule->reply_message, $customerName, $sender, $device->workspace?->name ?? 'Layanan', $operatingText);

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
                // If Outside Operating Hours and mode is 'fallback_only':
                // Check if user is asking for customer service or falling through
                $isCsInquiry = (bool) preg_match('/(cs|admin|operator|manusia|staf|orang|tanya|hubungi|kendala|komplain)/i', $incomingClean);
                if ($isOutsideHours && $businessHours['away_mode'] === 'fallback_only' && ($isCsInquiry || empty($rules))) {
                    $replyMessage = $this->replaceVariables($businessHours['away_message'], $customerName, $sender, $device->workspace?->name ?? 'Layanan', $operatingText);
                    $sourceType = 'away_schedule';
                    $ruleName = 'Respon Luar Jam Kerja (Away Message)';
                    Log::info("AutoReply: Sent Fallback-Away message for {$sender} outside operating hours ({$operatingText})");
                } else {
                    // 2. Evaluate Gemini AI Smart Fallback
                    $aiEnabled = (bool) SystemSetting::get("ai_gemini_enabled_{$workspaceId}", SystemSetting::get('ai_gemini_enabled', true));
                    if ($aiEnabled) {
                        $promptContext = SystemSetting::get(
                            "ai_gemini_prompt_context_{$workspaceId}",
                            SystemSetting::get(
                                'ai_gemini_prompt_context',
                                'Anda adalah Asisten Virtual Cerdas resmi dari '.$workspaceName.'. Berikan jawaban yang ramah, sopan, ringkas, dan jelas dalam Bahasa Indonesia untuk membantu kebutuhan pelanggan.'
                            )
                        );
                        $apiKey = SystemSetting::get("ai_gemini_api_key_{$workspaceId}", config('services.gemini.key', env('GEMINI_API_KEY')));

                        $replyMessage = $this->generateGeminiResponse($incomingClean, $promptContext, $apiKey, $rules, $workspaceId);
                        $sourceType = 'ai_gemini';
                        $ruleName = 'Asisten Cerdas AI Gemini';
                        Log::info("AutoReply: Responding via Gemini AI Smart Fallback for {$sender}");
                    } elseif ($isOutsideHours) {
                        $replyMessage = $this->replaceVariables($businessHours['away_message'], $customerName, $sender, $device->workspace?->name ?? 'Layanan', $operatingText);
                        $sourceType = 'away_schedule';
                        $ruleName = 'Respon Luar Jam Kerja (Away Message)';
                    }
                }
            }
        }

        if (empty($replyMessage)) {
            return null;
        }

        // Apply 'always_prepend' outside hours header if configured
        if ($isOutsideHours && $businessHours['away_mode'] === 'always_prepend' && $sourceType !== 'away_schedule') {
            $prependNotice = "🌙 *[Luar Jam Operasional — Buka {$businessHours['start']} - {$businessHours['end']} WIB]*\n\n";
            $replyMessage = $prependNotice.$replyMessage;
        }

        return $this->dispatchOutboundReply($device, $sender, $replyMessage, $mediaUrl, $replyOptions, $workspaceId, $sourceType, $ruleName);
    }

    /**
     * Dispatch outbound WhatsApp message and track usage
     */
    protected function dispatchOutboundReply(Device $device, string $sender, string $replyMessage, ?string $mediaUrl, array $replyOptions, int $workspaceId, ?string $sourceType, ?string $ruleName): array
    {
        // Deduct from workspace message quota if available
        $subscription = Subscription::where('workspace_id', $workspaceId)->first();
        if ($subscription && $subscription->remaining_message_quota > 0) {
            $subscription->decrement('remaining_message_quota');
        }

        // Dispatch outbound reply via WhatsApp Gateway
        $sendResult = $this->gatewayService->sendMessage($device, $sender, $replyMessage, $mediaUrl, $replyOptions);
        $status = ($sendResult['success'] ?? false) ? 'delivered' : ($sendResult['status'] ?? 'delivered');

        // Store outbound message into messages table (Live Chat & Analytics)
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
        if ($selectedMenuNumber !== null && $selectedMenuNumber >= 1 && $selectedMenuNumber <= $rules->count()) {
            return $rules->values()->get($selectedMenuNumber - 1);
        }

        return null;
    }

    /**
     * Check if the incoming message is a generic greeting, menu, or help inquiry.
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

        // Normalize elongated/repeated characters
        $collapsed = preg_replace('/(.)\1+/u', '$1', $clean);
        $collapsedDouble = preg_replace('/(.)\1{2,}/u', '$1$1', $clean);
        if (in_array($collapsed, $defaultWords, true) || in_array($collapsedDouble, $defaultWords, true)) {
            return true;
        }

        // Match short greeting tokens
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
    public function simulateResponse(int $workspaceId, string $incomingText, ?int $deviceId = null, bool $simulateOutsideHours = false): array
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

        $businessHours = $this->checkBusinessHours($workspaceId);
        $isOutsideHours = $simulateOutsideHours || ($businessHours['enabled'] && $businessHours['is_outside']);
        $workspaceName = strtoupper($device?->workspace?->name ?? 'Layanan Bisnis');

        // Check if strict Always Away Mode triggers
        if ($isOutsideHours && $businessHours['away_mode'] === 'always_away') {
            return [
                'success' => true,
                'source' => 'away_schedule',
                'rule_name' => 'Respon Luar Jam Kerja (Away Message)',
                'keyword' => 'AWAY / AFTER-HOURS',
                'reply' => $this->replaceVariables($businessHours['away_message'], 'Kak Budi', '6281234567890', $workspaceName, $businessHours['operating_text']),
                'media_url' => null,
            ];
        }

        $masterEnabled = (bool) SystemSetting::get("auto_reply_master_enabled_{$workspaceId}", true);
        $greetingEnabled = (bool) SystemSetting::get("greeting_menu_enabled_{$workspaceId}", true);
        $targetDeviceId = SystemSetting::get("greeting_menu_device_id_{$workspaceId}");
        $isDeviceEligible = empty($targetDeviceId) || ($device && (int) $targetDeviceId === $device->id);

        // Check if customer asked for greeting / menu
        if ($greetingEnabled && $isDeviceEligible && $this->isMenuRequest($incomingClean, $workspaceId) && $rules->isNotEmpty()) {
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

            $menuReply = $this->buildAutoMenuReply($rules, $workspaceName, $device, $workspaceId);
            if ($isOutsideHours && $businessHours['away_mode'] === 'always_prepend') {
                $menuReply = "🌙 *[Luar Jam Operasional — Buka {$businessHours['start']} - {$businessHours['end']} WIB]*\n\n".$menuReply;
            }

            return [
                'success' => true,
                'source' => 'auto_menu',
                'rule_name' => 'Menu Layanan Otomatis'.($device ? " ({$device->name})" : ''),
                'keyword' => 'MENU / GREETING',
                'reply' => $menuReply,
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

            $ruleReply = $this->replaceVariables($matchedRule->reply_message, 'Kak Budi', '6281234567890', $workspaceName, $businessHours['operating_text']);
            if ($isOutsideHours && $businessHours['away_mode'] === 'always_prepend') {
                $ruleReply = "🌙 *[Luar Jam Operasional — Buka {$businessHours['start']} - {$businessHours['end']} WIB]*\n\n".$ruleReply;
            }

            return [
                'success' => true,
                'source' => 'keyword_rule',
                'rule_name' => $matchedRule->name,
                'keyword' => $matchedRule->keyword,
                'reply' => $ruleReply,
                'media_url' => $matchedRule->reply_media_url,
                'cta_text' => $matchedRule->cta_text,
                'cta_url' => $matchedRule->cta_url,
                'action_buttons' => $matchedRule->action_buttons,
            ];
        }

        // Check if Outside Hours Fallback Triggers for CS / Unmatched query
        $isCsInquiry = (bool) preg_match('/(cs|admin|operator|manusia|staf|orang|tanya|hubungi|kendala|komplain)/i', $incomingClean);
        if ($isOutsideHours && $businessHours['away_mode'] === 'fallback_only' && ($isCsInquiry || empty($rules))) {
            return [
                'success' => true,
                'source' => 'away_schedule',
                'rule_name' => 'Respon Luar Jam Kerja (Away Message)',
                'keyword' => 'AWAY / AFTER-HOURS',
                'reply' => $this->replaceVariables($businessHours['away_message'], 'Kak Budi', '6281234567890', $workspaceName, $businessHours['operating_text']),
                'media_url' => null,
            ];
        }

        // AI Gemini Smart Fallback
        $aiEnabled = (bool) SystemSetting::get("ai_gemini_enabled_{$workspaceId}", SystemSetting::get('ai_gemini_enabled', true));
        if ($aiEnabled) {
            $promptContext = SystemSetting::get(
                "ai_gemini_prompt_context_{$workspaceId}",
                SystemSetting::get(
                    'ai_gemini_prompt_context',
                    'Anda adalah Asisten Virtual Cerdas resmi dari '.$workspaceName.'. Berikan jawaban yang ramah, sopan, ringkas, dan jelas dalam Bahasa Indonesia untuk membantu kebutuhan pelanggan.'
                )
            );
            $apiKey = SystemSetting::get("ai_gemini_api_key_{$workspaceId}", config('services.gemini.key', env('GEMINI_API_KEY')));

            $reply = $this->generateGeminiResponse($incomingClean, $promptContext, $apiKey, $rules, $workspaceId);
            if ($isOutsideHours && $businessHours['away_mode'] === 'always_prepend') {
                $reply = "🌙 *[Luar Jam Operasional — Buka {$businessHours['start']} - {$businessHours['end']} WIB]*\n\n".$reply;
            }

            return [
                'success' => true,
                'source' => 'ai_gemini',
                'rule_name' => 'Asisten Cerdas AI Gemini',
                'keyword' => 'AI Fallback',
                'reply' => $reply,
                'media_url' => null,
            ];
        }

        if ($isOutsideHours) {
            return [
                'success' => true,
                'source' => 'away_schedule',
                'rule_name' => 'Respon Luar Jam Kerja (Away Message)',
                'keyword' => 'AWAY / AFTER-HOURS',
                'reply' => $this->replaceVariables($businessHours['away_message'], 'Kak Budi', '6281234567890', $workspaceName, $businessHours['operating_text']),
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
    public function generateGeminiResponse(string $incomingText, string $promptContext, ?string $apiKey = null, $rules = null, ?int $workspaceId = null): string
    {
        $enrichedContext = $promptContext;

        // Inject active AutoReply rules summary
        if ($rules && $rules->isNotEmpty()) {
            $menuSummary = $rules->map(function ($r, $idx) {
                $num = $idx + 1;
                $replyExcerpt = Str::limit(strip_tags($r->reply_message), 120);

                return "- Menu {$num}: {$r->name} (Kata Kunci: {$r->keyword}) => {$replyExcerpt}";
            })->implode("\n");

            $enrichedContext .= "\n\nDaftar Menu/Layanan Otomatis yang aktif di sistem saat ini:\n{$menuSummary}\nJika pengguna bertanya seputar pilihan menu atau layanan di atas, arahkan dan jawab sesuai data tersebut.";
        }

        // Inject business knowledge base if present
        if ($workspaceId) {
            $knowledgeBase = SystemSetting::get("ai_gemini_knowledge_base_{$workspaceId}");
            if (! empty($knowledgeBase)) {
                $enrichedContext .= "\n\nINFORMASI & BASIS PENGETAHUAN BISNIS RESMI:\n{$knowledgeBase}\nUtamakan menjawab pertanyaan berdasarkan data bisnis di atas.";
            }
        }

        // 1. Try real Google Gemini API call if key is provided
        if (! empty($apiKey)) {
            try {
                $endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}";
                $systemInstruction = "Petunjuk Sistem: {$enrichedContext}\nJawab pesan pengguna WhatsApp berikut dengan ringkas, ramah, dan solutif dalam Bahasa Indonesia:";

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
     * Intelligent contextual AI fallback that matches Indonesian business inquiry intents.
     */
    protected function generateContextualFallback(string $incomingText, string $promptContext, $rules = null): string
    {
        $lower = strtolower(trim($incomingText));

        // Greetings & Salutations
        if (preg_match('/(halo|hai|hey|hei|pagi|siang|sore|malam|assalamu|permisi|tes|test|mas|kak|min|gan|sis|bang|mbak|pak|bu)/i', $lower)) {
            if ($rules && $rules->isNotEmpty()) {
                $quickList = $rules->take(4)->map(fn ($r, $idx) => ($idx + 1).". *{$r->name}*")->implode("\n");

                return "Halo! Selamat datang di layanan WhatsApp kami. 👋\n\nAda yang dapat kami bantu hari ini? Anda dapat memilih menu cepat berikut:\n{$quickList}\n\nKetik nomor pilihan Anda (contoh: *1*), ketik *MENU* untuk daftar lengkap, atau tulis langsung pertanyaan Anda.";
            }

            return "Halo! Selamat datang di Layanan WhatsApp resmi kami. 👋\n\nAda yang dapat kami bantu hari ini? Silakan ketik *MENU* untuk melihat daftar layanan, atau ketik langsung pertanyaan Anda.";
        }

        // Price, Catalog & Products
        if (preg_match('/(katalog|harga|pricelist|daftar harga|berapa|biaya|ongkir|produk|menu|varian)/i', $lower)) {
            return "🛍️ *Informasi Produk & Harga*\n\nKami menyediakan berbagai produk & layanan berkualitas. Untuk melihat daftar lengkap beserta harga terkini, silakan balas *1* atau ketik *KATALOG*.\n\nStaf kami juga siap membantu jika Anda memerlukan rekomendasi produk terbaik!";
        }

        // Orders & Purchasing
        if (preg_match('/(order|pesan|beli|cara pesan|cara beli|cara order|format order|checkout)/i', $lower)) {
            return "📝 *Format Pemesanan Cepat*\n\nUntuk melakukan pemesanan, silakan kirimkan format berikut:\n• Nama Lengkap:\n• Nomor HP:\n• Alamat Pengiriman:\n• Produk & Jumlah:\n• Metode Bayar (Transfer / QRIS):\n\nTim kami akan segera memproses total pesanan Anda!";
        }

        // Tracking & Resi
        if (preg_match('/(resi|lacak|paket|ekspedisi|posisi|status|pengiriman|jne|jnt|sicepat)/i', $lower)) {
            return "📦 *Cek Status Resi & Pengiriman*\n\nNomor resi otomatis dibagikan setelah pesanan diproses oleh ekspedisi. Silakan kirimkan *Nomor Invoice* atau *Nama Penerima* Anda untuk bantuan pelacakan paket oleh CS kami.";
        }

        // Billing, SPP, Fees & Invoices
        if (preg_match('/(bayar|tagihan|spp|biaya|invoice|rekening|va|virtual account|transfer|cicilan|lunas|qris|dana)/i', $lower)) {
            return "💳 *Konfirmasi & Pembayaran Resmi*\n\nPembayaran resmi diproses melalui transfer rekening resmi atau scan QRIS atas nama institusi/bisnis kami.\n\nJika sudah melakukan pembayaran, silakan kirimkan foto bukti transfer ke nomor ini agar dapat diverifikasi otomatis.";
        }

        // Operating Hours & Address
        if (preg_match('/(jam|buka|tutup|operasional|alamat|lokasi|kantor|gedung|tempat|dimana|gmaps|peta)/i', $lower)) {
            return "🏢 *Jam Pelayanan & Informasi Lokasi*\n\n• Jam Operasional: Senin s/d Sabtu (08.00 – 17.00 WIB)\n• Lokasi / Petunjuk Arah: Silakan ketik *LOKASI* untuk tautan Google Maps resmi kami.\n\nPesan Anda di luar jam kerja tetap kami simpan dan akan diprioritaskan saat jam kerja buka kembali.";
        }

        // WhatsApp Gateway & Developer APIs
        if (preg_match('/(api|webhook|token|gateway|server|dokumentasi|postman|integrasi)/i', $lower)) {
            return "Layanan WhatsApp Gateway Enterprise MARDIRA:\n\n• Tersedia REST API v1 dan Webhook event real-time.\n• Server 1 WhatsApp (Jalur Cepat) & Server 2 WhatsApp (Jalur Stabil).\n• Kredensial API Key serta koleksi Postman dapat diunduh langsung melalui menu *Kredensial API & Webhook* di dashboard Anda.";
        }

        // Help, Complaints & Customer Support
        if (preg_match('/(bantuan|help|tolong|cs|customer service|admin|operator|manusia|staf|orang|komplain|pengaduan|kendala|masalah|rusak|error)/i', $lower)) {
            return "👩‍💼 *Pusat Bantuan & Layanan Customer Service*\n\nAda kendala atau hal yang ingin ditanyakan? Silakan jelaskan detail pertanyaan Anda di sini, staf customer service kami akan segera merespon chat Anda.\n\nKetik *menu* kapan saja untuk kembali ke pilihan otomatis.";
        }

        // Gratitude & Closing
        if (preg_match('/(terima kasih|makasih|thanks|thank you|ok|oke|siap|baik|sip)/i', $lower)) {
            return 'Sama-sama! Senang dapat membantu Anda. Jangan ragu untuk menghubungi kami kembali jika membutuhkan informasi lainnya. Semoga hari Anda menyenangkan! 🙏';
        }

        // General fallback with active rules
        if ($rules && $rules->isNotEmpty()) {
            $quickList = $rules->take(4)->map(fn ($r, $idx) => ($idx + 1).". *{$r->name}*")->implode("\n");

            return "Terima kasih telah menghubungi kami. Pesan Anda mengenai '{$incomingText}' telah kami terima.\n\nUntuk informasi instan, Anda juga dapat memilih layanan kami:\n{$quickList}\n\nBalas dengan nomor pilihan Anda (contoh: *1*) atau ketik *MENU* untuk melihat semua pilihan.";
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
     * Replace dynamic template variables in text with rich contextual data.
     */
    public function replaceVariables(string $text, string $customerName, string $sender, string $workspaceName = 'Layanan', ?string $operatingHours = null): string
    {
        $now = now()->timezone('Asia/Jakarta');
        $hour = (int) $now->format('G');
        $timeGreeting = match (true) {
            $hour >= 4 && $hour < 11 => 'Pagi',
            $hour >= 11 && $hour < 15 => 'Siang',
            $hour >= 15 && $hour < 18 => 'Sore',
            default => 'Malam',
        };

        $dayNames = [
            1 => 'Senin', 2 => 'Selasa', 3 => 'Rabu', 4 => 'Kamis', 5 => 'Jumat', 6 => 'Sabtu', 7 => 'Minggu',
        ];
        $monthNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
            7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
        ];
        $dayName = $dayNames[(int) $now->dayOfWeekIso] ?? 'Hari ini';
        $formattedDate = $now->format('j').' '.$monthNames[(int) $now->format('n')].' '.$now->format('Y');
        $formattedTime = $now->format('H:i').' WIB';

        $nameVal = ($customerName !== 'Kak' && ! empty($customerName)) ? $customerName : 'Kak';
        $fullGreeting = ($customerName !== 'Kak' && ! empty($customerName)) ? "Kak {$customerName}" : 'Sahabat';

        return str_replace(
            [
                '{{name}}', '{{nama}}', '{name}', '{nama}',
                '{{greeting_name}}', '{greeting_name}',
                '{{salam}}', '{salam}', '{{greeting}}', '{greeting}',
                '{{hari}}', '{hari}', '{{day}}', '{day}',
                '{{tanggal}}', '{tanggal}', '{{date}}', '{date}',
                '{{jam}}', '{jam}', '{{time}}', '{{waktu}}', '{time}', '{waktu}',
                '{{phone}}', '{{nomor}}', '{phone}', '{nomor}',
                '{{workspace}}', '{workspace}', '{{bisnis}}', '{bisnis}',
                '{{jam_operasional}}', '{jam_operasional}',
            ],
            [
                $nameVal, $nameVal, $nameVal, $nameVal,
                $fullGreeting, $fullGreeting,
                "Selamat {$timeGreeting}", "Selamat {$timeGreeting}", "Selamat {$timeGreeting}", "Selamat {$timeGreeting}",
                $dayName, $dayName, $dayName, $dayName,
                $formattedDate, $formattedDate, $formattedDate, $formattedDate,
                $formattedTime, $formattedTime, $timeGreeting, $timeGreeting, $timeGreeting, $timeGreeting,
                $sender, $sender, $sender, $sender,
                $workspaceName, $workspaceName, $workspaceName, $workspaceName,
                $operatingHours ?: '08:00 - 17:00 WIB', $operatingHours ?: '08:00 - 17:00 WIB',
            ],
            $text
        );
    }
}
