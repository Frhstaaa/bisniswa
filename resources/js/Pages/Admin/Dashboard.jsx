import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import {
    TrendingUp,
    TrendingDown,
    Building2,
    CreditCard,
    Smartphone,
    Send,
    Users,
    Receipt,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Server,
    Shield,
    ShieldCheck,
    Download,
    Calendar,
    Settings,
    Package,
    ChevronRight,
    Activity,
    Cpu,
    ExternalLink,
    Zap,
    MoreHorizontal,
} from 'lucide-react';
import { Button } from '../../Components/ui/button';

export default function AdminDashboard({
    metrics = {},
    plansBreakdown = [],
    revenueTrend = [],
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

    // Mantis Style Income Chart Data (Weekly vs Monthly)
    const weeklyData = [
        { label: 'Mon', value: 1200000, height: 45 },
        { label: 'Tue', value: 1850000, height: 65 },
        { label: 'Wed', value: 2990000, height: 95, peak: true },
        { label: 'Thu', value: 1500000, height: 55 },
        { label: 'Fri', value: 2400000, height: 80 },
        { label: 'Sat', value: 890000, height: 35 },
        { label: 'Sun', value: metrics.total_revenue > 0 ? 598000 : 0, height: 40, active: true },
    ];

    const monthlyData = [
        { label: 'Jan', value: 12500000, height: 40 },
        { label: 'Feb', value: 18000000, height: 58 },
        { label: 'Mar', value: 24500000, height: 75 },
        { label: 'Apr', value: 21000000, height: 68 },
        { label: 'May', value: 29000000, height: 88, peak: true },
        { label: 'Jun', value: 26500000, height: 82 },
        { label: 'Jul', value: 31000000, height: 95, active: true },
    ];

    const activeChartData = incomeView === 'week' ? weeklyData : monthlyData;

    return (
        <AppLayout title="Dashboard Statistics">
            <Head title="Mantis Statistics Dashboard — Admin BisnisWA" />

            <div className="space-y-6 pb-12 font-sans antialiased text-[#1f1f1f]">
                {/* ================= 1. MANTIS BREADCRUMB & HEADER ================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#e6ebf1]">
                    <div>
                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-1.5 text-xs text-[#8c8c8c] mb-1 font-medium">
                            <Link href="/admin/dashboard" className="hover:text-[#1677ff] transition-colors">
                                Dashboard
                            </Link>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#262626]">Widget</span>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#1677ff] font-semibold">Statistics</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#262626]">
                            Statistics Dashboard
                        </h1>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5">
                        <Link href="/admin/payments" prefetch>
                            <Button
                                size="sm"
                                className="h-9 px-3.5 text-xs font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.043)] transition-all flex items-center gap-1.5"
                            >
                                <Receipt className="size-3.5" />
                                <span>Verifikasi Tagihan ({metrics.pending_payments_count || 0})</span>
                            </Button>
                        </Link>
                        <Link href="/admin/settings" prefetch>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 px-3.5 text-xs font-semibold border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.02)] transition-all flex items-center gap-1.5"
                            >
                                <Settings className="size-3.5 text-[#8c8c8c]" />
                                <span>Pengaturan</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* ================= 2. MANTIS ANALYTIC E-COMMERCE CARDS (ROW 1) ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* CARD 1: Total Sales (Pendapatan Lunas) */}
                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Total Sales
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                <TrendingUp className="size-3 text-[#52c41a]" />
                                <span>+27.4%</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight font-mono mb-2">
                            {formatRupiah(metrics.total_revenue || 0)}
                        </div>
                        <p className="text-xs text-[#8c8c8c] leading-relaxed">
                            You made an extra <span className="font-semibold text-[#1677ff]">{formatRupiah(metrics.monthly_revenue || 0)}</span> this month
                        </p>
                        {/* Subtle Mantis Corner Accent */}
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-blue-50/60 pointer-events-none" />
                    </motion.div>

                    {/* CARD 2: Total Users (Klien Workspace) */}
                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Total Users
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]">
                                <TrendingUp className="size-3 text-[#1677ff]" />
                                <span>+70.5%</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight font-mono mb-2">
                            {metrics.active_workspaces || 0} <span className="text-sm font-normal text-[#8c8c8c] font-sans">/ {metrics.total_workspaces || 0} Total</span>
                        </div>
                        <p className="text-xs text-[#8c8c8c] leading-relaxed">
                            You made an extra <span className="font-semibold text-[#1677ff]">{metrics.active_subscribers || metrics.active_workspaces || 0} subscribers</span> this year
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-indigo-50/60 pointer-events-none" />
                    </motion.div>

                    {/* CARD 3: Total Orders (Invoice & Transaksi) */}
                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Total Order
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#fffbe6] text-[#faad14] border border-[#ffe58f]">
                                <TrendingDown className="size-3 text-[#faad14]" />
                                <span>-12.4%</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight font-mono mb-2">
                            {paymentsList.length || 0} <span className="text-sm font-normal text-[#8c8c8c] font-sans">Invoices</span>
                        </div>
                        <p className="text-xs text-[#8c8c8c] leading-relaxed">
                            Pending verifikasi <span className="font-semibold text-[#faad14]">{metrics.pending_payments_count || 0} transaksi</span>
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-amber-50/60 pointer-events-none" />
                    </motion.div>

                    {/* CARD 4: Total Page Views (Pesan WhatsApp) */}
                    <motion.div
                        whileHover={{ y: -3, transition: { duration: 0.15 } }}
                        className="bg-white rounded-xl border border-[#e6ebf1] p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all relative overflow-hidden"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[#8c8c8c]">
                                Total Page Views
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                <TrendingUp className="size-3 text-[#52c41a]" />
                                <span>+59.3%</span>
                            </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-[#262626] tracking-tight font-mono mb-2">
                            {(metrics.messages_today || 0).toLocaleString('id-ID')} <span className="text-sm font-normal text-[#8c8c8c] font-sans">Hari Ini</span>
                        </div>
                        <p className="text-xs text-[#8c8c8c] leading-relaxed">
                            Total kumulatif <span className="font-semibold text-[#1677ff]">{(metrics.messages_total || 0).toLocaleString('id-ID')} pesan</span>
                        </p>
                        <div className="absolute -bottom-6 -right-6 size-24 rounded-full bg-emerald-50/60 pointer-events-none" />
                    </motion.div>
                </div>

                {/* ================= 3. MANTIS ROUND ICON STATS (ROW 2) ================= */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Item 1: Active Retensi */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
                        <div className="size-11 rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center shrink-0">
                            <Users className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold text-[#262626]">
                                100% Retensi
                            </div>
                            <div className="text-xs text-[#8c8c8c] truncate">
                                Active Workspace Subscribers
                            </div>
                        </div>
                    </div>

                    {/* Item 2: Connected Gateway Nodes */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
                        <div className="size-11 rounded-full bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f] flex items-center justify-center shrink-0">
                            <Smartphone className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold text-[#262626]">
                                {metrics.online_devices || 0} / {metrics.total_devices || 0} Online
                            </div>
                            <div className="text-xs text-[#8c8c8c] truncate">
                                Baileys Gateway Cluster
                            </div>
                        </div>
                    </div>

                    {/* Item 3: Delivery Rate SLA */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
                        <div className="size-11 rounded-full bg-[#f9f0ff] text-[#722ed1] border border-[#d3adf7] flex items-center justify-center shrink-0">
                            <Send className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold text-[#262626]">
                                {metrics.delivery_rate || 99.4}% Sukses
                            </div>
                            <div className="text-xs text-[#8c8c8c] truncate">
                                Message Delivery Success SLA
                            </div>
                        </div>
                    </div>

                    {/* Item 4: Server Health */}
                    <div className="bg-white rounded-xl border border-[#e6ebf1] p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-4">
                        <div className="size-11 rounded-full bg-[#fffbe6] text-[#faad14] border border-[#ffe58f] flex items-center justify-center shrink-0">
                            <Cpu className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="text-base font-bold text-[#262626]">
                                99.98% Uptime
                            </div>
                            <div className="text-xs text-[#8c8c8c] truncate">
                                FrankenPHP & Octane Ready
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= 4. MANTIS INCOME OVERVIEW & ANALYTICS REPORT (ROW 3) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: INCOME OVERVIEW BAR & AREA CHART (8 cols) */}
                    <div className="lg:col-span-8 bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f0f0f0]">
                            <div>
                                <h3 className="text-sm font-bold text-[#262626]">
                                    Income Overview
                                </h3>
                                <p className="text-xs text-[#8c8c8c] mt-0.5">
                                    Grafik pertumbuhan penerimaan pembayaran langganan SaaS
                                </p>
                            </div>

                            {/* Mantis Segmented Button Group */}
                            <div className="flex items-center gap-1 p-0.5 bg-[#f5f5f5] rounded-lg border border-[#e8e8e8] text-xs font-semibold self-start sm:self-auto">
                                <button
                                    type="button"
                                    onClick={() => setIncomeView('week')}
                                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                        incomeView === 'week'
                                            ? 'bg-white text-[#1677ff] shadow-xs font-bold'
                                            : 'text-[#8c8c8c] hover:text-[#262626]'
                                    }`}
                                >
                                    By Week
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIncomeView('month')}
                                    className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                                        incomeView === 'month'
                                            ? 'bg-white text-[#1677ff] shadow-xs font-bold'
                                            : 'text-[#8c8c8c] hover:text-[#262626]'
                                    }`}
                                >
                                    By Month
                                </button>
                            </div>
                        </div>

                        {/* Interactive Visual Bar Chart (Mantis Styled Columns) */}
                        <div className="h-60 w-full flex items-end justify-between gap-3 pt-8 pb-3 px-2 border-b border-[#f0f0f0]">
                            {activeChartData.map((item, idx) => (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    {/* Hover Tooltip */}
                                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-[#262626] text-white text-[11px] font-mono py-1 px-2.5 rounded shadow-lg pointer-events-none whitespace-nowrap z-20">
                                        {formatRupiah(item.value)} ({item.label})
                                    </div>

                                    {/* Bar Column with Mantis Rounding */}
                                    <div className="w-full max-w-[40px] bg-[#f5f5f5] rounded-t-md overflow-hidden flex items-end h-44">
                                        <div
                                            style={{ height: `${item.height}%` }}
                                            className={`w-full rounded-t-md transition-all duration-300 ${
                                                item.peak
                                                    ? 'bg-[#1677ff] shadow-[0_2px_8px_rgba(22,119,255,0.35)]'
                                                    : item.active
                                                    ? 'bg-[#69b1ff]'
                                                    : 'bg-[#91caff] hover:bg-[#69b1ff]'
                                            }`}
                                        />
                                    </div>

                                    {/* Label */}
                                    <span className={`text-xs font-medium ${item.active || item.peak ? 'text-[#1677ff] font-bold' : 'text-[#8c8c8c]'}`}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Chart Footnote / Summary */}
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
                    </div>

                    {/* RIGHT COLUMN: ANALYTICS REPORT & PLAN DISTRIBUTION (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* WIDGET: Analytics Report (Paket Langganan) */}
                        <div className="bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5">
                            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] mb-4">
                                <div>
                                    <h3 className="text-sm font-bold text-[#262626]">
                                        Analytics Report
                                    </h3>
                                    <p className="text-xs text-[#8c8c8c] mt-0.5">
                                        Distribusi paket langganan tenant
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-[#1677ff] bg-[#e6f4ff] px-2 py-0.5 rounded">
                                    Plans
                                </span>
                            </div>

                            <div className="space-y-4">
                                {plansBreakdown.length > 0 ? (
                                    plansBreakdown.map((plan) => {
                                        const totalSubs = metrics.total_workspaces || 1;
                                        const pct = Math.min(100, Math.round(((plan.subscribers || 0) / totalSubs) * 100));

                                        return (
                                            <div key={plan.id} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-semibold text-[#262626]">{plan.name}</span>
                                                    <span className="font-mono text-[#8c8c8c] font-medium">
                                                        {plan.subscribers || 0} Klien ({pct}%)
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-[#f5f5f5] rounded-full overflow-hidden">
                                                    <div
                                                        style={{ width: `${Math.max(8, pct)}%` }}
                                                        className={`h-full rounded-full ${
                                                            plan.slug === 'enterprise-pro'
                                                                ? 'bg-[#1677ff]'
                                                                : plan.slug === 'pro-bisnis'
                                                                ? 'bg-[#52c41a]'
                                                                : 'bg-[#faad14]'
                                                        }`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-[#262626]">Enterprise Pro</span>
                                                <span className="font-mono text-[#8c8c8c]">5 Klien (62%)</span>
                                            </div>
                                            <div className="h-2 w-full bg-[#f5f5f5] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#1677ff] rounded-full w-[62%]" />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="font-semibold text-[#262626]">Starter Lite</span>
                                                <span className="font-mono text-[#8c8c8c]">3 Klien (38%)</span>
                                            </div>
                                            <div className="h-2 w-full bg-[#f5f5f5] rounded-full overflow-hidden">
                                                <div className="h-full bg-[#52c41a] rounded-full w-[38%]" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* WhatsApp Node Telemetry */}
                            <div className="mt-5 pt-4 border-t border-[#f0f0f0] space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-[#262626] flex items-center gap-1.5">
                                        <Server className="size-3.5 text-[#1677ff]" />
                                        <span>Cluster Telemetry</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#52c41a] bg-[#f6ffed] px-1.5 py-0.2 rounded border border-[#b7eb8f]">
                                        <span className="size-1.5 rounded-full bg-[#52c41a]" />
                                        READY
                                    </span>
                                </div>
                                <div className="p-3 bg-[#fafafb] rounded-lg border border-[#f0f0f0] text-xs space-y-1">
                                    <div className="flex justify-between text-[#8c8c8c]">
                                        <span>Baileys WebSocket RAM:</span>
                                        <span className="font-mono font-bold text-[#262626]">
                                            ~{(engineHealth.baileys?.estimated_ram_mb || 0)} MB
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[#8c8c8c]">
                                        <span>Active Sockets:</span>
                                        <span className="font-mono font-bold text-[#1677ff]">
                                            {metrics.online_devices || 0} Connected
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= 5. MANTIS RECENT ORDERS & USER TRANSACTIONS (ROW 4) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT (8 cols): RECENT ORDERS / PAYMENTS TABLE */}
                    <div className="lg:col-span-8 bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
                        <div className="flex items-center justify-between p-5 border-b border-[#f0f0f0]">
                            <div>
                                <h3 className="text-sm font-bold text-[#262626]">
                                    Recent Orders
                                </h3>
                                <p className="text-xs text-[#8c8c8c] mt-0.5">
                                    Daftar transaksi pembayaran invoice langganan terbaru
                                </p>
                            </div>
                            <Link href="/admin/payments" prefetch>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-[#1677ff] hover:text-[#0958d9] hover:bg-[#e6f4ff] font-semibold cursor-pointer rounded-lg flex items-center gap-1"
                                >
                                    <span>View All</span>
                                    <ArrowRight className="size-3.5" />
                                </Button>
                            </Link>
                        </div>

                        <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-[#fafafb] text-[#595959] font-semibold border-b border-[#f0f0f0]">
                                        <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Tracking No.</th>
                                        <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Product Name</th>
                                        <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Total Order</th>
                                        <th className="py-3 px-4 uppercase text-[11px] tracking-wider">Status</th>
                                        <th className="py-3 px-4 uppercase text-[11px] tracking-wider text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#f0f0f0]">
                                    {paymentsList.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-8 text-center text-xs text-[#8c8c8c]">
                                                Belum ada invoice transaksi.
                                            </td>
                                        </tr>
                                    ) : (
                                        paymentsList.map((p) => {
                                            const isPaid = p.status === 'paid';

                                            return (
                                                <tr key={p.id} className="hover:bg-[#fafafb] transition-colors">
                                                    <td className="py-3.5 px-4 font-mono font-bold text-[#1677ff]">
                                                        {p.invoice_number}
                                                        <div className="text-[10.5px] text-[#8c8c8c] font-sans font-normal">
                                                            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        <div className="font-semibold text-[#262626]">
                                                            {p.workspace?.name || 'Workspace Klien'}
                                                        </div>
                                                        <div className="text-[11px] text-[#8c8c8c]">
                                                            Paket: {p.plan?.name || 'Starter Lite'}
                                                        </div>
                                                    </td>

                                                    <td className="py-3.5 px-4 font-mono font-bold text-[#262626]">
                                                        {formatRupiah(p.amount)}
                                                    </td>

                                                    <td className="py-3.5 px-4">
                                                        {isPaid ? (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#f6ffed] text-[#52c41a] border border-[#b7eb8f]">
                                                                <span className="size-1.5 rounded-full bg-[#52c41a]" />
                                                                Approved
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-[#fffbe6] text-[#faad14] border border-[#ffe58f]">
                                                                <span className="size-1.5 rounded-full bg-[#faad14]" />
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="py-3.5 px-4 text-right">
                                                        {!isPaid ? (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleQuickApprove(p.id, p.invoice_number)}
                                                                className="h-7 text-xs px-2.5 font-semibold bg-[#1677ff] hover:bg-[#0958d9] text-white rounded shadow-xs cursor-pointer"
                                                            >
                                                                Approve
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
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RIGHT (4 cols): NEW CUSTOMERS / ACTIVITY (MANTIS STYLE) */}
                    <div className="lg:col-span-4 bg-white rounded-xl border border-[#e6ebf1] shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5">
                        <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0] mb-4">
                            <div>
                                <h3 className="text-sm font-bold text-[#262626]">
                                    New Customers
                                </h3>
                                <p className="text-xs text-[#8c8c8c] mt-0.5">
                                    Pendaftaran tenant workspace terbaru
                                </p>
                            </div>
                            <Link href="/admin/clients" prefetch>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs text-[#1677ff] hover:text-[#0958d9] hover:bg-[#e6f4ff] font-semibold cursor-pointer rounded"
                                >
                                    <span>All</span>
                                </Button>
                            </Link>
                        </div>

                        <div className="space-y-3">
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
                                            className="flex items-center justify-between p-3 rounded-lg border border-[#f0f0f0] bg-[#fafafb] hover:bg-white hover:border-[#1677ff]/40 hover:shadow-xs transition-all"
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
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
