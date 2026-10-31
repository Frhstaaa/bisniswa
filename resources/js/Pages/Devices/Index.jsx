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
    Activity,
    Trash2,
    RefreshCw,
    QrCode,
    Cpu,
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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import { Separator } from '../../Components/ui/separator';
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
    const wwebjsCount = (devices || []).filter((d) => d.engine === 'wwebjs').length;

    return (
        <AppLayout title="Perangkat WhatsApp">
            <Head title="Manajemen Perangkat WhatsApp — MARDIRA WA" />

            <div className="space-y-6 animate-fade-in-up">
                {/* 1. TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                                Manajemen Perangkat WhatsApp
                            </h1>
                            {isLimitReached ? (
                                <Badge variant="amber" className="text-[9.5px] sm:text-[10px] px-2 py-0.5 font-bold">
                                    KUOTA PENUH ({devices?.length || 0}/{maxAllowed})
                                </Badge>
                            ) : (
                                <Badge variant="emerald" className="text-[9.5px] sm:text-[10px] px-2 py-0.5 font-bold">
                                    {devices?.length || 0} / {maxAllowed} PERANGKAT
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Tautkan nomor WhatsApp bisnis Anda menggunakan engine resmi <strong className="text-[#1e50ff]">BisnisWA UltraSync</strong> (Enterprise Native Web).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                        {isLimitReached ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsQrModalOpen(true)}
                                className="border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold h-9 rounded-lg shadow-2xs gap-1.5 transition-colors cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>Batas Tercapai ({devices?.length || 0}/{maxAllowed}) — Upgrade</span>
                            </Button>
                        ) : (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={() => setIsQrModalOpen(true)}
                                className="bg-[#1e50ff] hover:bg-[#153ec7] text-white text-xs font-semibold shadow-xs h-9 rounded-lg cursor-pointer"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1 text-white" />
                                <span>Pindai QR Perangkat Baru</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* LIMIT REACHED INFORMATIVE BANNER */}
                {isLimitReached && (
                    <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-xs text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-fade-in">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-xl bg-amber-100/80 text-amber-800 border border-amber-300/40 shrink-0 mt-0.5">
                                <Shield className="w-4 h-4 text-amber-700" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">
                                    Batas Maksimal Perangkat Tercapai ({devices?.length || 0} dari {maxAllowed} Perangkat)
                                </p>
                                <p className="text-slate-600 text-[11px] mt-0.5 leading-relaxed">
                                    Paket langganan Anda saat ini (<strong>{plan?.name || 'Starter Lite'}</strong>) memiliki batas maksimal <strong>{maxAllowed} perangkat WhatsApp</strong>. Untuk menghubungkan nomor baru, silakan putuskan perangkat yang lama atau tingkatkan paket langganan Anda ke <strong>Enterprise Pro</strong> (hingga 5 nomor).
                                </p>
                            </div>
                        </div>
                        <Link href="/subscriptions" className="shrink-0">
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 rounded-lg shadow-2xs">
                                <span>Upgrade Paket →</span>
                            </Button>
                        </Link>
                    </div>
                )}

                {/* 2. THREE SUMMARY KPI STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.02 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200 shadow-xs hover:shadow-md transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Sesi Terhubung Aktif
                                </CardTitle>
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <Smartphone className="h-3.5 w-3.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-2xl font-black text-slate-900 tracking-tight">
                                    <CountUp to={connectedCount} /> <span className="text-xs font-normal text-slate-500">/ {devices?.length || 0} Perangkat</span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Siap memproses broadcast & pengiriman API
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.06 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200 shadow-xs hover:shadow-md transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    BisnisWA UltraSync Engine
                                </CardTitle>
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <Zap className="h-3.5 w-3.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-2xl font-black text-emerald-700 tracking-tight">
                                    <CountUp to={connectedCount} /> Instance
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Engine Tunggal (Zero Delay & Anti-Ban)
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.1 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200 shadow-xs hover:shadow-md transition-all">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Keamanan Enkripsi
                                </CardTitle>
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-2xl font-black text-emerald-700 tracking-tight">
                                    100% E2EE
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Protokol Resmi BisnisWA UltraSync (Bebas Delay)
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* 3. TOOLBAR: SEARCH & FILTER TABS */}
                <Card className="border-slate-200 shadow-xs">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                BisnisWA UltraSync Engine ({devices?.length || 0} Perangkat)
                            </span>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Cari nama atau nomor HP..."
                                value={searchDevice}
                                onChange={(e) => setSearchDevice(e.target.value)}
                                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* 4. DEVICE CARDS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredDevices.length === 0 ? (
                        <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
                            <Smartphone className="w-8 h-8 text-slate-300 mx-auto" />
                            <p className="text-xs text-slate-500 font-medium">Belum ada perangkat yang terdaftar.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsQrModalOpen(true)}
                                className="text-xs font-bold rounded-lg"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Tautkan Nomor Baru
                            </Button>
                        </div>
                    ) : (
                        filteredDevices.map((dev, idx) => (
                            <motion.div
                                key={dev.id}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.18, delay: idx * 0.04 }}
                                whileHover={{ y: -3, transition: { duration: 0.12 } }}
                                className="h-full flex flex-col"
                            >
                                <Card className="border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full">
                                <CardHeader className="p-5 pb-3 space-y-3">
                                    <div className="flex items-center justify-between">
                                        {dev.status === 'connected' ? (
                                            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                                                <span className="relative flex h-2 w-2">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                                                </span>
                                                <span>ONLINE</span>
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                                                <Clock className="w-3 h-3 text-amber-600 animate-spin [animation-duration:3s]" />
                                                <span>WAITING QR</span>
                                            </div>
                                        )}

                                        <Badge variant="outline" className="font-mono text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 border-emerald-200">
                                            UltraSync Engine
                                        </Badge>
                                    </div>

                                    <div>
                                        <CardTitle className="text-base font-bold text-slate-900">{dev.name}</CardTitle>
                                        <p className="text-xs font-mono font-semibold text-slate-600 mt-0.5">
                                            {dev.phone_number || 'Belum ada nomor terikat'}
                                        </p>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-5 pt-0 space-y-3">
                                    {dev.status === 'qr_ready' && dev.qr_code && (
                                        <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
                                            <img src={dev.qr_code} alt="QR Code" className="w-36 h-36 mx-auto rounded-lg mb-2 object-contain bg-white p-1" />
                                            <Button
                                                size="sm"
                                                onClick={() => handleConnectSimulation(dev.id)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg shadow-2xs h-8 px-3"
                                            >
                                                <Zap className="w-3.5 h-3.5 mr-1 text-amber-300" />
                                                <span>Hubungkan Instan (Bypass)</span>
                                            </Button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-slate-100 text-slate-600">
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] text-slate-400 block">Daya Baterai</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenEdit(dev)}
                                                    className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold underline"
                                                >
                                                    Ubah
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1 font-mono font-bold text-slate-900 mt-0.5">
                                                {dev.battery_level !== null && dev.battery_level !== undefined ? (
                                                    <>
                                                        <Battery className="w-3.5 h-3.5 text-emerald-600" />
                                                        <span>{dev.battery_level}%</span>
                                                    </>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-[11px] font-sans font-semibold text-emerald-700" title="Protokol resmi WhatsApp Multi-Device: Berjalan mandiri di cloud tanpa menguras baterai smartphone.">
                                                        <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500 shrink-0" />
                                                        <span className="truncate">Multi-Device</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block">Koneksi Terakhir</span>
                                            <span className="font-mono text-[11px] text-slate-700 block mt-0.5 font-medium" title={dev.last_connected_at ? new Date(dev.last_connected_at).toLocaleString('id-ID') : ''}>
                                                {formatConnectionTime(dev.last_connected_at)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quick Shortcut Buttons for Online Device */}
                                    {dev.status === 'connected' && (
                                        <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                                            <Link
                                                href="/inbox"
                                                className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <MessageSquare className="w-3 h-3 text-emerald-600" />
                                                <span>Live Chat</span>
                                            </Link>
                                            <Link
                                                href="/broadcast"
                                                className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <Send className="w-3 h-3 text-slate-600" />
                                                <span>Broadcast</span>
                                            </Link>
                                        </div>
                                    )}
                                </CardContent>

                                <CardFooter className="p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                                    {dev.status !== 'connected' ? (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleConnectSimulation(dev.id)}
                                            className="text-xs font-semibold rounded-lg"
                                        >
                                            <Zap className="w-3 h-3 mr-1 text-emerald-600" />
                                            <span>Hubungkan Cepat</span>
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                            <span>Sinkronisasi Aktif</span>
                                        </div>
                                    )}

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDelete(dev.id, dev.name)}
                                        className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                                        <span>Putuskan</span>
                                    </Button>
                                </CardFooter>
                            </Card>
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
                            className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                                    <Settings2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Sesuaikan Perangkat & Baterai</h3>
                                    <p className="text-xs text-slate-500 font-mono">{editModalDevice.phone_number || editModalDevice.name}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setEditModalDevice(null)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Nama / Label Perangkat
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    placeholder="Contoh: CS Utama Frahesta"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Mode Daya & Status Baterai
                                </label>
                                <div className="space-y-2">
                                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                        editBatteryMode === 'cloud'
                                            ? 'border-emerald-500 bg-emerald-50/50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="batteryMode"
                                            value="cloud"
                                            checked={editBatteryMode === 'cloud'}
                                            onChange={() => setEditBatteryMode('cloud')}
                                            className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
                                                Multi-Device Cloud Mode (Resmi)
                                            </span>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                                Protokol resmi Meta: Gateway berjalan di server cloud 24/7 mandiri tanpa menguras baterai HP Anda & HP tidak harus selalu online.
                                            </p>
                                        </div>
                                    </label>

                                    <label className={`flex items-start gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                                        editBatteryMode === 'custom'
                                            ? 'border-emerald-500 bg-emerald-50/50'
                                            : 'border-slate-200 hover:bg-slate-50'
                                    }`}>
                                        <input
                                            type="radio"
                                            name="batteryMode"
                                            value="custom"
                                            checked={editBatteryMode === 'custom'}
                                            onChange={() => setEditBatteryMode('custom')}
                                            className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <div className="flex-1">
                                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <Battery className="w-3.5 h-3.5 text-slate-600" />
                                                Kustom Persentase Baterai HP Fisik
                                            </span>
                                            <p className="text-[11px] text-slate-500 mt-0.5 mb-2">
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
                                                        className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:border-emerald-600 focus:outline-none"
                                                    />
                                                    <span className="text-xs font-bold text-slate-600">%</span>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditModalDevice(null)}
                                    className="text-xs"
                                >
                                    Batal
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isSavingEdit}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4"
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
