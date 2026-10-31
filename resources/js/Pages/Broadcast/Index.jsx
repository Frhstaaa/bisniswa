import React, { useState } from 'react';
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
    const [mediaUrl, setMediaUrl] = useState('');
    const [minDelay, setMinDelay] = useState(8);
    const [maxDelay, setMaxDelay] = useState(18);
    const [scheduleOption, setScheduleOption] = useState('now'); // 'now' | 'scheduled'
    const [scheduledAt, setScheduledAt] = useState('');
    const [previewText, setPreviewText] = useState('');
    const [processing, setProcessing] = useState(false);

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

        router.post('/broadcast', {
            name,
            device_id: deviceId,
            message,
            target_type: targetType,
            group_id: targetType === 'group' ? groupId : null,
            recipients_raw: targetType === 'manual' ? recipientsRaw : null,
            media_url: mediaUrl || null,
            min_delay: parseInt(minDelay),
            max_delay: parseInt(maxDelay),
            schedule_option: scheduleOption,
            scheduled_at: scheduleOption === 'scheduled' ? scheduledAt : null,
        }, {
            preserveScroll: true,
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
                                        <label className="block font-medium text-slate-700 mb-1.5">Pilih Gateway WhatsApp</label>
                                        <select
                                            value={deviceId}
                                            onChange={(e) => setDeviceId(e.target.value)}
                                            className="w-full h-9 px-3 py-1.5 rounded-md border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white"
                                            required
                                        >
                                            {devices.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.name} {d.phone_number ? `(${d.phone_number})` : ''}
                                                </option>
                                            ))}
                                        </select>
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

                                {/* Media Attachment URL */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                        <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                        <label className="font-medium text-slate-700">URL Lampiran Dokumen / Media (Opsional)</label>
                                    </div>
                                    <input
                                        type="url"
                                        value={mediaUrl}
                                        onChange={(e) => setMediaUrl(e.target.value)}
                                        placeholder="https://storage.kampus.ac.id/promo-brosur.pdf"
                                        className="w-full px-3 py-2 rounded-md border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                    />
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
                                                    <span className="block text-[10px] text-slate-400 font-mono">📎 Ada Dokumen</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-700">
                                                {c.device ? c.device.name : 'Default'}
                                            </TableCell>
                                            <TableCell className="text-xs font-mono">
                                                <strong>{c.sent_count}</strong> / {c.total_recipients}
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
                                                            : 'border-slate-200 bg-slate-100 text-slate-700 font-semibold'
                                                    }
                                                >
                                                    {c.status === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mr-1.5" />}
                                                    {c.status === 'scheduled' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1.5" />}
                                                    {c.status === 'paused' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mr-1.5" />}
                                                    {c.status.toUpperCase()}
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
