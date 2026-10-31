import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import PublicLayout, { usePublicAuth } from '../../Layouts/PublicLayout';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import {
    Code2,
    Zap,
    Download,
    Terminal,
    Send,
    FileText,
    ShieldCheck,
    CheckCircle2,
    CheckCheck,
    MessageSquare,
    AlertTriangle,
    Layers,
    Globe,
    Cpu,
    ArrowRight,
    Clock,
    Key,
    Smartphone,
    RefreshCw,
} from 'lucide-react';
import CopyButton from '../../Components/ui/CopyButton';

const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

const heroItemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function RestApi({ plans = [], stats = {} }) {
    const safePlans = Array.isArray(plans) ? plans : [];
    const { openRegisterModal } = usePublicAuth();

    // Active state for Code Snippets Tabs
    const [activeLang, setActiveLang] = useState('curl');
    const [activeEndpointType, setActiveEndpointType] = useState('text'); // 'text' | 'media'
    const [activeWebhookLang, setActiveWebhookLang] = useState('php');

    // Code Snippets Data - Text Message
    const textSnippets = {
        curl: `curl -X POST https://wa.mardira.ac.id/api/v1/messages/send \\
  -H "Authorization: Bearer bk_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "phone": "08386012467",
    "message": "Kode verifikasi OTP Anda adalah *918234*. Berlaku selama 5 menit. Jangan berikan kepada siapapun!"
  }'`,
        laravel: `use Illuminate\\Support\\Facades\\Http;

$response = Http::withToken('bk_live_your_api_key_here')
    ->acceptJson()
    ->post('https://wa.mardira.ac.id/api/v1/messages/send', [
        'phone' => '08386012467',
        'message' => "Halo Kak Budi,\\n\\nTagihan semester #INV-2026-081 telah terbit dan siap dibayar.\\nTerima kasih!",
    ]);

if ($response->successful()) {
    $resData = $response->json();
    $messageId = $resData['data']['message_id'];
    // Simpan $messageId ke database sistem Anda
} else {
    logger()->error('Gagal kirim WhatsApp:', $response->json());
}`,
        php: `<?php
$payload = json_encode([
    'phone' => '08386012467',
    'message' => 'Pesanan #INV-290 telah kami proses dan segera dikirim ke alamat Anda.',
]);

$ch = curl_init('https://wa.mardira.ac.id/api/v1/messages/send');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer bk_live_your_api_key_here',
        'Content-Type: application/json',
        'Accept: application/json',
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$result = json_decode($response, true);
echo "Status: " . $result['status'];`,
        nodejs: `import axios from 'axios';

async function sendWhatsAppAlert() {
  try {
    const response = await axios.post(
      'https://wa.mardira.ac.id/api/v1/messages/send',
      {
        phone: '08386012467',
        message: 'Halo! Pendaftaran akun Anda telah diverifikasi oleh sistem MARDIRA WA.',
      },
      {
        headers: {
          'Authorization': 'Bearer bk_live_your_api_key_here',
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      }
    );

    console.log('Terkirim:', response.data);
  } catch (error) {
    console.error('Gagal:', error.response?.data || error.message);
  }
}

sendWhatsAppAlert();`,
        python: `import requests

url = "https://wa.mardira.ac.id/api/v1/messages/send"
headers = {
    "Authorization": "Bearer bk_live_your_api_key_here",
    "Content-Type": "application/json",
    "Accept": "application/json",
}
payload = {
    "phone": "08386012467",
    "message": "Pemberitahuan: Jadwal Sidang Skripsi telah dijadwalkan pada hari Kamis pkl 09:00 WIB.",
}

response = requests.post(url, json=payload, headers=headers)
print("Status Code:", response.status_code)
print("Response JSON:", response.json())`,
        go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	payload, _ := json.Marshal(map[string]string{
		"phone":   "08386012467",
		"message": "Halo dari microservice Golang! Pesan otomatis terkirim.",
	})

	req, _ := http.NewRequest("POST", "https://wa.mardira.ac.id/api/v1/messages/send", bytes.NewBuffer(payload))
	req.Header.Set("Authorization", "Bearer bk_live_your_api_key_here")
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Response:", string(body))
}`,
    };

    // Code Snippets Data - Media Message
    const mediaSnippets = {
        curl: `curl -X POST https://wa.mardira.ac.id/api/v1/messages/send \\
  -H "Authorization: Bearer bk_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "08386012467",
    "media_url": "https://storage.kampus.ac.id/invoices/INV-2026-001.pdf",
    "message": "Faktur Resmi Pembayaran SPP Semester Ganjil 2026/2027 #INV-2026-001 terlampir."
  }'`,
        laravel: `use Illuminate\\Support\\Facades\\Http;

$response = Http::withToken('bk_live_your_api_key_here')
    ->acceptJson()
    ->post('https://wa.mardira.ac.id/api/v1/messages/send', [
        'phone' => '08386012467',
        'media_url' => 'https://storage.kampus.ac.id/invoices/INV-2026-001.pdf',
        'message' => 'Faktur Tagihan Resmi Politeknik Mardira Indonesia #INV-2026-001 terlampir.',
    ]);

return $response->json();`,
        php: `<?php
$payload = json_encode([
    'phone'     => '08386012467',
    'media_url' => 'https://storage.kampus.ac.id/invoices/INV-2026-001.pdf',
    'message'   => 'Faktur Resmi Pembayaran #INV-2026-001 terlampir.',
]);

$ch = curl_init('https://wa.mardira.ac.id/api/v1/messages/send');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer bk_live_your_api_key_here',
        'Content-Type: application/json',
    ],
]);

$res = curl_exec($ch);
curl_close($ch);
echo $res;`,
        nodejs: `import axios from 'axios';

await axios.post(
  'https://wa.mardira.ac.id/api/v1/messages/send',
  {
    phone: '08386012467',
    media_url: 'https://storage.kampus.ac.id/invoices/INV-2026-001.pdf',
    message: 'Faktur Tagihan Resmi Politeknik Mardira Indonesia #INV-2026-001 terlampir.',
  },
  {
    headers: {
      'Authorization': 'Bearer bk_live_your_api_key_here',
      'Content-Type': 'application/json',
    },
  }
);`,
        python: `import requests

response = requests.post(
    "https://wa.mardira.ac.id/api/v1/messages/send",
    headers={"Authorization": "Bearer bk_live_your_api_key_here"},
    json={
        "phone": "08386012467",
        "media_url": "https://storage.kampus.ac.id/invoices/INV-2026-001.pdf",
        "message": "Faktur Resmi Pembayaran #INV-2026-001 terlampir.",
    }
)
print(response.json())`,
        go: `// Lampirkan parameter "media_url" pada payload JSON
payload, _ := json.Marshal(map[string]string{
    "phone":     "08386012467",
    "media_url": "https://storage.kampus.ac.id/invoices/INV-2026-001.pdf",
    "message":   "Faktur Tagihan Resmi #INV-2026-001 terlampir.",
})`,
    };

    // Response Success Sample
    const successResponseSample = `{
  "status": true,
  "message": "Pesan berhasil diproses dan dikirim via BisnisWA UltraSync Engine",
  "data": {
    "message_id": 142,
    "device_id": 6,
    "server": "wwebjs",
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
}`;

    // Webhook Event JSON Samples for Copy
    const webhookInboundSample = JSON.stringify({
        event: 'message.inbound',
        sender: '+628386012467',
        message: 'Halo, ini konfirmasi pembayaran.',
        timestamp: '2026-10-27T14:20:00Z',
    }, null, 2);

    const webhookDeliveredSample = JSON.stringify({
        event: 'message.delivered',
        message_id: 142,
        status: 'delivered',
        timestamp: '2026-10-27T14:20:00Z',
    }, null, 2);

    const webhookDisconnectedSample = JSON.stringify({
        event: 'device.disconnected',
        device_id: 6,
        reason: 'Connection timeout',
        status: 'offline',
    }, null, 2);

    // Webhook Receiver Snippets
    const webhookReceiverSnippets = {
        php: `<?php
// Contoh Webhook Handler di Laravel (routes/api.php atau Controller)
namespace App\\Http\\Controllers;

use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Log;

class WhatsAppWebhookController extends Controller
{
    public function handle(Request $request)
    {
        $event = $request->input('event');

        if ($event === 'message.inbound') {
            $sender = $request->input('sender'); // Contoh: "+628386012467"
            $message = $request->input('message');

            Log::info("Pesan masuk dari {$sender}: {$message}");

            // Eksekusi logika bisnis Anda (simpan tiket, auto-reply, atau update pesanan)
        }

        if ($event === 'message.delivered') {
            $messageId = $request->input('message_id');
            Log::info("Pesan {$messageId} telah diterima pengguna (centang dua).");
        }

        return response()->json(['status' => 'received']);
    }
}`,
        nodejs: `// Contoh Webhook Handler di Node.js Express
import express from 'express';

const app = express();
app.use(express.json());

app.post('/webhook/whatsapp', (req, res) => {
  const { event, sender, message, message_id } = req.body;

  if (event === 'message.inbound') {
    console.log(\`[Inbound Chat] Dari: \${sender} | Isi: \${message}\`);
    // Lakukan bridging ke database CRM atau asisten bot Anda
  }

  if (event === 'message.delivered') {
    console.log(\`[Delivery Receipt] Pesan \${message_id} sampai di HP tujuan.\`);
  }

  return res.status(200).json({ status: 'ok' });
});

app.listen(8080, () => console.log('Webhook listener aktif di port 8080'));`,
    };

    return (
        <PublicLayout title="Dokumentasi REST API & Panduan Bridging" plans={safePlans} activeMenu="rest-api">
            <div className="space-y-16 lg:space-y-24">
                {/* ================= HERO HEADER ================= */}
                <section className="relative overflow-hidden bg-white bg-grid-pattern text-slate-900 pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-10 border-b border-slate-100">
                    <motion.div
                        variants={heroContainerVariants}
                        initial="hidden"
                        animate="visible"
                        className="relative max-w-5xl mx-auto text-center space-y-5"
                    >
                        <motion.div variants={heroItemVariants} className="inline-block gsap-hero-item">
                            <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border-[1.5px] border-[#1e50ff] bg-white text-[#1e50ff] text-[10px] sm:text-xs font-bold sm:font-black uppercase tracking-normal sm:tracking-widest shadow-xs">
                                <Code2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1e50ff] shrink-0" />
                                <span className="hidden sm:inline">DEVELOPER BRIDGING GUIDE & REST API v1.0</span>
                                <span className="sm:hidden">REST API & WEBHOOK v1.0</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            variants={heroItemVariants}
                            className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight gsap-hero-item"
                        >
                            <span className="font-editorial-italic font-normal tracking-normal text-slate-900">Dokumentasi Lengkap</span> REST API & <span className="text-[#1e50ff]">Webhook Real-time</span>
                        </motion.h1>

                        <motion.p
                            variants={heroItemVariants}
                            className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed gsap-hero-item"
                        >
                            Panduan integrasi resmi untuk menghubungkan aplikasi Anda (SIAKAD, ERP, CRM, POS, E-Commerce) ke WhatsApp Gateway MARDIRA WA melalui HTTP JSON Bearer Token dengan mudah, aman, dan cepat.
                        </motion.p>

                        <motion.div variants={heroItemVariants} className="pt-4 flex flex-wrap items-center justify-center gap-3 gsap-hero-item">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => openRegisterModal()}
                                className="btn-royal-pill inline-flex h-11 items-center gap-2 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] px-8 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_12px_28px_-4px_rgba(30,80,255,0.45)] transition-all cursor-pointer"
                            >
                                <Zap className="w-4 h-4 fill-white" />
                                <span>Dapatkan API Key Sekarang</span>
                            </motion.button>
                            <Link
                                href="/cara-pakai"
                                prefetch
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 px-6 text-xs font-bold text-slate-800 shadow-2xs transition-all"
                            >
                                <span>Panduan Integrasi Cepat &rarr;</span>
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>

                {/* ================= 4-STEP BRIDGING PIPELINE ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center space-y-2 mb-10 gsap-reveal">
                        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider bg-blue-50 text-[#1e50ff] border border-blue-200" className="text-[10px] font-bold">ALUR INTEGRASI CEPAT</span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            4 Langkah Mudah Bridging ke WhatsApp Gateway
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Hanya butuh waktu kurang dari 5 menit untuk menghubungkan aplikasi client ke nomor WhatsApp produksi.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 gsap-card-grid">
                        <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all space-y-3 relative">
                            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center text-sm">
                                1
                            </div>
                            <h3 className="font-bold text-sm text-[#0f172a]">Generate API Key</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Buka menu <strong>Kredensial API & Webhook</strong> di dashboard, buat kunci rahasia bertipe Bearer Token (<code className="font-mono text-[#1e50ff] bg-blue-50 px-1 py-0.5 rounded text-[11px]">bk_live_...</code>).
                            </p>
                        </Card>

                        <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all space-y-3 relative">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm">
                                2
                            </div>
                            <h3 className="font-bold text-sm text-[#0f172a]">Hubungkan WhatsApp</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Pindai QR Code di menu <strong>Manajemen Gateway</strong> menggunakan aplikasi WhatsApp resmi di HP Anda (didukung oleh BisnisWA UltraSync Engine resmi).
                            </p>
                        </Card>

                        <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all space-y-3 relative">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-sm">
                                3
                            </div>
                            <h3 className="font-bold text-sm text-[#0f172a]">Kirim HTTP Request</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Panggil endpoint <code className="font-mono text-[#1e50ff] bg-blue-50 px-1 py-0.5 rounded text-[11px]">POST /api/v1/messages/send</code> dengan payload JSON dari aplikasi backend Anda.
                            </p>
                        </Card>

                        <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all space-y-3 relative">
                            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 font-black flex items-center justify-center text-sm">
                                4
                            </div>
                            <h3 className="font-bold text-sm text-[#0f172a]">Pasang Webhook (Dua Arah)</h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Daftarkan URL callback aplikasi Anda untuk menerima notifikasi pesan masuk dari pelanggan serta tanda pesan terkirim secara *realtime*.
                            </p>
                        </Card>
                    </div>
                </section>

                {/* ================= CORE API SPECIFICATION & CODE TABS ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="text-center space-y-2 gsap-reveal">
                        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider bg-blue-50 text-[#1e50ff] border border-blue-200" className="text-[10px] font-bold">ENDPOINT RESMI</span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Spesifikasi Teknis Endpoint WhatsApp
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Mendukung pengiriman pesan teks (OTP, Notifikasi) serta pengiriman lampiran media (Faktur PDF, Gambar, Surat).
                        </p>
                    </div>

                    {/* Endpoint Selector Tabs */}
                    <div className="flex items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveEndpointType('text')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                activeEndpointType === 'text'
                                    ? 'bg-emerald-700 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <Send className="w-3.5 h-3.5" />
                            <span>1. Kirim Pesan Teks / OTP</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveEndpointType('media')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                activeEndpointType === 'media'
                                    ? 'bg-emerald-700 text-white shadow-sm'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            <FileText className="w-3.5 h-3.5" />
                            <span>2. Kirim Media / Dokumen PDF</span>
                        </button>
                    </div>

                    {/* Main Documentation Card */}
                    <Card className="border border-slate-200/90 bg-white rounded-3xl shadow-card overflow-hidden">
                        {/* Endpoint Title Bar */}
                        <div className="p-4 sm:p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
                            <div className="flex items-center gap-3">
                                <span className="px-2.5 py-1 rounded-lg bg-blue-500 text-slate-950 font-black text-xs">
                                    POST
                                </span>
                                <span className="font-mono text-xs sm:text-sm font-bold text-blue-300">
                                    {activeEndpointType === 'text' ? '/api/v1/messages/send' : '/api/v1/messages/send-media'}
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                                    <span>Bearer Token Auth</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 text-amber-400" />
                                    <span>Rate Limit: 60 req/menit</span>
                                </span>
                            </div>
                        </div>

                        {/* Request Parameters Breakdown Table */}
                        <div className="p-6 border-b border-slate-100 space-y-3">
                            <h3 className="font-bold text-sm text-[#0f172a] flex items-center gap-2">
                                <Layers className="w-4 h-4 text-[#1e50ff]" />
                                <span>Parameter Request (JSON Body)</span>
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border border-slate-200/80 rounded-xl overflow-hidden">
                                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                        <tr>
                                            <th className="py-2.5 px-4">Parameter</th>
                                            <th className="py-2.5 px-4">Tipe Data</th>
                                            <th className="py-2.5 px-4">Wajib?</th>
                                            <th className="py-2.5 px-4">Keterangan & Format</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <tr>
                                            <td className="py-2.5 px-4 font-mono font-bold text-[#1e50ff]">phone</td>
                                            <td className="py-2.5 px-4 font-mono text-slate-600">string</td>
                                            <td className="py-2.5 px-4"><span variant="outline" className="text-red-700 bg-red-50 border-red-200 text-[10px]">Wajib</span></td>
                                            <td className="py-2.5 px-4 text-slate-600">
                                                Nomor tujuan WhatsApp. Format otomatis dinormalisasi: diawali <code className="bg-slate-100 px-1 py-0.5 rounded">08xxx</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">628xxx</code>, atau <code className="bg-slate-100 px-1 py-0.5 rounded">+628xxx</code>.
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 px-4 font-mono font-bold text-[#1e50ff]">message</td>
                                            <td className="py-2.5 px-4 font-mono text-slate-600">string</td>
                                            <td className="py-2.5 px-4">
                                                {activeEndpointType === 'text' ? (
                                                    <span variant="outline" className="text-red-700 bg-red-50 border-red-200 text-[10px]">Wajib</span>
                                                ) : (
                                                    <span variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-[10px]">Opsional (Caption)</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-4 text-slate-600">
                                                Isi teks pesan. Mendukung format WhatsApp (misal <code className="bg-slate-100 px-1 py-0.5 rounded">*tebal*</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">_miring_</code>, <code className="bg-slate-100 px-1 py-0.5 rounded">~coret~</code>), baris baru (<code className="bg-slate-100 px-1 py-0.5 rounded">\n</code>), dan emoji.
                                            </td>
                                        </tr>
                                        {activeEndpointType === 'media' && (
                                            <tr>
                                                <td className="py-2.5 px-4 font-mono font-bold text-[#1e50ff]">media_url</td>
                                                <td className="py-2.5 px-4 font-mono text-slate-600">string (URL)</td>
                                                <td className="py-2.5 px-4"><span variant="outline" className="text-red-700 bg-red-50 border-red-200 text-[10px]">Wajib</span></td>
                                                <td className="py-2.5 px-4 text-slate-600">
                                                    URL publik dokumen atau gambar (PDF, JPG, PNG). Sistem gateway akan mengunduh dan mengirimkannya sebagai lampiran WhatsApp asli.
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="py-2.5 px-4 font-mono font-bold text-slate-700">device_id</td>
                                            <td className="py-2.5 px-4 font-mono text-slate-600">integer</td>
                                            <td className="py-2.5 px-4"><span variant="outline" className="text-slate-600 bg-slate-50 border-slate-200 text-[10px]">Opsional</span></td>
                                            <td className="py-2.5 px-4 text-slate-600">
                                                ID perangkat WhatsApp pengirim tertentu. Jika diabaikan, sistem otomatis memilih perangkat aktif pertama di workspace Anda.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Interactive Code Snippets */}
                        <div className="p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h3 className="font-bold text-sm text-[#0f172a] flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-[#1e50ff]" />
                                    <span>Contoh Kode Bridging Klien</span>
                                </h3>

                                {/* Language Selector Tabs */}
                                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
                                    {[
                                        { id: 'curl', label: 'cURL' },
                                        { id: 'laravel', label: 'PHP (Laravel)' },
                                        { id: 'php', label: 'PHP (Native)' },
                                        { id: 'nodejs', label: 'Node.js (Axios)' },
                                        { id: 'python', label: 'Python' },
                                        { id: 'go', label: 'Go' },
                                    ].map((lang) => (
                                        <button
                                            key={lang.id}
                                            type="button"
                                            onClick={() => setActiveLang(lang.id)}
                                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                                                activeLang === lang.id
                                                    ? 'bg-white text-emerald-800 shadow-2xs'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            }`}
                                        >
                                            {lang.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Code Box */}
                            <div className="relative rounded-2xl bg-slate-950 p-4 sm:p-5 font-mono text-xs text-slate-200 shadow-inner overflow-x-auto border border-slate-800">
                                <div className="absolute right-3 top-3">
                                    <CopyButton
                                        textToCopy={activeEndpointType === 'text' ? textSnippets[activeLang] : mediaSnippets[activeLang]}
                                        label="Salin Kode"
                                        copiedLabel="Tersalin!"
                                        className="text-[11px] py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                                    />
                                </div>
                                <pre className="leading-relaxed">
                                    <code>{activeEndpointType === 'text' ? textSnippets[activeLang] : mediaSnippets[activeLang]}</code>
                                </pre>
                            </div>

                            {/* Response Preview */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-[#1e50ff]" />
                                        <span>Contoh Response Sukses (HTTP 200 OK)</span>
                                    </div>
                                    <CopyButton
                                        textToCopy={successResponseSample}
                                        label="Salin JSON"
                                        copiedLabel="Tersalin!"
                                        variant="outline"
                                        className="text-[11px] font-medium"
                                    />
                                </div>
                                <div className="rounded-2xl bg-slate-900 p-4 font-mono text-xs text-blue-300 overflow-x-auto border border-slate-800">
                                    <pre><code>{successResponseSample}</code></pre>
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* ================= HTTP STATUS & ERROR CODES TABLE ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="p-6 rounded-3xl border border-slate-200/90 bg-white shadow-card space-y-4">
                        <div className="space-y-1">
                            <h3 className="font-black text-lg text-[#0f172a] flex items-center gap-2">
                                <Globe className="w-5 h-5 text-[#1e50ff]" />
                                <span>Tabel Kode Respon & Penanganan Error</span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                Standar HTTP status code yang dipancarkan oleh MARDIRA WA API untuk mempermudah error handling pada aplikasi client Anda.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border border-slate-200/80 rounded-xl overflow-hidden">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="py-2.5 px-4">Status Code</th>
                                        <th className="py-2.5 px-4">Penyebab Masalah</th>
                                        <th className="py-2.5 px-4">Solusi Rekomendasi Developer</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr>
                                        <td className="py-3 px-4 font-mono font-bold text-[#1e50ff]">200 OK</td>
                                        <td className="py-3 px-4 font-semibold text-slate-900">Pesan berhasil dikirim</td>
                                        <td className="py-3 px-4 text-slate-600">Pesan telah diterima gateway dan diteruskan ke nomor tujuan.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-mono font-bold text-amber-700">401 Unauthorized</td>
                                        <td className="py-3 px-4 font-semibold text-slate-900">Bearer Token hilang atau salah</td>
                                        <td className="py-3 px-4 text-slate-600">Pastikan header <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">Authorization: Bearer bk_live_...</code> valid dan belum dihapus dari dashboard.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-mono font-bold text-amber-700">402 Payment Required</td>
                                        <td className="py-3 px-4 font-semibold text-slate-900">Kuota habis / paket langganan expired</td>
                                        <td className="py-3 px-4 text-slate-600">Perpanjang langganan atau tambah kuota pesan di menu Paket & Kuota Layanan.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-mono font-bold text-red-700">422 Unprocessable</td>
                                        <td className="py-3 px-4 font-semibold text-slate-900">Perangkat offline atau format salah</td>
                                        <td className="py-3 px-4 text-slate-600">Pastikan nomor HP tujuan terisi dan ada minimal 1 perangkat WhatsApp dengan status <span className="text-[#1e50ff] font-bold">Connected</span>.</td>
                                    </tr>
                                    <tr>
                                        <td className="py-3 px-4 font-mono font-bold text-red-700">500 Server Error</td>
                                        <td className="py-3 px-4 font-semibold text-slate-900">Kendala koneksi internal gateway</td>
                                        <td className="py-3 px-4 text-slate-600">Gunakan mekanisme retry backoff (misal 3x percobaan dengan jeda 2 detik) pada HTTP Client Anda.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                {/* ================= WEBHOOKS SECTION ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{ duration: 0.22 }}
                        className="text-center space-y-2 gsap-reveal"
                    >
                        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider bg-blue-50 text-[#1e50ff] border border-blue-200" className="text-[10px] font-bold">REAL-TIME EVENTS</span>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Spesifikasi Webhook Masuk (Dua Arah)
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Konfigurasikan URL webhook di dashboard untuk menerima HTTP POST secara instan saat pelanggan membalas chat WhatsApp atau saat ada laporan pengiriman.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 gsap-card-grid items-stretch">
                        {/* Event 1: message.inbound */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-20px' }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -6, scale: 1.01 }}
                            className="gsap-card flex"
                        >
                            <Card className="w-full p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white shadow-card hover:shadow-card-hover hover:border-sky-300 transition-all flex flex-col justify-between space-y-4 group">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 group-hover:scale-105 transition-transform shadow-2xs">
                                                <MessageSquare className="w-4 h-4" />
                                            </div>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
                                                POST
                                            </span>
                                        </div>
                                        <CopyButton
                                            textToCopy={webhookInboundSample}
                                            label="Salin JSON"
                                            copiedLabel="Tersalin!"
                                            variant="outline"
                                            className="text-[11px] font-medium"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">Pesan Masuk Klien</span>
                                        <h3 className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                                            message.inbound
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                                        Dipancarkan seketika saat pelanggan atau mahasiswa membalas obrolan WhatsApp ke nomor gateway Anda.
                                    </p>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                        <span>PAYLOAD JSON</span>
                                        <span className="text-sky-600 font-sans font-semibold">Incoming Hook</span>
                                    </div>
                                    <div className="rounded-xl bg-slate-950 p-3.5 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                                        <pre className="text-slate-300 leading-relaxed">
                                            <code>
                                                {"{\n"}
                                                {"  "}<span className="text-sky-300">"event"</span>: <span className="text-blue-300">"message.inbound"</span>,{"\n"}
                                                {"  "}<span className="text-sky-300">"sender"</span>: <span className="text-blue-300">"+628386012467"</span>,{"\n"}
                                                {"  "}<span className="text-sky-300">"message"</span>: <span className="text-blue-300">"Halo, ini konfirmasi..."</span>,{"\n"}
                                                {"  "}<span className="text-sky-300">"timestamp"</span>: <span className="text-amber-300">"2026-10-27T14:20:00Z"</span>{"\n"}
                                                {"}"}
                                            </code>
                                        </pre>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Event 2: message.delivered */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-20px' }}
                            transition={{ duration: 0.25, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -6, scale: 1.01 }}
                            className="gsap-card flex"
                        >
                            <Card className="w-full p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white shadow-card hover:shadow-card-hover hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4 group">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1e50ff] flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform shadow-2xs">
                                                <CheckCheck className="w-4 h-4" />
                                            </div>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
                                                POST
                                            </span>
                                        </div>
                                        <CopyButton
                                            textToCopy={webhookDeliveredSample}
                                            label="Salin JSON"
                                            copiedLabel="Tersalin!"
                                            variant="outline"
                                            className="text-[11px] font-medium"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-[#1e50ff] uppercase tracking-wider block">Laporan Status Terkirim</span>
                                        <h3 className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                                            message.delivered
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                                        Diterima saat server WhatsApp berhasil menyampaikan pesan ke perangkat tujuan (status centang dua).
                                    </p>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                        <span>PAYLOAD JSON</span>
                                        <span className="text-[#1e50ff] font-sans font-semibold">Delivery Hook</span>
                                    </div>
                                    <div className="rounded-xl bg-slate-950 p-3.5 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                                        <pre className="text-slate-300 leading-relaxed">
                                            <code>
                                                {"{\n"}
                                                {"  "}<span className="text-sky-300">"event"</span>: <span className="text-blue-300">"message.delivered"</span>,{"\n"}
                                                {"  "}<span className="text-sky-300">"message_id"</span>: <span className="text-amber-300">142</span>,{"\n"}
                                                {"  "}<span className="text-sky-300">"status"</span>: <span className="text-blue-300">"delivered"</span>,{"\n"}
                                                {"  "}<span className="text-sky-300">"timestamp"</span>: <span className="text-amber-300">"2026-10-27T14:20:00Z"</span>{"\n"}
                                                {"}"}
                                            </code>
                                        </pre>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Event 3: device.disconnected */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-20px' }}
                            transition={{ duration: 0.25, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -6, scale: 1.01 }}
                            className="gsap-card flex"
                        >
                            <Card className="w-full p-5 sm:p-6 rounded-2xl border border-slate-200/90 bg-white shadow-card hover:shadow-card-hover hover:border-amber-300 transition-all flex flex-col justify-between space-y-4 group">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform shadow-2xs">
                                                <AlertTriangle className="w-4 h-4" />
                                            </div>
                                            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200/70">
                                                POST
                                            </span>
                                        </div>
                                        <CopyButton
                                            textToCopy={webhookDisconnectedSample}
                                            label="Salin JSON"
                                            copiedLabel="Tersalin!"
                                            variant="outline"
                                            className="text-[11px] font-medium"
                                        />
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Peringatan Koneksi Gateway</span>
                                        <h3 className="text-sm font-mono font-bold text-slate-900 mt-0.5">
                                            device.disconnected
                                        </h3>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">
                                        Notifikasi darurat otomatis jika ponsel gateway mati, low batt, atau kehilangan koneksi internet.
                                    </p>
                                </div>

                                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                                        <span>PAYLOAD JSON</span>
                                        <span className="text-amber-600 font-sans font-semibold">Incident Hook</span>
                                    </div>
                                    <div className="rounded-xl bg-slate-950 p-3.5 font-mono text-[11px] overflow-x-auto border border-slate-800 shadow-inner">
                                        <pre className="text-slate-300 leading-relaxed">
                                            <code>
                                                {"{\n"}
                                                {"  "}<span className="text-sky-300">"event"</span>: <span className="text-blue-300">"device.disconnected"</span>,{"\n"}
                                                {"  "}<span className="text-sky-300">"device_id"</span>: <span className="text-amber-300">6</span>,{"\n"}
                                                {"  "}<span className="text-sky-300">"reason"</span>: <span className="text-rose-300">"Connection timeout"</span>,{"\n"}
                                                {"  "}<span className="text-sky-300">"status"</span>: <span className="text-rose-300">"offline"</span>{"\n"}
                                                {"}"}
                                            </code>
                                        </pre>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Webhook Receiver Code Example */}
                    <Card className="p-6 sm:p-7 rounded-3xl border border-slate-200/90 bg-white shadow-card space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-bold text-base text-[#0f172a] flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-[#1e50ff]" />
                                    <span>Contoh Kode Webhook Receiver di Server Anda</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Tangkap payload HTTP POST dari gateway MARDIRA WA dan dispatch event secara otomatis ke aplikasi Anda.
                                </p>
                            </div>

                            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setActiveWebhookLang('php')}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                        activeWebhookLang === 'php'
                                            ? 'bg-white text-emerald-800 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    PHP (Laravel)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveWebhookLang('nodejs')}
                                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                                        activeWebhookLang === 'nodejs'
                                            ? 'bg-white text-emerald-800 shadow-2xs'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Node.js (Express)
                                </button>
                            </div>
                        </div>

                        {/* Code Container */}
                        <div className="relative rounded-2xl bg-slate-950 p-4 sm:p-5 font-mono text-xs text-slate-200 shadow-inner overflow-x-auto border border-slate-800">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80 text-[11px] text-slate-400">
                                <span className="font-mono text-blue-400">
                                    {activeWebhookLang === 'php' ? 'app/Http/Controllers/WhatsAppWebhookController.php' : 'server.js'}
                                </span>
                                <CopyButton
                                    textToCopy={webhookReceiverSnippets[activeWebhookLang]}
                                    label="Salin Handler"
                                    variant="dark"
                                    className="text-[11px] py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                                />
                            </div>
                            <pre className="leading-relaxed"><code>{webhookReceiverSnippets[activeWebhookLang]}</code></pre>
                        </div>
                    </Card>
                </section>

                {/* ================= BEST PRACTICES FOR BRIDGING ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card className="p-6 sm:p-8 rounded-3xl border border-blue-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-white shadow-xs space-y-6">
                        <div className="space-y-1">
                            <span className="px-3 py-1 rounded-full text-[10px] uppercase font-extrabold tracking-wider bg-blue-50 text-[#1e50ff] border border-blue-200" className="text-[10px] font-bold">REKOMENDASI PRODUKSI</span>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Best Practices untuk Stabilitas Bridging WhatsApp
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Ikuti standar terbaik berikut agar nomor WhatsApp bisnis Anda aman, tahan lama, dan memiliki SLA pengiriman optimal.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shadow-2xs">
                                    <Zap className="w-4 h-4 text-[#1e50ff]" />
                                </div>
                                <h4 className="font-bold text-xs text-slate-900">Gunakan Background Queue</h4>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Jangan panggil API WhatsApp secara sinkron pada proses checkout atau login user. Masukkan ke background queue (seperti Laravel Queue, BullMQ, Celery) agar user experience tetap instan.
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shadow-2xs">
                                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                                </div>
                                <h4 className="font-bold text-xs text-slate-900">Terapkan Jitter Delay (Anti-Ban)</h4>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Saat mengirim ratusan pesan, berikan jeda acak 8–18 detik antar nomor. Ini menjaga perilaku pengiriman menyerupai interaksi manusia asli sehingga terhindar dari deteksi bot WhatsApp.
                                </p>
                            </div>

                            <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-2.5">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs shadow-2xs">
                                    <Smartphone className="w-4 h-4 text-blue-700" />
                                </div>
                                <h4 className="font-bold text-xs text-slate-900">Sanitasi Otomatis Format Nomor</h4>
                                <p className="text-[11px] text-slate-600 leading-relaxed">
                                    Hapus spasi, tanda strip, atau kurung pada nomor telepon pengguna sebelum request dikirim. Format standar <code>+628xxx</code> atau <code>08xxx</code> akan diproses dengan latensi terendah.
                                </p>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* ================= CTA BANNER ================= */}
                <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-3xl bg-gradient-to-r from-[#08112c] via-[#0d2260] to-[#1e50ff] p-8 sm:p-12 text-white text-center space-y-4 shadow-xl gsap-scale"
                    >
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-300/40 bg-white/10 text-blue-200 text-xs font-black uppercase tracking-widest">
                            INTEGRASI DEVELOPER INSTAN
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                            Mulai Kirim Pesan Pertama via <span className="font-editorial-italic font-normal">REST API</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
                            Buat akun gratis sekarang, dapatkan API Bearer Token instan, dan hubungkan sistem backend Anda dalam hitungan menit.
                        </p>
                        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => openRegisterModal()}
                                className="btn-press inline-flex h-11 items-center gap-2 rounded-full bg-white hover:bg-slate-100 px-8 text-xs font-extrabold uppercase tracking-wider text-[#1e50ff] shadow-lg transition-all cursor-pointer"
                            >
                                <Zap className="w-3.5 h-3.5 fill-[#1e50ff]" />
                                <span>Buat Akun & Dapatkan API Key</span>
                            </motion.button>
                            <Link
                                href="/faq"
                                prefetch
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-6 text-xs font-bold text-white transition-all"
                            >
                                <span>Pusat Bantuan & Webhook &rarr;</span>
                            </Link>
                        </div>
                    </motion.div>
                </section>
            </div>
        </PublicLayout>
    );
}
