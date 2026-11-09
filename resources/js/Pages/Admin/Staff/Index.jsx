import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '../../../Layouts/AppLayout';
import {
    ShieldCheck,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    User,
    Lock,
    Crown,
    Briefcase,
    TrendingUp,
    Headphones,
    Key,
    Phone,
    Mail,
    AlertCircle,
    X,
    Check,
    ShieldAlert,
    Cpu,
    Calendar,
    Users,
    Receipt,
    Package,
    Settings,
    Layers,
    Sliders,
    Sparkles,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../Components/ui/card';
import { Badge } from '../../../Components/ui/badge';
import { Button } from '../../../Components/ui/button';

export default function AdminStaffIndex({
    staff = [],
    metrics = {},
    filters = {},
    availableRoles = [],
    roles = [],
    availablePermissions = [],
    isSuperAdmin = false,
}) {
    const staffList = Array.isArray(staff) ? staff : (Array.isArray(staff?.data) ? staff.data : Object.values(staff || {}));
    const rolesList = Array.isArray(roles) ? roles : Object.values(roles || {});
    const assignableRolesList = Array.isArray(availableRoles) ? availableRoles : Object.values(availableRoles || {});
    const permissionsList = Array.isArray(availablePermissions) ? availablePermissions : Object.values(availablePermissions || {});

    // Active primary tab: 'staff' (Daftar Pengguna) or 'roles' (Setup Grup & Hak Akses)
    const [activeTab, setActiveTab] = useState('staff');

    // Filter & Search states
    const [search, setSearch] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || 'all');

    // Modals for Staff
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [deleteModalStaff, setDeleteModalStaff] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modals for Roles (Dynamic RBAC)
    const [isCreateRoleModalOpen, setIsCreateRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [deleteModalRole, setDeleteModalRole] = useState(null);

    // Form state for Staff
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: assignableRolesList.length > 0 ? assignableRolesList[0].value : 'admin',
        password: '',
        password_confirmation: '',
    });

    // Form state for Role & Permissions
    const [roleForm, setRoleForm] = useState({
        name: '',
        slug: '',
        description: '',
        badge_color: 'emerald',
        permissions: [],
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/staff', { search, role: roleFilter }, { preserveState: true, replace: true });
    };

    const handleFilterRole = (newRole) => {
        setRoleFilter(newRole);
        router.get('/admin/staff', { search, role: newRole }, { preserveState: true, replace: true });
    };

    // Staff actions
    const openCreateModal = () => {
        setForm({
            name: '',
            email: '',
            phone: '',
            role: assignableRolesList.length > 0 ? assignableRolesList[0].value : 'admin',
            password: '',
            password_confirmation: '',
        });
        setIsCreateModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditingStaff(user);
        setForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            role: user.role || 'admin',
            password: '',
            password_confirmation: '',
        });
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/admin/staff', form, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsCreateModalOpen(false);
            },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!editingStaff) return;
        setIsSubmitting(true);
        router.put(`/admin/staff/${editingStaff.id}`, form, {
            onFinish: () => {
                setIsSubmitting(false);
                setEditingStaff(null);
            },
        });
    };

    const handleToggleStatus = (user) => {
        router.post(`/admin/staff/${user.id}/toggle-status`, {}, { preserveScroll: true });
    };

    const confirmDelete = () => {
        if (!deleteModalStaff) return;
        setIsSubmitting(true);
        router.delete(`/admin/staff/${deleteModalStaff.id}`, {
            onFinish: () => {
                setIsSubmitting(false);
                setDeleteModalStaff(null);
            },
        });
    };

    // Role & Permissions Actions
    const openCreateRoleModal = () => {
        setRoleForm({
            name: '',
            slug: '',
            description: '',
            badge_color: 'indigo',
            permissions: ['manage_clients', 'manage_subscriptions'],
        });
        setIsCreateRoleModalOpen(true);
    };

    const openEditRoleModal = (role) => {
        setEditingRole(role);
        setRoleForm({
            name: role.name || '',
            slug: role.slug || '',
            description: role.description || '',
            badge_color: role.badge_color || 'emerald',
            permissions: Array.isArray(role.permissions) ? [...role.permissions] : [],
        });
    };

    const togglePermission = (permKey) => {
        setRoleForm((prev) => {
            const current = prev.permissions || [];
            const exists = current.includes(permKey);
            return {
                ...prev,
                permissions: exists ? current.filter((k) => k !== permKey) : [...current, permKey],
            };
        });
    };

    const selectAllPermissions = () => {
        const allKeys = permissionsList.map((p) => p.key);
        setRoleForm((prev) => ({ ...prev, permissions: allKeys }));
    };

    const deselectAllPermissions = () => {
        setRoleForm((prev) => ({ ...prev, permissions: [] }));
    };

    const handleCreateRoleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/admin/roles', roleForm, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsCreateRoleModalOpen(false);
            },
        });
    };

    const handleEditRoleSubmit = (e) => {
        e.preventDefault();
        if (!editingRole) return;
        setIsSubmitting(true);
        router.put(`/admin/roles/${editingRole.id}`, roleForm, {
            onFinish: () => {
                setIsSubmitting(false);
                setEditingRole(null);
            },
        });
    };

    const confirmDeleteRole = () => {
        if (!deleteModalRole) return;
        setIsSubmitting(true);
        router.delete(`/admin/roles/${deleteModalRole.id}`, {
            onFinish: () => {
                setIsSubmitting(false);
                setDeleteModalRole(null);
            },
        });
    };

    // Styling helpers
    const getBadgeColorClasses = (color) => {
        switch (color) {
            case 'amber':
                return 'bg-amber-100 text-amber-900 border-amber-300';
            case 'emerald':
                return 'bg-emerald-100 text-emerald-900 border-emerald-300';
            case 'blue':
                return 'bg-blue-100 text-blue-900 border-blue-300';
            case 'purple':
                return 'bg-purple-100 text-purple-900 border-purple-300';
            case 'rose':
                return 'bg-rose-100 text-rose-900 border-rose-300';
            case 'indigo':
                return 'bg-indigo-100 text-indigo-900 border-indigo-300';
            case 'cyan':
                return 'bg-cyan-100 text-cyan-900 border-cyan-300';
            default:
                return 'bg-slate-100 text-slate-800 border-slate-300';
        }
    };

    const getPermissionIcon = (iconName) => {
        switch (iconName) {
            case 'Users':
                return Users;
            case 'Calendar':
                return Calendar;
            case 'Receipt':
                return Receipt;
            case 'Package':
                return Package;
            case 'Cpu':
                return Cpu;
            case 'ShieldCheck':
                return ShieldCheck;
            case 'Settings':
                return Settings;
            default:
                return Layers;
        }
    };

    const getRoleDefinition = (roleSlug) => {
        return rolesList.find((r) => r.slug === roleSlug) || {
            name: roleSlug?.toUpperCase() || 'Staff',
            badge_color: 'slate',
            description: 'Peran staf kustom',
            permissions: [],
        };
    };

    const selectedRoleData = assignableRolesList.find((r) => r.value === form.role);

    return (
        <AppLayout title="Tim & Akses RBAC Dinamis">
            <Head title="Manajemen Tim & RBAC Dinamis — Super Admin" />

            <div className="space-y-6 animate-fade-in-up">
                {/* 1. TOP HEADER & PRIMARY TAB SWITCHER */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-xs">
                            <ShieldCheck className="w-6 h-6" />
                        </span>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                    Manajemen Tim & Akses RBAC Dinamis
                                </h1>
                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-semibold">
                                    Dynamic RBAC
                                </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Setup grup peran (Admin, Marketing, Support, Finance) dan atur izin akses modul per halaman secara dinamis.
                            </p>
                        </div>
                    </div>

                    {/* ACTION BUTTONS & TAB SWITCHER */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <div className="p-1 bg-slate-100 rounded-xl flex items-center border border-slate-200">
                            <button
                                type="button"
                                onClick={() => setActiveTab('staff')}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'staff'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>Akun Staff Internal</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 text-slate-700">
                                    {staffList.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('roles')}
                                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    activeTab === 'roles'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <Sliders className="w-3.5 h-3.5" />
                                <span>Setup Grup & Hak Akses</span>
                                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                    {rolesList.length} Grup
                                </span>
                            </button>
                        </div>

                        {activeTab === 'staff' ? (
                            <Button
                                onClick={openCreateModal}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-xl gap-2 shadow-xs cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tambah Staff</span>
                            </Button>
                        ) : isSuperAdmin ? (
                            <Button
                                onClick={openCreateRoleModal}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 px-3.5 rounded-xl gap-2 shadow-xs cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Tambah Grup Baru</span>
                            </Button>
                        ) : null}
                    </div>
                </div>

                {/* 2. SECURITY NOTICE FOR ROOT SUPERADMIN */}
                {isSuperAdmin && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-950 flex items-start gap-3 shadow-2xs">
                        <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                            <div className="font-bold flex items-center gap-1.5">
                                <span>Keamanan Terpusat Sistem Multi-Guard</span>
                                <Badge variant="outline" className="bg-amber-100/90 text-amber-900 border-amber-300 text-[9px] font-mono">
                                    SUPERADMIN ROOT
                                </Badge>
                            </div>
                            <p className="text-amber-900/90 leading-relaxed text-[11px]">
                                Tabel pengguna staff internal SaaS telah terisolasi di tabel <code>admins</code>. Hak akses per halaman dapat dikonfigurasi secara instan melalui tab <strong>"Setup Grup & Hak Akses"</strong> di samping.
                            </p>
                        </div>
                    </div>
                )}

                {/* TAB 1: DAFTAR AKUN STAFF */}
                {activeTab === 'staff' && (
                    <div className="space-y-6">
                        {/* KPI STAT CARDS */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            <Card className="border-slate-200 shadow-2xs">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-slate-500">Total Akun Staff</CardDescription>
                                    <Users className="w-4 h-4 text-slate-400" />
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-slate-900">{metrics.total_staff || staffList.length}</div>
                                    <p className="text-[11px] text-slate-500 mt-0.5">Pengguna Internal SaaS</p>
                                </CardContent>
                            </Card>

                            <Card className="border-indigo-200 bg-indigo-50/20 shadow-2xs">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-indigo-800">Total Grup RBAC</CardDescription>
                                    <Sliders className="w-4 h-4 text-indigo-600" />
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-indigo-800">{rolesList.length}</div>
                                    <p className="text-[11px] text-indigo-700 mt-0.5">Grup Peran Aktif</p>
                                </CardContent>
                            </Card>

                            <Card className="border-emerald-200 bg-emerald-50/20 shadow-2xs">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-emerald-800">Admin Operasional</CardDescription>
                                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-emerald-800">{metrics.admin_count || 0}</div>
                                    <p className="text-[11px] text-emerald-700 mt-0.5">Operasional Penuh</p>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-200 bg-blue-50/20 shadow-2xs">
                                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                    <CardDescription className="text-xs font-semibold text-blue-800">Marketing & Support</CardDescription>
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="text-2xl font-black text-blue-800">
                                        {(metrics.marketing_count || 0) + (metrics.support_count || 0)}
                                    </div>
                                    <p className="text-[11px] text-blue-700 mt-0.5">Billing & Bantuan</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* TOOLBAR: SEARCH & ROLE FILTER */}
                        <Card className="border-slate-200 shadow-2xs">
                            <CardContent className="p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <form onSubmit={handleSearch} className="relative w-full sm:w-80">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Cari nama, email, atau no. telepon..."
                                        className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </form>

                                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs font-medium overflow-x-auto max-w-full">
                                    <button
                                        type="button"
                                        onClick={() => handleFilterRole('all')}
                                        className={`px-3 py-1 rounded-md transition-all ${
                                            roleFilter === 'all'
                                                ? 'bg-white text-slate-900 font-bold shadow-2xs'
                                                : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        Semua Role
                                    </button>

                                    {rolesList.map((r) => {
                                        if (r.slug === 'superadmin' && !isSuperAdmin) return null;
                                        return (
                                            <button
                                                key={r.slug}
                                                type="button"
                                                onClick={() => handleFilterRole(r.slug)}
                                                className={`px-3 py-1 rounded-md transition-all capitalize ${
                                                    roleFilter === r.slug
                                                        ? 'bg-white text-slate-900 font-bold shadow-2xs'
                                                        : 'text-slate-500 hover:text-slate-900'
                                                }`}
                                            >
                                                {r.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* STAFF TABLE */}
                        <Card className="border-slate-200 shadow-2xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                                            <th className="py-3 px-4">Pengguna / Staff</th>
                                            <th className="py-3 px-4">Kontak</th>
                                            <th className="py-3 px-4">Grup / Peran</th>
                                            <th className="py-3 px-4">Hak Akses Modul</th>
                                            <th className="py-3 px-4 text-center">Status</th>
                                            <th className="py-3 px-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {staffList.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="py-12 text-center text-slate-400">
                                                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                                                    <p className="font-medium text-slate-600">Tidak ada akun staff ditemukan</p>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                                        Coba ubah kata kunci pencarian atau filter peran di atas.
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            staffList.map((user) => {
                                                const isRoot = user.role === 'superadmin';
                                                const roleDef = getRoleDefinition(user.role);
                                                const badgeClasses = getBadgeColorClasses(roleDef.badge_color);
                                                const permissionsCount = isRoot ? 'Akses Penuh (Root)' : `${(roleDef.permissions || []).length} Modul`;

                                                return (
                                                    <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                                                    isRoot ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                                }`}>
                                                                    {isRoot ? <Crown className="w-4 h-4 text-amber-600" /> : user.name?.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                                        <span>{user.name}</span>
                                                                        {isRoot && (
                                                                            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[9px] px-1.5 py-0">
                                                                                ROOT
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">{user.email}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                                                            {user.phone || <span className="text-slate-400 italic">Belum diisi</span>}
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <Badge className={`border text-[10px] font-semibold px-2 py-0.5 rounded-lg gap-1 ${badgeClasses}`}>
                                                                <span>{roleDef.name}</span>
                                                            </Badge>
                                                        </td>
                                                        <td className="py-3.5 px-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="font-semibold text-slate-700 text-[11px]">
                                                                    {permissionsCount}
                                                                </span>
                                                                {!isRoot && (
                                                                    <span className="text-[10px] text-slate-400">
                                                                        ({roleDef.name})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="py-3.5 px-4 text-center">
                                                            {isRoot ? (
                                                                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">
                                                                    Aktif Selamanya
                                                                </Badge>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleToggleStatus(user)}
                                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                                                                        user.is_active
                                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                                                                    }`}
                                                                >
                                                                    <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                                    <span>{user.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="py-3.5 px-4 text-right">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => openEditModal(user)}
                                                                    className="h-7 text-xs px-2.5 rounded-lg border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                                                    <span>{isRoot ? 'Ganti Email / Sandi' : 'Edit'}</span>
                                                                </Button>

                                                                {!isRoot && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => setDeleteModalStaff(user)}
                                                                        className="h-7 w-7 p-0 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    </div>
                )}

                {/* TAB 2: SETUP GRUP PERAN & HAK AKSES PER HALAMAN (DYNAMIC RBAC) */}
                {activeTab === 'roles' && (
                    <div className="space-y-6">
                        <div className="p-4 rounded-2xl bg-slate-900 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-emerald-400" />
                                    <h3 className="font-bold text-sm sm:text-base text-white">
                                        Matriks Hak Akses Halaman & Konfigurasi Grup
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                                    Setiap grup peran dapat memiliki izin akses per halaman yang berbeda-beda. Perubahan izin akses pada grup akan otomatis berlaku instan ke seluruh staf di grup tersebut.
                                </p>
                            </div>

                            {isSuperAdmin && (
                                <Button
                                    onClick={openCreateRoleModal}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs h-9 px-4 rounded-xl gap-2 shadow-xs cursor-pointer shrink-0"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Buat Grup Baru</span>
                                </Button>
                            )}
                        </div>

                        {/* LIST OF ROLES */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {rolesList.map((role) => {
                                const isRoot = role.slug === 'superadmin';
                                const badgeColorClasses = getBadgeColorClasses(role.badge_color);
                                const perms = Array.isArray(role.permissions) ? role.permissions : [];

                                return (
                                    <Card key={role.id} className="border-slate-200 shadow-2xs hover:shadow-xs transition-shadow">
                                        <CardHeader className="p-4 pb-3 border-b border-slate-100 flex flex-row items-start justify-between gap-2">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black text-slate-900 text-sm">{role.name}</h3>
                                                    <Badge className={`border text-[9px] px-2 py-0.2 font-semibold ${badgeColorClasses}`}>
                                                        {role.slug}
                                                    </Badge>
                                                    {role.is_system && (
                                                        <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                                            SISTEM
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                                                    {role.description || 'Tidak ada deskripsi grup.'}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                                                    {role.admins_count || 0} Staff
                                                </span>
                                            </div>
                                        </CardHeader>

                                        <CardContent className="p-4 space-y-3">
                                            <div>
                                                <div className="text-[11px] font-bold text-slate-700 mb-2 flex items-center justify-between">
                                                    <span>Hak Akses Halaman Terpasang:</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {isRoot ? 'Semua Halaman (7/7)' : `${perms.length} dari ${permissionsList.length} Halaman`}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap gap-1.5">
                                                    {isRoot ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                                                            <Crown className="w-3 h-3 text-amber-600" />
                                                            <span>Akses Seluruh Modul & Konfigurasi Sistem</span>
                                                        </span>
                                                    ) : (
                                                        permissionsList.map((p) => {
                                                            const isGranted = perms.includes(p.key);
                                                            const Icon = getPermissionIcon(p.icon);

                                                            return (
                                                                <span
                                                                    key={p.key}
                                                                    className={`inline-flex items-center gap-1 px-2 py-0.8 rounded-lg text-[10px] font-medium border transition-colors ${
                                                                        isGranted
                                                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                                                                            : 'bg-slate-50 text-slate-400 border-slate-200 line-through opacity-60'
                                                                    }`}
                                                                    title={p.description}
                                                                >
                                                                    <Icon className="w-3 h-3 shrink-0" />
                                                                    <span>{p.label}</span>
                                                                </span>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>

                                            {/* ACTIONS FOR THIS ROLE */}
                                            {isSuperAdmin && !isRoot && (
                                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openEditRoleModal(role)}
                                                        className="h-8 text-xs px-3 rounded-lg border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 font-bold gap-1.5 cursor-pointer"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                        <span>Edit Hak Akses Halaman</span>
                                                    </Button>

                                                    {!role.is_system && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setDeleteModalRole(role)}
                                                            className="h-8 text-xs px-2.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                                                            <span>Hapus Grup</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* MODAL: TAMBAH STAFF BARU */}
                <AnimatePresence>
                    {isCreateModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200"
                            >
                                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                                            <User className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">Tambah Akun Staff Baru</h3>
                                            <p className="text-[11px] text-slate-500">Buat akun untuk tim internal pengelola SaaS</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateSubmit} className="p-4 sm:p-5 space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="Contoh: Rian Pratama"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Administrator</label>
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="rian@kirimwa.pro"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp / Telepon</label>
                                        <input
                                            type="text"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            placeholder="+6281234567890"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Grup / Peran Staff</label>
                                        <select
                                            value={form.role}
                                            onChange={(e) => setForm({ ...form, role: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                                        >
                                            {assignableRolesList.map((r) => (
                                                <option key={r.value} value={r.value}>
                                                    {r.label} ({r.value})
                                                </option>
                                            ))}
                                        </select>

                                        {selectedRoleData && (
                                            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                                                <div className="text-slate-600">{selectedRoleData.description}</div>
                                                <div className="flex flex-wrap gap-1 pt-1">
                                                    {(selectedRoleData.permissions || []).map((pKey) => (
                                                        <span key={pKey} className="px-1.5 py-0.2 rounded bg-white border border-slate-200 text-[10px] text-slate-700 font-mono">
                                                            {pKey}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi</label>
                                            <input
                                                type="password"
                                                required
                                                value={form.password}
                                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                placeholder="Min. 8 karakter"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Sandi</label>
                                            <input
                                                type="password"
                                                required
                                                value={form.password_confirmation}
                                                onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                                placeholder="Ulangi sandi"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateModalOpen(false)}
                                            className="h-9 text-xs rounded-xl"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : 'Simpan Staff'}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL: EDIT STAFF */}
                <AnimatePresence>
                    {editingStaff && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200"
                            >
                                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                                            <Edit2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">
                                                {editingStaff.role === 'superadmin' ? 'Perbarui Akun Superadmin' : 'Edit Data Staff'}
                                            </h3>
                                            <p className="text-[11px] text-slate-500">{editingStaff.name} ({editingStaff.email})</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingStaff(null)}
                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditSubmit} className="p-4 sm:p-5 space-y-3.5">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Administrator</label>
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">No. WhatsApp / Telepon</label>
                                        <input
                                            type="text"
                                            value={form.phone}
                                            onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    {editingStaff.role !== 'superadmin' ? (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Grup / Peran Staff</label>
                                            <select
                                                value={form.role}
                                                onChange={(e) => setForm({ ...form, role: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white font-medium"
                                            >
                                                {assignableRolesList.map((r) => (
                                                    <option key={r.value} value={r.value}>
                                                        {r.label} ({r.value})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                                            <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                                            <span>Peran Super Administrator dilindungi sistem dan tidak dapat dialihkan.</span>
                                        </div>
                                    )}

                                    <div className="pt-2 border-t border-slate-100">
                                        <p className="text-[11px] text-slate-500 mb-2">
                                            Kosongkan kata sandi jika tidak ingin mengubahnya.
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Sandi Baru</label>
                                                <input
                                                    type="password"
                                                    value={form.password}
                                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                    placeholder="Opsional"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-semibold text-slate-700 mb-1">Konfirmasi Sandi</label>
                                                <input
                                                    type="password"
                                                    value={form.password_confirmation}
                                                    onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                                    placeholder="Ulangi sandi"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 flex items-center justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingStaff(null)}
                                            className="h-9 text-xs rounded-xl"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                                        >
                                            {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL: SETUP GRUP BARU (CREATE ROLE) */}
                <AnimatePresence>
                    {isCreateRoleModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
                            >
                                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200">
                                            <Sliders className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">Buat Grup Peran RBAC Baru</h3>
                                            <p className="text-[11px] text-slate-500">Tentukan nama grup dan pilih izin akses halaman</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsCreateRoleModalOpen(false)}
                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateRoleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Grup Peran</label>
                                        <input
                                            type="text"
                                            required
                                            value={roleForm.name}
                                            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                            placeholder="Contoh: Staff Keuangan & Pajak"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Slug Kode (Unik)</label>
                                            <input
                                                type="text"
                                                value={roleForm.slug}
                                                onChange={(e) => setRoleForm({ ...roleForm, slug: e.target.value })}
                                                placeholder="finance_tax (otomatis jika kosong)"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Warna Badge</label>
                                            <select
                                                value={roleForm.badge_color}
                                                onChange={(e) => setRoleForm({ ...roleForm, badge_color: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                                            >
                                                <option value="emerald">Emerald (Hijau)</option>
                                                <option value="blue">Blue (Biru)</option>
                                                <option value="purple">Purple (Ungu)</option>
                                                <option value="amber">Amber (Kuning)</option>
                                                <option value="rose">Rose (Merah)</option>
                                                <option value="indigo">Indigo (Nila)</option>
                                                <option value="cyan">Cyan (Biru Muda)</option>
                                                <option value="slate">Slate (Abu-abu)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Tugas</label>
                                        <textarea
                                            rows="2"
                                            value={roleForm.description}
                                            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                            placeholder="Deskripsi singkat fungsi dan tanggung jawab grup ini..."
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    {/* CHECKLIST HAK AKSES PER HALAMAN */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <span>Checklist Hak Akses Per Halaman</span>
                                                <Badge className="bg-emerald-50 text-emerald-800 text-[10px]">
                                                    {roleForm.permissions.length} Dipilih
                                                </Badge>
                                            </label>
                                            <div className="flex items-center gap-2 text-[11px]">
                                                <button
                                                    type="button"
                                                    onClick={selectAllPermissions}
                                                    className="text-emerald-600 hover:text-emerald-700 font-bold"
                                                >
                                                    Pilih Semua
                                                </button>
                                                <span className="text-slate-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={deselectAllPermissions}
                                                    className="text-slate-500 hover:text-slate-700"
                                                >
                                                    Hapus Semua
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {permissionsList.map((p) => {
                                                const isChecked = roleForm.permissions.includes(p.key);
                                                const Icon = getPermissionIcon(p.icon);

                                                return (
                                                    <label
                                                        key={p.key}
                                                        className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                            isChecked
                                                                ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500/20'
                                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => togglePermission(p.key)}
                                                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                                        />
                                                        <div className="space-y-0.5">
                                                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                                                <Icon className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>{p.label}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">({p.route})</span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 leading-snug">
                                                                {p.description}
                                                            </p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateRoleModalOpen(false)}
                                            className="h-9 text-xs rounded-xl"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : 'Simpan Grup Baru'}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL: EDIT HAK AKSES GRUP (EDIT ROLE & PERMISSIONS) */}
                <AnimatePresence>
                    {editingRole && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 max-h-[90vh] flex flex-col"
                            >
                                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
                                            <Edit2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">
                                                Edit Hak Akses Grup: {editingRole.name}
                                            </h3>
                                            <p className="text-[11px] text-slate-500">
                                                Kode: <span className="font-mono text-slate-700 font-bold">{editingRole.slug}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingRole(null)}
                                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <form onSubmit={handleEditRoleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Grup Peran</label>
                                        <input
                                            type="text"
                                            required
                                            value={roleForm.name}
                                            onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Slug Kode</label>
                                            <input
                                                type="text"
                                                disabled
                                                value={roleForm.slug}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-100 text-slate-500 font-mono cursor-not-allowed"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1">Warna Badge</label>
                                            <select
                                                value={roleForm.badge_color}
                                                onChange={(e) => setRoleForm({ ...roleForm, badge_color: e.target.value })}
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                                            >
                                                <option value="emerald">Emerald (Hijau)</option>
                                                <option value="blue">Blue (Biru)</option>
                                                <option value="purple">Purple (Ungu)</option>
                                                <option value="amber">Amber (Kuning)</option>
                                                <option value="rose">Rose (Merah)</option>
                                                <option value="indigo">Indigo (Nila)</option>
                                                <option value="cyan">Cyan (Biru Muda)</option>
                                                <option value="slate">Slate (Abu-abu)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Tugas</label>
                                        <textarea
                                            rows="2"
                                            value={roleForm.description}
                                            onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                                        />
                                    </div>

                                    {/* CHECKLIST HAK AKSES PER HALAMAN */}
                                    <div className="pt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                                <span>Hak Akses Halaman & Fitur</span>
                                                <Badge className="bg-emerald-50 text-emerald-800 text-[10px]">
                                                    {roleForm.permissions.length} Terpilih
                                                </Badge>
                                            </label>
                                            <div className="flex items-center gap-2 text-[11px]">
                                                <button
                                                    type="button"
                                                    onClick={selectAllPermissions}
                                                    className="text-emerald-600 hover:text-emerald-700 font-bold"
                                                >
                                                    Pilih Semua
                                                </button>
                                                <span className="text-slate-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={deselectAllPermissions}
                                                    className="text-slate-500 hover:text-slate-700"
                                                >
                                                    Hapus Semua
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {permissionsList.map((p) => {
                                                const isChecked = roleForm.permissions.includes(p.key);
                                                const Icon = getPermissionIcon(p.icon);

                                                return (
                                                    <label
                                                        key={p.key}
                                                        className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${
                                                            isChecked
                                                                ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-500/20'
                                                                : 'bg-white border-slate-200 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => togglePermission(p.key)}
                                                            className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                                                        />
                                                        <div className="space-y-0.5">
                                                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                                                <Icon className="w-3.5 h-3.5 text-slate-500" />
                                                                <span>{p.label}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">({p.route})</span>
                                                            </div>
                                                            <p className="text-[11px] text-slate-500 leading-snug">
                                                                {p.description}
                                                            </p>
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 shrink-0">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setEditingRole(null)}
                                            className="h-9 text-xs rounded-xl"
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="h-9 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                                        >
                                            {isSubmitting ? 'Menyimpan...' : 'Simpan Hak Akses'}
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL: KONFIRMASI HAPUS STAFF */}
                <AnimatePresence>
                    {deleteModalStaff && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 border border-slate-200 text-center space-y-4"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-900 text-sm">Hapus Akun Staff?</h3>
                                    <p className="text-xs text-slate-500">
                                        Apakah Anda yakin ingin menghapus akun <strong>{deleteModalStaff.name}</strong> ({deleteModalStaff.email})? Tindakan ini tidak dapat dibatalkan.
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteModalStaff(null)}
                                        className="h-9 text-xs rounded-xl"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        onClick={confirmDelete}
                                        disabled={isSubmitting}
                                        className="h-9 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                                    >
                                        {isSubmitting ? 'Menghapus...' : 'Ya, Hapus'}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* MODAL: KONFIRMASI HAPUS GRUP ROLE */}
                <AnimatePresence>
                    {deleteModalRole && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 border border-slate-200 text-center space-y-4"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-900 text-sm">Hapus Grup Peran?</h3>
                                    <p className="text-xs text-slate-500">
                                        Apakah Anda yakin ingin menghapus grup <strong>{deleteModalRole.name}</strong> ({deleteModalRole.slug})?
                                    </p>
                                </div>
                                <div className="flex items-center justify-center gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteModalRole(null)}
                                        className="h-9 text-xs rounded-xl"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        onClick={confirmDeleteRole}
                                        disabled={isSubmitting}
                                        className="h-9 text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer"
                                    >
                                        {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Grup'}
                                    </Button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </AppLayout>
    );
}
