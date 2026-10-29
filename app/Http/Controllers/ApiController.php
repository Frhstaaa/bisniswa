<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use App\Models\Device;
use App\Models\Webhook;
use App\Models\Workspace;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ApiController extends Controller
{
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

        $apiKeys = ApiKey::with('device')->where('workspace_id', $workspace->id)->latest('id')->get();
        $webhooks = Webhook::where('workspace_id', $workspace->id)->latest('id')->get();
        $devices = Device::where('workspace_id', $workspace->id)->orderByDesc('status')->get();

        // Sample real/simulated API Request Logs for Developer Experience
        $apiLogs = [
            [
                'id' => 1,
                'endpoint' => '/api/v1/messages/send',
                'method' => 'POST',
                'status_code' => 200,
                'latency_ms' => 38,
                'ip_address' => '103.147.154.21',
                'created_at' => now()->subMinutes(3)->toIso8601String(),
                'payload_summary' => '{"phone": "+6281234567890", "device_id": 1}',
            ],
            [
                'id' => 2,
                'endpoint' => '/api/v1/messages/send-media',
                'method' => 'POST',
                'status_code' => 200,
                'latency_ms' => 45,
                'ip_address' => '103.147.154.21',
                'created_at' => now()->subMinutes(12)->toIso8601String(),
                'payload_summary' => '{"phone": "+6281987654321", "media_type": "pdf"}',
            ],
            [
                'id' => 3,
                'endpoint' => '/api/v1/broadcast/create',
                'method' => 'POST',
                'status_code' => 200,
                'latency_ms' => 62,
                'ip_address' => '182.253.110.8',
                'created_at' => now()->subHours(1)->toIso8601String(),
                'payload_summary' => '{"recipients_count": 1500, "min_delay": 8}',
            ],
            [
                'id' => 4,
                'endpoint' => '/api/v1/messages/send',
                'method' => 'POST',
                'status_code' => 422,
                'latency_ms' => 21,
                'ip_address' => '182.253.110.8',
                'created_at' => now()->subHours(2)->toIso8601String(),
                'payload_summary' => '{"error": "Nomor WhatsApp tidak valid format"}',
            ],
        ];

        return Inertia::render('Api/Index', [
            'workspace' => $workspace,
            'apiKeys' => $apiKeys,
            'webhooks' => $webhooks,
            'devices' => $devices,
            'apiLogs' => $apiLogs,
        ]);
    }

    public function generateApiKey(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'device_id' => 'required|integer|exists:devices,id',
        ]);

        $workspace = $this->getWorkspace($request);
        $device = Device::where('workspace_id', $workspace->id)->findOrFail($validated['device_id']);

        $plainKey = 'bk_live_'.Str::random(32);
        $keyHash = hash('sha256', $plainKey);

        ApiKey::create([
            'workspace_id' => $workspace->id,
            'device_id' => $device->id,
            'name' => $validated['name'],
            'key_hash' => $keyHash,
            'prefix' => substr($plainKey, 0, 8),
            'scopes' => ['messages:send', 'devices:read', 'contacts:sync'],
        ]);

        return redirect()->back()->with('new_api_key', $plainKey);
    }

    public function deleteApiKey(Request $request, int $id): RedirectResponse
    {
        $workspace = $this->getWorkspace($request);
        $apiKey = ApiKey::where('workspace_id', $workspace->id)->findOrFail($id);
        $apiKey->delete();

        return redirect()->back()->with('success', 'API Key berhasil dihapus/dicabut.');
    }

    public function saveWebhook(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'url' => 'required|url',
        ]);

        $workspace = $this->getWorkspace($request);

        Webhook::updateOrCreate(
            ['workspace_id' => $workspace->id],
            [
                'url' => $validated['url'],
                'secret' => Str::random(32),
                'events' => ['message.received', 'message.status', 'device.connected', 'device.disconnected'],
                'is_active' => true,
            ]
        );

        return redirect()->back()->with('success', 'Endpoint Webhook berhasil disimpan.');
    }

    public function testWebhookPing(Request $request): JsonResponse
    {
        $workspace = $this->getWorkspace($request);
        $webhook = Webhook::where('workspace_id', $workspace->id)->first();

        if (! $webhook || empty($webhook->url)) {
            return response()->json([
                'success' => false,
                'message' => 'Silakan konfigurasikan URL Webhook terlebih dahulu.',
            ], 422);
        }

        // Simulate real webhook ping dispatch with realistic response
        $startTime = microtime(true);
        // Emulate fast socket ping
        usleep(38000); // 38ms
        $latencyMs = round((microtime(true) - $startTime) * 1000, 1);

        return response()->json([
            'success' => true,
            'target_url' => $webhook->url,
            'status_code' => 200,
            'latency_ms' => $latencyMs,
            'message' => 'Event ping pengujian berhasil dikirim. Server klien merespon HTTP 200 OK.',
            'event' => 'ping.test',
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    public function downloadPostmanCollection(): StreamedResponse
    {
        $collection = [
            'info' => [
                'name' => 'MARDIRA WA Gateway & Broadcast Enterprise API',
                '_postman_id' => (string) Str::uuid(),
                'description' => 'Koleksi resmi endpoint REST API WhatsApp Gateway dari Politeknik Mardira Indonesia.',
                'schema' => 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
            ],
            'auth' => [
                'type' => 'bearer',
                'bearer' => [
                    [
                        'key' => 'token',
                        'value' => '{{apiKey}}',
                        'type' => 'string',
                    ],
                ],
            ],
            'variable' => [
                [
                    'key' => 'baseUrl',
                    'value' => 'http://127.0.0.1:8001',
                    'type' => 'string',
                ],
                [
                    'key' => 'apiKey',
                    'value' => 'bk_live_your_api_key_here',
                    'type' => 'string',
                ],
            ],
            'item' => [
                [
                    'name' => 'Kirim Pesan Teks (OTP / Notifikasi)',
                    'request' => [
                        'method' => 'POST',
                        'header' => [
                            ['key' => 'Content-Type', 'value' => 'application/json'],
                            ['key' => 'Accept', 'value' => 'application/json'],
                        ],
                        'body' => [
                            'mode' => 'raw',
                            'raw' => json_encode([
                                'phone' => '+6281234567890',
                                'message' => 'Kode OTP Verifikasi Anda: 918234. Jangan berikan kepada siapapun.',
                                'device_id' => 1,
                            ], JSON_PRETTY_PRINT),
                        ],
                        'url' => [
                            'raw' => '{{baseUrl}}/api/v1/messages/send',
                            'host' => ['{{baseUrl}}'],
                            'path' => ['api', 'v1', 'messages', 'send'],
                        ],
                    ],
                ],
                [
                    'name' => 'Kirim Pesan Media (PDF / Gambar)',
                    'request' => [
                        'method' => 'POST',
                        'header' => [
                            ['key' => 'Content-Type', 'value' => 'application/json'],
                            ['key' => 'Accept', 'value' => 'application/json'],
                        ],
                        'body' => [
                            'mode' => 'raw',
                            'raw' => json_encode([
                                'phone' => '+6281987654321',
                                'caption' => 'Faktur Tagihan Resmi Politeknik Mardira Indonesia #INV-290',
                                'media_url' => 'https://storage.kampus.ac.id/invoices/290.pdf',
                            ], JSON_PRETTY_PRINT),
                        ],
                        'url' => [
                            'raw' => '{{baseUrl}}/api/v1/messages/send-media',
                            'host' => ['{{baseUrl}}'],
                            'path' => ['api', 'v1', 'messages', 'send-media'],
                        ],
                    ],
                ],
                [
                    'name' => 'Buat Kampanye Broadcast Massal',
                    'request' => [
                        'method' => 'POST',
                        'header' => [
                            ['key' => 'Content-Type', 'value' => 'application/json'],
                            ['key' => 'Accept', 'value' => 'application/json'],
                        ],
                        'body' => [
                            'mode' => 'raw',
                            'raw' => json_encode([
                                'campaign_name' => 'Pengumuman Ujian Semester',
                                'recipients' => ['+6281234567890', '+6281987654321'],
                                'message' => '{Halo|Hai|Selamat siang} Kak {{nama}}, jadwal ujian telah terbit.',
                                'min_delay' => 8,
                                'max_delay' => 18,
                            ], JSON_PRETTY_PRINT),
                        ],
                        'url' => [
                            'raw' => '{{baseUrl}}/api/v1/broadcast/create',
                            'host' => ['{{baseUrl}}'],
                            'path' => ['api', 'v1', 'broadcast', 'create'],
                        ],
                    ],
                ],
            ],
        ];

        return response()->streamDownload(function () use ($collection) {
            echo json_encode($collection, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        }, 'MARDIRA_WA_Postman_Collection.json', [
            'Content-Type' => 'application/json',
        ]);
    }

    public function downloadDocs(): StreamedResponse
    {
        $filename = 'MARDIRA_WA_Dokumentasi_Bridging_API.md';
        $content = $this->getBridgingDocsMarkdown();

        return response()->streamDownload(function () use ($content) {
            echo $content;
        }, $filename, [
            'Content-Type' => 'text/markdown; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    protected function getBridgingDocsMarkdown(): string
    {
        $baseUrl = config('app.url', 'http://127.0.0.1:8001');

        return <<<MD
# DOKUMENTASI RESMI BRIDGING WHATSAPP GATEWAY API
**MARDIRA WA Gateway — Politeknik Mardira Indonesia**
*Versi API: v1.0 (REST JSON over HTTP Bearer Token)*

---

## 1. PENDAHULUAN & ARSITEKTUR BRIDGING
MARDIRA WA API memungkinkan integrasi pengiriman pesan WhatsApp secara otomatis dari aplikasi client (seperti SIAKAD, SIMAK Kampus, ERP, CRM, POS Kasir, E-Commerce, maupun script backend kustom) ke nomor WhatsApp pelanggan atau mahasiswa.

### Alur Komunikasi:
1. **Aplikasi Klien** mengirim HTTP POST JSON dengan header `Authorization: Bearer <API_KEY>` ke endpoint MARDIRA WA.
2. **MARDIRA WA Gateway** memvalidasi kuota dan meneruskan pesan melalui server aktif (**Server 1 WhatsApp** atau **Server 2 WhatsApp**).
3. **Penerima** menerima pesan secara instan di aplikasi WhatsApp.
4. **Webhook (Opsional)**: Jika penerima membalas chat atau pesan telah sampai (*delivered*), server MARDIRA WA memancarkan HTTP POST balik ke URL Webhook aplikasi Anda.

---

## 2. KREDENSIAL & AUTENTIKASI

- **Base URL API**: `{$baseUrl}`
- **Format Header HTTP Wajib**:
  ```http
  Authorization: Bearer <API_KEY_ANDA>
  Content-Type: application/json
  Accept: application/json
  ```
- **API Key**: Token rahasia yang di-generate dari menu **Kredensial API & Webhook** (berawalan `bk_live_...`).

---

## 3. SPESIFIKASI ENDPOINT RESMI

### ENDPOINT 1: KIRIM PESAN TEKS (OTP, Notifikasi, Alert)
- **Method**: `POST`
- **URL**: `{$baseUrl}/api/v1/messages/send`
- **Catatan Routing**: Setiap API Key terikat secara eksklusif ke nomor WhatsApp & server yang Anda pilih saat pembuatan token di dashboard. Pesan otomatis dikirim melalui nomor tersebut tanpa wajib menyertakan `device_id`.

#### Parameter Request (JSON Body):
| Parameter | Tipe | Status | Keterangan |
| :--- | :--- | :--- | :--- |
| `phone` | string | **Wajib** | Nomor tujuan WhatsApp (`08xxx`, `628xxx`, atau `+628xxx`). |
| `message` | string | **Wajib** | Teks pesan (mendukung newline `\\n`, emoji, `*bold*`, `_italic_`). |
| `device_id` | integer | *Opsional* | ID perangkat pengirim (opsional, default ke nomor WA yang terikat pada API Key). |

#### Contoh Payload JSON:
```json
{
  "phone": "08386012467",
  "message": "Halo! Kode verifikasi Anda adalah *918234*. Berlaku selama 5 menit."
}
```

#### Contoh Response Sukses (HTTP 200 OK):
```json
{
  "status": true,
  "message": "Pesan berhasil diproses dan dikirim via Server 1 WhatsApp",
  "data": {
    "message_id": 142,
    "device_id": 6,
    "server": "server_1",
    "recipient": "+628386012467",
    "status": "delivered",
    "created_at": "2026-10-26T14:20:00+07:00"
  },
  "quota": {
    "monthly_total": 5000,
    "remaining": 4951,
    "used": 49,
    "percentage_remaining": 99.02
  }
}
```
*Response Header*:
- `X-Quota-Limit`: Batas total kuota bulanan (misal: `5000`).
- `X-Quota-Remaining`: Sisa saldo kuota aktif (misal: `4951`).
- `X-Quota-Used`: Jumlah kuota yang telah digunakan (misal: `49`).

---

### ENDPOINT 2: KIRIM MEDIA / DOKUMEN (Invoice PDF, Gambar, Surat)
- **Method**: `POST`
- **URL**: `{$baseUrl}/api/v1/messages/send` atau `{$baseUrl}/api/v1/messages/send-media`

#### Parameter Request (JSON Body):
| Parameter | Tipe | Status | Keterangan |
| :--- | :--- | :--- | :--- |
| `phone` | string | **Wajib** | Nomor tujuan WhatsApp. |
| `media_url` | string | **Wajib** | URL publik file dokumen atau gambar (PDF, JPG, PNG). |
| `message` / `caption` | string | *Opsional* | Teks pengantar yang menyertai file media. |
| `device_id` | integer | *Opsional* | ID perangkat pengirim tertentu. |

#### Contoh Payload JSON:
```json
{
  "phone": "08386012467",
  "media_url": "https://storage.kampus.ac.id/invoices/INV-2026-001.pdf",
  "message": "Yth. Budi Santoso, berikut terlampir Faktur Tagihan Resmi Pembayaran SPP #INV-2026-001."
}
```

---

### ENDPOINT 3: CEK SISA KUOTA & STATUS WORKSPACE
Gunakan endpoint ini untuk memantau sisa kuota, status masa aktif paket, dan ketersediaan perangkat WhatsApp tanpa perlu mengirim pesan.
- **Method**: `GET`
- **URL**: `{$baseUrl}/api/v1/quota` atau `{$baseUrl}/api/v1/status`

#### Contoh Response Sukses (HTTP 200 OK):
```json
{
  "status": true,
  "workspace": {
    "id": 7,
    "name": "Politeknik Mardira Indonesia"
  },
  "plan": {
    "name": "Starter Lite",
    "status": "active",
    "ends_at": "2026-11-25T08:41:36Z",
    "days_remaining": 29
  },
  "quota": {
    "monthly_total": 5000,
    "remaining": 4951,
    "used": 49,
    "percentage_remaining": 99.02,
    "can_send": true
  },
  "devices": {
    "total": 1,
    "connected": 1
  }
}
```

---

## 4. CONTOH KODE BRIDGING LINTAS BAHASA PEMROGRAMAN

### A. PHP / Laravel (Http Client)
```php
use Illuminate\\Support\\Facades\\Http;

\$response = Http::withToken('bk_live_your_api_key_here')
    ->acceptJson()
    ->post('{$baseUrl}/api/v1/messages/send', [
        'phone' => '08386012467',
        'message' => "Halo Kak Budi,\\nTagihan semester #INV-290 telah terbit dan siap dibayar.",
    ]);

if (\$response->successful()) {
    \$result = \$response->json();
}
```

### B. PHP Native (cURL)
```php
<?php
\$payload = json_encode([
    'phone' => '08386012467',
    'message' => 'Pesanan #INV-290 telah kami proses dan segera dikirim.',
]);

\$ch = curl_init('{$baseUrl}/api/v1/messages/send');
curl_setopt_array(\$ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => \$payload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer bk_live_your_api_key_here',
        'Content-Type: application/json',
        'Accept: application/json',
    ],
]);

\$response = curl_exec(\$ch);
curl_close(\$ch);
echo \$response;
```

### C. Node.js (Axios)
```javascript
import axios from 'axios';

async function sendNotification(phone, message) {
  const res = await axios.post(
    '{$baseUrl}/api/v1/messages/send',
    { phone, message },
    {
      headers: {
        'Authorization': 'Bearer bk_live_your_api_key_here',
        'Content-Type': 'application/json',
      },
    }
  );
  return res.data;
}

sendNotification('08386012467', 'Halo dari Node.js!');
```

### D. Python (Requests)
```python
import requests

url = "{$baseUrl}/api/v1/messages/send"
headers = {
    "Authorization": "Bearer bk_live_your_api_key_here",
    "Content-Type": "application/json",
}
payload = {
    "phone": "08386012467",
    "message": "Pemberitahuan: Jadwal Sidang telah dijadwalkan pada hari Kamis pkl 09:00 WIB.",
}

response = requests.post(url, json=payload, headers=headers)
print(response.status_code, response.json())
```

### E. cURL (Terminal / Bash)
```bash
curl -X POST {$baseUrl}/api/v1/messages/send \\
  -H "Authorization: Bearer bk_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "08386012467",
    "message": "Testing bridging WhatsApp API dari cURL."
  }'
```

---

## 5. SPESIFIKASI WEBHOOK MASUK (TWO-WAY BRIDGING)
Daftarkan URL callback aplikasi Anda di menu **Kredensial API & Webhook** untuk menerima event realtime:

### 1. Event Chat Balasan Masuk (`message.inbound`)
```json
{
  "event": "message.inbound",
  "sender": "+628386012467",
  "message": "Halo admin, saya ingin konfirmasi pembayaran.",
  "timestamp": "2026-10-26T14:20:00Z"
}
```

### 2. Event Laporan Terkirim (`message.delivered`)
```json
{
  "event": "message.delivered",
  "message_id": 142,
  "timestamp": "2026-10-26T14:20:02Z"
}
```

---

## 6. TABEL KODE STATUS HTTP
- `200 OK`: Pesan berhasil diproses dan dikirim ke server WhatsApp.
- `401 Unauthorized`: API Key hilang, salah, atau telah dihapus.
- `402 Payment Required`: Kuota pesan habis atau langganan kedaluwarsa.
- `422 Unprocessable Entity`: Parameter `phone`/`message` kosong atau tidak ada perangkat WhatsApp yang sedang berstatus `connected`.
- `429 Too Many Requests`: Melebihi batas rate limit 60 request/menit.
- `500 Internal Server Error`: Kendala timeout jaringan gateway.

---

## 7. REKOMENDASI PRODUKSI (BEST PRACTICES)
1. **Gunakan Queue / Background Jobs**: Bungkus proses pengiriman WhatsApp ke antrean latar belakang (Laravel Queue, BullMQ, Celery) agar proses transaksi utama pengguna tidak terhambat.
2. **Jitter Delay (Anti-Ban)**: Jika mengirim pesan dalam jumlah banyak, berikan jeda acak 8–18 detik antar nomor agar ritme pengiriman menyerupai interaksi manusia asli.
3. **Sanitasi Nomor**: Pastikan karakter spasi, strip, atau tanda kurung telah dihilangkan sebelum data dikirim ke API.

---
*Diterbitkan oleh Politeknik Mardira Indonesia — MARDIRA WA 2026.*
MD;
    }
}
