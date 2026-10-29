import React, { useState, useEffect } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, Building, Phone, User, Check, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function Register({ plans, selectedPlanSlug }) {
    const selectedPlan = plans?.find((p) => p.slug === selectedPlanSlug) || plans?.[1] || plans?.[0];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '+628',
        workspace_name: '',
        password: '',
        password_confirmation: '',
        plan_id: selectedPlan ? selectedPlan.id : 2,
    });

    // Real-time Email Validity Checker state
    const [emailCheck, setEmailCheck] = useState({
        status: 'idle',
        message: '',
    });

    useEffect(() => {
        const email = data.email.trim();
        if (!email || !email.includes('@')) {
            setEmailCheck({ status: 'idle', message: '' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailCheck({ status: 'invalid', message: 'Format email belum lengkap' });
            return;
        }

        setEmailCheck({ status: 'checking', message: 'Memverifikasi domain...' });

        const timer = setTimeout(async () => {
            try {
                const res = await fetch('/api/check-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ email }),
                });
                const result = await res.json();
                if (result.valid) {
                    setEmailCheck({
                        status: 'valid',
                        message: result.is_registered ? 'Email sudah terdaftar (silakan masuk)' : 'Domain email aktif & valid',
                    });
                } else {
                    setEmailCheck({
                        status: 'invalid',
                        message: result.message || 'Alamat email tidak valid',
                    });
                }
            } catch (err) {
                setEmailCheck({ status: 'idle', message: '' });
            }
        }, 450);

        return () => clearTimeout(timer);
    }, [data.email]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased"
        >
            <Head title="Daftar Akun & Langganan — Mardira WA Gateway" />

            <div className="w-full max-w-xl mx-auto text-center space-y-3">
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
                <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Pendaftaran Akun Bisnis & Langganan API</h2>
                <p className="text-xs text-[#64748b] px-4">
                    Dapatkan akses instan ke REST API Key dan BisnisWA UltraSync Engine setelah pendaftaran
                </p>
            </div>

            <div className="mt-6 sm:mt-8 w-full max-w-xl mx-auto">
                <div className="bg-white border border-[#e2e8f0] py-6 px-5 sm:py-8 sm:px-8 shadow-card rounded-2xl space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        {/* Plan Selector Radios */}
                        <div>
                            <label className="block font-semibold text-[#334155] mb-1.5">Pilih Paket Langganan:</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {plans && plans.map((plan) => (
                                    <div
                                        key={plan.id}
                                        onClick={() => setData('plan_id', plan.id)}
                                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                            data.plan_id === plan.id
                                                ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600'
                                                : 'border-[#e2e8f0] hover:border-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#0f172a] text-xs">{plan.name}</span>
                                            {data.plan_id === plan.id && (
                                                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                                    <Check className="w-2.5 h-2.5" />
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-emerald-700 font-black mt-1">
                                            Rp {parseInt(plan.price_monthly).toLocaleString('id-ID')} /bln
                                        </p>
                                        <p className="text-[10px] text-[#64748b] mt-0.5">
                                            {plan.limits?.max_devices} Device • {plan.limits?.monthly_message_quota?.toLocaleString()} Kuota
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Workspace Name & Personal Name */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-[#334155] mb-1">Nama Perusahaan / Bisnis</label>
                                <div className="relative">
                                    <Building className="w-4 h-4 text-[#94a3b8] absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        value={data.workspace_name}
                                        onChange={(e) => setData('workspace_name', e.target.value)}
                                        placeholder="PT Digital Niaga"
                                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-emerald-600 focus:outline-none transition-colors"
                                        required
                                    />
                                </div>
                                {errors.workspace_name && <p className="text-red-500 text-[11px] mt-1">{errors.workspace_name}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold text-[#334155] mb-1">Nama Penanggung Jawab</label>
                                <div className="relative">
                                    <User className="w-4 h-4 text-[#94a3b8] absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Budi Santoso"
                                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-emerald-600 focus:outline-none transition-colors"
                                        required
                                    />
                                </div>
                                {errors.name && <p className="text-red-500 text-[11px] mt-1">{errors.name}</p>}
                            </div>
                        </div>

                        {/* Email & Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block font-semibold text-[#334155]">Email Bisnis</label>
                                    {emailCheck.status === 'checking' && (
                                        <span className="text-[10px] text-slate-400 font-mono animate-pulse">Memverifikasi...</span>
                                    )}
                                    {emailCheck.status === 'valid' && (
                                        <span className="text-[10px] text-emerald-700 font-semibold inline-flex items-center gap-0.5">
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                            <span>{emailCheck.message}</span>
                                        </span>
                                    )}
                                    {emailCheck.status === 'invalid' && (
                                        <span className="text-[10px] text-red-600 font-semibold inline-flex items-center gap-0.5">
                                            <AlertCircle className="w-3 h-3 text-red-500" />
                                            <span>{emailCheck.message}</span>
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <Mail className="w-4 h-4 text-[#94a3b8] absolute left-3 top-3" />
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="budi@digitalniaga.id"
                                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs transition-colors shadow-2xs ${
                                            emailCheck.status === 'valid'
                                                ? 'border-emerald-500 bg-emerald-50/20 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                                                : emailCheck.status === 'invalid'
                                                ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                                : 'border-[#e2e8f0] focus:border-emerald-600 focus:outline-none'
                                        }`}
                                        required
                                    />
                                </div>
                                {errors.email && <p className="text-red-500 text-[11px] mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block font-semibold text-[#334155] mb-1">Nomor WhatsApp</label>
                                <div className="relative">
                                    <Phone className="w-4 h-4 text-[#94a3b8] absolute left-3 top-3" />
                                    <input
                                        type="text"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+6281234567890"
                                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs font-mono focus:border-emerald-600 focus:outline-none transition-colors"
                                        required
                                    />
                                </div>
                                {errors.phone && <p className="text-red-500 text-[11px] mt-1">{errors.phone}</p>}
                            </div>
                        </div>

                        {/* Password & Confirmation */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block font-semibold text-[#334155] mb-1">Kata Sandi (Min. 6 Karakter)</label>
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

                            <div>
                                <label className="block font-semibold text-[#334155] mb-1">Konfirmasi Sandi</label>
                                <div className="relative">
                                    <Lock className="w-4 h-4 text-[#94a3b8] absolute left-3 top-3" />
                                    <input
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-[#e2e8f0] text-xs focus:border-emerald-600 focus:outline-none transition-colors"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* API Access Guarantee Notice */}
                        <div className="p-3 bg-[#fef9c3] rounded-xl border border-[#fde047] text-xs text-[#854d0e] flex items-start gap-2.5">
                            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
                            <p className="text-[11px] leading-relaxed text-[#334155]">
                                Setelah mendaftar, token <strong className="text-emerald-700">REST API Key</strong> dan kuota pengiriman pesan akan otomatis di-generate sehingga aplikasi Anda dapat langsung dihubungkan.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="btn-press w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                            <span>{processing ? 'Memproses Akun & API...' : 'Daftar & Dapatkan API Key Sekarang →'}</span>
                        </button>
                    </form>

                    <div className="pt-4 border-t border-[#e2e8f0] text-center text-xs text-[#64748b]">
                        Sudah memiliki akun?{' '}
                        <Link href="/login" className="font-bold text-emerald-700 hover:underline">
                            Masuk ke Workspace
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
