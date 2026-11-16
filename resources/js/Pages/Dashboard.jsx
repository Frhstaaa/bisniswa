import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../Layouts/AppLayout';
import QrScanModal from '../Components/QrScanModal';
import DurationAdjustModal from '../Components/DurationAdjustModal';
import OnboardingGuideModal from '../Components/OnboardingGuideModal';
import InteractiveThroughputChart from '../Components/InteractiveThroughputChart';
import {
    Smartphone,
    Send,
    Zap,
    Clock,
    Plus,
    Activity,
    ArrowRight,
    Server,
    Calendar,
    TrendingUp,
    TrendingDown,
    CreditCard,
    QrCode,
    Code2,
    Users,
    MessageSquare,
    Sparkles,
    Lightbulb,
    ChevronRight,
    RefreshCw,
    ShieldCheck,
    CheckCheck,
    Check,
    AlertCircle,
    CheckCircle2,
    Cpu,
    ExternalLink,
} from 'lucide-react';
import { Button } from '../Components/ui/button';
import { Badge } from '../Components/ui/badge';
import CountUp from '../Components/ui/CountUp';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '../Components/ui/card';
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '../Components/ui/tabs';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '../Components/ui/table';
import { Avatar, AvatarFallback } from '../Components/ui/avatar';
import { cn } from '../lib/utils';

export default function Dashboard({
    workspace,
    subscription,
    stats,
    recentMessages = [],
    devices = [],
    chartData,
}) {
    const { props } = usePage();
    const user = props.auth?.user || {};
    const isSuperAdmin = user.role === 'superadmin';

    const messagesList = Array.isArray(recentMessages)
        ? recentMessages
        : (Array.isArray(recentMessages?.data)
            ? recentMessages.data
            : Object.values(recentMessages || {}));

    const devicesList = Array.isArray(devices)
        ? devices
        : (Array.isArray(devices?.data)
            ? devices.data
            : Object.values(devices || {}));

    const maxAllowedDevices = stats?.max_devices ?? (subscription?.plan?.limits?.max_devices ?? 1);
    const connectedCount = stats?.connected_devices ?? devicesList.filter((d) => d.status === 'connected').length;
    const isDeviceLimitReached = (devicesList?.length || 0) >= maxAllowedDevices;

    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

    // Realtime Auto-Polling & Live Sync State
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const refreshDashboard = () => {
        setIsRefreshing(true);
        router.reload({
            only: ['stats', 'chartData', 'recentMessages', 'devices'],
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                setIsRefreshing(false);
                setLastUpdated(new Date());
            },
        });
    };

    useEffect(() => {
        const timer = setInterval(() => {
            refreshDashboard();
        }, 12000); // 12-second live polling
        return () => clearInterval(timer);
    }, []);

    const quickActions = [
        {
            title: 'Kirim Broadcast Massal',
            subtitle: 'Kirim kampanye & notifikasi ke ribuan kontak',
            href: '/broadcast',
            icon: Send,
        },
        {
            title: 'Kotak Masuk (Live Chat 2-Way)',
            subtitle: 'Balas pesan pelanggan langsung dari dashboard',
            href: '/inbox',
            icon: MessageSquare,
        },
        {
            title: 'Buku Kontak & Segmentasi',
            subtitle: 'Kelola database nomor kontak & segmentasi grup',
            href: '/contacts',
            icon: Users,
        },
        {
            title: 'Bot Auto-Reply & Asisten AI',
            subtitle: 'Otomasi balasan kata kunci & asisten bot cerdas',
            href: '/auto-reply',
            icon: Sparkles,
        },
        {
            title: 'Pindai QR Nomor WhatsApp',
            subtitle: 'Tautkan nomor baru ke SAPA UltraSync Engine',
            onClick: () => setIsQrModalOpen(true),
            icon: QrCode,
        },
        {
            title: 'Kredensial API & Webhook',
            subtitle: 'API key gateway & dokumentasi integrasi lengkap',
            href: '/api-access',
            icon: Code2,
        },
        {
            title: 'Paket Langganan & Kuota',
            subtitle: 'Detail siklus billing, invoice & top-up kuota',
            href: '/subscriptions',
            icon: CreditCard,
        },
    ];

    // Compute metric percentages
    const quotaUsed = Math.max(0, (stats?.monthly_quota || 5000) - (stats?.remaining_quota || 0));
    const quotaPercent = Math.min(100, Math.round(((stats?.remaining_quota || 0) / Math.max(1, stats?.monthly_quota || 5000)) * 100));
    const devicePercent = Math.min(100, Math.round(((stats?.connected_devices || 0) / Math.max(1, maxAllowedDevices)) * 100));
    const cyclePercent = Math.min(100, Math.max(0, Math.round(((stats?.days_remaining || 0) / 30) * 100)));

    return (
        <AppLayout title="Ikhtisar Workspace">
            <Head title="Mantis Workspace Dashboard — SAPA BisnisWA" />

            <div className="space-y-6 pb-12 font-sans antialiased text-[#1f1f1f]">
                {/* ================= 1. MANTIS BREADCRUMB & HEADER ================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e6ebf1]">
                    <div>
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-1.5 text-xs text-[#8c8c8c] mb-1 font-medium">
                            <Link href="/dashboard" className="hover:text-[#1677ff] transition-colors">
                                Dashboard
                            </Link>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#262626]">Workspace</span>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#1677ff] font-semibold">{workspace?.name || 'Overview'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#262626]">
                                {workspace?.name || 'Workspace'} Statistics
                            </h1>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                                <Sparkles className="size-2.5 text-[#1677ff]" />
                                <span>{stats?.plan_name || 'Starter Lite'}</span>
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                <span className="size-1.5 rounded-full bg-[#52c41a] animate-pulse" />
                                <span>Dual-Server Aktif</span>
                            </span>
                        </div>
                    </div>

                    {/* Integrated Mantis Action Cluster */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {/* Live Sync Pill */}
                        <div className="inline-flex items-center rounded-lg border border-[#d9d9d9] bg-white px-3 py-1.5 shadow-[0_2px_0_rgba(0,0,0,0.02)] text-xs text-[#595959] gap-2">
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex size-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-[#1677ff]" />
                            </span>
                            <span className="text-[#8c8c8c] font-normal hidden sm:inline">Sync:</span>
                            <span className="font-mono font-bold text-[#262626] tabular-nums">
                                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <button
                                type="button"
                                onClick={refreshDashboard}
                                disabled={isRefreshing}
                                className="p-1 rounded hover:bg-slate-100 text-[#8c8c8c] hover:text-[#1677ff] transition-colors disabled:opacity-50 cursor-pointer"
                                title="Segarkan data realtime sekarang"
                            >
                                <RefreshCw className={cn('size-3 text-[#1677ff]', isRefreshing && 'animate-spin')} />
                            </button>
                        </div>

                        {/* Panduan Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsGuideModalOpen(true)}
                            className="h-9 px-3.5 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.02)] transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <Lightbulb className="size-3.5 text-amber-500" />
                            <span>Panduan</span>
                        </Button>

                        {/* SuperAdmin Duration Modal Trigger */}
                        {isSuperAdmin && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsDurationModalOpen(true)}
                                className="h-9 px-3.5 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.02)] transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Calendar className="size-3.5 text-[#8c8c8c]" />
                                <span>Kelola Durasi</span>
                            </Button>
                        )}

                        {/* Primary Action Button */}
                        {isDeviceLimitReached ? (
                            <Link href="/subscriptions">
                                <Button
                                    size="sm"
                                    className="h-9 px-3.5 text-xs font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.043)] transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Sparkles className="size-3.5" />
                                    <span>Upgrade Slot ({devicesList?.length || 0}/{maxAllowedDevices})</span>
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => setIsQrModalOpen(true)}
                                className="h-9 px-3.5 text-xs font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.043)] transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <Plus className="size-3.5" />
                                <span>Tautkan Perangkat WA</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ================= 2. MANTIS ANALYTIC E-COMMERCE CARDS (ROW 1) ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* CARD 1: Total Messages Sent (Pesan Hari Ini) */}
                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Pesan Hari Ini
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                <TrendingUp className="size-3 text-[#52c41a]" />
                                <span>+18.4%</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight font-mono mb-2">
                            <CountUp to={stats?.sent_today || 0} /> <span className="text-sm font-normal text-[#8c8c8c] font-sans">Pesan</span>
                        </div>
                        <div className="w-full bg-[#f5f5f5] h-1.5 rounded-full overflow-hidden mb-2.5">
                            <div
                                style={{ width: `${Math.min(100, parseFloat(stats?.delivery_rate || '100'))}%` }}
                                className="h-full bg-[#1677ff] rounded-full transition-all duration-500"
                            />
                        </div>
                        <p className="text-xs text-[#8c8c8c] leading-relaxed">
                            Tingkat sukses <span className="font-semibold text-[#1677ff]">{stats?.delivery_rate || '100%'}</span> ({stats?.busiest_hour || '10:00 – 15:00 WIB'})
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-blue-50/60 pointer-events-none" />
                    </motion.div>

                    {/* CARD 2: Slot Gateway WhatsApp */}
                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Slot Nomor WA
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                                <Smartphone className="size-3 text-[#1677ff]" />
                                <span>{devicePercent}% Slot</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight font-mono mb-2">
                            <CountUp to={stats?.connected_devices || 0} /> <span className="text-sm font-normal text-[#8c8c8c] font-sans">/ {maxAllowedDevices} Slot</span>
                        </div>
                        <div className="w-full bg-[#f5f5f5] h-1.5 rounded-full overflow-hidden mb-2.5">
                            <div
                                style={{ width: `${devicePercent}%` }}
                                className="h-full bg-[#52c41a] rounded-full transition-all duration-500"
                            />
                        </div>
                        <p className="text-xs text-[#8c8c8c] leading-relaxed">
                            Status node: <span className="font-semibold text-[#52c41a]">{(stats?.connected_devices || 0) > 0 ? 'Online & Siap' : 'Perlu Scan QR'}</span> (Dual Server)
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-emerald-50/60 pointer-events-none" />
                    </motion.div>

                    {/* CARD 3: Sisa Kuota Pesan */}
                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Sisa Kuota Pesan
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#fffbe6] text-[#faad14] border border-[#ffe58f]">
                                <Zap className="size-3 text-[#faad14]" />
                                <span>{quotaPercent}% Sisa</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight font-mono mb-2">
                            <CountUp to={stats?.remaining_quota || 0} /> <span className="text-sm font-normal text-[#8c8c8c] font-sans">Pesan</span>
                        </div>
                        <div className="w-full bg-[#f5f5f5] h-1.5 rounded-full overflow-hidden mb-2.5">
                            <div
                                style={{ width: `${quotaPercent}%` }}
                                className="h-full bg-[#faad14] rounded-full transition-all duration-500"
                            />
                        </div>
                        <p className="text-xs text-[#8c8c8c] leading-relaxed">
                            Terpakai <span className="font-semibold text-[#262626]">{quotaUsed.toLocaleString('id-ID')}</span> dari {(stats?.monthly_quota || 5000).toLocaleString('id-ID')} /bln
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-amber-50/60 pointer-events-none" />
                    </motion.div>

                    {/* CARD 4: Sisa Masa Aktif Langganan */}
                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Masa Aktif
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                                (stats?.days_remaining || 0) > 5
                                    ? 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]'
                                    : 'bg-[#fff1f0] text-[#ff4d4f] border border-[#ffccc7]'
                            }`}>
                                <Clock className="size-3" />
                                <span>{(stats?.days_remaining || 0) > 0 ? 'AKTIF' : 'EXPIRED'}</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight font-mono mb-2">
                            {stats?.days_remaining || 0} <span className="text-sm font-normal text-[#8c8c8c] font-sans">Hari Tersisa</span>
                        </div>
                        <div className="w-full bg-[#f5f5f5] h-1.5 rounded-full overflow-hidden mb-2.5">
                            <div
                                style={{ width: `${cyclePercent}%` }}
                                className={`h-full rounded-full transition-all duration-500 ${
                                    (stats?.days_remaining || 0) > 5 ? 'bg-[#52c41a]' : 'bg-[#faad14]'
                                }`}
                            />
                        </div>
                        <p className="text-xs text-[#8c8c8c] leading-relaxed">
                            Paket <span className="font-semibold text-[#1677ff]">{stats?.plan_name || 'Starter Lite'}</span> (Toleransi 3 hari grace period)
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-purple-50/60 pointer-events-none" />
                    </motion.div>
                </div>

                {/* ================= 3. MANTIS ROUND ICON STATS (ROW 2) ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Item 1: SLA Pengiriman */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
                        <div className="size-11 rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center shrink-0">
                            <Send className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold text-[#262626]">
                                {stats?.delivery_rate || '99.4%'} Sukses
                            </div>
                            <div className="text-xs text-[#8c8c8c] truncate">
                                UltraSync Delivery Rate SLA
                            </div>
                        </div>
                    </div>

                    {/* Item 2: Node Gateway Aktif */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
                        <div className="size-11 rounded-full bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f] flex items-center justify-center shrink-0">
                            <Smartphone className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold text-[#262626]">
                                {stats?.connected_devices || 0} / {maxAllowedDevices} Online
                            </div>
                            <div className="text-xs text-[#8c8c8c] truncate">
                                Baileys Gateway Cluster
                            </div>
                        </div>
                    </div>

                    {/* Item 3: Jam Sibuk Operasional */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
                        <div className="size-11 rounded-full bg-[#fffbe6] text-[#faad14] border border-[#ffe58f] flex items-center justify-center shrink-0">
                            <Clock className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold text-[#262626] truncate">
                                {stats?.busiest_hour || '10:00 – 15:00 WIB'}
                            </div>
                            <div className="text-xs text-[#8c8c8c] truncate">
                                Jam Sibuk Transmisi
                            </div>
                        </div>
                    </div>

                    {/* Item 4: Siklus Billing Langganan */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
                        <div className="size-11 rounded-full bg-[#f9f0ff] text-[#722ed1] border border-[#d3adf7] flex items-center justify-center shrink-0">
                            <CreditCard className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold text-[#262626]">
                                {stats?.days_remaining || 0} Hari Aktif
                            </div>
                            <div className="text-xs text-[#8c8c8c] truncate">
                                Paket {stats?.plan_name || 'Starter Lite'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= 4. MANTIS SEGMENTED TABS ================= */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                        <TabsList className="bg-[#f5f5f5] border border-[#e8e8e8] p-1 rounded-xl inline-flex min-w-full sm:min-w-0">
                            <TabsTrigger
                                value="overview"
                                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-[#1677ff] data-[state=active]:shadow-xs text-[#595959] hover:text-[#262626] cursor-pointer"
                            >
                                Ikhtisar Utama
                            </TabsTrigger>
                            <TabsTrigger
                                value="analytics"
                                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-[#1677ff] data-[state=active]:shadow-xs text-[#595959] hover:text-[#262626] cursor-pointer"
                            >
                                Throughput & Grafik
                            </TabsTrigger>
                            <TabsTrigger
                                value="infrastructure"
                                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-[#1677ff] data-[state=active]:shadow-xs text-[#595959] hover:text-[#262626] cursor-pointer"
                            >
                                Dual Server & Gateway
                            </TabsTrigger>
                            <TabsTrigger
                                value="logs"
                                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-[#1677ff] data-[state=active]:shadow-xs text-[#595959] hover:text-[#262626] cursor-pointer"
                            >
                                Log Riwayat Pesan
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* ================= TAB 1: IKHTISAR UTAMA ================= */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* ROW 3: THROUGHPUT CHART (8 cols) + RECENT MESSAGES (4 cols) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left (8 cols): Interactive Realtime Throughput Chart */}
                            <div className="lg:col-span-8">
                                <InteractiveThroughputChart
                                    stats={stats}
                                    realtimeDatasets={chartData}
                                    onRefresh={refreshDashboard}
                                    isRefreshing={isRefreshing}
                                    lastUpdated={lastUpdated}
                                />
                            </div>

                            {/* Right (4 cols): Aktivitas Pesan Terkini (Mantis Styled Card) */}
                            <div className="lg:col-span-4 bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] mb-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-[#262626]">
                                                Aktivitas Pesan Terkini
                                            </h3>
                                            <p className="text-xs text-[#8c8c8c] mt-0.5">
                                                5 interaksi WhatsApp terbaru
                                            </p>
                                        </div>
                                        <Link href="/inbox" prefetch>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-[#1677ff] hover:text-[#0958d9] hover:bg-[#e6f4ff] font-semibold cursor-pointer rounded-lg flex items-center gap-1 h-8"
                                            >
                                                <span>Inbox</span>
                                                <ArrowRight className="size-3.5" />
                                            </Button>
                                        </Link>
                                    </div>

                                    <div className="space-y-3.5">
                                        {messagesList.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 text-center text-[#8c8c8c] space-y-2">
                                                <div className="size-10 rounded-full bg-[#fafafb] border border-[#f0f0f0] flex items-center justify-center text-[#bfbfbf]">
                                                    <MessageSquare className="size-5" />
                                                </div>
                                                <p className="text-xs font-semibold text-[#262626]">Belum Ada Aktivitas Pesan</p>
                                                <p className="text-[11px] text-[#8c8c8c] max-w-[200px]">
                                                    Pesan masuk & keluar akan muncul secara realtime di sini.
                                                </p>
                                            </div>
                                        ) : (
                                            messagesList.slice(0, 5).map((msg) => (
                                                <div key={msg.id} className="flex items-center justify-between gap-3 text-xs">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <Avatar className="size-9 bg-[#e6f4ff] border border-[#91caff] shrink-0">
                                                            <AvatarFallback className="bg-[#e6f4ff] text-[#1677ff] font-bold text-xs">
                                                                {msg.receiver_number ? msg.receiver_number.slice(-2) : 'WA'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0 space-y-0.5">
                                                            <p className="text-xs font-bold text-[#262626] truncate font-mono tabular-nums">
                                                                {msg.receiver_number}
                                                            </p>
                                                            <p className="text-[11px] text-[#8c8c8c] truncate max-w-[140px] sm:max-w-[170px]">
                                                                {msg.content || 'Pesan teks terkirim'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0 space-y-1">
                                                        {msg.status === 'read' ? (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                                                READ
                                                            </span>
                                                        ) : msg.status === 'delivered' ? (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                                                                DELIVERED
                                                            </span>
                                                        ) : msg.status === 'failed' ? (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#fff1f0] text-[#ff4d4f] border border-[#ffccc7]">
                                                                FAILED
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-[#fafafb] text-[#595959] border border-[#d9d9d9] uppercase">
                                                                {msg.status || 'SENT'}
                                                            </span>
                                                        )}
                                                        <span className="text-[10px] font-mono text-[#8c8c8c] tabular-nums">
                                                            {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between text-xs text-[#8c8c8c] mt-4">
                                    <span>Total Terkirim Hari Ini:</span>
                                    <strong className="font-mono font-bold text-[#1677ff]">{stats?.sent_today || 0} pesan</strong>
                                </div>
                            </div>
                        </div>

                        {/* ROW 4: LOG RIWAYAT PENGIRIMAN PESAN TABLE */}
                        <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#f0f0f0]">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-[#262626]">
                                            Log Riwayat Pengiriman Pesan
                                        </h3>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1677ff] bg-[#e6f4ff] px-2 py-0.2 rounded border border-[#91caff]">
                                            REALTIME
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#8c8c8c] mt-0.5">
                                        Log realtime pesan keluar dan status konfirmasi penerimaan WhatsApp gateway
                                    </p>
                                </div>
                                <Link href="/broadcast" prefetch>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.02)] transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>Lihat Riwayat Broadcast</span>
                                        <ArrowRight className="size-3.5 text-[#8c8c8c]" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                                    <thead>
                                        <tr className="bg-[#fafafb] text-[#595959] font-semibold border-b border-[#f0f0f0]">
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Penerima & Nomor</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Isi Ringkasan</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider hidden md:table-cell">Perangkat</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Status</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f0f0]">
                                        {messagesList.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-10 text-center text-xs text-[#8c8c8c]">
                                                    <div className="flex flex-col items-center justify-center space-y-2">
                                                        <div className="size-10 rounded-full bg-[#fafafb] border border-[#f0f0f0] flex items-center justify-center text-[#bfbfbf]">
                                                            <MessageSquare className="size-5" />
                                                        </div>
                                                        <p className="text-xs font-semibold text-[#262626]">
                                                            Belum Ada Riwayat Pesan
                                                        </p>
                                                        <p className="text-[11px] text-[#8c8c8c] max-w-sm">
                                                            Pesan yang dikirim melalui REST API, broadcast massal, atau inbox akan muncul secara realtime di sini.
                                                        </p>
                                                        <Link href="/broadcast" className="pt-2">
                                                            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold rounded-lg border-[#91caff] text-[#1677ff] hover:bg-[#e6f4ff]">
                                                                Mulai Broadcast Baru
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            messagesList.map((msg) => (
                                                <tr key={msg.id} className="hover:bg-[#fafafb] transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center text-xs font-semibold shrink-0 border border-[#91caff]">
                                                                <Send className="size-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-xs font-bold text-[#262626] truncate tabular-nums">
                                                                    {msg.receiver_number}
                                                                </div>
                                                                <div className="text-[10px] text-[#8c8c8c] capitalize truncate">
                                                                    Tipe: {msg.message_type || 'Teks'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs text-[#595959]">
                                                        <div className="truncate max-w-[200px] xl:max-w-[320px]" title={msg.content}>
                                                            {msg.content || 'Pesan terkirim'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 hidden md:table-cell text-xs">
                                                        <span className="font-medium text-[#262626] truncate block max-w-[130px]" title={msg.device?.name || 'Gateway Node'}>
                                                            {msg.device?.name || 'Gateway Node'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        {msg.status === 'read' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                                                <CheckCheck className="size-3 text-[#52c41a]" />
                                                                READ
                                                            </span>
                                                        ) : msg.status === 'delivered' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                                                                <CheckCheck className="size-3 text-[#1677ff]" />
                                                                DELIVERED
                                                            </span>
                                                        ) : msg.status === 'failed' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#fff1f0] text-[#ff4d4f] border border-[#ffccc7]">
                                                                <AlertCircle className="size-3 text-[#ff4d4f]" />
                                                                FAILED
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#fafafb] text-[#595959] border border-[#d9d9d9] uppercase">
                                                                <Check className="size-3 text-[#8c8c8c]" />
                                                                {msg.status || 'SENT'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs text-[#8c8c8c] text-right font-mono tabular-nums">
                                                        {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* ROW 5: QUICK ACTIONS (LAUNCHPAD) & DUAL SERVER INFRASTRUCTURE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* WIDGET 1: Dual Server Architecture Status */}
                            <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-9 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center border border-[#91caff]">
                                            <Server className="size-4.5 text-[#1677ff]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[#262626]">
                                                Status Dual Server WA
                                            </h3>
                                            <p className="text-[11px] text-[#8c8c8c]">
                                                Redundansi otomatis tanpa downtime
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#52c41a] bg-[#f6ffed] px-2 py-0.5 rounded border border-[#b7eb8f]">
                                        <span className="size-1.5 rounded-full bg-[#52c41a] animate-pulse" />
                                        NORMAL
                                    </span>
                                </div>

                                <div className="p-3.5 rounded-lg border border-[#e6ebf1] bg-[#fafafb] space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="size-2 rounded-full bg-[#52c41a] animate-pulse" />
                                            <span className="font-bold text-xs text-[#262626]">
                                                SAPA UltraSync Engine
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-[#1677ff] bg-[#e6f4ff] px-2 py-0.2 rounded border border-[#91caff]">
                                            OPERASIONAL
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-[#8c8c8c] leading-relaxed">
                                        Engine enterprise berkinerja tinggi dengan enkripsi native instan & bebas kendala "Menunggu pesan ini".
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-[#f0f0f0] text-[#595959]">
                                        <div>
                                            <span className="text-[#8c8c8c] block text-[10px]">Runtime:</span>
                                            <span className="font-semibold text-[#262626]">FrankenPHP + Octane</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[#8c8c8c] block text-[10px]">Stabilitas:</span>
                                            <span className="font-mono font-bold text-[#1677ff]">99.9% Uptime</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* WIDGET 2: Quick Action Launchpad */}
                            <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-2.5 pb-3 border-b border-[#f0f0f0]">
                                        <div className="size-9 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center border border-[#91caff]">
                                            <Zap className="size-4.5 text-[#1677ff]" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-[#262626]">
                                                Pintasan Operasional
                                            </h3>
                                            <p className="text-[11px] text-[#8c8c8c]">
                                                Akses cepat ke seluruh fitur utama gateway
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 pt-3">
                                        {quickActions.slice(0, 4).map((action, idx) => {
                                            const ActionIcon = action.icon;
                                            const content = (
                                                <div className="group flex items-center justify-between p-2.5 rounded-lg border border-[#f0f0f0] bg-[#fafafb] hover:bg-[#e6f4ff]/40 hover:border-[#91caff] transition-all cursor-pointer">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="size-8 rounded-lg bg-white text-[#595959] group-hover:bg-[#1677ff] group-hover:text-white border border-[#e6ebf1] flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                                                            <ActionIcon className="size-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="text-xs font-semibold text-[#262626] truncate group-hover:text-[#1677ff] transition-colors">
                                                                {action.title}
                                                            </div>
                                                            <div className="text-[11px] text-[#8c8c8c] truncate">
                                                                {action.subtitle}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="size-3.5 text-[#bfbfbf] group-hover:text-[#1677ff] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                                                </div>
                                            );

                                            return action.href ? (
                                                <Link key={idx} href={action.href} className="block">
                                                    {content}
                                                </Link>
                                            ) : (
                                                <div key={idx} onClick={action.onClick}>
                                                    {content}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ================= TAB 2: THROUGHPUT & GRAFIK ================= */}
                    <TabsContent value="analytics" className="space-y-6">
                        <InteractiveThroughputChart
                            stats={stats}
                            realtimeDatasets={chartData}
                            onRefresh={refreshDashboard}
                            isRefreshing={isRefreshing}
                            lastUpdated={lastUpdated}
                        />
                    </TabsContent>

                    {/* ================= TAB 3: DUAL SERVER & GATEWAY ================= */}
                    <TabsContent value="infrastructure" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* SAPA UltraSync Engine Card */}
                            <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#52c41a] animate-pulse" />
                                        <h3 className="text-sm font-bold text-[#262626]">
                                            SAPA UltraSync Engine
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#1677ff] bg-[#e6f4ff] px-2 py-0.2 rounded border border-[#91caff]">
                                        OPERASIONAL
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs text-[#595959] leading-relaxed">
                                        Engine tunggal berkinerja tinggi dengan protokol enkripsi Signal native. Menjamin pesan terbuka instan tanpa status "Menunggu pesan ini".
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                        <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0]">
                                            <span className="text-[#8c8c8c] block text-[11px]">Enkripsi E2EE</span>
                                            <span className="font-mono font-bold text-[#1677ff] text-sm">Resmi Meta</span>
                                        </div>
                                        <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0]">
                                            <span className="text-[#8c8c8c] block text-[11px]">Stabilitas Sesi</span>
                                            <span className="font-mono font-bold text-[#262626] text-sm">Anti-Ban Sesi</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Laravel Octane + FrankenPHP Card */}
                            <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
                                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#1677ff] animate-pulse" />
                                        <h3 className="text-sm font-bold text-[#262626]">
                                            Laravel Octane & FrankenPHP
                                        </h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-[#52c41a] bg-[#f6ffed] px-2 py-0.2 rounded border border-[#b7eb8f]">
                                        TUNED UP
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <p className="text-xs text-[#595959] leading-relaxed">
                                        Aplikasi berjalan dalam persistent memory worker pool dengan waktu respon sub-milidetik, efisiensi CPU maksimal, dan auto-reload.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                        <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0]">
                                            <span className="text-[#8c8c8c] block text-[11px]">Server Engine</span>
                                            <span className="font-mono font-bold text-[#1677ff] text-sm">FrankenPHP Caddy</span>
                                        </div>
                                        <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0]">
                                            <span className="text-[#8c8c8c] block text-[11px]">Worker Concurrency</span>
                                            <span className="font-mono font-bold text-[#262626] text-sm">Multi-Worker</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Connected Devices Table (Mantis Styled Table) */}
                        <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#f0f0f0]">
                                <div>
                                    <h3 className="text-sm font-bold text-[#262626]">
                                        Daftar Perangkat Terhubung
                                    </h3>
                                    <p className="text-xs text-[#8c8c8c] mt-0.5">
                                        {devicesList?.length || 0} dari {maxAllowedDevices} slot perangkat aktif digunakan
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setIsQrModalOpen(true)}
                                    disabled={isDeviceLimitReached}
                                    className="h-9 px-3.5 text-xs font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.043)] transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tautkan Perangkat Baru</span>
                                </Button>
                            </div>

                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left text-xs border-collapse min-w-[560px]">
                                    <thead>
                                        <tr className="bg-[#fafafb] text-[#595959] font-semibold border-b border-[#f0f0f0]">
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Nama Perangkat</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Nomor WhatsApp</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Engine</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Status</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f0f0]">
                                        {devicesList?.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-8 text-center text-xs text-[#8c8c8c]">
                                                    Belum ada nomor WhatsApp yang ditautkan ke gateway ini.
                                                </td>
                                            </tr>
                                        ) : (
                                            devicesList.map((device) => (
                                                <tr key={device.id} className="hover:bg-[#fafafb] transition-colors">
                                                    <td className="py-3.5 px-4 font-semibold text-[#262626]">
                                                        {device.name}
                                                    </td>
                                                    <td className="py-3.5 px-4 font-mono text-[#595959]">
                                                        {device.phone_number || '-'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs uppercase font-mono text-[#8c8c8c]">
                                                        UltraSync Engine
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold ${
                                                            device.status === 'connected'
                                                                ? 'bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]'
                                                                : 'bg-[#fafafb] text-[#8c8c8c] border border-[#d9d9d9]'
                                                        }`}>
                                                            <span className={`size-1.5 rounded-full ${
                                                                device.status === 'connected' ? 'bg-[#52c41a]' : 'bg-[#8c8c8c]'
                                                            }`} />
                                                            {device.status === 'connected' ? 'CONNECTED' : (device.status || 'OFFLINE').toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <Link href="/devices" prefetch>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs font-semibold text-[#1677ff] hover:text-[#0958d9] hover:bg-[#e6f4ff] rounded-lg"
                                                            >
                                                                Kelola
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ================= TAB 4: LOG RIWAYAT PESAN ================= */}
                    <TabsContent value="logs" className="space-y-6">
                        <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#f0f0f0]">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-[#262626]">
                                            Log Pengiriman Pesan Terkini
                                        </h3>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#1677ff] bg-[#e6f4ff] px-2 py-0.2 rounded border border-[#91caff]">
                                            REALTIME
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#8c8c8c] mt-0.5">
                                        Log realtime pesan keluar dan status konfirmasi penerimaan WhatsApp gateway
                                    </p>
                                </div>
                                <Link href="/broadcast" prefetch>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.02)] transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <span>Buka Modul Broadcast</span>
                                        <ArrowRight className="size-3.5 text-[#8c8c8c]" />
                                    </Button>
                                </Link>
                            </div>

                            <div className="overflow-x-auto no-scrollbar">
                                <table className="w-full text-left text-xs border-collapse min-w-[620px]">
                                    <thead>
                                        <tr className="bg-[#fafafb] text-[#595959] font-semibold border-b border-[#f0f0f0]">
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Penerima & Nomor</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Isi Ringkasan</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider hidden md:table-cell">Perangkat</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Status</th>
                                            <th className="py-3 px-4 uppercase text-[11px] tracking-wider text-right">Waktu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#f0f0f0]">
                                        {messagesList.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="py-10 text-center text-xs text-[#8c8c8c]">
                                                    <div className="flex flex-col items-center justify-center space-y-2">
                                                        <div className="size-10 rounded-full bg-[#fafafb] border border-[#f0f0f0] flex items-center justify-center text-[#bfbfbf]">
                                                            <MessageSquare className="size-5" />
                                                        </div>
                                                        <p className="text-xs font-semibold text-[#262626]">
                                                            Belum Ada Riwayat Pesan
                                                        </p>
                                                        <p className="text-[11px] text-[#8c8c8c] max-w-sm">
                                                            Pesan yang dikirim melalui REST API, broadcast massal, atau inbox akan muncul secara realtime di sini.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            messagesList.map((msg) => (
                                                <tr key={msg.id} className="hover:bg-[#fafafb] transition-colors">
                                                    <td className="py-3.5 px-4">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center text-xs font-semibold shrink-0 border border-[#91caff]">
                                                                <Send className="size-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-xs font-bold text-[#262626] truncate tabular-nums">
                                                                    {msg.receiver_number}
                                                                </div>
                                                                <div className="text-[10px] text-[#8c8c8c] capitalize truncate">
                                                                    Tipe: {msg.message_type || 'Teks'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs text-[#595959]">
                                                        <div className="truncate max-w-[200px] xl:max-w-[320px]" title={msg.content}>
                                                            {msg.content || 'Pesan terkirim'}
                                                        </div>
                                                    </td>
                                                    <td className="py-3.5 px-4 hidden md:table-cell text-xs">
                                                        <span className="font-medium text-[#262626] truncate block max-w-[130px]" title={msg.device?.name || 'Gateway Node'}>
                                                            {msg.device?.name || 'Gateway Node'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4">
                                                        {msg.status === 'read' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                                                <CheckCheck className="size-3 text-[#52c41a]" />
                                                                READ
                                                            </span>
                                                        ) : msg.status === 'delivered' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                                                                <CheckCheck className="size-3 text-[#1677ff]" />
                                                                DELIVERED
                                                            </span>
                                                        ) : msg.status === 'failed' ? (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#fff1f0] text-[#ff4d4f] border border-[#ffccc7]">
                                                                <AlertCircle className="size-3 text-[#ff4d4f]" />
                                                                FAILED
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-[#fafafb] text-[#595959] border border-[#d9d9d9] uppercase">
                                                                <Check className="size-3 text-[#8c8c8c]" />
                                                                {msg.status || 'SENT'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-xs text-[#8c8c8c] text-right font-mono tabular-nums">
                                                        {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* QR SCAN MODAL */}
            <QrScanModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                canAddDevice={!isDeviceLimitReached}
                maxDevices={maxAllowedDevices}
                currentCount={devicesList?.length || 0}
                planName={stats?.plan_name || 'Starter Lite'}
            />

            {/* DURATION ADJUST MODAL (SUPER ADMIN ONLY) */}
            {isSuperAdmin && (
                <DurationAdjustModal
                    isOpen={isDurationModalOpen}
                    onClose={() => setIsDurationModalOpen(false)}
                    subscriptionId={subscription?.id || 1}
                    currentEndDate={stats?.ends_at}
                />
            )}

            {/* ONBOARDING QUICK GUIDE MODAL */}
            <OnboardingGuideModal
                isOpen={isGuideModalOpen}
                onClose={() => setIsGuideModalOpen(false)}
            />
        </AppLayout>
    );
}
