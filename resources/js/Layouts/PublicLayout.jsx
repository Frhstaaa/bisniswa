import React, { useState, useEffect, createContext, useContext } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthModal from '../Components/AuthModal';
import PageTransition from '../Components/PageTransition';
import { useGsapReveal } from '../hooks/useGsapReveal';
import {
    Zap,
    LogIn,
    Menu,
    X,
    Shield,
    Server,
    MapPin,
    Mail,
    Phone,
    Clock,
    ArrowRight,
    LayoutDashboard,
} from 'lucide-react';

export const openPublicRegisterModal = (planId = null) => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-public-auth-modal', { detail: { mode: 'register', planId } }));
    }
};

export const openPublicLoginModal = () => {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-public-auth-modal', { detail: { mode: 'login' } }));
    }
};

export const PublicAuthContext = createContext({
    openRegisterModal: openPublicRegisterModal,
    openLoginModal: openPublicLoginModal,
});

export const usePublicAuth = () => useContext(PublicAuthContext);

export default function PublicLayout({
    children,
    title,
    plans = [],
    activeMenu = '',
}) {
    const safePlans = Array.isArray(plans) ? plans : [];
    const { url, props } = usePage();
    const user = props?.auth?.user;
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const mainRef = useGsapReveal([url]);

    // Auth Modal State
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

    useEffect(() => {
        const handleAuthEvent = (e) => {
            const { mode, planId } = e.detail || {};
            if (mode === 'login') {
                setAuthModalMode('login');
                setIsAuthModalOpen(true);
            } else {
                setAuthModalMode('register');
                setAuthModalPlanId(planId || null);
                setIsAuthModalOpen(true);
            }
        };

        window.addEventListener('open-public-auth-modal', handleAuthEvent);
        return () => window.removeEventListener('open-public-auth-modal', handleAuthEvent);
    }, []);

    const navLinks = [
        { label: 'Panduan Integrasi', href: '/cara-pakai', key: 'cara-pakai', match: (u) => u.startsWith('/cara-pakai') },
        { label: 'Teknologi UltraSync', href: '/dual-engine', key: 'dual-engine', match: (u) => u.startsWith('/dual-engine') },
        { label: 'Dokumentasi API', href: '/rest-api', key: 'rest-api', match: (u) => u.startsWith('/rest-api') },
        { label: 'Paket Layanan', href: '/harga', key: 'harga', match: (u) => u.startsWith('/harga') || u.startsWith('/paket-harga') },
        { label: 'Pusat Bantuan', href: '/faq', key: 'faq', match: (u) => u.startsWith('/faq') },
    ];

    return (
        <PublicAuthContext.Provider value={{ openRegisterModal, openLoginModal }}>
            <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900 flex flex-col justify-between">
                <Head title={title ? `${title} — MARDIRA WA` : 'MARDIRA WA — Portal Enterprise WhatsApp Gateway & Broadcast API'} />

                {/* ================= TOP NAVBAR ================= */}
                <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300 bg-[#064e3b]/95 backdrop-blur-md border-b border-emerald-500/20">
                    <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-10 py-3 sm:py-3.5">
                        {/* Brand Logo */}
                        <Link href="/" prefetch className="flex items-center gap-2.5 sm:gap-3 group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden bg-white p-1 shadow-sm border border-white/20 transition-transform duration-200 shrink-0 flex items-center justify-center"
                            >
                                <img
                                    src="/images/logo-mardira.jpg"
                                    alt="Politeknik Mardira Indonesia"
                                    className="h-full w-full object-contain"
                                />
                            </motion.div>
                            <div>
                                <span className="text-sm sm:text-base font-black tracking-tight text-white block leading-none">
                                    MARDIRA<span className="text-amber-400">WA</span>
                                </span>
                                <span className="text-[9px] sm:text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mt-0.5">
                                    POLITEKNIK MARDIRA INDONESIA
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden items-center gap-1 md:flex">
                            {navLinks.map((item) => {
                                const isActive = activeMenu === item.key || item.match(url);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch
                                        className={`rounded-lg px-3.5 py-1.5 text-xs transition-all ${
                                            isActive
                                                ? 'bg-[#0f4a38] border border-emerald-600/40 text-white font-semibold shadow-2xs'
                                                : 'text-slate-200 hover:text-white hover:bg-white/10 font-semibold'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Desktop Right Action Buttons */}
                        <div className="hidden sm:flex items-center gap-2.5">
                            {user ? (
                                <Link
                                    href="/dashboard"
                                    prefetch
                                    className="btn-press inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 text-xs font-bold text-slate-950 shadow-md transition-all cursor-pointer"
                                >
                                    <LayoutDashboard className="w-3.5 h-3.5" />
                                    <span>Buka Dashboard</span>
                                </Link>
                            ) : (
                                <>
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.03, y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={() => openRegisterModal()}
                                        className="btn-press inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 text-xs font-bold text-slate-950 shadow-md transition-all cursor-pointer"
                                    >
                                        <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                                        <span>Mulai Sekarang</span>
                                    </motion.button>
                                    <motion.button
                                        type="button"
                                        whileHover={{ scale: 1.03, y: -1 }}
                                        whileTap={{ scale: 0.97 }}
                                        onClick={openLoginModal}
                                        className="btn-press inline-flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 text-xs font-bold text-white backdrop-blur-xs transition-all cursor-pointer"
                                    >
                                        <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Masuk Workspace</span>
                                    </motion.button>
                                </>
                            )}
                        </div>

                        {/* Mobile Actions & Toggle */}
                        <div className="flex sm:hidden items-center gap-2">
                            {user ? (
                                <Link
                                    href="/dashboard"
                                    prefetch
                                    className="btn-press inline-flex h-8 items-center gap-1 rounded-lg bg-amber-400 hover:bg-amber-300 px-2.5 text-[11px] font-bold text-slate-950 shadow-xs"
                                >
                                    <LayoutDashboard className="w-3 h-3" />
                                    <span>Dashboard</span>
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={openLoginModal}
                                    className="btn-press inline-flex h-8 items-center gap-1 rounded-lg border border-white/20 bg-white/10 hover:bg-white/20 px-2.5 text-[11px] font-bold text-white backdrop-blur-xs transition-all"
                                >
                                    <LogIn className="w-3 h-3 text-emerald-400" />
                                    <span>Masuk</span>
                                </button>
                            )}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                aria-label="Toggle navigation menu"
                                className="btn-press h-8 w-8 inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all"
                            >
                                {isMobileMenuOpen ? <X className="w-4 h-4 text-amber-300" /> : <Menu className="w-4 h-4 text-white" />}
                            </button>
                        </div>
                    </nav>

                    {/* Mobile Dropdown Menu Sheet */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden border-t border-emerald-500/20 bg-[#064e3b]/98 backdrop-blur-xl px-4 py-4 space-y-3 animate-fade-in-up">
                            <div className="space-y-1">
                                {navLinks.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <span>{item.label}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>
                                ))}
                            </div>

                            <div className="pt-2 border-t border-emerald-600/40 flex flex-col gap-2">
                                {user ? (
                                    <Link
                                        href="/dashboard"
                                        prefetch
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-xs font-bold text-slate-950 shadow-xs"
                                    >
                                        <LayoutDashboard className="w-3.5 h-3.5" />
                                        <span>Buka Dashboard Workspace</span>
                                    </Link>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                openRegisterModal();
                                            }}
                                            className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-xs font-bold text-slate-950 shadow-xs cursor-pointer"
                                        >
                                            <Zap className="w-3.5 h-3.5 fill-slate-950" />
                                            <span>Mulai Sekarang</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                openLoginModal();
                                            }}
                                            className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
                                        >
                                            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Masuk Workspace</span>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </header>

                {/* ================= MAIN CONTENT BODY ================= */}
                <main ref={mainRef} className="flex-1">
                    <PageTransition routeKey={url}>
                        {children}
                    </PageTransition>
                </main>

                {/* ================= COMPREHENSIVE FOOTER ================= */}
                <footer className="bg-[#051c14] text-white pt-14 pb-10 border-t border-emerald-900/60 text-xs mt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
                            {/* Col 1 & 2: Branding & Overview */}
                            <div className="space-y-4 lg:col-span-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl overflow-hidden bg-white p-1 shadow-sm border border-emerald-500/30 shrink-0">
                                        <img
                                            src="/images/logo-mardira.jpg"
                                            alt="Politeknik Mardira Indonesia"
                                            className="h-full w-full object-contain"
                                        />
                                    </div>
                                    <div>
                                        <span className="font-black text-lg tracking-tight text-white block">
                                            MARDIRA<span className="text-[#facc15]">WA</span>
                                        </span>
                                        <span className="text-[10px] text-emerald-300/80 font-bold uppercase tracking-wider block">
                                            Politeknik Mardira Indonesia
                                        </span>
                                    </div>
                                </div>
                                <p className="text-slate-300 text-xs leading-relaxed max-w-sm">
                                    Platform Resmi WhatsApp Gateway & Messaging Engine Terpadu Politeknik Mardira Indonesia. Menghubungkan otomasi layanan akademik, notifikasi transaksi kampus, serta integrasi digital enterprise dengan reliabilitas tinggi.
                                </p>
                                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
                                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Enkripsi TLS 256-Bit</span>
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 font-medium">
                                        <Server className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Dual-Server 99.9% SLA</span>
                                    </span>
                                </div>
                            </div>

                            {/* Col 3: Navigasi Solusi */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-[#facc15] uppercase text-[11px] tracking-wider">Navigasi Solusi</h4>
                                <ul className="space-y-2 text-slate-300">
                                    <li><Link href="/cara-pakai" prefetch className="hover:text-[#facc15] transition-colors">Panduan Integrasi</Link></li>
                                    <li><Link href="/dual-engine" prefetch className="hover:text-[#facc15] transition-colors">Teknologi UltraSync Engine</Link></li>
                                    <li><Link href="/rest-api" prefetch className="hover:text-[#facc15] transition-colors">Dokumentasi REST API</Link></li>
                                    <li><Link href="/harga" prefetch className="hover:text-[#facc15] transition-colors">Pilihan Paket Layanan</Link></li>
                                    <li><Link href="/faq" prefetch className="hover:text-[#facc15] transition-colors">Pusat Bantuan & FAQ</Link></li>
                                </ul>
                            </div>

                            {/* Col 4: Portal Layanan */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-[#facc15] uppercase text-[11px] tracking-wider">Portal Layanan</h4>
                                <ul className="space-y-2 text-slate-300">
                                    <li>
                                        <button
                                            type="button"
                                            onClick={openLoginModal}
                                            className="hover:text-[#facc15] transition-colors text-left"
                                        >
                                            Masuk ke Workspace
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => openRegisterModal()}
                                            className="hover:text-[#facc15] transition-colors text-left"
                                        >
                                            Pendaftaran Akun Baru
                                        </button>
                                    </li>
                                    <li>
                                        <Link href="/forgot-password" className="hover:text-[#facc15] transition-colors">
                                            Lupa Kata Sandi
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/dashboard" className="hover:text-[#facc15] transition-colors">
                                            Dashboard Pengguna
                                        </Link>
                                    </li>
                                    <li>
                                        <Link href="/api-access" className="hover:text-[#facc15] transition-colors">
                                            Kredensial API & Webhook
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {/* Col 5: Kampus & Bantuan */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-[#facc15] uppercase text-[11px] tracking-wider">Kampus & Bantuan</h4>
                                <div className="space-y-2.5 text-slate-300 text-xs">
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <span className="leading-snug">
                                            Panyingkiran, Kec. Panyingkiran, Kabupaten Majalengka, Jawa Barat 45459
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <a href="mailto:info@mardira.ac.id" className="hover:text-[#facc15] transition-colors">
                                            info@mardira.ac.id
                                        </a>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>Hotline: +62 838-6012-467</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] text-emerald-300/80 pt-1">
                                        <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span>Senin – Jumat: 08.00 – 16.00 WIB</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Sub-Footer Bar */}
                        <div className="mt-10 pt-6 border-t border-emerald-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400 text-[11px]">
                            <p>© 2026 Politeknik Mardira Indonesia. Seluruh hak cipta dilindungi undang-undang.</p>
                            <div className="flex items-center gap-4 text-slate-400">
                                <span>Platform Produksi Mandiri PMI</span>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium">Sistem Gateway Aktif</span>
                            </div>
                        </div>
                    </div>
                </footer>

                {/* Global Auth Modal for all public pages */}
                <AuthModal
                    isOpen={isAuthModalOpen}
                    onClose={() => setIsAuthModalOpen(false)}
                    initialMode={authModalMode}
                    initialPlanId={authModalPlanId}
                    plans={safePlans}
                />
            </div>
        </PublicAuthContext.Provider>
    );
}
