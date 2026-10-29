<?php

namespace App\Services\WhatsApp;

use App\Models\Device;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MetaCloudApiService
{
    protected string $apiVersion = 'v21.0';

    /**
     * Clean and format phone number for Meta Cloud API (e.g. 6281234567890, no +, no 0 prefix)
     */
    public function formatPhoneNumber(string $phone): string
    {
        $clean = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($clean, '0')) {
            $clean = '62'.substr($clean, 1);
        } elseif (! str_starts_with($clean, '62') && strlen($clean) <= 12) {
            $clean = '62'.$clean;
        }

        return $clean;
    }

    /**
     * Send message via Meta WhatsApp Business Cloud API
     */
    public function sendMessage(Device $device, string $phone, string $text, ?string $mediaUrl = null, array $options = []): array
    {
        $recipient = $this->formatPhoneNumber($phone);
        $phoneId = $device->meta_phone_number_id;
        $token = $device->meta_access_token;

        if (empty($phoneId) || empty($token)) {
            Log::warning("MetaCloudApi: Device {$device->id} missing phone_number_id or access_token");

            return [
                'success' => false,
                'error' => 'Device WhatsApp Cloud API belum dikonfigurasi dengan Phone Number ID atau Access Token.',
            ];
        }

        // 1. If options specify CTA URL button (e.g. "Isi Formulir")
        if (! empty($options['cta_url']) && ! empty($options['cta_text'])) {
            return $this->sendCtaUrlButton($device, $recipient, $text, $options['cta_text'], $options['cta_url'], $options['header'] ?? null, $options['footer'] ?? null);
        }

        // 2. If options specify List Menu (Daftar Pilihan Pop-up Drawer)
        if (! empty($options['list_sections']) && ! empty($options['list_button'])) {
            return $this->sendListMenu($device, $recipient, $text, $options['list_button'], $options['list_sections'], $options['list_title'] ?? null, $options['list_footer'] ?? null);
        }

        // 3. If options specify Quick Reply Buttons (max 3 buttons)
        if (! empty($options['quick_replies']) && is_array($options['quick_replies'])) {
            return $this->sendQuickReplyButtons($device, $recipient, $text, $options['quick_replies'], $options['header'] ?? null, $options['footer'] ?? null);
        }

        // 4. If options have poll_options or buttons (fallback to Quick Reply Buttons if <= 3)
        if (! empty($options['poll_options']) && is_array($options['poll_options']) && count($options['poll_options']) <= 3) {
            $quickButtons = [];
            foreach ($options['poll_options'] as $idx => $opt) {
                $quickButtons[] = [
                    'id' => 'btn_'.($idx + 1),
                    'title' => mb_substr(trim($opt), 0, 20),
                ];
            }

            return $this->sendQuickReplyButtons($device, $recipient, $text, $quickButtons, $options['header'] ?? null, $options['footer'] ?? null);
        }

        // 5. If options have poll_options > 3, convert to List Message
        if (! empty($options['poll_options']) && is_array($options['poll_options']) && count($options['poll_options']) > 3) {
            $rows = [];
            foreach ($options['poll_options'] as $idx => $opt) {
                $rows[] = [
                    'id' => (string) ($idx + 1),
                    'title' => mb_substr(trim($opt), 0, 24),
                    'description' => 'Pilih menu '.trim($opt),
                ];
            }
            $sections = [
                [
                    'title' => 'Menu Layanan',
                    'rows' => $rows,
                ],
            ];

            return $this->sendListMenu($device, $recipient, $text, '📋 Buka Pilihan Layanan', $sections, $options['list_title'] ?? null, $options['list_footer'] ?? null);
        }

        // 6. Media message
        if (! empty($mediaUrl)) {
            return $this->sendMediaMessage($device, $recipient, $mediaUrl, $text);
        }

        // 7. Regular text message
        return $this->sendTextMessage($device, $recipient, $text);
    }

    /**
     * Send simple text message
     */
    public function sendTextMessage(Device $device, string $recipient, string $text): array
    {
        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $recipient,
            'type' => 'text',
            'text' => [
                'preview_url' => false,
                'body' => $text,
            ],
        ];

        return $this->executeGraphPost($device, $payload);
    }

    /**
     * Send Quick Reply Buttons (Meta Interactive Button, max 3)
     */
    public function sendQuickReplyButtons(Device $device, string $recipient, string $bodyText, array $buttons, ?string $header = null, ?string $footer = null): array
    {
        $actionButtons = [];
        foreach (array_slice($buttons, 0, 3) as $idx => $btn) {
            $title = is_array($btn) ? ($btn['title'] ?? $btn['label'] ?? '') : (string) $btn;
            $id = is_array($btn) ? ($btn['id'] ?? 'btn_'.($idx + 1)) : 'btn_'.($idx + 1);

            $actionButtons[] = [
                'type' => 'reply',
                'reply' => [
                    'id' => (string) $id,
                    'title' => mb_substr(trim($title), 0, 20),
                ],
            ];
        }

        $interactive = [
            'type' => 'button',
            'body' => [
                'text' => $bodyText,
            ],
            'action' => [
                'buttons' => $actionButtons,
            ],
        ];

        if (! empty($header)) {
            $interactive['header'] = [
                'type' => 'text',
                'text' => mb_substr($header, 0, 60),
            ];
        }

        if (! empty($footer)) {
            $interactive['footer'] = [
                'text' => mb_substr($footer, 0, 60),
            ];
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $recipient,
            'type' => 'interactive',
            'interactive' => $interactive,
        ];

        return $this->executeGraphPost($device, $payload);
    }

    /**
     * Send List Message (Meta Interactive List popup drawer menu)
     */
    public function sendListMenu(Device $device, string $recipient, string $bodyText, string $buttonText, array $sections, ?string $header = null, ?string $footer = null): array
    {
        $formattedSections = [];
        foreach ($sections as $sec) {
            $rows = [];
            foreach ($sec['rows'] ?? [] as $r) {
                $rowItem = [
                    'id' => (string) ($r['id'] ?? 'row_'.rand(100, 999)),
                    'title' => mb_substr(trim($r['title'] ?? ''), 0, 24),
                ];
                if (! empty($r['description'])) {
                    $rowItem['description'] = mb_substr(trim($r['description']), 0, 72);
                }
                $rows[] = $rowItem;
            }

            if (! empty($rows)) {
                $formattedSections[] = [
                    'title' => mb_substr(trim($sec['title'] ?? 'Menu Layanan'), 0, 24),
                    'rows' => $rows,
                ];
            }
        }

        $interactive = [
            'type' => 'list',
            'body' => [
                'text' => $bodyText,
            ],
            'action' => [
                'button' => mb_substr(trim($buttonText), 0, 20),
                'sections' => $formattedSections,
            ],
        ];

        if (! empty($header)) {
            $interactive['header'] = [
                'type' => 'text',
                'text' => mb_substr($header, 0, 60),
            ];
        }

        if (! empty($footer)) {
            $interactive['footer'] = [
                'text' => mb_substr($footer, 0, 60),
            ];
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $recipient,
            'type' => 'interactive',
            'interactive' => $interactive,
        ];

        return $this->executeGraphPost($device, $payload);
    }

    /**
     * Send CTA URL Button (Meta Interactive CTA URL)
     */
    public function sendCtaUrlButton(Device $device, string $recipient, string $bodyText, string $buttonText, string $url, ?string $header = null, ?string $footer = null): array
    {
        $interactive = [
            'type' => 'cta_url',
            'body' => [
                'text' => $bodyText,
            ],
            'action' => [
                'name' => 'cta_url',
                'parameters' => [
                    'display_text' => mb_substr(trim($buttonText), 0, 20),
                    'url' => $url,
                ],
            ],
        ];

        if (! empty($header)) {
            $interactive['header'] = [
                'type' => 'text',
                'text' => mb_substr($header, 0, 60),
            ];
        }

        if (! empty($footer)) {
            $interactive['footer'] = [
                'text' => mb_substr($footer, 0, 60),
            ];
        }

        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $recipient,
            'type' => 'interactive',
            'interactive' => $interactive,
        ];

        return $this->executeGraphPost($device, $payload);
    }

    /**
     * Send Media Message (Image, Document)
     */
    public function sendMediaMessage(Device $device, string $recipient, string $mediaUrl, ?string $caption = null): array
    {
        $payload = [
            'messaging_product' => 'whatsapp',
            'recipient_type' => 'individual',
            'to' => $recipient,
            'type' => 'image',
            'image' => [
                'link' => $mediaUrl,
            ],
        ];

        if (! empty($caption)) {
            $payload['image']['caption'] = $caption;
        }

        return $this->executeGraphPost($device, $payload);
    }

    /**
     * Execute Graph API POST request
     */
    protected function executeGraphPost(Device $device, array $payload): array
    {
        $phoneId = $device->meta_phone_number_id;
        $token = $device->meta_access_token;
        $url = "https://graph.facebook.com/{$this->apiVersion}/{$phoneId}/messages";

        try {
            $response = Http::withToken($token)
                ->timeout(15)
                ->post($url, $payload);

            if ($response->successful()) {
                $body = $response->json();
                $messageId = $body['messages'][0]['id'] ?? null;

                Log::info("MetaCloudApi: Message sent successfully to {$payload['to']} via PhoneId {$phoneId} (ID: {$messageId})");

                return [
                    'success' => true,
                    'message_id' => $messageId,
                    'status' => 'sent',
                    'engine_used' => 'cloud_api',
                ];
            }

            Log::error("MetaCloudApi Error ({$response->status()}): {$response->body()}");

            return [
                'success' => false,
                'error' => $response->json('error.message') ?? 'Gagal mengirim pesan melalui Meta Cloud API.',
                'status' => 'failed',
                'engine_used' => 'cloud_api',
                'details' => $response->json('error'),
            ];
        } catch (\Throwable $e) {
            Log::error("MetaCloudApi Exception: {$e->getMessage()}");

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'status' => 'failed',
                'engine_used' => 'cloud_api',
            ];
        }
    }
}
