import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicLayout, { usePublicAuth } from '../../Layouts/PublicLayout';
import { Card } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import {
    HelpCircle,
    Search,
    ChevronDown,
    ChevronUp,
    Zap,
    MessageSquare,
    Phone,
    Mail,
    MapPin,
    Clock,
    Shield,
    Sparkles,
    CheckCircle2,
    ExternalLink,
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

export default function Faq({ plans = [], stats = {} }) {
    const safePlans = Array.isArray(plans) ? plans : [];
    const { openRegisterModal } = usePublicAuth();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [openIndex, setOpenIndex] = useState(0);

    const categories = [
        { id: 'all', label: 'Semua Kategori' },
        { id: 'akun', label: 'Akun & Registrasi' },
        { id: 'server', label: 'Server & Perangkat' },
        { id: 'broadcast', label: 'Broadcast & Anti-Banned' },
        { id: 'api', label: 'REST API & Webhook' },
        { id: 'billing', label: 'Langganan & Tagihan' },
    ];

    const faqList = [
        {
            category: 'akun',
            q: 'Bagaimana cara mendaftar akun baru di MARDIRA WA?',
            a: 'Anda dapat mendaftar dengan mengklik tombol "Daftar Sekarang" di pojok kanan atas. Cukup isi nama, email, nomor WhatsApp aktif, nama workspace, dan kata sandi. Workspace Anda akan langsung aktif secara instan dengan kuota uji coba gratis tanpa memerlukan kartu kredit.',
        },
        {
            category: 'server',
            q: 'Mengapa BisnisWA menggunakan BisnisWA UltraSync Engine?',
            a: 'BisnisWA UltraSync Engine menjalankan protokol web enterprise resmi secara terisolasi. Ini menjamin proses enkripsi End-to-End (E2EE) berstandar industri sehingga pesan langsung terkirim dan terbuka instan di HP penerima, sepenuhnya bebas dari masalah "Menunggu pesan ini", serta memiliki ketahanan sesi jangka panjang anti-ban.',
        },
        {
            category: 'broadcast',
            q: 'Bagaimana sistem mencegah nomor saya diblokir (anti-banned)?',
            a: 'MARDIRA WA dilengkapi dengan 4 pilar proteksi anti-ban: (1) Jeda manusiawi acak 8–18 detik antar pesan, (2) Fitur Spintax dinamis {Halo|Hai|Selamat siang} yang menghasilkan variasi teks unik di setiap nomor, (3) Rotasi multi-perangkat (device round-robin) untuk membagi beban pengiriman, dan (4) Panduan pemanasan nomor baru (warm-up protocol).',
        },
        {
            category: 'broadcast',
            q: 'Apakah bisa mengirim broadcast menggunakan data file Excel atau CSV?',
            a: 'Ya, platform kami memiliki fitur impor file CSV / Excel pada menu Broadcast. Anda dapat memetakan kolom nama, nomor telepon, dan parameter kustom lainnya, lalu menyisipkannya ke dalam template pesan dengan tag {{nama}}, {{kelas}}, {{tagihan}}, dll.',
        },
        {
            category: 'server',
            q: 'Berapa banyak nomor WhatsApp yang bisa saya hubungkan?',
            a: 'Jumlah perangkat tergantung paket yang Anda pilih: Paket Starter Lite mendukung 1 perangkat, Paket Pro Bisnis mendukung 3 perangkat, dan Paket Enterprise Kampus mendukung hingga 10 perangkat sekaligus dengan kemampuan rotasi pengiriman.',
        },
        {
            category: 'api',
            q: 'Bagaimana cara mengintegrasikan gateway ke sistem akademik (SIAKAD) atau web kami?',
            a: 'Anda dapat menggunakan HTTP REST API standar dengan autentikasi Bearer Token. Kami menyediakan endpoint untuk kirim pesan teks/OTP, kirim dokumen invoice PDF, serta cek status perangkat. Dokumentasi dan Postman collection lengkap siap diunduh di menu REST API.',
        },
        {
            category: 'api',
            q: 'Apakah tersedia Webhook untuk menerima laporan pengiriman dan pesan balasan pelanggan?',
            a: 'Ya, Anda cukup mendaftarkan URL webhook publik Anda di dashboard. Server kami akan memancarkan HTTP POST saat pesan berstatus terkirim (delivered), dibaca (read receipt), atau saat ada pesan balasan masuk dari pelanggan secara real-time.',
        },
        {
            category: 'billing',
            q: 'Metode pembayaran apa saja yang didukung untuk langganan?',
            a: 'Kami mendukung pembayaran otomatis melalui QRIS instan (BCA, Mandiri, GoPay, OVO, ShopeePay, Dana, LinkAja) serta Transfer Bank resmi kampus. Sistem verifikasi bekerja otomatis sehingga kuota dan masa aktif Anda bertambah dalam 1–2 menit setelah pembayaran terkonfirmasi.',
        },
        {
            category: 'billing',
            q: 'Bagaimana jika kuota pesan bulanan saya habis sebelum masa aktif selesai?',
            a: 'Anda dapat melakukan Top Up saldo kuota pesan kapan saja melalui menu Paket & Saldo Kuota tanpa harus menunggu perpanjangan bulan berikutnya. Kuota tambahan akan langsung aktif dan diakumulasikan ke akun Anda.',
        },
        {
            category: 'billing',
            q: 'Apakah ada masa tenggang (grace period) saat langganan jatuh tempo?',
            a: 'Ya, kami memberikan masa tenggang toleransi selama 3 hari setelah tanggal jatuh tempo agar operasional bisnis atau layanan kampus Anda tidak terputus seketika.',
        },
    ];

    const filteredFaqs = faqList.filter((item) => {
        const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
        const matchesQuery =
            !searchQuery.trim() ||
            item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.a.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesQuery;
    });

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <PublicLayout title="FAQ & Pusat Bantuan" plans={safePlans} activeMenu="faq">
            <div className="space-y-16 lg:space-y-20">
                {/* ================= HERO HEADER ================= */}
                <section className="relative overflow-hidden bg-white bg-grid-pattern text-slate-900 pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-10 border-b border-slate-100">
                    <motion.div
                        variants={heroContainerVariants}
                        initial="hidden"
                        animate="visible"
                        className="relative max-w-4xl mx-auto text-center space-y-5"
                    >
                        <motion.div variants={heroItemVariants} className="inline-block gsap-hero-item">
                            <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border-[1.5px] border-[#1e50ff] bg-white text-[#1e50ff] text-[10px] sm:text-xs font-bold sm:font-black uppercase tracking-normal sm:tracking-widest shadow-xs">
                                <HelpCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#1e50ff] shrink-0" />
                                <span className="hidden sm:inline">PUSAT BANTUAN & DUKUNGAN TEKNIS RESMI</span>
                                <span className="sm:hidden">PUSAT BANTUAN RESMI</span>
                            </div>
                        </motion.div>

                        <motion.h1
                            variants={heroItemVariants}
                            className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 leading-tight gsap-hero-item"
                        >
                            <span className="font-editorial-italic font-normal tracking-normal text-slate-900">Pusat Bantuan</span> Pertanyaan & <span className="text-[#1e50ff]">Jawaban Resmi</span>
                        </motion.h1>

                        <motion.p
                            variants={heroItemVariants}
                            className="text-slate-600 text-sm sm:text-base max-w-xl mx-auto leading-relaxed gsap-hero-item"
                        >
                            Temukan panduan cepat seputar operasional gateway, kuota pesan, teknologi BisnisWA UltraSync Engine, hingga integrasi API instan.
                        </motion.p>

                        {/* Search Input Bar */}
                        <motion.div variants={heroItemVariants} className="pt-4 max-w-xl mx-auto gsap-hero-item">
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari pertanyaan, topik anti-ban, API, tagihan..."
                                    className="w-full pl-11 pr-4 py-3 rounded-full bg-white text-slate-900 text-sm placeholder:text-slate-400 shadow-md border border-slate-200 focus:outline-none focus:border-[#1e50ff] focus:ring-1 focus:ring-[#1e50ff] transition-all"
                                />
                            </div>
                        </motion.div>
                    </motion.div>
                </section>

                {/* ================= CATEGORY FILTER TABS WITH FLUID LAYOUTID PILL ================= */}
                <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 gsap-reveal">
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="flex items-center justify-center"
                    >
                        <div className="inline-flex items-center justify-center flex-wrap gap-1.5 p-1.5 rounded-2xl bg-white/95 backdrop-blur-md shadow-card border border-slate-200/80">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                        selectedCategory === cat.id
                                            ? 'text-white'
                                            : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    {selectedCategory === cat.id && (
                                        <motion.div
                                            layoutId="activeFaqCategoryPill"
                                            className="absolute inset-0 bg-[#1e50ff] rounded-xl shadow-xs"
                                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                                        />
                                    )}
                                    <span className="relative z-10">{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </section>

                {/* ================= ACCORDION FAQ LIST ================= */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 gsap-reveal"
                >
                    {filteredFaqs.length === 0 ? (
                        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
                            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                            <h3 className="text-base font-bold text-slate-800">Pertanyaan Tidak Ditemukan</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                Coba gunakan kata kunci lain atau hubungi tim bantuan kampus kami secara langsung melalui WhatsApp.
                            </p>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                }}
                                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl h-8 px-4"
                            >
                                Reset Pencarian
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3.5 gsap-card-grid">
                            {filteredFaqs.map((faq, idx) => {
                                const isOpen = openIndex === idx;
                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: idx * 0.03, ease: [0.16, 1, 0.3, 1] }}
                                        className="gsap-card"
                                    >
                                        <Card
                                            className="rounded-2xl border border-slate-200/90 bg-white shadow-card hover:shadow-card-hover hover:border-blue-300 transition-all overflow-hidden"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleAccordion(idx)}
                                                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/60 transition-colors"
                                            >
                                                <span className="text-sm font-bold text-slate-900 leading-snug">
                                                    {faq.q}
                                                </span>
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                                                    <motion.div
                                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                                        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                                                    >
                                                        <ChevronDown className="w-4 h-4 text-[#1e50ff]" />
                                                    </motion.div>
                                                </div>
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
                                                        <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100/80 font-sans">
                                                            {faq.a}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </Card>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </motion.section>

                {/* ================= STILL HAVE QUESTIONS CARD ================= */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 gsap-reveal"
                >
                    <Card className="p-8 rounded-3xl border border-emerald-200 bg-emerald-50/70 shadow-card space-y-6">
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-black text-emerald-950">
                                Masih Punya Pertanyaan atau Butuh Bantuan Khusus?
                            </h3>
                            <p className="text-xs text-emerald-800 max-w-md mx-auto">
                                Tim teknis dan helpdesk Politeknik Mardira Indonesia siap membantu integrasi dan konsultasi nomor bisnis Anda.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs gsap-card-grid">
                            <motion.div
                                whileHover={{ y: -6, scale: 1.03 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="p-4 rounded-2xl bg-white border border-emerald-200/80 space-y-2 text-center shadow-card hover:shadow-card-hover transition-all gsap-card"
                            >
                                <Phone className="w-5 h-5 text-emerald-700 mx-auto" />
                                <span className="font-bold text-slate-900 block">WhatsApp Resmi</span>
                                <a
                                    href="https://wa.me/628386012467"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-emerald-700 font-semibold hover:underline block text-[11px]"
                                >
                                    +62 838-6012-467
                                </a>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -6, scale: 1.03 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="p-4 rounded-2xl bg-white border border-emerald-200/80 space-y-2 text-center shadow-card hover:shadow-card-hover transition-all gsap-card"
                            >
                                <Mail className="w-5 h-5 text-emerald-700 mx-auto" />
                                <span className="font-bold text-slate-900 block">Email Helpdesk</span>
                                <a
                                    href="mailto:info@mardira.ac.id"
                                    className="text-emerald-700 font-semibold hover:underline block text-[11px]"
                                >
                                    info@mardira.ac.id
                                </a>
                            </motion.div>

                            <motion.div
                                whileHover={{ y: -6, scale: 1.03 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className="p-4 rounded-2xl bg-white border border-emerald-200/80 space-y-2 text-center shadow-card hover:shadow-card-hover transition-all gsap-card"
                            >
                                <Clock className="w-5 h-5 text-emerald-700 mx-auto" />
                                <span className="font-bold text-slate-900 block">Jam Operasional</span>
                                <span className="text-slate-600 block text-[11px]">
                                    Senin – Jumat (08.00–16.00 WIB)
                                </span>
                            </motion.div>
                        </div>
                    </Card>
                </motion.section>

                {/* ================= CTA BANNER ================= */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.98 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 gsap-scale"
                >
                    <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-[#064e3b] to-slate-900 p-8 sm:p-10 text-white text-center space-y-4 shadow-xl">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                            Mulai Gunakan MARDIRA WA Sekarang
                        </h2>
                        <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
                            Daftarkan akun gratis hari ini dan nikmati kemudahan otomasi pesan WhatsApp enterprise.
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
                                href="/cara-pakai"
                                prefetch
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-5 text-xs font-bold text-white transition-all"
                            >
                                <span>Lihat Cara Integrasi &rarr;</span>
                            </Link>
                        </div>
                    </div>
                </motion.section>
            </div>
        </PublicLayout>
    );
}
