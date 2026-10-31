import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../../Components/ui/button';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token || '',
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/reset-password');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen bg-white bg-grid-pattern flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900"
        >
            <Head title="Buat Kata Sandi Baru — MARDIRA WA" />

            <div className="w-full max-w-md mx-auto text-center space-y-3">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <img
                        src="/images/logo.png"
                        alt="Politeknik Mardira Indonesia"
                        className="h-11 sm:h-12 w-auto object-contain shrink-0 transition-transform group-hover:scale-105"
                    />
                    <div className="text-left">
                        <span className="text-xl font-black tracking-tight text-slate-900">
                            MARDIRA<span className="text-[#1e50ff]">WA</span>
                        </span>
                        <p className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase">
                            Politeknik Mardira Indonesia
                        </p>
                    </div>
                </Link>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Buat Kata Sandi Baru
                </h2>
                <p className="text-xs text-slate-500 px-4">
                    Masukkan kata sandi baru yang kuat untuk akun MARDIRA WA Anda.
                </p>
            </div>

            <div className="mt-6 w-full max-w-md mx-auto">
                <div className="bg-white border border-slate-200/80 py-6 px-5 sm:py-8 sm:px-8 shadow-card rounded-2xl space-y-5">
                    {(errors.email || errors.token) && (
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5 animate-fade-in">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-950">Gagal Mengatur Kata Sandi</p>
                                <p className="text-[11px] text-red-800 mt-0.5">{errors.email || errors.token}</p>
                                <div className="mt-2">
                                    <Link href="/forgot-password" className="text-[11px] font-bold text-red-700 underline hover:text-red-900">
                                        Minta tautan reset baru →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <input type="hidden" value={data.token} />

                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Alamat Email Akun
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@mardira.ac.id"
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#1e50ff] focus:ring-1 focus:ring-[#1e50ff] focus:outline-none transition-colors shadow-2xs"
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.email}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="Minimal 6 karakter"
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#1e50ff] focus:ring-1 focus:ring-[#1e50ff] focus:outline-none transition-colors shadow-2xs"
                                    required
                                />
                            </div>
                            {errors.password && (
                                <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 mb-1">
                                Konfirmasi Kata Sandi Baru
                            </label>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    placeholder="Ulangi kata sandi baru"
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-[#1e50ff] focus:ring-1 focus:ring-[#1e50ff] focus:outline-none transition-colors shadow-2xs"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full h-10 rounded-xl bg-[#1e50ff] hover:bg-[#153ec7] uppercase tracking-wider font-extrabold shadow-[0_8px_20px_-4px_rgba(30,80,255,0.4)] rounded-full text-white font-semibold text-xs shadow-xs transition-all"
                        >
                            <span>{processing ? 'Menyimpan Sandi...' : 'Perbarui Kata Sandi Akun'}</span>
                            <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                    </form>

                    <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                        Ingat kata sandi lama Anda?{' '}
                        <Link href="/login" className="font-semibold text-[#1e50ff] hover:underline">
                            Masuk ke Akun
                        </Link>
                    </div>
                </div>

                <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1e50ff]" />
                    <span>Layanan Otentikasi Terenkripsi MARDIRA WA</span>
                </div>
            </div>
        </motion.div>
    );
}
