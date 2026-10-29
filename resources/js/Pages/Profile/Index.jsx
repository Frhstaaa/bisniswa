import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../Components/ui/card';
import { Button } from '../../Components/ui/button';
import { Badge } from '../../Components/ui/badge';
import {
    User,
    Mail,
    Phone,
    Building2,
    Lock,
    Shield,
    CheckCircle2,
    Key,
    ShieldCheck,
} from 'lucide-react';

export default function ProfileIndex({ user, workspace }) {
    const { data: profileData, setData: setProfileData, post: postProfile, processing: processingProfile, errors: profileErrors } = useForm({
        name: user.name || '',
        email: user.email || '',
        phone: workspace.phone || '',
        workspace_name: workspace.name || '',
    });

    const { data: passwordData, setData: setPasswordData, post: postPassword, processing: processingPassword, errors: passwordErrors, reset: resetPassword } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleUpdateProfile = (e) => {
        e.preventDefault();
        postProfile('/profile', { preserveScroll: true });
    };

    const handleUpdatePassword = (e) => {
        e.preventDefault();
        postPassword('/profile/password', {
            preserveScroll: true,
            onSuccess: () => resetPassword(),
        });
    };

    return (
        <AppLayout title="Pengaturan Profil">
            <Head title="Pengaturan Akun & Keamanan — MARDIRA WA" />

            <div className="space-y-6 max-w-4xl animate-fade-in-up">
                {/* Header Page */}
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                            Pengaturan Profil Akun & Keamanan
                        </h1>
                        <Badge variant="navy" className="text-[10px] font-bold">
                            WORKSPACE #{workspace.id}
                        </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Kelola identitas penanggung jawab, informasi workspace bisnis, dan kredensial keamanan akun Anda.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Profile Form (2 cols) */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Profile Info Card */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Card className="border-slate-200 shadow-xs">
                                <CardHeader className="pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-emerald-700" />
                                        <CardTitle className="text-sm font-bold text-slate-900">
                                            Informasi Akun & Perusahaan
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-xs text-slate-500">
                                        Perbarui nama penanggung jawab dan identitas nama workspace
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-5">
                                    <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">Nama Penanggung Jawab</label>
                                            <div className="relative">
                                                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                                <input
                                                    type="text"
                                                    value={profileData.name}
                                                    onChange={(e) => setProfileData('name', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                            {profileErrors.name && <p className="text-red-500 text-[11px] mt-1">{profileErrors.name}</p>}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1">Alamat Email Bisnis</label>
                                                <div className="relative">
                                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                                    <input
                                                        type="email"
                                                        value={profileData.email}
                                                        onChange={(e) => setProfileData('email', e.target.value)}
                                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                        required
                                                    />
                                                </div>
                                                {profileErrors.email && <p className="text-red-500 text-[11px] mt-1">{profileErrors.email}</p>}
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1">Nomor WhatsApp Admin</label>
                                                <div className="relative">
                                                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                                    <input
                                                        type="text"
                                                        value={profileData.phone}
                                                        onChange={(e) => setProfileData('phone', e.target.value)}
                                                        placeholder="+6281234567890"
                                                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-mono focus:border-emerald-600 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">Nama Perusahaan / Organisasi</label>
                                            <div className="relative">
                                                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                                <input
                                                    type="text"
                                                    value={profileData.workspace_name}
                                                    onChange={(e) => setProfileData('workspace_name', e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <Button
                                                type="submit"
                                                disabled={processingProfile}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                                            >
                                                {processingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>

                        {/* Password Card */}
                        <motion.div
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Card className="border-slate-200 shadow-xs">
                                <CardHeader className="pb-3 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4 text-emerald-700" />
                                        <CardTitle className="text-sm font-bold text-slate-900">
                                            Perbarui Kata Sandi
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-xs text-slate-500">
                                        Pastikan akun Anda menggunakan kombinasi kata sandi yang kuat
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-5">
                                    <form onSubmit={handleUpdatePassword} className="space-y-3.5 text-xs">
                                        <div>
                                            <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Saat Ini</label>
                                            <input
                                                type="password"
                                                value={passwordData.current_password}
                                                onChange={(e) => setPasswordData('current_password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                required
                                            />
                                            {passwordErrors.current_password && (
                                                <p className="text-red-500 text-[11px] mt-1">{passwordErrors.current_password}</p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1">Kata Sandi Baru</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.password}
                                                    onChange={(e) => setPasswordData('password', e.target.value)}
                                                    placeholder="Min. 6 karakter"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                    required
                                                />
                                                {passwordErrors.password && (
                                                    <p className="text-red-500 text-[11px] mt-1">{passwordErrors.password}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="block font-semibold text-slate-700 mb-1">Konfirmasi Kata Sandi</label>
                                                <input
                                                    type="password"
                                                    value={passwordData.password_confirmation}
                                                    onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:border-emerald-600 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-2">
                                            <Button
                                                type="submit"
                                                disabled={processingPassword}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4"
                                            >
                                                {processingPassword ? 'Memperbarui...' : 'Ganti Kata Sandi'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Right Column: Account Status Card (1 col) */}
                    <div className="space-y-4">
                        <motion.div
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.15 }}
                        >
                            <Card className="border-slate-200 shadow-xs p-5 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-emerald-100 flex items-center justify-center font-black text-lg shadow-xs">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-sm text-[#0f172a]">{user.name}</h3>
                                        <p className="text-xs text-slate-500">{user.email}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            {user.role === 'superadmin' ? 'SUPERADMIN' : 'CLIENT OWNER'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">ID Workspace:</span>
                                        <span className="font-mono font-bold text-slate-900">#{workspace.id}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Status Akun:</span>
                                        <span className="font-bold text-emerald-700">Aktif & Terverifikasi</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-500">Keamanan:</span>
                                        <span className="font-bold text-slate-800">Enkripsi SHA-256</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-[#fef9c3] rounded-xl border border-[#fde047] text-xs text-[#854d0e] flex items-start gap-2">
                                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                                    <p className="text-[11px] leading-relaxed text-[#334155]">
                                        Akun dilindungi oleh enkripsi sesi standar enterprise <strong>Politeknik Mardira Indonesia</strong>.
                                    </p>
                                </div>
                            </Card>
                        </motion.div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
