import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicLayout, { usePublicAuth } from '../../Layouts/PublicLayout';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import {
    QrCode,
    Smartphone,
    Send,
    Code2,
    CheckCircle2,
    ArrowRight,
    Zap,
    ShieldCheck,
    Clock,
    Sparkles,
    Check,
    CheckCheck,
    Copy,
    MessageSquare,
    Users,
    Key,
    Server,
    ExternalLink,
    HelpCircle,
} from 'lucide-react';
import CopyButton from '../../Components/ui/CopyButton';

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
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function CaraPakai({ plans = [], stats = {} }) {
    const safePlans = Array.isArray(plans) ? plans : [];
    const { openRegisterModal } = usePublicAuth();

    // Simulator State
    const [simStudentName, setSimStudentName] = useState('Budi Santoso');
    const [simTemplate, setSimTemplate] = useState('otp');
    const [simCopied, setSimCopied] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const switchTemplateWithEffect = (newKey) => {
        setIsTyping(true);
        setTimeout(() => {
            setSimTemplate(newKey);
            setIsTyping(false);
        }, 280);
    };

    const simulationTemplates = {
        otp: {
            title: 'OTP Keamanan SIAKAD',
            content: (name) => `Halo Kak ${name},\n\nKode OTP Verifikasi Login Portal SIAKAD Kampus Anda adalah: *849120*.\n\n_Jangan berikan kode ini kepada pihak manapun termasuk admin kampus. Berlaku 5 menit._`,
            badge: 'OTP & Keamanan',
        },
        jadwal: {
            title: 'Pengumuman Jadwal Ujian',
            content: (name) => `Yth. Mahasiswa/i ${name},\n\nJadwal Ujian Akhir Semester (UAS) Genap Politeknik Mardira Indonesia telah terbit. Silakan unduh Kartu Ujian di portal akademik.\n\nRuang: Lab Komputer 3\nWaktu: Senin, 08:30 WIB.`,
            badge: 'Akademik Kampus',
        },
        tagihan: {
            title: 'Notifikasi Tagihan Invoice',
            content: (name) => `Salam hangat Kak ${name},\n\nTagihan registrasi semester #INV-2026-992 sebesar *Rp 1.500.000* telah terbit. Pembayaran dapat dilakukan via QRIS atau Transfer Bank resmi PMI.\n\nTerima kasih atas kerjasamanya!`,
            badge: 'Keuangan & Kasir',
        },
    };

    const steps = [
        {
            number: '01',
            title: 'Registrasi Akun & Buat Workspace',
            description: 'Daftar secara gratis dalam 30 detik. Sistem langsung membuatkan Workspace terisolasi, API Key produksi, dan kuota perdana untuk pengujian langsung.',
            icon: Users,
            badge: 'Langkah Awal',
            tips: 'Pendaftaran tidak memerlukan kartu kredit.',
        },
        {
            number: '02',
            title: 'Tautkan Nomor WhatsApp via Scan QR',
            description: 'Buka menu Perangkat, klik "Tambah Perangkat Baru", pilih server pengiriman (Server 1 untuk kecepatan kilat atau Server 2 untuk stabilitas sesi), lalu scan kode QR di layar menggunakan aplikasi WhatsApp di smartphone Anda.',
            icon: QrCode,
            badge: 'Koneksi 10 Detik',
            tips: 'Mendukung nomor WhatsApp standar maupun WhatsApp Business.',
        },
        {
            number: '03',
            title: 'Kirim Pesan Live Chat atau Broadcast Massal',
            description: 'Mulai kirim pesan teks, dokumen PDF, gambar, atau broadcast ribuan kontak sekaligus menggunakan file CSV dengan fitur proteksi anti-blokir (random delay 8-18 detik & spintax).',
            icon: Send,
            badge: 'Operasional',
            tips: 'Tersedia template canned response untuk balasan kilat.',
        },
        {
            number: '04',
            title: 'Integrasikan REST API & Webhook Real-time',
            description: 'Gunakan HTTP Bearer Token untuk menembak API kami dari backend sistem kampus (SIAKAD, Laravel, Node.js, Python) dan terima webhook seketika saat pesan terkirim atau ada balasan masuk.',
            icon: Code2,
            badge: 'Otomasi Penuh',
            tips: 'Dokumentasi Postman siap pakai dapat langsung diunduh.',
        },
    ];

    const antiBanGuidelines = [
        {
            title: 'Lakukan Pemanasan Nomor Baru (Warm-up)',
            desc: 'Untuk nomor baru, kirim secara bertahap: 50 pesan di hari ke-1, 150 di hari ke-2, lalu 500+ di minggu kedua agar skor reputasi Meta tetap prima.',
        },
        {
            title: 'Gunakan Jeda Acak (Random Jitter Delay)',
            desc: 'Sistem MARDIRA WA secara otomatis menerapkan jeda 8 hingga 18 detik antar pengiriman pesan broadcast sehingga menyerupai pola ketikan manusia normal.',
        },
        {
            title: 'Variasikan Kalimat dengan Spintax',
            desc: 'Gunakan sintaks {Halo|Hai|Selamat siang} dan variabel dinamis {{nama}} agar Meta tidak mengidentifikasi pesan Anda sebagai konten spam massal yang seragam.',
        },
        {
            title: 'Hanya Kirim ke Kontak yang Opt-In',
            desc: 'Pastikan penerima adalah mahasiswa, wali murid, atau pelanggan yang memang terdaftar di database resmi untuk menghindari tombol laporkan spam.',
        },
    ];

    return (
        <PublicLayout title="Cara Pakai & Alur Integrasi" plans={safePlans} activeMenu="cara-pakai">
            <div className="space-y-16 lg:space-y-24">
                {/* ================= HERO HEADER ================= */}
                <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white pt-36 sm:pt-44 lg:pt-48 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-10">
                    {/* Ambient Floating Glow Orbs */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.12, 0.25, 0.12],
                                x: [0, 20, 0],
                                y: [0, -15, 0],
                            }}
                            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
                            className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-emerald-500/25 blur-3xl"
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.25, 1],
                                opacity: [0.08, 0.2, 0.08],
                                x: [0, -25, 0],
                                y: [0, 20, 0],
                            }}
                            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                            className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-amber-400/15 blur-3xl"
                        />
                    </div>

                    <motion.div
                        variants={heroContainerVariants}
                        initial="hidden"
                        animate="visible"
                        className="relative max-w-5xl mx-auto text-center space-y-4"
                    >
                        <motion.div variants={heroItemVariants} className="inline-block gsap-hero-item">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold shadow-xs">
                                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                                <span>PANDUAN LENGKAP INTEGRASI WHATSAPP GATEWAY 2026</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            variants={heroItemVariants}
                            className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight gsap-hero-item"
                        >
                            Cara Pakai & Alur Integrasi Cepat <span className="text-amber-300">Cuma 3 Menit</span>
                        </motion.h1>

                        <motion.p
                            variants={heroItemVariants}
                            className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed gsap-hero-item"
                        >
                            Mulai dari pendaftaran akun, menghubungkan nomor WhatsApp via scan QR, hingga otomasi broadcast massal dan REST API tanpa konfigurasi server yang rumit.
                        </motion.p>

                        <motion.div variants={heroItemVariants} className="pt-4 flex flex-wrap items-center justify-center gap-3 gsap-hero-item">
                            <motion.button
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => openRegisterModal()}
                                className="btn-press inline-flex h-11 items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-6 text-sm font-bold text-slate-950 shadow-md transition-all cursor-pointer"
                            >
                                <Zap className="w-4 h-4 fill-slate-950" />
                                <span>Mulai Uji Coba Gratis</span>
                            </motion.button>
                            <Link
                                href="/rest-api"
                                prefetch
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 text-sm font-bold text-white backdrop-blur-xs transition-all"
                            >
                                <Code2 className="w-4 h-4 text-emerald-300" />
                                <span>Lihat Dokumentasi API</span>
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>

                {/* ================= 4-STEP WALKTHROUGH ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 gsap-card-grid">
                        {steps.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-30px' }}
                                    transition={{ duration: 0.25, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={{ y: -8, scale: 1.02 }}
                                    className="gsap-card"
                                >
                                    <Card
                                        className="h-full p-6 sm:p-7 rounded-2xl border border-slate-200/90 bg-white shadow-card hover:shadow-lg transition-shadow space-y-4 group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono text-3xl font-black text-emerald-600/30 group-hover:text-emerald-600 transition-colors">
                                                {step.number}
                                            </span>
                                            <Badge variant="emerald" className="text-[10px] uppercase font-bold tracking-wider">
                                                {step.badge}
                                            </Badge>
                                        </div>
                                        <div className="flex items-start gap-3.5">
                                            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                                    {step.title}
                                                </h3>
                                                <p className="text-xs text-slate-600 leading-relaxed mt-1.5">
                                                    {step.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                            <span><strong>Tips:</strong> {step.tips}</span>
                                        </div>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ================= INTERACTIVE SMARTPHONE MESSAGE SIMULATOR ================= */}
                <motion.section
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 gsap-reveal"
                >
                    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-10 lg:p-12 border border-emerald-800/40 shadow-2xl">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                            {/* Left Controls */}
                            <div className="lg:col-span-7 space-y-6">
                                <div className="space-y-2">
                                    <Badge variant="gold" className="text-[10px] font-bold">
                                        SIMULATOR INTERAKTIF
                                    </Badge>
                                    <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                        Simulasikan Tampilan Pesan WhatsApp Penerima
                                    </h2>
                                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                        Lihat bagaimana pesan otomatis dari sistem MARDIRA WA tampil dengan rapi di layar ponsel pelanggan atau mahasiswa Anda secara real-time.
                                    </p>
                                </div>

                                <div className="space-y-4 text-xs">
                                    <div>
                                        <label className="block text-slate-300 font-semibold mb-1.5">
                                            Nama Penerima Simulasi:
                                        </label>
                                        <input
                                            type="text"
                                            value={simStudentName}
                                            onChange={(e) => setSimStudentName(e.target.value)}
                                            placeholder="Nama Mahasiswa / Klien"
                                            className="w-full sm:w-80 px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-400"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-slate-300 font-semibold">
                                                Pilih Kategori Pesan:
                                            </label>
                                            <CopyButton
                                                textToCopy={simulationTemplates[simTemplate].content(simStudentName || 'Budi Santoso')}
                                                label="Salin Teks Format"
                                                copiedLabel="Format Tersalin!"
                                                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(simulationTemplates).map(([key, item]) => (
                                                <motion.button
                                                    key={key}
                                                    type="button"
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => switchTemplateWithEffect(key)}
                                                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        simTemplate === key
                                                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                                                            : 'bg-white/10 text-white hover:bg-white/20 border border-white/15'
                                                    }`}
                                                >
                                                    {item.title}
                                                </motion.button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-700/40 text-emerald-200 text-xs flex items-start gap-2.5">
                                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <span className="leading-relaxed">
                                            Pesan dikirim melalui gateway terenkripsi resmi Politeknik Mardira Indonesia tanpa mencantumkan watermark pihak ketiga.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Phone Mockup */}
                            <div className="lg:col-span-5 flex justify-center">
                                <div className="w-[300px] sm:w-[320px] rounded-[36px] bg-slate-950 p-3 shadow-2xl border-4 border-slate-700">
                                    {/* Phone Screen */}
                                    <div className="rounded-[26px] bg-[#efeae2] h-[480px] flex flex-col overflow-hidden text-slate-900 border border-slate-800">
                                        {/* Mock WhatsApp Bar */}
                                        <div className="h-14 bg-[#075e54] text-white px-3 flex items-center gap-2.5 shrink-0 shadow-xs">
                                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                                PM
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className="text-xs font-bold truncate leading-tight">
                                                    Politeknik Mardira Indonesia
                                                </h4>
                                                <p className="text-[10px] text-emerald-200 truncate">
                                                    {isTyping ? 'sedang mengetik...' : 'Online • Akun Resmi'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Message Body */}
                                        <div className="flex-1 p-3 overflow-y-auto space-y-2 text-xs bg-[#efeae2] bg-[radial-gradient(#dfd7cc_1px,transparent_1px)] [background-size:16px_16px]">
                                            <div className="flex justify-center my-1">
                                                <span className="px-2.5 py-0.5 rounded-md bg-white/80 text-[10px] font-medium text-slate-500 shadow-2xs">
                                                    HARI INI
                                                </span>
                                            </div>

                                            <div className="flex justify-start">
                                                <AnimatePresence mode="wait">
                                                    {isTyping ? (
                                                        <motion.div
                                                            key="typing-indicator"
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.9 }}
                                                            className="rounded-2xl rounded-tl-xs px-4 py-3 bg-white text-[#111b21] shadow-2xs border border-slate-200/60 flex items-center gap-1.5"
                                                        >
                                                            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                                                            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.15s]" />
                                                            <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.3s]" />
                                                        </motion.div>
                                                    ) : (
                                                        <motion.div
                                                            key={`${simTemplate}-${simStudentName}`}
                                                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: -8, scale: 0.96 }}
                                                            transition={{ duration: 0.18, ease: 'easeOut' }}
                                                            className="max-w-[88%] rounded-2xl rounded-tl-xs px-3.5 py-2.5 bg-white text-[#111b21] shadow-2xs text-[12px] leading-relaxed border border-slate-200/60 relative space-y-2"
                                                        >
                                                            <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                {simulationTemplates[simTemplate].badge}
                                                            </span>
                                                            <p className="whitespace-pre-line font-sans">
                                                                {simulationTemplates[simTemplate].content(simStudentName || 'Siswa')}
                                                            </p>
                                                            <div className="text-right text-[10px] text-slate-400 select-none flex items-center justify-end gap-1">
                                                                <span>12.30 WIB</span>
                                                                <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        {/* Mock WhatsApp Input */}
                                        <div className="p-2 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-2 shrink-0">
                                            <div className="flex-1 h-8 rounded-full bg-white px-3 text-[11px] text-slate-400 flex items-center border border-slate-200">
                                                Ketik pesan...
                                            </div>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                type="button"
                                                onClick={() => switchTemplateWithEffect(simTemplate)}
                                                className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#009475] text-white flex items-center justify-center cursor-pointer transition-colors shadow-xs"
                                                title="Kirim Uji Coba Pesan"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </motion.button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* ================= BEST PRACTICES & ANTI-BANNED ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{ duration: 0.22 }}
                        className="text-center space-y-2 mb-10 gsap-reveal"
                    >
                        <Badge variant="emerald" className="text-[10px] font-bold">PANDUAN KEAMANAN</Badge>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Aturan Emas Agar Nomor WhatsApp Aman dari Banned
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Ikuti standar pengiriman profesional berikut agar nomor Anda tetap beroperasi dengan skor reputasi tinggi di server Meta.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 gsap-card-grid">
                        {antiBanGuidelines.map((rule, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-20px' }}
                                transition={{ duration: 0.25, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ y: -6, scale: 1.02 }}
                                className="gsap-card"
                            >
                                <Card className="h-full p-5 rounded-2xl border border-slate-200/90 bg-white shadow-card hover:shadow-card-hover hover:border-emerald-300 transition-all space-y-2.5">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-200/60">
                                        0{idx + 1}
                                    </div>
                                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                        {rule.title}
                                    </h3>
                                    <p className="text-xs text-slate-600 leading-relaxed">
                                        {rule.desc}
                                    </p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ================= BOTTOM CTA BANNER ================= */}
                <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-3xl bg-gradient-to-r from-emerald-800 via-[#064e3b] to-slate-900 p-8 sm:p-10 text-white text-center space-y-4 shadow-xl gsap-scale"
                    >
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                            Siap Mengotomasi Pengiriman WhatsApp Anda?
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
                            Daftarkan akun sekarang, tautkan nomor Anda via scan QR dalam 10 detik, dan kirim pesan pertama Anda hari ini.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                            <motion.button
                                whileHover={{ scale: 1.03, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                type="button"
                                onClick={() => openRegisterModal()}
                                className="btn-press inline-flex h-11 items-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-6 text-xs font-bold text-slate-950 shadow-md transition-all cursor-pointer"
                            >
                                <Zap className="w-3.5 h-3.5 fill-slate-950" />
                                <span>Daftar Akun Baru Gratis</span>
                            </motion.button>
                            <Link
                                href="/dual-engine"
                                prefetch
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 text-xs font-bold text-white transition-all"
                            >
                                <span>Pelajari Dual Server &rarr;</span>
                            </Link>
                        </div>
                    </motion.div>
                </section>
            </div>
        </PublicLayout>
    );
}
