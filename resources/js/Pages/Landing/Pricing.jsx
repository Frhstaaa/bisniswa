import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicLayout, { usePublicAuth } from '../../Layouts/PublicLayout';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import {
    Check,
    Zap,
    Shield,
    Sliders,
    Sparkles,
    CreditCard,
    ArrowRight,
    HelpCircle,
    Building2,
    Lock,
    Smartphone,
    MessageSquare,
    Calculator,
    ChevronDown,
} from 'lucide-react';

const heroContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.05,
        },
    },
};

const heroItemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
};

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function Pricing({ plans = [], stats = {} }) {
    const safePlans = Array.isArray(plans) ? plans : [];
    const { openRegisterModal } = usePublicAuth();
    const { props } = usePage();
    const user = props?.auth?.user;

    const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'yearly'
    const [sliderQuota, setSliderQuota] = useState(15000);
    const [openFaq, setOpenFaq] = useState(0);

    const DEFAULT_FALLBACK_PLANS = [
        {
            id: 1,
            name: 'Starter Lite',
            slug: 'starter',
            price_monthly: 99000,
            monthly_message_quota: 5000,
            max_devices: 1,
            features: [
                '1 Perangkat WhatsApp Terhubung',
                'Kuota 5.000 Pesan per Bulan',
                'Akses BisnisWA UltraSync Engine (Anti-Delay & Anti-Ban)',
                'Live Chat Inbox 2 Arah Real-time',
                'Broadcast Kontak Dasar',
                'Otomasi Auto-Reply Cerdas',
                'REST API Key Standar (30 req/mnt)',
                'Dukungan Komunitas & Email',
            ],
        },
        {
            id: 3,
            name: 'Pro Bisnis',
            slug: 'pro-bisnis',
            price_monthly: 179000,
            monthly_message_quota: 15000,
            max_devices: 3,
            is_popular: true,
            features: [
                '3 Perangkat WhatsApp Terhubung',
                'Kuota 15.000 Pesan per Bulan',
                'Akses UltraSync Engine Sesi Stabil',
                'Live Chat Inbox Multichat Tim',
                'Broadcast Massal CSV + Proteksi Spintax',
                'Otomasi Auto-Reply & Jadwal Broadcast',
                'REST API & Webhook Real-time (60 req/mnt)',
                'Dukungan Teknis Prioritas (4 Jam)',
            ],
        },
        {
            id: 2,
            name: 'Enterprise Pro',
            slug: 'enterprise-pro',
            price_monthly: 299000,
            monthly_message_quota: 50000,
            max_devices: 5,
            features: [
                '5 Perangkat WhatsApp Terhubung',
                'Kuota 50.000 Pesan per Bulan',
                'Dedicated Gateway Instance & Isolasi',
                'Live Chat Multi-Agent CRM Tim',
                'Broadcast Skala Besar + Rotasi Perangkat',
                'Otomasi Auto-Reply & AI Bot Pintar',
                'REST API & Webhook Prioritas (120 req/mnt)',
                'Dukungan Prioritas Dedicated 24/7 (1 Jam)',
            ],
        },
    ];

    // Safely extract feature list whether it's an Array, JSON string, or Object
    const getNormalizedFeatures = (plan) => {
        let feat = plan.features;
        if (typeof feat === 'string') {
            try {
                feat = JSON.parse(feat);
            } catch (e) {
                feat = [feat];
            }
        }
        if (Array.isArray(feat) && feat.length > 0) {
            return feat;
        }

        const maxDev = plan.limits?.max_devices ?? plan.max_devices ?? 1;
        const quota = plan.limits?.monthly_message_quota ?? plan.monthly_message_quota ?? 5000;
        const rateLimit = plan.limits?.api_rate_limit_per_minute ?? (maxDev >= 5 ? 120 : maxDev >= 3 ? 60 : 30);

        const list = [
            `${maxDev} Perangkat WhatsApp Terhubung`,
            `Kuota ${Number(quota).toLocaleString('id-ID')} Pesan per Bulan`,
            'Akses BisnisWA UltraSync Engine Resmi',
            'Live Chat Inbox 2 Arah Real-time',
        ];

        if (feat && typeof feat === 'object') {
            if (feat.spintax_enabled) {
                list.push('Broadcast Massal CSV + Proteksi Spintax');
            } else {
                list.push('Broadcast Kontak Dasar');
            }

            if (feat.auto_reply) {
                list.push('Otomasi Auto-Reply Cerdas');
            }

            if (feat.webhook_access) {
                list.push(`REST API & Webhook Real-time (${rateLimit} req/mnt)`);
            } else {
                list.push(`REST API Key Standar (${rateLimit} req/mnt)`);
            }

            if (feat.schedule_broadcast) {
                list.push('Jadwal Pengiriman Broadcast Otomatis');
            }
        } else {
            list.push('Broadcast Kontak & Pesan Massal');
            list.push(`REST API Key (${rateLimit} req/mnt)`);
        }

        list.push(maxDev >= 5 ? 'Dukungan Prioritas Dedicated 24/7' : maxDev >= 3 ? 'Dukungan Teknis Prioritas (4 Jam)' : 'Dukungan Teknis Komunitas & Email');

        return list;
    };

    const sourcePlans = safePlans.length > 0 ? safePlans : DEFAULT_FALLBACK_PLANS;
    const displayPlans = sourcePlans.map((plan) => {
        const monthlyPrice = Math.round(Number(plan.price_monthly ?? plan.price ?? 99000));
        const maxDev = plan.limits?.max_devices ?? plan.max_devices ?? 1;
        const quota = plan.limits?.monthly_message_quota ?? plan.monthly_message_quota ?? 5000;
        const features = getNormalizedFeatures(plan);
        const isRecommended = Boolean(plan.is_popular || plan.slug === 'pro-bisnis');

        return {
            ...plan,
            id: plan.id,
            name: plan.name,
            slug: plan.slug,
            monthlyPrice,
            max_devices: maxDev,
            monthly_message_quota: quota,
            features,
            is_popular: isRecommended,
        };
    });

    // Handle user clicking Subscribe / Choose Plan
    const handleSelectPlan = (planId) => {
        if (user) {
            // Logged-in user: redirect directly to subscription checkout with plan pre-selected
            router.visit(`/subscriptions?plan_id=${planId}`);
        } else {
            // Guest visitor: open auth modal in registration mode with plan pre-selected
            openRegisterModal(planId);
        }
    };

    // Determine recommended plan based on slider
    const getRecommendedPlan = (quota) => {
        if (quota <= 5000) return 'Starter Lite';
        if (quota <= 15000) return 'Pro Bisnis';
        return 'Enterprise Pro';
    };

    const recommendedPlanName = getRecommendedPlan(sliderQuota);

    const featureMatrix = [
        { name: 'Maksimum Perangkat WhatsApp', starter: '1 Device', pro: '3 Devices', enterprise: '5 Devices' },
        { name: 'Kuota Pesan per Bulan', starter: '5.000 Pesan', pro: '15.000 Pesan', enterprise: '50.000 Pesan' },
        { name: 'Teknologi BisnisWA UltraSync Engine', starter: true, pro: true, enterprise: true },
        { name: 'Live Chat Inbox Multi-Chat Realtime', starter: true, pro: true, enterprise: true },
        { name: 'Broadcast CSV & Proteksi Anti-Ban', starter: 'Dasar', pro: 'Lengkap + Spintax', enterprise: 'Lengkap + Rotasi' },
        { name: 'Auto-Reply & AI Bot Pintar', starter: true, pro: true, enterprise: true },
        { name: 'REST API & Webhook Real-time', starter: '30 req/menit', pro: '60 req/menit', enterprise: '120 req/menit' },
        { name: 'Multi-Agent Workspace Tim', starter: false, pro: 'Hingga 5 CS', enterprise: 'Multi-CS Unlimited' },
        { name: 'Dukungan Teknis', starter: 'Email (24 Jam)', pro: 'Prioritas (4 Jam)', enterprise: 'Dedicated Manager (1 Jam)' },
        { name: 'Jaminan SLA Uptime', starter: '99.5%', pro: '99.9%', enterprise: '99.98%' },
    ];

    const pricingFaqs = [
        {
            q: 'Bagaimana alur berlangganan dan aktivasi paket?',
            a: 'Pilih paket yang sesuai, selesaikan pendaftaran, dan lakukan pembayaran instan via QRIS atau Transfer Bank. Kuota pesan, kapasitas perangkat, dan kredensial API Anda akan aktif seketika dalam 1 menit.',
        },
        {
            q: 'Apakah bisa menghubungkan nomor WhatsApp pribadi atau bisnis?',
            a: 'Ya, MARDIRA WA mendukung semua jenis nomor WhatsApp biasa maupun WhatsApp Business tanpa memerlukan WhatsApp Cloud API berbayar dari Meta.',
        },
        {
            q: 'Bagaimana jika kuota pesan bulanan saya habis sebelum masa aktif berakhir?',
            a: 'Anda dapat melakukan Top-up kuota pesan tambahan kapan saja dari menu Langganan di dashboard tanpa mempengaruhi siklus perpanjangan paket Anda.',
        },
        {
            q: 'Apakah saya bisa upgrade ke paket yang lebih tinggi sewaktu-waktu?',
            a: 'Tentu. Anda dapat meng-upgrade paket kapan saja dengan mudah. Sistem akan menyesuaikan kapasitas perangkat dan sisa kuota Anda secara otomatis.',
        },
    ];

    return (
        <PublicLayout title="Paket & Harga Langganan" plans={safePlans} activeMenu="harga">
            <div className="space-y-16 lg:space-y-24">
                {/* ================= HERO HEADER ================= */}
                <section className="relative overflow-hidden bg-white bg-grid-pattern text-slate-900 pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-10 border-b border-slate-100">
                    <motion.div
                        variants={heroContainerVariants}
                        initial="hidden"
                        animate="visible"
                        className="relative max-w-5xl mx-auto text-center space-y-5"
                    >
                        <motion.div variants={heroItemVariants} className="inline-block gsap-hero-item">
                            <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border-[1.5px] border-[#1e50ff] bg-white text-[#1e50ff] text-[10px] sm:text-xs font-bold sm:font-black uppercase tracking-normal sm:tracking-widest shadow-xs">
                                <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1e50ff] shrink-0" />
                                <span className="hidden sm:inline">PAKET & INVESTASI LAYANAN RESMI</span>
                                <span className="sm:hidden">PAKET & INVESTASI RESMI</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            variants={heroItemVariants}
                            className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight gsap-hero-item"
                        >
                            <span className="font-editorial-italic font-normal tracking-normal text-slate-900">Pilihan Paket</span> Investasi Terbaik untuk <span className="text-[#1e50ff]">Bisnis Anda</span>
                        </motion.h1>

                        <motion.p
                            variants={heroItemVariants}
                            className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed gsap-hero-item"
                        >
                            Pilih paket yang dirancang khusus untuk mengakselerasi skala operasional bisnis Anda. Nikmati kuota pesan melimpah, arsitektur single-engine UltraSync yang stabil, serta integrasi API instan tanpa biaya tersembunyi.
                        </motion.p>

                        {/* Billing Cycle Switch with Fluid layoutId Pill */}
                        <motion.div variants={heroItemVariants} className="pt-6 flex items-center justify-center gsap-hero-item">
                            <div className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200/90 shadow-xs">
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`relative px-5 py-2 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                                        billingCycle === 'monthly' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {billingCycle === 'monthly' && (
                                        <motion.div
                                            layoutId="activeCyclePill"
                                            className="absolute inset-0 bg-[#1e50ff] rounded-full shadow-md"
                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <span className="relative z-10">Pembayaran Bulanan</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`relative px-5 py-2 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                                        billingCycle === 'yearly' ? 'text-white' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {billingCycle === 'yearly' && (
                                        <motion.div
                                            layoutId="activeCyclePill"
                                            className="absolute inset-0 bg-[#1e50ff] rounded-full shadow-md"
                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <span className="relative z-10">Tahunan</span>
                                    <span className="relative z-10 px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 shadow-xs">
                                        HEMAT 20%
                                    </span>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </section>

                {/* ================= PRICING CARDS ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch gsap-card-grid">
                        {displayPlans.map((plan, idx) => {
                            const isYearly = billingCycle === 'yearly';
                            const monthlyPrice = plan.monthlyPrice || plan.price || 99000;
                            const finalPrice = isYearly ? Math.round(monthlyPrice * 0.8) : monthlyPrice;
                            const isRecommended = plan.is_popular;
                            const isMatchedBySlider = plan.name === recommendedPlanName;

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-30px' }}
                                    transition={{ duration: 0.25, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={{ y: -6 }}
                                    className={`flex flex-col gsap-card ${isRecommended ? 'gsap-scale' : ''}`}
                                >
                                    <Card
                                        className={`card-interactive rounded-3xl p-7 flex flex-col justify-between relative bg-white h-full transition-all duration-300 ${
                                            isRecommended
                                                ? 'border-2 border-[#1e50ff] shadow-xl shadow-blue-500/10 md:-translate-y-2'
                                                : isMatchedBySlider
                                                ? 'border-2 border-[#1e50ff]/60 shadow-lg shadow-blue-500/10'
                                                : 'border border-slate-200/90 shadow-card hover:border-blue-300'
                                        }`}
                                    >
                                        {isRecommended ? (
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#1e50ff] text-white font-extrabold text-[10px] uppercase tracking-wider shadow-md whitespace-nowrap">
                                                PALING DIMINATI & DIREKOMENDASIKAN
                                            </div>
                                        ) : isMatchedBySlider ? (
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-blue-100 text-[#1e50ff] border border-blue-300 font-extrabold text-[10px] uppercase tracking-wider shadow-sm whitespace-nowrap">
                                                SESUAI ESTIMASI KUOTA ANDA
                                            </div>
                                        ) : null}

                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <h3 className="text-xl font-black text-slate-900">{plan.name}</h3>
                                                <p className="text-xs text-slate-500">
                                                    Solusi ideal untuk {plan.name === 'Starter Lite' ? 'bisnis pemula & pengujian langsung' : plan.name === 'Pro Bisnis' ? 'bisnis bertumbuh & tim Customer Service' : 'skala korporasi, institusi kampus & multi-agen'}.
                                                </p>
                                            </div>

                                            <div className="pt-2 border-t border-slate-100">
                                                <div className="flex items-baseline gap-1" key={billingCycle}>
                                                    <span className="text-xs font-bold text-slate-500">Rp</span>
                                                    <span className="text-4xl font-black text-slate-900 font-mono tracking-tight animate-scale-pop">
                                                        {finalPrice.toLocaleString('id-ID')}
                                                    </span>
                                                    <span className="text-xs text-slate-500">/ bulan</span>
                                                </div>
                                                {isYearly && (
                                                    <p className="text-[11px] text-[#1e50ff] font-semibold mt-1 animate-scale-pop">
                                                        Ditagihkan tahunan Rp {(finalPrice * 12).toLocaleString('id-ID')}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Key Metrics Badges */}
                                            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:bg-blue-50/50 hover:border-blue-200">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Koneksi Perangkat</span>
                                                    <strong className="text-slate-800 text-xs font-bold">{plan.max_devices} Perangkat Aktif</strong>
                                                </div>
                                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 transition-all hover:bg-blue-50/50 hover:border-blue-200">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Kuota Pesan</span>
                                                    <strong className="text-slate-800 text-xs font-bold">{(plan.monthly_message_quota || 5000).toLocaleString('id-ID')} / bulan</strong>
                                                </div>
                                            </div>

                                            {/* Feature Checklist */}
                                            <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                                                {Array.isArray(plan.features) ? plan.features.map((feat, fIdx) => (
                                                    <div key={fIdx} className="flex items-start gap-2.5 group">
                                                        <div className="w-4 h-4 rounded-full bg-blue-50 text-[#1e50ff] flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-150">
                                                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                                                        </div>
                                                        <span className="leading-snug">{feat}</span>
                                                    </div>
                                                )) : null}
                                            </div>
                                        </div>

                                        <div className="pt-6 mt-6 border-t border-slate-100">
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                type="button"
                                                onClick={() => handleSelectPlan(plan.id)}
                                                className={`w-full h-11 rounded-full text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer btn-press group ${
                                                    isRecommended
                                                        ? 'bg-[#1e50ff] hover:bg-[#153ec7] text-white shadow-[0_8px_20px_-4px_rgba(30,80,255,0.4)]'
                                                        : 'bg-slate-900 hover:bg-slate-800 text-white hover:shadow-md'
                                                }`}
                                            >
                                                <Zap className="w-3.5 h-3.5 group-hover:scale-110 transition-transform duration-150" />
                                                <span>{user ? `Pilih & Aktifkan ${plan.name}` : `Mulai dengan ${plan.name}`}</span>
                                            </motion.button>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ================= INTERACTIVE QUOTA ESTIMATOR ================= */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 gsap-reveal"
                >
                    <Card className="p-7 sm:p-10 rounded-3xl border border-slate-200 bg-white shadow-xl space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#1e50ff] flex items-center justify-center font-bold">
                                <Calculator className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900">Kalkulator Estimasi Kebutuhan Kuota</h3>
                                <p className="text-xs text-slate-500">Geser slider atau pilih preset untuk melihat rekomendasi paket yang paling efisien untuk kebutuhan komunikasi Anda.</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-slate-700">
                                    Target Pengiriman Pesan Bulanan:
                                </label>
                                <span className="font-mono text-xl font-black text-[#1e50ff] bg-blue-50 px-3.5 py-1 rounded-xl border border-blue-200 shadow-2xs animate-scale-pop" key={sliderQuota}>
                                    {sliderQuota.toLocaleString('id-ID')} Pesan
                                </span>
                            </div>

                            <input
                                type="range"
                                min={1000}
                                max={50000}
                                step={500}
                                value={sliderQuota}
                                onChange={(e) => setSliderQuota(parseInt(e.target.value))}
                                className="smooth-range w-full h-3 rounded-full cursor-pointer transition-all"
                                style={{
                                    background: `linear-gradient(to right, #1e50ff 0%, #3b82f6 ${Math.min(100, Math.max(0, ((sliderQuota - 1000) / (50000 - 1000)) * 100))}%, #e2e8f0 ${Math.min(100, Math.max(0, ((sliderQuota - 1000) / (50000 - 1000)) * 100))}%, #e2e8f0 100%)`
                                }}
                            />

                            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                                <span>1.000 Pesan</span>
                                <span>15.000 Pesan</span>
                                <span>30.000 Pesan</span>
                                <span>50.000+ Pesan</span>
                            </div>

                            {/* Quick Presets */}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                                <span className="text-[11px] font-semibold text-slate-500 mr-1">Preset Cepat:</span>
                                {[1000, 5000, 15000, 25000, 50000].map((val) => (
                                    <motion.button
                                        key={val}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        type="button"
                                        onClick={() => setSliderQuota(val)}
                                        className={`btn-press px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                            sliderQuota === val
                                                ? 'bg-[#1e50ff] text-white shadow-xs'
                                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        {val.toLocaleString('id-ID')}
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all">
                            <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Paket Rekomendasi Sistem:</span>
                                <h4 className="text-base font-black text-slate-900 flex items-center gap-2 animate-scale-pop" key={recommendedPlanName}>
                                    <span>{recommendedPlanName}</span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-[#1e50ff] border border-blue-200">Cocok Sesuai Kuota</span>
                                </h4>
                                {(() => {
                                    const matched = displayPlans.find((p) => p.name === recommendedPlanName) || displayPlans[0];
                                    const price = billingCycle === 'yearly' ? Math.round(matched.monthlyPrice * 0.8) : matched.monthlyPrice;
                                    const perMsg = (price / Math.max(1, sliderQuota)).toFixed(1);
                                    return (
                                        <p className="text-[11px] text-slate-500 font-medium">
                                            Estimasi biaya operasional: <strong className="text-[#1e50ff] font-mono">Rp {perMsg}</strong> / pesan
                                        </p>
                                    );
                                })()}
                            </div>
                            {(() => {
                                const matchedPlan = displayPlans.find((p) => p.name === recommendedPlanName) || displayPlans[0];
                                return (
                                    <motion.button
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.97 }}
                                        type="button"
                                        onClick={() => handleSelectPlan(matchedPlan?.id)}
                                        className="btn-press inline-flex h-10 items-center gap-1.5 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] px-6 text-xs font-extrabold uppercase tracking-wider text-white shadow-[0_8px_20px_-4px_rgba(30,80,255,0.4)] cursor-pointer group"
                                    >
                                        <span>{user ? `Pilih ${recommendedPlanName}` : `Mulai ${recommendedPlanName}`}</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-150" />
                                    </motion.button>
                                );
                            })()}
                        </div>
                    </Card>
                </motion.section>

                {/* ================= DETAILED FEATURE MATRIX ================= */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 gsap-reveal"
                >
                    <div className="text-center space-y-2 mb-10">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-[#1e50ff] text-[10px] font-black uppercase tracking-widest">
                            MATRIKS PERBANDINGAN FITUR
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            Perbandingan Fitur <span className="font-editorial-italic font-normal">Seluruh Paket</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Tinjau setiap kapabilitas teknis dan spesifikasi yang disediakan di tiap tingkatan paket.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="py-3.5 px-5 font-bold">Fitur Platform</th>
                                        <th className="py-3.5 px-5 font-bold text-center">Starter Lite</th>
                                        <th className="py-3.5 px-5 font-bold text-center text-[#1e50ff] bg-blue-50/50">Pro Bisnis (Rekomendasi)</th>
                                        <th className="py-3.5 px-5 font-bold text-center">Enterprise Pro</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {featureMatrix.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                             <td className="py-3.5 px-5 font-bold text-slate-900">
                                                {row.name}
                                            </td>
                                            <td className="py-3.5 px-5 text-center text-slate-700">
                                                {typeof row.starter === 'boolean' ? (
                                                    row.starter ? <Check className="w-4 h-4 text-[#1e50ff] mx-auto" /> : <span className="text-slate-300">—</span>
                                                ) : row.starter}
                                            </td>
                                            <td className="py-3.5 px-5 text-center text-slate-700 bg-blue-50/20 font-semibold">
                                                {typeof row.pro === 'boolean' ? (
                                                    row.pro ? <Check className="w-4 h-4 text-[#1e50ff] mx-auto" /> : <span className="text-slate-300">—</span>
                                                ) : row.pro}
                                            </td>
                                            <td className="py-3.5 px-5 text-center text-slate-700 font-semibold">
                                                {typeof row.enterprise === 'boolean' ? (
                                                    row.enterprise ? <Check className="w-4 h-4 text-[#1e50ff] mx-auto" /> : <span className="text-slate-300">—</span>
                                                ) : row.enterprise}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.section>

                {/* ================= PRICING FAQ SECTION ================= */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
                >
                    <div className="text-center space-y-2 mb-8 gsap-reveal">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-[#1e50ff] text-[10px] font-black uppercase tracking-widest">
                            TANYA JAWAB BERLANGGANAN
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                            Pertanyaan Seputar <span className="font-editorial-italic font-normal">Aktivasi & Pembayaran</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
                            Hal-hal penting seputar aktivasi instan, metode pembayaran resmi, dan manajemen kuota pesan.
                        </p>
                    </div>

                    <div className="space-y-3 gsap-card-grid">
                        {pricingFaqs.map((faq, idx) => (
                            <div
                                key={idx}
                                className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs transition-all hover:border-blue-300 gsap-card"
                            >
                                <button
                                    type="button"
                                    onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                                    className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                                >
                                    <span className="text-sm font-bold text-slate-900">{faq.q}</span>
                                    <motion.span
                                        animate={{ rotate: openFaq === idx ? 180 : 0 }}
                                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                        className="shrink-0 text-slate-400"
                                    >
                                        <ChevronDown className="w-4 h-4 text-[#1e50ff]" />
                                    </motion.span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {openFaq === idx && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </motion.section>

                {/* ================= CTA BANNER ================= */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.96 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 gsap-scale"
                >
                    <div className="rounded-3xl bg-gradient-to-r from-[#08112c] via-[#0d2260] to-[#1e50ff] p-8 sm:p-12 text-white text-center space-y-4 shadow-xl">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-blue-300/40 bg-white/10 text-blue-200 text-xs font-black uppercase tracking-widest">
                            AKTIVASI OTOMATIS & CEPAT
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                            Mulai Berlangganan Sekarang, <span className="font-editorial-italic font-normal">Aktif dalam 1 Menit</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto leading-relaxed">
                            Nikmati proses pembayaran mudah via QRIS instan atau Transfer Bank resmi kampus. Akun dan kuota aktif otomatis tanpa menunggu verifikasi manual.
                        </p>
                        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={() => handleSelectPlan(displayPlans[1]?.id || displayPlans[0]?.id)}
                                className="btn-press inline-flex h-11 items-center gap-2 rounded-full bg-white hover:bg-slate-100 px-8 text-xs font-extrabold uppercase tracking-wider text-[#1e50ff] shadow-lg transition-all cursor-pointer"
                            >
                                <Zap className="w-4 h-4 fill-[#1e50ff]" />
                                <span>{user ? 'Buka Menu Langganan' : 'Daftar & Pilih Paket Sekarang'}</span>
                            </motion.button>
                            <Link
                                href="/faq"
                                prefetch
                                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 hover:bg-white/20 px-6 text-xs font-bold text-white transition-all"
                            >
                                <span>Pusat Bantuan & FAQ &rarr;</span>
                            </Link>
                        </div>
                    </div>
                </motion.section>
            </div>
        </PublicLayout>
    );
}
