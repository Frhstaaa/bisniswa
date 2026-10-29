import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../../Layouts/AppLayout';
import {
    Package,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Smartphone,
    MessageSquare,
    Zap,
    Users,
    Shield,
    Sparkles,
    Check,
    X,
    TrendingUp,
    HelpCircle,
    Calendar,
    Radio,
    Clock,
    Lock,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../Components/ui/card';
import { Badge } from '../../../Components/ui/badge';
import { Button } from '../../../Components/ui/button';

export default function AdminPlansIndex({ plans, metrics, filters }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || 'all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [deleteModalPlan, setDeleteModalPlan] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        slug: '',
        price_monthly: '',
        price_annually: '',
        max_devices: 1,
        monthly_message_quota: 5000,
        daily_broadcast_limit: 1000,
        api_rate_limit_per_minute: 30,
        spintax_enabled: true,
        auto_reply: true,
        webhook_access: true,
        schedule_broadcast: true,
        multi_agent: false,
        ai_bot: false,
        is_active: true,
    });

    const formatRupiah = (val) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(val || 0);
    };

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/plans', { search, status: statusFilter }, { preserveState: true, replace: true });
    };

    const handleFilterStatus = (newStatus) => {
        setStatusFilter(newStatus);
        router.get('/admin/plans', { search, status: newStatus }, { preserveState: true, replace: true });
    };

    const openCreateModal = () => {
        setEditingPlan(null);
        setForm({
            name: '',
            slug: '',
            price_monthly: 99000,
            price_annually: 990000,
            max_devices: 1,
            monthly_message_quota: 5000,
            daily_broadcast_limit: 1000,
            api_rate_limit_per_minute: 30,
            spintax_enabled: true,
            auto_reply: true,
            webhook_access: true,
            schedule_broadcast: true,
            multi_agent: false,
            ai_bot: false,
            is_active: true,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (plan) => {
        setEditingPlan(plan);
        const limits = plan.limits || {};
        const features = plan.features || {};

        setForm({
            name: plan.name || '',
            slug: plan.slug || '',
            price_monthly: plan.price_monthly || 0,
            price_annually: plan.price_annually || 0,
            max_devices: limits.max_devices ?? 1,
            monthly_message_quota: limits.monthly_message_quota ?? 5000,
            daily_broadcast_limit: limits.daily_broadcast_limit ?? 1000,
            api_rate_limit_per_minute: limits.api_rate_limit_per_minute ?? 30,
            spintax_enabled: Boolean(features.spintax_enabled ?? true),
            auto_reply: Boolean(features.auto_reply ?? true),
            webhook_access: Boolean(features.webhook_access ?? true),
            schedule_broadcast: Boolean(features.schedule_broadcast ?? true),
            multi_agent: Boolean(features.multi_agent ?? false),
            ai_bot: Boolean(features.ai_bot ?? false),
            is_active: Boolean(plan.is_active),
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (editingPlan) {
            router.put(`/admin/plans/${editingPlan.id}`, form, {
                onFinish: () => {
                    setIsSubmitting(false);
                    setIsModalOpen(false);
                },
            });
        } else {
            router.post('/admin/plans', form, {
                onFinish: () => {
                    setIsSubmitting(false);
                    setIsModalOpen(false);
                },
            });
        }
    };

    const handleToggleStatus = (plan) => {
        router.post(`/admin/plans/${plan.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deleteModalPlan) return;
        setIsSubmitting(true);
        router.delete(`/admin/plans/${deleteModalPlan.id}`, {
            onFinish: () => {
                setIsSubmitting(false);
                setDeleteModalPlan(null);
            },
        });
    };

    return (
        <AppLayout title="Kelola Paket Layanan">
            <Head title="Kelola Paket Layanan (Plans) — Super Admin" />

            <div className="space-y-6 animate-fade-in-up">
                {/* 1. HEADER SECTION */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Package className="w-5 h-5" />
                            </span>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    Katalog & Pengatur Paket SaaS
                                </h1>
                                <p className="text-xs text-slate-500">
                                    Atur harga bulanan/tahunan, kuota pesan, batas perangkat WhatsApp, dan hak akses fitur tiap paket.
                                </p>
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={openCreateModal}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-4 rounded-xl gap-2 shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Paket Baru</span>
                    </Button>
                </div>

                {/* 2. STATS KPI CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <Card className="border-slate-200 shadow-2xs">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardDescription className="text-xs font-semibold text-slate-500">Total Paket</CardDescription>
                            <Package className="w-4 h-4 text-slate-400" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-black text-slate-900">{metrics.total_plans}</div>
                            <p className="text-[11px] text-slate-500 mt-0.5">Tersedia di sistem</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-2xs">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardDescription className="text-xs font-semibold text-emerald-700">Paket Aktif</CardDescription>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-black text-emerald-700">{metrics.active_plans}</div>
                            <p className="text-[11px] text-slate-500 mt-0.5">Tayang di Landing Page</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-2xs">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardDescription className="text-xs font-semibold text-slate-500">Paket Arsip</CardDescription>
                            <XCircle className="w-4 h-4 text-slate-400" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-black text-slate-600">{metrics.inactive_plans}</div>
                            <p className="text-[11px] text-slate-500 mt-0.5">Disembunyikan dari publik</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-2xs">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardDescription className="text-xs font-semibold text-amber-700">Langganan Aktif</CardDescription>
                            <Users className="w-4 h-4 text-amber-600" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-black text-amber-700">{metrics.total_subscribers}</div>
                            <p className="text-[11px] text-slate-500 mt-0.5">Tenant aktif berlangganan</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. TOOLBAR: SEARCH & STATUS TABS */}
                <Card className="border-slate-200 shadow-2xs">
                    <CardContent className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari nama atau slug paket..."
                                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </form>

                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs font-medium self-stretch sm:self-auto justify-center">
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('all')}
                                className={`px-3 py-1 rounded-md transition-all ${
                                    statusFilter === 'all' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Semua ({metrics.total_plans})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('active')}
                                className={`px-3 py-1 rounded-md transition-all ${
                                    statusFilter === 'active' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Aktif ({metrics.active_plans})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('inactive')}
                                className={`px-3 py-1 rounded-md transition-all ${
                                    statusFilter === 'inactive' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Nonaktif ({metrics.inactive_plans})
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. PLANS LIST TABLE / CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {plans.map((plan) => {
                        const limits = plan.limits || {};
                        const features = plan.features || {};

                        return (
                            <motion.div
                                key={plan.id}
                                layout
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="h-full"
                            >
                                <Card className={`h-full flex flex-col justify-between border-2 transition-all ${
                                    plan.is_active ? 'border-slate-200 hover:border-emerald-400 bg-white shadow-2xs' : 'border-dashed border-slate-300 bg-slate-50/60 opacity-80'
                                }`}>
                                    <div>
                                        {/* Plan Header */}
                                        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <CardTitle className="text-lg font-black text-slate-900">{plan.name}</CardTitle>
                                                    {plan.is_active ? (
                                                        <Badge variant="emerald" className="text-[10px] font-bold">Aktif</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-[10px] text-slate-400">Arsip</Badge>
                                                    )}
                                                </div>
                                                <CardDescription className="text-xs font-mono text-slate-400 mt-0.5">
                                                    slug: {plan.slug}
                                                </CardDescription>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(plan)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                                    title="Edit Paket"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteModalPlan(plan)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    title="Hapus Paket"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </CardHeader>

                                        {/* Pricing block */}
                                        <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-baseline justify-between">
                                            <div>
                                                <div className="text-xl font-black text-emerald-800">
                                                    {formatRupiah(plan.price_monthly)}
                                                    <span className="text-xs font-normal text-slate-500"> /bln</span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-medium">
                                                    {formatRupiah(plan.price_annually)} /tahun
                                                </div>
                                            </div>

                                            <Badge variant="outline" className="text-[10px] font-mono bg-white text-slate-600">
                                                {plan.active_subscriptions_count || 0} Pelanggan
                                            </Badge>
                                        </div>

                                        {/* Limits list */}
                                        <CardContent className="pt-4 space-y-2.5 text-xs text-slate-600">
                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 text-slate-500">
                                                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                                    Maksimal Device:
                                                </span>
                                                <strong className="font-bold text-slate-800">{limits.max_devices ?? 1} Perangkat</strong>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 text-slate-500">
                                                    <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                                                    Kuota Pesan Bulanan:
                                                </span>
                                                <strong className="font-bold text-emerald-700">
                                                    {Number(limits.monthly_message_quota ?? 5000).toLocaleString('id-ID')} Pesan
                                                </strong>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 text-slate-500">
                                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                    Limit Broadcast Harian:
                                                </span>
                                                <strong className="font-semibold text-slate-800">
                                                    {Number(limits.daily_broadcast_limit ?? 1000).toLocaleString('id-ID')} /hari
                                                </strong>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <span className="flex items-center gap-1.5 text-slate-500">
                                                    <Zap className="w-3.5 h-3.5 text-slate-400" />
                                                    REST API Rate Limit:
                                                </span>
                                                <strong className="font-semibold text-slate-800">
                                                    {limits.api_rate_limit_per_minute ?? 30} req/menit
                                                </strong>
                                            </div>

                                            {/* Feature Badges list */}
                                            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                                                {features.spintax_enabled && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                        <Sparkles className="w-2.5 h-2.5" /> Spintax
                                                    </span>
                                                )}
                                                {features.auto_reply && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-blue-50 text-blue-800 border border-blue-200">
                                                        <Zap className="w-2.5 h-2.5" /> Auto Reply
                                                    </span>
                                                )}
                                                {features.webhook_access && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-purple-50 text-purple-800 border border-purple-200">
                                                        <Radio className="w-2.5 h-2.5" /> Webhook
                                                    </span>
                                                )}
                                                {features.multi_agent && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                                                        <Users className="w-2.5 h-2.5" /> Multi-CS
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </div>

                                    {/* Footer Switch Status */}
                                    <div className="p-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between text-xs">
                                        <span className="text-[11px] font-medium text-slate-500">
                                            Status Publikasi
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleStatus(plan)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                                plan.is_active
                                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                            }`}
                                        >
                                            {plan.is_active ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                                            <span>{plan.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {plans.length === 0 && (
                    <Card className="border-dashed border-slate-300 p-12 text-center">
                        <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                        <h3 className="font-bold text-slate-700 text-sm">Tidak ada paket yang ditemukan</h3>
                        <p className="text-xs text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau buat paket baru.</p>
                    </Card>
                )}
            </div>

            {/* ================= MODAL TAMBAH / EDIT PAKET ================= */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Package className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <h3 className="text-sm font-bold">
                                            {editingPlan ? `Edit Paket: ${editingPlan.name}` : 'Tambah Paket Baru'}
                                        </h3>
                                        <p className="text-[11px] text-slate-400">
                                            Konfigurasi harga, kuota pesan, dan spesifikasi paket SaaS
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-xs">
                                {/* Basic Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700">Nama Paket *</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="Contoh: Pro Bisnis"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700">Slug URL (Opsional)</label>
                                        <input
                                            type="text"
                                            value={form.slug}
                                            onChange={(e) => setForm({ ...form, slug: e.target.value })}
                                            placeholder="pro-bisnis (otomatis jika kosong)"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-emerald-950">Harga Bulanan (Rp) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="1000"
                                            value={form.price_monthly}
                                            onChange={(e) => setForm({ ...form, price_monthly: e.target.value })}
                                            placeholder="99000"
                                            className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="font-bold text-emerald-950">Harga Tahunan (Rp) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            step="1000"
                                            value={form.price_annually}
                                            onChange={(e) => setForm({ ...form, price_annually: e.target.value })}
                                            placeholder="990000"
                                            className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                {/* Limits & Quotas */}
                                <div className="space-y-3">
                                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                                        Limitasi Kuota & Kapasitas Perangkat
                                    </h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-slate-700">Maksimum Perangkat WhatsApp</label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="100"
                                                value={form.max_devices}
                                                onChange={(e) => setForm({ ...form, max_devices: parseInt(e.target.value) || 1 })}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-slate-700">Kuota Pesan per Bulan</label>
                                            <input
                                                type="number"
                                                required
                                                min="100"
                                                step="500"
                                                value={form.monthly_message_quota}
                                                onChange={(e) => setForm({ ...form, monthly_message_quota: parseInt(e.target.value) || 5000 })}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-slate-700">Limit Broadcast per Hari</label>
                                            <input
                                                type="number"
                                                required
                                                min="50"
                                                step="100"
                                                value={form.daily_broadcast_limit}
                                                onChange={(e) => setForm({ ...form, daily_broadcast_limit: parseInt(e.target.value) || 1000 })}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="font-semibold text-slate-700">REST API Rate Limit (req/menit)</label>
                                            <input
                                                type="number"
                                                required
                                                min="5"
                                                max="1000"
                                                value={form.api_rate_limit_per_minute}
                                                onChange={(e) => setForm({ ...form, api_rate_limit_per_minute: parseInt(e.target.value) || 30 })}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Toggles */}
                                <div className="space-y-2">
                                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                                        Hak Akses Fitur Aplikasi
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={form.spintax_enabled}
                                                onChange={(e) => setForm({ ...form, spintax_enabled: e.target.checked })}
                                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                            />
                                            <span className="font-semibold text-slate-700">Spintax Anti-Ban</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={form.auto_reply}
                                                onChange={(e) => setForm({ ...form, auto_reply: e.target.checked })}
                                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                            />
                                            <span className="font-semibold text-slate-700">Auto Reply Bot</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={form.webhook_access}
                                                onChange={(e) => setForm({ ...form, webhook_access: e.target.checked })}
                                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                            />
                                            <span className="font-semibold text-slate-700">Webhook Realtime</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={form.schedule_broadcast}
                                                onChange={(e) => setForm({ ...form, schedule_broadcast: e.target.checked })}
                                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                            />
                                            <span className="font-semibold text-slate-700">Jadwal Broadcast</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={form.multi_agent}
                                                onChange={(e) => setForm({ ...form, multi_agent: e.target.checked })}
                                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                            />
                                            <span className="font-semibold text-slate-700">Multi-Agent CS</span>
                                        </label>

                                        <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-100 transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={form.ai_bot}
                                                onChange={(e) => setForm({ ...form, ai_bot: e.target.checked })}
                                                className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                            />
                                            <span className="font-semibold text-slate-700">AI Assistant Bot</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                <div className="p-3 bg-slate-100 rounded-xl flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-slate-800">Status Publikasi Paket</div>
                                        <div className="text-[11px] text-slate-500">Tampilkan paket ini pada halaman harga dan opsi registrasi</div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={form.is_active}
                                        onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 h-5 w-5"
                                    />
                                </div>

                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                        className="h-9 px-4 text-xs font-semibold"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-5 text-xs font-semibold gap-1.5"
                                    >
                                        {isSubmitting ? 'Menyimpan...' : editingPlan ? 'Simpan Perubahan' : 'Buat Paket Sekarang'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ================= MODAL KONFIRMASI HAPUS ================= */}
            <AnimatePresence>
                {deleteModalPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4"
                        >
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Hapus Paket Langganan?</h3>
                                    <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                                Apakah Anda yakin ingin menghapus paket <strong>"{deleteModalPlan.name}"</strong>? Jika paket masih memiliki pelanggan aktif, sistem akan menolak penghapusan untuk menjaga konsistensi data invoice & tagihan.
                            </p>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteModalPlan(null)}
                                    className="h-8 text-xs font-semibold"
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isSubmitting}
                                    onClick={confirmDelete}
                                    className="h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                    {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Paket'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
