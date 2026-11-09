import React, { useState, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import {
    Send,
    Sparkles,
    Shield,
    Users,
    Sliders,
    CheckCircle2,
    RefreshCw,
    Clock,
    Smartphone,
    Activity,
    Calendar,
    Paperclip,
    Pause,
    Play,
    Tag,
    Download,
    AlertCircle,
    Plus,
    Image as ImageIcon,
    FileText,
    UploadCloud,
    X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import { Separator } from '../../Components/ui/separator';
import { Progress } from '../../Components/ui/progress';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '../../Components/ui/table';
import CountUp from '../../Components/ui/CountUp';
import { TableRowSkeleton } from '../../Components/ui/skeleton';

export default function BroadcastIndex({ workspace, devices, campaigns, groups = [], subscription }) {
    const [name, setName] = useState('Campaign Pengumuman Akademik Semester Baru');
    const [deviceId, setDeviceId] = useState(devices && devices[0] ? devices[0].id : '');
    const [targetType, setTargetType] = useState('manual'); // 'manual' | 'group'
    const [groupId, setGroupId] = useState(groups && groups[0] ? groups[0].id : '');
    const [message, setMessage] = useState(
        '{Halo|Hai|Selamat siang} Kak {{nama}},\n\nKami menginfokan jadwal registrasi dan pengumuman akademik terbaru!\nInformasi lengkap silakan akses portal kampus.\n\nLayanan resmi Politeknik Mardira Indonesia.'
    );
    const [recipientsRaw, setRecipientsRaw] = useState(
        '+6281234567890\n+6281987654321\n+6285223491823'
    );
    const [mediaSource, setMediaSource] = useState('upload'); // 'upload' | 'url'
    const [mediaFile, setMediaFile] = useState(null);
    const [mediaPreview, setMediaPreview] = useState(null);
    const [mediaType, setMediaType] = useState(null); // 'image' | 'document' | null
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const [mediaUrl, setMediaUrl] = useState('');
    const [minDelay, setMinDelay] = useState(8);
    const [maxDelay, setMaxDelay] = useState(18);
    const [scheduleOption, setScheduleOption] = useState('now'); // 'now' | 'scheduled'
    const [scheduledAt, setScheduledAt] = useState('');
    const [previewText, setPreviewText] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleFileSelect = (file) => {
        if (!file) return;
        setMediaFile(file);
        const isImg = file.type.startsWith('image/');
        setMediaType(isImg ? 'image' : 'document');
        if (isImg) {
            const url = URL.createObjectURL(file);
            setMediaPreview(url);
        } else {
            setMediaPreview(null);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const removeMediaFile = () => {
        setMediaFile(null);
        setMediaPreview(null);
        setMediaType(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const generatePreview = () => {
        const resolved = message
            .replace(/\{([^{}]+)\}/g, (_, group) => {
                const choices = group.split('|');
                return choices[Math.floor(Math.random() * choices.length)];
            })
            .replace(/\{\{nama\}\}/g, 'Budi Santoso');
        setPreviewText(resolved);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            name,
            device_id: deviceId,
            message,
            target_type: targetType,
            group_id: targetType === 'group' ? groupId : null,
            recipients_raw: targetType === 'manual' ? recipientsRaw : null,
            media_url: mediaSource === 'url' ? (mediaUrl || null) : null,
            media_file: mediaSource === 'upload' ? mediaFile : null,
            min_delay: parseInt(minDelay),
            max_delay: parseInt(maxDelay),
            schedule_option: scheduleOption,
            scheduled_at: scheduleOption === 'scheduled' ? scheduledAt : null,
        };

        router.post('/broadcast', payload, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                removeMediaFile();
                setMediaUrl('');
            },
            onFinish: () => setProcessing(false),
        });
    };

    const handleTogglePause = (campaignId) => {
        router.post(`/broadcast/${campaignId}/toggle-pause`, {}, { preserveScroll: true });
    };

    return (
        <AppLayout title="Broadcast Massal">
            <Head title="Broadcast Massal & Anti-Ban — MARDIRA WA" />

            <div className="space-y-6 animate-fade-in-up">
                {/* 1. TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                                Broadcast Massal & Anti-Ban Engine
                            </h1>
                            <Badge variant="outline" className="text-[9.5px] sm:text-[10px] px-2 py-0.5 font-semibold border-blue-200 bg-blue-50 text-[#1e50ff]">
                                Anti-Ban Multi-Gateway
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Kirim pesan broadcast ribuan nomor dengan proteksi spintax dinamis, segmentasi buku kontak, dan penjadwalan masa depan.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-slate-200 bg-white text-[10.5px] sm:text-xs font-medium text-slate-700 shadow-2xs flex items-center gap-1.5">
                            <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1e50ff]" />
                            <span>Anti-Ban Throttle Aktif</span>
                        </div>
                        {subscription && (
                            <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-blue-200 bg-blue-50 text-[10.5px] sm:text-xs font-semibold text-blue-900 shadow-2xs flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1e50ff]" />
                                <span>Sisa Kuota: <strong className="font-mono text-blue-950"><CountUp to={subscription.remaining_message_quota} /></strong> Pesan</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. BROADCAST CREATOR CARD */}
                {(!devices || devices.length === 0) && (
                    <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-amber-900">Belum ada gateway WhatsApp yang aktif</p>
                                <p className="text-amber-700 text-[11px] mt-0.5">Tautkan nomor WhatsApp Anda di menu Perangkat terlebih dahulu untuk dapat mengirim campaign broadcast.</p>
                            </div>
                        </div>
                        <Link
                            href="/devices"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-xs transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Tautkan Perangkat Sekarang</span>
                        </Link>
                    </div>
                )}

                <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="pb-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold text-slate-900">
                            Konfigurasi Kampanye Broadcast Baru
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                            Atur segmentasi target audiens, waktu pengiriman, pesan spintax, dan lampiran media
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Form Settings */}
                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-medium text-slate-700 mb-1.5">Nama Kampanye</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="font-medium text-slate-700">Pilih Gateway WhatsApp</label>
                                            <Link href="/devices" className="text-[11px] text-emerald-700 font-semibold hover:underline">
                                                + Kelola Perangkat
                                            </Link>
                                        </div>
                                        <select
                                            value={deviceId}
                                            onChange={(e) => setDeviceId(e.target.value)}
                                            className="w-full h-9 px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                                            required
                                        >
                                            {devices.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} {d.phone_number ? `(${d.phone_number})` : ''} — {d.status === 'connected' ? '🟢 Terhubung' : '⚠️ Belum Scan / Terputus'}
                                                </option>
                                            ))}
                                        </select>

                                        {(() => {
                                            const sel = (devices || []).find((d) => String(d.id) === String(deviceId));
                                            if (sel && sel.status !== 'connected') {
                                                return (
                                                    <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-900 text-[11px] leading-tight animate-fade-in">
                                                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="font-bold">Perangkat ini belum terhubung ke WhatsApp.</span>
                                                            <p className="mt-0.5 text-slate-600">
                                                                Silakan buka menu{' '}
                                                                <Link href="/devices" className="font-semibold text-emerald-700 underline hover:text-emerald-900">
                                                                    Perangkat WhatsApp
                                                                </Link>{' '}
                                                                lalu scan QR code dari HP Anda agar pesan benar-benar terkirim.
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1.5">Target Audiens</label>
                                        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-md h-9 items-center">
                                            <button
                                                type="button"
                                                onClick={() => setTargetType('manual')}
                                                className={`h-7 text-xs font-medium rounded transition-all ${
                                                    targetType === 'manual' ? 'bg-white text-emerald-800 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                Manual
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTargetType('group')}
                                                className={`h-7 text-xs font-medium rounded transition-all ${
                                                    targetType === 'group' ? 'bg-white text-emerald-800 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                Grup CRM
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {targetType === 'group' ? (
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1.5">Pilih Grup Kontak:</label>
                                        <select
                                            value={groupId}
                                            onChange={(e) => setGroupId(e.target.value)}
                                            className="w-full h-9 px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                                        >
                                            {groups.length === 0 ? (
                                                <option value="">Belum ada grup kontak (buat di menu Buku Kontak)</option>
                                            ) : (
                                                groups.map((g) => (
                                                    <option key={g.id} value={g.id}>
                                                        {g.name} ({g.contacts_count} Kontak Tersimpan)
                                                    </option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="font-medium text-slate-700">Daftar Nomor Penerima</label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setRecipientsRaw('+6281234567890\n+6281987654321\n+6285223491823')}
                                                    className="text-[11px] text-emerald-700 font-semibold hover:underline"
                                                >
                                                    + Gunakan Nomor Demo
                                                </button>
                                                <span className="text-[11px] text-slate-400">| Baris baru</span>
                                            </div>
                                        </div>
                                        <textarea
                                            rows="3"
                                            value={recipientsRaw}
                                            onChange={(e) => setRecipientsRaw(e.target.value)}
                                            placeholder="+6281234567890&#10;+6281987654321"
                                            className="w-full p-2.5 rounded-md border border-slate-200 font-mono text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Media Attachment (Direct Upload Foto / PDF vs Link URL) */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="font-medium text-slate-700 flex items-center gap-1.5">
                                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Lampiran Media / Dokumen (Opsional)</span>
                                        </label>
                                        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                                            <button
                                                type="button"
                                                onClick={() => setMediaSource('upload')}
                                                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                                                    mediaSource === 'upload'
                                                        ? 'bg-white text-emerald-700 font-semibold shadow-2xs'
                                                        : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                            >
                                                📁 Upload File
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMediaSource('url')}
                                                className={`px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer ${
                                                    mediaSource === 'url'
                                                        ? 'bg-white text-emerald-700 font-semibold shadow-2xs'
                                                        : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                            >
                                                🔗 Link URL
                                            </button>
                                        </div>
                                    </div>

                                    {mediaSource === 'upload' ? (
                                        <div>
                                            {!mediaFile ? (
                                                <div
                                                    onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                                                    onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                                                    onDrop={handleFileDrop}
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                                                        dragActive
                                                            ? 'border-emerald-500 bg-emerald-50/60'
                                                            : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/60 bg-white'
                                                    }`}
                                                >
                                                    <input
                                                        ref={fileInputRef}
                                                        type="file"
                                                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx"
                                                        onChange={handleFileChange}
                                                        className="hidden"
                                                    />
                                                    <div className="flex justify-center items-center gap-2 mb-1.5">
                                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                                            <ImageIcon className="w-4 h-4" />
                                                        </div>
                                                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                    </div>
                                                    <p className="text-xs font-semibold text-slate-700">
                                                        Pilih atau seret file <span className="text-blue-600">Foto (JPG/PNG)</span> atau <span className="text-rose-600">Dokumen PDF</span>
                                                    </p>
                                                    <p className="text-[10.5px] text-slate-400 mt-0.5">
                                                        Maksimal 25 MB • Otomatis dikirim bersama teks pesan
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {mediaType === 'image' && mediaPreview ? (
                                                            <img
                                                                src={mediaPreview}
                                                                alt="Preview"
                                                                className="w-12 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-lg bg-rose-100 text-rose-700 flex flex-col items-center justify-center shrink-0 border border-rose-200 font-bold text-[9px]">
                                                                <FileText className="w-5 h-5 mb-0.5 text-rose-600" />
                                                                <span>PDF</span>
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-800 text-xs truncate">{mediaFile.name}</p>
                                                            <p className="text-[10px] text-slate-400 font-mono">
                                                                {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB • {mediaType === 'image' ? 'Foto / Gambar' : 'Dokumen PDF'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={removeMediaFile}
                                                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                                                        title="Hapus lampiran"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div>
                                            <input
                                                type="url"
                                                value={mediaUrl}
                                                onChange={(e) => setMediaUrl(e.target.value)}
                                                placeholder="https://storage.kampus.ac.id/promo-brosur.pdf"
                                                className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Tautan publik direct link file gambar (JPG/PNG) atau PDF.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Scheduling Option */}
                                <div>
                                    <label className="block font-medium text-slate-700 mb-1.5">Waktu Pelaksanaan Broadcast</label>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => setScheduleOption('now')}
                                            className={`h-9 rounded-md border text-xs font-medium text-center transition-all ${
                                                scheduleOption === 'now'
                                                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-semibold shadow-2xs'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            ⚡ Kirim Sekarang
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setScheduleOption('scheduled')}
                                            className={`h-9 rounded-md border text-xs font-medium text-center transition-all ${
                                                scheduleOption === 'scheduled'
                                                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-900 font-semibold shadow-2xs'
                                                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            📅 Jadwalkan Nanti
                                        </button>
                                    </div>

                                    {scheduleOption === 'scheduled' && (
                                        <div>
                                            <input
                                                type="datetime-local"
                                                value={scheduledAt}
                                                onChange={(e) => setScheduledAt(e.target.value)}
                                                className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                                required
                                            />
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Sistem antrean akan otomatis memproses pengiriman pada waktu yang ditentukan.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Anti-Ban Jitter Slider */}
                                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-medium text-slate-700">Jeda Waktu Acak Antar Pesan</span>
                                        <span className="font-mono font-bold text-emerald-700">{minDelay}s - {maxDelay}s</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-[10px] text-slate-500">Min Delay: {minDelay} detik</span>
                                            <input
                                                type="range"
                                                min="3"
                                                max="30"
                                                value={minDelay}
                                                onChange={(e) => setMinDelay(e.target.value)}
                                                className="w-full accent-emerald-600"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-500">Max Delay: {maxDelay} detik</span>
                                            <input
                                                type="range"
                                                min="10"
                                                max="60"
                                                value={maxDelay}
                                                onChange={(e) => setMaxDelay(e.target.value)}
                                                className="w-full accent-emerald-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Message & Spintax Simulator */}
                            <div className="space-y-4 text-xs flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="font-medium text-slate-700">Template Pesan (Mendukung Spintax)</label>
                                        <span className="text-[11px] text-slate-400">Gunakan {'{opsi1|opsi2}'}</span>
                                    </div>
                                    <textarea
                                        rows="6"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full p-3 rounded-md border border-slate-200 font-sans text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 leading-relaxed"
                                        required
                                    />

                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={generatePreview}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                                        >
                                            <RefreshCw className="w-3.5 h-3.5" />
                                            <span>Simulasikan Variasi Spintax</span>
                                        </button>
                                        <span className="text-[10px] text-slate-400 font-mono">Placeholder: {'{{nama}}'}, {'{{nomor}}'}</span>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {previewText && (
                                            <motion.div
                                                key={previewText}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                transition={{ duration: 0.15 }}
                                                className="p-3 bg-emerald-50/70 rounded-md border border-emerald-200 text-xs text-slate-800 leading-relaxed font-mono"
                                            >
                                                <strong className="block text-[10px] uppercase font-bold text-emerald-800 mb-1">
                                                    Hasil Acak Penerima:
                                                </strong>
                                                {previewText}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Live WhatsApp Bubble Preview */}
                                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2 mt-2">
                                        <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                                            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                                                <Smartphone className="w-3.5 h-3.5" />
                                                <span>Pratinjau Layar Penerima (WhatsApp)</span>
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-400">
                                                Target: {targetType === 'group' ? (groups.find(g => String(g.id) === String(groupId))?.contacts_count || 0) : (recipientsRaw ? recipientsRaw.split(/[\r\n,]+/).filter(Boolean).length : 0)} Kontak
                                            </span>
                                        </div>

                                        <div className="bg-[#efeae2] p-2.5 rounded-lg text-slate-900 shadow-inner">
                                            <div className="max-w-[280px] bg-white rounded-lg p-2 shadow-xs text-xs space-y-1.5">
                                                {/* Media attachment inside bubble */}
                                                {mediaSource === 'upload' && mediaFile && (
                                                    <div>
                                                        {mediaType === 'image' && mediaPreview ? (
                                                            <img
                                                                src={mediaPreview}
                                                                alt="Preview"
                                                                className="w-full h-32 object-cover rounded-md border border-slate-200"
                                                            />
                                                        ) : (
                                                            <div className="p-2 bg-slate-100 rounded-md border border-slate-200 flex items-center gap-2">
                                                                <FileText className="w-6 h-6 text-rose-600 shrink-0" />
                                                                <div className="overflow-hidden">
                                                                    <p className="font-semibold text-[11px] text-slate-800 truncate">{mediaFile.name}</p>
                                                                    <p className="text-[9.5px] text-slate-400 font-mono">{(mediaFile.size / 1024).toFixed(0)} KB • Dokumen PDF</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {mediaSource === 'url' && mediaUrl && (
                                                    <div className="p-1.5 bg-slate-100 rounded text-[10px] text-slate-600 font-mono break-all flex items-center gap-1">
                                                        <Paperclip className="w-3 h-3 text-blue-600 shrink-0" />
                                                        <span className="truncate">{mediaUrl}</span>
                                                    </div>
                                                )}

                                                {/* Caption text */}
                                                <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-slate-800">
                                                    {previewText || message.replace(/\{([^{}]+)\}/g, (_, group) => group.split('|')[0]).replace(/\{\{nama\}\}/g, 'Budi Santoso')}
                                                </p>
                                                <div className="text-right text-[9px] text-slate-400 flex items-center justify-end gap-1">
                                                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="text-blue-500 font-bold">✓✓</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.div whileTap={{ scale: 0.98 }}>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-10 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                                    >
                                        <span>{processing ? 'Memproses Kampanye...' : scheduleOption === 'scheduled' ? 'Jadwalkan Kampanye Broadcast 📅' : 'Mulai Pengiriman Broadcast Massal'}</span>
                                        <Send className="w-3.5 h-3.5 ml-2 text-white" />
                                    </Button>
                                </motion.div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* 3. CAMPAIGNS HISTORY TABLE */}
                <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-900">Riwayat Kampanye Broadcast</CardTitle>
                            <CardDescription className="text-xs text-slate-500">Daftar riwayat dan status pengiriman pesan massal</CardDescription>
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto touch-pan-x no-scrollbar">
                        <Table className="min-w-[640px]">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Nama Kampanye</TableHead>
                                    <TableHead className="text-xs">Gateway Device</TableHead>
                                    <TableHead className="text-xs">Total Penerima</TableHead>
                                    <TableHead className="text-xs">Jeda Throttle</TableHead>
                                    <TableHead className="text-xs">Waktu Pelaksanaan</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs text-right">Kontrol</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processing && (
                                    <>
                                        <TableRowSkeleton columns={7} />
                                        <TableRowSkeleton columns={7} />
                                    </>
                                )}
                                {campaigns.length === 0 && !processing ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                                            Belum ada kampanye broadcast yang dijalankan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    campaigns.map((c) => (
                                        <TableRow key={c.id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="font-bold text-[#0f172a] text-xs">
                                                {c.name}
                                                {c.media_url && (
                                                    <a
                                                        href={c.media_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:text-emerald-900 hover:underline font-mono mt-0.5"
                                                    >
                                                        {c.media_url.match(/\.pdf$/i) ? (
                                                            <>
                                                                <FileText className="w-3 h-3 text-rose-600" />
                                                                <span>Dokumen PDF</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ImageIcon className="w-3 h-3 text-blue-600" />
                                                                <span>Foto / Media</span>
                                                            </>
                                                        )}
                                                    </a>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-700">
                                                {c.device ? c.device.name : 'Default'}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono">
                                                <strong>{c.sent_count}</strong> / {c.total_recipients}
                                                {c.failed_count > 0 && (
                                                    <span className="block text-[10px] text-rose-600 font-semibold font-sans">
                                                        ({c.failed_count} gagal)
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500 font-mono">
                                                {c.min_delay_seconds}s - {c.max_delay_seconds}s
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        c.status === 'completed'
                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold'
                                                            : c.status === 'scheduled'
                                                            ? 'border-blue-200 bg-blue-50 text-blue-800 font-semibold'
                                                            : c.status === 'paused'
                                                            ? 'border-amber-200 bg-amber-50 text-amber-800 font-semibold'
                                                            : c.status === 'failed'
                                                            ? 'border-rose-200 bg-rose-50 text-rose-800 font-semibold'
                                                            : c.status === 'partially_delivered'
                                                            ? 'border-amber-200 bg-amber-50 text-amber-800 font-semibold'
                                                            : 'border-slate-200 bg-slate-100 text-slate-700 font-semibold'
                                                    }
                                                >
                                                    {c.status === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />}
                                                    {c.status === 'scheduled' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5" />}
                                                    {c.status === 'paused' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />}
                                                    {c.status === 'failed' && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 mr-1.5" />}
                                                    {c.status === 'partially_delivered' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />}
                                                    {c.status === 'failed' ? 'GAGAL' : c.status === 'partially_delivered' ? 'SEBAGIAN' : c.status.toUpperCase()}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <a
                                                        href={`/broadcast/${c.id}/export`}
                                                        download
                                                        title="Unduh Rekap Laporan Pengiriman (CSV)"
                                                        className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-medium rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
                                                    >
                                                        <Download className="w-3 h-3 text-emerald-600" />
                                                        <span>Ekspor</span>
                                                    </a>
                                                    {(c.status === 'scheduled' || c.status === 'paused') && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleTogglePause(c.id)}
                                                            className="h-7 px-2 text-[10px] font-medium rounded-md"
                                                        >
                                                            {c.status === 'scheduled' ? (
                                                                 <>
                                                                    <Pause className="w-3 h-3 mr-1 text-amber-600" />
                                                                    <span>Jeda</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Play className="w-3 h-3 mr-1 text-emerald-700" />
                                                                    <span>Lanjut</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
        </AppLayout>
    );
}
