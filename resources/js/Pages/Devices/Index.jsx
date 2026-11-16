import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import QrScanModal from '../../Components/QrScanModal';
import ModalPortal from '../../Components/ui/ModalPortal';
import {
    Smartphone,
    Plus,
    Battery,
    Trash2,
    RefreshCw,
    QrCode,
    Search,
    Shield,
    ShieldCheck,
    CheckCircle2,
    Clock,
    Zap,
    MessageSquare,
    Send,
    Settings2,
    X,
    Sparkles,
    ChevronRight,
} from 'lucide-react';
import { Button } from '../../Components/ui/button';
import CountUp from '../../Components/ui/CountUp';

export default function DevicesIndex({ workspace, devices = [], subscription, plan, maxDevices = 1, canAddDevice = true }) {
    const maxAllowed = maxDevices || (subscription?.plan?.limits?.max_devices ?? 1);
    const isLimitReached = (devices?.length || 0) >= maxAllowed;

    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [filterEngine, setFilterEngine] = useState('all');
    const [searchDevice, setSearchDevice] = useState('');
    const [editModalDevice, setEditModalDevice] = useState(null);
    const [editName, setEditName] = useState('');
    const [editBatteryMode, setEditBatteryMode] = useState('cloud');
    const [editBatteryLevel, setEditBatteryLevel] = useState(100);
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const handleOpenEdit = (dev) => {
        setEditModalDevice(dev);
        setEditName(dev.name || '');
        if (dev.battery_level !== null && dev.battery_level !== undefined) {
            setEditBatteryMode('custom');
            setEditBatteryLevel(dev.battery_level);
        } else {
            setEditBatteryMode('cloud');
            setEditBatteryLevel(100);
        }
    };

    const handleSaveEdit = (e) => {
        e.preventDefault();
        if (!editModalDevice) return;
        setIsSavingEdit(true);

        router.put(`/devices/${editModalDevice.id}`, {
            name: editName,
            use_cloud_mode: editBatteryMode === 'cloud',
            battery_level: editBatteryMode === 'custom' ? parseInt(editBatteryLevel, 10) : null,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditModalDevice(null);
                setIsSavingEdit(false);
            },
            onError: () => {
                setIsSavingEdit(false);
            },
        });
    };

    const formatConnectionTime = (dateStr) => {
        if (!dateStr) return 'Baru saja';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return 'Baru saja';

            return date.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Jakarta',
            }).replace(':', '.') + ' WIB';
        } catch {
            return 'Baru saja';
        }
    };

    // Auto-refresh when any device is waiting for QR scan
    React.useEffect(() => {
        const hasWaiting = (devices || []).some((d) => d.status === 'qr_ready');
        if (!hasWaiting) return;

        const interval = setInterval(() => {
            router.reload({ only: ['devices'], preserveScroll: true });
        }, 3500);

        return () => clearInterval(interval);
    }, [devices]);

    const handleConnectSimulation = (id) => {
        router.post(`/devices/${id}/connect`, {}, { preserveScroll: true });
    };

    const handleRescanQr = (id) => {
        router.post(`/devices/${id}/rescan`, {}, { preserveScroll: true });
    };

    const handleDelete = (id, name) => {
        if (confirm(`Apakah Anda yakin ingin memutuskan dan menghapus perangkat "${name}"?`)) {
            router.delete(`/devices/${id}`, { preserveScroll: true });
        }
    };

    const filteredDevices = (devices || []).filter((dev) => {
        const matchesEngine = filterEngine === 'all' || dev.engine === filterEngine;
        const matchesSearch = dev.name.toLowerCase().includes(searchDevice.toLowerCase()) ||
            (dev.phone_number && dev.phone_number.includes(searchDevice));
        return matchesEngine && matchesSearch;
    });

    const connectedCount = (devices || []).filter((d) => d.status === 'connected').length;

    return (
        <AppLayout title="Perangkat WhatsApp">
            <Head title="Manajemen Perangkat WhatsApp — SAPA BisnisWA" />

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
                            <span className="text-[#1677ff] font-semibold">Perangkat WhatsApp</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-bold text-[#262626] tracking-tight">
                                Manajemen Perangkat WhatsApp
                            </h1>
                            {isLimitReached ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#fffbe6] text-[#faad14] border border-[#ffe58f]">
                                    KUOTA PENUH ({devices?.length || 0}/{maxAllowed})
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                    {devices?.length || 0} / {maxAllowed} PERANGKAT
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[#8c8c8c] mt-1">
                            Tautkan nomor WhatsApp bisnis Anda menggunakan engine resmi <strong className="text-[#1677ff]">SAPA Baileys UltraSync</strong> (WebSocket Native - Ringan &amp; Cepat).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {isLimitReached ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsQrModalOpen(true)}
                                className="h-9 px-3.5 border-[#ffe58f] bg-[#fffbe6] hover:bg-amber-100/70 text-[#d48806] text-xs font-semibold rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.02)] gap-1.5 transition-colors cursor-pointer"
                            >
                                <Sparkles className="size-3.5 text-[#faad14]" />
                                <span>Batas Tercapai ({devices?.length || 0}/{maxAllowed}) — Upgrade</span>
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setIsQrModalOpen(true)}
                                className="h-9 px-3.5 bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold shadow-[0_2px_0_rgba(0,0,0,0.043)] rounded-lg cursor-pointer flex items-center gap-1.5"
                            >
                                <Plus className="size-3.5 text-white" />
                                <span>Pindai QR Perangkat Baru</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* LIMIT REACHED INFORMATIVE BANNER */}
                {isLimitReached && (
                    <div className="p-4 bg-[#fffbe6] border border-[#ffe58f] rounded-xl text-xs text-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-white text-[#faad14] border border-[#ffe58f] shrink-0 mt-0.5">
                                <Shield className="size-4" />
                            </div>
                            <div>
                                <p className="font-bold text-[#262626]">
                                    Batas Maksimal Perangkat Tercapai ({devices?.length || 0} dari {maxAllowed} Perangkat)
                                </p>
                                <p className="text-[#595959] text-[11px] mt-0.5 leading-relaxed">
                                    Paket langganan Anda saat ini (<strong>{plan?.name || 'Starter Lite'}</strong>) memiliki batas maksimal <strong>{maxAllowed} perangkat WhatsApp</strong>. Untuk menghubungkan nomor baru, silakan putuskan perangkat yang lama atau tingkatkan paket langganan Anda.
                                </p>
                            </div>
                        </div>
                        <Link href="/subscriptions" className="shrink-0">
                            <Button size="sm" className="bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold h-8 px-3.5 rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.043)] cursor-pointer">
                                <span>Upgrade Paket →</span>
                            </Button>
                        </Link>
                    </div>
                )}

                {/* ================= 2. MANTIS KPI STAT CARDS ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Sesi Terhubung Aktif
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                                <Smartphone className="size-3 text-[#1677ff]" />
                                <span>Online</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight font-mono mb-2">
                            <CountUp to={connectedCount} /> <span className="text-sm font-normal text-[#8c8c8c] font-sans">/ {devices?.length || 0} Perangkat</span>
                        </div>
                        <p className="text-xs text-[#8c8c8c]">
                            Siap memproses broadcast &amp; pengiriman API
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-blue-50/60 pointer-events-none" />
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                SAPA Baileys Engine
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                <Zap className="size-3 text-[#52c41a]" />
                                <span>Ready</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#1677ff] tracking-tight font-mono mb-2">
                            <CountUp to={connectedCount} /> <span className="text-sm font-normal text-[#8c8c8c] font-sans">Instance</span>
                        </div>
                        <p className="text-xs text-[#8c8c8c]">
                            Engine Tunggal (WebSocket Native &amp; Anti-Ban)
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-emerald-50/60 pointer-events-none" />
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Keamanan Enkripsi
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f9f0ff] text-[#722ed1] border border-[#d3adf7]">
                                <ShieldCheck className="size-3 text-[#722ed1]" />
                                <span>Signal</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#52c41a] tracking-tight font-mono mb-2">
                            100% E2EE
                        </div>
                        <p className="text-xs text-[#8c8c8c]">
                            Protokol Resmi UltraSync (Bebas Delay)
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-purple-50/60 pointer-events-none" />
                    </motion.div>
                </div>

                {/* ================= 3. TOOLBAR: SEARCH & STATUS ================= */}
                <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#52c41a] bg-[#f6ffed] px-3 py-1.5 rounded-lg border border-[#b7eb8f] flex items-center gap-2">
                            <span className="size-2 rounded-full bg-[#52c41a] animate-pulse" />
                            <span>SAPA UltraSync Engine ({devices?.length || 0} Perangkat)</span>
                        </span>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="size-4 text-[#8c8c8c] absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Cari nama atau nomor HP..."
                            value={searchDevice}
                            onChange={(e) => setSearchDevice(e.target.value)}
                            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-lg border border-[#d9d9d9] text-[#262626] placeholder-[#bfbfbf] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {/* ================= 4. DEVICE CARDS GRID ================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredDevices.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
                            <div className="size-12 rounded-full bg-[#fafafb] border border-[#f0f0f0] flex items-center justify-center mx-auto text-[#bfbfbf]">
                                <Smartphone className="size-6" />
                            </div>
                            <p className="text-xs text-[#595959] font-medium">Belum ada perangkat yang terdaftar.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsQrModalOpen(true)}
                                className="text-xs font-semibold rounded-lg border-[#91caff] text-[#1677ff] hover:bg-[#e6f4ff] cursor-pointer"
                            >
                                <Plus className="size-3.5 mr-1" />
                                Tautkan Nomor Baru
                            </Button>
                        </div>
                    ) : (
                        filteredDevices.map((dev, idx) => (
                            <motion.div
                                key={dev.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18, delay: idx * 0.04 }}
                                whileHover={{ y: -3, transition: { duration: 0.12 } }}
                                className="h-full flex flex-col"
                            >
                                <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col justify-between h-full">
                                    <div className="p-5 pb-3 space-y-3">
                                        <div className="flex items-center justify-between">
                                            {dev.status === 'connected' ? (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#f6ffed] text-[#52c41a] text-[11px] font-bold border border-[#b7eb8f]">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#52c41a] opacity-75" />
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#52c41a]" />
                                                    </span>
                                                    <span>ONLINE</span>
                                                </div>
                                            ) : (
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#fffbe6] text-[#faad14] text-[11px] font-bold border border-[#ffe58f]">
                                                    <Clock className="size-3 text-[#faad14] animate-spin [animation-duration:3s]" />
                                                    <span>WAITING QR</span>
                                                </div>
                                            )}

                                            <span className="font-mono text-[10px] font-semibold uppercase text-[#1677ff] bg-[#e6f4ff] border border-[#91caff] px-2 py-0.5 rounded">
                                                UltraSync Engine
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-base font-bold text-[#262626]">{dev.name}</h3>
                                            <p className="text-xs font-mono font-semibold text-[#8c8c8c] mt-0.5">
                                                {dev.phone_number || 'Belum ada nomor terikat'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-5 pt-0 space-y-3">
                                        {dev.status === 'qr_ready' && (
                                            <div className="text-center p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0] space-y-2 animate-fade-in">
                                                {dev.qr_code ? (
                                                    <>
                                                        <img src={dev.qr_code} alt="QR Code WhatsApp" className="w-40 h-40 mx-auto rounded-lg object-contain bg-white p-2 border border-[#e6ebf1] shadow-2xs" />
                                                        <div className="p-2.5 bg-[#e6f4ff] rounded-lg border border-[#91caff] text-left space-y-0.5">
                                                            <p className="text-[11px] font-bold text-[#262626] flex items-center gap-1">
                                                                <Smartphone className="size-3.5 text-[#1677ff]" />
                                                                <span>Cara Pindai dengan WhatsApp di HP:</span>
                                                            </p>
                                                            <p className="text-[10.5px] text-[#595959] leading-tight">
                                                                Buka WhatsApp di HP &rarr; Menu Titik Tiga / Pengaturan &rarr; <strong>Perangkat Tertaut</strong> &rarr; <strong>Tautkan Perangkat</strong> &rarr; Pindai QR di atas.
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="py-6 space-y-2">
                                                        <RefreshCw className="size-6 animate-spin text-[#1677ff] mx-auto" />
                                                        <p className="text-xs text-[#595959] font-medium">Menyiapkan QR Code dari WhatsApp Gateway...</p>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-center gap-1.5 pt-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleConnectSimulation(dev.id)}
                                                        className="text-[10px] text-[#595959] border-[#d9d9d9] h-7 px-2.5 hover:bg-slate-100 rounded-md cursor-pointer"
                                                        title="Hubungkan simulasi tanpa WhatsApp HP (mode uji coba)"
                                                    >
                                                        <Zap className="size-3 mr-1 text-[#faad14]" />
                                                        <span>Simulasi Cepat (Demo)</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-2 text-xs py-2.5 border-t border-[#f0f0f0] text-[#595959]">
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] text-[#8c8c8c] block">Daya Baterai</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEdit(dev)}
                                                        className="text-[10px] text-[#1677ff] hover:text-[#0958d9] font-semibold underline cursor-pointer"
                                                    >
                                                        Ubah
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-1 font-mono font-bold text-[#262626] mt-0.5">
                                                    {dev.battery_level !== null && dev.battery_level !== undefined ? (
                                                        <>
                                                            <Battery className="size-3.5 text-[#52c41a]" />
                                                            <span>{dev.battery_level}%</span>
                                                        </>
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-[11px] font-sans font-semibold text-[#1677ff]" title="Protokol resmi WhatsApp Multi-Device: Berjalan mandiri di cloud tanpa menguras baterai smartphone.">
                                                            <Zap className="size-3.5 text-[#1677ff] shrink-0" />
                                                            <span className="truncate">Multi-Device</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[#8c8c8c] block">Koneksi Terakhir</span>
                                                <span className="font-mono text-[11px] text-[#262626] block mt-0.5 font-medium" title={dev.last_connected_at ? new Date(dev.last_connected_at).toLocaleString('id-ID') : ''}>
                                                    {formatConnectionTime(dev.last_connected_at)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Quick Shortcut Buttons for Online Device */}
                                        {dev.status === 'connected' && (
                                            <div className="flex items-center gap-2 pt-2 border-t border-[#f0f0f0]">
                                                <Link
                                                    href="/inbox"
                                                    className="flex-1 py-1.5 px-2 bg-[#e6f4ff] hover:bg-[#bae0ff] text-[#1677ff] border border-[#91caff] rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <MessageSquare className="size-3.5" />
                                                    <span>Live Chat</span>
                                                </Link>
                                                <Link
                                                    href="/broadcast"
                                                    className="flex-1 py-1.5 px-2 bg-[#fafafb] hover:bg-[#f0f0f0] text-[#595959] border border-[#e6ebf1] rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                                >
                                                    <Send className="size-3.5" />
                                                    <span>Broadcast</span>
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <div className="px-5 py-3.5 flex items-center justify-between gap-2 border-t border-[#f0f0f0] bg-[#fafafb]/50 rounded-b-xl">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant={dev.status === 'connected' ? 'outline' : 'default'}
                                                size="sm"
                                                onClick={() => handleRescanQr(dev.id)}
                                                className={`h-8 text-xs font-semibold rounded-lg cursor-pointer ${
                                                    dev.status === 'connected'
                                                        ? 'border-[#d9d9d9] bg-white text-[#595959] hover:text-[#1677ff] hover:border-[#1677ff]'
                                                        : 'bg-[#1677ff] hover:bg-[#0958d9] text-white shadow-[0_2px_0_rgba(0,0,0,0.043)]'
                                                }`}
                                                title="Pindai QR Code dengan nomor WhatsApp di HP Anda"
                                            >
                                                <QrCode className="size-3.5 mr-1" />
                                                <span>{dev.status === 'connected' ? 'Pindai Ulang QR' : 'Pindai QR WhatsApp'}</span>
                                            </Button>

                                            {dev.status === 'connected' && (
                                                <div className="hidden sm:flex items-center gap-1 text-[11px] text-[#52c41a] font-semibold">
                                                    <CheckCircle2 className="size-3.5 text-[#52c41a]" />
                                                    <span>Aktif</span>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(dev.id, dev.name)}
                                            className="h-8 text-xs text-[#ff4d4f] hover:text-[#cf1322] hover:bg-[#fff1f0] rounded-lg cursor-pointer"
                                            title="Putuskan dan hapus perangkat ini"
                                        >
                                            <Trash2 className="size-3.5 mr-1" />
                                            <span>Putuskan</span>
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>

            {/* QR SCAN MODAL */}
            <QrScanModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                canAddDevice={!isLimitReached}
                maxDevices={maxAllowed}
                currentCount={devices?.length || 0}
                planName={plan?.name || 'Starter Lite'}
            />

            {/* EDIT DEVICE & BATTERY MODAL */}
            {editModalDevice && (
                <ModalPortal isOpen={!!editModalDevice} onClose={() => setEditModalDevice(null)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setEditModalDevice(null)}
                    >
                        <div
                            className="relative bg-white rounded-xl max-w-md w-full shadow-2xl border border-[#e6ebf1] overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-[#f0f0f0] flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center">
                                        <Settings2 className="size-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-[#262626] text-sm">Sesuaikan Perangkat &amp; Baterai</h3>
                                        <p className="text-xs text-[#8c8c8c] font-mono">{editModalDevice.phone_number || editModalDevice.name}</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditModalDevice(null)}
                                    className="p-1 rounded-lg text-[#8c8c8c] hover:text-[#262626] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-[#595959] mb-1.5">
                                        Nama / Label Perangkat
                                    </label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Contoh: CS Utama"
                                        className="w-full px-3 py-2 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-[#595959] mb-1.5">
                                        Mode Daya &amp; Status Baterai
                                    </label>
                                    <div className="space-y-2">
                                        <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                                            editBatteryMode === 'cloud'
                                                ? 'border-[#1677ff] bg-[#e6f4ff]/50'
                                                : 'border-[#e6ebf1] hover:bg-[#fafafb]'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="batteryMode"
                                                value="cloud"
                                                checked={editBatteryMode === 'cloud'}
                                                onChange={() => setEditBatteryMode('cloud')}
                                                className="mt-0.5 text-[#1677ff] focus:ring-[#1677ff]"
                                            />
                                            <div>
                                                <span className="text-xs font-bold text-[#262626] flex items-center gap-1.5">
                                                    <Zap className="size-3.5 text-[#1677ff]" />
                                                    Multi-Device Cloud Mode (Resmi)
                                                </span>
                                                <p className="text-[11px] text-[#8c8c8c] mt-0.5">
                                                    Protokol resmi Meta: Gateway berjalan di server cloud 24/7 mandiri tanpa menguras baterai HP Anda.
                                                </p>
                                            </div>
                                        </label>

                                        <label className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                                            editBatteryMode === 'custom'
                                                ? 'border-[#1677ff] bg-[#e6f4ff]/50'
                                                : 'border-[#e6ebf1] hover:bg-[#fafafb]'
                                        }`}>
                                            <input
                                                type="radio"
                                                name="batteryMode"
                                                value="custom"
                                                checked={editBatteryMode === 'custom'}
                                                onChange={() => setEditBatteryMode('custom')}
                                                className="mt-0.5 text-[#1677ff] focus:ring-[#1677ff]"
                                            />
                                            <div className="flex-1">
                                                <span className="text-xs font-bold text-[#262626] flex items-center gap-1.5">
                                                    <Battery className="size-3.5 text-[#595959]" />
                                                    Kustom Persentase Baterai HP Fisik
                                                </span>
                                                <p className="text-[11px] text-[#8c8c8c] mt-0.5 mb-2">
                                                    Sesuaikan tampilan persentase daya baterai agar persis dengan kondisi smartphone fisik Anda.
                                                </p>
                                                {editBatteryMode === 'custom' && (
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={editBatteryLevel}
                                                            onChange={(e) => setEditBatteryLevel(e.target.value)}
                                                            className="w-24 px-2.5 py-1.5 rounded-lg border border-[#d9d9d9] text-xs font-mono font-bold text-[#262626] focus:border-[#1677ff] focus:outline-none"
                                                        />
                                                        <span className="text-xs font-bold text-[#595959]">%</span>
                                                    </div>
                                                )}
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#f0f0f0]">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditModalDevice(null)}
                                        className="text-xs border-[#d9d9d9] text-[#595959] rounded-lg cursor-pointer"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        disabled={isSavingEdit}
                                        className="bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold px-4 rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.043)] cursor-pointer"
                                    >
                                        {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </AppLayout>
    );
}
