import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Login() {
    const { flash = {} } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased"
        >
            <Head title="Masuk — Mardira WA Gateway" />

            <div className="w-full max-w-md mx-auto text-center space-y-3">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white border border-[#e2e8f0] shadow-xs flex items-center justify-center p-1 transition-transform group-hover:scale-105">
                        <img
                            src="/images/logo-mardira.jpg"
                            alt="Politeknik Mardira Indonesia"
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div className="text-left">
                        <span className="text-xl font-black tracking-tight text-emerald-700">MARDIRA<span className="text-amber-500">WA</span></span>
                        <p className="text-[10px] font-bold text-[#64748b] tracking-wider uppercase">Politeknik Mardira Indonesia</p>
                    </div>
                </Link>
                <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Masuk ke Workspace Anda</h2>
                <p className="text-xs text-[#64748b] px-4">Kelola perangkat WhatsApp, broadcast massal, dan token REST API</p>
            </div>

            <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto">
                <div className="bg-white border border-[#e2e8f0] py-6 px-5 sm:py-8 sm:px-8 shadow-card rounded-2xl space-y-5">
                    {flash.success && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-emerald-950">Berhasil</p>
                                <p className="text-[11px] text-emerald-800 mt-0.5">{flash.success}</p>
                            </div>
                        </div>
                    )}

                    {flash.error && (
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5 animate-fade-in">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-950">Terjadi Kesalahan</p>
                                <p className="text-[11px] text-red-800 mt-0.5">{flash.error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div>
                            <label className="block font-semibold text-[#334155] mb-1">Alamat Email</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3 top-3" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@perusahaan.com"
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-emerald-600 focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                            {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="font-semibold text-[#334155]">Kata Sandi</label>
                                <Link href="/forgot-password" className="text-[11px] text-emerald-700 hover:underline font-semibold">
                                    Lupa sandi?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3 top-3" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-emerald-600 focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                            {errors.password && <p className="text-red-500 text-[11px] mt-1">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-[#64748b]">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-[#cbd5e1] text-emerald-600 focus:ring-emerald-500"
                                />
                                <span>Ingat sesi masuk</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-press w-full py-3 sm:py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <span>{processing ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
                            <ArrowRight className="w-4 h-4 text-amber-300" />
                        </button>
                    </form>

                    <div className="pt-4 border-t border-[#e2e8f0] text-center text-xs text-[#64748b]">
                        Belum memiliki akun bisnis?{' '}
                        <Link href="/register" className="font-bold text-emerald-700 hover:underline">
                            Daftar & Mulai Langganan
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
