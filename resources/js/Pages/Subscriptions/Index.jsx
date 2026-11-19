import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import DurationAdjustModal from '../../Components/DurationAdjustModal';
import ModalPortal from '../../Components/ui/ModalPortal';
import {
    Calendar,
    PauseCircle,
    PlayCircle,
    Plus,
    X,
    QrCode,
    Receipt,
    ChevronRight,
    Clock,
    Zap,
    CheckCircle2,
} from 'lucide-react';
import { Button } from '../../Components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../Components/ui/card';
import { Progress } from '../../Components/ui/progress';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../../Components/ui/table';

export default function SubscriptionsIndex({ workspace, subscription, plans = [], audits = [], payments = [] }) {
    const { props } = usePage();
    const isSuperAdmin = props?.auth?.user?.role === 'superadmin';

    const [isDurationModalOpen, setIsDurationModalOpen] = useState(false);
    const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(plans[0]?.id || 1);
    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annually'
    const [paymentMethod, setPaymentMethod] = useState('qris'); // 'qris' | 'bca_va' | 'bank_transfer'
    const [topupAmount, setTopupAmount] = useState(10000);
    const [topupReason, setTopupReason] = useState('Top-up kuota pesan tambahan');
    const [processing, setProcessing] = useState(false);

    // Auto-open checkout modal if plan_id or billing_cycle is passed in query string (from pricing page)
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const planParam = params.get('plan_id');
            const cycleParam = params.get('billing_cycle');
            if (cycleParam === 'annually' || cycleParam === 'yearly') {
                setBillingCycle('annually');
            }
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
            billing_cycle: billingCycle,
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

    const quotaPct = subscription
        ? Math.min(100, Math.round((subscription.remaining_message_quota / Math.max(1, subscription.monthly_message_quota)) * 100))
        : 75;
    const daysPct = Math.min(100, Math.max(0, Math.round((daysRemaining / 30) * 100)));

    return (
        <AppLayout title="Kelola Langganan">
            <Head title="Sistem Langganan & Saldo Kuota — SAPA BisnisWA" />

            <div className="flex flex-col gap-6 pb-12 font-sans antialiased text-[#1f1f1f]">
                {/* ================= 1. MANTIS BREADCRUMB & HEADER ================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e6ebf1]">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8c8c8c] mb-1 font-medium">
                            <Link href="/dashboard" className="hover:text-[#1677ff] transition-colors">
                                Dashboard
                            </Link>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#262626]">Workspace</span>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#1677ff] font-semibold">Langganan &amp; Kuota</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-[#262626] tracking-tight">
                            Paket Langganan &amp; Saldo Kuota
                        </h1>
                        <p className="text-xs text-[#8c8c8c] mt-1">
                            Kelola masa aktif kontrak WhatsApp Gateway, alokasi kuota pesan bulanan, dan pembayaran otomatis.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            onClick={() => setIsCheckoutModalOpen(true)}
                            className="h-9 px-3.5 bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold shadow-[0_2px_0_rgba(0,0,0,0.043)] rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                            <QrCode className="size-3.5 text-white" />
                            <span>Perpanjang / Upgrade Paket</span>
                        </Button>

                        {isSuperAdmin && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTogglePause}
                                    className="h-9 text-xs font-semibold rounded-lg border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] cursor-pointer"
                                >
                                    {subscription?.paused_at ? (
                                        <>
                                            <PlayCircle className="size-3.5 mr-1 text-[#52c41a]" />
                                            <span>Lanjutkan (Admin)</span>
                                        </>
                                    ) : (
                                        <>
                                            <PauseCircle className="size-3.5 mr-1 text-[#faad14]" />
                                            <span>Jeda Akun (Admin)</span>
                                        </>
                                    )}
                                </Button>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsDurationModalOpen(true)}
                                    className="h-9 border-[#d9d9d9] bg-white hover:bg-slate-50 text-[#595959] text-xs font-semibold rounded-lg cursor-pointer"
                                >
                                    <Calendar className="size-3.5 mr-1 text-[#1677ff]" />
                                    <span>Sesuaikan Masa Aktif</span>
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* ================= 2. MANTIS STATS OVERVIEW CARDS ================= */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Masa Aktif */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Sisa Masa Aktif</CardDescription>
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                    subscription?.paused_at ? 'text-[#faad14]' : 'text-[#52c41a]'
                                }`}>
                                    <span className={`size-1.5 rounded-full ${subscription?.paused_at ? 'bg-[#faad14]' : 'bg-[#52c41a]'}`} />
                                    {subscription?.paused_at ? 'Dibekukan' : `${daysRemaining} Hari Tersisa`}
                                </span>
                            </div>
                            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight pt-1">
                                {subscription ? new Date(subscription.ends_at).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                }) : '30 November 2026'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <Progress value={daysPct} indicatorClassName="bg-[#52c41a]" />
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-between items-center text-[11px] text-[#8c8c8c]">
                            <span>Periode Aktif</span>
                            <span className="font-semibold text-[#595959]">
                                {subscription ? new Date(subscription.starts_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '1 Nov'} -{' '}
                                {subscription ? new Date(subscription.ends_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '30 Nov 2026'}
                            </span>
                        </CardFooter>
                    </Card>

                    {/* Card 2: Saldo Kuota Pesan */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Sisa Kuota Pesan</CardDescription>
                                <button
                                    type="button"
                                    onClick={() => (isSuperAdmin ? setIsTopupModalOpen(true) : setIsCheckoutModalOpen(true))}
                                    className="text-xs font-semibold text-[#1677ff] hover:underline cursor-pointer"
                                >
                                    + {isSuperAdmin ? 'Top Up (Admin)' : 'Tambah Kuota'}
                                </button>
                            </div>
                            <CardTitle className="text-2xl sm:text-3xl font-bold text-[#1677ff] tracking-tight font-mono pt-1">
                                {subscription?.remaining_message_quota?.toLocaleString('id-ID') ?? '50.000'}
                                <span className="text-sm font-normal text-[#8c8c8c] font-sans ml-1.5">pesan</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <Progress value={quotaPct} indicatorClassName="bg-[#1677ff]" />
                        </CardContent>
                        <CardFooter className="pt-0 flex justify-between items-center text-[11px] text-[#8c8c8c]">
                            <span>Total Alokasi Bulanan</span>
                            <span className="font-semibold text-[#595959]">
                                {subscription?.monthly_message_quota?.toLocaleString('id-ID') ?? '50.000'} kuota
                            </span>
                        </CardFooter>
                    </Card>

                    {/* Card 3: Status Paket */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardDescription className="font-medium">Paket Aktif</CardDescription>
                                <Zap className="size-4 text-[#faad14]" />
                            </div>
                            <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight pt-1">
                                {subscription?.plan?.name ?? 'Enterprise Pro'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-1.5 text-[11px] text-[#595959]">
                            <div className="flex items-center justify-between">
                                <span className="text-[#8c8c8c]">Batas Multi-Device</span>
                                <span className="font-semibold text-[#262626]">{subscription?.plan?.limits?.max_devices || 5} Perangkat WA</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[#8c8c8c]">UltraSync Engine</span>
                                <span className="font-semibold text-[#52c41a]">Didukung</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[#8c8c8c]">Anti-Ban Jitter</span>
                                <span className="font-semibold text-[#52c41a]">Aktif Otomatis</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ================= 3. PAYMENT & INVOICE HISTORY TABLE ================= */}
                <Card className="overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#f0f0f0]">
                        <div className="flex flex-col gap-1">
                            <CardTitle className="text-sm font-bold">Riwayat Pembayaran &amp; Invoice</CardTitle>
                            <CardDescription>
                                Transaksi pembayaran paket langganan dan bukti konfirmasi otomatis
                            </CardDescription>
                        </div>
                        <Button
                            onClick={() => setIsCheckoutModalOpen(true)}
                            size="sm"
                            className="h-8 px-3 bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                            <Plus className="size-3.5 text-white" />
                            <span>Beli Paket Baru</span>
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0">
                        <Table className="min-w-[680px]">
                            <TableHeader>
                                <TableRow className="hover:bg-[#fafafb]">
                                    <TableHead>Nomor Invoice</TableHead>
                                    <TableHead>Paket / Layanan</TableHead>
                                    <TableHead>Nominal Tagihan</TableHead>
                                    <TableHead>Metode Pembayaran</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Tanggal</TableHead>
                                    <TableHead className="text-right">Kuitansi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={7} className="text-center py-8 text-[#8c8c8c]">
                                            Belum ada transaksi pembayaran.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.map((p) => {
                                        const isPaid = p.status === 'approved' || p.status === 'paid';
                                        return (
                                            <TableRow key={p.id}>
                                                <TableCell className="py-3.5 font-mono font-bold text-[#1677ff]">
                                                    {p.invoice_number}
                                                </TableCell>
                                                <TableCell className="py-3.5 font-semibold text-[#262626]">
                                                    {p.plan?.name || 'Paket Langganan'}
                                                </TableCell>
                                                <TableCell className="py-3.5 font-mono font-bold text-[#262626]">
                                                    Rp {parseInt(p.amount).toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="py-3.5 uppercase font-medium text-[#595959]">
                                                    {p.payment_method === 'qris' ? 'QRIS Instan' : p.payment_method === 'bca_va' ? 'BCA Virtual Account' : 'Transfer Bank'}
                                                </TableCell>
                                                <TableCell className="py-3.5">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                                                        isPaid ? 'text-[#52c41a]' : 'text-[#faad14]'
                                                    }`}>
                                                        <span className={`size-1.5 rounded-full ${isPaid ? 'bg-[#52c41a]' : 'bg-[#faad14]'}`} />
                                                        {isPaid ? 'Lunas' : 'Pending'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="py-3.5 text-[#8c8c8c]">
                                                    {new Date(p.created_at).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })}
                                                </TableCell>
                                                <TableCell className="py-3.5 text-right">
                                                    <a
                                                        href={`/subscriptions/invoice/${p.invoice_number}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#d9d9d9] bg-white hover:bg-[#e6f4ff] hover:border-[#91caff] text-[11px] font-semibold text-[#1677ff] transition-colors"
                                                    >
                                                        <Receipt className="size-3.5" />
                                                        <span>Cetak</span>
                                                    </a>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* ================= 4. AUDIT TRAIL LOGS ================= */}
                <Card className="overflow-hidden">
                    <CardHeader className="border-b border-[#f0f0f0]">
                        <CardTitle className="text-sm font-bold">Audit Trail Perubahan Durasi &amp; Kuota</CardTitle>
                        <CardDescription>
                            Log resmi setiap penyesuaian masa aktif, tanggal berakhir, dan bonus kuota oleh Super Admin
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-0">
                        <Table className="min-w-[580px]">
                            <TableHeader>
                                <TableRow className="hover:bg-[#fafafb]">
                                    <TableHead>Aksi / Tindakan</TableHead>
                                    <TableHead>Alasan Perubahan</TableHead>
                                    <TableHead>Admin Penanggung Jawab</TableHead>
                                    <TableHead>Waktu Eksekusi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {audits.length === 0 ? (
                                    <TableRow className="hover:bg-transparent">
                                        <TableCell colSpan={4} className="text-center py-8 text-[#8c8c8c]">
                                            Belum ada histori audit penyesuaian langganan.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    audits.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell className="py-3.5">
                                                <span className="font-mono text-xs font-semibold text-[#1677ff]">
                                                    {a.action}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-3.5 text-[#595959]">{a.reason}</TableCell>
                                            <TableCell className="py-3.5 font-semibold text-[#262626]">
                                                {a.admin?.name || 'Sistem Gateway'}
                                            </TableCell>
                                            <TableCell className="py-3.5 text-[#8c8c8c] font-mono">
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
                    </CardContent>
                </Card>
            </div>

            {/* ================= MODAL CHECKOUT OTOMATIS ================= */}
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
                                className="relative bg-white rounded-xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl border border-[#e6ebf1] my-auto text-left"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                    <div className="flex items-center gap-2">
                                        <div className="size-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center">
                                            <QrCode className="size-4" />
                                        </div>
                                        <h3 className="font-bold text-sm text-[#262626]">Perpanjang / Pembayaran Otomatis</h3>
                                    </div>
                                    <button onClick={() => setIsCheckoutModalOpen(false)} className="text-[#8c8c8c] hover:text-[#262626] p-1 rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer">
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleCheckout} className="flex flex-col gap-4 text-xs">
                                    {/* Billing Cycle Selector */}
                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Siklus Berlangganan:</label>
                                        <div className="grid grid-cols-2 gap-2 p-1 bg-[#f5f5f5] rounded-xl border border-[#e8e8e8]">
                                            <button
                                                type="button"
                                                onClick={() => setBillingCycle('monthly')}
                                                className={`py-2 px-3 rounded-lg font-bold text-center transition-all cursor-pointer ${
                                                    billingCycle === 'monthly'
                                                        ? 'bg-white text-[#1677ff] shadow-xs'
                                                        : 'text-[#595959] hover:text-[#262626]'
                                                }`}
                                            >
                                                <span>Bulanan</span>
                                                <span className="block text-[10px] font-normal text-[#8c8c8c]">Tagihan per 30 Hari</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBillingCycle('annually')}
                                                className={`py-2 px-3 rounded-lg font-bold text-center transition-all cursor-pointer ${
                                                    billingCycle === 'annually'
                                                        ? 'bg-[#1677ff] text-white shadow-xs'
                                                        : 'text-[#595959] hover:text-[#262626]'
                                                }`}
                                            >
                                                <div className="flex items-center justify-center gap-1">
                                                    <span>Tahunan</span>
                                                    <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                                                        billingCycle === 'annually' ? 'bg-amber-300 text-amber-950' : 'bg-[#e6f4ff] text-[#1677ff]'
                                                    }`}>
                                                        Hemat 2 Bln
                                                    </span>
                                                </div>
                                                <span className={`block text-[10px] font-normal ${billingCycle === 'annually' ? 'text-blue-100' : 'text-[#8c8c8c]'}`}>
                                                    Tagihan per 365 Hari
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Choose Plan */}
                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Pilih Paket Langganan:</label>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {plans.map((p) => {
                                                const isYearly = billingCycle === 'annually';
                                                const price = isYearly
                                                    ? parseInt(p.price_annually || (p.price_monthly * 10))
                                                    : parseInt(p.price_monthly);
                                                const quota = isYearly
                                                    ? ((p.limits?.monthly_message_quota ?? 5000) * 12)
                                                    : (p.limits?.monthly_message_quota ?? 5000);

                                                return (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => setSelectedPlanForCheckout(p.id)}
                                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                                            selectedPlanForCheckout === p.id
                                                                ? 'border-[#1677ff] bg-[#e6f4ff]/60 ring-2 ring-[#1677ff]/20'
                                                                : 'border-[#e6ebf1] hover:border-[#91caff]'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span className="font-bold text-[#262626] text-xs">{p.name}</span>
                                                            {isYearly && (
                                                                <span className="text-[9px] font-bold text-[#1677ff] bg-[#e6f4ff] px-1.5 py-0.2 rounded border border-[#91caff]">
                                                                    1 Tahun
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs font-bold text-[#1677ff] mt-0.5 font-mono">
                                                            Rp {price.toLocaleString('id-ID')}
                                                            <span className="text-[10px] font-normal text-[#8c8c8c] font-sans"> {isYearly ? '/tahun' : '/bln'}</span>
                                                        </div>
                                                        <div className="text-[10px] text-[#8c8c8c] mt-1">
                                                            +{quota.toLocaleString()} Kuota Pesan
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Choose Method */}
                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Metode Pembayaran:</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('qris')}
                                                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                                                    paymentMethod === 'qris'
                                                        ? 'border-[#1677ff] bg-[#e6f4ff] font-bold text-[#1677ff]'
                                                        : 'border-[#e6ebf1] text-[#595959] hover:bg-[#fafafb]'
                                                }`}
                                            >
                                                <span className="block text-xs">QRIS</span>
                                                <span className="text-[10px] text-[#8c8c8c]">Instan Realtime</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('bca_va')}
                                                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                                                    paymentMethod === 'bca_va'
                                                        ? 'border-[#1677ff] bg-[#e6f4ff] font-bold text-[#1677ff]'
                                                        : 'border-[#e6ebf1] text-[#595959] hover:bg-[#fafafb]'
                                                }`}
                                            >
                                                <span className="block text-xs">BCA VA</span>
                                                <span className="text-[10px] text-[#8c8c8c]">Virtual Account</span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setPaymentMethod('bank_transfer')}
                                                className={`p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                                                    paymentMethod === 'bank_transfer'
                                                        ? 'border-[#1677ff] bg-[#e6f4ff] font-bold text-[#1677ff]'
                                                        : 'border-[#e6ebf1] text-[#595959] hover:bg-[#fafafb]'
                                                }`}
                                            >
                                                <span className="block text-xs">Transfer Bank</span>
                                                <span className="text-[10px] text-[#8c8c8c]">Verifikasi Manual</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Interactive QRIS Preview Box */}
                                    {paymentMethod === 'qris' && (
                                        <div className="p-4 bg-[#fafafb] rounded-lg border border-[#e6ebf1] text-center flex flex-col gap-2">
                                            <div className="size-32 mx-auto bg-white p-2 rounded-lg border border-[#d9d9d9] shadow-2xs flex items-center justify-center">
                                                <QrCode className="size-24 text-[#1677ff]" />
                                            </div>
                                            <div className="text-[11px] font-semibold text-[#595959]">
                                                Scan dengan BCA, Mandiri, GoPay, OVO, Dana, ShopeePay
                                            </div>
                                            <div className="text-xs font-mono font-bold text-[#1677ff]">
                                                Total: Rp {chosenPlan
                                                    ? (billingCycle === 'annually'
                                                        ? parseInt(chosenPlan.price_annually || (chosenPlan.price_monthly * 10)).toLocaleString('id-ID')
                                                        : parseInt(chosenPlan.price_monthly).toLocaleString('id-ID'))
                                                    : '299.000'} ({billingCycle === 'annually' ? '1 Tahun' : '1 Bulan'})
                                            </div>
                                        </div>
                                    )}

                                    {paymentMethod === 'bca_va' && (
                                        <div className="p-4 bg-[#fafafb] rounded-lg border border-[#e6ebf1] flex flex-col gap-1.5 text-center">
                                            <div className="text-[11px] text-[#8c8c8c]">Nomor Virtual Account BCA:</div>
                                            <div className="font-mono text-base font-bold text-[#1677ff] tracking-widest">
                                                8091 0812 9988 2341
                                            </div>
                                            <div className="text-[10px] text-[#8c8c8c]">Atas Nama: SAPA Alert Engine (WA SaaS)</div>
                                        </div>
                                    )}

                                    <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#f0f0f0]">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCheckoutModalOpen(false)}
                                            className="text-xs border-[#d9d9d9] text-[#595959] rounded-lg cursor-pointer"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold shadow-[0_2px_0_rgba(0,0,0,0.043)] rounded-lg cursor-pointer"
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
                                className="relative bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#e6ebf1] my-auto text-left"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                                    <h3 className="font-bold text-sm text-[#262626]">Top Up Saldo Kuota Pesan (Admin)</h3>
                                    <button onClick={() => setIsTopupModalOpen(false)} className="text-[#8c8c8c] hover:text-[#262626] p-1 rounded-lg hover:bg-[#f5f5f5] transition-colors cursor-pointer">
                                        <X className="size-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleTopup} className="flex flex-col gap-3.5 text-xs">
                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Jumlah Kuota Tambahan</label>
                                        <select
                                            value={topupAmount}
                                            onChange={(e) => setTopupAmount(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:outline-none"
                                        >
                                            <option value="5000">+5.000 Pesan</option>
                                            <option value="10000">+10.000 Pesan</option>
                                            <option value="25000">+25.000 Pesan</option>
                                            <option value="50000">+50.000 Pesan</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Alasan / Catatan</label>
                                        <input
                                            type="text"
                                            value={topupReason}
                                            onChange={(e) => setTopupReason(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#f0f0f0]">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsTopupModalOpen(false)}
                                            className="text-xs border-[#d9d9d9] text-[#595959] rounded-lg cursor-pointer"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold rounded-lg shadow-[0_2px_0_rgba(0,0,0,0.043)] cursor-pointer"
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
