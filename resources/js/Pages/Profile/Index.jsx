import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import AppLayout from '../../Layouts/AppLayout';
import { Button } from '../../Components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../Components/ui/card';
import { Separator } from '../../Components/ui/separator';
import {
    User,
    Mail,
    Phone,
    Building2,
    Lock,
    ShieldCheck,
    ChevronRight,
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
            <Head title="Pengaturan Akun & Keamanan — SAPA" />

            <div className="flex flex-col gap-6 pb-12 max-w-5xl font-sans antialiased text-[#1f1f1f]">
                {/* ================= 1. MANTIS BREADCRUMB & HEADER ================= */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#e6ebf1]">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#8c8c8c] font-medium">
                            <Link href="/dashboard" className="hover:text-[#1677ff] transition-colors">
                                Dashboard
                            </Link>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#262626]">Workspace</span>
                            <ChevronRight className="size-3 text-[#bfbfbf]" />
                            <span className="text-[#1677ff] font-semibold">Profil & Keamanan</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#262626]">
                            Pengaturan Profil Akun &amp; Keamanan
                        </h1>
                        <p className="text-xs text-[#8c8c8c]">
                            Kelola identitas penanggung jawab, informasi workspace bisnis, dan kredensial keamanan akun Anda.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Profile Form (2 cols) */}
                    <div className="md:col-span-2 flex flex-col gap-6">
                        {/* Profile Info Card */}
                        <Card>
                            <CardHeader className="border-b border-[#f0f0f0]">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center">
                                        <User className="size-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <CardTitle className="text-sm font-bold">
                                            Informasi Akun &amp; Perusahaan
                                        </CardTitle>
                                        <CardDescription>
                                            Perbarui nama penanggung jawab dan identitas nama workspace
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-5">
                                <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-xs">
                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Nama Penanggung Jawab</label>
                                        <div className="relative">
                                            <User className="size-4 text-[#8c8c8c] absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData('name', e.target.value)}
                                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                        {profileErrors.name && <p className="text-[#ff4d4f] text-[11px] mt-1">{profileErrors.name}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold text-[#595959] mb-1.5">Alamat Email Bisnis</label>
                                            <div className="relative">
                                                <Mail className="size-4 text-[#8c8c8c] absolute left-3 top-2.5" />
                                                <input
                                                    type="email"
                                                    value={profileData.email}
                                                    onChange={(e) => setProfileData('email', e.target.value)}
                                                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none transition-all"
                                                    required
                                                />
                                            </div>
                                            {profileErrors.email && <p className="text-[#ff4d4f] text-[11px] mt-1">{profileErrors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-[#595959] mb-1.5">Nomor WhatsApp Admin</label>
                                            <div className="relative">
                                                <Phone className="size-4 text-[#8c8c8c] absolute left-3 top-2.5" />
                                                <input
                                                    type="text"
                                                    value={profileData.phone}
                                                    onChange={(e) => setProfileData('phone', e.target.value)}
                                                    placeholder="+6281234567890"
                                                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#d9d9d9] text-xs font-mono text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Nama Perusahaan / Organisasi</label>
                                        <div className="relative">
                                            <Building2 className="size-4 text-[#8c8c8c] absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                value={profileData.workspace_name}
                                                onChange={(e) => setProfileData('workspace_name', e.target.value)}
                                                className="w-full h-9 pl-9 pr-3 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Separator className="bg-[#f0f0f0]" />

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={processingProfile}
                                            className="h-9 px-4 bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                        >
                                            {processingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Password Card */}
                        <Card>
                            <CardHeader className="border-b border-[#f0f0f0]">
                                <div className="flex items-center gap-2.5">
                                    <div className="size-8 rounded-lg bg-[#fffbe6] text-[#faad14] border border-[#ffe58f] flex items-center justify-center">
                                        <Lock className="size-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                        <CardTitle className="text-sm font-bold">
                                            Perbarui Kata Sandi
                                        </CardTitle>
                                        <CardDescription>
                                            Pastikan akun Anda menggunakan kombinasi kata sandi yang kuat
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-5">
                                <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4 text-xs">
                                    <div>
                                        <label className="block font-semibold text-[#595959] mb-1.5">Kata Sandi Saat Ini</label>
                                        <input
                                            type="password"
                                            value={passwordData.current_password}
                                            onChange={(e) => setPasswordData('current_password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full h-9 px-3 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none transition-all"
                                            required
                                        />
                                        {passwordErrors.current_password && (
                                            <p className="text-[#ff4d4f] text-[11px] mt-1">{passwordErrors.current_password}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block font-semibold text-[#595959] mb-1.5">Kata Sandi Baru</label>
                                            <input
                                                type="password"
                                                value={passwordData.password}
                                                onChange={(e) => setPasswordData('password', e.target.value)}
                                                placeholder="Min. 6 karakter"
                                                className="w-full h-9 px-3 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none transition-all"
                                                required
                                            />
                                            {passwordErrors.password && (
                                                <p className="text-[#ff4d4f] text-[11px] mt-1">{passwordErrors.password}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block font-semibold text-[#595959] mb-1.5">Konfirmasi Kata Sandi</label>
                                            <input
                                                type="password"
                                                value={passwordData.password_confirmation}
                                                onChange={(e) => setPasswordData('password_confirmation', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full h-9 px-3 rounded-lg border border-[#d9d9d9] text-xs text-[#262626] focus:border-[#1677ff] focus:ring-2 focus:ring-[#1677ff]/10 focus:outline-none transition-all"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <Separator className="bg-[#f0f0f0]" />

                                    <div className="flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={processingPassword}
                                            className="h-9 px-4 bg-[#1677ff] hover:bg-[#0958d9] text-white text-xs font-semibold rounded-lg cursor-pointer"
                                        >
                                            {processingPassword ? 'Memperbarui...' : 'Ganti Kata Sandi'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Account Status Card (1 col) */}
                    <div className="flex flex-col gap-4">
                        <Card>
                            <CardContent className="p-5 flex flex-col gap-4">
                                <div className="flex items-center gap-3.5">
                                    <div className="size-12 rounded-full bg-[#e6f4ff] text-[#1677ff] border border-[#91caff] flex items-center justify-center font-bold text-lg shrink-0">
                                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-sm text-[#262626] truncate">{user.name}</h3>
                                        <p className="text-xs text-[#8c8c8c] truncate">{user.email}</p>
                                        <span className="text-[11px] font-semibold text-[#52c41a] mt-0.5 block">
                                            {user.role === 'superadmin' ? 'Superadmin' : 'Client Owner'}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-[#fafafb] rounded-lg border border-[#f0f0f0] text-xs flex flex-col gap-2.5 text-[#595959]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#8c8c8c]">ID Workspace:</span>
                                        <span className="font-mono font-bold text-[#262626]">#{workspace.id}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#8c8c8c]">Status Akun:</span>
                                        <span className="font-semibold text-[#52c41a]">Aktif &amp; Terverifikasi</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[#8c8c8c]">Keamanan:</span>
                                        <span className="font-semibold text-[#1677ff]">Enkripsi SHA-256</span>
                                    </div>
                                </div>

                                <div className="p-3 bg-[#e6f4ff] rounded-lg border border-[#91caff] text-xs flex items-start gap-2.5">
                                    <ShieldCheck className="size-4 shrink-0 mt-0.5 text-[#1677ff]" />
                                    <p className="text-[11px] leading-relaxed text-[#262626]">
                                        Akun dilindungi oleh enkripsi sesi standar enterprise <strong>SAPA</strong>.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
