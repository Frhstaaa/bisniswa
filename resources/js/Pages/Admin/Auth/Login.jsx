import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Lock, Mail, ArrowRight, CheckCircle2, AlertCircle, Shield, ShieldCheck, KeyRound } from 'lucide-react';

export default function AdminLogin() {
    const { flash = {} } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/login');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased text-slate-100 relative overflow-hidden"
        >
            {/* Background ambient security glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-10 right-10 w-[350px] h-[250px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <Head title="Portal Admin Sistem — MARDIRA WA" />

            <div className="w-full max-w-md mx-auto text-center space-y-3 z-10">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 p-2 shadow-lg shadow-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                        <ShieldCheck className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-left">
                        <span className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                            MARDIRA<span className="text-blue-400">WA</span>
                            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30">
                                Admin Portal
                            </span>
                        </span>
                        <p className="text-[10.5px] font-medium text-slate-400 tracking-wider uppercase">Politeknik Mardira Indonesia</p>
                    </div>
                </Link>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
                    Portal Administrasi Sistem
                </h2>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span>Area Akses Terbatas Khusus Superadmin & Tim Internal SaaS</span>
                </div>
            </div>

            <div className="mt-6 sm:mt-8 w-full max-w-md mx-auto z-10">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-6 px-4 sm:py-8 sm:px-8 shadow-2xl rounded-2xl space-y-5">
                    {flash.success && (
                        <div className="p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5 animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-emerald-100">Berhasil</p>
                                <p className="text-[11px] text-emerald-300 mt-0.5">{flash.success}</p>
                            </div>
                        </div>
                    )}

                    {flash.error && (
                        <div className="p-3.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-200 flex items-start gap-2.5 animate-fade-in">
                            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-rose-100">Akses Ditolak</p>
                                <p className="text-[11px] text-rose-300 mt-0.5">{flash.error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div>
                            <label className="block font-semibold text-slate-300 mb-1.5">Email Administrator</label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="admin@kirimwa.pro"
                                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-slate-100 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                                    required
                                    autoFocus
                                />
                            </div>
                            {errors.email && <p className="text-rose-400 text-[11px] mt-1.5">{errors.email}</p>}
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="font-semibold text-slate-300">Kata Sandi</label>
                            </div>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950/80 text-slate-100 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                                    required
                                />
                            </div>
                            {errors.password && <p className="text-rose-400 text-[11px] mt-1.5">{errors.password}</p>}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                                <input
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-[11px]">Ingat sesi login administrator</span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 uppercase tracking-wider font-black shadow-lg shadow-blue-500/25 text-white text-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                            <KeyRound className="w-4 h-4 text-white" />
                            <span>{processing ? 'Memverifikasi Akses...' : 'Autentikasi Administrator'}</span>
                            <ArrowRight className="w-4 h-4 text-white" />
                        </button>
                    </form>

                    <div className="pt-4 border-t border-slate-800 text-center text-xs text-slate-400 space-y-1">
                        <p>Bukan administrator sistem?</p>
                        <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1">
                            <span>Masuk ke Portal Klien / Tenant</span>
                            <span>&rarr;</span>
                        </Link>
                    </div>
                </div>

                <div className="mt-6 text-center text-[10.5px] text-slate-600">
                    Sistem Terproteksi Enkripsi Multi-Guard • Politeknik Mardira Indonesia
                </div>
            </div>
        </motion.div>
    );
}
