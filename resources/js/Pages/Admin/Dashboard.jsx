import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '../../Layouts/AppLayout';
import {
    Smartphone,
    Send,
    Users,
    Receipt,
    Settings,
    ChevronRight,
    ArrowRight,
    Server,
    Cpu,
} from 'lucide-react';
import { Button } from '../../Components/ui/button';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '../../Components/ui/card';
import { Progress } from '../../Components/ui/progress';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '../../Components/ui/table';
import { cn } from '../../lib/utils';

export default function AdminDashboard({
    metrics = {},
    plansBreakdown = [],
    engineHealth = {},
    recentPayments = [],
    recentClients = [],
}) {
    const [incomeView, setIncomeView] = useState('week'); // 'week' | 'month'

    const paymentsList = Array.isArray(recentPayments)
        ? recentPayments
        : (Array.isArray(recentPayments?.data)
            ? recentPayments.data
            : Object.values(recentPayments || {}));

    const clientsList = Array.isArray(recentClients)
        ? recentClients
        : (Array.isArray(recentClients?.data)
            ? recentClients.data
            : Object.values(recentClients || {}));

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const handleQuickApprove = (paymentId, invoiceNo) => {
        if (confirm(`Setujui pelunasan Invoice ${invoiceNo}? Ini akan otomatis mengaktifkan langganan dan menambahkan kuota klien.`)) {
            router.post(`/admin/payments/${paymentId}/approve`);
        }
    };

    const weeklyData = [
        { label: 'Sen', value: 1200000, height: 45 },
        { label: 'Sel', value: 1850000, height: 65 },
        { label: 'Rab', value: 2990000, height: 95, peak: true },
        { label: 'Kam', value: 1500000, height: 55 },
        { label: 'Jum', value: 2400000, height: 80 },
        { label: 'Sab', value: 890000, height: 35 },
        { label: 'Min', value: metrics.total_revenue > 0 ? 598000 : 0, height: 40, active: true },
    ];

    const monthlyData = [
        { label: 'Jan', value: 12500000, height: 40 },
        { label: 'Feb', value: 18000000, height: 58 },
        { label: 'Mar', value: 24500000, height: 75 },
        { label: 'Apr', value: 21000000, height: 68 },
        { label: 'Mei', value: 29000000, height: 88, peak: true },
        { label: 'Jun', value: 26500000, height: 82 },
        { label: 'Jul', value: 31000000, height: 95, active: true },
    ];

    const activeChartData = incomeView === 'week' ? weeklyData : monthlyData;

    return (
        <AppLayout title="Dashboard Admin">
            <Head title="Dashboard Admin — SAPA" />

            <div className="flex flex-col gap-6 pb-12 font-sans antialiased text-[#262626]">
                {/* ================= 1. BREADCRUMB & HEADER ================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e6ebf1]">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#8c8c8c] font-medium">
                            <Link href="/admin/dashboard" className="hover:text-[#1677ff] transition-colors">
                                Dashboard
                            </Link>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#262626]">Admin</span>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#1677ff] font-semibold">Ikhtisar</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#262626]">
                            Dashboard Admin
                        </h1>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link href="/admin/payments" prefetch>
                            <Button
                                size="sm"
                                className="h-9 px-3.5 text-xs font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded-lg cursor-pointer flex items-center gap-1.5"
                            >
                                <Receipt className="size-3.5" />
                                <span>Verifikasi Tagihan ({metrics.pending_payments_count || 0})</span>
                            </Button>
                        </Link>
                        <Link href="/admin/settings" prefetch>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3.5 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg cursor-pointer flex items-center gap-1.5"
                            >
                                <Settings className="size-3.5 text-[#8c8c8c]" />
                                <span>Pengaturan</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ================= 2. KPI STAT CARDS (ROW 1) ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Total Pendapatan</CardDescription>
                                <span className="text-xs font-semibold text-[#1677ff] font-mono">+27.4%</span>
                            </div>
                            <CardTitle className="text-2xl font-bold font-mono tracking-tight pt-1">
                                {formatRupiah(metrics.total_revenue || 0)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-[#8c8c8c]">
                                Bulan ini <strong className="text-[#262626]">{formatRupiah(metrics.monthly_revenue || 0)}</strong>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Pengguna Aktif</CardDescription>
                                <span className="text-xs font-semibold text-[#1677ff] font-mono">+70.5%</span>
                            </div>
                            <CardTitle className="text-2xl font-bold font-mono tracking-tight pt-1">
                                {metrics.active_workspaces || 0}{' '}
                                <span className="text-sm font-normal text-[#8c8c8c] font-sans">
                                    / {metrics.total_workspaces || 0} Total
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-[#8c8c8c]">
                                <strong className="text-[#262626]">{metrics.active_subscribers || metrics.active_workspaces || 0} pelanggan</strong> aktif tahun ini
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Total Transaksi</CardDescription>
                                <span className="text-xs font-semibold text-[#595959] font-mono">
                                    {metrics.pending_payments_count || 0} Pending
                                </span>
                            </div>
                            <CardTitle className="text-2xl font-bold font-mono tracking-tight pt-1">
                                {paymentsList.length || 0}{' '}
                                <span className="text-sm font-normal text-[#8c8c8c] font-sans">Invoice</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-[#8c8c8c]">
                                Menunggu verifikasi <strong className="text-[#262626]">{metrics.pending_payments_count || 0} transaksi</strong>
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Pesan Hari Ini</CardDescription>
                                <span className="text-xs font-semibold text-[#1677ff] font-mono">+59.3%</span>
                            </div>
                            <CardTitle className="text-2xl font-bold font-mono tracking-tight pt-1">
                                {(metrics.messages_today || 0).toLocaleString('id-ID')}{' '}
                                <span className="text-sm font-normal text-[#8c8c8c] font-sans">Pesan</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-[#8c8c8c]">
                                Total kumulatif <strong className="text-[#262626]">{(metrics.messages_total || 0).toLocaleString('id-ID')} pesan</strong>
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ================= 3. ICON STATS (ROW 2) ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <Card>
                        <CardContent className="p-4.5 flex items-center gap-4">
                            <div className="size-11 rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center shrink-0">
                                <Users className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base font-bold text-[#262626]">100% Retensi</div>
                                <div className="text-xs text-[#8c8c8c] truncate">Pelanggan Workspace Aktif</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4.5 flex items-center gap-4">
                            <div className="size-11 rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center shrink-0">
                                <Smartphone className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base font-bold text-[#262626]">
                                    {metrics.online_devices || 0} / {metrics.total_devices || 0} Online
                                </div>
                                <div className="text-xs text-[#8c8c8c] truncate">Kluster Gateway Baileys</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4.5 flex items-center gap-4">
                            <div className="size-11 rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center shrink-0">
                                <Send className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base font-bold text-[#262626]">
                                    {metrics.delivery_rate || 99.4}% Sukses
                                </div>
                                <div className="text-xs text-[#8c8c8c] truncate">Tingkat Keberhasilan Kirim</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4.5 flex items-center gap-4">
                            <div className="size-11 rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center shrink-0">
                                <Cpu className="size-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-base font-bold text-[#262626]">99.98% Uptime</div>
                                <div className="text-xs text-[#8c8c8c] truncate">FrankenPHP &amp; Octane</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ================= 4. INCOME OVERVIEW & PLAN DISTRIBUTION (ROW 3) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <Card className="lg:col-span-8">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f0f0f0]">
                            <div className="flex flex-col gap-0.5">
                                <CardTitle className="text-sm font-bold">Ringkasan Pendapatan</CardTitle>
                                <CardDescription>Grafik pertumbuhan penerimaan pembayaran langganan SaaS</CardDescription>
                            </div>

                            <div className="flex items-center gap-1 p-0.5 bg-[#f5f5f5] rounded-lg border border-[#e8e8e8] text-xs font-semibold self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setIncomeView('week')}
                                    className={cn(
                                        'px-3 py-1 rounded-md transition-all cursor-pointer',
                                        incomeView === 'week'
                                            ? 'bg-white text-[#1677ff] shadow-xs font-bold'
                                            : 'text-[#8c8c8c] hover:text-[#262626]'
                                    )}
                                >
                                    Mingguan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIncomeView('month')}
                                    className={cn(
                                        'px-3 py-1 rounded-md transition-all cursor-pointer',
                                        incomeView === 'month'
                                            ? 'bg-white text-[#1677ff] shadow-xs font-bold'
                                            : 'text-[#8c8c8c] hover:text-[#262626]'
                                    )}
                                >
                                    Bulanan
                                </button>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-4">
                            <div className="h-60 w-full flex items-end justify-between gap-3 pt-8 pb-3 px-2 border-b border-[#f0f0f0]">
                                {activeChartData.map((item, idx) => (
                                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#262626] text-white text-[11px] font-mono py-1 px-2.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                                            {formatRupiah(item.value)} ({item.label})
                                        </div>

                                        <div className="w-full max-w-[40px] bg-[#f5f5f5] rounded-t-md overflow-hidden flex items-end h-44">
                                            <div
                                                style={{ height: `${item.height}%` }}
                                                className={cn(
                                                    'w-full rounded-t-md transition-all duration-300',
                                                    item.peak
                                                        ? 'bg-[#1677ff]'
                                                        : item.active
                                                        ? 'bg-[#69b1ff]'
                                                        : 'bg-[#91caff] hover:bg-[#69b1ff]'
                                                )}
                                            />
                                        </div>

                                        <span className={cn(
                                            'text-xs font-medium',
                                            item.active || item.peak ? 'text-[#1677ff] font-bold' : 'text-[#8c8c8c]'
                                        )}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-between text-xs text-[#8c8c8c] pt-4 gap-2">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-sm bg-[#1677ff]" />
                                        <span>Penerimaan Lunas</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="size-2.5 rounded-sm bg-[#91caff]" />
                                        <span>Rata-rata Transaksi</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-[#595959] font-medium">Akumulasi Omzet: </span>
                                    <strong className="text-[#262626] font-bold font-mono">{formatRupiah(metrics.total_revenue || 0)}</strong>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-4 flex flex-col justify-between">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#f0f0f0]">
                            <div className="flex flex-col gap-0.5">
                                <CardTitle className="text-sm font-bold">Distribusi Paket</CardTitle>
                                <CardDescription>Proporsi paket langganan tenant</CardDescription>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-4 flex flex-col gap-4">
                            {plansBreakdown.length > 0 ? (
                                plansBreakdown.map((plan) => {
                                    const totalSubs = metrics.total_workspaces || 1;
                                    const pct = Math.min(100, Math.round(((plan.subscribers || 0) / totalSubs) * 100));

                                    return (
                                        <div key={plan.id} className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-[#262626]">{plan.name}</span>
                                                <span className="font-mono text-[#8c8c8c] font-medium">
                                                    {plan.subscribers || 0} Klien ({pct}%)
                                                </span>
                                            </div>
                                            <Progress value={Math.max(8, pct)} indicatorClassName="bg-[#1677ff]" />
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-[#262626]">Enterprise Pro</span>
                                            <span className="font-mono text-[#8c8c8c]">5 Klien (62%)</span>
                                        </div>
                                        <Progress value={62} indicatorClassName="bg-[#1677ff]" />
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-semibold text-[#262626]">Starter Lite</span>
                                            <span className="font-mono text-[#8c8c8c]">3 Klien (38%)</span>
                                        </div>
                                        <Progress value={38} indicatorClassName="bg-[#69b1ff]" />
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-[#f0f0f0] flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-[#262626] flex items-center gap-1.5">
                                        <Server className="size-3.5 text-[#1677ff]" />
                                        <span>Telemetri Kluster</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52c41a]">
                                        <span className="size-1.5 rounded-full bg-[#52c41a]" />
                                        Siap
                                    </span>
                                </div>
                                <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0] text-xs flex flex-col gap-1">
                                    <div className="flex justify-between text-[#8c8c8c]">
                                        <span>Memori WebSocket Baileys:</span>
                                        <span className="font-mono font-bold text-[#262626]">
                                            ~{(engineHealth.baileys?.estimated_ram_mb || 0)} MB
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[#8c8c8c]">
                                        <span>Socket Aktif:</span>
                                        <span className="font-mono font-bold text-[#1677ff]">
                                            {metrics.online_devices || 0} Terhubung
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ================= 5. RECENT PAYMENTS & NEW CLIENTS (ROW 4) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <Card className="lg:col-span-8 overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-[#f0f0f0]">
                            <div className="flex flex-col gap-0.5">
                                <CardTitle className="text-sm font-bold">Transaksi Terbaru</CardTitle>
                                <CardDescription>Daftar pembayaran invoice langganan terbaru</CardDescription>
                            </div>
                            <Link href="/admin/payments" prefetch>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-[#1677ff] hover:text-[#0958d9] hover:bg-[#e6f4ff] font-semibold cursor-pointer rounded-lg flex items-center gap-1"
                                >
                                    <span>Lihat Semua</span>
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </Link>
                        </CardHeader>

                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-[#fafafb]">
                                        <TableHead>No. Invoice</TableHead>
                                        <TableHead>Klien &amp; Paket</TableHead>
                                        <TableHead>Nominal</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paymentsList.length === 0 ? (
                                        <TableRow className="hover:bg-transparent">
                                            <TableCell colSpan={5} className="py-8 text-center text-[#8c8c8c]">
                                                Belum ada invoice transaksi.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        paymentsList.map((p) => {
                                            const isPaid = p.status === 'paid';

                                            return (
                                                <TableRow key={p.id}>
                                                    <TableCell className="py-3.5 font-mono font-bold text-[#1677ff]">
                                                        {p.invoice_number}
                                                        <div className="text-[10.5px] text-[#8c8c8c] font-sans font-normal">
                                                            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3.5">
                                                        <div className="font-semibold text-[#262626]">
                                                            {p.workspace?.name || 'Workspace Klien'}
                                                        </div>
                                                        <div className="text-[11px] text-[#8c8c8c]">
                                                            Paket: {p.plan?.name || 'Starter Lite'}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3.5 font-mono font-bold text-[#262626]">
                                                        {formatRupiah(p.amount)}
                                                    </TableCell>

                                                    <TableCell className="py-3.5">
                                                        {isPaid ? (
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52c41a]">
                                                                <span className="size-1.5 rounded-full bg-[#52c41a]" />
                                                                Disetujui
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#faad14]">
                                                                <span className="size-1.5 rounded-full bg-[#faad14]" />
                                                                Menunggu
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="py-3.5 text-right">
                                                        {!isPaid ? (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleQuickApprove(p.id, p.invoice_number)}
                                                                className="h-7 text-xs px-2.5 font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded cursor-pointer"
                                                            >
                                                                Setujui
                                                            </Button>
                                                        ) : (
                                                            <Link href="/admin/payments" prefetch>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-7 text-xs px-2.5 rounded border-[#d9d9d9] hover:bg-[#fafafb] text-[#595959] cursor-pointer"
                                                                >
                                                                    Detail
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-4">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-[#f0f0f0]">
                            <div className="flex flex-col gap-0.5">
                                <CardTitle className="text-sm font-bold">Pelanggan Baru</CardTitle>
                                <CardDescription>Pendaftaran workspace terbaru</CardDescription>
                            </div>
                            <Link href="/admin/clients" prefetch>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-[#1677ff] hover:text-[#0958d9] hover:bg-[#e6f4ff] font-semibold cursor-pointer rounded"
                                >
                                    <span>Semua</span>
                                </Button>
                            </Link>
                        </CardHeader>

                        <CardContent className="pt-4 flex flex-col gap-3">
                            {clientsList.length === 0 ? (
                                <div className="text-center py-6 text-xs text-[#8c8c8c]">
                                    Belum ada klien terdaftar.
                                </div>
                            ) : (
                                clientsList.map((client) => {
                                    const initial = (client.name || 'W').slice(0, 2).toUpperCase();

                                    return (
                                        <div
                                            key={client.id}
                                            className="flex items-center justify-between p-3 rounded-lg border border-[#f0f0f0] bg-[#fafafb] hover:bg-white hover:border-[#1677ff]/40 transition-all"
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="size-9 rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] font-bold text-xs flex items-center justify-center shrink-0">
                                                    {initial}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <div className="font-semibold text-xs text-[#262626] truncate">
                                                        {client.name}
                                                    </div>
                                                    <div className="text-[11px] text-[#8c8c8c] truncate">
                                                        {client.subscription?.plan?.name || 'Starter Lite'} • {client.phone || '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            <Link href={`/admin/clients/${client.id}`} prefetch>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs px-2.5 rounded border-[#d9d9d9] hover:border-[#1677ff] hover:text-[#1677ff] text-[#595959] cursor-pointer"
                                                >
                                                    Lihat
                                                </Button>
                                            </Link>
                                        </div>
                                    );
                                })
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
