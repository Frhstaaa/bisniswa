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
    ChevronLeft,
    Sparkles,
    MessageSquare,
    Bot,
    User,
    Menu,
    X,
    Lightbulb,
    Package,
    ShieldCheck,
    PanelLeftClose,
    PanelLeft,
} from 'lucide-react';
import Toast from '../Components/ui/toast';
import { Alert, AlertTitle, AlertDescription } from '../Components/ui/alert';
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
    const isSaaSStaff = Boolean(user.is_saas_staff || auth.admin || ['superadmin', 'admin', 'marketing', 'support'].includes(user.role));
    const isAdminRoute = url.startsWith('/admin');
    const logoutHref = isAdminRoute ? '/admin/logout' : '/logout';

    const perms = user.permissions || {
        can_manage_staff: isSuperAdmin || user.role === 'admin',
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
    const [dismissedFlash, setDismissedFlash] = useState(false);

    // Persisted Desktop Sidebar Collapsed State (Mantis style mini-drawer)
    const [isCollapsed, setIsCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('sidebar_collapsed') === 'true';
        }
        return false;
    });

    const toggleSidebar = () => {
        setIsCollapsed((prev) => {
            const next = !prev;
            if (typeof window !== 'undefined') {
                localStorage.setItem('sidebar_collapsed', String(next));
            }
            return next;
        });
    };

    useEffect(() => {
        setDismissedFlash(false);
    }, [flash]);

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

    // Categorized Client Navigation (Tidy Mantis Groups)
    const clientNavGroups = [
        {
            title: 'IKHTISAR UTAMA',
            items: [
                { label: 'Dashboard Operasional', href: '/dashboard', icon: LayoutDashboard, active: url === '/dashboard' || url === '/', badge: 'Live' },
            ],
        },
        {
            title: 'KOMUNIKASI & PESAN',
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

    // Categorized Super Admin & SaaS Staff Navigation (Tidy Mantis Groups)
    const rawAdminNavGroups = [
        {
            title: 'DASHBOARD & STATISTIK',
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
            title: 'TIM & OTORISASI',
            items: [
                { label: 'Tim & Akses RBAC', href: '/admin/staff', icon: ShieldCheck, active: url.startsWith('/admin/staff'), badge: 'Staff', show: perms.can_manage_staff },
            ],
        },
        {
            title: 'INFRASTRUKTUR SISTEM',
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
        <div className="min-h-screen bg-[#fafafb] text-slate-800 flex font-sans antialiased selection:bg-[#e6f4ff] selection:text-[#1677ff]">
            {/* ================= 1. REFINED MANTIS DASHBOARD SIDEBAR ================= */}
            <aside
                className={`hidden lg:flex flex-col fixed inset-y-0 left-0 z-50 bg-white text-slate-700 border-r border-[#e6ebf1] shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out ${
                    isCollapsed ? 'w-[72px]' : 'w-64'
                }`}
            >
                {/* Brand Header */}
                <div className={`h-16 border-b border-[#e6ebf1] bg-white flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
                    <Link
                        href={isAdminRoute ? '/admin/dashboard' : '/dashboard'}
                        prefetch
                        className="flex items-center gap-3 overflow-hidden group"
                        title="MARDIRA WA"
                    >
                        <img
                            src="/images/logo.png"
                            alt="Politeknik Mardira Indonesia"
                            className="h-8 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
                        />
                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-black text-sm tracking-tight text-slate-900">
                                        MARDIRA<span className="text-[#1677ff]">WA</span>
                                    </span>
                                    {isAdminRoute ? (
                                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]/40">
                                            {isSuperAdmin ? 'SUPER' : 'STAFF'}
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200/50">
                                            SAAS
                                        </span>
                                    )}
                                </div>
                                <div className="text-[10px] font-medium text-slate-400 truncate max-w-[125px]" title={user.workspace_name || user.name}>
                                    {isAdminRoute ? 'Admin Control Center' : (user.workspace_name || user.name || 'Tenant Workspace')}
                                </div>
                            </div>
                        )}
                    </Link>

                    {!isCollapsed && (
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="h-7 w-7 rounded-lg border border-[#e6ebf1] bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-[#1677ff] transition-colors cursor-pointer shrink-0"
                            title="Perkecil Sidebar"
                            aria-label="Perkecil Sidebar"
                        >
                            <PanelLeftClose className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Navigation Sections */}
                <div className={`flex-1 overflow-y-auto no-scrollbar py-3 space-y-3.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
                    {currentNavGroups.map((group, idx) => (
                        <div key={idx} className="space-y-1">
                            {!isCollapsed ? (
                                <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#8c8c8c]">
                                    {group.title}
                                </div>
                            ) : (
                                idx > 0 && <div className="h-px bg-[#e6ebf1] my-2 mx-1.5" />
                            )}

                            <nav className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            prefetch
                                            title={isCollapsed ? item.label : undefined}
                                            className={`group w-full flex items-center rounded-lg text-xs transition-all relative ${
                                                isCollapsed
                                                    ? `justify-center p-2.5 ${
                                                          item.active
                                                              ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold border-r-2 border-[#1677ff]'
                                                              : 'text-[#595959] hover:bg-slate-50 hover:text-[#1677ff]'
                                                      }`
                                                    : `justify-between px-3 py-2 ${
                                                          item.active
                                                              ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold border-r-2 border-[#1677ff]'
                                                              : 'text-[#595959] hover:bg-slate-50 hover:text-[#1677ff] font-medium'
                                                      }`
                                            }`}
                                        >
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <Icon
                                                    className={`w-4 h-4 shrink-0 transition-colors ${
                                                        item.active ? 'text-[#1677ff]' : 'text-slate-400 group-hover:text-[#1677ff]'
                                                    }`}
                                                />
                                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                                            </div>

                                            {item.badge && !isCollapsed && (
                                                <span
                                                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full shrink-0 ${
                                                        item.active
                                                            ? 'bg-[#1677ff] text-white font-semibold'
                                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                    }`}
                                                >
                                                    {item.badge}
                                                </span>
                                            )}

                                            {item.badge && isCollapsed && (
                                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#1677ff]" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* Bottom User Profile Section */}
                <div className={`border-t border-[#e6ebf1] bg-[#fafafb] ${isCollapsed ? 'p-2 flex flex-col items-center gap-2' : 'p-3 space-y-2'}`}>
                    {!isCollapsed ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsGuideModalOpen(true)}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-[#e6ebf1] text-slate-700 hover:text-[#1677ff] hover:border-[#91caff] text-xs font-medium transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer"
                            >
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    <span>Panduan Fitur</span>
                                </div>
                                <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[9px] py-0.5 px-1.5 font-mono font-semibold rounded">
                                    GUIDE
                                </span>
                            </button>

                            <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#e6ebf1] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <Link
                                    href={isAdminRoute ? '/admin/settings' : '/profile'}
                                    className="flex items-center gap-2.5 overflow-hidden hover:opacity-90 transition-opacity flex-1 min-w-0"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]/40 flex items-center justify-center font-bold text-xs shrink-0">
                                        {user.name ? user.name.slice(0, 2).toUpperCase() : 'WA'}
                                    </div>
                                    <div className="overflow-hidden text-left">
                                        <div className="text-xs font-semibold text-slate-900 truncate">
                                            {user.name || 'Tamu'}
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate">
                                            {isAdminRoute
                                                ? (isSuperAdmin ? 'Superadmin Platform' : (user.role || 'Staff').toUpperCase())
                                                : (user.workspace_name || user.email || 'Workspace')}
                                        </div>
                                    </div>
                                </Link>

                                {user.id ? (
                                    <Link
                                        href={logoutHref}
                                        method="post"
                                        as="button"
                                        className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1 cursor-pointer"
                                        title="Keluar"
                                    >
                                        <LogOut className="w-3.5 h-3.5" />
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="h-7 px-2 rounded-lg flex items-center justify-center text-xs font-semibold text-[#1677ff] hover:bg-blue-50 transition-colors ml-1"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={() => setIsGuideModalOpen(true)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                                title="Panduan Fitur"
                            >
                                <Lightbulb className="w-4 h-4" />
                            </button>
                            <Link
                                href={isAdminRoute ? '/admin/settings' : '/profile'}
                                className="h-8 w-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]/40 flex items-center justify-center font-bold text-xs"
                                title={user.name || 'Profil'}
                            >
                                {user.name ? user.name.slice(0, 2).toUpperCase() : 'WA'}
                            </Link>
                            {user.id && (
                                <Link
                                    href={logoutHref}
                                    method="post"
                                    as="button"
                                    className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Keluar"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </Link>
                            )}
                        </>
                    )}
                </div>
            </aside>

            {/* ================= 2. MAIN CONTENT AREA & TOPBAR ================= */}
            <div
                className={`flex-1 flex flex-col ${
                    isCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
                } min-w-0 transition-all duration-300 ease-in-out`}
            >
                {/* TOP HEADER BAR */}
                <header className="sticky top-0 z-40 h-16 bg-white/95 backdrop-blur-md border-b border-[#e6ebf1] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                    {/* Left: Mobile Drawer Trigger, Desktop Sidebar Toggle & Breadcrumb */}
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        {/* Mobile Drawer Button */}
                        <button
                            type="button"
                            onClick={() => setIsMobileDrawerOpen(true)}
                            className="lg:hidden h-9 w-9 rounded-lg border border-[#e6ebf1] bg-white flex items-center justify-center text-slate-600 hover:text-[#1677ff] hover:border-[#1677ff] shadow-2xs active:scale-95 transition-all shrink-0 cursor-pointer"
                            aria-label="Buka Menu Navigasi"
                        >
                            <Menu className="w-4 h-4" />
                        </button>

                        {/* Desktop Sidebar Expand/Collapse Toggle */}
                        <button
                            type="button"
                            onClick={toggleSidebar}
                            className="hidden lg:flex h-8 w-8 rounded-lg border border-[#e6ebf1] bg-white items-center justify-center text-slate-500 hover:text-[#1677ff] hover:border-[#91caff] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors cursor-pointer shrink-0"
                            title={isCollapsed ? 'Perluas Sidebar' : 'Perkecil Sidebar'}
                            aria-label="Toggle Sidebar"
                        >
                            {isCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        </button>

                        {/* Mobile Brand Logo */}
                        <Link href="/" className="lg:hidden flex items-center gap-2 shrink-0">
                            <img
                                src="/images/logo.png"
                                alt="Politeknik Mardira Indonesia"
                                className="h-7 w-auto object-contain shrink-0"
                            />
                            <span className="font-black text-xs tracking-tight text-slate-900 block leading-none">
                                MARDIRA<span className="text-[#1677ff]">WA</span>
                            </span>
                        </Link>

                        {/* Mantis Breadcrumb Hierarchy */}
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
                            placeholder="Cari fitur, menu, kontak... (Ctrl+K)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-8 pl-8 pr-10 text-xs rounded-lg border border-[#e6ebf1] bg-slate-50/70 placeholder:text-slate-400 focus:bg-white focus:border-[#1677ff] focus:outline-none transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                        />
                        <kbd className="pointer-events-none absolute right-2 top-1.5 hidden h-5 select-none items-center gap-0.5 rounded border border-[#e6ebf1] bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400 sm:flex">
                            ⌘K
                        </kbd>
                    </div>

                    {/* Right: SLA, Mode Switcher & Primary Action */}
                    <div className="flex items-center gap-2 sm:gap-2.5">
                        {/* SLA Indicator */}
                        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-blue-200/80 bg-[#e6f4ff]/60 text-[11px] font-medium text-[#1677ff]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#1677ff] animate-pulse" />
                            <span>Uptime <strong>99.9%</strong></span>
                        </div>

                        {/* Mode Switcher Segmented Control */}
                        {isSaaSStaff && (
                            <div className="flex items-center p-0.5 rounded-lg bg-slate-100 border border-[#e6ebf1] text-xs font-medium">
                                <Link
                                    href="/dashboard"
                                    prefetch
                                    className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs ${
                                        !isAdminRoute
                                            ? 'bg-white text-[#1677ff] font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    Workspace
                                </Link>
                                <Link
                                    href="/admin/dashboard"
                                    prefetch
                                    className={`px-2 sm:px-2.5 py-1 rounded-md transition-all text-xs ${
                                        isAdminRoute
                                            ? 'bg-[#1677ff] text-white font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                                            : 'text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    {isSuperAdmin ? 'Super Admin' : 'Panel SaaS'}
                                </Link>
                            </div>
                        )}

                        {/* Top Context Action Button */}
                        {isAdminRoute ? (
                            <Link href="/admin/payments" prefetch>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 text-xs font-semibold border-[#e6ebf1] text-[#1677ff] hover:border-[#1677ff] hover:bg-[#e6f4ff]/50 rounded-lg"
                                >
                                    <Receipt className="w-3.5 h-3.5 mr-1 text-[#1677ff]" />
                                    <span className="hidden sm:inline">Verifikasi Tagihan</span>
                                    <span className="sm:hidden">Invoice</span>
                                </Button>
                            </Link>
                        ) : (
                            <Link href="/broadcast" prefetch>
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-[#1677ff] hover:bg-[#1060d4] text-white h-8 text-xs font-semibold shadow-[0_2px_4px_rgba(22,119,255,0.2)] rounded-lg"
                                >
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
                    {/* Themed In-Page Flash Alerts */}
                    {!dismissedFlash && flash.success && (
                        <Alert variant="success" onClose={() => setDismissedFlash(true)} className="animate-fade-in-up">
                            <AlertTitle>Berhasil Dilakukan</AlertTitle>
                            <AlertDescription>{flash.success}</AlertDescription>
                        </Alert>
                    )}

                    {!dismissedFlash && flash.warning && (
                        <Alert variant="warning" onClose={() => setDismissedFlash(true)} className="animate-fade-in-up">
                            <AlertTitle>Perhatian</AlertTitle>
                            <AlertDescription>{flash.warning}</AlertDescription>
                        </Alert>
                    )}

                    {!dismissedFlash && flash.error && (
                        <Alert variant="destructive" onClose={() => setDismissedFlash(true)} className="animate-fade-in-up">
                            <AlertTitle>Terjadi Kesalahan</AlertTitle>
                            <AlertDescription>{flash.error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Floating Toast Notification */}
                    <Toast />

                    <PageTransition routeKey={url} className="space-y-6">
                        {children}
                    </PageTransition>
                </main>
            </div>

            {/* ================= 3. MOBILE SLIDE-OVER DRAWER (MANTIS LIGHT THEME) ================= */}
            {isMobileDrawerOpen && (
                <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
                        onClick={() => setIsMobileDrawerOpen(false)}
                    />

                    {/* Drawer Panel */}
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white text-slate-800 border-r border-[#e6ebf1] z-10 shadow-2xl">
                        {/* Drawer Header */}
                        <div className="h-16 px-5 flex items-center justify-between border-b border-[#e6ebf1] bg-white">
                            <div className="flex items-center gap-2.5">
                                <img
                                    src="/images/logo.png"
                                    alt="Politeknik Mardira Indonesia"
                                    className="h-8 w-auto object-contain shrink-0"
                                />
                                <div>
                                    <span className="font-black text-sm tracking-tight text-slate-900">
                                        MARDIRA<span className="text-[#1677ff]">WA</span>
                                    </span>
                                    <p className="text-[10px] text-slate-400">
                                        {isAdminRoute ? 'Super Admin' : 'Tenant Workspace'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsMobileDrawerOpen(false)}
                                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Drawer Navigation List */}
                        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
                            {currentNavGroups.map((group, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#8c8c8c]">
                                        {group.title}
                                    </div>
                                    <nav className="space-y-0.5">
                                        {group.items.map((item) => {
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    prefetch
                                                    onClick={() => setIsMobileDrawerOpen(false)}
                                                    className={`group w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs transition-all ${
                                                        item.active
                                                            ? 'bg-[#e6f4ff] text-[#1677ff] font-semibold border-r-2 border-[#1677ff]'
                                                            : 'text-[#595959] hover:bg-slate-50 hover:text-[#1677ff] font-medium'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <Icon className={`w-4 h-4 ${item.active ? 'text-[#1677ff]' : 'text-slate-400'}`} />
                                                        <span>{item.label}</span>
                                                    </div>
                                                    {item.badge && (
                                                        <span
                                                            className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                                                item.active
                                                                    ? 'bg-[#1677ff] text-white font-semibold'
                                                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                            }`}
                                                        >
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
                                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#fafafb] border border-[#e6ebf1] text-slate-700 hover:text-[#1677ff] text-xs font-medium shadow-[0_1px_2px_rgba(0,0,0,0.02)] cursor-pointer transition-all"
                            >
                                <div className="flex items-center gap-2">
                                    <Lightbulb className="w-4 h-4 text-amber-500" />
                                    <span>Buka Panduan Fitur</span>
                                </div>
                                <span className="bg-amber-50 text-amber-700 border border-amber-200/60 text-[9px] py-0.5 px-1.5 font-mono font-semibold rounded">
                                    GUIDE
                                </span>
                            </button>
                        </div>

                        {/* Drawer Bottom Profile */}
                        <div className="p-3 border-t border-[#e6ebf1] bg-[#fafafb]">
                            <div className="flex items-center justify-between">
                                <Link
                                    href={isAdminRoute ? '/admin/settings' : '/profile'}
                                    onClick={() => setIsMobileDrawerOpen(false)}
                                    className="flex items-center gap-2 min-w-0"
                                >
                                    <div className="h-8 w-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]/40 flex items-center justify-center font-bold text-xs shrink-0">
                                        {user.name ? user.name.slice(0, 2).toUpperCase() : 'WA'}
                                    </div>
                                    <div className="overflow-hidden">
                                        <div className="truncate text-xs font-semibold text-slate-800">
                                            {user.name || 'Tamu'}
                                        </div>
                                        <div className="truncate text-[10px] text-slate-400">
                                            {isAdminRoute
                                                ? (isSuperAdmin ? 'Superadmin' : (user.role || 'Staff').toUpperCase())
                                                : (user.workspace_name || user.email || 'Workspace')}
                                        </div>
                                    </div>
                                </Link>

                                {user.id ? (
                                    <Link
                                        href={logoutHref}
                                        method="post"
                                        as="button"
                                        className="text-xs text-rose-600 font-semibold hover:text-rose-700 p-1.5"
                                    >
                                        Keluar
                                    </Link>
                                ) : (
                                    <Link
                                        href="/login"
                                        className="text-xs text-[#1677ff] font-semibold hover:underline p-1.5"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ================= 4. CURATED MOBILE FLOATING DOCK ================= */}
            <nav className="lg:hidden fixed bottom-2.5 inset-x-3 bg-white/95 backdrop-blur-md border border-[#e6ebf1] px-2 py-1.5 rounded-2xl flex items-center justify-around z-30 shadow-xl shadow-slate-900/5">
                {(isAdminRoute ? adminMobileDockItems : clientMobileDockItems).map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            prefetch
                            className={`flex flex-col items-center gap-1 text-[10px] transition-all py-1.5 px-3 rounded-xl min-h-[44px] justify-center ${
                                item.active
                                    ? 'font-semibold text-white bg-[#1677ff] shadow-md shadow-blue-500/20'
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
