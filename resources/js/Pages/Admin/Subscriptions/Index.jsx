import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../../Layouts/AppLayout';
import ModalPortal from '../../../Components/ui/ModalPortal';
import {
    Calendar,
    Plus,
    History,
    Shield,
    Clock,
    Zap,
    X,
    CheckCircle2,
    PauseCircle,
    PlayCircle,
    Users,
    Activity,
    CreditCard,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../Components/ui/card';
import { Badge } from '../../../Components/ui/badge';
import { Button } from '../../../Components/ui/button';
import { Progress } from '../../../Components/ui/progress';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '../../../Components/ui/table';

export default function SubscriptionsIndex({ subscriptions, audits }) {
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
    const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);

    // Duration Form
    const durationForm = useForm({
        subscription_id: '',
        days: 30,
        reason: 'Penyesuaian perpanjangan masa aktif oleh Super Admin',
    });

    // Custom Dates Form
    const customDatesForm = useForm({
        subscription_id: '',
        starts_at: '',
        ends_at: '',
        reason: 'Setting rentang tanggal khusus oleh Super Admin',
    });

    // Topup Quota Form
    const topupForm = useForm({
        subscription_id: '',
        additional_quota: 5000,
        reason: 'Bonus alokasi kuota pesan oleh Super Admin',
    });

    const openAdjustDuration = (sub) => {
        setSelectedSubscription(sub);
        durationForm.setData({
            subscription_id: sub.id,
            days: 30,
            reason: 'Penyesuaian perpanjangan masa aktif oleh Super Admin',
        });
        customDatesForm.setData({
            subscription_id: sub.id,
            starts_at: sub.starts_at ? sub.starts_at.slice(0, 10) : '',
            ends_at: sub.ends_at ? sub.ends_at.slice(0, 10) : '',
            reason: 'Setting rentang tanggal khusus oleh Super Admin',
        });
        setIsAdjustModalOpen(true);
    };

    const openTopupQuota = (sub) => {
        setSelectedSubscription(sub);
        topupForm.setData({
            subscription_id: sub.id,
            additional_quota: 5000,
            reason: 'Bonus alokasi kuota pesan tambahan',
        });
        setIsTopupModalOpen(true);
    };

    const handleDurationSubmit = (e) => {
        e.preventDefault();
        durationForm.post('/admin/subscriptions/adjust-duration', {
            onSuccess: () => setIsAdjustModalOpen(false),
        });
    };

    const handleTopupSubmit = (e) => {
        e.preventDefault();
        topupForm.post('/admin/subscriptions/topup-quota', {
            onSuccess: () => setIsTopupModalOpen(false),
        });
    };

    const handleTogglePause = (subId, currentStatus) => {
        const action = currentStatus === 'paused' ? 'mengaktifkan kembali' : 'menjeda (pause)';
        if (confirm(`Apakah Anda yakin ingin ${action} langganan ini?`)) {
            router.post('/admin/subscriptions/toggle-pause', {
                subscription_id: subId,
                reason: `Status diubah menjadi ${action} oleh Super Admin`,
            });
        }
    };

    const activeCount = (subscriptions?.data || []).filter((s) => s.status === 'active').length;
    const graceCount = (subscriptions?.data || []).filter((s) => s.status === 'grace_period').length;

    return (
        <AppLayout title="Langganan & Durasi">
            <Head title="Manajemen Langganan & Durasi Fleksibel — Super Admin" />

            <div className="space-y-6 animate-fade-in-up pb-8">
                {/* 1. STANDARDIZED PAGE HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-emerald-600 shrink-0" />
                                <span>Manajemen Langganan & Durasi Fleksibel</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                AUDIT LOG ACTIVE
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                            Atur masa aktif custom (+/- N hari atau rentang tanggal), top-up kuota pesan, dan pantau jejak audit log.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white shadow-2xs text-xs font-semibold text-slate-700">
                            Aktif: <strong className="text-emerald-700">{activeCount}</strong> | Grace Period: <strong className="text-amber-700">{graceCount}</strong>
                        </div>
                    </div>
                </div>

                {/* 2. THREE SUMMARY KPI STAT CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-slate-200/90 shadow-xs rounded-xl h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Total Tenant Berlangganan
                            </CardTitle>
                            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                                <Users className="h-3.5 w-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4">
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {subscriptions?.total || subscriptions?.data?.length || 0} Workspace
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                {activeCount} berjalan aktif tanpa hambatan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/90 shadow-xs rounded-xl h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Status Grace Period (Tenggang)
                            </CardTitle>
                            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                                <Clock className="h-3.5 w-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4">
                            <div className="text-2xl font-black text-amber-800 tracking-tight">
                                {graceCount} Tenant
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                Masa tenggang 3 hari sebelum penonaktifan
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/90 shadow-xs rounded-xl h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Kontrol Otoritas Super Admin
                            </CardTitle>
                            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                                <Shield className="h-3.5 w-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4">
                            <div className="text-2xl font-black text-emerald-700 tracking-tight">
                                100% Fleksibel
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">
                                Penyesuaian tanggal & bonus kuota instan
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. SUBSCRIPTIONS TABLE CARD */}
                <Card className="border-slate-200/90 shadow-xs overflow-hidden rounded-xl">
                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-900">
                                Daftar Langganan Klien Aktif
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                                Semua tenant dengan paket dan sisa masa aktif masing-masing
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="border-b border-slate-200/80">
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[160px]">Klien / Workspace</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[120px]">Paket</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[180px]">Masa Aktif (Mulai - Berakhir)</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-32">Sisa Kuota Pesan</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-28">Status</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 text-right w-36 pr-6">Aksi Super Admin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions?.data?.map((sub) => (
                                    <TableRow key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Klien / Workspace */}
                                        <TableCell className="py-3.5">
                                            <div className="font-bold text-xs text-slate-900">
                                                {sub.workspace?.name || 'Workspace'}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                {sub.workspace?.phone || '-'}
                                            </div>
                                        </TableCell>

                                        {/* Paket */}
                                        <TableCell className="py-3.5 text-xs font-semibold text-slate-800">
                                            {sub.plan?.name || 'Starter Lite'}
                                        </TableCell>

                                        {/* Masa Aktif */}
                                        <TableCell className="py-3.5 text-xs text-slate-600">
                                            <div className="font-mono text-slate-900 font-medium">
                                                {new Date(sub.starts_at).toLocaleDateString('id-ID')} s/d{' '}
                                                <strong>{new Date(sub.ends_at).toLocaleDateString('id-ID')}</strong>
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                Grace Period: {sub.grace_period_days} hari
                                            </div>
                                        </TableCell>

                                        {/* Sisa Kuota */}
                                        <TableCell className="py-3.5 text-xs whitespace-nowrap">
                                            <div className="font-mono">
                                                <strong className="text-slate-900 font-bold">
                                                    {sub.remaining_message_quota.toLocaleString()}
                                                </strong>
                                                <span className="text-slate-400 text-[11px]"> / {sub.monthly_message_quota.toLocaleString()}</span>
                                            </div>
                                        </TableCell>

                                        {/* Status Badge */}
                                        <TableCell className="py-3.5 whitespace-nowrap">
                                            {sub.status === 'active' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                                    <span>AKTIF</span>
                                                </span>
                                            ) : sub.status === 'grace_period' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200/80">
                                                    <Clock className="w-2.5 h-2.5 text-amber-600" />
                                                    <span>GRACE PERIOD</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200/80">
                                                    <span>{sub.status.toUpperCase()}</span>
                                                </span>
                                            )}
                                        </TableCell>

                                        {/* Aksi Super Admin (Single Line Nowrap) */}
                                        <TableCell className="py-3.5 text-right whitespace-nowrap pr-6">
                                            <div className="inline-flex items-center justify-end gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openAdjustDuration(sub)}
                                                    className="h-7 text-xs px-2.5 font-semibold border-slate-200 text-slate-700 hover:text-slate-900 rounded-md cursor-pointer"
                                                >
                                                    <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                    <span>Durasi</span>
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openTopupQuota(sub)}
                                                    className="h-7 text-xs px-2.5 font-semibold border-slate-200 text-slate-700 hover:text-slate-900 rounded-md cursor-pointer"
                                                >
                                                    <Plus className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                                    <span>Kuota</span>
                                                </Button>

                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleTogglePause(sub.id, sub.status)}
                                                    className="h-7 text-xs px-2.5 font-semibold text-slate-700 rounded-md cursor-pointer"
                                                >
                                                    {sub.status === 'paused' ? 'Resume' : 'Pause'}
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* 4. AUDIT TRAIL LOGS */}
                <Card className="border-slate-200/90 shadow-xs overflow-hidden rounded-xl">
                    <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <History className="w-4 h-4 text-emerald-600" />
                                <span>Jejak Audit Penyesuaian Langganan (Audit Log)</span>
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500 mt-0.5">
                                Rekam jejak seluruh penyesuaian durasi dan kuota oleh Super Admin
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="border-b border-slate-200/80">
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[140px]">Waktu</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[160px]">Klien / Workspace</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[120px]">Admin</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[120px]">Tindakan</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[200px]">Alasan Perubahan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {audits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-xs text-slate-400">
                                            Belum ada log penyesuaian langganan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    audits.map((audit) => (
                                        <TableRow key={audit.id} className="hover:bg-slate-50/80 transition-colors">
                                            <TableCell className="py-3 text-[11px] font-mono text-slate-500 whitespace-nowrap">
                                                {new Date(audit.created_at).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="py-3 text-xs font-bold text-slate-900">
                                                {audit.subscription?.workspace?.name || 'Workspace'}
                                            </TableCell>
                                            <TableCell className="py-3 text-xs text-slate-600 font-medium">
                                                {audit.admin_user?.name || audit.admin?.name || 'Super Admin'}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                    {audit.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3 text-xs text-slate-600">
                                                {audit.reason}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* ADJUST DURATION MODAL */}
            {isAdjustModalOpen && selectedSubscription && (
                <ModalPortal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsAdjustModalOpen(false)}
                    >
                        <div
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Sesuaikan Durasi Langganan</h3>
                                    <p className="text-xs text-slate-500">{selectedSubscription.workspace?.name}</p>
                                </div>
                                <button
                                    onClick={() => setIsAdjustModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-200/60 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleDurationSubmit} className="p-5 space-y-4 text-xs">
                                <div>
                                    <label className="block font-medium text-slate-700 mb-1.5">
                                        Penyesuaian Hari (+ Tambah / - Kurang)
                                    </label>
                                    <div className="grid grid-cols-4 gap-2 mb-2">
                                        {[+7, +30, +90, +365].map((d) => (
                                            <button
                                                type="button"
                                                key={d}
                                                onClick={() => durationForm.setData('days', d)}
                                                className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                                    durationForm.data.days === d
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                +{d} hari
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        value={durationForm.data.days}
                                        onChange={(e) => durationForm.setData('days', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-slate-700 mb-1.5">
                                        Alasan Penyesuaian (Audit Log)
                                    </label>
                                    <textarea
                                        value={durationForm.data.reason}
                                        onChange={(e) => durationForm.setData('reason', e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsAdjustModalOpen(false)} className="rounded-lg h-9 text-xs font-semibold">
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="default"
                                        size="sm"
                                        disabled={durationForm.processing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 rounded-lg shadow-2xs"
                                    >
                                        Terapkan Perubahan
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </ModalPortal>
            )}

            {/* TOPUP QUOTA MODAL */}
            {isTopupModalOpen && selectedSubscription && (
                <ModalPortal isOpen={isTopupModalOpen} onClose={() => setIsTopupModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsTopupModalOpen(false)}
                    >
                        <div
                            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Top-up Kuota Pesan Tenant</h3>
                                    <p className="text-xs text-slate-500">{selectedSubscription.workspace?.name}</p>
                                </div>
                                <button
                                    onClick={() => setIsTopupModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-200/60 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleTopupSubmit} className="p-5 space-y-4 text-xs">
                                <div>
                                    <label className="block font-medium text-slate-700 mb-1.5">
                                        Jumlah Tambahan Kuota Pesan
                                    </label>
                                    <div className="grid grid-cols-3 gap-2 mb-2">
                                        {[2000, 5000, 25000].map((q) => (
                                            <button
                                                type="button"
                                                key={q}
                                                onClick={() => topupForm.setData('additional_quota', q)}
                                                className={`py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                                    topupForm.data.additional_quota === q
                                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                +{q.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        value={topupForm.data.additional_quota}
                                        onChange={(e) => topupForm.setData('additional_quota', parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 font-bold focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="block font-medium text-slate-700 mb-1.5">
                                        Alasan Top-up Kuota
                                    </label>
                                    <textarea
                                        value={topupForm.data.reason}
                                        onChange={(e) => topupForm.setData('reason', e.target.value)}
                                        rows={2}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
                                        required
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setIsTopupModalOpen(false)} className="rounded-lg h-9 text-xs font-semibold">
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="default"
                                        size="sm"
                                        disabled={topupForm.processing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 rounded-lg shadow-2xs"
                                    >
                                        Tambah Kuota
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
