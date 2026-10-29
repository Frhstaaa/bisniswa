import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, Zap, Copy, Check, MessageSquare } from 'lucide-react';
import { Button } from '../../Components/ui/button';

export default function ForgotPassword() {
    const { flash = {} } = usePage().props;
    const [copied, setCopied] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    // Real-time Email Validity Checker state
    const [emailCheck, setEmailCheck] = useState({
        status: 'idle', // 'idle' | 'checking' | 'valid' | 'invalid'
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

        setEmailCheck({ status: 'checking', message: 'Memeriksa domain...' });

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
                        message: 'Domain email aktif & valid',
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
        post('/forgot-password');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900"
        >
            <Head title="Lupa Kata Sandi — MARDIRA WA" />

            <div className="w-full max-w-md mx-auto text-center space-y-3">
                <Link href="/" className="inline-flex items-center gap-3 group">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1 transition-transform group-hover:scale-105">
                        <img
                            src="/images/logo-mardira.jpg"
                            alt="Politeknik Mardira Indonesia"
                            className="h-full w-full object-contain"
                        />
                    </div>
                    <div className="text-left">
                        <span className="text-xl font-extrabold tracking-tight text-slate-900">
                            MARDIRA<span className="text-amber-500">WA</span>
                        </span>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                            Politeknik Mardira Indonesia
                        </p>
                    </div>
                </Link>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Atur Ulang Kata Sandi
                </h2>
                <p className="text-xs text-slate-500 px-4">
                    Instruksi dan tautan reset password akan dikirimkan secara aman ke email Anda.
                </p>
            </div>

            <div className="mt-6 w-full max-w-md mx-auto">
                <div className="bg-white border border-slate-200/80 py-6 px-5 sm:py-8 sm:px-8 shadow-card rounded-2xl space-y-5">
                    {flash.error && (
                        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5 animate-fade-in">
                            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-950">Gagal Mengirim Tautan</p>
                                <p className="text-[11px] text-red-800 mt-0.5">{flash.error}</p>
                            </div>
                        </div>
                    )}

                    {flash.status && (
                        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5 animate-fade-in">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-emerald-950">Email Instruksi Dikirim</p>
                                <p className="text-[11px] text-emerald-800 mt-0.5">{flash.status}</p>
                            </div>
                        </div>
                    )}

                    {flash.wa_sent && (
                        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-950 flex items-start gap-2.5 animate-fade-in">
                            <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-emerald-950">Notifikasi WhatsApp Terkirim!</p>
                                <p className="text-[11px] text-emerald-800 mt-0.5">
                                    Tautan reset juga berhasil dikirimkan ke nomor WhatsApp terdaftar Anda ({flash.user_phone || 'terdaftar'}). Silakan periksa pesan masuk WhatsApp Anda.
                                </p>
                            </div>
                        </div>
                    )}

                    {flash.preview_url && (
                        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs text-white space-y-2.5 shadow-sm animate-fade-in">
                            <div className="flex items-center justify-between text-[11px]">
                                <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                                    <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Mode Uji Langsung (Testing Preview):
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">MAIL_MAILER=log</span>
                            </div>
                            <p className="text-[11px] text-slate-300 leading-relaxed">
                                Karena aplikasi berjalan di environment lokal (email dicatat di log), Anda dapat langsung membuka atau menyalin formulir reset password melalui tombol di bawah:
                            </p>
                            <div className="flex flex-col sm:flex-row gap-2 pt-1">
                                <a
                                    href={flash.preview_url}
                                    className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
                                >
                                    <span>Buka Halaman Reset Password Sekarang →</span>
                                </a>
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigator.clipboard.writeText(flash.preview_url);
                                        setCopied(true);
                                        setTimeout(() => setCopied(false), 2000);
                                    }}
                                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                                            <span>Tersalin!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                                            <span>Salin Tautan</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="block font-medium text-slate-700">
                                    Alamat Email Akun Anda
                                </label>
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
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="nama@perusahaan.com / kampus.ac.id"
                                    className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border text-xs transition-colors shadow-2xs ${
                                        emailCheck.status === 'valid'
                                            ? 'border-emerald-500 bg-emerald-50/20 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                                            : emailCheck.status === 'invalid'
                                            ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                            : 'border-slate-200 focus:border-emerald-600 focus:outline-none'
                                    }`}
                                    required
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-600 text-[11px] mt-1 font-medium">{errors.email}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={processing}
                            className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-all"
                        >
                            <span>{processing ? 'Mengirim Instruksi...' : 'Kirim Tautan Reset Kata Sandi'}</span>
                            <ArrowRight className="w-4 h-4 ml-1.5" />
                        </Button>
                    </form>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Kembali ke Halaman Masuk</span>
                        </Link>

                        <Link
                            href="/register"
                            className="font-semibold text-emerald-700 hover:underline"
                        >
                            Daftar Akun Baru
                        </Link>
                    </div>
                </div>

                <div className="mt-4 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Layanan Otentikasi Terenkripsi MARDIRA WA</span>
                </div>
            </div>
        </motion.div>
    );
}
