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

    // Ensure page always starts at top on every navigation
    useEffect(() => {
        if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
        }
    }, [url]);

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
        { label: 'Panduan', href: '/cara-pakai', key: 'cara-pakai', match: (u) => u.startsWith('/cara-pakai') },
        { label: 'Teknologi', href: '/dual-engine', key: 'dual-engine', match: (u) => u.startsWith('/dual-engine') },
        { label: 'API', href: '/rest-api', key: 'rest-api', match: (u) => u.startsWith('/rest-api') },
        { label: 'Harga', href: '/harga', key: 'harga', match: (u) => u.startsWith('/harga') || u.startsWith('/paket-harga') },
        { label: 'FAQ', href: '/faq', key: 'faq', match: (u) => u.startsWith('/faq') },
    ];

    return (
        <PublicAuthContext.Provider value={{ openRegisterModal, openLoginModal }}>
            <div className="min-h-screen bg-white text-[#0f172a] font-sans antialiased selection:bg-blue-100 selection:text-[#1e50ff] flex flex-col justify-between">
                <Head title={title ? `${title} — MARDIRA WA` : 'MARDIRA WA — Portal Enterprise WhatsApp Gateway & Broadcast API'} />

                {/* ================= TOP NAVBAR ================= */}
                <header className="fixed inset-x-0 top-0 z-50 transition-all duration-300 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
                    <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 py-3 flex-nowrap gap-4">
                        {/* Brand Logo (Naked / Telanjang) */}
                        <Link href="/" prefetch className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
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
                                <span className="hidden sm:block text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-0.5 whitespace-nowrap">
                                    POLITEKNIK MARDIRA INDONESIA
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation Links (Single Line, Never Wraps) */}
                        <div className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0">
                            {navLinks.map((item) => {
                                const isActive = activeMenu === item.key || item.match(url);
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch
                                        className={`rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                                            isActive
                                                ? 'bg-blue-50 border border-blue-200 text-[#1e50ff] font-bold shadow-2xs'
                                                : 'text-slate-600 hover:text-[#1e50ff] hover:bg-slate-100/70'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Desktop Right Action Buttons */}
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
                                        onClick={openLoginModal}
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

                        {/* Mobile Actions & Toggle */}
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
                                    onClick={openLoginModal}
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

                    {/* Mobile Dropdown Menu Sheet */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-xl px-4 py-4 space-y-3 animate-fade-in-up">
                            <div className="space-y-1">
                                {navLinks.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        prefetch
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-[#1e50ff] hover:bg-blue-50/60 transition-colors"
                                    >
                                        <span>{item.label}</span>
                                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                                    </Link>
                                ))}
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                                {user ? (
                                    <Link
                                        href="/dashboard"
                                        prefetch
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] text-xs font-extrabold uppercase tracking-wider text-white shadow-xs"
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
                                            className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#1e50ff] hover:bg-[#153ec7] text-xs font-extrabold uppercase tracking-wider text-white shadow-xs cursor-pointer"
                                        >
                                            <Zap className="w-3.5 h-3.5 fill-white" />
                                            <span>Mulai Sekarang</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                openLoginModal();
                                            }}
                                            className="w-full inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-800 cursor-pointer"
                                        >
                                            <LogIn className="w-3.5 h-3.5 text-[#1e50ff]" />
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
                <footer className="bg-[#08112c] text-white pt-14 pb-10 border-t border-blue-950/80 text-xs mt-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-10">
                            {/* Col 1 & 2: Branding & Overview */}
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
                                        <span>Dual-Server 99.9% SLA</span>
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

                            {/* Col 4: Portal Layanan */}
                            <div className="space-y-3">
                                <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Portal Layanan</h4>
                                <ul className="space-y-2 text-slate-300">
                                    <li>
                                        <button
                                            type="button"
                                            onClick={openLoginModal}
                                            className="hover:text-[#1e50ff] transition-colors text-left"
                                        >
                                            Masuk ke Workspace
                                        </button>
                                    </li>
                                    <li>
                                        <button
                                            type="button"
                                            onClick={() => openRegisterModal()}
                                            className="hover:text-[#1e50ff] transition-colors text-left"
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
