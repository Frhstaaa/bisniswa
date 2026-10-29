import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../../Layouts/AppLayout';
import ModalPortal from '../../../Components/ui/ModalPortal';
import {
    Receipt,
    Search,
    CreditCard,
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    X,
    Building2,
    DollarSign,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../Components/ui/card';
import { Badge } from '../../../Components/ui/badge';
import { Button } from '../../../Components/ui/button';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '../../../Components/ui/table';

export default function PaymentsIndex({ payments, filters, stats, workspaces, plans }) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        workspace_id: workspaces[0]?.id || '',
        plan_id: plans[0]?.id || '',
        amount: plans[0]?.price_monthly || 99000,
        payment_method: 'bank_transfer',
        status: 'paid',
        notes: 'Konfirmasi pembayaran transfer bank manual oleh Super Admin',
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
        router.get('/admin/payments', {
            search: searchTerm,
            status: filters.status,
        }, { preserveState: true });
    };

    const handleFilterStatus = (newStatus) => {
        router.get('/admin/payments', {
            search: searchTerm,
            status: newStatus,
        }, { preserveState: true });
    };

    const handleApprove = (paymentId, invoiceNo) => {
        if (confirm(`Konfirmasi pelunasan Invoice ${invoiceNo}? Ini akan otomatis mengaktifkan langganan dan menambahkan kuota pesan klien.`)) {
            router.post(`/admin/payments/${paymentId}/approve`);
        }
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        post('/admin/payments', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    return (
        <AppLayout title="Pembayaran & Invoice">
            <Head title="Manajemen Pembayaran & Invoice — Super Admin" />

            <div className="space-y-6 animate-fade-in-up pb-8">
                {/* 1. STANDARDIZED TOP HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                <Receipt className="w-6 h-6 text-emerald-600 shrink-0" />
                                <span>Manajemen Pembayaran & Invoice</span>
                            </h1>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                TRANSAKSI SAAS
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-2xl">
                            Verifikasi tagihan langganan klien, konfirmasi mutasi bank, dan alokasikan kuota pesan secara otomatis.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm h-9 px-4 rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4 stroke-[2.5]" />
                            <span>Catat Pembayaran Manual</span>
                        </Button>
                    </div>
                </div>

                {/* 2. REVENUE & STATS KPI CARDS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="border-slate-200/90 shadow-xs rounded-xl h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Total Penerimaan Lunas
                            </CardTitle>
                            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                                <DollarSign className="h-3.5 w-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4">
                            <div className="text-2xl font-black text-slate-900 tracking-tight">
                                {formatRupiah(stats.total_revenue)}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Dari {stats.paid_count} transaksi terverifikasi
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/90 shadow-xs rounded-xl h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Menunggu Konfirmasi (Pending)
                            </CardTitle>
                            <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
                                <Clock className="h-3.5 w-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4">
                            <div className="text-2xl font-black text-amber-800 tracking-tight">
                                {stats.pending_count} Invoice
                            </div>
                            <p className="text-xs text-amber-700 mt-1">
                                Perlu diverifikasi oleh Super Admin
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/90 shadow-xs rounded-xl h-full">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
                            <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Transaksi Selesai
                            </CardTitle>
                            <div className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0 px-4 pb-4">
                            <div className="text-2xl font-black text-emerald-700 tracking-tight">
                                {stats.paid_count} Invoice
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                                Langganan & kuota telah aktif
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 3. TOOLBAR FILTER & SEARCH */}
                <Card className="border-slate-200/90 shadow-xs rounded-xl overflow-hidden">
                    <CardContent className="p-4 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 shadow-2xs w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('all')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    filters.status === 'all'
                                        ? 'bg-white text-emerald-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Semua Tagihan
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('pending')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    filters.status === 'pending'
                                        ? 'bg-white text-amber-800 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Menunggu ({stats.pending_count})
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterStatus('paid')}
                                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                                    filters.status === 'paid'
                                        ? 'bg-white text-emerald-700 shadow-xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Lunas ({stats.paid_count})
                            </button>
                        </div>

                        {/* Search Input */}
                        <form onSubmit={handleSearch} className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari No. Invoice atau Klien..."
                                className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                            />
                        </form>
                    </CardContent>
                </Card>

                {/* 4. PAYMENTS TABLE */}
                <Card className="border-slate-200/90 shadow-xs overflow-hidden rounded-xl">
                    <div className="overflow-x-auto">
                        <Table className="w-full">
                            <TableHeader className="bg-slate-50/80">
                                <TableRow className="border-b border-slate-200/80">
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[150px]">No. Invoice & Tanggal</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[160px]">Klien / Workspace</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 min-w-[120px]">Paket</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-32">Nominal Tagihan</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-28">Metode</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 w-24">Status</TableHead>
                                    <TableHead className="text-xs font-bold text-slate-700 text-right w-32 pr-6">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-xs text-slate-400">
                                            Tidak ada riwayat pembayaran yang ditemukan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.data.map((p) => (
                                        <TableRow key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                            {/* Invoice & Date */}
                                            <TableCell className="py-3.5">
                                                <div className="font-bold text-xs font-mono text-slate-900">
                                                    {p.invoice_number}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {new Date(p.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </div>
                                            </TableCell>

                                            {/* Workspace */}
                                            <TableCell className="py-3.5 text-xs">
                                                <div className="font-semibold text-slate-900">
                                                    {p.workspace?.name || 'Workspace'}
                                                </div>
                                                <div className="text-[11px] text-slate-500 font-mono">
                                                    {p.workspace?.phone || '-'}
                                                </div>
                                            </TableCell>

                                            {/* Plan */}
                                            <TableCell className="py-3.5 text-xs text-slate-700">
                                                <span className="font-medium">{p.plan?.name || 'Starter Lite'}</span>
                                            </TableCell>

                                            {/* Amount */}
                                            <TableCell className="py-3.5 font-bold text-xs text-slate-900 whitespace-nowrap">
                                                {formatRupiah(p.amount)}
                                            </TableCell>

                                            {/* Payment Method */}
                                            <TableCell className="py-3.5 text-xs uppercase font-mono text-slate-600 whitespace-nowrap">
                                                {p.payment_method.replace('_', ' ')}
                                            </TableCell>

                                            {/* Status Badge */}
                                            <TableCell className="py-3.5 whitespace-nowrap">
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

                                            {/* Action */}
                                            <TableCell className="py-3.5 text-right whitespace-nowrap pr-6">
                                                {p.status === 'pending' ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(p.id, p.invoice_number)}
                                                        className="h-7 text-xs px-2.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-2xs cursor-pointer"
                                                    >
                                                        Konfirmasi Lunas
                                                    </Button>
                                                ) : (
                                                    <span className="text-[11px] text-slate-400 font-medium">
                                                        Terverifikasi
                                                    </span>
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

            {/* CREATE MANUAL PAYMENT MODAL */}
            {isCreateModalOpen && (
                <ModalPortal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                        onClick={() => setIsCreateModalOpen(false)}
                    >
                        <div
                            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto text-left"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Catat Pembayaran Manual</h3>
                                    <p className="text-xs text-slate-500">Buat invoice penerimaan langganan secara manual</p>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer rounded-lg hover:bg-slate-200/60 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4 text-xs">
                                <div>
                                    <label className="block font-medium text-slate-700 mb-1.5">Pilih Klien / Workspace <span className="text-red-500">*</span></label>
                                    <select
                                        value={data.workspace_id}
                                        onChange={(e) => setData('workspace_id', e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                        required
                                    >
                                        {workspaces.map((w) => (
                                            <option key={w.id} value={w.id}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1.5">Paket Langganan</label>
                                        <select
                                            value={data.plan_id}
                                            onChange={(e) => {
                                                const selected = plans.find((p) => p.id === parseInt(e.target.value));
                                                setData((prev) => ({
                                                    ...prev,
                                                    plan_id: e.target.value,
                                                    amount: selected?.price_monthly || 99000,
                                                }));
                                            }}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                            required
                                        >
                                            {plans.map((p) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1.5">Nominal (Rp) <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1.5">Metode Pembayaran</label>
                                        <select
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                        >
                                            <option value="bank_transfer">Transfer Bank (BCA/Mandiri)</option>
                                            <option value="qris">QRIS Otomatis</option>
                                            <option value="manual_admin">Tunai / Kas Langsung</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1.5">Status Langsung</label>
                                        <select
                                            value={data.status}
                                            onChange={(e) => setData('status', e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold text-emerald-700"
                                        >
                                            <option value="paid">LUNAS (Otomatis Aktifkan)</option>
                                            <option value="pending">PENDING (Menunggu Transfer)</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block font-medium text-slate-700 mb-1.5">Catatan / Referensi Mutasi</label>
                                    <textarea
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        rows={2}
                                        placeholder="Contoh: Bukti transfer rek BCA #0918 disetujui"
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="rounded-lg h-9 text-xs font-semibold"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="default"
                                        size="sm"
                                        disabled={processing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 rounded-lg shadow-2xs"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan Pembayaran'}
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
