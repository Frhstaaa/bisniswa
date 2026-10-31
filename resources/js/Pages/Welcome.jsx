import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../Components/AuthModal';
import { useGsapReveal } from '../hooks/useGsapReveal';
import {
    Zap,
    Cpu,
    ArrowRight,
    Terminal,
    Copy,
    Check,
    CheckCircle2,
    Clock,
    Activity,
    QrCode,
    RefreshCw,
    UserPlus,
    Key,
    Shield,
    ChevronDown,
    Send,
    MessageSquare,
    Sparkles,
    Lock,
    Globe,
    Layers,
    Server,
    LogIn,
    Menu,
    X,
    MapPin,
    Mail,
    Phone,
    LayoutDashboard,
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

export default function Welcome({ plans = [] }) {
    const pageRef = useGsapReveal();
    const { url, props } = usePage();
    const user = props?.auth?.user;
    const safePlans = Array.isArray(plans) ? plans : [];
    const [selectedTab, setSelectedTab] = useState('curl');
    const [selectedEndpoint, setSelectedEndpoint] = useState('otp');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [copiedCode, setCopiedCode] = useState(false);
    const [openFaq, setOpenFaq] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isRandomizingSpintax, setIsRandomizingSpintax] = useState(false);

    useEffect(() => {
        if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
        }
    }, [url]);

    const navLinks = [
        { label: 'Panduan', href: '/cara-pakai', key: 'cara-pakai' },
        { label: 'Teknologi', href: '/dual-engine', key: 'dual-engine' },
        { label: 'API', href: '/rest-api', key: 'rest-api' },
        { label: 'Harga', href: '/harga', key: 'harga' },
        { label: 'FAQ', href: '/faq', key: 'faq' },
    ];

    // Auth Pop-up Modal State
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('register'); // 'register' | 'login'
    const [authModalPlanId, setAuthModalPlanId] = useState(null);

    const openRegisterModal = (planId = null) => {
        setAuthModalMode('register');
        setAuthModalPlanId(planId);
        setIsAuthModalOpen(true);
    };

    const openLoginModal = () => {
        setAuthModalMode('login');
        setIsAuthModalOpen(true);
    };

    const endpoints = {
        otp: {
            title: 'Kirim Kode OTP',
            method: 'POST',
            path: '/api/v1/messages/send',
            payload: {
                phone: '+6281234567890',
                message: 'Kode OTP Verifikasi Akun Anda: 918234. Jangan berikan kode ini kepada siapa pun.',
            },
        },
        broadcast: {
            title: 'Broadcast Promosi',
            method: 'POST',
            path: '/api/v1/broadcast/create',
            payload: {
                campaign_name: 'Promo Gajian Semester Baru',
                recipients_count: 1500,
                min_delay: 8,
                max_delay: 18,
                message: '{Halo|Hai|Selamat siang} Kak {{nama}}, nikmati diskon khusus 25%!',
            },
        },
        invoice: {
            title: 'Notifikasi Tagihan Invoice',
            method: 'POST',
            path: '/api/v1/messages/send-media',
            payload: {
                phone: '+6281987654321',
                caption: 'Halo Kak Budi, ini faktur tagihan #INV-2026-992 Anda.',
                media_url: 'https://storage.kampus.ac.id/invoices/992.pdf',
            },
        },
    };

    const codeSnippets = {
        curl: {
            otp: `curl -X POST https://api.kirimwa.pro/api/v1/messages/send \\
  -H "Authorization: Bearer bk_live_84f938209481928301928374" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+6281234567890",
    "message": "Kode OTP Verifikasi Akun Anda: 918234."
  }'`,
            broadcast: `curl -X POST https://api.kirimwa.pro/api/v1/broadcast/create \\
  -H "Authorization: Bearer bk_live_84f938209481928301928374" \\
  -H "Content-Type: application/json" \\
  -d '{
    "campaign_name": "Promo Gajian",
    "min_delay": 8,
    "max_delay": 18,
    "message": "{Halo|Hai} Kak {{nama}}, ini diskon Anda!",
    "recipients": ["+6281234567890", "+6281987654321"]
  }'`,
            invoice: `curl -X POST https://api.kirimwa.pro/api/v1/messages/send-media \\
  -H "Authorization: Bearer bk_live_84f938209481928301928374" \\
  -H "Content-Type: application/json" \\
  -d '{
    "phone": "+6281987654321",
    "caption": "Faktur Pembayaran Kuliah #INV-992",
    "media_url": "https://storage.kampus.ac.id/invoices/992.pdf"
  }'`,
        },
        php: {
            otp: `<?php
$curl = curl_init();
curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.kirimwa.pro/api/v1/messages/send",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode([
    "phone" => "+6281234567890",
    "message" => "Kode OTP: 918234."
  ]),
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer bk_live_84f938209481928301928374",
    "Content-Type: application/json"
  ],
]);
$response = curl_exec($curl);
curl_close($curl);
echo $response;`,
            broadcast: `<?php
$data = [
  "campaign_name" => "Broadcast Perkuliahan",
  "min_delay" => 8,
  "max_delay" => 18,
  "message" => "Pengumuman: Jadwal UAS telah terbit.",
  "recipients" => ["+6281234567890", "+6281987654321"]
];
$options = [
  'http' => [
    'method'  => 'POST',
    'header'  => "Content-Type: application/json\\r\\nAuthorization: Bearer bk_live_84f938209481928301928374\\r\\n",
    'content' => json_encode($data)
  ]
];
$context  = stream_context_create($options);
$result = file_get_contents("https://api.kirimwa.pro/api/v1/broadcast/create", false, $context);
echo $result;`,
            invoice: `<?php
$payload = [
  "phone" => "+6281987654321",
  "caption" => "Tagihan Kuliah Mahasiswa #INV-992",
  "media_url" => "https://storage.kampus.ac.id/invoices/992.pdf"
];
$ch = curl_init("https://api.kirimwa.pro/api/v1/messages/send-media");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Authorization: Bearer bk_live_84f938209481928301928374']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$res = curl_exec($ch);
curl_close($ch);
echo $res;`,
        },
        node: {
            otp: `import axios from 'axios';

const res = await axios.post('https://api.kirimwa.pro/api/v1/messages/send', {
  phone: '+6281234567890',
  message: 'Kode OTP: 918234.'
}, {
  headers: { 'Authorization': 'Bearer bk_live_84f938209481928301928374' }
});
console.log(res.data);`,
            broadcast: `import axios from 'axios';

const res = await axios.post('https://api.kirimwa.pro/api/v1/broadcast/create', {
  campaign_name: 'Broadcast Nilai Akhir',
  recipients: ['+6281234567890', '+6281987654321'],
  min_delay: 8,
  max_delay: 18,
  message: 'Halo {{nama}}, nilai akhir semester Anda telah diunggah.'
}, {
  headers: { 'Authorization': 'Bearer bk_live_84f938209481928301928374' }
});
console.log(res.data);`,
            invoice: `import axios from 'axios';

const res = await axios.post('https://api.kirimwa.pro/api/v1/messages/send-media', {
  phone: '+6281987654321',
  media_url: 'https://storage.kampus.ac.id/invoices/992.pdf'
}, {
  headers: { 'Authorization': 'Bearer bk_live_84f938209481928301928374' }
});
console.log(res.data);`,
        },
        python: {
            otp: `import requests

res = requests.post(
    "https://api.kirimwa.pro/api/v1/messages/send",
    headers={"Authorization": "Bearer bk_live_84f938209481928301928374"},
    json={
        "phone": "+6281234567890",
        "message": "Kode OTP Verifikasi Akun Anda: 918234."
    },
)
print(res.json())`,
            broadcast: `import requests

res = requests.post(
    "https://api.kirimwa.pro/api/v1/broadcast/create",
    headers={"Authorization": "Bearer bk_live_84f938209481928301928374"},
    json={"campaign_name": "Promo Gajian", "recipients_count": 1500},
)
print(res.json())`,
            invoice: `import requests

res = requests.post(
    "https://api.kirimwa.pro/api/v1/messages/send-media",
    headers={"Authorization": "Bearer bk_live_84f938209481928301928374"},
    json={"phone": "+6281987654321", "media_url": "https://storage.kampus.ac.id/invoices/992.pdf"},
)
print(res.json())`,
        },
    };

    const currentCode = codeSnippets[selectedTab][selectedEndpoint];

    const handleCopyCode = () => {
        navigator.clipboard.writeText(currentCode);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const [spintaxSentence, setSpintaxSentence] = useState(
        'Halo Kak Budi, tagihan Anda #INV-290 telah terbit dan siap dibayar. Salam hangat!'
    );

    const randomizeSpintax = () => {
        setIsRandomizingSpintax(true);
        const greetings = ['Halo', 'Hai', 'Selamat siang', 'Salam hangat', 'Selamat pagi'];
        const targets = ['Kak Budi', 'Rekan Akademik', 'Bapak/Ibu Dosen', 'Mahasiswa Yth.'];
        const notices = [
            'tagihan semester telah kami terbitkan.',
            'sistem absensi perkuliahan telah diperbarui.',
            'pesanan #INV-291 telah dikirim via kurir.',
            'jadwal ujian akhir telah resmi diumumkan.',
        ];
        const closings = [
            'Semoga harimu menyenangkan!',
            'Terima kasih atas kerjasamanya.',
            'Layanan resmi Politeknik Mardira Indonesia.',
            'Hubungi kami jika ada pertanyaan.',
        ];

        const g = greetings[Math.floor(Math.random() * greetings.length)];
        const t = targets[Math.floor(Math.random() * targets.length)];
        const n = notices[Math.floor(Math.random() * notices.length)];
        const c = closings[Math.floor(Math.random() * closings.length)];

        setSpintaxSentence(`${g} ${t}, ${n} ${c}`);
        setTimeout(() => setIsRandomizingSpintax(false), 450);
    };

    const faqs = [
        {
            q: 'Bagaimana sistem berlangganan dan masa aktif dihitung?',
            a: 'Masa aktif dihitung otomatis sesuai siklus yang dipilih (bulanan/tahunan) dengan toleransi grace period 3 hari setelah jatuh tempo. Administrator dapat menyesuaikan tanggal mulai, tanggal selesai, serta memberikan bonus kuota melalui antarmuka Super Admin dengan audit log lengkap.',
        },
        {
            q: 'Mengapa BisnisWA menggunakan BisnisWA UltraSync Engine?',
            a: 'BisnisWA UltraSync Engine menjalankan protokol web enterprise resmi secara terisolasi. Ini menjamin bahwa setiap pesan dienkripsi dengan standar Signal Protocol resmi tanpa resiko ratchet desync (bebas dari error "Menunggu pesan ini"), pesan terkirim instan, dan sesi sangat tahan lama serta aman dari pemblokiran.',
        },
        {
            q: 'Bagaimana sistem melindungi nomor dari resiko Banned WhatsApp?',
            a: 'Kami mengintegrasikan algoritma Anti-Ban Throttle dengan random jitter delay (selisih waktu acak 8 s/d 18 detik antar pesan) dan variasi kalimat dinamis (Spintax) agar ritme pengiriman pesan menyerupai perilaku manusia.',
        },
        {
            q: 'Apakah tersedia Webhook untuk menerima status pengiriman?',
            a: 'Ya, Anda dapat mengonfigurasi URL Webhook di dashboard. Platform akan memancarkan HTTP POST saat pesan terkirim, terbaca (read receipt), atau saat ada pesan balasan masuk dari pelanggan.',
        },
    ];

    const DEFAULT_FALLBACK_PLANS = [
        {
            id: 1,
            name: 'Starter Lite',
            slug: 'starter',
            price_monthly: 99000,
            price_annually: 990000,
            limits: { max_devices: 1, monthly_message_quota: 5000, api_rate_limit_per_minute: 30 },
            badge: 'UMKM & Bot',
            description: 'Cocok untuk notifikasi otomatis toko online skala awal.',
        },
        {
            id: 3,
            name: 'Pro Bisnis',
            slug: 'pro-bisnis',
            price_monthly: 179000,
            price_annually: 1790000,
            limits: { max_devices: 3, monthly_message_quota: 15000, api_rate_limit_per_minute: 60 },
            badge: 'Paling Diminati',
            is_popular: true,
            description: 'Solusi optimal tim CS & automasi broadcast bisnis bertumbuh.',
        },
        {
            id: 2,
            name: 'Enterprise Pro',
            slug: 'enterprise-pro',
            price_monthly: 299000,
            price_annually: 2890000,
            limits: { max_devices: 5, monthly_message_quota: 50000, api_rate_limit_per_minute: 120 },
            badge: 'Broadcast & Kampus',
            description: 'Dukungan multi-device, spintax, BisnisWA UltraSync Engine, dan webhook realtime.',
        },
    ];

    const displayPlans = safePlans.length > 0 ? safePlans.map((p) => ({
        ...p,
        badge: p.slug === 'starter' ? 'UMKM & Bot' : p.slug === 'pro-bisnis' ? 'Paling Diminati' : 'Broadcast & Kampus',
        description: p.slug === 'starter' ? 'Cocok untuk notifikasi otomatis toko online skala awal.' : p.slug === 'pro-bisnis' ? 'Solusi optimal tim CS & automasi broadcast bisnis bertumbuh.' : 'Dukungan multi-device, spintax, BisnisWA UltraSync Engine, dan webhook realtime.',
        is_popular: p.slug === 'pro-bisnis' || p.is_popular,
    })) : DEFAULT_FALLBACK_PLANS;

    return (
        <motion.div
            ref={pageRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen bg-white text-[#0f172a] font-sans antialiased selection:bg-blue-100 selection:text-[#1e50ff]"
        >
            <Head title="MARDIRA WA — Portal Enterprise WhatsApp Gateway & Broadcast API" />

            {/* ================= 1. TOP NAVBAR (Responsive Mobile & Desktop) ================= */}
            <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 flex-nowrap gap-4">
                    {/* Brand Logo (Naked / Telanjang) */}
                    <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
                        <motion.img
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            src="/images/logo.png"
                            alt="Politeknik Mardira Indonesia"
                            className="h-9 sm:h-10 w-auto object-contain shrink-0"
                        />
                        <div className="shrink-0">
                            <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 block leading-none whitespace-nowrap">
                                MARDIRA<span className="text-[#1e50ff]">WA</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider block mt-0.5 whitespace-nowrap">
                                POLITEKNIK MARDIRA INDONESIA
                            </span>
                        </div>
                    </Link>

                    {/* Menu Navigasi Tengah (Desktop Only, Never Wraps) */}
                    <div className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0">
                        {navLinks.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                prefetch
                                className="rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#1e50ff] hover:bg-slate-100/70 whitespace-nowrap transition-all"
                            >
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    {/* Tombol Akses Kanan (Desktop) */}
                    <div className="hidden md:flex items-center gap-2 shrink-0">
                        {user ? (
                            <Link
                                href="/dashboard"
                                prefetch
                                className="btn-press inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
                            >
                                <LayoutDashboard className="w-3.5 h-3.5" />
                                <span>Dashboard</span>
                            </Link>
                        ) : (
                            <>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => openLoginModal()}
                                    className="btn-press inline-flex h-9 items-center gap-1.5 rounded-full border border-slate-300 hover:border-[#1e50ff] bg-white hover:bg-blue-50/50 px-3.5 text-xs font-bold text-slate-800 hover:text-[#1e50ff] transition-all cursor-pointer whitespace-nowrap shrink-0"
                                >
                                    <LogIn className="w-3.5 h-3.5 text-[#1e50ff]" />
                                    <span>Masuk</span>
                                </motion.button>
                                <motion.button
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => openRegisterModal()}
                                    className="btn-press inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] px-4 text-xs font-extrabold uppercase tracking-wider text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
                                >
                                    <Zap className="w-3.5 h-3.5 fill-white text-white" />
                                    <span>Mulai</span>
                                </motion.button>
                            </>
                        )}
                    </div>

                    {/* Mobile Quick Action & Hamburger Toggle */}
                    <div className="flex md:hidden items-center gap-2 shrink-0">
                        {user ? (
                            <Link
                                href="/dashboard"
                                prefetch
                                className="btn-press inline-flex h-8 items-center gap-1 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] px-3 text-[11px] font-bold text-white shadow-xs whitespace-nowrap"
                            >
                                <LayoutDashboard className="w-3 h-3" />
                                <span>Dashboard</span>
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={() => openLoginModal()}
                                className="btn-press inline-flex h-8 items-center gap-1 rounded-full border border-slate-300 bg-white hover:bg-slate-50 px-3 text-[11px] font-bold text-slate-800 transition-all whitespace-nowrap"
                            >
                                <LogIn className="w-3 h-3 text-[#1e50ff]" />
                                <span>Masuk</span>
                            </button>
                        )}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle navigation menu"
                            className="btn-press h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-all"
                        >
                            {isMobileMenuOpen ? <X className="w-4 h-4 text-[#1e50ff]" /> : <Menu className="w-4 h-4 text-slate-800" />}
                        </button>
                    </div>
                </nav>

                {/* Mobile Drawer Dropdown Sheet */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl px-4 py-5 space-y-4"
                        >
                            <div className="space-y-1">
                                {navLinks.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1e50ff] hover:bg-blue-50/60 transition-colors"
                                    >
                                        <span>{item.label}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>
                                ))}
                            </div>

                            {user ? (
                                <div className="pt-3 border-t border-slate-100">
                                    <Link
                                        href="/dashboard"
                                        prefetch
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="btn-press flex w-full h-10 items-center justify-center gap-2 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] text-white text-xs font-extrabold uppercase tracking-wider shadow-xs cursor-pointer"
                                    >
                                        <LayoutDashboard className="w-3.5 h-3.5" />
                                        <span>Buka Dashboard Workspace</span>
                                    </Link>
                                </div>
                            ) : (
                                <div className="pt-3 border-t border-slate-100 space-y-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            openRegisterModal();
                                        }}
                                        className="btn-press flex w-full h-10 items-center justify-center gap-2 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] text-white text-xs font-extrabold uppercase tracking-wider shadow-xs cursor-pointer"
                                    >
                                        <Zap className="w-3.5 h-3.5 fill-white" />
                                        <span>Daftar Sekarang (Mulai Berlangganan)</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            openLoginModal();
                                        }}
                                        className="btn-press flex w-full h-10 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold uppercase tracking-wider cursor-pointer"
                                    >
                                        <LogIn className="w-3.5 h-3.5 text-[#1e50ff]" />
                                        <span>Masuk ke Workspace</span>
                                    </button>
                                </div>
                            )}

                            <div className="pt-2 text-center">
                                <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                                    Politeknik Mardira Indonesia Enterprise Gateway
                                </span>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            {/* ================= 2. HERO SECTION ================= */}
            <section className="relative overflow-hidden bg-white bg-grid-pattern pt-32 sm:pt-40 lg:pt-44 pb-0 text-slate-900 text-center">
                <motion.div
                    variants={heroContainerVariants}
                    initial="hidden"
                    animate="visible"
                    className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6"
                >
                    {/* Top Pill Badge (Reference Style: Outlined Royal Blue Pill) */}
                    <motion.div variants={heroItemVariants} className="inline-block gsap-hero-item">
                        <div className="inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-[#1e50ff] bg-white px-3 sm:px-5 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold sm:font-extrabold text-[#1e50ff] tracking-normal sm:tracking-widest uppercase shadow-xs">
                            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1e50ff] shrink-0" />
                            <span className="hidden sm:inline">STRATEGI & OTOMASI WHATSAPP RESMI</span>
                            <span className="sm:hidden">OTOMASI WHATSAPP RESMI</span>
                        </div>
                    </motion.div>

                    {/* Main Title: Exact Reference Typography Mix (Italic Serif Flourish + Bold Sans-Serif + Royal Blue Accent) */}
                    <motion.h1
                        variants={heroItemVariants}
                        className="text-3xl sm:text-5xl lg:text-7xl font-sans tracking-tight leading-[1.08] max-w-4xl mx-auto px-2 gsap-hero-item"
                    >
                        <span className="block font-editorial-italic text-4xl sm:text-6xl lg:text-8xl font-normal text-slate-900 pb-1 sm:pb-2">
                            Maksimalkan
                        </span>
                        <span className="font-black text-slate-900">
                            Pertumbuhan <span className="text-[#1e50ff]">Bisnis</span>
                        </span>
                    </motion.h1>

                    {/* Subtitle: Clean & Readable Grotesque Sans (Reference Style) */}
                    <motion.p
                        variants={heroItemVariants}
                        className="text-xs sm:text-base lg:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed font-normal px-2 gsap-hero-item"
                    >
                        Strategi otomasi pesan dan pemasaran digital berbasis WhatsApp untuk menjangkau, melayani, dan meningkatkan konversi pelanggan secara efisien.
                    </motion.p>

                    {/* Action Buttons: Solid Royal Blue Pill (Reference "JOIN NOW") */}
                    <motion.div
                        variants={heroItemVariants}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 sm:pt-4 max-w-md sm:max-w-none mx-auto gsap-hero-item"
                    >
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openRegisterModal()}
                            className="btn-press inline-flex h-11 sm:h-13 items-center justify-center gap-2 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] text-white px-8 sm:px-11 text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-[0_12px_28px_-4px_rgba(30,80,255,0.45)] transition-all cursor-pointer"
                        >
                            <span>MULAI SEKARANG</span>
                            <ArrowRight className="w-4 h-4 text-white" />
                        </motion.button>
                        <motion.button
                            type="button"
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => openLoginModal()}
                            className="btn-press inline-flex h-11 sm:h-13 items-center justify-center gap-2 rounded-full border-2 border-slate-300 hover:border-[#1e50ff] bg-white text-slate-800 hover:text-[#1e50ff] px-7 sm:px-9 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
                        >
                            <span>Masuk Workspace</span>
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Bottom Architectural Royal Blue Dome (Matching Reference Semicircular Dome & Pill Contact Bar) */}
                <div className="mt-10 sm:mt-18 mx-auto max-w-5xl px-3 sm:px-6">
                    <div className="relative overflow-hidden rounded-t-[40px] sm:rounded-t-[120px] bg-[#1e50ff] pt-8 sm:pt-14 pb-8 sm:pb-14 px-3 sm:px-10 text-white shadow-2xl">
                        {/* Background Decorative Circular Arc */}
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[640px] rounded-full border border-white/15 pointer-events-none" />

                        {/* 3 Metric Glass Cards Inside Dome */}
                        <motion.div
                            variants={heroItemVariants}
                            className="relative z-10 grid grid-cols-3 gap-2 sm:gap-6 max-w-3xl mx-auto gsap-card-grid"
                        >
                            <motion.div
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="rounded-xl sm:rounded-2xl p-2.5 sm:p-5 text-center bg-white/10 border border-white/20 backdrop-blur-md transition-all gsap-card"
                            >
                                <div className="text-base sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-mono tabular-nums">
                                    99.9%
                                </div>
                                <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-blue-100 leading-tight mt-0.5">
                                    SLA Uptime
                                </p>
                                <p className="hidden sm:block text-[10px] text-blue-200/80 mt-0.5">
                                    Engine aktif 24/7 non-stop
                                </p>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="rounded-xl sm:rounded-2xl p-2.5 sm:p-5 text-center bg-white/10 border border-white/20 backdrop-blur-md transition-all gsap-card"
                            >
                                <div className="text-base sm:text-3xl lg:text-4xl font-black text-[#facc15] tracking-tight font-mono tabular-nums">
                                    38 ms
                                </div>
                                <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-blue-100 leading-tight mt-0.5">
                                    Kecepatan Respon
                                </p>
                                <p className="hidden sm:block text-[10px] text-blue-200/80 mt-0.5">
                                    Kecepatan transmisi kilat
                                </p>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -4, scale: 1.02 }}
                                className="rounded-xl sm:rounded-2xl p-2.5 sm:p-5 text-center bg-white/10 border border-white/20 backdrop-blur-md transition-all gsap-card"
                            >
                                <div className="text-base sm:text-3xl lg:text-4xl font-black text-white tracking-tight font-mono tabular-nums">
                                    15 Jt+
                                </div>
                                <p className="text-[10px] sm:text-xs lg:text-sm font-bold text-blue-100 leading-tight mt-0.5">
                                    Kapasitas Pesan / Bln
                                </p>
                                <p className="hidden sm:block text-[10px] text-blue-200/80 mt-0.5">
                                    Kapasitas broadcast massal
                                </p>
                            </motion.div>
                        </motion.div>

                        {/* Floating Pill Contact Bar (Exact Match to Reference Bottom Banner) */}
                        <div className="relative z-10 mt-6 sm:mt-10 max-w-2xl mx-auto rounded-2xl sm:rounded-full bg-[#dbeafe] border border-blue-200/90 py-2.5 sm:py-3.5 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-6 text-slate-950 shadow-md">
                            <span className="text-[10px] sm:text-xs font-black tracking-widest uppercase text-slate-700">
                                HUBUNGI KAMI:
                            </span>
                            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-slate-900">
                                <span className="w-5 h-5 rounded-full bg-[#1e50ff] text-white flex items-center justify-center shrink-0">
                                    <Phone className="w-3 h-3 fill-white" />
                                </span>
                                <span>+62 812-9843-0911</span>
                            </div>
                            <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-slate-800">
                                <Mail className="w-4 h-4 text-[#1e50ff]" />
                                <span>helpdesk@mardira.ac.id</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ================= 3. CARA INTEGRASI (3 Langkah Mudah) ================= */}
            <section id="alur-integrasi" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-12">
                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    className="text-center space-y-2 gsap-reveal"
                >
                    <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                        ALUR INTEGRASI APLIKASI
                    </span>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                        Terhubung ke WhatsApp dalam 3 Langkah Mudah
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                        Didesain agar pengembang dapat menghubungkan sistem dalam hitungan menit tanpa prosedur rumit.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 gsap-card-grid">
                    {/* Step 1 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-card shadow-card-hover flex flex-col justify-between space-y-4 transition-shadow gsap-card"
                    >
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-200">
                                    01
                                </div>
                                <UserPlus className="w-5 h-5 text-slate-400" />
                            </div>
                            <h3 className="text-base font-bold text-[#0f172a]">Daftar Akun & Pilih Paket</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Registrasi akun bisnis Anda, atur identitas workspace, dan pilih paket kuota pesan yang sesuai dengan volume kebutuhan bulanan Anda.
                            </p>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 pt-2 border-t border-slate-100 block">
                            Aktivasi Instan & Otomatis →
                        </span>
                    </motion.div>

                    {/* Step 2 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-card shadow-card-hover flex flex-col justify-between space-y-4 transition-shadow gsap-card"
                    >
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-[#fef9c3] text-[#854d0e] flex items-center justify-center font-black text-sm border border-[#fef08a]">
                                    02
                                </div>
                                <QrCode className="w-5 h-5 text-slate-400" />
                            </div>
                            <h3 className="text-base font-bold text-[#0f172a]">Pindai QR Nomor WhatsApp</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Buka WhatsApp di smartphone Anda lalu tautkan perangkat via scan QR Code dengan engine resmi <strong className="text-emerald-700">BisnisWA UltraSync Engine</strong> yang stabil dan bebas delay.
                            </p>
                        </div>
                        <span className="text-[11px] font-semibold text-[#854d0e] pt-2 border-t border-slate-100 block">
                            Mendukung Multi-Device →
                        </span>
                    </motion.div>

                    {/* Step 3 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-card shadow-card-hover flex flex-col justify-between space-y-4 transition-shadow gsap-card"
                    >
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-sm border border-emerald-200">
                                    03
                                </div>
                                <Key className="w-5 h-5 text-slate-400" />
                            </div>
                            <h3 className="text-base font-bold text-[#0f172a]">Salin API Key & Mulai Kirim</h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Dapatkan token Bearer REST API Key yang dienkripsi SHA-256 untuk langsung dihubungkan ke backend website, aplikasi POS kasir, atau bot kampus Anda.
                            </p>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700 pt-2 border-t border-slate-100 block">
                            JSON REST & Webhook Ready →
                        </span>
                    </motion.div>
                </div>
            </section>

            {/* ================= 4. FITUR UTAMA & BISNISWA ULTRASYNC ENGINE ================= */}
            <section id="dual-engine" className="py-14 sm:py-20 bg-white border-y border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-12">
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        className="text-center space-y-2 gsap-reveal"
                    >
                        <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                            ARSITEKTUR SINGLE ENGINE TANGGUH
                        </span>
                        <h2 className="text-xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                            BisnisWA UltraSync Engine & Akselerasi FrankenPHP
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                            Bebas masalah "Menunggu pesan ini", enkripsi native Signal Protocol resmi Meta, serta ditenagai runtime supercharged Laravel Octane + FrankenPHP.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 gsap-card-grid">
                        {/* Engine Card 1 */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            className="rounded-2xl border border-emerald-200/90 bg-[#f8fafc] p-5 sm:p-7 shadow-card space-y-4 sm:space-y-5 shadow-card-hover transition-shadow gsap-card gsap-reveal-left"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                                    <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">BisnisWA UltraSync Engine</h3>
                                    <p className="text-xs text-slate-500">Enterprise Native Protocol & Native End-to-End Encryption</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Menjalankan klien web enterprise resmi dalam sandbox terisolasi. Seluruh kunci enkripsi dikelola secara native, memastikan pesan terbaca instan dan sesi bertahan lama anti-ban.
                            </p>
                            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    <span>Bebas Status "Menunggu Pesan Ini"</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                                    <span>Sesi Awet & Proteksi Anti-Ban Teruji</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Engine Card 2 */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -6, scale: 1.02 }}
                            className="rounded-2xl border border-blue-200/90 bg-[#f8fafc] p-5 sm:p-7 shadow-card space-y-4 sm:space-y-5 shadow-card-hover transition-shadow gsap-card gsap-reveal-right"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
                                    <Cpu className="w-5 h-5 sm:w-6 sm:h-6" />
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">Laravel Octane & FrankenPHP</h3>
                                    <p className="text-xs text-slate-500">Supercharged Caddy Worker & Memory Persistence</p>
                                </div>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                Didukung server aplikasi modern FrankenPHP dengan arsitektur worker persistent. Memproses ribuan pesan broadcast dan webhook secara paralel tanpa overhead bootstrapping PHP konvensional.
                            </p>
                            <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 text-slate-700">
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                    <span>Latensi Respon Sub-Milidetik</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                                    <span>Skalabilitas Tinggi untuk Broadcast Massal</span>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Anti-Ban & Spintax Showcase */}
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-40px' }}
                        className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 sm:p-7 shadow-card space-y-4 gsap-reveal"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                            <div>
                                <h3 className="text-sm sm:text-base font-bold text-[#0f172a]">Simulasi Proteksi Anti-Ban: Jeda Acak & Spintax</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Uji coba bagaimana algoritma spintax menyusun variasi kalimat dinamis pada pesan massal</p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={randomizeSpintax}
                                className="btn-press inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs w-full sm:w-auto cursor-pointer"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 text-amber-300 transition-transform duration-500 ${isRandomizingSpintax ? 'rotate-180' : ''}`} />
                                <span>Acak Variasi Spintax</span>
                            </motion.button>
                        </div>
                        <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 text-xs font-mono text-slate-800 shadow-xs leading-relaxed break-words min-h-[46px] flex items-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={spintaxSentence}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                                >
                                    {spintaxSentence}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ================= 5. REST API CODE PLAYGROUND ================= */}
            <section id="api-playground" className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 space-y-6 sm:space-y-8">
                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    className="text-center space-y-2 gsap-reveal"
                >
                    <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                        INTEGRASI CEPAT
                    </span>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                        Mudah Dihubungkan ke Aplikasi Klien Anda
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                        Pilih jenis layanan, bahasa pemrograman favorit, dan mulai kirim pesan via endpoint JSON standar.
                    </p>
                </motion.div>

                {/* Endpoint Scenario Switcher Pills */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0 sm:flex-wrap justify-start sm:justify-center px-1 gsap-reveal">
                    {Object.keys(endpoints).map((key) => (
                        <motion.button
                            key={key}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedEndpoint(key)}
                            className={`btn-press shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                                selectedEndpoint === key
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {endpoints[key].title}
                        </motion.button>
                    ))}
                </div>

                {/* Code Terminal Box */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.4 }}
                    className="rounded-2xl border border-slate-800 bg-[#071326] shadow-2xl overflow-hidden max-w-4xl mx-auto gsap-reveal"
                >
                    {/* Language Tabs & Copy Button */}
                    <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-[#0c1a30] border-b border-white/10 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar">
                            {['curl', 'php', 'node', 'python'].map((tab) => (
                                <motion.button
                                    key={tab}
                                    whileHover={{ scale: 1.04 }}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => setSelectedTab(tab)}
                                    className={`btn-press shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
                                        selectedTab === tab
                                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                                            : 'text-slate-300 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tab === 'node' ? 'Node.js' : tab}
                                </motion.button>
                            ))}
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopyCode}
                            className="btn-press shrink-0 inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/15 text-slate-200 rounded-lg text-xs font-mono transition-colors cursor-pointer"
                        >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCode ? 'Disalin!' : 'Salin'}</span>
                        </motion.button>
                    </div>

                    <div className="p-4 sm:p-6 font-mono text-[11px] sm:text-xs text-slate-200 overflow-x-auto leading-relaxed">
                        <AnimatePresence mode="wait">
                            <motion.pre
                                key={selectedTab + selectedEndpoint}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                            >
                                {currentCode}
                            </motion.pre>
                        </AnimatePresence>
                    </div>
                </motion.div>
            </section>

            {/* ================= 6. PAKET & HARGA (3-Column Complete Tier) ================= */}
            <section id="harga" className="py-14 sm:py-20 bg-white border-y border-slate-200">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-12">
                    <motion.div
                        variants={fadeInUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-50px' }}
                        className="text-center space-y-3 gsap-reveal"
                    >
                        <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                            PAKET BERLANGGANAN
                        </span>
                        <h2 className="text-xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                            Pilih Paket Langganan Sesuai Skala Bisnis
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
                            Dapatkan akses instan ke REST API Key dan kuota pesan begitu pendaftaran selesai.
                        </p>

                        {/* Switcher: Mobile Optimized Width */}
                        <div className="inline-flex w-full max-w-xs sm:w-auto items-center justify-center bg-slate-100 p-1 rounded-xl border border-slate-200 mt-2">
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setBillingCycle('monthly')}
                                className={`btn-press flex-1 sm:flex-none px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                                    billingCycle === 'monthly' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Bulanan
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setBillingCycle('annually')}
                                className={`btn-press flex-1 sm:flex-none px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition-all text-center cursor-pointer ${
                                    billingCycle === 'annually' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Tahunan (-20%)
                            </motion.button>
                        </div>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch gsap-card-grid">
                        {displayPlans.map((plan, pIdx) => {
                            const isYearly = billingCycle === 'annually';
                            const monthlyPrice = Math.round(Number(plan.price_monthly ?? plan.price ?? 99000));
                            const finalPrice = isYearly ? Math.round(monthlyPrice * 0.8) : monthlyPrice;
                            const isRecommended = plan.is_popular;
                            const maxDev = plan.limits?.max_devices ?? plan.max_devices ?? 1;
                            const quota = plan.limits?.monthly_message_quota ?? plan.monthly_message_quota ?? 5000;
                            const rateLimit = plan.limits?.api_rate_limit_per_minute ?? (maxDev >= 5 ? 120 : maxDev >= 3 ? 60 : 30);

                            return (
                                <motion.div
                                    key={plan.id || pIdx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-40px' }}
                                    transition={{ duration: 0.35, delay: pIdx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between relative bg-white transition-shadow gsap-card ${
                                        isRecommended
                                            ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-900/10 md:-translate-y-2 gsap-scale'
                                            : 'border border-slate-200/90 shadow-card hover:border-emerald-300'
                                    }`}
                                >
                                    {isRecommended && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-emerald-600 text-white font-black text-[10px] uppercase tracking-wider shadow-md whitespace-nowrap animate-shimmer">
                                            PALING DIMINATI & DIREKOMENDASIKAN
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-base sm:text-lg font-bold text-[#0f172a]">{plan.name}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                isRecommended ? 'bg-[#fef9c3] text-[#854d0e]' : 'bg-emerald-50 text-emerald-800'
                                            }`}>
                                                {plan.badge || 'Bisnis'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500">{plan.description}</p>
                                        
                                        <div className="pt-2 border-t border-slate-100">
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-xs font-bold text-slate-500">Rp</span>
                                                <span className="text-3xl sm:text-4xl font-black text-[#0f172a] font-mono">
                                                    {finalPrice.toLocaleString('id-ID')}
                                                </span>
                                                <span className="text-xs text-slate-500">/{isYearly ? 'bulan' : 'bulan'}</span>
                                            </div>
                                            {isYearly && (
                                                <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                                                    Ditagihkan tahunan Rp {(finalPrice * 12).toLocaleString('id-ID')}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2.5 pt-4 border-t border-slate-100 text-xs text-slate-700">
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span><strong>{maxDev} Nomor WhatsApp</strong> Terhubung</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span><strong>{quota.toLocaleString('id-ID')} Kuota Pesan</strong> per Bulan</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Engine: <strong>BisnisWA UltraSync Resmi</strong></span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>REST API Key ({rateLimit} req/menit)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>Live Chat Inbox Multichat</span>
                                            </div>
                                            {maxDev >= 3 && (
                                                <div className="flex items-center gap-2">
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                                    <span>Proteksi Spintax & Anti-Ban</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-slate-100">
                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => openRegisterModal(plan.id)}
                                            className={`btn-press w-full py-3.5 rounded-xl text-xs font-bold text-center transition-all shadow-xs cursor-pointer ${
                                                isRecommended
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 shadow-md'
                                                    : 'border-2 border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white bg-white'
                                            }`}
                                        >
                                            Pilih Paket {plan.name} →
                                        </motion.button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ================= 7. FAQ ACCORDION SECTION ================= */}
            <section id="faq" className="py-14 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 space-y-8 sm:space-y-10">
                <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-50px' }}
                    className="text-center space-y-2 gsap-reveal"
                >
                    <span className="inline-block text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                        PERTANYAAN UMUM
                    </span>
                    <h2 className="text-xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                        Pertanyaan yang Sering Diajukan
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
                        Pelajari detail teknis arsitektur gateway, keamanan anti-banned, dan integrasi API.
                    </p>
                </motion.div>

                <div className="space-y-3 gsap-card-grid">
                    {faqs.map((faq, index) => {
                        const isOpen = openFaq === index;
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-30px' }}
                                transition={{ duration: 0.35, delay: index * 0.08 }}
                                className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs transition-all hover:border-emerald-300 gsap-card"
                            >
                                <button
                                    onClick={() => setOpenFaq(isOpen ? null : index)}
                                    className="w-full py-3.5 sm:py-4 px-4 sm:px-6 text-left flex items-center justify-between gap-3 font-bold text-xs sm:text-sm text-[#0f172a] hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <span className="leading-snug">{faq.q}</span>
                                    <motion.span
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                        className="p-1 rounded-lg text-slate-400 shrink-0"
                                    >
                                        <ChevronDown className="w-4 h-4 text-emerald-700" />
                                    </motion.span>
                                </button>
                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-4 sm:px-6 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                                                {faq.a}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* ================= 8. FOOTER ================= */}
            <footer className="bg-[#08112c] text-white pt-14 pb-10 border-t border-blue-950/80 text-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
                        {/* Col 1 & 2: Branding & Enterprise Overview */}
                        <div className="space-y-4 lg:col-span-2">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/images/logo.png"
                                    alt="Politeknik Mardira Indonesia"
                                    className="h-10 w-auto object-contain shrink-0"
                                />
                                <div>
                                    <span className="font-black text-lg tracking-tight text-white block">
                                        MARDIRA<span className="text-[#1e50ff]">WA</span>
                                    </span>
                                    <span className="text-[10px] text-blue-300/80 font-bold uppercase tracking-wider block">
                                        Politeknik Mardira Indonesia
                                    </span>
                                </div>
                            </div>
                            <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
                                Platform Resmi WhatsApp Gateway & Messaging Engine Terpadu Politeknik Mardira Indonesia. Menghubungkan otomasi layanan akademik, notifikasi transaksi kampus, serta integrasi digital enterprise dengan reliabilitas tinggi.
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 font-medium">
                                    <Shield className="w-3.5 h-3.5 text-[#1e50ff]" />
                                    <span>Enkripsi TLS 256-Bit</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/60 font-medium">
                                    <Server className="w-3.5 h-3.5 text-[#1e50ff]" />
                                    <span>Dual-Engine 99.98% SLA</span>
                                </span>
                            </div>
                        </div>

                        {/* Col 3: Navigasi Solusi */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Navigasi Solusi</h4>
                            <ul className="space-y-2 text-slate-300">
                                <li><Link href="/cara-pakai" prefetch className="hover:text-[#1e50ff] transition-colors">Panduan Integrasi</Link></li>
                                <li><Link href="/dual-engine" prefetch className="hover:text-[#1e50ff] transition-colors">Teknologi UltraSync Engine</Link></li>
                                <li><Link href="/rest-api" prefetch className="hover:text-[#1e50ff] transition-colors">Dokumentasi REST API</Link></li>
                                <li><Link href="/harga" prefetch className="hover:text-[#1e50ff] transition-colors">Pilihan Paket Layanan</Link></li>
                                <li><Link href="/faq" prefetch className="hover:text-[#1e50ff] transition-colors">Pusat Bantuan & FAQ</Link></li>
                            </ul>
                        </div>

                        {/* Col 4: Portal & Layanan */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Portal Layanan</h4>
                            <ul className="space-y-2 text-slate-300">
                                <li>
                                    <button
                                        type="button"
                                        onClick={openLoginModal}
                                        className="hover:text-[#1e50ff] transition-colors text-left cursor-pointer"
                                    >
                                        Masuk ke Workspace
                                    </button>
                                </li>
                                <li>
                                    <button
                                        type="button"
                                        onClick={() => openRegisterModal()}
                                        className="hover:text-[#1e50ff] transition-colors text-left cursor-pointer"
                                    >
                                        Pendaftaran Akun Baru
                                    </button>
                                </li>
                                <li>
                                    <Link href="/forgot-password" className="hover:text-[#1e50ff] transition-colors">
                                        Lupa Kata Sandi
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard" className="hover:text-[#1e50ff] transition-colors">
                                        Dashboard Pengguna
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/api-access" className="hover:text-[#1e50ff] transition-colors">
                                        Kredensial API & Webhook
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Col 5: Kampus & Bantuan */}
                        <div className="space-y-3">
                            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Kampus & Bantuan</h4>
                            <div className="space-y-2.5 text-slate-300 text-xs">
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-[#1e50ff] shrink-0 mt-0.5" />
                                    <span className="leading-snug">
                                        Panyingkiran, Kec. Panyingkiran, Kabupaten Majalengka, Jawa Barat 45459
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-[#1e50ff] shrink-0" />
                                    <a href="mailto:info@mardira.ac.id" className="hover:text-[#1e50ff] transition-colors">
                                        info@mardira.ac.id
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#1e50ff] shrink-0" />
                                    <span>Hotline: +62 838-6012-467</span>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-blue-300/80 pt-1">
                                    <Clock className="w-3.5 h-3.5 text-[#1e50ff] shrink-0" />
                                    <span>Senin – Jumat: 08.00 – 16.00 WIB</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Sub-Footer Bar */}
                    <div className="mt-10 pt-6 border-t border-blue-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
                        <p>© 2026 Politeknik Mardira Indonesia. Seluruh hak cipta dilindungi undang-undang.</p>
                        <div className="flex items-center gap-4 text-slate-400">
                            <span>Platform Produksi Mandiri PMI</span>
                            <span>•</span>
                            <span className="text-[#1e50ff] font-medium">Sistem Gateway Aktif</span>
                        </div>
                    </div>
                </div>
            </footer>

            {/* AUTHENTICATION & SUBSCRIPTION POPUP MODAL */}
            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                initialMode={authModalMode}
                initialPlanId={authModalPlanId}
                plans={safePlans}
            />
        </motion.div>
    );
}
