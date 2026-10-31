import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Smartphone,
    Send,
    Code2,
    CreditCard,
    Calendar,
    LogOut,
    CheckCircle2,
    Building2,
    Shield,
    Users,
    Receipt,
    Cpu,
    Settings,
    ArrowLeftRight,
    AlertCircle,
    Search,
    ChevronRight,
    Sparkles,
    MessageSquare,
    Bot,
    User,
    Menu,
    X,
    Lightbulb,
    Package,
    ShieldCheck,
} from 'lucide-react';
import Toast from '../Components/ui/toast';
import OnboardingGuideModal from '../Components/OnboardingGuideModal';
import PageTransition from '../Components/PageTransition';
import { Button } from '../Components/ui/button';
import { Badge } from '../Components/ui/badge';
import { Card } from '../Components/ui/card';

export default function AppLayout({ children, title }) {
    const { url, props } = usePage();
    const flash = props.flash || {};
    const auth = props.auth || {};
    const user = auth.user || {};
    const isSuperAdmin = user.role === 'superadmin';
    const isSaaSStaff = Boolean(user.is_saas_staff || ['superadmin', 'admin', 'marketing', 'support'].includes(user.role));
    const isAdminRoute = url.startsWith('/admin');

    const perms = user.permissions || {
        can_manage_staff: isSuperAdmin,
        can_manage_settings: isSuperAdmin,
        can_manage_plans: isSuperAdmin || ['admin', 'marketing'].includes(user.role),
        can_manage_payments: isSuperAdmin || ['admin', 'marketing'].includes(user.role),
        can_manage_gateways: isSuperAdmin || ['admin', 'support'].includes(user.role),
        can_manage_clients: isSuperAdmin || ['admin', 'support'].includes(user.role),
        can_manage_subscriptions: isSuperAdmin || ['admin'].includes(user.role),
    };

    const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
    const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Curated 5-item quick mobile bottom dock
    const clientMobileDockItems = [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, active: url === '/dashboard' || url === '/' },
        { label: 'Gateway', href: '/devices', icon: Smartphone, active: url.startsWith('/devices') },
        { label: 'Broadcast', href: '/broadcast', icon: Send, active: url.startsWith('/broadcast') },
        { label: 'Live Chat', href: '/inbox', icon: MessageSquare, active: url.startsWith('/inbox') },
        { label: 'Kontak', href: '/contacts', icon: Users, active: url.startsWith('/contacts') },
    ];

    const adminMobileDockItems = [
        { label: 'Eksekutif', href: '/admin/dashboard', icon: LayoutDashboard, active: url === '/admin/dashboard' || url === '/admin' },
        { label: 'Klien', href: '/admin/clients', icon: Users, active: url.startsWith('/admin/clients') },
        { label: 'Langganan', href: '/admin/subscriptions', icon: Calendar, active: url.startsWith('/admin/subscriptions') },
        { label: 'Tagihan', href: '/admin/payments', icon: Receipt, active: url.startsWith('/admin/payments') },
        { label: 'Gateways', href: '/admin/gateways', icon: Cpu, active: url.startsWith('/admin/gateways') },
    ];

    // Categorized Client Navigation
    const clientNavGroups = [
        {
            title: 'IKHTISAR UTAMA',
            items: [
                { label: 'Dashboard Operasional', href: '/dashboard', icon: LayoutDashboard, active: url === '/dashboard' || url === '/', badge: 'Live' },
            ],
        },
        {
            title: 'KOMUNIKASI & OPERASIONAL',
            items: [
                { label: 'Manajemen Gateway', href: '/devices', icon: Smartphone, active: url.startsWith('/devices') },
                { label: 'Kampanye Broadcast', href: '/broadcast', icon: Send, active: url.startsWith('/broadcast') },
                { label: 'Live Chat & Inbox', href: '/inbox', icon: MessageSquare, active: url.startsWith('/inbox') },
                { label: 'Database Kontak CRM', href: '/contacts', icon: Users, active: url.startsWith('/contacts') },
                { label: 'Otomasi & Asisten AI', href: '/auto-reply', icon: Sparkles, active: url.startsWith('/auto-reply'), badge: 'AI' },
            ],
        },
        {
            title: 'INTEGRASI & DEVELOPER',
            items: [
                { label: 'Kredensial API & Webhook', href: '/api-access', icon: Code2, active: url.startsWith('/api-access') },
            ],
        },
        {
            title: 'LANGGANAN & PENGATURAN',
            items: [
                { label: 'Paket & Kuota Layanan', href: '/subscriptions', icon: CreditCard, active: url.startsWith('/subscriptions'), badge: 'Pro' },
                { label: 'Keamanan & Akun', href: '/profile', icon: User, active: url.startsWith('/profile') },
            ],
        },
    ];

    // Categorized Super Admin & SaaS Staff Navigation
    const rawAdminNavGroups = [
        {
            title: 'SISTEM UTAMA',
            items: [
                { label: 'Ikhtisar Eksekutif', href: '/admin/dashboard', icon: LayoutDashboard, active: url === '/admin/dashboard' || url === '/admin', badge: 'SaaS', show: true },
            ],
        },
        {
            title: 'MANAJEMEN SAAS',
            items: [
                { label: 'Klien & Workspace', href: '/admin/clients', icon: Users, active: url.startsWith('/admin/clients'), show: perms.can_manage_clients },
                { label: 'Langganan & Durasi', href: '/admin/subscriptions', icon: Calendar, active: url.startsWith('/admin/subscriptions'), show: perms.can_manage_subscriptions || isSuperAdmin },
                { label: 'Pembayaran & Invoice', href: '/admin/payments', icon: Receipt, active: url.startsWith('/admin/payments'), badge: 'Verifikasi', show: perms.can_manage_payments },
                { label: 'Kelola Paket (Plans)', href: '/admin/plans', icon: Package, active: url.startsWith('/admin/plans'), badge: 'Katalog', show: perms.can_manage_plans },
            ],
        },
        {
            title: 'TIM & AKSES SAAS',
            items: [
                { label: 'Tim & Akses RBAC', href: '/admin/staff', icon: ShieldCheck, active: url.startsWith('/admin/staff'), badge: 'Staff', show: perms.can_manage_staff },
            ],
        },
        {
            title: 'INFRASTRUKTUR GATEWAY',
            items: [
                { label: 'Node Microservices', href: '/admin/gateways', icon: Cpu, active: url.startsWith('/admin/gateways'), badge: 'Online', show: perms.can_manage_gateways },
                { label: 'Pengaturan Produksi', href: '/admin/settings', icon: Settings, active: url.startsWith('/admin/settings'), show: perms.can_manage_settings },
            ],
        },
    ];

    const adminNavGroups = rawAdminNavGroups.map((group) => ({
        ...group,
        items: group.items.filter((item) => item.show !== false),
    })).filter((group) => group.items.length > 0);

    const currentNavGroups = isAdminRoute ? adminNavGroups : clientNavGroups;

    // Determine Breadcrumb
    const getBreadcrumb = () => {
        if (isAdminRoute) {
            if (url.includes('/clients')) return { category: 'Super Admin', page: 'Klien & Workspace' };
            if (url.includes('/subscriptions')) return { category: 'Super Admin', page: 'Langganan & Durasi Fleksibel' };
            if (url.includes('/payments')) return { category: 'Super Admin', page: 'Pembayaran & Invoice' };
            if (url.includes('/plans')) return { category: 'Super Admin', page: 'Kelola Paket Layanan (Plans)' };
            if (url.includes('/staff')) return { category: 'Super Admin', page: 'Manajemen Tim & RBAC' };
            if (url.includes('/gateways')) return { category: 'Super Admin', page: 'Monitoring WhatsApp Gateways' };
            if (url.includes('/settings')) return { category: 'Super Admin', page: 'Pengaturan Produksi' };
            return { category: 'Super Admin', page: 'Ikhtisar Eksekutif SaaS' };
        } else {
            if (url.startsWith('/devices')) return { category: 'Operasional', page: 'Manajemen Gateway' };
            if (url.startsWith('/broadcast')) return { category: 'Komunikasi', page: 'Kampanye Broadcast' };
            if (url.startsWith('/inbox')) return { category: 'Komunikasi', page: 'Live Chat & Inbox' };
            if (url.startsWith('/contacts')) return { category: 'Database', page: 'Database Kontak CRM' };
            if (url.startsWith('/auto-reply')) return { category: 'Otomasi', page: 'Otomasi & Asisten AI' };
            if (url.startsWith('/api-access')) return { category: 'Developer', page: 'Kredensial API & Webhook' };
            if (url.startsWith('/subscriptions')) return { category: 'Billing', page: 'Paket & Kuota Layanan' };
            if (url.startsWith('/profile')) return { category: 'Akun', page: 'Keamanan & Akun' };
            return { category: 'Workspace', page: 'Dashboard Operasional' };
        }
    };

    const breadcrumb = getBreadcrumb();

    useEffect(() => {
        if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
        }
    }, [url]);

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans antialiased selection:bg-blue-100 selection:text-[#1e50ff]">
            {/* ================= 1. REFINED LUXURY DARK NAVY SIDEBAR ================= */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-50 bg-[#08112c] text-white border-r border-blue-950/80 shadow-xl transition-all">
                {/* Brand Header */}
                <div className="h-16 px-5 flex items-center justify-between border-b border-blue-950/80 bg-[#050b1e]">
                    <Link href={isAdminRoute ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-3 group">
                        <img
                            src="/images/logo.png"
                            alt="Politeknik Mardira Indonesia"
                            className="h-9 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
                        />
                        <div className="overflow-hidden">
                            <div className="flex items-center gap-1">
                                <span className="font-extrabold text-sm tracking-tight text-white">
                                    MARDIRA<span className="text-[#1e50ff]">WA</span>
                                </span>
                            </div>
                            <div className="text-[10px] font-medium text-blue-200/70 truncate max-w-[130px]" title={user.workspace_name || user.name}>
                                {isAdminRoute ? (isSuperAdmin ? 'Superadmin Platform' : `Panel Staff (${(user.role || 'Staff').toUpperCase()})`) : (user.workspace_name || user.name || 'Tenant Workspace')}
                            </div>
                        </div>
                    </Link>

                    {isAdminRoute ? (
                        <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" title="Superadmin Mode" />
                    ) : (
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" title="Sistem Aktif" />
                    )}
                </div>

                {/* Navigation Sections with no-scrollbar */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-3 space-y-4">
                    {currentNavGroups.map((group, idx) => (
                        <div key={idx} className="space-y-1">
                            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-blue-300/60">
                                {group.title}
                            </div>
                            <nav className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                                                item.active
                                                    ? 'bg-[#1e50ff] text-white font-semibold shadow-xs border border-blue-400/40'
                                                    : 'text-slate-300 hover:bg-white/10 hover:text-white font-medium'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className={`w-4 h-4 transition-colors ${item.active ? 'text-white' : 'text-blue-300/70 group-hover:text-blue-100'}`} />
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                            {item.badge && (
                                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                                    item.active
                                                        ? 'bg-white/20 text-white border border-white/30 font-semibold'
                                                        : 'bg-[#050b1e] text-blue-300 border border-blue-900/60'
                                                }`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* Bottom User Profile Section */}
                <div className="p-3 border-t border-blue-950/80 bg-[#050b1e] space-y-2">
                    <button
                        type="button"
                        onClick={() => setIsGuideModalOpen(true)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-200 hover:text-white hover:bg-blue-900/60 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                            <span>Panduan Fitur</span>
                        </div>
                        <span className="bg-blue-900/80 text-blue-300 border border-blue-700/50 text-[9px] py-0.5 px-2 font-mono font-medium rounded-md">
                            PANDUAN
                        </span>
                    </button>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#08112c] border border-blue-950/80">
                        <Link href="/profile" className="flex items-center gap-2.5 overflow-hidden hover:opacity-90 transition-opacity flex-1 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-[#1e50ff]/20 text-[#60a5fa] border border-[#1e50ff]/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                {user.name ? user.name.slice(0, 2).toUpperCase() : 'WA'}
                            </div>
                            <div className="overflow-hidden text-left">
                                <div className="text-xs font-semibold text-white truncate">
                                    {user.name || 'Tamu'}
                                </div>
                                <div className="text-[10px] text-blue-300/70 truncate">
                                    {user.email || 'Belum Masuk'}
                                </div>
                            </div>
                        </Link>

                        {user.id ? (
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-blue-300/80 hover:text-rose-300 hover:bg-rose-500/20 transition-colors ml-1 cursor-pointer"
                                title="Keluar"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="h-7 px-2.5 rounded-lg flex items-center justify-center text-xs font-semibold text-blue-300 hover:bg-white/10 transition-colors ml-1"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </aside>

            {/* ================= 2. MAIN CONTENT AREA & TOPBAR ================= */}
            <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
                {/* TOP HEADER BAR */}
                <header className="sticky top-0 z-40 h-14 sm:h-16 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
                    {/* Left: Mobile Brand & Menu Button */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setIsMobileDrawerOpen(true)}
                            className="lg:hidden h-9 w-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-700 hover:text-[#1e50ff] hover:border-[#1e50ff] shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                            aria-label="Buka Menu Navigasi"
                        >
                            <Menu className="w-4 h-4" />
                        </button>

                        <Link href="/" className="lg:hidden flex items-center gap-2 shrink-0">
                            <img
                                src="/images/logo.png"
                                alt="Politeknik Mardira Indonesia"
                                className="h-7 w-auto object-contain shrink-0"
                            />
                            <span className="font-black text-xs tracking-tight text-slate-900 block leading-none">
                                MARDIRA<span className="text-[#1e50ff]">WA</span>
                            </span>
                        </Link>

                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
                            <span className="text-slate-400">{breadcrumb.category}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span className="text-slate-900 font-semibold truncate">{breadcrumb.page}</span>
                        </div>
                    </div>

                    {/* Center: Search Command Bar */}
                    <div className="hidden md:flex items-center relative w-64 lg:w-72">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                            type="text"
                            placeholder="Cari fitur, kontak... (Ctrl+K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-8 pl-8 pr-10 text-xs rounded-lg border border-slate-200 bg-slate-50/60 placeholder:text-slate-400 focus:bg-white focus:border-[#1e50ff] focus:outline-none transition-all shadow-2xs"
                        />
                        <kbd className="pointer-events-none absolute right-2 top-1.5 hidden h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:flex">
                            ⌘K
                        </kbd>
                    </div>

                    {/* Right: Mode Switcher & Status */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        {/* SLA Indicator */}
                        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-200/80 bg-blue-50/60 text-[11px] font-medium text-[#1e50ff]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1e50ff] animate-pulse" />
                            <span>Uptime <strong>99.9%</strong></span>
                        </div>

                        {/* Mode Switcher Segmented Control */}
                        {isSaaSStaff && (
                            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold">
                                <Link
                                    href="/dashboard"
                                    className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs ${
                                        !isAdminRoute
                                            ? 'bg-white text-[#1e50ff] font-bold shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    Workspace
                                </Link>
                                <Link
                                    href="/admin/dashboard"
                                    className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs ${
                                        isAdminRoute
                                            ? 'bg-[#1e50ff] text-white font-bold shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {isSuperAdmin ? 'Super Admin' : 'Panel SaaS'}
                                </Link>
                            </div>
                        )}

                        {/* Top Context Action Button */}
                        {isAdminRoute ? (
                            <Link href="/admin/payments">
                                <Button variant="outline" size="sm" className="h-8 text-xs font-semibold border-slate-200 text-[#1e50ff] hover:border-[#1e50ff] hover:bg-blue-50/50 rounded-lg">
                                    <Receipt className="w-3.5 h-3.5 mr-1 text-[#1e50ff]" />
                                    <span className="hidden sm:inline">Verifikasi Tagihan</span>
                                    <span className="sm:hidden">Invoice</span>
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/broadcast">
                                <Button variant="default" size="sm" className="bg-[#1e50ff] hover:bg-[#153ec7] text-white h-8 text-xs font-bold shadow-md shadow-blue-500/20 rounded-lg">
                                    <Send className="w-3.5 h-3.5 mr-1.5 text-white" />
                                    <span className="hidden sm:inline">Broadcast Baru</span>
                                    <span className="sm:hidden">Broadcast</span>
                                </Button>
                            </Link>
                        )}
                    </div>
                </header>

                {/* MAIN PAGE BODY */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 pb-24 lg:pb-8">
                    {/* Flash Success Notification */}
                    {flash.success && (
                        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/70 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-2xs animate-fade-in-up">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                                <span>{flash.success}</span>
                            </div>
                        </div>
                    )}

                    {/* Flash Error Notification */}
                    {flash.error && (
                        <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-xs font-medium flex items-center justify-between shadow-2xs animate-fade-in-up">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                                <span>{flash.error}</span>
                            </div>
                        </div>
                    )}

                    {/* Floating Toast Notification */}
                    <Toast />

                    <PageTransition routeKey={url} className="space-y-6">
                        {children}
                    </PageTransition>
                </main>
            </div>

            {/* MOBILE SLIDE-OVER DRAWER */}
            {isMobileDrawerOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-950/65 backdrop-blur-md transition-opacity"
                        onClick={() => setIsMobileDrawerOpen(false)}
                    />

                    {/* Drawer Panel */}
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#08112c] text-white border-r border-blue-950/80 z-10 shadow-2xl">
                        {/* Drawer Header */}
                        <div className="h-16 px-5 flex items-center justify-between border-b border-blue-950/80 bg-[#050b1e]">
                            <div className="flex items-center gap-2.5">
                                <img
                                    src="/images/logo.png"
                                    alt="Politeknik Mardira Indonesia"
                                    className="h-8 w-auto object-contain shrink-0"
                                />
                                <div>
                                    <span className="font-extrabold text-sm tracking-tight text-white">
                                        MARDIRA<span className="text-[#1e50ff]">WA</span>
                                    </span>
                                    <p className="text-[10px] text-blue-200/70">
                                        {isAdminRoute ? 'Super Admin' : 'Tenant Workspace'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileDrawerOpen(false)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-blue-300 hover:text-white hover:bg-white/10 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Drawer Navigation List */}
                        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                            {currentNavGroups.map((group, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-blue-300/60">
                                        {group.title}
                                    </div>
                                    <nav className="space-y-0.5">
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={() => setIsMobileDrawerOpen(false)}
                                                    className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                                                        item.active
                                                            ? 'bg-[#1e50ff] text-white font-semibold shadow-xs border border-blue-400/40'
                                                            : 'text-slate-300 hover:bg-white/10 hover:text-white font-medium'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-blue-300/70'}`} />
                                                        <span>{item.label}</span>
                                                    </div>
                                                    {item.badge && (
                                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                                            item.active
                                                                ? 'bg-white/20 text-white border border-white/30 font-semibold'
                                                                : 'bg-[#050b1e] text-blue-300 border border-blue-900/60'
                                                        }`}>
                                                            {item.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </nav>
                                </div>
                            ))}

                            {/* Tutorial Guide Launch in Mobile Drawer */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsMobileDrawerOpen(false);
                                    setIsGuideModalOpen(true);
                                }}
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-200 hover:text-white hover:bg-blue-900/60 text-xs font-semibold shadow-xs cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-400" />
                                    <span>Buka Panduan Fitur</span>
                                </div>
                                <span className="bg-blue-900/80 text-blue-300 border border-blue-700/50 text-[9px] py-0.5 px-2 font-mono rounded-md">GUIDE</span>
                            </button>
                        </div>

                        {/* Drawer Bottom Profile */}
                        <div className="p-3 border-t border-blue-950/80 bg-[#050b1e]">
                            <div className="flex items-center justify-between">
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="flex items-center gap-2 min-w-0"
                                >
                                    <div className="h-7 w-7 rounded-lg bg-[#1e50ff]/20 text-[#60a5fa] border border-[#1e50ff]/30 flex items-center justify-center font-bold text-xs shrink-0">
                                        {user.name ? user.name.slice(0, 2).toUpperCase() : 'WA'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="truncate text-xs font-semibold text-white">
                                            {user.name || 'Tamu'}
                                        </div>
                                        <div className="truncate text-[10px] text-blue-300/70">
                                            {user.workspace_name || user.email || 'Belum Masuk'}
                                        </div>
                                    </div>
                                </Link>

                                {user.id ? (
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="text-xs text-rose-400 font-semibold hover:text-rose-300"
                                    >
                                        Keluar
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="text-xs text-blue-300 font-semibold hover:underline"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CURATED MOBILE FLOATING DOCK */}
            <nav className="lg:hidden fixed bottom-2.5 inset-x-3 bg-white/95 backdrop-blur-md border border-slate-200/90 px-2 py-1.5 rounded-2xl flex items-center justify-around z-30 shadow-xl shadow-slate-900/10">
                {(isAdminRoute ? adminMobileDockItems : clientMobileDockItems).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 text-[10px] transition-all py-1.5 px-3 rounded-xl min-h-[44px] justify-center ${
                                item.active
                                    ? 'font-bold text-white bg-[#1e50ff] shadow-md shadow-blue-500/25'
                                    : 'font-medium text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${item.active ? 'text-white' : ''}`} />
                            <span className="leading-none">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* ONBOARDING QUICK GUIDE MODAL */}
            <OnboardingGuideModal
                isOpen={isGuideModalOpen}
                onClose={() => setIsGuideModalOpen(false)}
            />
        </div>
    );
}
