import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicLayout, { usePublicAuth } from '../../Layouts/PublicLayout';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import {
    Cpu,
    Zap,
    Shield,
    Server,
    Check,
    CheckCircle2,
    Sparkles,
    ArrowRight,
    RefreshCw,
    Layers,
    Clock,
    Lock,
    Activity,
    Smartphone,
    Share2,
    Sliders,
    AlertTriangle,
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
        transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
};

export default function DualEngine({ plans = [], stats = {} }) {
    const safePlans = Array.isArray(plans) ? plans : [];
    const { openRegisterModal } = usePublicAuth();

    // Spintax Live Demo Generator
    const [spintaxSentence, setSpintaxSentence] = useState(
        'Halo Kak Budi, tagihan semester Anda #INV-290 telah terbit dan siap dibayar. Salam hangat dari Politeknik Mardira Indonesia!'
    );

    const randomizeSpintax = () => {
        const greetings = ['Halo', 'Hai', 'Selamat siang', 'Salam hangat', 'Selamat pagi'];
        const targets = ['Kak Budi', 'Rekan Mahasiswa', 'Bapak/Ibu Wali', 'Siswa/i Terdaftar'];
        const notices = [
            'tagihan semester telah kami terbitkan secara resmi.',
            'sistem absensi perkuliahan SIAKAD telah diperbarui.',
            'jadwal praktikum laboratorium telah resmi diumumkan.',
            'kartu ujian semester genap sudah dapat diunduh.',
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
    };

    const engineComparison = [
        {
            feature: 'Protokol Koneksi',
            server1: 'High-Speed Direct Socket Gateway',
            server2: 'Dedicated Multi-Session Web Gateway',
            winner: 'Server 1',
        },
        {
            feature: 'Konsumsi RAM per Device',
            server1: 'Sangat Hemat (~25 - 40 MB)',
            server2: 'Sesi Terisolasi (~160 - 220 MB)',
            winner: 'Server 1',
        },
        {
            feature: 'Latensi Respon Pengiriman',
            server1: 'Ultra Kilat (~35 - 50 ms)',
            server2: 'Cepat & Stabil (~110 - 150 ms)',
            winner: 'Server 1',
        },
        {
            feature: 'Keandalan Sesi Koneksi',
            server1: 'Emulasi Perangkat WhatsApp Multi-Device',
            server2: '100% Identik dengan WhatsApp Web Asli',
            winner: 'Server 2',
        },
        {
            feature: 'Toleransi Anti-Banned Nomor',
            server1: 'Sangat Baik (Didukung Delay & Spintax)',
            server2: 'Maksimum (Skor Reputasi Tertinggi)',
            winner: 'Server 2',
        },
        {
            feature: 'Waktu Reconnect Sesi Putus',
            server1: 'Instant (< 2 Detik via Session Key)',
            server2: 'Auto Reconnect (~5 - 8 Detik)',
            winner: 'Server 1',
        },
        {
            feature: 'Kesesuaian Penggunaan Terbaik',
            server1: 'Broadcast Massal Ribuan Nomor & OTP Kilat',
            server2: 'Customer Service Live Chat & Notifikasi Keuangan',
            winner: 'Keduanya',
        },
    ];

    const zeroBanFeatures = [
        {
            title: 'Algoritma Spintax Dinamis',
            desc: 'Variasikan kata sapaan, pembuka, dan penutup di setiap pesan secara acak sehingga setiap penerima mendapatkan susunan kalimat yang berbeda dan tidak dianggap broadcast spam oleh Meta.',
            icon: Sparkles,
        },
        {
            title: 'Jeda Manusiawi (Human-like Jitter Delay)',
            desc: 'Memberikan interval acak antara 8 hingga 18 detik per pesan broadcast. Menyerupai kecepatan manusia mengetik dan membalas obrolan alami.',
            icon: Clock,
        },
        {
            title: 'Rotasi Multi-Perangkat (Device Round-Robin)',
            desc: 'Bagi beban pengiriman massal ke 2 atau lebih nomor WhatsApp yang terhubung secara otomatis untuk menjaga batas kuota aman harian tiap nomor.',
            icon: Share2,
        },
        {
            title: 'Smart Fallback & Auto-Failover',
            desc: 'Jika salah satu sesi mengalami gangguan koneksi, sistem secara otomatis mengalihkan antrean pesan ke gateway cadangan tanpa intervensi manual.',
            icon: Server,
        },
    ];

    return (
        <PublicLayout title="Teknologi Dual Server & Anti-Ban" plans={safePlans} activeMenu="dual-engine">
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
                                <Cpu className="w-3.5 h-3.5 text-amber-300" />
                                <span>ARSITEKTUR DUAL-SERVER WHATSAPP TERPERCAYA</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            variants={heroItemVariants}
                            className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight gsap-hero-item"
                        >
                            Dual Server: <span className="text-amber-300">Server 1</span> + <span className="text-emerald-400">Server 2</span>
                        </motion.h1>

                        <motion.p
                            variants={heroItemVariants}
                            className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed gsap-hero-item"
                        >
                            Bebas memilih server terbaik untuk setiap kebutuhan: kecepatan throughput ekstrem dengan konsumsi memori minim pada Server 1, atau arsitektur sesi terisolasi untuk perlindungan anti-blokir maksimal pada Server 2.
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
                                <span>Coba Dual Server Sekarang</span>
                            </motion.button>
                            <Link
                                href="/cara-pakai"
                                prefetch
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 text-sm font-bold text-white backdrop-blur-xs transition-all"
                            >
                                <span>Lihat Cara Integrasi &rarr;</span>
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>

                {/* ================= DUAL ENGINE CARDS ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 gsap-card-grid">
                        {/* Server 1 Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-30px' }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="gsap-card gsap-reveal-left"
                        >
                            <Card className="h-full p-7 rounded-3xl border-2 border-emerald-500/40 bg-white shadow-xl space-y-5 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-emerald-500">
                                <div className="absolute top-0 right-0 px-4 py-1.5 bg-emerald-600 text-white rounded-bl-2xl text-[10px] font-black uppercase tracking-wider">
                                    ULTRA-LOW RAM & LATENSI
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg shadow-2xs">
                                        ⚡
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Server 1 WhatsApp</h3>
                                        <p className="text-xs text-slate-500 font-mono">High-Speed Direct Socket Gateway</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Didesain khusus untuk broadcast volume tinggi. Menggunakan soket biner berkecepatan tinggi tanpa overhead rendering browser sehingga server dapat menjalankan puluhan perangkat sekaligus dengan sangat hemat daya.
                                </p>
                                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Konsumsi RAM:</span>
                                        <strong className="font-mono text-emerald-700">~25 - 40 MB</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Latensi Kirim:</span>
                                        <strong className="font-mono text-emerald-700">~38 ms / pesan</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Kapasitas Broadcast:</span>
                                        <strong className="font-semibold text-slate-800">10.000+ nomor/jam</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-slate-500">Cocok Untuk:</span>
                                        <strong className="font-semibold text-slate-800">Broadcast Massal & OTP</strong>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Server 2 Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-30px' }}
                            transition={{ duration: 0.25, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="gsap-card gsap-reveal-right"
                        >
                            <Card className="h-full p-7 rounded-3xl border-2 border-amber-400/40 bg-white shadow-xl space-y-5 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-amber-400">
                                <div className="absolute top-0 right-0 px-4 py-1.5 bg-amber-400 text-slate-950 rounded-bl-2xl text-[10px] font-black uppercase tracking-wider">
                                    HIGH STABILITY & ISOLATION
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-lg shadow-2xs">
                                        🛡️
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">Server 2 WhatsApp</h3>
                                        <p className="text-xs text-slate-500 font-mono">Dedicated Multi-Session Web Gateway</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Menjalankan protokol web sesi independen di latar belakang dengan sidik jari autentik. Menghasilkan skor stabilitas dan keamanan anti-ban tertinggi untuk nomor utama bisnis dan layanan customer care dua arah.
                                </p>
                                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Konsumsi RAM:</span>
                                        <strong className="font-mono text-amber-800">~180 - 220 MB</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Keaslian Sesi:</span>
                                        <strong className="font-semibold text-amber-800">100% Web Autentik</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Live Chat Inbox:</span>
                                        <strong className="font-semibold text-slate-800">Sempurna (Full Hook)</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-slate-500">Cocok Untuk:</span>
                                        <strong className="font-semibold text-slate-800">CS Dua Arah & SIAKAD</strong>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* ================= DEEP COMPARISON TABLE ================= */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 gsap-reveal"
                >
                    <div className="text-center space-y-2 mb-10">
                        <Badge variant="emerald" className="text-[10px] font-bold">PERBANDINGAN MENDALAM</Badge>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Matriks Spesifikasi Teknis Antara Kedua Server
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Tabel komparasi performa, konsumsi daya, dan kecocokan use-case operasional.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="py-3.5 px-5 font-bold">Parameter / Fitur</th>
                                        <th className="py-3.5 px-5 font-bold text-emerald-800 bg-emerald-50/50">Server 1 WhatsApp</th>
                                        <th className="py-3.5 px-5 font-bold text-amber-900 bg-amber-50/40">Server 2 WhatsApp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {engineComparison.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-5 font-bold text-slate-900">
                                                {row.feature}
                                            </td>
                                            <td className="py-3.5 px-5 text-slate-700 bg-emerald-50/20 font-medium">
                                                {row.server1}
                                            </td>
                                            <td className="py-3.5 px-5 text-slate-700 bg-amber-50/10 font-medium">
                                                {row.server2}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.section>

                {/* ================= SPINTAX INTERACTIVE SIMULATOR ================= */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 gsap-reveal"
                >
                    <div className="rounded-3xl bg-slate-900 text-white p-7 sm:p-10 border border-slate-800 shadow-xl space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
                            <div>
                                <Badge variant="gold" className="text-[10px] font-bold">
                                    FITUR UNGGULAN ANTI-BANNED
                                </Badge>
                                <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
                                    Generator Spintax Pesan Acak Otomatis
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Coba acak susunan kata di bawah untuk melihat bagaimana sistem menghasilkan pesan unik di tiap nomor.
                                </p>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                type="button"
                                onClick={randomizeSpintax}
                                className="inline-flex items-center justify-center bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl h-9 px-4 shrink-0 shadow-xs cursor-pointer transition-all"
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                <span>Acak Variasi Kalimat</span>
                            </motion.button>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs text-emerald-400 space-y-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                                Pola Sintaks Spintax:
                            </span>
                            <p className="text-slate-300">
                                {`{Halo|Hai|Selamat siang} {{nama}}, {tagihan semester|jadwal praktikum} telah terbit. {Semoga harimu menyenangkan|Salam hangat}!`}
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-700/50 space-y-2 min-h-[92px]">
                            <span className="text-[10px] uppercase font-bold text-amber-300 flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Hasil Generate Pesan ke WhatsApp Penerima:</span>
                            </span>
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={spintaxSentence}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.18 }}
                                    className="text-white text-sm font-sans leading-relaxed"
                                >
                                    "{spintaxSentence}"
                                </motion.p>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.section>

                {/* ================= ZERO-BAN PILLARS ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{ duration: 0.22 }}
                        className="text-center space-y-2 mb-10 gsap-reveal"
                    >
                        <Badge variant="emerald" className="text-[10px] font-bold">PROTEKSI TINGKAT TINGGI</Badge>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            4 Pilar Perlindungan Anti-Banned MARDIRA WA
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Dirancang oleh tim pengembang Politeknik Mardira Indonesia untuk menjaga reputasi nomor bisnis Anda.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 gsap-card-grid">
                        {zeroBanFeatures.map((item, idx) => {
                            const Icon = item.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-20px' }}
                                    transition={{ duration: 0.25, delay: idx * 0.06, ease: [0.16, 1, 0.3, 1] }}
                                    whileHover={{ y: -6, scale: 1.02 }}
                                    className="gsap-card"
                                >
                                    <Card className="h-full p-5 rounded-2xl border border-slate-200/90 bg-white shadow-card hover:shadow-card-hover hover:border-emerald-300 transition-all space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold border border-emerald-200/60">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-slate-600 leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ================= CTA BANNER ================= */}
                <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="rounded-3xl bg-gradient-to-r from-emerald-800 via-[#064e3b] to-slate-900 p-8 sm:p-10 text-white text-center space-y-4 shadow-xl gsap-scale"
                    >
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                            Gunakan Fleksibilitas Dual Server Hari Ini
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
                            Tautkan perangkat Anda dan rasakan kemudahan beralih antara Server 1 dan Server 2 WhatsApp hanya dengan 1 klik.
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
                                <span>Daftar Akun Baru Sekarang</span>
                            </motion.button>
                            <Link
                                href="/rest-api"
                                prefetch
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 text-xs font-bold text-white transition-all"
                            >
                                <span>Lihat Dokumentasi API &rarr;</span>
                            </Link>
                        </div>
                    </motion.div>
                </section>
            </div>
        </PublicLayout>
    );
}
