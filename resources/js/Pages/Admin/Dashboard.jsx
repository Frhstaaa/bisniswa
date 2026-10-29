import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import {
    LayoutDashboard,
    Building2,
    CreditCard,
    Smartphone,
    Send,
    Cpu,
    ArrowUpRight,
    Users,
    Receipt,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Activity,
    Server,
    Shield,
    TrendingUp,
    Download,
    Calendar,
    Settings,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../Components/ui/card';
import { Badge } from '../../Components/ui/badge';
import { Button } from '../../Components/ui/button';
import { Progress } from '../../Components/ui/progress';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '../../Components/ui/table';

export default function AdminDashboard({ metrics, engineHealth, recentPayments, recentClients }) {
    const [timeframe, setTimeframe] = useState('weekly');

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    // Revenue 7-day performance data for visual bar chart
    const revenueChartData = [
        { day: 'Sen', amount: 990000, height: '40%', label: 'Rp 990k' },
        { day: 'Sel', amount: 1290000, height: '55%', label: 'Rp 1,29jt' },
        { day: 'Rab', amount: 2890000, height: '88%', label: 'Rp 2,89jt', peak: true },
        { day: 'Kam', amount: 1590000, height: '62%', label: 'Rp 1,59jt' },
        { day: 'Jum', amount: 2190000, height: '78%', label: 'Rp 2,19jt' },
        { day: 'Sab', amount: 890000, height: '35%', label: 'Rp 890k' },
        { day: 'Min', amount: metrics.total_revenue > 0 ? 299000 : 0, height: '45%', label: 'Rp 299k', current: true },
    ];

    const handleQuickApprove = (paymentId, invoiceNo) => {
        if (confirm(`Setujui pelunasan Invoice ${invoiceNo}? Ini akan otomatis mengaktifkan langganan dan menambahkan kuota klien.`)) {
            router.post(`/admin/payments/${paymentId}/approve`);
        }
    };

    return (
        <AppLayout title="Ikhtisar SaaS Eksekutif">
            <Head title="Panel Eksekutif SaaS — Super Admin" />

            <div className="space-y-6 animate-fade-in-up pb-8">
                {/* 1. STANDARDIZED TOP HEADER & ACTION BAR */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <LayoutDashboard className="w-6 h-6 text-emerald-600 shrink-0" />
                                <span>Ikhtisar Eksekutif Multi-Tenant SaaS</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                ROOT SAAS ADMIN
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                            Monitoring performa pendapatan SaaS, verifikasi transaksi invoice langganan, dan telemetri gateway cluster WhatsApp.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                        <Link href="/admin/payments">
                            <Button
                                variant="default"
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm h-9 px-4 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                            >
                                <Receipt className="w-3.5 h-3.5" />
                                <span>Verifikasi Invoice ({metrics.pending_payments_count})</span>
                            </Button>
                        </Link>
                        <Link href="/admin/settings">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3.5 rounded-lg border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-all flex items-center gap-1.5"
                            >
                                <Settings className="w-3.5 h-3.5 text-slate-500" />
                                <span>Setting Produksi</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 2. FOUR EXECUTIVE REVENUE & USAGE KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* KPI 1: Pendapatan Lunas (MRR) */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.02 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Total Pendapatan Lunas
                                </CardTitle>
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                                    <CreditCard className="h-3.5 w-3.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0 px-4 pb-4">
                                <div className="text-2xl font-black text-slate-900 tracking-tight">
                                    {formatRupiah(metrics.total_revenue)}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <TrendingUp className="w-3 h-3 text-emerald-600" />
                                        <span>+24.8%</span>
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">Bulan Ini</span>
                                </div>
                                <Progress value={85} indicatorClassName="bg-emerald-600" className="h-1.5 mt-2" />
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* KPI 2: Total Workspace & Tenant */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.06 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Klien Workspace Aktif
                                </CardTitle>
                                <div className="h-7 w-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/60 flex items-center justify-center shrink-0">
                                    <Building2 className="h-3.5 w-3.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0 px-4 pb-4">
                                <div className="text-2xl font-black text-slate-900 tracking-tight">
                                    {metrics.active_workspaces} <span className="text-sm font-normal text-slate-500">/ {metrics.total_workspaces} Total</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        <span>100% Aktif</span>
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">0 suspended</span>
                                </div>
                                <Progress value={(metrics.active_workspaces / (metrics.total_workspaces || 1)) * 100} indicatorClassName="bg-emerald-600" className="h-1.5 mt-2" />
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* KPI 3: WhatsApp Nodes Online */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.1 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    WhatsApp Nodes Online
                                </CardTitle>
                                <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                                    <Smartphone className="h-3.5 w-3.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0 px-4 pb-4">
                                <div className="text-2xl font-black text-slate-900 tracking-tight">
                                    {metrics.online_devices} <span className="text-sm font-normal text-slate-500">/ {metrics.total_devices} Unit</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                        Dual-Server Ready
                                    </span>
                                    <span className="text-[11px] text-slate-500 font-medium">Cluster Healthy</span>
                                </div>
                                <Progress value={(metrics.online_devices / (metrics.total_devices || 1)) * 100} indicatorClassName="bg-emerald-600" className="h-1.5 mt-2" />
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* KPI 4: Pesan Hari Ini */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.14 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200/90 shadow-xs hover:shadow-md hover:border-slate-300 transition-all rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Pesan Terkirim Hari Ini
                                </CardTitle>
                                <div className="h-7 w-7 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60 flex items-center justify-center shrink-0">
                                    <Send className="h-3.5 w-3.5" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0 px-4 pb-4">
                                <div className="text-2xl font-black text-slate-900 tracking-tight">
                                    {metrics.messages_today} <span className="text-sm font-normal text-slate-500">Pesan</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-[11px] text-slate-500">
                                        Total Kumulatif: <strong>{metrics.messages_total}</strong>
                                    </span>
                                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        LIVE
                                    </span>
                                </div>
                                <Progress value={95} indicatorClassName="bg-emerald-600" className="h-1.5 mt-2" />
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* 3. MAIN DASHBOARD CONTENT GRID (2 COLUMNS: 8 cols / 4 cols) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: REVENUE CHART & RECENT ORDERS TABLE (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* CHART: Revenue & Traffic Performance */}
                        <Card className="border-slate-200/90 shadow-xs overflow-hidden rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-900">
                                        Performa Penerimaan Pembayaran SaaS (7 Hari Terakhir)
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                        Estimasi omzet harian langganan Starter Lite & Enterprise Pro
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs">
                                    <button
                                        type="button"
                                        onClick={() => setTimeframe('weekly')}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${timeframe === 'weekly' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        Mingguan
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTimeframe('monthly')}
                                        className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${timeframe === 'monthly' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                                    >
                                        Bulanan
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 p-5">
                                {/* Visual Responsive SVG Bar Chart */}
                                <div className="h-56 w-full flex items-end justify-between gap-3 pt-6 pb-2 px-2 border-b border-slate-100">
                                    {revenueChartData.map((item, idx) => (
                                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                            {/* Hover Tooltip */}
                                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] font-mono py-1 px-2 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-20">
                                                {formatRupiah(item.amount)} ({item.day})
                                            </div>

                                            {/* Bar */}
                                            <div className="w-full max-w-[42px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-44">
                                                <div
                                                    style={{ height: item.height }}
                                                    className={`w-full rounded-t-lg transition-all duration-500 ${
                                                        item.peak
                                                            ? 'bg-gradient-to-t from-emerald-700 to-emerald-500 shadow-xs'
                                                            : item.current
                                                            ? 'bg-gradient-to-t from-emerald-400 to-emerald-600'
                                                            : 'bg-emerald-200 group-hover:bg-emerald-300'
                                                    }`}
                                                />
                                            </div>

                                            {/* Label */}
                                            <span className={`text-[11px] font-bold ${item.current ? 'text-emerald-700' : 'text-slate-500'}`}>
                                                {item.day}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Chart Legend & Summary */}
                                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded bg-emerald-600" />
                                            <span>Paket Enterprise Pro</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-3 h-3 rounded bg-emerald-300" />
                                            <span>Paket Starter Lite</span>
                                        </div>
                                    </div>
                                    <div className="font-semibold text-slate-700">
                                        Total Penerimaan: <strong className="text-slate-900">{formatRupiah(metrics.total_revenue)}</strong>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* RECENT ORDERS / PAYMENTS DATA TABLE */}
                        <Card className="border-slate-200/90 shadow-xs overflow-hidden rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-900">
                                        Transaksi & Tagihan Invoice Masuk
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                        Daftar invoice langganan yang perlu diverifikasi atau telah lunas
                                    </CardDescription>
                                </div>
                                <Link href="/admin/payments">
                                    <Button variant="ghost" size="sm" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer">
                                        <span>Kelola Seluruh Tagihan</span>
                                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </Link>
                            </CardHeader>
                            <div className="overflow-x-auto">
                                <Table className="w-full">
                                    <TableHeader className="bg-slate-50/80">
                                        <TableRow className="border-b border-slate-200/80">
                                            <TableHead className="text-xs font-bold text-slate-700 min-w-[140px]">Invoice & Tanggal</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 min-w-[160px]">Klien / Workspace</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 w-28">Nominal</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 w-24">Status</TableHead>
                                            <TableHead className="text-xs font-bold text-slate-700 text-right w-28">Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentPayments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-400">
                                                    Belum ada invoice pembayaran masuk.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            recentPayments.map((p) => (
                                                <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <TableCell className="py-3">
                                                        <div className="font-bold text-xs text-slate-900 font-mono">
                                                            {p.invoice_number}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400">
                                                            {new Date(p.created_at).toLocaleDateString('id-ID')}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3 text-xs">
                                                        <div className="font-semibold text-slate-900">
                                                            {p.workspace?.name || 'Workspace'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            Paket: {p.plan?.name || 'Starter Lite'}
                                                        </div>
                                                    </TableCell>

                                                    <TableCell className="py-3 font-bold text-xs text-slate-900 whitespace-nowrap">
                                                        {formatRupiah(p.amount)}
                                                    </TableCell>

                                                    <TableCell className="py-3 whitespace-nowrap">
                                                        {p.status === 'paid' ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                                LUNAS
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 text-amber-800 text-[10px] font-bold">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                PENDING
                                                            </span>
                                                        )}
                                                    </TableCell>

                                                    <TableCell className="py-3 text-right whitespace-nowrap">
                                                        {p.status === 'pending' ? (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleQuickApprove(p.id, p.invoice_number)}
                                                                className="h-7 text-xs px-2.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs cursor-pointer"
                                                            >
                                                                Verifikasi
                                                            </Button>
                                                        ) : (
                                                            <Link href="/admin/payments">
                                                                <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer">
                                                                    Detail
                                                                </Button>
                                                            </Link>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Card>
                    </div>

                    {/* RIGHT COLUMN: ENGINE HEALTH & CLIENTS (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* WIDGET 1: Dual-Server WhatsApp Microservices */}
                        <Card className="border-slate-200/90 shadow-xs overflow-hidden rounded-xl">
                            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <Server className="w-4 h-4 text-emerald-600" />
                                        <span>Status Server WhatsApp Cluster</span>
                                    </CardTitle>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                        ONLINE
                                    </span>
                                </div>
                                <CardDescription className="text-xs text-slate-500 mt-0.5">
                                    Alokasi memori worker microservices cluster
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3 p-5 text-xs">
                                <div className="p-3.5 rounded-xl border border-emerald-200/80 bg-emerald-50/50 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900">WhatsApp Web JS Engine (Chromium)</span>
                                        <span className="font-mono text-[11px] text-emerald-800 font-bold">
                                            {engineHealth.wwebjs?.active_instances ?? 0} instance aktif
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-slate-500">Official Headless Chromium Web Engine (Zero Delay & Anti-Ban)</p>
                                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-emerald-200/60 text-slate-600">
                                        <span>Estimasi Total RAM:</span>
                                        <span className="font-mono font-bold text-emerald-700">~{engineHealth.wwebjs?.estimated_ram_mb ?? 0} MB</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* WIDGET 2: Recent Clients Signup List */}
                        <Card className="border-slate-200/90 shadow-xs overflow-hidden rounded-xl">
                            <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-sm font-bold text-slate-900">
                                        Klien Baru Terdaftar
                                    </CardTitle>
                                    <CardDescription className="text-xs text-slate-500 mt-0.5">
                                        Workspace tenant terbaru
                                    </CardDescription>
                                </div>
                                <Link href="/admin/clients">
                                    <Button variant="ghost" size="sm" className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer">
                                        <span>Lihat Semua</span>
                                    </Button>
                                </Link>
                            </CardHeader>
                            <CardContent className="space-y-3 p-5 text-xs">
                                {recentClients.map((client) => (
                                    <div key={client.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-2.5 overflow-hidden">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-xs shrink-0">
                                                {client.name.slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="overflow-hidden">
                                                <div className="font-bold text-slate-900 truncate">
                                                    {client.name}
                                                </div>
                                                <div className="text-[10px] text-slate-500 truncate">
                                                    Paket: {client.subscription?.plan?.name || 'Starter Lite'}
                                                </div>
                                            </div>
                                        </div>

                                        <Link href={`/admin/clients/${client.id}`}>
                                            <Button variant="outline" size="sm" className="h-7 text-xs px-2.5 rounded-md border-slate-200 hover:bg-slate-50 cursor-pointer">
                                                Detail
                                            </Button>
                                        </Link>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
