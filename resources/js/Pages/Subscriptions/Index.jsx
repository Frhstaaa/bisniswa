import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import DurationAdjustModal from '../../Components/DurationAdjustModal';
import ModalPortal from '../../Components/ui/ModalPortal';
import {
    Calendar,
    Zap,
    PauseCircle,
    PlayCircle,
    ShieldCheck,
    History,
    CreditCard,
    Plus,
    X,
    Clock,
    Sparkles,
    CheckCircle2,
    QrCode,
    Receipt,
    ArrowRight,
    Building2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import { Progress } from '../../Components/ui/progress';
import { Separator } from '../../Components/ui/separator';
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from '../../Components/ui/table';

export default function SubscriptionsIndex({ workspace, subscription, plans = [], audits = [], payments = [] }) {
    const { props } = usePage();
    const isSuperAdmin = props?.auth?.user?.role === 'superadmin';

    const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
    const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(plans[0]?.id || 1);
    const [paymentMethod, setPaymentMethod] = useState('qris'); // 'qris' | 'bca_va' | 'bank_transfer'
    const [topupAmount, setTopupAmount] = useState(10000);
    const [topupReason, setTopupReason] = useState('Top-up kuota pesan tambahan');
    const [processing, setProcessing] = useState(false);

    // Auto-open checkout modal if plan_id is passed in query string (from pricing page)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const planParam = params.get('plan_id');
            if (planParam) {
                const targetId = parseInt(planParam);
                if (targetId && plans.some((p) => p.id === targetId)) {
                    setSelectedPlanForCheckout(targetId);
                    setIsCheckoutModalOpen(true);
                }
            }
        }
    }, [plans]);

    const handleTopup = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post('/subscriptions/topup-quota', {
            subscription_id: subscription?.id || 1,
            additional_quota: parseInt(topupAmount),
            reason: topupReason,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setIsTopupModalOpen(false);
            },
        });
    };

    const handleCheckout = (e) => {
        e.preventDefault();
        setProcessing(true);

        router.post('/subscriptions/checkout', {
            plan_id: selectedPlanForCheckout,
            payment_method: paymentMethod,
        }, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setIsCheckoutModalOpen(false);
            },
        });
    };

    const handleTogglePause = () => {
        const action = subscription?.paused_at ? 'melanjutkan (resume)' : 'membekukan (pause)';
        const reason = prompt(`Masukkan alasan ${action} langganan:`, 'Permintaan klien / libur operasional');
        if (reason) {
            router.post('/subscriptions/toggle-pause', {
                subscription_id: subscription?.id || 1,
                reason,
            }, { preserveScroll: true });
        }
    };

    const daysRemaining = subscription
        ? Math.max(0, Math.ceil((new Date(subscription.ends_at) - new Date()) / (1000 * 60 * 60 * 24)))
        : 24;

    const chosenPlan = plans.find((p) => p.id === parseInt(selectedPlanForCheckout)) || plans[0];

    return (
        <AppLayout title="Kelola Langganan">
            <Head title="Sistem Langganan & Saldo Kuota — MARDIRA WA" />

            <div className="space-y-6 animate-fade-in-up">
                {/* 1. TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Paket Langganan & Saldo Kuota
                            </h1>
                            <Badge variant="outline" className="text-[10px] font-mono font-semibold border-emerald-200 bg-emerald-50 text-emerald-800">
                                GRACE PERIOD 3 HARI
                            </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Kelola masa aktif kontrak WhatsApp Gateway, alokasi kuota pesan bulanan, dan pembayaran otomatis.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => setIsCheckoutModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs h-8 rounded-md"
                        >
                            <QrCode className="w-3.5 h-3.5 mr-1 text-white" />
                            <span>Perpanjang / Upgrade Paket</span>
                        </Button>

                        {isSuperAdmin && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTogglePause}
                                    className={`h-8 text-xs font-medium rounded-md border-slate-200 ${subscription?.paused_at ? 'text-emerald-700' : 'text-slate-700'}`}
                                >
                                    {subscription?.paused_at ? (
                                        <>
                                            <PlayCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                            <span>Lanjutkan (Admin)</span>
                                        </>
                                    ) : (
                                        <>
                                            <PauseCircle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                            <span>Jeda Akun (Admin)</span>
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsDurationModalOpen(true)}
                                    className="border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium shadow-2xs h-8 rounded-md"
                                >
                                    <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                    <span>Sesuaikan Masa Aktif (Admin)</span>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* 2. STATS OVERVIEW CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Masa Aktif */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.02 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200 shadow-xs hover:shadow-md transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-slate-500">
                                        Sisa Masa Aktif Langganan
                                    </CardDescription>
                                    <Badge variant={subscription?.paused_at ? 'secondary' : 'emerald'} className="text-[10px] font-bold">
                                        {subscription?.paused_at ? 'DIBEKUKAN' : `${daysRemaining} HARI TERSISA`}
                                    </Badge>
                                </div>
                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight pt-1">
                                    {subscription ? new Date(subscription.ends_at).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    }) : '30 November 2026'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs text-slate-500">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span>Periode Aktif</span>
                                    <span className="font-semibold text-slate-700">
                                        {subscription ? new Date(subscription.starts_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '1 Nov'} -{' '}
                                        {subscription ? new Date(subscription.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Nov 2026'}
                                    </span>
                                </div>
                                <Progress value={Math.min(100, Math.max(0, (daysRemaining / 30) * 100))} className="h-1.5" />
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Card 2: Saldo Kuota Pesan */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.06 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200 shadow-xs hover:shadow-md transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-slate-500">
                                        Sisa Saldo Kuota Pesan
                                    </CardDescription>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => (isSuperAdmin ? setIsTopupModalOpen(true) : setIsCheckoutModalOpen(true))}
                                        className="h-6 text-[10px] px-2 font-bold text-emerald-700 border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100"
                                    >
                                        <Plus className="w-3 h-3 mr-0.5" />
                                        <span>{isSuperAdmin ? 'Top Up (Admin)' : 'Tambah Kuota'}</span>
                                    </Button>
                                </div>
                                <CardTitle className="text-2xl font-black text-emerald-700 tracking-tight pt-1">
                                    {subscription?.remaining_message_quota?.toLocaleString('id-ID') ?? '50.000'}
                                    <span className="text-xs font-normal text-slate-500 ml-1.5">pesan</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-xs text-slate-500">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span>Total Alokasi Bulanan</span>
                                    <span className="font-semibold text-slate-700">
                                        {subscription?.monthly_message_quota?.toLocaleString('id-ID') ?? '50.000'} kuota
                                    </span>
                                </div>
                                <Progress
                                    value={
                                        subscription
                                            ? Math.min(100, (subscription.remaining_message_quota / subscription.monthly_message_quota) * 100)
                                            : 75
                                    }
                                    className="h-1.5"
                                />
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Card 3: Status Paket */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.18, delay: 0.1 }}
                        whileHover={{ y: -3, transition: { duration: 0.12 } }}
                    >
                        <Card className="h-full border-slate-200 shadow-xs hover:shadow-md transition-all">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-slate-500">
                                        Paket yang Sedang Aktif
                                    </CardDescription>
                                    <Badge variant="gold" className="text-[10px] font-bold">
                                        REKOMENDASI
                                    </Badge>
                                </div>
                                <CardTitle className="text-2xl font-black text-slate-900 tracking-tight pt-1">
                                    {subscription?.plan?.name ?? 'Enterprise Pro'}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-xs text-slate-600">
                                <div className="flex items-center justify-between text-[11px]">
                                    <span>Batas Multi-Device</span>
                                    <span className="font-bold text-slate-800">5 Perangkat WhatsApp</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span>BisnisWA UltraSync Engine (Enterprise Native & Anti-Ban)</span>
                                    <span className="font-bold text-emerald-700">Didukung</span>
                                </div>
                                <div className="flex items-center justify-between text-[11px]">
                                    <span>Anti-Ban Jitter & Spintax</span>
                                    <span className="font-bold text-emerald-700">Aktif Otomatis</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* 3. PAYMENT & INVOICE HISTORY TABLE */}
                <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-900">Riwayat Pembayaran & Invoice</CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Transaksi pembayaran paket langganan dan bukti konfirmasi otomatis
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setIsCheckoutModalOpen(true)}
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-8"
                        >
                            <Plus className="w-3 h-3 mr-1 text-white" />
                            <span>Beli Paket Baru</span>
                        </Button>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Nomor Invoice</TableHead>
                                    <TableHead className="text-xs">Paket / Layanan</TableHead>
                                    <TableHead className="text-xs">Nominal Tagihan</TableHead>
                                    <TableHead className="text-xs">Metode Pembayaran</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs">Tanggal</TableHead>
                                    <TableHead className="text-xs text-right">Kuitansi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-6 text-slate-400 text-xs">
                                            Belum ada transaksi pembayaran.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell className="font-mono font-bold text-emerald-700 text-xs">
                                                {p.invoice_number}
                                            </TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-800">
                                                {p.plan?.name || 'Paket Langganan'}
                                            </TableCell>
                                            <TableCell className="text-xs font-bold text-slate-900">
                                                Rp {parseInt(p.amount).toLocaleString('id-ID')}
                                            </TableCell>
                                            <TableCell className="text-xs uppercase font-medium text-slate-600">
                                                {p.payment_method === 'qris' ? 'QRIS Instan' : p.payment_method === 'bca_va' ? 'BCA Virtual Account' : 'Transfer Bank'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={p.status === 'approved' || p.status === 'paid' ? 'emerald' : 'warning'}
                                                    className="text-[10px] font-bold"
                                                >
                                                    {p.status === 'approved' || p.status === 'paid' ? 'LUNAS (AKTIF)' : 'PENDING'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {new Date(p.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <a
                                                    href={`/subscriptions/invoice/${p.invoice_number}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-emerald-700 transition-colors"
                                                >
                                                    <Receipt className="w-3.5 h-3.5" />
                                                    <span>Cetak</span>
                                                </a>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>

                {/* 4. AUDIT TRAIL LOGS */}
                <Card className="border-slate-200 shadow-xs">
                    <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm font-bold text-slate-900">Audit Trail Perubahan Durasi & Kuota</CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Log resmi setiap penyesuaian masa aktif, tanggal berakhir, dan bonus kuota oleh Super Admin
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-xs">Aksi / Tindakan</TableHead>
                                    <TableHead className="text-xs">Alasan Perubahan</TableHead>
                                    <TableHead className="text-xs">Admin Penanggung Jawab</TableHead>
                                    <TableHead className="text-xs">Waktu Eksekusi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {audits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-6 text-slate-400 text-xs">
                                            Belum ada histori audit penyesuaian langganan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    audits.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell>
                                                <Badge variant="emerald" className="text-[10px] font-bold font-mono">
                                                    {a.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-700">{a.reason}</TableCell>
                                            <TableCell className="text-xs font-semibold text-slate-800">
                                                {a.admin?.name || 'Sistem Gateway'}
                                            </TableCell>
                                            <TableCell className="text-xs text-slate-500">
                                                {new Date(a.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>

            {/* ================= MODAL CHECKOUT OTOMATIS (QRIS & VIRTUAL ACCOUNT) ================= */}
            <ModalPortal isOpen={isCheckoutModalOpen} onClose={() => setIsCheckoutModalOpen(false)}>
                <AnimatePresence>
                    {isCheckoutModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto"
                            onClick={() => setIsCheckoutModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.94, opacity: 0, y: 16 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.94, opacity: 0, y: 16 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="relative bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-slate-200/80 my-auto text-left"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <QrCode className="w-5 h-5 text-emerald-700" />
                                        <h3 className="font-bold text-base text-[#0f172a]">Perpanjang / Pembayaran Otomatis</h3>
                                    </div>
                                    <button onClick={() => setIsCheckoutModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleCheckout} className="space-y-4 text-xs">
                                    {/* Choose Plan */}
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1.5">Pilih Paket Langganan:</label>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {plans.map((p) => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => setSelectedPlanForCheckout(p.id)}
                                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                                        selectedPlanForCheckout === p.id
                                                            ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600'
                                                            : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="font-bold text-[#0f172a] text-xs">{p.name}</div>
                                                    <div className="text-xs font-black text-emerald-700 mt-0.5">
                                                        Rp {parseInt(p.price_monthly).toLocaleString('id-ID')} /bln
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 mt-1">
                                                        +{p.limits?.monthly_message_quota?.toLocaleString()} Kuota Pesan
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Choose Method */}
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1.5">Metode Pembayaran:</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('qris')}
                                                className={`p-2.5 rounded-xl border text-center transition-all ${
                                                    paymentMethod === 'qris'
                                                        ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-700'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="block text-xs">QRIS</span>
                                                <span className="text-[10px] text-slate-500">Instan Realtime</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('bca_va')}
                                                className={`p-2.5 rounded-xl border text-center transition-all ${
                                                    paymentMethod === 'bca_va'
                                                        ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-700'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="block text-xs">BCA VA</span>
                                                <span className="text-[10px] text-slate-500">Virtual Account</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('bank_transfer')}
                                                className={`p-2.5 rounded-xl border text-center transition-all ${
                                                    paymentMethod === 'bank_transfer'
                                                        ? 'border-emerald-600 bg-emerald-50 font-bold text-emerald-700'
                                                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="block text-xs">Transfer Bank</span>
                                                <span className="text-[10px] text-slate-500">Verifikasi Manual</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Interactive QRIS Preview Box */}
                                    {paymentMethod === 'qris' && (
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                                            <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl border border-slate-300 shadow-xs flex items-center justify-center">
                                                <QrCode className="w-24 h-24 text-emerald-700" />
                                            </div>
                                            <div className="text-[11px] font-bold text-slate-700">
                                                Scan dengan BCA, Mandiri, GoPay, OVO, Dana, ShopeePay
                                            </div>
                                            <div className="text-xs font-mono font-black text-emerald-700">
                                                Total: Rp {chosenPlan ? parseInt(chosenPlan.price_monthly).toLocaleString('id-ID') : '299.000'}
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'bca_va' && (
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-center">
                                            <div className="text-[11px] text-slate-500">Nomor Virtual Account BCA:</div>
                                            <div className="font-mono text-base font-black text-emerald-700 tracking-widest">
                                                8091 0812 9988 2341
                                            </div>
                                            <div className="text-[10px] text-slate-400">Atas Nama: Politeknik Mardira Indonesia (WA SaaS)</div>
                                        </div>
                                    )}

                                    <div className="pt-2 flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCheckoutModalOpen(false)}
                                            className="text-xs"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
                                        >
                                            {processing ? 'Memproses Gateway...' : 'Konfirmasi & Aktifkan Sekarang →'}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </ModalPortal>

            {/* Modal Topup Kuota Bonus (Super Admin Only) */}
            <ModalPortal isOpen={isSuperAdmin && isTopupModalOpen} onClose={() => setIsTopupModalOpen(false)}>
                <AnimatePresence>
                    {isSuperAdmin && isTopupModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-md overflow-y-auto"
                            onClick={() => setIsTopupModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.94, opacity: 0, y: 16 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.94, opacity: 0, y: 16 }}
                                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                className="relative bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200/80 my-auto text-left"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-base text-[#0f172a]">Top Up Saldo Kuota Pesan (Admin)</h3>
                                    <button onClick={() => setIsTopupModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleTopup} className="space-y-3.5 text-xs">
                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Jumlah Kuota Tambahan</label>
                                        <select
                                            value={topupAmount}
                                            onChange={(e) => setTopupAmount(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                        >
                                            <option value="5000">+5.000 Pesan</option>
                                            <option value="10000">+10.000 Pesan</option>
                                            <option value="25000">+25.000 Pesan</option>
                                            <option value="50000">+50.000 Pesan</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-slate-700 mb-1">Alasan / Catatan</label>
                                        <input
                                            type="text"
                                            value={topupReason}
                                            onChange={(e) => setTopupReason(e.target.value)}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="pt-2 flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsTopupModalOpen(false)}
                                            className="text-xs"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                                        >
                                            {processing ? 'Menyimpan...' : 'Tambahkan Kuota'}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </ModalPortal>

            {/* Modal Sesuaikan Masa Aktif (Super Admin Only) */}
            {isSuperAdmin && (
                <DurationAdjustModal
                    isOpen={isDurationModalOpen}
                    onClose={() => setIsDurationModalOpen(false)}
                    subscription={subscription}
                />
            )}
        </AppLayout>
    );
}
