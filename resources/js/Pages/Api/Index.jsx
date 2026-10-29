import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import ModalPortal from '../../Components/ui/ModalPortal';
import {
    Code2,
    Key,
    Webhook as WebhookIcon,
    Copy,
    Check,
    Terminal,
    ShieldCheck,
    Plus,
    X,
    Download,
    Send,
    Activity,
    CheckCircle2,
    AlertCircle,
    Clock,
    FileText,
    ExternalLink,
    Smartphone,
    Trash2,
    Server,
    Globe,
    Zap,
    Radio,
    Layers,
    Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '../../Components/ui/table';

export default function ApiIndex({ workspace, apiKeys = [], webhooks = [], devices = [], apiLogs = [] }) {
    const { flash } = usePage().props;
    const [keyName, setKeyName] = useState('Production ERP Backend');
    const [selectedDeviceId, setSelectedDeviceId] = useState(
        devices.find((d) => d.status === 'connected')?.id || devices[0]?.id || ''
    );
    const [webhookUrl, setWebhookUrl] = useState(
        webhooks && webhooks[0] ? webhooks[0].url : 'https://api.klienanda.com/webhook/kirimwa'
    );
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedBaseUrl, setCopiedBaseUrl] = useState(false);
    const [copiedSnippet, setCopiedSnippet] = useState(false);
    const [copiedEndpoint, setCopiedEndpoint] = useState(null);
    const [activeLangTab, setActiveLangTab] = useState('curl'); // curl, node, php, python
    const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [pingLoading, setPingLoading] = useState(false);
    const [pingResult, setPingResult] = useState(null);

    const baseUrl = 'https://api.kirimwa.pro/api/v1';
    const activeTokenDisplay = flash?.new_api_key || 'bk_live_••••••••••••••••••••••••••••••••';

    const openCreateModal = () => {
        const defaultDev = devices.find((d) => d.status === 'connected') || devices[0];
        if (defaultDev) {
            setSelectedDeviceId(defaultDev.id);
        }
        setIsCreateKeyModalOpen(true);
    };

    // Code Snippets across languages
    const snippets = {
        curl: `curl -X POST ${baseUrl}/messages/send \\
  -H "Authorization: Bearer ${flash?.new_api_key || 'bk_live_84f938209481928301928374'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+6281234567890",
    "message": "Halo Kak Budi, pesanan Anda #INV-291 telah diproses."
  }'`,
        node: `import axios from 'axios';

const response = await axios.post('${baseUrl}/messages/send', {
  phone: '+6281234567890',
  message: 'Halo Kak Budi, pesanan Anda #INV-291 telah diproses.'
}, {
  headers: {
    'Authorization': 'Bearer ${flash?.new_api_key || 'bk_live_84f938209481928301928374'}',
    'Content-Type': 'application/json'
  }
});

console.log(response.data);`,
        php: `<?php

use Illuminate\\Support\\Facades\\Http;

$response = Http::withToken('${flash?.new_api_key || 'bk_live_84f938209481928301928374'}')
    ->post('${baseUrl}/messages/send', [
        'phone' => '+6281234567890',
        'message' => 'Halo Kak Budi, pesanan Anda #INV-291 telah diproses.',
    ]);

return $response->json();`,
        python: `import requests

url = "${baseUrl}/messages/send"
headers = {
    "Authorization": "Bearer ${flash?.new_api_key || 'bk_live_84f938209481928301928374'}",
    "Content-Type": "application/json"
}
payload = {
    "phone": "+6281234567890",
    "message": "Halo Kak Budi, pesanan Anda #INV-291 telah diproses."
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
    };

    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        if (type === 'key') {
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        } else if (type === 'baseUrl') {
            setCopiedBaseUrl(true);
            setTimeout(() => setCopiedBaseUrl(false), 2000);
        } else if (type === 'snippet') {
            setCopiedSnippet(true);
            setTimeout(() => setCopiedSnippet(false), 2000);
        } else if (type.startsWith('endpoint-')) {
            const ep = type.replace('endpoint-', '');
            setCopiedEndpoint(ep);
            setTimeout(() => setCopiedEndpoint(null), 2000);
        }
    };

    const handleCreateKey = (e) => {
        e.preventDefault();
        if (!selectedDeviceId) return;

        setProcessing(true);

        router.post('/api-access/keys', {
            name: keyName,
            device_id: selectedDeviceId,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setIsCreateKeyModalOpen(false);
                setKeyName('Production ERP Backend');
            },
        });
    };

    const handleDeleteKey = (id, name) => {
        if (confirm(`Apakah Anda yakin ingin menghapus / mencabut API Key "${name}"? Token ini tidak akan dapat digunakan lagi untuk memanggil REST API.`)) {
            router.delete(`/api-access/keys/${id}`, {
                preserveScroll: true,
            });
        }
    };

    const handleSaveWebhook = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post('/api-access/webhooks', {
            url: webhookUrl,
        }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const handleTestWebhookPing = async () => {
        setPingLoading(true);
        setPingResult(null);

        try {
            const res = await fetch('/api-access/test-ping', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            const data = await res.json();
            setPingResult(data);
        } catch (err) {
            setPingResult({ success: false, message: 'Gagal menghubungi server Webhook.' });
        } finally {
            setPingLoading(false);
        }
    };

    const endpointsList = [
        {
            method: 'GET',
            path: '/api/v1/quota',
            title: 'Cek Sisa Kuota & Status WhatsApp',
            badgeColor: 'bg-sky-600',
        },
        {
            method: 'POST',
            path: '/api/v1/messages/send',
            title: 'Kirim Pesan Teks & Kode OTP',
            badgeColor: 'bg-emerald-600',
        },
        {
            method: 'POST',
            path: '/api/v1/messages/send-media',
            title: 'Kirim Lampiran Gambar / Dokumen PDF',
            badgeColor: 'bg-emerald-600',
        },
    ];

    return (
        <AppLayout title="REST API & Webhooks">
            <Head title="REST API & Webhook Klien — MARDIRA WA" />

            <div className="space-y-6 animate-fade-in-up pb-8">
                {/* 1. TOP HEADER & UNIFIED ACTION BAR */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Code2 className="w-6 h-6 text-emerald-600 shrink-0" />
                                <span>Integrasi REST API & Webhooks</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                SHA-256 BEARER
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                            Hubungkan sistem backend, toko online, ERP, atau bot kampus Anda ke gateway WhatsApp via protokol REST JSON standar.
                        </p>
                    </div>

                    {/* ACTION BUTTONS GROUP - Cohesive & No Awkward Wrapping */}
                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 shadow-2xs">
                            <a
                                href="/api-access/download-docs"
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-white transition-all shadow-xs"
                                title="Download panduan lengkap integrasi dan bridging WhatsApp API"
                            >
                                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Panduan Bridging (.md)</span>
                            </a>
                            <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />
                            <a
                                href="/api-access/download-postman"
                                download
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 hover:text-orange-600 hover:bg-white transition-all"
                                title="Download koleksi Postman API JSON"
                            >
                                <Download className="w-3.5 h-3.5 text-orange-500" />
                                <span>Postman (.json)</span>
                            </a>
                        </div>

                        <Button
                            variant="default"
                            size="sm"
                            onClick={openCreateModal}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm h-9 px-4 rounded-lg cursor-pointer shrink-0 transition-all flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Buat API Key Baru</span>
                        </Button>
                    </div>
                </div>

                {/* 2. DEVELOPER META TOOLBAR */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                                <Globe className="w-3.5 h-3.5" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Base URL Endpoint</p>
                                <p className="font-mono text-xs font-semibold text-slate-800 truncate" title={baseUrl}>{baseUrl}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleCopy(baseUrl, 'baseUrl')}
                            className="p-1.5 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-50 transition-colors shrink-0 ml-1 cursor-pointer"
                            title="Salin Base URL"
                        >
                            {copiedBaseUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Otentikasi</p>
                            <p className="font-mono text-xs font-semibold text-slate-800">Bearer Token (Header)</p>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                            <Zap className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Rate Limiting</p>
                            <p className="font-mono text-xs font-semibold text-slate-800">60 Request / Menit</p>
                        </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                            <Radio className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Format Data</p>
                            <p className="font-mono text-xs font-semibold text-slate-800">JSON (Content-Type)</p>
                        </div>
                    </div>
                </div>

                {/* 3. FLASH NEW API KEY ALERT (High-Priority Token Banner) */}
                <AnimatePresence>
                    {flash?.new_api_key && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="p-4 bg-emerald-50/90 border border-emerald-300 rounded-xl space-y-2.5 shadow-xs"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    <span>API Key Baru Berhasil Diterbitkan — Salin dan Simpan Sekarang:</span>
                                </div>
                                <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                                    Hanya Ditampilkan 1x
                                </span>
                            </div>
                            <p className="text-xs text-emerald-800 leading-relaxed">
                                Token otentikasi ini di-hash dengan standar SHA-256 dan hanya ditampilkan saat pertama kali dibuat. Simpan di environment variable (<code className="font-mono font-bold">.env</code>) sistem Anda.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                                <div className="flex-1 font-mono text-xs font-bold bg-white px-3.5 py-2 rounded-lg border border-emerald-300 select-all truncate text-emerald-950 shadow-2xs">
                                    {flash.new_api_key}
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleCopy(flash.new_api_key, 'key')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 shrink-0 rounded-lg shadow-2xs cursor-pointer flex items-center gap-1.5"
                                >
                                    {copiedKey ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedKey ? 'Tersalin!' : 'Salin Token'}</span>
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 4. MAIN WORKSPACE GRID: 2 COLUMNS (7 cols / 5 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* LEFT COLUMN: API KEYS & WEBHOOKS (7 cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* API KEYS TABLE CARD - Clean Column Spacing Without Line Wrapping */}
                        <Card className="border-slate-200/90 shadow-xs overflow-hidden">
                            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Key className="w-4 h-4 text-emerald-600" />
                                        <span>Daftar API Key Aktif</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                        Token otentikasi Bearer dengan nomor WhatsApp & server khusus per aplikasi
                                    </CardDescription>
                                </div>
                                <span className="text-[11px] font-mono font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                                    {apiKeys.length} Kunci
                                </span>
                            </CardHeader>

                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow className="border-b border-slate-200/80">
                                            <TableHead className="text-xs font-bold text-slate-700 min-w-[140px]">
                                                Nama Aplikasi
                                            </TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 min-w-[180px]">
                                                Nomor WA & Server
                                            </TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 min-w-[130px]">
                                                Prefix Token
                                            </TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 w-24">
                                                Status
                                            </TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 w-28">
                                                Dibuat
                                            </TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 text-right w-16">
                                                Aksi
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {apiKeys.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                                                    <div className="max-w-xs mx-auto space-y-2">
                                                        <Key className="w-8 h-8 text-slate-300 mx-auto stroke-[1.5]" />
                                                        <p className="font-semibold text-slate-700">Belum Ada API Key</p>
                                                        <p className="text-[11px] text-slate-500">
                                                            Klik tombol <strong className="text-emerald-700">"Buat API Key Baru"</strong> di atas untuk menerbitkan token otentikasi pertama Anda.
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            apiKeys.map((key) => {
                                                const serverName = 'UltraSync Engine';
                                                const isConnected = key.device?.status === 'connected';

                                                return (
                                                    <TableRow key={key.id} className="hover:bg-slate-50/80 transition-colors">
                                                        {/* 1. Nama Aplikasi */}
                                                        <TableCell className="font-semibold text-slate-900 text-xs">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-md bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
                                                                    <Key className="w-3 h-3" />
                                                                </div>
                                                                <span className="font-bold text-slate-900 truncate max-w-[150px]" title={key.name}>
                                                                    {key.name}
                                                                </span>
                                                            </div>
                                                        </TableCell>

                                                        {/* 2. Nomor WA & Server (Neat Chip without multi-row text break) */}
                                                        <TableCell className="text-xs">
                                                            {key.device ? (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 whitespace-nowrap">
                                                                        <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                                                        <span className="font-mono text-xs">{key.device.phone_number || key.device.name}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                                                                            {serverName}
                                                                        </span>
                                                                        <span
                                                                            className={`inline-flex items-center gap-1 text-[10px] font-medium whitespace-nowrap ${
                                                                                isConnected ? 'text-emerald-700' : 'text-amber-700'
                                                                            }`}
                                                                        >
                                                                            <span
                                                                                className={`w-1.5 h-1.5 rounded-full ${
                                                                                    isConnected ? 'bg-emerald-500' : 'bg-amber-400'
                                                                                }`}
                                                                            />
                                                                            {isConnected ? 'Aktif' : 'Offline'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/70 whitespace-nowrap">
                                                                    <Server className="w-3 h-3 text-slate-400 shrink-0" />
                                                                    <span>Semua Server (Auto)</span>
                                                                </span>
                                                            )}
                                                        </TableCell>

                                                        {/* 3. Prefix Token */}
                                                        <TableCell className="text-xs whitespace-nowrap">
                                                            <span className="inline-flex items-center font-mono text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/80 font-medium">
                                                                {key.prefix}••••••••
                                                            </span>
                                                        </TableCell>

                                                        {/* 4. Status */}
                                                        <TableCell className="whitespace-nowrap">
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                                                                AKTIF
                                                            </span>
                                                        </TableCell>

                                                        {/* 5. Dibuat */}
                                                        <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                                                            {new Date(key.created_at).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric',
                                                            })}
                                                        </TableCell>

                                                        {/* 6. Aksi */}
                                                        <TableCell className="text-right whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteKey(key.id, key.name)}
                                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                                                                title="Hapus / Cabut API Key ini"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>

                        {/* WEBHOOK SETTINGS CARD WITH LIVE TEST PING */}
                        <Card className="border-slate-200/90 shadow-xs overflow-hidden">
                            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
                                        <WebhookIcon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-900">
                                            Konfigurasi Webhook URL
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500 mt-0.5">
                                            Menerima callback event otomatis saat ada pesan masuk, centang dua, atau status server
                                        </CardDescription>
                                    </div>
                                </div>

                                <Button
                                    type="button"
                                    onClick={handleTestWebhookPing}
                                    disabled={pingLoading || !webhookUrl}
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs font-semibold border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer flex items-center gap-1.5"
                                >
                                    <Send className="w-3 h-3 text-emerald-600" />
                                    <span>{pingLoading ? 'Menguji...' : 'Uji Coba Ping'}</span>
                                </Button>
                            </CardHeader>

                            <CardContent className="p-5 space-y-4">
                                {pingResult && (
                                    <div
                                        className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                                            pingResult.success
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                                : 'bg-rose-50 border-rose-200 text-rose-900'
                                        }`}
                                    >
                                        <div className="font-semibold flex items-center gap-1.5">
                                            {pingResult.success ? (
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                            ) : (
                                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                            )}
                                            <span>{pingResult.message}</span>
                                        </div>
                                        {pingResult.latency_ms && (
                                            <p className="text-[11px] font-mono text-slate-600 pl-5">
                                                Status: HTTP {pingResult.status_code} | Latensi Respon: {pingResult.latency_ms} ms
                                            </p>
                                        )}
                                    </div>
                                )}

                                <form onSubmit={handleSaveWebhook} className="space-y-4 text-xs">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block font-semibold text-slate-700">
                                                Callback Endpoint URL (HTTPS):
                                            </label>
                                            <span className="text-[11px] text-slate-400">Metode: POST JSON</span>
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="url"
                                                value={webhookUrl}
                                                onChange={(e) => setWebhookUrl(e.target.value)}
                                                placeholder="https://api.klienanda.com/webhook/kirimwa"
                                                className="w-full pl-3 pr-24 py-2.5 rounded-lg border border-slate-200 font-mono text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                                                required
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                    size="sm"
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-7 px-3 rounded-md shadow-2xs cursor-pointer"
                                                >
                                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Webhook Events Supported */}
                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                                        <p className="text-[11px] font-semibold text-slate-700">Event yang dikirim ke Webhook Anda:</p>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                messages.received
                                            </span>
                                            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                                messages.delivered
                                            </span>
                                            <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                device.status
                                            </span>
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: MULTI-LANGUAGE CODE PLAYGROUND & ENDPOINT CATALOG (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* CODE SNIPPET TERMINAL WITH LANGUAGE TABS */}
                        <div className="rounded-xl border border-slate-800/90 bg-slate-950 text-slate-100 shadow-md overflow-hidden">
                            {/* Window Header */}
                            <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400 ml-1.5 font-medium">
                                        POST /messages/send
                                    </span>
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleCopy(snippets[activeLangTab], 'snippet')}
                                    className="h-7 text-[11px] font-mono text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 rounded-md cursor-pointer flex items-center gap-1"
                                >
                                    {copiedSnippet ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                                            <span className="text-emerald-400 font-semibold">Tersalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Salin Kode</span>
                                        </>
                                    )}
                                </Button>
                            </div>

                            {/* Language Tab Bar */}
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/60 overflow-x-auto text-xs font-mono">
                                {[
                                    { id: 'curl', label: 'cURL' },
                                    { id: 'node', label: 'Node.js' },
                                    { id: 'php', label: 'PHP' },
                                    { id: 'python', label: 'Python' },
                                ].map((tab) => {
                                    const isActive = activeLangTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveLangTab(tab.id)}
                                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                                                isActive
                                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Code View */}
                            <div className="p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-[340px] select-all">
                                <pre className="text-slate-200">
                                    {snippets[activeLangTab]}
                                </pre>
                            </div>
                        </div>

                        {/* INTERACTIVE ENDPOINT CATALOG CARD */}
                        <Card className="border-slate-200/90 shadow-xs overflow-hidden">
                            <CardHeader className="pb-3 pt-4 px-4 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                                <div>
                                    <CardTitle className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Katalog Endpoint REST API</span>
                                    </CardTitle>
                                    <CardDescription className="text-[11px] text-slate-500">
                                        Daftar routing utama untuk integrasi aplikasi
                                    </CardDescription>
                                </div>
                                <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                    3 Routes
                                </span>
                            </CardHeader>

                            <CardContent className="p-4 space-y-2.5 text-xs">
                                {endpointsList.map((ep) => {
                                    const isCopied = copiedEndpoint === ep.path;
                                    return (
                                        <div
                                            key={ep.path}
                                            className="p-3 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex items-center justify-between gap-2"
                                        >
                                            <div className="space-y-1 overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold text-white ${ep.badgeColor}`}>
                                                        {ep.method}
                                                    </span>
                                                    <span className="font-mono text-slate-800 font-semibold text-xs truncate">
                                                        {ep.path}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">{ep.title}</p>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleCopy(ep.path, `endpoint-${ep.path}`)}
                                                className="p-1.5 rounded-md text-slate-400 hover:text-emerald-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                                                title="Salin path endpoint"
                                            >
                                                {isCopied ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                                                ) : (
                                                    <Copy className="w-3.5 h-3.5" />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 5. REAL-TIME AUDIT LOG OF API REQUESTS */}
                <Card className="border-slate-200/90 shadow-xs overflow-hidden">
                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 flex flex-row items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center shrink-0">
                                <Activity className="w-4 h-4" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold text-slate-900">
                                    Log Panggilan REST API Real-Time
                                </CardTitle>
                                <CardDescription className="text-xs text-slate-500 mt-0.5">
                                    Aktivitas request masuk via Bearer token otentikasi dari sistem luar
                                </CardDescription>
                            </div>
                        </div>
                        <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                            {apiLogs.length} Panggilan Tercatat
                        </span>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="border-b border-slate-200/80">
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[200px]">Endpoint & Method</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-28">Status HTTP</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-24">Latensi</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[120px]">IP Klien</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[240px]">Ringkasan Payload</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 text-right w-28">Waktu Request</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {apiLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-slate-400 text-xs">
                                            <div className="max-w-xs mx-auto space-y-1.5">
                                                <Activity className="w-8 h-8 text-slate-300 mx-auto stroke-[1.5]" />
                                                <p className="font-semibold text-slate-700">Belum Ada Aktivitas Panggilan API</p>
                                                <p className="text-[11px] text-slate-500">
                                                    Panggilan API yang dilakukan oleh klien Anda akan tercatat secara otomatis di sini.
                                                </p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    apiLogs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="font-mono text-xs font-semibold text-slate-800 whitespace-nowrap">
                                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 mr-2">
                                                    {log.method}
                                                </span>
                                                <span>{log.endpoint}</span>
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                                        log.status_code === 200
                                                            ? 'border border-emerald-200 bg-emerald-50 text-emerald-800'
                                                            : 'border border-rose-200 bg-rose-50 text-rose-800'
                                                    }`}
                                                >
                                                    <span
                                                        className={`w-1.5 h-1.5 rounded-full ${
                                                            log.status_code === 200 ? 'bg-emerald-600' : 'bg-rose-600'
                                                        }`}
                                                    />
                                                    {log.status_code} {log.status_code === 200 ? 'OK' : 'ERR'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-slate-600 whitespace-nowrap">
                                                {log.latency_ms} ms
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-slate-500 whitespace-nowrap">
                                                {log.ip_address}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono text-slate-600 max-w-xs truncate" title={log.payload_summary}>
                                                {log.payload_summary}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 text-right whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleTimeString('id-ID', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    second: '2-digit',
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* CREATE API KEY MODAL WITH MANDATORY DEVICE & SERVER SELECTION */}
            <ModalPortal isOpen={isCreateKeyModalOpen} onClose={() => setIsCreateKeyModalOpen(false)}>
                <AnimatePresence>
                    {isCreateKeyModalOpen && (
                        <div
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                            onClick={() => setIsCreateKeyModalOpen(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.94, y: 16 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto text-left"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Terbitkan API Key Baru</h3>
                                        <p className="text-xs text-slate-500">Kunci otentikasi spesifik ke nomor WhatsApp & server pengirim</p>
                                    </div>
                                    <button
                                        onClick={() => setIsCreateKeyModalOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-200/60 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateKey} className="p-5 space-y-4 text-xs">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1.5">
                                            Nama Aplikasi / Keterangan Key <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={keyName}
                                            onChange={(e) => setKeyName(e.target.value)}
                                            placeholder="Contoh: Production ERP Backend, Bot Kampus, Notifikasi Toko"
                                            className="w-full px-3 py-2 rounded-md border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block font-medium text-slate-700">
                                                Pilih Nomor WhatsApp & Server Pengirim <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-[11px] text-slate-400 font-normal">Wajib dipilih</span>
                                        </div>

                                        {devices.length === 0 ? (
                                            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 space-y-2 text-xs">
                                                <div className="flex items-center gap-1.5 font-bold text-amber-950">
                                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                                    <span>Belum Ada Perangkat WhatsApp</span>
                                                </div>
                                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                                    Workspace Anda belum menautkan nomor WhatsApp. Silakan tautkan nomor terlebih dahulu agar API Key memiliki server pengirim yang spesifik.
                                                </p>
                                                <Link
                                                    href="/devices"
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 underline hover:text-emerald-900"
                                                >
                                                    <span>Buka Manajemen Gateway WhatsApp &rarr;</span>
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                                {devices.map((device) => {
                                                    const isSelected = String(selectedDeviceId) === String(device.id);
                                                    const isConnected = device.status === 'connected';
                                                    const serverLabel = 'UltraSync Engine';

                                                    return (
                                                        <label
                                                            key={device.id}
                                                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                                                isSelected
                                                                    ? 'border-emerald-500 bg-emerald-50/70 shadow-2xs ring-1 ring-emerald-500'
                                                                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/60'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <input
                                                                    type="radio"
                                                                    name="selectedDevice"
                                                                    value={device.id}
                                                                    checked={isSelected}
                                                                    onChange={() => setSelectedDeviceId(device.id)}
                                                                    className="text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                                                                />
                                                                <div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-slate-900 text-xs">
                                                                            {device.phone_number || device.name}
                                                                        </span>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className={`text-[9px] px-1.5 py-0 font-medium ${
                                                                                isConnected
                                                                                    ? 'border-emerald-300 bg-emerald-100/80 text-emerald-800'
                                                                                    : 'border-amber-300 bg-amber-100/80 text-amber-800'
                                                                            }`}
                                                                        >
                                                                            {isConnected ? 'Terhubung' : 'Offline'}
                                                                        </Badge>
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                                        <span>{device.name}</span>
                                                                        <span>•</span>
                                                                        <span className="font-mono font-medium text-emerald-700">{serverLabel}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                                                    <Check className="w-3 h-3 stroke-[3]" />
                                                                </div>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Keamanan & Spesifikasi Routing:</span>
                                        </div>
                                        <p className="leading-relaxed">
                                            API Key ini akan terkunci secara spesifik ke nomor WhatsApp & server pengirim yang Anda pilih di atas. Setiap pengiriman pesan via REST API dengan token ini akan dialihkan langsung melalui nomor tersebut.
                                        </p>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setIsCreateKeyModalOpen(false)}
                                            className="rounded-md h-9 text-xs font-medium cursor-pointer"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="default"
                                            size="sm"
                                            disabled={processing || devices.length === 0 || !selectedDeviceId}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md h-9 text-xs font-medium shadow-2xs cursor-pointer"
                                        >
                                            {processing ? 'Membuat...' : 'Terbitkan Key Spesifik'}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </ModalPortal>
        </AppLayout>
    );
}
