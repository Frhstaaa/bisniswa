import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
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
import { Progress } from '../Components/ui/progress';
import { Avatar, AvatarFallback } from '../Components/ui/avatar';
import { cn } from '../lib/utils';

export default function Dashboard({ workspace, subscription, stats, recentMessages = [], devices = [], chartData }) {
    const { props } = usePage();
    const user = props.auth?.user || {};
    const isSuperAdmin = user.role === 'superadmin';
    const maxAllowedDevices = stats?.max_devices ?? (subscription?.plan?.limits?.max_devices ?? 1);
    const connectedCount = stats?.connected_devices ?? devices.filter((d) => d.status === 'connected').length;
    const isDeviceLimitReached = (devices?.length || 0) >= maxAllowedDevices;

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
            title: 'Buku Kontak & Import CSV',
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
            subtitle: 'Tautkan nomor baru ke BisnisWA UltraSync Engine',
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
        <AppLayout title="Ikhtisar Operasional">
            <Head title="Ikhtisar Gateway & Broadcast — MARDIRA WA" />

            <div className="space-y-6">
                {/* 1. TOP DASHBOARD HEADER */}
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between pb-6 border-b border-slate-200/80">
                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-slate-900">
                                {workspace?.name || 'Workspace'} <span className="font-editorial-italic font-normal text-slate-800">Operasional</span>
                            </h1>
                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#1e50ff] font-bold text-[9.5px] sm:text-[11px] px-2 py-0.5 gap-1 shadow-2xs">
                                <Sparkles className="size-2.5 sm:size-3 text-[#1e50ff]" />
                                {stats?.plan_name || 'Starter Lite'}
                            </Badge>
                            <Badge variant="secondary" className="gap-1 font-medium text-slate-600 text-[9.5px] sm:text-[11px] px-2 py-0.5">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Dual Server Aktif
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500">
                            Monitoring real-time throughput pesan WhatsApp, status gateway multi-server, dan alokasi kuota broadcast.
                        </p>
                    </div>

                    {/* Integrated Action Cluster */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Live Sync Pill with Direct Refresh */}
                        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-2xs text-xs text-slate-600 gap-2">
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex size-full rounded-full bg-blue-400 opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-[#1e50ff]" />
                            </span>
                            <span className="text-slate-400 font-normal hidden sm:inline">Sync:</span>
                            <span className="font-mono font-bold text-slate-800 tabular-nums">
                                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <button
                                type="button"
                                onClick={refreshDashboard}
                                disabled={isRefreshing}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-[#1e50ff] transition-colors disabled:opacity-50 cursor-pointer"
                                title="Segarkan data realtime sekarang"
                            >
                                <RefreshCw className={cn('size-3.5 text-[#1e50ff]', isRefreshing && 'animate-spin')} />
                            </button>
                        </div>

                        {/* Guide Modal Trigger */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsGuideModalOpen(true)}
                            className="cursor-pointer gap-1.5 text-xs text-slate-700 hover:text-[#1e50ff] hover:border-[#1e50ff] rounded-xl h-9 font-semibold"
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
                                className="cursor-pointer gap-1.5 text-xs text-slate-700 hover:text-[#1e50ff] hover:border-[#1e50ff] rounded-xl h-9 font-semibold"
                            >
                                <Calendar className="size-3.5 text-slate-500" />
                                <span>Kelola Durasi</span>
                            </Button>
                        )}

                        {/* Primary Action Button */}
                        {isDeviceLimitReached ? (
                            <Link href="/subscriptions">
                                <Button
                                    size="sm"
                                    className="bg-[#1e50ff] hover:bg-[#153ec7] text-white gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer text-xs font-bold rounded-xl h-9 px-4 active:scale-95 transition-all"
                                >
                                    <Sparkles className="size-3.5" />
                                    <span>Upgrade Slot ({devices?.length || 0}/{maxAllowedDevices})</span>
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => setIsQrModalOpen(true)}
                                className="bg-[#1e50ff] hover:bg-[#153ec7] text-white gap-1.5 shadow-md shadow-blue-500/25 cursor-pointer text-xs font-bold rounded-xl h-9 px-4 active:scale-95 transition-all"
                            >
                                <Plus className="size-4" />
                                <span>Tautkan Perangkat WA</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* 2. TABS NAVIGATION (Mobile Scrollable) */}
                <Tabs defaultValue="overview" className="space-y-6">
                    <div className="overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
                        <TabsList className="bg-slate-100/90 border border-slate-200/80 p-1 rounded-xl inline-flex min-w-full sm:min-w-0">
                            <TabsTrigger value="overview" className="rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap data-[state=active]:bg-[#1e50ff] data-[state=active]:text-white data-[state=active]:shadow-xs">Ikhtisar Utama</TabsTrigger>
                            <TabsTrigger value="analytics" className="rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap data-[state=active]:bg-[#1e50ff] data-[state=active]:text-white data-[state=active]:shadow-xs">Throughput & Grafik</TabsTrigger>
                            <TabsTrigger value="infrastructure" className="rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap data-[state=active]:bg-[#1e50ff] data-[state=active]:text-white data-[state=active]:shadow-xs">Dual Server & Gateway</TabsTrigger>
                            <TabsTrigger value="logs" className="rounded-lg px-3.5 py-1.5 text-xs font-bold whitespace-nowrap data-[state=active]:bg-[#1e50ff] data-[state=active]:text-white data-[state=active]:shadow-xs">Log Riwayat Pesan</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* TAB 1: IKHTISAR UTAMA (THE CLASSIC SHADCN DASHBOARD LAYOUT) */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* 4 HARMONIOUS METRIC CARDS */}
                        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Metric 1: Pesan Hari Ini */}
                            <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
                                <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Pesan Hari Ini
                                    </CardTitle>
                                    <div className="size-8 rounded-lg bg-blue-50 text-[#1e50ff] flex items-center justify-center">
                                        <Send className="size-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 space-y-2.5">
                                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                                        <CountUp to={stats?.sent_today || 0} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Sukses: <strong className="text-[#1e50ff] font-mono">{stats?.delivery_rate || '100%'}</strong></span>
                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#1e50ff] text-[10px] py-0 px-1.5 font-bold">
                                            +18.4%
                                        </Badge>
                                    </div>
                                    <Progress
                                        value={parseFloat(stats?.delivery_rate || '100')}
                                        className="h-1.5 bg-slate-100"
                                        indicatorClassName="bg-[#1e50ff]"
                                    />
                                </CardContent>
                                <CardFooter className="p-0 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-3">
                                    <span>Jam Sibuk:</span>
                                    <span className="font-mono font-medium text-slate-700 truncate max-w-[140px]">
                                        {stats?.busiest_hour || '10:00 – 15:00 WIB'}
                                    </span>
                                </CardFooter>
                            </Card>

                            {/* Metric 2: Slot Nomor Terhubung */}
                            <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
                                <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Slot Nomor WA
                                    </CardTitle>
                                    <div className="size-8 rounded-lg bg-blue-50 text-[#1e50ff] flex items-center justify-center">
                                        <Smartphone className="size-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 space-y-2.5">
                                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                                        <CountUp to={stats?.connected_devices || 0} />{' '}
                                        <span className="text-sm font-normal text-slate-400">
                                            / {stats?.max_devices || 1} Slot
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Kapasitas: <strong className="text-slate-800 font-mono">{devicePercent}%</strong></span>
                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold text-slate-600">
                                            Dual-Server
                                        </Badge>
                                    </div>
                                    <Progress
                                        value={devicePercent}
                                        className="h-1.5 bg-slate-100"
                                        indicatorClassName="bg-[#1e50ff]"
                                    />
                                </CardContent>
                                <CardFooter className="p-0 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-3">
                                    <span>Status Gateway:</span>
                                    <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {(stats?.connected_devices || 0) > 0 ? 'Online & Siap' : 'Perlu Scan QR'}
                                    </span>
                                </CardFooter>
                            </Card>

                            {/* Metric 3: Sisa Kuota Pesan */}
                            <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
                                <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Sisa Kuota Pesan
                                    </CardTitle>
                                    <div className="size-8 rounded-lg bg-blue-50 text-[#1e50ff] flex items-center justify-center">
                                        <Zap className="size-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 space-y-2.5">
                                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                                        <CountUp to={stats?.remaining_quota || 0} />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Tersedia: <strong className="text-[#1e50ff] font-mono">{quotaPercent}%</strong></span>
                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#1e50ff] text-[10px] py-0 px-1.5 font-bold">
                                            {(stats?.monthly_quota || 5000).toLocaleString('id-ID')} /bln
                                        </Badge>
                                    </div>
                                    <Progress
                                        value={quotaPercent}
                                        className="h-1.5 bg-slate-100"
                                        indicatorClassName="bg-[#1e50ff]"
                                    />
                                </CardContent>
                                <CardFooter className="p-0 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-3">
                                    <span>Terpakai Siklus Ini:</span>
                                    <span className="font-mono font-medium text-slate-700">
                                        {quotaUsed.toLocaleString('id-ID')} pesan
                                    </span>
                                </CardFooter>
                            </Card>

                            {/* Metric 4: Sisa Masa Aktif */}
                            <Card className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between">
                                <CardHeader className="p-0 flex flex-row items-center justify-between space-y-0 pb-3">
                                    <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Sisa Masa Aktif
                                    </CardTitle>
                                    <div className="size-8 rounded-lg bg-blue-50 text-[#1e50ff] flex items-center justify-center">
                                        <Clock className="size-4" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 space-y-2.5">
                                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono tabular-nums">
                                        {stats?.days_remaining || 0}{' '}
                                        <span className="text-sm font-normal text-slate-400">Hari</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500">
                                        <span>Kelangsungan: <strong className="text-slate-800 font-mono">{cyclePercent}%</strong></span>
                                        <Badge
                                            variant={(stats?.days_remaining || 0) > 5 ? 'outline' : 'destructive'}
                                            className={cn(
                                                'text-[10px] py-0 px-1.5 font-bold',
                                                (stats?.days_remaining || 0) > 5 && 'border-blue-200 bg-blue-50 text-[#1e50ff]'
                                            )}
                                        >
                                            {(stats?.days_remaining || 0) > 0 ? 'AKTIF' : 'EXPIRED'}
                                        </Badge>
                                    </div>
                                    <Progress
                                        value={cyclePercent}
                                        className="h-1.5 bg-slate-100"
                                        indicatorClassName={(stats?.days_remaining || 0) > 5 ? 'bg-[#1e50ff]' : 'bg-amber-500'}
                                    />
                                </CardContent>
                                <CardFooter className="p-0 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 mt-3">
                                    <span>Grace Period:</span>
                                    <span className="font-medium text-slate-700">3 Hari Toleransi</span>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* MAIN 2-COLUMN GRID (Col-span-4 Throughput + Col-span-3 Recent Sales Activity) */}
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                            {/* Col-span-4: Realtime Throughput Chart */}
                            <div className="col-span-full lg:col-span-4">
                                <InteractiveThroughputChart
                                    stats={stats}
                                    realtimeDatasets={chartData}
                                    onRefresh={refreshDashboard}
                                    isRefreshing={isRefreshing}
                                    lastUpdated={lastUpdated}
                                />
                            </div>

                            {/* Col-span-3: Recent Messages */}
                            <Card className="col-span-full lg:col-span-3 rounded-2xl border border-slate-200/80 bg-white p-5 flex flex-col justify-between shadow-xs">
                                <CardHeader className="p-0 flex flex-row items-center justify-between pb-3">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-bold text-slate-900">
                                            Aktivitas <span className="font-editorial-italic font-normal text-slate-800">Terkini</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs text-slate-500">
                                            5 interaksi pesan WhatsApp terakhir yang diproses
                                        </CardDescription>
                                    </div>
                                    <Link href="/inbox">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-[#1e50ff] hover:text-[#153ec7] hover:bg-blue-50 font-bold cursor-pointer rounded-lg"
                                        >
                                            Inbox
                                        </Button>
                                    </Link>
                                </CardHeader>
                                <CardContent className="p-0 space-y-4 pt-1 flex-1">
                                    {recentMessages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 space-y-2">
                                            <MessageSquare className="size-8 text-slate-300" />
                                            <p className="text-xs font-semibold text-slate-700">Belum Ada Aktivitas Pesan</p>
                                            <p className="text-[11px] text-slate-400 max-w-[200px]">
                                                Pesan masuk & keluar akan muncul secara realtime di sini.
                                            </p>
                                        </div>
                                    ) : (
                                        recentMessages.slice(0, 5).map((msg) => (
                                            <div key={msg.id} className="flex items-center justify-between gap-3 text-xs">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar className="size-9 bg-blue-50 border border-blue-100 shrink-0">
                                                        <AvatarFallback className="bg-blue-50 text-[#1e50ff] font-bold text-xs">
                                                            {msg.receiver_number ? msg.receiver_number.slice(-2) : 'WA'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0 space-y-0.5">
                                                        <p className="text-xs font-bold text-slate-900 truncate font-mono tabular-nums">
                                                            {msg.receiver_number}
                                                        </p>
                                                        <p className="text-[11px] text-slate-500 truncate max-w-[140px] sm:max-w-[180px]">
                                                            {msg.content || 'Pesan teks terkirim'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0 space-y-1">
                                                    {msg.status === 'read' ? (
                                                        <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] py-0 px-1.5 font-bold">
                                                            READ
                                                        </Badge>
                                                    ) : msg.status === 'delivered' ? (
                                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#1e50ff] text-[10px] py-0 px-1.5 font-bold">
                                                            DELIVERED
                                                        </Badge>
                                                    ) : msg.status === 'failed' ? (
                                                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-bold">
                                                            FAILED
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold uppercase text-slate-600">
                                                            {msg.status || 'SENT'}
                                                        </Badge>
                                                    )}
                                                    <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                                                        {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>
                                <CardFooter className="p-0 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 mt-3">
                                    <span className="text-[11px]">Total Hari Ini:</span>
                                    <span className="font-mono font-bold text-[#1e50ff]">{stats?.sent_today || 0} pesan</span>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* FULL DATA TABLE: Recent Messages & Delivery Activity */}
                        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                                            Log Riwayat <span className="font-editorial-italic font-normal text-slate-800">Pengiriman Pesan</span>
                                        </CardTitle>
                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#1e50ff] text-[10px] font-bold py-0 px-2">
                                            REALTIME
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                        Log realtime pesan keluar dan status konfirmasi penerimaan WhatsApp gateway
                                    </CardDescription>
                                </div>
                                <Link href="/broadcast">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs text-slate-700 hover:text-[#1e50ff] hover:border-[#1e50ff] font-semibold h-8 gap-1.5 cursor-pointer rounded-lg"
                                    >
                                        <span>Lihat Riwayat Broadcast</span>
                                        <ArrowRight className="size-3.5" />
                                    </Button>
                                </Link>
                            </CardHeader>

                            <CardContent className="p-0 overflow-x-auto touch-pan-x no-scrollbar">
                                <Table className="min-w-[620px] sm:min-w-0">
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/80 border-slate-200/70 hover:bg-slate-50/80">
                                            <TableHead className="w-[190px] text-xs font-semibold text-slate-600 pl-6">
                                                Penerima & Nomor
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-600">
                                                Isi Ringkasan
                                            </TableHead>
                                            <TableHead className="w-[140px] hidden md:table-cell text-xs font-semibold text-slate-600">
                                                Perangkat
                                            </TableHead>
                                            <TableHead className="w-[120px] text-xs font-semibold text-slate-600">
                                                Status
                                            </TableHead>
                                            <TableHead className="w-[90px] text-xs font-semibold text-slate-600 text-right pr-6">
                                                Waktu
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentMessages.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center space-y-2">
                                                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <MessageSquare className="size-5" />
                                                        </div>
                                                        <p className="text-xs font-semibold text-slate-700">
                                                            Belum Ada Riwayat Pesan
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 max-w-sm">
                                                            Pesan yang dikirim melalui REST API, broadcast massal, atau inbox akan muncul secara realtime di sini.
                                                        </p>
                                                        <Link href="/broadcast" className="pt-2">
                                                            <Button size="sm" variant="outline" className="h-8 text-xs font-semibold rounded-xl border-blue-200 text-[#1e50ff] hover:bg-blue-50">
                                                                Mulai Broadcast Baru
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            recentMessages.map((msg) => (
                                                <TableRow key={msg.id} className="hover:bg-slate-50/70 border-slate-100 transition-colors">
                                                    <TableCell className="py-3 pl-6">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-8 rounded-lg bg-blue-50 text-[#1e50ff] flex items-center justify-center text-xs font-semibold shrink-0 border border-blue-100">
                                                                <Send className="size-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-xs font-bold text-slate-900 truncate tabular-nums">
                                                                    {msg.receiver_number}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 capitalize truncate">
                                                                    Tipe: {msg.message_type || 'Teks'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-slate-600">
                                                        <div className="truncate max-w-[200px] xl:max-w-[280px]" title={msg.content}>
                                                            {msg.content}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 hidden md:table-cell text-xs">
                                                        <span className="font-medium text-slate-700 truncate block max-w-[130px]" title={msg.device?.name || 'Gateway Node'}>
                                                            {msg.device?.name || 'Gateway Node'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        {msg.status === 'read' ? (
                                                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] py-0 px-2 font-bold gap-1">
                                                                <CheckCheck className="size-3 text-emerald-600" />
                                                                READ
                                                            </Badge>
                                                        ) : msg.status === 'delivered' ? (
                                                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] py-0 px-2 font-bold gap-1">
                                                                <CheckCheck className="size-3 text-blue-600" />
                                                                DELIVERED
                                                            </Badge>
                                                        ) : msg.status === 'failed' ? (
                                                            <Badge variant="destructive" className="text-[10px] py-0 px-2 font-bold gap-1">
                                                                <AlertCircle className="size-3 text-rose-600" />
                                                                FAILED
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px] py-0 px-2 font-bold gap-1 uppercase text-slate-600">
                                                                <Check className="size-3 text-slate-500" />
                                                                {msg.status || 'SENT'}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-slate-500 text-right font-mono pr-6 tabular-nums">
                                                        {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* LOWER 2-COLUMN GRID */}
                        <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                            {/* WIDGET 1: Dual Server Architecture Status */}
                            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
                                <CardHeader className="p-0 flex flex-row items-center justify-between pb-3 border-b border-slate-100 space-y-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-8 rounded-lg bg-blue-50 text-[#1e50ff] flex items-center justify-center border border-blue-100 shadow-2xs">
                                            <Server className="size-4 text-[#1e50ff]" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-sm font-bold text-slate-900 tracking-tight">
                                                Status Dual Server <span className="font-editorial-italic font-normal text-slate-800">WA</span>
                                            </CardTitle>
                                            <CardDescription className="text-[11px] text-slate-400">
                                                Redundansi otomatis tanpa downtime
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#1e50ff] text-[10px] font-bold gap-1.5">
                                        <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        NORMAL
                                    </Badge>
                                </CardHeader>

                                <CardContent className="p-0 space-y-3 pt-0">
                                    <div className="p-3.5 rounded-xl border border-blue-200/80 bg-blue-50/20 hover:bg-blue-50/40 transition-colors space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="font-bold text-xs text-slate-900">
                                                    BisnisWA UltraSync Engine
                                                </span>
                                            </div>
                                            <Badge variant="outline" className="border-blue-300 bg-blue-50 text-[#1e50ff] text-[10px] font-bold">
                                                OPERASIONAL
                                            </Badge>
                                        </div>
                                        <p className="text-[11px] text-slate-500 leading-relaxed">
                                            Engine enterprise berkinerja tinggi dengan enkripsi native instan & bebas kendala "Menunggu pesan ini".
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1.5 border-t border-blue-100 text-slate-600">
                                            <div>
                                                <span className="text-slate-400 block text-[10px]">Runtime:</span>
                                                <span className="font-semibold text-slate-800">FrankenPHP + Octane</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-slate-400 block text-[10px]">Stabilitas:</span>
                                                <span className="font-mono font-bold text-[#1e50ff]">99.9% Uptime</span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* WIDGET 2: Quick Action Launchpad */}
                            <Card className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                                <CardHeader className="p-0 flex flex-row items-center gap-2.5 pb-3 border-b border-slate-100 space-y-0">
                                    <div className="size-8 rounded-lg bg-blue-50 text-[#1e50ff] flex items-center justify-center border border-blue-100 shadow-2xs">
                                        <Zap className="size-4 text-[#1e50ff]" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-900 tracking-tight">
                                            Aksi Cepat <span className="font-editorial-italic font-normal text-slate-800">Workspace</span>
                                        </CardTitle>
                                        <CardDescription className="text-[11px] text-slate-400">
                                            Pintasan langsung ke modul operasional gateway
                                        </CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="p-0 space-y-2 pt-2 flex-1">
                                    {quickActions.map((action, idx) => {
                                        const ActionIcon = action.icon;
                                        const content = (
                                            <div className="group flex items-center justify-between p-2.5 sm:p-2 rounded-xl sm:rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-200 transition-all cursor-pointer min-h-[48px] active:scale-[0.98]">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="size-8 rounded-lg bg-white text-slate-600 group-hover:bg-[#1e50ff] group-hover:text-white border border-slate-200/60 flex items-center justify-center shrink-0 transition-colors shadow-2xs">
                                                        <ActionIcon className="size-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-xs font-bold text-slate-800 truncate group-hover:text-[#1e50ff] transition-colors">
                                                            {action.title}
                                                        </div>
                                                        <div className="text-[11px] text-slate-400 truncate">
                                                            {action.subtitle}
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="size-3.5 text-slate-300 group-hover:text-[#1e50ff] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
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
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* TAB 2: THROUGHPUT & GRAFIK */}
                    <TabsContent value="analytics" className="space-y-6">
                        <InteractiveThroughputChart
                            stats={stats}
                            realtimeDatasets={chartData}
                            onRefresh={refreshDashboard}
                            isRefreshing={isRefreshing}
                            lastUpdated={lastUpdated}
                        />
                    </TabsContent>

                    {/* TAB 3: SINGLE ENGINE & OCTANE INFRASTRUCTURE */}
                    <TabsContent value="infrastructure" className="space-y-6">
                        <div className="grid gap-6 md:grid-cols-2">
                            {/* BisnisWA UltraSync Engine Card */}
                            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 space-y-4">
                                <CardHeader className="p-0 flex flex-row items-center justify-between pb-3 border-b border-slate-100 space-y-0">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                                            BisnisWA <span className="font-editorial-italic font-normal text-slate-800">UltraSync Engine</span>
                                        </CardTitle>
                                    </div>
                                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#1e50ff] font-bold text-[10px]">OPERASIONAL</Badge>
                                </CardHeader>
                                <CardContent className="p-0 space-y-4 pt-1">
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Engine tunggal berkinerja tinggi dengan protokol enkripsi Signal native. Menjamin pesan terbuka instan tanpa status "Menunggu pesan ini".
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                                            <span className="text-slate-400 block text-[11px]">Enkripsi E2EE</span>
                                            <span className="font-mono font-bold text-[#1e50ff] text-sm">Resmi Meta</span>
                                        </div>
                                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                                            <span className="text-slate-400 block text-[11px]">Stabilitas Sesi</span>
                                            <span className="font-mono font-bold text-slate-800 text-sm">Anti-Ban</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Laravel Octane + FrankenPHP Card */}
                            <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs p-5 space-y-4">
                                <CardHeader className="p-0 flex flex-row items-center justify-between pb-3 border-b border-slate-100 space-y-0">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#1e50ff] animate-pulse" />
                                        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                                            Laravel Octane & <span className="font-editorial-italic font-normal text-slate-800">FrankenPHP</span>
                                        </CardTitle>
                                    </div>
                                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#1e50ff] font-bold text-[10px]">TUNED UP</Badge>
                                </CardHeader>
                                <CardContent className="p-0 space-y-4 pt-1">
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        Aplikasi berjalan dalam persistent memory worker pool dengan waktu respon sub-milidetik, efisiensi CPU maksimal, dan auto-reload.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                                            <span className="text-slate-400 block text-[11px]">Server Engine</span>
                                            <span className="font-mono font-bold text-[#1e50ff] text-sm">FrankenPHP Caddy</span>
                                        </div>
                                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                                            <span className="text-slate-400 block text-[11px]">Worker Concurrency</span>
                                            <span className="font-mono font-bold text-slate-800 text-sm">Multi-Worker</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Connected Devices Card */}
                        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                <div>
                                    <CardTitle className="text-base font-bold text-slate-900">
                                        Daftar Perangkat <span className="font-editorial-italic font-normal text-slate-800">Terhubung</span>
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500">
                                        {devices?.length || 0} dari {maxAllowedDevices} slot perangkat aktif digunakan
                                    </CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setIsQrModalOpen(true)}
                                    disabled={isDeviceLimitReached}
                                    className="bg-[#1e50ff] hover:bg-[#153ec7] text-white gap-1.5 text-xs font-bold rounded-xl h-9 px-4 shadow-md shadow-blue-500/25 cursor-pointer disabled:opacity-50"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tautkan Perangkat Baru</span>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0 overflow-x-auto touch-pan-x no-scrollbar">
                                <Table className="min-w-[560px] sm:min-w-0">
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/80 border-slate-200/70">
                                            <TableHead className="pl-6 text-xs font-semibold text-slate-600">Nama Perangkat</TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-600">Nomor WhatsApp</TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-600">Engine</TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-600">Status</TableHead>
                                            <TableHead className="text-right pr-6 text-xs font-semibold text-slate-600">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {devices?.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-500">
                                                    Belum ada nomor WhatsApp yang ditautkan ke gateway ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            devices.map((device) => (
                                                <TableRow key={device.id} className="hover:bg-slate-50/70 border-slate-100 transition-colors">
                                                    <TableCell className="pl-6 font-bold text-slate-900 text-xs">
                                                        {device.name}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-slate-700">
                                                        {device.phone_number || '-'}
                                                    </TableCell>
                                                    <TableCell className="text-xs uppercase font-mono text-slate-500">
                                                        UltraSync Engine
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant={device.status === 'connected' ? 'outline' : 'secondary'}
                                                            className={cn(
                                                                'text-[10px] font-bold',
                                                                device.status === 'connected' && 'border-blue-200 bg-blue-50 text-[#1e50ff]'
                                                            )}
                                                        >
                                                            {device.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Link href="/devices">
                                                            <Button variant="ghost" size="sm" className="h-7 text-xs font-bold text-[#1e50ff] hover:text-[#153ec7] hover:bg-blue-50 rounded-lg">
                                                                Kelola
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* TAB 4: LOG RIWAYAT PESAN */}
                    <TabsContent value="logs" className="space-y-6">
                        <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-base font-bold text-slate-900 tracking-tight">
                                            Log Pengiriman <span className="font-editorial-italic font-normal text-slate-800">Pesan Terkini</span>
                                        </CardTitle>
                                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[#1e50ff] text-[10px] font-bold py-0 px-2">
                                            REALTIME
                                        </Badge>
                                    </div>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                        Log realtime pesan keluar dan status konfirmasi penerimaan WhatsApp gateway
                                    </CardDescription>
                                </div>
                                <Link href="/broadcast">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-xs text-slate-700 hover:text-[#1e50ff] hover:border-[#1e50ff] font-semibold h-8 gap-1.5 cursor-pointer rounded-lg"
                                    >
                                        <span>Buka Modul Broadcast</span>
                                        <ArrowRight className="size-3.5" />
                                    </Button>
                                </Link>
                            </CardHeader>

                            <CardContent className="p-0 overflow-x-auto touch-pan-x no-scrollbar">
                                <Table className="min-w-[620px] sm:min-w-0">
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/80 border-slate-200/70 hover:bg-slate-50/80">
                                            <TableHead className="w-[190px] text-xs font-semibold text-slate-600 pl-6">
                                                Penerima & Nomor
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold text-slate-600">
                                                Isi Ringkasan
                                            </TableHead>
                                            <TableHead className="w-[140px] hidden md:table-cell text-xs font-semibold text-slate-600">
                                                Perangkat
                                            </TableHead>
                                            <TableHead className="w-[120px] text-xs font-semibold text-slate-600">
                                                Status
                                            </TableHead>
                                            <TableHead className="w-[90px] text-xs font-semibold text-slate-600 text-right pr-6">
                                                Waktu
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentMessages.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-12">
                                                    <div className="flex flex-col items-center justify-center space-y-2">
                                                        <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                            <MessageSquare className="size-5" />
                                                        </div>
                                                        <p className="text-xs font-semibold text-slate-700">
                                                            Belum Ada Riwayat Pesan
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 max-w-sm">
                                                            Pesan yang dikirim melalui REST API, broadcast massal, atau inbox akan muncul secara realtime di sini.
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            recentMessages.map((msg) => (
                                                <TableRow key={msg.id} className="hover:bg-slate-50/70 border-slate-100 transition-colors">
                                                    <TableCell className="py-3 pl-6">
                                                        <div className="flex items-center gap-2.5">
                                                            <div className="size-8 rounded-lg bg-blue-50 text-[#1e50ff] flex items-center justify-center text-xs font-semibold shrink-0 border border-blue-100">
                                                                <Send className="size-3.5" />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-xs font-bold text-slate-900 truncate tabular-nums">
                                                                    {msg.receiver_number}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 capitalize truncate">
                                                                    Tipe: {msg.message_type || 'Teks'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-slate-600">
                                                        <div className="truncate max-w-[200px] xl:max-w-[280px]" title={msg.content}>
                                                            {msg.content}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-3 hidden md:table-cell text-xs">
                                                        <span className="font-medium text-slate-700 truncate block max-w-[130px]" title={msg.device?.name || 'Gateway Node'}>
                                                            {msg.device?.name || 'Gateway Node'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3">
                                                        {msg.status === 'read' ? (
                                                            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700 text-[10px] py-0 px-2 font-bold gap-1">
                                                                <CheckCheck className="size-3 text-emerald-600" />
                                                                READ
                                                            </Badge>
                                                        ) : msg.status === 'delivered' ? (
                                                            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 text-[10px] py-0 px-2 font-bold gap-1">
                                                                <CheckCheck className="size-3 text-blue-600" />
                                                                DELIVERED
                                                            </Badge>
                                                        ) : msg.status === 'failed' ? (
                                                            <Badge variant="destructive" className="text-[10px] py-0 px-2 font-bold gap-1">
                                                                <AlertCircle className="size-3 text-rose-600" />
                                                                FAILED
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="text-[10px] py-0 px-2 font-bold gap-1 uppercase text-slate-600">
                                                                <Check className="size-3 text-slate-500" />
                                                                {msg.status || 'SENT'}
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="py-3 text-xs text-slate-500 text-right font-mono pr-6 tabular-nums">
                                                        {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* QR SCAN MODAL */}
            <QrScanModal
                isOpen={isQrModalOpen}
                onClose={() => setIsQrModalOpen(false)}
                canAddDevice={!isDeviceLimitReached}
                maxDevices={maxAllowedDevices}
                currentCount={devices?.length || 0}
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
