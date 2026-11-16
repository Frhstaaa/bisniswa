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
    ArrowRight,
    Server,
    Calendar,
    CreditCard,
    QrCode,
    Code2,
    Users,
    MessageSquare,
    Sparkles,
    Lightbulb,
    ChevronRight,
    RefreshCw,
} from 'lucide-react';
import { Button } from '../Components/ui/button';
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
import { Separator } from '../Components/ui/separator';
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
        }, 12000);
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

    const renderMessageStatus = (status) => {
        if (status === 'read') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52c41a]">
                    <span className="size-1.5 rounded-full bg-[#52c41a]" />
                    Read
                </span>
            );
        }
        if (status === 'delivered') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1677ff]">
                    <span className="size-1.5 rounded-full bg-[#1677ff]" />
                    Delivered
                </span>
            );
        }
        if (status === 'failed') {
            return (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#ff4d4f]">
                    <span className="size-1.5 rounded-full bg-[#ff4d4f]" />
                    Failed
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#595959] capitalize">
                <span className="size-1.5 rounded-full bg-[#8c8c8c]" />
                {status || 'Sent'}
            </span>
        );
    };

    const renderMessagesTable = (emptyAction = false) => (
        <Table className="min-w-[620px]">
            <TableHeader>
                <TableRow className="hover:bg-[#fafafb]">
                    <TableHead className="pl-5">Penerima &amp; Nomor</TableHead>
                    <TableHead>Isi Ringkasan</TableHead>
                    <TableHead className="hidden md:table-cell">Perangkat</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-5">Waktu</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {messagesList.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="py-10 text-center text-[#8c8c8c]">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <div className="size-10 rounded-full bg-[#fafafb] border border-[#f0f0f0] flex items-center justify-center text-[#bfbfbf]">
                                    <MessageSquare className="size-5" />
                                </div>
                                <p className="text-xs font-semibold text-[#262626]">
                                    Belum Ada Riwayat Pesan
                                </p>
                                <p className="text-[11px] text-[#8c8c8c] max-w-sm">
                                    Pesan yang dikirim melalui REST API, broadcast massal, atau inbox akan muncul secara realtime di sini.
                                </p>
                                {emptyAction && (
                                    <Link href="/broadcast" className="pt-1">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="border-[#91caff] text-[#1677ff] hover:bg-[#e6f4ff] cursor-pointer"
                                        >
                                            Mulai Broadcast Baru
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                ) : (
                    messagesList.map((msg) => (
                        <TableRow key={msg.id}>
                            <TableCell className="pl-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center shrink-0 border border-[#91caff]">
                                        <Send className="size-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-mono text-xs font-semibold text-[#262626] truncate tabular-nums">
                                            {msg.receiver_number}
                                        </div>
                                        <div className="text-[11px] text-[#8c8c8c] capitalize truncate">
                                            {msg.message_type || 'Teks'}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="py-3.5 text-[#595959]">
                                <div className="truncate max-w-[200px] xl:max-w-[320px]" title={msg.content}>
                                    {msg.content || 'Pesan terkirim'}
                                </div>
                            </TableCell>
                            <TableCell className="py-3.5 hidden md:table-cell">
                                <span className="font-medium text-[#262626] truncate block max-w-[140px]" title={msg.device?.name || 'Gateway Node'}>
                                    {msg.device?.name || 'Gateway Node'}
                                </span>
                            </TableCell>
                            <TableCell className="py-3.5">
                                {renderMessageStatus(msg.status)}
                            </TableCell>
                            <TableCell className="py-3.5 text-[#8c8c8c] text-right font-mono pr-5 tabular-nums">
                                {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    return (
        <AppLayout title="Ikhtisar Workspace">
            <Head title="Workspace Overview — SAPA BisnisWA" />

            <div className="flex flex-col gap-6 pb-12 font-sans antialiased text-[#1f1f1f]">
                {/* ================= 1. BREADCRUMB & HEADER ================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e6ebf1]">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#8c8c8c] font-medium">
                            <Link href="/dashboard" className="hover:text-[#1677ff] transition-colors">
                                Dashboard
                            </Link>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#262626]">Workspace</span>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#1677ff] font-semibold">{workspace?.name || 'Overview'}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#262626]">
                                {workspace?.name || 'Workspace'} Overview
                            </h1>
                            <span className="text-xs text-[#8c8c8c] font-medium">
                                Paket {stats?.plan_name || 'Starter Lite'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Live Sync Pill */}
                        <div className="inline-flex items-center rounded-lg border border-[#d9d9d9] bg-white px-3 h-9 text-xs text-[#595959] gap-2">
                            <span className="relative flex size-2">
                                <span className="animate-ping absolute inline-flex size-full rounded-full bg-[#1677ff] opacity-75" />
                                <span className="relative inline-flex size-2 rounded-full bg-[#1677ff]" />
                            </span>
                            <span className="text-[#8c8c8c] hidden sm:inline">Sync:</span>
                            <span className="font-mono font-semibold text-[#262626] tabular-nums">
                                {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                            <button
                                type="button"
                                onClick={refreshDashboard}
                                disabled={isRefreshing}
                                className="p-1 rounded hover:bg-[#f5f5f5] text-[#8c8c8c] hover:text-[#1677ff] transition-colors disabled:opacity-50 cursor-pointer"
                                title="Segarkan data realtime sekarang"
                            >
                                <RefreshCw className={cn('size-3.5 text-[#1677ff]', isRefreshing && 'animate-spin')} />
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsGuideModalOpen(true)}
                            className="h-9 px-3.5 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                            <Lightbulb className="size-3.5 text-[#faad14]" />
                            <span>Panduan</span>
                        </Button>

                        {isSuperAdmin && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsDurationModalOpen(true)}
                                className="h-9 px-3.5 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg cursor-pointer flex items-center gap-1.5"
                            >
                                <Calendar className="size-3.5 text-[#8c8c8c]" />
                                <span>Kelola Durasi</span>
                            </Button>
                        )}

                        {isDeviceLimitReached ? (
                            <Link href="/subscriptions">
                                <Button
                                    size="sm"
                                    className="h-9 px-3.5 text-xs font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded-lg cursor-pointer flex items-center gap-1.5"
                                >
                                    <Sparkles className="size-3.5" />
                                    <span>Upgrade Slot ({devicesList?.length || 0}/{maxAllowedDevices})</span>
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                size="sm"
                                onClick={() => setIsQrModalOpen(true)}
                                className="h-9 px-3.5 text-xs font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded-lg cursor-pointer flex items-center gap-1.5"
                            >
                                <Plus className="size-3.5" />
                                <span>Tautkan Perangkat WA</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* ================= 2. SHADCN KPI STAT CARDS (ROW 1) ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Card 1 */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Pesan Hari Ini</CardDescription>
                                <span className="text-xs font-semibold text-[#52c41a] font-mono">+18.4%</span>
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-bold font-mono tracking-tight pt-1">
                                <CountUp to={stats?.sent_today || 0} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2.5 pb-4">
                            <Progress
                                value={parseFloat(stats?.delivery_rate || '100')}
                                indicatorClassName="bg-[#1677ff]"
                            />
                        </CardContent>
                        <CardFooter className="pt-0 text-xs text-[#8c8c8c]">
                            Sukses <strong className="text-[#262626] mx-1">{stats?.delivery_rate || '100%'}</strong> ({stats?.busiest_hour || '10:00 – 15:00 WIB'})
                        </CardFooter>
                    </Card>

                    {/* Card 2 */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Slot Nomor WA</CardDescription>
                                <span className="text-xs font-semibold text-[#1677ff] font-mono">{devicePercent}%</span>
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-bold font-mono tracking-tight pt-1">
                                <CountUp to={stats?.connected_devices || 0} />{' '}
                                <span className="text-sm font-normal text-[#8c8c8c] font-sans">/ {maxAllowedDevices} Slot</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2.5 pb-4">
                            <Progress
                                value={devicePercent}
                                indicatorClassName="bg-[#52c41a]"
                            />
                        </CardContent>
                        <CardFooter className="pt-0 text-xs text-[#8c8c8c]">
                            Status node:{' '}
                            <span className={cn('font-semibold ml-1', (stats?.connected_devices || 0) > 0 ? 'text-[#52c41a]' : 'text-[#faad14]')}>
                                {(stats?.connected_devices || 0) > 0 ? 'Online & Siap' : 'Perlu Scan QR'}
                            </span>
                        </CardFooter>
                    </Card>

                    {/* Card 3 */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Sisa Kuota Pesan</CardDescription>
                                <span className="text-xs font-semibold text-[#595959] font-mono">{quotaPercent}% Sisa</span>
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-bold font-mono tracking-tight pt-1">
                                <CountUp to={stats?.remaining_quota || 0} />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2.5 pb-4">
                            <Progress
                                value={quotaPercent}
                                indicatorClassName="bg-[#faad14]"
                            />
                        </CardContent>
                        <CardFooter className="pt-0 text-xs text-[#8c8c8c]">
                            Terpakai <strong className="text-[#262626] mx-1">{quotaUsed.toLocaleString('id-ID')}</strong> dari {(stats?.monthly_quota || 5000).toLocaleString('id-ID')} /bln
                        </CardFooter>
                    </Card>

                    {/* Card 4 */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Masa Aktif</CardDescription>
                                <span className={cn(
                                    'inline-flex items-center gap-1.5 text-xs font-semibold',
                                    (stats?.days_remaining || 0) > 5 ? 'text-[#52c41a]' : 'text-[#ff4d4f]'
                                )}>
                                    <span className={cn(
                                        'size-1.5 rounded-full',
                                        (stats?.days_remaining || 0) > 5 ? 'bg-[#52c41a]' : 'bg-[#ff4d4f]'
                                    )} />
                                    {(stats?.days_remaining || 0) > 0 ? 'Aktif' : 'Expired'}
                                </span>
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-bold font-mono tracking-tight pt-1">
                                {stats?.days_remaining || 0}{' '}
                                <span className="text-sm font-normal text-[#8c8c8c] font-sans">Hari</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2.5 pb-4">
                            <Progress
                                value={cyclePercent}
                                indicatorClassName={(stats?.days_remaining || 0) > 5 ? 'bg-[#52c41a]' : 'bg-[#faad14]'}
                            />
                        </CardContent>
                        <CardFooter className="pt-0 text-xs text-[#8c8c8c]">
                            Paket <strong className="text-[#262626] mx-1">{stats?.plan_name || 'Starter Lite'}</strong> (Grace 3 hari)
                        </CardFooter>
                    </Card>
                </div>

                {/* ================= 3. SUMMARY ICON WIDGETS (ROW 2) ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <Card>
                        <CardContent className="p-4.5 flex items-center gap-4">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4.5 flex items-center gap-4">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4.5 flex items-center gap-4">
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
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4.5 flex items-center gap-4">
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
                        </CardContent>
                    </Card>
                </div>

                {/* ================= 4. SHADCN TABS NAVIGATION ================= */}
                <Tabs defaultValue="overview" className="flex flex-col gap-6">
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
                                Throughput &amp; Grafik
                            </TabsTrigger>
                            <TabsTrigger
                                value="infrastructure"
                                className="rounded-lg px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap data-[state=active]:bg-white data-[state=active]:text-[#1677ff] data-[state=active]:shadow-xs text-[#595959] hover:text-[#262626] cursor-pointer"
                            >
                                Dual Server &amp; Gateway
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
                    <TabsContent value="overview" className="flex flex-col gap-6 mt-0">
                        {/* ROW 3: THROUGHPUT CHART (8 cols) + RECENT MESSAGES (4 cols) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-8">
                                <InteractiveThroughputChart
                                    stats={stats}
                                    realtimeDatasets={chartData}
                                    onRefresh={refreshDashboard}
                                    isRefreshing={isRefreshing}
                                    lastUpdated={lastUpdated}
                                />
                            </div>

                            <Card className="lg:col-span-4 flex flex-col justify-between">
                                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                    <div className="flex flex-col gap-0.5">
                                        <CardTitle className="text-sm font-bold">Aktivitas Pesan Terkini</CardTitle>
                                        <CardDescription>5 interaksi WhatsApp terbaru</CardDescription>
                                    </div>
                                    <Link href="/inbox" prefetch>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-xs text-[#1677ff] hover:text-[#0958d9] hover:bg-[#e6f4ff] font-semibold cursor-pointer rounded-lg h-8 gap-1"
                                        >
                                            <span>Inbox</span>
                                            <ArrowRight className="size-3.5" />
                                        </Button>
                                    </Link>
                                </CardHeader>

                                <CardContent className="pt-4 flex-1 flex flex-col gap-3.5">
                                    {messagesList.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 text-center text-[#8c8c8c] gap-2">
                                            <div className="size-10 rounded-full bg-[#fafafb] border border-[#f0f0f0] flex items-center justify-center text-[#bfbfbf]">
                                                <MessageSquare className="size-5" />
                                            </div>
                                            <p className="text-xs font-semibold text-[#262626]">Belum Ada Aktivitas Pesan</p>
                                            <p className="text-[11px] text-[#8c8c8c] max-w-[200px]">
                                                Pesan masuk &amp; keluar akan muncul secara realtime di sini.
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
                                                    <div className="min-w-0 flex flex-col gap-0.5">
                                                        <p className="text-xs font-bold text-[#262626] truncate font-mono tabular-nums">
                                                            {msg.receiver_number}
                                                        </p>
                                                        <p className="text-[11px] text-[#8c8c8c] truncate max-w-[140px] sm:max-w-[170px]">
                                                            {msg.content || 'Pesan teks terkirim'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0 gap-1">
                                                    {renderMessageStatus(msg.status)}
                                                    <span className="text-[10px] font-mono text-[#8c8c8c] tabular-nums">
                                                        {msg.sent_at ? new Date(msg.sent_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </CardContent>

                                <CardFooter className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between text-xs text-[#8c8c8c]">
                                    <span>Total Terkirim Hari Ini:</span>
                                    <strong className="font-mono font-bold text-[#1677ff]">{stats?.sent_today || 0} pesan</strong>
                                </CardFooter>
                            </Card>
                        </div>

                        {/* ROW 4: LOG RIWAYAT PENGIRIMAN PESAN TABLE */}
                        <Card className="overflow-hidden">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0]">
                                <div className="flex flex-col gap-1">
                                    <CardTitle className="text-sm font-bold">Log Riwayat Pengiriman Pesan</CardTitle>
                                    <CardDescription>
                                        Log realtime pesan keluar dan status konfirmasi penerimaan WhatsApp gateway
                                    </CardDescription>
                                </div>
                                <Link href="/broadcast" prefetch>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg cursor-pointer flex items-center gap-1.5"
                                    >
                                        <span>Lihat Riwayat Broadcast</span>
                                        <ArrowRight className="size-3.5 text-[#8c8c8c]" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                {renderMessagesTable(true)}
                            </CardContent>
                        </Card>

                        {/* ROW 5: DUAL SERVER INFRASTRUCTURE & QUICK ACTIONS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Widget 1: Dual Server Status */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                    <div className="flex items-center gap-2.5">
                                        <div className="size-9 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center border border-[#91caff]">
                                            <Server className="size-4.5" />
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <CardTitle className="text-sm font-bold">Status Dual Server WA</CardTitle>
                                            <CardDescription className="text-[11px]">Redundansi otomatis tanpa downtime</CardDescription>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52c41a]">
                                        <span className="size-1.5 rounded-full bg-[#52c41a]" />
                                        Normal
                                    </span>
                                </CardHeader>

                                <CardContent className="pt-4">
                                    <div className="p-3.5 rounded-lg border border-[#e6ebf1] bg-[#fafafb] flex flex-col gap-2.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="size-2 rounded-full bg-[#52c41a]" />
                                                <span className="font-bold text-xs text-[#262626]">
                                                    SAPA UltraSync Engine
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-medium text-[#1677ff]">
                                                Operasional
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-[#8c8c8c] leading-relaxed">
                                            Engine enterprise berkinerja tinggi dengan enkripsi native instan &amp; bebas kendala &quot;Menunggu pesan ini&quot;.
                                        </p>
                                        <Separator className="bg-[#f0f0f0]" />
                                        <div className="grid grid-cols-2 gap-2 text-[11px] text-[#595959]">
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
                                </CardContent>
                            </Card>

                            {/* Widget 2: Quick Action Launchpad */}
                            <Card>
                                <CardHeader className="flex flex-row items-center gap-2.5 pb-3 border-b border-[#f0f0f0]">
                                    <div className="size-9 rounded-lg bg-[#e6f4ff] text-[#1677ff] flex items-center justify-center border border-[#91caff]">
                                        <Zap className="size-4.5" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <CardTitle className="text-sm font-bold">Pintasan Operasional</CardTitle>
                                        <CardDescription className="text-[11px]">Akses cepat ke seluruh fitur utama gateway</CardDescription>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-4 flex flex-col gap-2">
                                    {quickActions.slice(0, 4).map((action, idx) => {
                                        const ActionIcon = action.icon;
                                        const itemContent = (
                                            <div className="group flex items-center justify-between p-2.5 rounded-lg border border-[#f0f0f0] bg-[#fafafb] hover:bg-[#e6f4ff]/40 hover:border-[#91caff] transition-all cursor-pointer">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="size-8 rounded-lg bg-white text-[#595959] group-hover:bg-[#1677ff] group-hover:text-white border border-[#e6ebf1] flex items-center justify-center shrink-0 transition-colors">
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
                                                {itemContent}
                                            </Link>
                                        ) : (
                                            <div key={idx} onClick={action.onClick}>
                                                {itemContent}
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* ================= TAB 2: THROUGHPUT & GRAFIK ================= */}
                    <TabsContent value="analytics" className="mt-0">
                        <InteractiveThroughputChart
                            stats={stats}
                            realtimeDatasets={chartData}
                            onRefresh={refreshDashboard}
                            isRefreshing={isRefreshing}
                            lastUpdated={lastUpdated}
                        />
                    </TabsContent>

                    {/* ================= TAB 3: DUAL SERVER & GATEWAY ================= */}
                    <TabsContent value="infrastructure" className="flex flex-col gap-6 mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#52c41a]" />
                                        <CardTitle className="text-sm font-bold">SAPA UltraSync Engine</CardTitle>
                                    </div>
                                    <span className="text-xs font-medium text-[#52c41a]">Operasional</span>
                                </CardHeader>
                                <CardContent className="pt-4 flex flex-col gap-3">
                                    <p className="text-xs text-[#595959] leading-relaxed">
                                        Engine tunggal berkinerja tinggi dengan protokol enkripsi Signal native. Menjamin pesan terbuka instan tanpa status &quot;Menunggu pesan ini&quot;.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0]">
                                            <span className="text-[#8c8c8c] block text-[11px]">Enkripsi E2EE</span>
                                            <span className="font-mono font-bold text-[#1677ff] text-sm">Resmi Meta</span>
                                        </div>
                                        <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0]">
                                            <span className="text-[#8c8c8c] block text-[11px]">Stabilitas Sesi</span>
                                            <span className="font-mono font-bold text-[#262626] text-sm">Anti-Ban Sesi</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-[#1677ff]" />
                                        <CardTitle className="text-sm font-bold">Laravel Octane &amp; FrankenPHP</CardTitle>
                                    </div>
                                    <span className="text-xs font-medium text-[#1677ff]">Aktif</span>
                                </CardHeader>
                                <CardContent className="pt-4 flex flex-col gap-3">
                                    <p className="text-xs text-[#595959] leading-relaxed">
                                        Aplikasi berjalan dalam persistent memory worker pool dengan waktu respon sub-milidetik, efisiensi CPU maksimal, dan auto-reload.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0]">
                                            <span className="text-[#8c8c8c] block text-[11px]">Server Engine</span>
                                            <span className="font-mono font-bold text-[#1677ff] text-sm">FrankenPHP Caddy</span>
                                        </div>
                                        <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0]">
                                            <span className="text-[#8c8c8c] block text-[11px]">Worker Concurrency</span>
                                            <span className="font-mono font-bold text-[#262626] text-sm">Multi-Worker</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="overflow-hidden">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0]">
                                <div className="flex flex-col gap-1">
                                    <CardTitle className="text-sm font-bold">Daftar Perangkat Terhubung</CardTitle>
                                    <CardDescription>
                                        {devicesList?.length || 0} dari {maxAllowedDevices} slot perangkat aktif digunakan
                                    </CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setIsQrModalOpen(true)}
                                    disabled={isDeviceLimitReached}
                                    className="h-9 px-3.5 text-xs font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded-lg cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Tautkan Perangkat Baru</span>
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table className="min-w-[560px]">
                                    <TableHeader>
                                        <TableRow className="hover:bg-[#fafafb]">
                                            <TableHead className="pl-5">Nama Perangkat</TableHead>
                                            <TableHead>Nomor WhatsApp</TableHead>
                                            <TableHead>Engine</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right pr-5">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {devicesList?.length === 0 ? (
                                            <TableRow className="hover:bg-transparent">
                                                <TableCell colSpan={5} className="py-8 text-center text-[#8c8c8c]">
                                                    Belum ada nomor WhatsApp yang ditautkan ke gateway ini.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            devicesList.map((device) => (
                                                <TableRow key={device.id}>
                                                    <TableCell className="pl-5 py-3.5 font-semibold text-[#262626]">
                                                        {device.name}
                                                    </TableCell>
                                                    <TableCell className="py-3.5 font-mono text-[#595959]">
                                                        {device.phone_number || '-'}
                                                    </TableCell>
                                                    <TableCell className="py-3.5 uppercase font-mono text-[#8c8c8c]">
                                                        UltraSync Engine
                                                    </TableCell>
                                                    <TableCell className="py-3.5">
                                                        <span className={cn(
                                                            'inline-flex items-center gap-1.5 text-xs font-medium',
                                                            device.status === 'connected' ? 'text-[#52c41a]' : 'text-[#8c8c8c]'
                                                        )}>
                                                            <span className={cn(
                                                                'size-1.5 rounded-full',
                                                                device.status === 'connected' ? 'bg-[#52c41a]' : 'bg-[#8c8c8c]'
                                                            )} />
                                                            {device.status === 'connected' ? 'Connected' : (device.status || 'Offline')}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3.5 text-right pr-5">
                                                        <Link href="/devices" prefetch>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 text-xs font-semibold text-[#1677ff] hover:text-[#0958d9] hover:bg-[#e6f4ff] rounded-lg"
                                                            >
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

                    {/* ================= TAB 4: LOG RIWAYAT PESAN ================= */}
                    <TabsContent value="logs" className="mt-0">
                        <Card className="overflow-hidden">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0]">
                                <div className="flex flex-col gap-1">
                                    <CardTitle className="text-sm font-bold">Log Pengiriman Pesan Terkini</CardTitle>
                                    <CardDescription>
                                        Log realtime pesan keluar dan status konfirmasi penerimaan WhatsApp gateway
                                    </CardDescription>
                                </div>
                                <Link href="/broadcast" prefetch>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-3 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg cursor-pointer flex items-center gap-1.5"
                                    >
                                        <span>Buka Modul Broadcast</span>
                                        <ArrowRight className="size-3.5 text-[#8c8c8c]" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="p-0">
                                {renderMessagesTable(false)}
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
