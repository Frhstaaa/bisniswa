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
            'tagihan semester Anda #INV-290 telah terbit dan siap dibayar.',
            'informasi jadwal perkuliahan terbaru telah diperbarui di sistem SIAKAD.',
            'pendaftaran workshop teknologi kampus telah resmi dibuka hari ini.',
            'kartu ujian Anda telah disetujui dan dapat diunduh di dashboard.',
        ];
        const closings = [
            'Salam hangat dari Politeknik Mardira Indonesia!',
            'Terima kasih atas perhatian Anda.',
            'Semoga harimu menyenangkan!',
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
            feature: 'Protokol Enkripsi & Runtime',
            wwebjs: 'Resmi WhatsApp Web JS (Headless Chromium)',
            socket: 'Socket Reverse-Engineered Tradisional',
            advantage: 'WhatsApp Web JS',
        },
        {
            feature: 'Pencegahan "Menunggu Pesan Ini"',
            wwebjs: '100% Bebas Kendala (Enkripsi Native Meta)',
            socket: 'Sering Tertahan (Signal Ratchet Desync / Bad MAC)',
            advantage: 'WhatsApp Web JS',
        },
        {
            feature: 'Keaslian Sesi & Sidik Jari Web',
            wwebjs: '100% Identik dengan WhatsApp Web Asli',
            socket: 'Emulasi Virtual (Rentan Deteksi Bot)',
            advantage: 'WhatsApp Web JS',
        },
        {
            feature: 'Akselerasi Backend',
            wwebjs: 'Laravel Octane + FrankenPHP Multi-Worker',
            socket: 'PHP-FPM Konvensional',
            advantage: 'WhatsApp Web JS',
        },
        {
            feature: 'Toleransi Anti-Banned Nomor',
            wwebjs: 'Maksimum (Skor Reputasi Meta Tertinggi)',
            socket: 'Moderat (Rentan Rotasi Protokol WhatsApp)',
            advantage: 'WhatsApp Web JS',
        },
        {
            feature: 'Mekanisme Auto-Recovery Sesi',
            wwebjs: 'Heartbeat Keep-Alive & Auto-Restore Disk',
            socket: 'Manual Reconnect Saat Socket Putus',
            advantage: 'WhatsApp Web JS',
        },
        {
            feature: 'Kesesuaian Penggunaan Terbaik',
            wwebjs: 'Customer Service Live Chat, Broadcast & Notifikasi Bisnis',
            socket: 'Proyek Skala Kecil Tanpa Jaminan E2EE',
            advantage: 'WhatsApp Web JS',
        },
    ];

    const zeroBanFeatures = [
        {
            title: 'Algoritma Spintax Dinamis',
            desc: 'Variasikan kata sapaan, pembuka, dan penutup di setiap pesan secara acak sehingga setiap penerima mendapatkan susunan kalimat yang berbeda dan tidak dianggap broadcast spam oleh Meta.',
            icon: Sparkles,
        },
        {
            title: 'Jeda Acak Manusiawi (Smart Delay)',
            desc: 'Interval pengiriman dinamis antara 8 hingga 18 detik per pesan broadcast untuk meniru pola ketukan dan perilaku pengetikan manusia sesungguhnya.',
            icon: Clock,
        },
        {
            title: 'Isolasi Sesi Headless Browser',
            desc: 'Setiap perangkat WhatsApp beroperasi dalam profil browser Chromium terisolasi dengan data sesi LocalAuth mandiri tanpa campur aduk cache.',
            icon: Shield,
        },
        {
            title: 'Deteksi & Heartbeat Auto-Recovery',
            desc: 'Sistem proactive keep-alive secara otomatis mendeteksi jika browser terputus dan melakukan restart bersih instan tanpa kehilangan autentikasi.',
            icon: RefreshCw,
        },
        {
            title: 'Resolusi WhatsApp LID Otomatis',
            desc: 'Sistem memetakan pengenal WhatsApp LID secara transparan ke nomor ponsel internasional (+62) tanpa kegagalan pengiriman pesan.',
            icon: Share2,
        },
        {
            title: 'FrankenPHP Concurrency Worker',
            desc: 'Ditenagai runtime FrankenPHP dan Laravel Octane yang memproses antrean pesan secara paralel dengan respon sub-milidetik.',
            icon: Zap,
        },
    ];

    return (
        <PublicLayout title="Teknologi WhatsApp Web JS & FrankenPHP" plans={safePlans} activeMenu="dual-engine">
            <div className="space-y-16 lg:space-y-24">
                {/* ================= HERO HEADER ================= */}
                <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-950 text-white pt-36 sm:pt-44 lg:pt-48 pb-24 sm:pb-32 px-4 sm:px-6 lg:px-10">
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
                                <span>ARSITEKTUR SINGLE-ENGINE WHATSAPP WEB JS RESMI</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            variants={heroItemVariants}
                            className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight gsap-hero-item"
                        >
                            WhatsApp Web JS: <span className="text-amber-300">Anti "Menunggu Pesan"</span> & <span className="text-emerald-400">Sesi Stabil</span>
                        </motion.h1>

                        <motion.p
                            variants={heroItemVariants}
                            className="text-slate-200 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed gsap-hero-item"
                        >
                            Enkripsi Signal Protocol resmi Meta dijalankan via browser Headless Chromium terisolasi. Pesan terbuka seketika di ponsel penerima tanpa kendala desinkronisasi, didukung akselerasi performa tinggi dari Laravel Octane dan FrankenPHP.
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
                                <span>Coba Engine WhatsApp Sekarang</span>
                            </motion.button>
                            <Link
                                href="/cara-pakai"
                                prefetch
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 text-sm font-bold text-white backdrop-blur-xs transition-all"
                            >
                                <span>Lihat Panduan Integrasi &rarr;</span>
                            </Link>
                        </motion.div>
                    </motion.div>
                </section>

                {/* ================= CORE PILLAR CARDS ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-14">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 gsap-card-grid">
                        {/* WhatsApp Web JS Card */}
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
                                    NATIVE E2EE & ANTI-BAN
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-lg shadow-2xs">
                                        ⚡
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">WhatsApp Web JS</h3>
                                        <p className="text-xs text-slate-500 font-mono">Headless Chromium Official Client</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Menjalankan kode resmi WhatsApp Web langsung di dalam browser headless. Kunci ratchet dikelola oleh skrip Meta sehingga pesan selalu terdekripsi seketika tanpa error autentikasi MAC di HP penerima.
                                </p>
                                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Enkripsi E2EE:</span>
                                        <strong className="font-semibold text-emerald-700">Resmi Meta WhatsApp</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Isu Menunggu Pesan:</span>
                                        <strong className="font-bold text-emerald-700">0% (Bebas Delay Sinyal)</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Live Chat 2 Arah:</span>
                                        <strong className="font-semibold text-slate-800">Sinkron Real-time</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-slate-500">Keamanan Sesi:</span>
                                        <strong className="font-semibold text-slate-800">LocalAuth Terisolasi</strong>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>

                        {/* Laravel Octane & FrankenPHP Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-30px' }}
                            transition={{ duration: 0.25, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            className="gsap-card gsap-reveal-right"
                        >
                            <Card className="h-full p-7 rounded-3xl border-2 border-blue-400/40 bg-white shadow-xl space-y-5 relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-blue-400">
                                <div className="absolute top-0 right-0 px-4 py-1.5 bg-blue-600 text-white rounded-bl-2xl text-[10px] font-black uppercase tracking-wider">
                                    HIGH PERFORMANCE RUNTIME
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-black text-lg shadow-2xs">
                                        🚀
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900">FrankenPHP + Octane</h3>
                                        <p className="text-xs text-slate-500 font-mono">Caddy-Powered Concurrency Worker</p>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Aplikasi Laravel dimuat ke dalam memori RAM secara persisten. Menghilangkan overhead booting di setiap permintaan HTTP dan webhook, memberikan waktu respon sub-milidetik di bawah beban puncak.
                                </p>
                                <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Arsitektur Server:</span>
                                        <strong className="font-mono text-blue-700">FrankenPHP Caddy</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Waktu Respon:</span>
                                        <strong className="font-semibold text-blue-700">Sub-Milidetik (~1.2 ms)</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1 border-b border-slate-50">
                                        <span className="text-slate-500">Worker Pool:</span>
                                        <strong className="font-semibold text-slate-800">Multi-Threaded Persistent</strong>
                                    </div>
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-slate-500">Kapasitas Concurrency:</span>
                                        <strong className="font-semibold text-slate-800">Ribuan Req/Detik</strong>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* ================= COMPARISON TABLE ================= */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-30px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 gsap-reveal"
                >
                    <div className="text-center space-y-2 mb-10">
                        <Badge variant="emerald" className="text-[10px] font-bold">PERBANDINGAN ARSITEKTUR</Badge>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            Mengapa WhatsApp Web JS Menjadi Standar Utama?
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Bandingkan keunggulan arsitektur resmi berbasis web browser dibandingkan library socket tidak resmi.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-card">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider">
                                    <tr>
                                        <th className="py-3.5 px-5 font-bold">Parameter / Fitur</th>
                                        <th className="py-3.5 px-5 font-bold text-emerald-800 bg-emerald-50/50">WhatsApp Web JS (BisnisWA)</th>
                                        <th className="py-3.5 px-5 font-bold text-slate-600 bg-slate-50">Library Socket Tidak Resmi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {engineComparison.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-3.5 px-5 font-bold text-slate-900">
                                                {row.feature}
                                            </td>
                                            <td className="py-3.5 px-5 text-emerald-900 bg-emerald-50/20 font-semibold">
                                                ✓ {row.wwebjs}
                                            </td>
                                            <td className="py-3.5 px-5 text-slate-500 bg-slate-50/30">
                                                {row.socket}
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                            <div className="space-y-1">
                                <span className="inline-block text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded">
                                    INTERAKTIF
                                </span>
                                <h3 className="text-xl font-bold">Simulasi Pola Spintax Anti-Spam</h3>
                                <p className="text-xs text-slate-400">
                                    Lihat bagaimana kalimat acak dinamis dibentuk agar pesan massal memiliki variasi unik dan tidak diblokir.
                                </p>
                            </div>
                            <Button
                                onClick={randomizeSpintax}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold gap-2 rounded-xl h-10 px-4 shrink-0 shadow-md cursor-pointer"
                            >
                                <RefreshCw className="w-4 h-4 text-emerald-200" />
                                <span>Acak Variasi Pesan</span>
                            </Button>
                        </div>

                        <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 font-mono text-xs sm:text-sm text-emerald-300 leading-relaxed shadow-inner">
                            "{spintaxSentence}"
                        </div>

                        <p className="text-[11px] text-slate-400">
                            💡 <strong>Format Spintax:</strong> <code>{'{Halo|Hai|Selamat siang}'} {'{Nama|Kak|Bpk/Ibu}'}</code> akan menghasilkan ribuan kombinasi berbeda secara otomatis pada pengiriman broadcast.
                        </p>
                    </div>
                </motion.section>

                {/* ================= 6 PILARS ANTI-BAN ================= */}
                <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    <div className="text-center space-y-2">
                        <Badge variant="emerald" className="text-[10px] font-bold">PROTEKSI ANTI-BAN</Badge>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                            6 Pilar Perlindungan Nomor Bisnis Anda
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Dirancang agar operasional broadcast massal dan notifikasi transaksional berjalan lancar tanpa resiko blokir.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {zeroBanFeatures.map((item, idx) => {
                            const IconComponent = item.icon;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-20px' }}
                                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                                    whileHover={{ y: -4 }}
                                >
                                    <Card className="h-full p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-md transition-all space-y-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                                            <IconComponent className="w-5 h-5 text-emerald-600" />
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
                            Rasakan Kecepatan & Stabilitas WhatsApp Web JS Hari Ini
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
                            Tautkan perangkat Anda dan nikmati pengiriman pesan tanpa delay, sesi persisten yang awet, dan akselerasi FrankenPHP.
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
