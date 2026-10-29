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
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../Components/ui/card';
import { Badge } from '../../../Components/ui/badge';
import { Button } from '../../../Components/ui/button';

export default function AdminStaffIndex({ staff, metrics, filters, availableRoles, isSuperAdmin }) {
    const [search, setSearch] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || 'all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);
    const [deleteModalStaff, setDeleteModalStaff] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state for Create & Edit
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'admin',
        password: '',
        password_confirmation: '',
    });

    const handleSearch = (e) => {
        e.preventDefault();
        router.get('/admin/staff', { search, role: roleFilter }, { preserveState: true, replace: true });
    };

    const handleFilterRole = (newRole) => {
        setRoleFilter(newRole);
        router.get('/admin/staff', { search, role: newRole }, { preserveState: true, replace: true });
    };

    const openCreateModal = () => {
        setForm({
            name: '',
            email: '',
            phone: '',
            role: availableRoles.length > 0 ? availableRoles[0].value : 'marketing',
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

    const getRoleDetails = (role) => {
        switch (role) {
            case 'superadmin':
                return {
                    label: 'Super Administrator',
                    sublabel: 'Root Master — Akses Penuh Sistem',
                    badgeVariant: 'gold',
                    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
                    icon: Crown,
                    permissions: ['Semua Modul', 'Pengaturan Sistem', 'RBAC & Tim Staff', 'Node Gateway', 'Billing & Klien'],
                };
            case 'admin':
                return {
                    label: 'Admin Operasional',
                    sublabel: 'Manajemen Operasional & Gateway',
                    badgeVariant: 'emerald',
                    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
                    icon: ShieldCheck,
                    permissions: ['Kelola Klien & Workspace', 'Langganan & Kuota', 'Verifikasi Pembayaran', 'Kelola Paket', 'Monitor Gateway'],
                };
            case 'marketing':
                return {
                    label: 'Marketing & Billing',
                    sublabel: 'Penjualan, Paket & Keuangan',
                    badgeVariant: 'blue',
                    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
                    icon: TrendingUp,
                    permissions: ['Kelola Paket Layanan', 'Lihat Tagihan & Invoice', 'Lihat Data Klien', 'Ikhtisar Pendapatan'],
                };
            case 'support':
                return {
                    label: 'Customer Support',
                    sublabel: 'Bantuan Pelanggan & Gateway',
                    badgeVariant: 'purple',
                    badgeBg: 'bg-purple-100 text-purple-900 border-purple-300',
                    icon: Headphones,
                    permissions: ['Bantuan Klien & Workspace', 'Monitoring Sesi Gateway', 'Restart Sesi Macet', 'Lihat Langganan'],
                };
            default:
                return {
                    label: 'Staff SaaS',
                    sublabel: 'Akses Standar',
                    badgeVariant: 'outline',
                    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200',
                    icon: User,
                    permissions: ['Dashboard'],
                };
        }
    };

    return (
        <AppLayout title="Tim & Akses RBAC">
            <Head title="Manajemen Tim & RBAC — Super Admin" />

            <div className="space-y-6 animate-fade-in-up">
                {/* 1. TOP HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5">
                        <span className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-5 h-5" />
                        </span>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                Manajemen Tim & Akses RBAC
                            </h1>
                            <p className="text-xs text-slate-500">
                                Atur akun pengguna internal pengelola aplikasi SaaS (Admin, Marketing, Customer Support).
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={openCreateModal}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-10 px-4 rounded-xl gap-2 shadow-xs cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Staff Baru</span>
                    </Button>
                </div>

                {/* 2. SECURITY NOTICE FOR ROOT SUPERADMIN (ONLY VISIBLE TO SUPERADMIN) */}
                {isSuperAdmin && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-start gap-3 shadow-2xs">
                        <Crown className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                            <div className="font-bold text-amber-950 flex items-center gap-1.5">
                                <span>Proteksi Mutlak Super Administrator (Root)</span>
                                <Badge variant="outline" className="bg-amber-100/80 text-amber-900 border-amber-300 text-[9px] font-mono">
                                    IMMUTABLE ROOT
                                </Badge>
                            </div>
                            <p className="text-amber-800/90 leading-relaxed text-[11px]">
                                Akun Super Administrator dilindungi secara ketat: <strong>tidak dapat dihapus, tidak dapat diduplikasi sembarang, dan tidak terlihat oleh pengguna di bawahnya (seperti Admin Operasional)</strong>. Anda dapat memperbarui email login dan kata sandi Anda kapan saja melalui tombol "Ganti Email / Sandi" di tabel bawah.
                            </p>
                        </div>
                    </div>
                )}

                {/* 3. KPI STAT CARDS */}
                <div className={`grid grid-cols-2 ${isSuperAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-3 sm:gap-4`}>
                    <Card className="border-slate-200 shadow-2xs">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardDescription className="text-xs font-semibold text-slate-500">Total Tim Staff</CardDescription>
                            <Users className="w-4 h-4 text-slate-400" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-black text-slate-900">{metrics.total_staff}</div>
                            <p className="text-[11px] text-slate-500 mt-0.5">Pengelola SaaS</p>
                        </CardContent>
                    </Card>

                    {isSuperAdmin && (
                        <Card className="border-amber-200 bg-amber-50/30 shadow-2xs">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardDescription className="text-xs font-semibold text-amber-800">Super Admin</CardDescription>
                                <Crown className="w-4 h-4 text-amber-600" />
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="text-2xl font-black text-amber-800">{metrics.superadmin_count}</div>
                                <p className="text-[11px] text-amber-700 mt-0.5">Root Terproteksi</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-emerald-200 bg-emerald-50/20 shadow-2xs">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardDescription className="text-xs font-semibold text-emerald-800">Admin</CardDescription>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-black text-emerald-800">{metrics.admin_count}</div>
                            <p className="text-[11px] text-emerald-700 mt-0.5">Operasional Penuh</p>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-blue-50/20 shadow-2xs">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardDescription className="text-xs font-semibold text-blue-800">Marketing</CardDescription>
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-black text-blue-800">{metrics.marketing_count}</div>
                            <p className="text-[11px] text-blue-700 mt-0.5">Paket & Billing</p>
                        </CardContent>
                    </Card>

                    <Card className="border-purple-200 bg-purple-50/20 shadow-2xs">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <CardDescription className="text-xs font-semibold text-purple-800">Support</CardDescription>
                            <Headphones className="w-4 h-4 text-purple-600" />
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-2xl font-black text-purple-800">{metrics.support_count}</div>
                            <p className="text-[11px] text-purple-700 mt-0.5">Bantuan Klien</p>
                        </CardContent>
                    </Card>
                </div>

                {/* 4. TOOLBAR: SEARCH & ROLE FILTER TABS */}
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
                                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                                    roleFilter === 'all' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Semua
                            </button>
                            {isSuperAdmin && (
                                <button
                                    type="button"
                                    onClick={() => handleFilterRole('superadmin')}
                                    className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                                        roleFilter === 'superadmin' ? 'bg-white text-amber-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                                >
                                    Super Admin
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => handleFilterRole('admin')}
                                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                                    roleFilter === 'admin' ? 'bg-white text-emerald-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Admin
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterRole('marketing')}
                                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                                    roleFilter === 'marketing' ? 'bg-white text-blue-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Marketing
                            </button>
                            <button
                                type="button"
                                onClick={() => handleFilterRole('support')}
                                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                                    roleFilter === 'support' ? 'bg-white text-purple-800 font-bold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Support
                            </button>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. STAFF LIST TABLE */}
                <Card className="border-slate-200 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="py-3 px-4 font-bold">Staff / Pengguna</th>
                                    <th className="py-3 px-4 font-bold">Peran (Role RBAC)</th>
                                    <th className="py-3 px-4 font-bold">Cakupan Hak Akses</th>
                                    <th className="py-3 px-4 font-bold">Status</th>
                                    <th className="py-3 px-4 font-bold">Bergabung</th>
                                    <th className="py-3 px-4 font-bold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {staff.map((user) => {
                                    const roleDetails = getRoleDetails(user.role);
                                    const RoleIcon = roleDetails.icon;
                                    const isRootSuperAdmin = user.role === 'superadmin' || user.id === 1;

                                    return (
                                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* User Info */}
                                            <td className="py-3.5 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                                                        isRootSuperAdmin
                                                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                    }`}>
                                                        {user.name.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="overflow-hidden">
                                                        <div className="font-bold text-slate-900 truncate flex items-center gap-1.5">
                                                            <span>{user.name}</span>
                                                            {isRootSuperAdmin && (
                                                                <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                                                            )}
                                                        </div>
                                                        <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                                                            <span className="flex items-center gap-1">
                                                                <Mail className="w-3 h-3 text-slate-400" /> {user.email}
                                                            </span>
                                                            {user.phone && (
                                                                <span className="flex items-center gap-1 font-mono text-[10px]">
                                                                    <Phone className="w-2.5 h-2.5 text-slate-400" /> {user.phone}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role Badge */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <div className="space-y-0.5">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${roleDetails.badgeBg}`}>
                                                        <RoleIcon className="w-3.5 h-3.5" />
                                                        {roleDetails.label}
                                                    </span>
                                                    <div className="text-[10px] text-slate-400 font-medium">
                                                        {roleDetails.sublabel}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Permissions List */}
                                            <td className="py-3.5 px-4 max-w-xs">
                                                <div className="flex flex-wrap gap-1">
                                                    {roleDetails.permissions.map((perm, pIdx) => (
                                                        <span
                                                            key={pIdx}
                                                            className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap"
                                                        >
                                                            {perm}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>

                                            {/* Status Toggle */}
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {isRootSuperAdmin ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
                                                        <Lock className="w-3 h-3 text-amber-600" />
                                                        Selalu Aktif
                                                    </span>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(user)}
                                                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
                                                            user.is_active
                                                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                                                : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                                                        }`}
                                                    >
                                                        <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                        <span>{user.is_active ? 'Aktif' : 'Nonaktif'}</span>
                                                    </button>
                                                )}
                                            </td>

                                            {/* Joined Date */}
                                            <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                }) : '-'}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                {isRootSuperAdmin ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(user)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 transition-colors cursor-pointer shadow-2xs"
                                                            title="Ganti Email & Kata Sandi Superadmin"
                                                        >
                                                            <Edit2 className="w-3 h-3 text-amber-700" />
                                                            <span>Ganti Email / Sandi</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(user)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                                                            title="Edit Staff"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeleteModalStaff(user)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                            title="Hapus Staff"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* ================= MODAL TAMBAH STAFF BARU ================= */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                    <div>
                                        <h3 className="text-sm font-bold">Tambah Staff Internal SaaS</h3>
                                        <p className="text-[11px] text-slate-400">
                                            Daftarkan anggota tim dan tetapkan peran (role) hak akses operasional
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700">Nama Lengkap *</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            placeholder="Contoh: Budi Santoso"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700">Email Login *</label>
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="staff@kirimwa.pro"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-bold text-slate-700">Nomor WhatsApp (Opsional)</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        placeholder="+6281234567890"
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                {/* Role Selection */}
                                <div className="space-y-2">
                                    <label className="font-bold text-slate-800 block">
                                        Pilih Peran Operasional (Role RBAC) *
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {availableRoles.map((r) => {
                                            const isSelected = form.role === r.value;
                                            return (
                                                <div
                                                    key={r.value}
                                                    onClick={() => setForm({ ...form, role: r.value })}
                                                    className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                                                            : 'border-slate-200 hover:border-slate-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-slate-900 text-xs">{r.label}</span>
                                                        <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                                            isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                                                        }`}>
                                                            {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 leading-tight">
                                                        {r.description}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700">Kata Sandi *</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            placeholder="Minimal 8 karakter"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700">Konfirmasi Kata Sandi *</label>
                                        <input
                                            type="password"
                                            required
                                            minLength={8}
                                            value={form.password_confirmation}
                                            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                            placeholder="Ulangi kata sandi"
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="h-9 px-4 text-xs font-semibold"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-5 text-xs font-semibold gap-1.5"
                                    >
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Staff Baru'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ================= MODAL EDIT STAFF / SUPERADMIN ================= */}
            <AnimatePresence>
                {editingStaff && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className={`px-6 py-4 text-white flex items-center justify-between ${
                                editingStaff.role === 'superadmin' ? 'bg-amber-950 border-b border-amber-800/60' : 'bg-slate-900'
                            }`}>
                                <div className="flex items-center gap-2.5">
                                    {editingStaff.role === 'superadmin' ? (
                                        <Crown className="w-5 h-5 text-amber-400" />
                                    ) : (
                                        <Edit2 className="w-4 h-4 text-emerald-400" />
                                    )}
                                    <div>
                                        <h3 className="text-sm font-bold">
                                            {editingStaff.role === 'superadmin'
                                                ? 'Edit Kredensial Super Administrator (Root)'
                                                : `Edit Staff: ${editingStaff.name}`}
                                        </h3>
                                        <p className="text-[11px] text-slate-300">
                                            {editingStaff.role === 'superadmin'
                                                ? 'Ganti email login utama, nama, atau perbarui kata sandi'
                                                : 'Perbarui data profil, peran, atau reset kata sandi'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingStaff(null)}
                                    className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="overflow-y-auto p-6 space-y-4 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700">Nama Lengkap *</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="font-bold text-slate-700">
                                            Email Login {editingStaff.role === 'superadmin' && '(Email Superadmin)'} *
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="font-bold text-slate-700">Nomor WhatsApp</label>
                                    <input
                                        type="text"
                                        value={form.phone}
                                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                </div>

                                {/* Role Selection or Locked Superadmin Badge */}
                                {editingStaff.role === 'superadmin' ? (
                                    <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                                            <div>
                                                <div className="font-bold text-amber-950 text-xs">Peran: Super Administrator (Root)</div>
                                                <div className="text-[10px] text-amber-800">Peran ini permanen & dilindungi arsitektur sistem</div>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded bg-amber-200/80 text-amber-900 text-[9px] font-mono font-bold">
                                            IMMUTABLE
                                        </span>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="font-bold text-slate-800 block">
                                            Peran Operasional (Role RBAC) *
                                        </label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {availableRoles.map((r) => {
                                                const isSelected = form.role === r.value;
                                                return (
                                                    <div
                                                        key={r.value}
                                                        onClick={() => setForm({ ...form, role: r.value })}
                                                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                                            isSelected
                                                                ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                                                                : 'border-slate-200 hover:border-slate-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-bold text-slate-900 text-xs">{r.label}</span>
                                                            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${
                                                                isSelected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                                                            }`}>
                                                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 leading-tight">
                                                            {r.description}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Password Reset */}
                                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                        <Key className="w-3.5 h-3.5 text-slate-500" />
                                        <span>
                                            {editingStaff.role === 'superadmin'
                                                ? 'Ganti Kata Sandi Superadmin (Kosongkan jika tidak ingin diubah)'
                                                : 'Ganti Kata Sandi (Kosongkan jika tidak diubah)'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <input
                                            type="password"
                                            minLength={8}
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                            placeholder="Kata sandi baru (min 8 karakter)..."
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                        <input
                                            type="password"
                                            minLength={8}
                                            value={form.password_confirmation}
                                            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                            placeholder="Konfirmasi sandi baru..."
                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setEditingStaff(null)}
                                        className="h-9 px-4 text-xs font-semibold cursor-pointer"
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white h-9 px-5 text-xs font-semibold gap-1.5 cursor-pointer"
                                    >
                                        {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ================= MODAL KONFIRMASI HAPUS STAFF ================= */}
            <AnimatePresence>
                {deleteModalStaff && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4"
                        >
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-sm">Hapus Akun Staff?</h3>
                                    <p className="text-xs text-slate-500">Tindakan ini tidak dapat dibatalkan.</p>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed">
                                Apakah Anda yakin ingin menghapus akun staff <strong>"{deleteModalStaff.name}"</strong> ({deleteModalStaff.email})? Pengguna ini tidak akan dapat login lagi ke console internal SaaS.
                            </p>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeleteModalStaff(null)}
                                    className="h-8 text-xs font-semibold"
                                >
                                    Batal
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    disabled={isSubmitting}
                                    onClick={confirmDelete}
                                    className="h-8 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                    {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Akun'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AppLayout>
    );
}
