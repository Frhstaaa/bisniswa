import React, { useState, useRef } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import {
    Send,
    Shield,
    RefreshCw,
    Smartphone,
    Paperclip,
    Pause,
    Play,
    Download,
    AlertCircle,
    Plus,
    Image as ImageIcon,
    FileText,
    X,
    ChevronRight,
} from 'lucide-react';
import { Button } from '../../Components/ui/button';
import CountUp from '../../Components/ui/CountUp';
import { TableRowSkeleton } from '../../Components/ui/skeleton';

export default function BroadcastIndex({ workspace, devices, campaigns, groups = [], subscription }) {
    const [name, setName] = useState('Campaign Pengumuman Akademik Semester Baru');
    const [deviceId, setDeviceId] = useState(devices && devices[0] ? devices[0].id : '');
    const [targetType, setTargetType] = useState('manual'); // 'manual' | 'group'
    const [groupId, setGroupId] = useState(groups && groups[0] ? groups[0].id : '');
    const [message, setMessage] = useState(
        '{Halo|Hai|Selamat siang} Kak {{nama}},\n\nKami menginfokan jadwal registrasi dan pengumuman akademik terbaru!\nInformasi lengkap silakan akses portal.\n\nLayanan resmi SAPA BisnisWA.'
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
            <Head title="Broadcast Massal & Anti-Ban — SAPA BisnisWA" />

            <div className="space-y-6 pb-12 font-sans antialiased text-[#1f1f1f]">
                {/* ================= 1. MANTIS BREADCRUMB & HEADER ================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e6ebf1]">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8c8c8c] mb-1 font-medium">
                            <Link href="/dashboard" className="hover:text-[#1677ff] transition-colors">
                                Dashboard
                            </Link>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#262626]">Workspace</span>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#1677ff] font-semibold">Broadcast Massal</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#262626] tracking-tight">
                            Broadcast Massal &amp; Anti-Ban Engine
                        </h1>
                        <p className="text-xs text-[#8c8c8c] mt-1">
                            Kirim pesan broadcast ribuan nomor dengan proteksi spintax dinamis, segmentasi buku kontak, dan penjadwalan masa depan.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {subscription && (
                            <div className="px-3 py-1.5 rounded-lg border border-[#e6ebf1] bg-white text-xs font-medium text-[#595959] flex items-center gap-2">
                                <span className="size-1.5 rounded-full bg-[#1677ff]" />
                                <span>Sisa Kuota: <strong className="font-mono text-[#262626]"><CountUp to={subscription.remaining_message_quota} /></strong> Pesan</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ================= 2. WARNING IF NO DEVICES ================= */}
                {(!devices || devices.length === 0) && (
                    <div className="p-4 rounded-xl bg-[#fffbe6] border border-[#ffe58f] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#262626]">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="size-5 text-[#faad14] shrink-0 mt-0.5" />
                            <div>
                                <p className="font-bold text-[#262626]">Belum ada gateway WhatsApp yang aktif</p>
                                <p className="text-[#595959] text-[11px] mt-0.5">Tautkan nomor WhatsApp Anda di menu Perangkat terlebih dahulu untuk dapat mengirim campaign broadcast.</p>
                            </div>
                        </div>
                        <Link
                            href="/devices"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#1677ff] hover:bg-[#0958d9] text-white rounded-lg text-xs font-semibold shrink-0 shadow-[0_2px_0_rgba(0,0,0,0.043)] transition-colors"
                        >
                            <Plus className="size-3.5" />
                            <span>Tautkan Perangkat Sekarang</span>
                        </Link>
                    </div>
                )}

                {/* ================= 3. BROADCAST CREATOR CARD ================= */}
                <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="p-5 pb-4 border-b border-[#f0f0f0]">
                        <h3 className="text-sm font-bold text-[#262626]">
                            Konfigurasi Kampanye Broadcast Baru
                        </h3>
                        <p className="text-xs text-[#8c8c8c] mt-0.5">
                            Atur segmentasi target audiens, waktu pengiriman, pesan spintax, dan lampiran media
                        </p>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Form Settings */}
                            <div className="space-y-4 text-xs">
                                <div>
                                    <label className="block font-semibold text-[#595959] mb-1.5">Nama Kampanye</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="font-semibold text-[#595959]">Pilih Gateway WhatsApp</label>
                                            <Link href="/devices" className="text-[11px] text-[#1677ff] font-semibold hover:underline">
                                                + Kelola Perangkat
                                            </Link>
                                        </div>
                                        <select
                                            value={deviceId}
                                            onChange={(e) => setDeviceId(e.target.value)}
                                            className="w-full h-9 px-3 py-1.5 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:outline-none bg-white"
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
                                                    <div className="mt-2 p-2.5 bg-[#fffbe6] border border-[#ffe58f] rounded-lg flex items-start gap-2 text-[#262626] text-[11px] leading-tight animate-fade-in">
                                                        <AlertCircle className="size-3.5 text-[#faad14] shrink-0 mt-0.5" />
                                                        <div>
                                                            <span className="font-bold">Perangkat ini belum terhubung ke WhatsApp.</span>
                                                            <p className="mt-0.5 text-[#595959]">
                                                                Silakan buka menu{' '}
                                                                <Link href="/devices" className="font-semibold text-[#1677ff] underline hover:text-[#0958d9]">
                                                                    Perangkat WhatsApp
                                                                </Link>{' '}
                                                                lalu scan QR code dari HP Anda.
                                                            </p>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Target Audiens</label>
                                        <div className="grid grid-cols-2 gap-1 bg-[#f5f5f5] p-0.5 rounded-lg border border-[#e8e8e8] h-9 items-center">
                                            <button
                                                type="button"
                                                onClick={() => setTargetType('manual')}
                                                className={`h-7 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                                    targetType === 'manual' ? 'bg-white text-[#1677ff] shadow-xs' : 'text-[#595959] hover:text-[#262626]'
                                                }`}
                                            >
                                                Manual
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setTargetType('group')}
                                                className={`h-7 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                                    targetType === 'group' ? 'bg-white text-[#1677ff] shadow-xs' : 'text-[#595959] hover:text-[#262626]'
                                                }`}
                                            >
                                                Grup CRM
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {targetType === 'group' ? (
                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Pilih Grup Kontak:</label>
                                        <select
                                            value={groupId}
                                            onChange={(e) => setGroupId(e.target.value)}
                                            className="w-full h-9 px-3 py-1.5 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:outline-none bg-white"
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
                                            <label className="font-semibold text-[#595959]">Daftar Nomor Penerima</label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setRecipientsRaw('+6281234567890\n+6281987654321\n+6285223491823')}
                                                    className="text-[11px] text-[#1677ff] font-semibold hover:underline cursor-pointer"
                                                >
                                                    + Gunakan Nomor Demo
                                                </button>
                                                <span className="text-[11px] text-[#8c8c8c]">| Baris baru</span>
                                            </div>
                                        </div>
                                        <textarea
                                            rows="3"
                                            value={recipientsRaw}
                                            onChange={(e) => setRecipientsRaw(e.target.value)}
                                            placeholder="+6281234567890&#10;+6281987654321"
                                            className="w-full p-2.5 rounded-lg border border-[#d9d9d9] font-mono text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none"
                                            required
                                        />
                                    </div>
                                )}

                                {/* Media Attachment */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="font-semibold text-[#595959] flex items-center gap-1.5">
                                            <Paperclip className="size-3.5 text-[#8c8c8c]" />
                                            <span>Lampiran Media / Dokumen (Opsional)</span>
                                        </label>
                                        <div className="flex items-center bg-[#f5f5f5] p-0.5 rounded-lg border border-[#e8e8e8] text-[11px]">
                                            <button
                                                type="button"
                                                onClick={() => setMediaSource('upload')}
                                                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                                    mediaSource === 'upload'
                                                        ? 'bg-white text-[#1677ff] shadow-xs'
                                                        : 'text-[#8c8c8c] hover:text-[#262626]'
                                                }`}
                                            >
                                                📁 Upload File
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setMediaSource('url')}
                                                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                                                    mediaSource === 'url'
                                                        ? 'bg-white text-[#1677ff] shadow-xs'
                                                        : 'text-[#8c8c8c] hover:text-[#262626]'
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
                                                            ? 'border-[#1677ff] bg-[#e6f4ff]/50'
                                                            : 'border-[#d9d9d9] hover:border-[#1677ff] hover:bg-[#fafafb] bg-white'
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
                                                        <div className="size-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center">
                                                            <ImageIcon className="size-4" />
                                                        </div>
                                                        <div className="size-8 rounded-lg bg-[#fff1f0] text-[#ff4d4f] flex items-center justify-center">
                                                            <FileText className="size-4" />
                                                        </div>
                                                    </div>
                                                    <p className="text-xs font-semibold text-[#262626]">
                                                        Pilih atau seret file <span className="text-[#1677ff]">Foto (JPG/PNG)</span> atau <span className="text-[#ff4d4f]">Dokumen PDF</span>
                                                    </p>
                                                    <p className="text-[10.5px] text-[#8c8c8c] mt-0.5">
                                                        Maksimal 25 MB • Otomatis dikirim bersama teks pesan
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="p-3 bg-[#fafafb] rounded-lg border border-[#e6ebf1] flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        {mediaType === 'image' && mediaPreview ? (
                                                            <img
                                                                src={mediaPreview}
                                                                alt="Preview"
                                                                className="size-12 object-cover rounded-lg border border-[#e6ebf1] shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="size-12 rounded-lg bg-[#fff1f0] text-[#ff4d4f] flex flex-col items-center justify-center shrink-0 border border-[#ffccc7] font-bold text-[9px]">
                                                                <FileText className="size-5 mb-0.5" />
                                                                <span>PDF</span>
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-[#262626] text-xs truncate">{mediaFile.name}</p>
                                                            <p className="text-[10px] text-[#8c8c8c] font-mono">
                                                                {(mediaFile.size / (1024 * 1024)).toFixed(2)} MB • {mediaType === 'image' ? 'Foto / Gambar' : 'Dokumen PDF'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={removeMediaFile}
                                                        className="text-[#8c8c8c] hover:text-[#ff4d4f] p-1.5 rounded-lg hover:bg-[#fff1f0] transition-colors cursor-pointer"
                                                        title="Hapus lampiran"
                                                    >
                                                        <X className="size-4" />
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
                                                placeholder="https://storage.sapa.id/promo-brosur.pdf"
                                                className="w-full px-3 py-2 rounded-lg border border-[#d9d9d9] text-xs font-mono text-[#262626] focus:border-[#1677ff] focus:outline-none"
                                            />
                                            <p className="text-[10px] text-[#8c8c8c] mt-1">
                                                Tautan publik direct link file gambar (JPG/PNG) atau PDF.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Scheduling Option */}
                                <div>
                                    <label className="block font-semibold text-[#595959] mb-1.5">Waktu Pelaksanaan Broadcast</label>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <button
                                            type="button"
                                            onClick={() => setScheduleOption('now')}
                                            className={`h-9 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                                                scheduleOption === 'now'
                                                    ? 'border-[#1677ff] bg-[#e6f4ff] text-[#1677ff] shadow-2xs'
                                                    : 'border-[#d9d9d9] text-[#595959] hover:bg-[#fafafb]'
                                            }`}
                                        >
                                            ⚡ Kirim Sekarang
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setScheduleOption('scheduled')}
                                            className={`h-9 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                                                scheduleOption === 'scheduled'
                                                    ? 'border-[#1677ff] bg-[#e6f4ff] text-[#1677ff] shadow-2xs'
                                                    : 'border-[#d9d9d9] text-[#595959] hover:bg-[#fafafb]'
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
                                                className="w-full px-3 py-2 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:outline-none"
                                                required
                                            />
                                            <p className="text-[10px] text-[#8c8c8c] mt-1">
                                                Sistem antrean akan otomatis memproses pengiriman pada waktu yang ditentukan.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Anti-Ban Jitter Slider */}
                                <div className="p-3.5 bg-[#fafafb] rounded-lg border border-[#e6ebf1] space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-[#595959]">Jeda Waktu Acak Antar Pesan</span>
                                        <span className="font-mono font-bold text-[#1677ff]">{minDelay}s - {maxDelay}s</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-[10px] text-[#8c8c8c]">Min Delay: {minDelay} detik</span>
                                            <input
                                                type="range"
                                                min="3"
                                                max="30"
                                                value={minDelay}
                                                onChange={(e) => setMinDelay(e.target.value)}
                                                className="w-full accent-[#1677ff]"
                                            />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-[#8c8c8c]">Max Delay: {maxDelay} detik</span>
                                            <input
                                                type="range"
                                                min="10"
                                                max="60"
                                                value={maxDelay}
                                                onChange={(e) => setMaxDelay(e.target.value)}
                                                className="w-full accent-[#1677ff]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Message & Spintax Simulator */}
                            <div className="space-y-4 text-xs flex flex-col justify-between">
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center">
                                        <label className="font-semibold text-[#595959]">Template Pesan (Mendukung Spintax)</label>
                                        <span className="text-[11px] text-[#8c8c8c]">Gunakan {'{opsi1|opsi2}'}</span>
                                    </div>
                                    <textarea
                                        rows="6"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-[#d9d9d9] font-sans text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none leading-relaxed"
                                        required
                                    />

                                    <div className="flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={generatePreview}
                                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1677ff] hover:text-[#0958d9] hover:underline cursor-pointer"
                                        >
                                            <RefreshCw className="size-3.5" />
                                            <span>Simulasikan Variasi Spintax</span>
                                        </button>
                                        <span className="text-[10px] text-[#8c8c8c] font-mono">Placeholder: {'{{nama}}'}, {'{{nomor}}'}</span>
                                    </div>

                                    <AnimatePresence mode="wait">
                                        {previewText && (
                                            <motion.div
                                                key={previewText}
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -6 }}
                                                transition={{ duration: 0.15 }}
                                                className="p-3 bg-[#e6f4ff]/70 rounded-lg border border-[#91caff] text-xs text-[#262626] leading-relaxed font-mono"
                                            >
                                                <strong className="block text-[10px] uppercase font-bold text-[#1677ff] mb-1">
                                                    Hasil Acak Penerima:
                                                </strong>
                                                {previewText}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Live WhatsApp Bubble Preview */}
                                    <div className="p-3.5 bg-[#262626] rounded-xl border border-[#434343] text-white space-y-2 mt-2">
                                        <div className="flex items-center justify-between text-[11px] text-[#8c8c8c] border-b border-[#434343] pb-2">
                                            <span className="font-semibold text-[#52c41a] flex items-center gap-1.5">
                                                <Smartphone className="size-3.5" />
                                                <span>Pratinjau Layar Penerima (WhatsApp)</span>
                                            </span>
                                            <span className="text-[10px] font-mono text-[#bfbfbf]">
                                                Target: {targetType === 'group' ? (groups.find(g => String(g.id) === String(groupId))?.contacts_count || 0) : (recipientsRaw ? recipientsRaw.split(/[\r\n,]+/).filter(Boolean).length : 0)} Kontak
                                            </span>
                                        </div>

                                        <div className="bg-[#efeae2] p-3 rounded-lg text-[#262626] shadow-inner">
                                            <div className="max-w-[280px] bg-white rounded-lg p-2.5 shadow-xs text-xs space-y-1.5">
                                                {mediaSource === 'upload' && mediaFile && (
                                                    <div>
                                                        {mediaType === 'image' && mediaPreview ? (
                                                            <img
                                                                src={mediaPreview}
                                                                alt="Preview"
                                                                className="w-full h-32 object-cover rounded-md border border-[#e6ebf1]"
                                                            />
                                                        ) : (
                                                            <div className="p-2 bg-[#fafafb] rounded-md border border-[#e6ebf1] flex items-center gap-2">
                                                                <FileText className="size-6 text-[#ff4d4f] shrink-0" />
                                                                <div className="overflow-hidden">
                                                                    <p className="font-semibold text-[11px] text-[#262626] truncate">{mediaFile.name}</p>
                                                                    <p className="text-[9.5px] text-[#8c8c8c] font-mono">{(mediaFile.size / 1024).toFixed(0)} KB • Dokumen PDF</p>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {mediaSource === 'url' && mediaUrl && (
                                                    <div className="p-1.5 bg-[#fafafb] rounded text-[10px] text-[#595959] font-mono break-all flex items-center gap-1">
                                                        <Paperclip className="size-3 text-[#1677ff] shrink-0" />
                                                        <span className="truncate">{mediaUrl}</span>
                                                    </div>
                                                )}

                                                <p className="whitespace-pre-wrap leading-relaxed text-[11px] text-[#262626]">
                                                    {previewText || message.replace(/\{([^{}]+)\}/g, (_, group) => group.split('|')[0]).replace(/\{\{nama\}\}/g, 'Budi Santoso')}
                                                </p>
                                                <div className="text-right text-[9px] text-[#8c8c8c] flex items-center justify-end gap-1">
                                                    <span>{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="text-[#1677ff] font-bold">✓✓</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <motion.div whileTap={{ scale: 0.99 }}>
                                    <Button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full h-10 rounded-lg bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold shadow-[0_2px_0_rgba(0,0,0,0.043)] transition-colors cursor-pointer"
                                    >
                                        <span>{processing ? 'Memproses Kampanye...' : scheduleOption === 'scheduled' ? 'Jadwalkan Kampanye Broadcast 📅' : 'Mulai Pengiriman Broadcast Massal'}</span>
                                        <Send className="size-3.5 ml-2 text-white" />
                                    </Button>
                                </motion.div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* ================= 4. CAMPAIGNS HISTORY TABLE ================= */}
                <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
                    <div className="p-5 border-b border-[#f0f0f0]">
                        <h3 className="text-sm font-bold text-[#262626]">Riwayat Kampanye Broadcast</h3>
                        <p className="text-xs text-[#8c8c8c] mt-0.5">Daftar riwayat dan status pengiriman pesan massal</p>
                    </div>

                    <div className="overflow-x-auto no-scrollbar">
                        <table className="w-full text-left text-xs border-collapse min-w-[680px]">
                            <thead>
                                <tr className="bg-[#fafafb] text-[#595959] font-semibold border-b border-[#f0f0f0]">
                                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Nama Kampanye</th>
                                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Gateway Device</th>
                                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Total Penerima</th>
                                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Jeda Throttle</th>
                                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Waktu Pelaksanaan</th>
                                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Status</th>
                                    <th className="py-3 px-4 uppercase text-[11px] tracking-wider text-right">Kontrol</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f0f0]">
                                {processing && (
                                    <>
                                        <TableRowSkeleton columns={7} />
                                        <TableRowSkeleton columns={7} />
                                    </>
                                )}
                                {campaigns.length === 0 && !processing ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-[#8c8c8c] text-xs">
                                            Belum ada kampanye broadcast yang dijalankan.
                                        </td>
                                    </tr>
                                ) : (
                                    campaigns.map((c) => (
                                        <tr key={c.id} className="hover:bg-[#fafafb] transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-[#262626]">
                                                {c.name}
                                                {c.media_url && (
                                                    <a
                                                        href={c.media_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 text-[10px] text-[#1677ff] hover:underline font-mono mt-0.5 block"
                                                    >
                                                        {c.media_url.match(/\.pdf$/i) ? (
                                                            <>
                                                                <FileText className="size-3 text-[#ff4d4f] inline mr-1" />
                                                                <span>Dokumen PDF</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ImageIcon className="size-3 text-[#1677ff] inline mr-1" />
                                                                <span>Foto / Media</span>
                                                            </>
                                                        )}
                                                    </a>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-[#595959]">
                                                {c.device ? c.device.name : 'Default'}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono">
                                                <strong className="text-[#262626]">{c.sent_count}</strong> <span className="text-[#8c8c8c]">/ {c.total_recipients}</span>
                                                {c.failed_count > 0 && (
                                                    <span className="block text-[10px] text-[#ff4d4f] font-semibold font-sans">
                                                        ({c.failed_count} gagal)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-[#8c8c8c] font-mono">
                                                {c.min_delay_seconds}s - {c.max_delay_seconds}s
                                            </td>
                                            <td className="py-3.5 px-4 text-[#8c8c8c]">
                                                {c.scheduled_at ? new Date(c.scheduled_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                }) : '-'}
                                            </td>
                                            <td className="py-3.5 px-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                                        c.status === 'completed'
                                                            ? 'text-[#52c41a]'
                                                            : c.status === 'scheduled'
                                                            ? 'text-[#1677ff]'
                                                            : c.status === 'paused' || c.status === 'partially_delivered'
                                                            ? 'text-[#faad14]'
                                                            : c.status === 'failed'
                                                            ? 'text-[#ff4d4f]'
                                                            : 'text-[#595959]'
                                                    }`}
                                                >
                                                    <span className={`size-1.5 rounded-full ${
                                                        c.status === 'completed' ? 'bg-[#52c41a]'
                                                        : c.status === 'scheduled' ? 'bg-[#1677ff]'
                                                        : c.status === 'failed' ? 'bg-[#ff4d4f]'
                                                        : 'bg-[#faad14]'
                                                    }`} />
                                                    {c.status === 'failed' ? 'Gagal' : c.status === 'partially_delivered' ? 'Sebagian' : c.status === 'completed' ? 'Selesai' : c.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <a
                                                        href={`/broadcast/${c.id}/export`}
                                                        download
                                                        title="Unduh Rekap Laporan Pengiriman (CSV)"
                                                        className="inline-flex items-center gap-1 h-7 px-2.5 text-[11px] font-semibold rounded-lg border border-[#d9d9d9] bg-white hover:bg-[#e6f4ff] hover:border-[#91caff] text-[#1677ff] transition-colors"
                                                    >
                                                        <Download className="size-3" />
                                                        <span>Ekspor</span>
                                                    </a>
                                                    {(c.status === 'scheduled' || c.status === 'paused') && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleTogglePause(c.id)}
                                                            className="h-7 px-2.5 text-[11px] font-semibold rounded-lg border-[#d9d9d9] text-[#595959] cursor-pointer"
                                                        >
                                                            {c.status === 'scheduled' ? (
                                                                <>
                                                                    <Pause className="size-3 mr-1 text-[#faad14]" />
                                                                    <span>Jeda</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Play className="size-3 mr-1 text-[#52c41a]" />
                                                                    <span>Lanjut</span>
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
