import React, { useState } from 'react';
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
    const isAdminRoute = url.startsWith('/admin');

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

    // Categorized Super Admin Navigation (shadcnuikit e-commerce style)
    const adminNavGroups = [
        {
            title: 'SISTEM UTAMA',
            items: [
                { label: 'Ikhtisar Eksekutif', href: '/admin/dashboard', icon: LayoutDashboard, active: url === '/admin/dashboard' || url === '/admin', badge: 'SaaS' },
            ],
        },
        {
            title: 'MANAJEMEN SAAS',
            items: [
                { label: 'Klien & Workspace', href: '/admin/clients', icon: Users, active: url.startsWith('/admin/clients') },
                { label: 'Langganan & Durasi', href: '/admin/subscriptions', icon: Calendar, active: url.startsWith('/admin/subscriptions') },
                { label: 'Pembayaran & Invoice', href: '/admin/payments', icon: Receipt, active: url.startsWith('/admin/payments'), badge: 'Verifikasi' },
            ],
        },
        {
            title: 'INFRASTRUKTUR GATEWAY',
            items: [
                { label: 'Node Microservices', href: '/admin/gateways', icon: Cpu, active: url.startsWith('/admin/gateways'), badge: 'Online' },
                { label: 'Pengaturan Produksi', href: '/admin/settings', icon: Settings, active: url.startsWith('/admin/settings') },
            ],
        },
    ];

    const currentNavGroups = isAdminRoute ? adminNavGroups : clientNavGroups;

    // Determine Breadcrumb
    const getBreadcrumb = () => {
        if (isAdminRoute) {
            if (url.includes('/clients')) return { category: 'Super Admin', page: 'Klien & Workspace' };
            if (url.includes('/subscriptions')) return { category: 'Super Admin', page: 'Langganan & Durasi Fleksibel' };
            if (url.includes('/payments')) return { category: 'Super Admin', page: 'Pembayaran & Invoice' };
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

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900">
            {/* ================= 1. REFINED LUXURY GREEN LEFT SIDEBAR (Professional Branded Console) ================= */}
            <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-50 bg-[#062c21] text-white border-r border-[#083b2d] shadow-xl transition-all">
                {/* Brand Header */}
                <div className="h-16 px-5 flex items-center justify-between border-b border-[#083b2d] bg-[#042018]">
                    <Link href={isAdminRoute ? '/admin/dashboard' : '/dashboard'} className="flex items-center gap-3 group">
                        <div className="h-9 w-9 rounded-xl overflow-hidden bg-white border border-emerald-700/50 shadow-xs flex items-center justify-center p-0.5 transition-transform duration-200 group-hover:scale-105">
                            <img
                                src="/images/logo-mardira.jpg"
                                alt="Politeknik Mardira Indonesia"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <div className="overflow-hidden">
                            <div className="flex items-center gap-1">
                                <span className="font-extrabold text-sm tracking-tight text-white">
                                    MARDIRA<span className="text-emerald-400">WA</span>
                                </span>
                            </div>
                            <div className="text-[10px] font-medium text-emerald-200/70 truncate max-w-[130px]" title={user.workspace_name || user.name}>
                                {isAdminRoute ? 'Superadmin Platform' : (user.workspace_name || user.name || 'Tenant Workspace')}
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
                            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-300/60">
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
                                                    ? 'bg-emerald-600 text-white font-semibold shadow-xs border border-emerald-500/40'
                                                    : 'text-emerald-100/80 hover:bg-white/10 hover:text-white font-medium'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className={`w-4 h-4 transition-colors ${item.active ? 'text-white' : 'text-emerald-300/70 group-hover:text-emerald-100'}`} />
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                            {item.badge && (
                                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                                    item.active
                                                        ? 'bg-emerald-700/90 text-white border border-emerald-400/40 font-semibold'
                                                        : 'bg-[#042018]/80 text-emerald-300 border border-emerald-800/60'
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
                <div className="p-3 border-t border-[#083b2d] bg-[#042018] space-y-2">
                    <button
                        type="button"
                        onClick={() => setIsGuideModalOpen(true)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-100 hover:text-white hover:bg-emerald-900/60 text-xs font-semibold transition-all shadow-xs cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-emerald-400" />
                            <span>Panduan Fitur</span>
                        </div>
                        <span className="bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 text-[9px] py-0.5 px-2 font-mono font-medium rounded-md">
                            PANDUAN
                        </span>
                    </button>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-[#062c21]/70 border border-emerald-800/60">
                        <Link href="/profile" className="flex items-center gap-2.5 overflow-hidden hover:opacity-90 transition-opacity flex-1 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                {user.name ? user.name.slice(0, 2).toUpperCase() : 'WA'}
                            </div>
                            <div className="overflow-hidden text-left">
                                <div className="text-xs font-semibold text-emerald-50 truncate">
                                    {user.name || 'Tamu'}
                                </div>
                                <div className="text-[10px] text-emerald-300/70 truncate">
                                    {user.email || 'Belum Masuk'}
                                </div>
                            </div>
                        </Link>

                        {user.id ? (
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-emerald-400/80 hover:text-rose-300 hover:bg-rose-500/20 transition-colors ml-1 cursor-pointer"
                                title="Keluar"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                            </Link>
                        ) : (
                            <Link
                                href="/login"
                                className="h-7 px-2.5 rounded-lg flex items-center justify-center text-xs font-semibold text-emerald-300 hover:bg-white/10 transition-colors ml-1"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </aside>

            {/* ================= 2. MAIN CONTENT AREA & TOPBAR ================= */}
            <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
                {/* TOP HEADER BAR (shadcnuikit style) */}
                <header className="sticky top-0 z-40 h-14 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    {/* Left: Mobile Menu Button & Breadcrumbs */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setIsMobileDrawerOpen(true)}
                            className="lg:hidden h-8 w-8 rounded-md border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs"
                            aria-label="Buka Menu Navigasi"
                        >
                            <Menu className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                            <span className="text-slate-400 hidden sm:inline">{breadcrumb.category}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0 hidden sm:inline" />
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
                            className="w-full h-8 pl-8 pr-10 text-xs rounded-md border border-slate-200 bg-slate-50/60 placeholder:text-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none transition-all shadow-2xs"
                        />
                        <kbd className="pointer-events-none absolute right-2 top-1.5 hidden h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:flex">
                            ⌘K
                        </kbd>
                    </div>

                    {/* Right: Mode Switcher & Status */}
                    <div className="flex items-center gap-2.5">
                        {/* SLA Indicator */}
                        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-200/80 bg-emerald-50/60 text-[11px] font-medium text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Uptime <strong>99.9%</strong></span>
                        </div>

                        {/* Elegant Mode Switcher Segmented Control */}
                        {isSuperAdmin && (
                            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold">
                                <Link
                                    href="/dashboard"
                                    className={`px-2.5 py-1 rounded-md transition-all ${
                                        !isAdminRoute
                                            ? 'bg-white text-emerald-800 shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    Workspace
                                </Link>
                                <Link
                                    href="/admin/dashboard"
                                    className={`px-2.5 py-1 rounded-md transition-all ${
                                        isAdminRoute
                                            ? 'bg-emerald-600 text-white shadow-2xs'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    Super Admin
                                </Link>
                            </div>
                        )}

                        {/* Top Context Action Button */}
                        {isAdminRoute ? (
                            <Link href="/admin/payments">
                                <Button variant="outline" size="sm" className="h-8 text-xs font-medium border-slate-200 text-emerald-700 hover:border-emerald-600">
                                    <Receipt className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                    <span className="hidden sm:inline">Verifikasi Tagihan</span>
                                    <span className="sm:hidden">Invoice</span>
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/broadcast">
                                <Button variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-medium shadow-xs">
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
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#062c21] text-white border-r border-[#083b2d] z-10 shadow-2xl">
                        {/* Drawer Header */}
                        <div className="h-16 px-5 flex items-center justify-between border-b border-[#083b2d] bg-[#042018]">
                            <div className="flex items-center gap-2.5">
                                <img
                                    src="/images/logo-mardira.jpg"
                                    alt="Logo"
                                    className="h-8 w-8 object-contain rounded-lg border border-emerald-700/50 p-0.5 bg-white"
                                />
                                <div>
                                    <span className="font-extrabold text-sm tracking-tight text-white">
                                        MARDIRA<span className="text-emerald-400">WA</span>
                                    </span>
                                    <p className="text-[10px] text-emerald-200/70">
                                        {isAdminRoute ? 'Super Admin' : 'Tenant Workspace'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileDrawerOpen(false)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-emerald-300 hover:text-white hover:bg-white/10 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Drawer Navigation List */}
                        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                            {currentNavGroups.map((group, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-300/60">
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
                                                    className={`group w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                                                        item.active
                                                            ? 'bg-emerald-600 text-white font-semibold shadow-xs border border-emerald-500/40'
                                                            : 'text-emerald-100/80 hover:bg-white/10 hover:text-white font-medium'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Icon className={`w-4 h-4 ${item.active ? 'text-white' : 'text-emerald-300/70'}`} />
                                                        <span>{item.label}</span>
                                                    </div>
                                                    {item.badge && (
                                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                                                            item.active
                                                                ? 'bg-emerald-700/90 text-white border border-emerald-400/40 font-semibold'
                                                                : 'bg-[#042018]/80 text-emerald-300 border border-emerald-800/60'
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
                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-100 hover:text-white hover:bg-emerald-900/60 text-xs font-semibold shadow-xs cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-emerald-400" />
                                    <span>Buka Panduan Fitur</span>
                                </div>
                                <span className="bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 text-[9px] py-0.5 px-2 font-mono rounded-md">GUIDE</span>
                            </button>
                        </div>

                        {/* Drawer Bottom Profile */}
                        <div className="p-3 border-t border-[#083b2d] bg-[#042018]">
                            <div className="flex items-center justify-between">
                                <Link
                                    href="/profile"
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="flex items-center gap-2 min-w-0"
                                >
                                    <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                                        {user.name ? user.name.slice(0, 2).toUpperCase() : 'WA'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="truncate text-xs font-semibold text-emerald-50">
                                            {user.name || 'Tamu'}
                                        </div>
                                        <div className="truncate text-[10px] text-emerald-300/70">
                                            {user.workspace_name || user.email || 'Belum Masuk'}
                                        </div>
                                    </div>
                                </Link>

                                {user.id ? (
                                    <Link
                                        href="/logout"
                                        method="post"
                                        as="button"
                                        className="text-xs text-emerald-400 font-semibold hover:text-rose-400"
                                    >
                                        Keluar
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="text-xs text-emerald-300 font-semibold hover:underline"
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
            <nav className="lg:hidden fixed bottom-3 inset-x-3 bg-white/95 backdrop-blur-md border border-slate-200/90 px-2 py-1.5 rounded-2xl flex items-center justify-around z-30 shadow-xl">
                {(isAdminRoute ? adminMobileDockItems : clientMobileDockItems).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center gap-1 text-[10px] transition-all py-1 px-2.5 rounded-xl ${
                                item.active
                                    ? 'font-bold text-white bg-emerald-600 shadow-xs'
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
