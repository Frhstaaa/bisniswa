import React, { useState, useEffect } from 'react';
import { router, useForm, usePage } from '@inertiajs/react';
import {
    X,
    Mail,
    Lock,
    Building2,
    Phone,
    User,
    Check,
    ArrowRight,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Zap,
    Copy,
    MessageSquare,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import ModalPortal from './ui/ModalPortal';

const DEFAULT_FALLBACK_PLANS = [
    {
        id: 1,
        name: 'Starter Lite',
        slug: 'starter',
        price_monthly: 99000,
        limits: { monthly_message_quota: 5000, max_devices: 1 },
    },
    {
        id: 3,
        name: 'Pro Bisnis',
        slug: 'pro-bisnis',
        price_monthly: 179000,
        limits: { monthly_message_quota: 15000, max_devices: 3 },
    },
    {
        id: 2,
        name: 'Enterprise Pro',
        slug: 'enterprise-pro',
        price_monthly: 299000,
        limits: { monthly_message_quota: 50000, max_devices: 5 },
    },
];

export default function AuthModal({
    isOpen,
    onClose,
    initialMode = 'register',
    initialPlanId = null,
    plans = [],
}) {
    const safePlans = Array.isArray(plans) && plans.length > 0 ? plans : DEFAULT_FALLBACK_PLANS;
    const { flash = {} } = usePage().props;
    const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'forgot_success'
    const [sentEmail, setSentEmail] = useState('');
    const [directPreviewUrl, setDirectPreviewUrl] = useState('');
    const [copied, setCopied] = useState(false);

    // Form for Registration
    const registerForm = useForm({
        name: '',
        email: '',
        phone: '+628',
        workspace_name: '',
        password: '',
        password_confirmation: '',
        plan_id: initialPlanId || (safePlans[0]?.id || 1),
    });

    // Form for Login
    const loginForm = useForm({
        email: '',
        password: '',
        remember: true,
    });

    // Form for Forgot Password
    const forgotForm = useForm({
        email: '',
    });

    // Real-time Email Validity Checker state
    const [emailCheck, setEmailCheck] = useState({
        status: 'idle', // 'idle' | 'checking' | 'valid' | 'invalid'
        message: '',
    });

    // Real-time verification when user types in registration email
    useEffect(() => {
        const email = registerForm.data.email.trim();
        if (!email || !email.includes('@')) {
            setEmailCheck({ status: 'idle', message: '' });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setEmailCheck({ status: 'invalid', message: 'Format alamat email belum lengkap' });
            return;
        }

        setEmailCheck({ status: 'checking', message: 'Memeriksa validitas domain...' });

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
                        message: result.is_registered ? 'Email ini sudah terdaftar' : 'Domain email aktif & valid',
                        isRegistered: result.is_registered,
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
    }, [registerForm.data.email]);

    // Sync mode and plan when initial props change
    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            if (initialPlanId) {
                registerForm.setData('plan_id', initialPlanId);
            }
        }
    }, [isOpen, initialMode, initialPlanId]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const selectedPlan = safePlans.find((p) => p.id === parseInt(registerForm.data.plan_id)) || safePlans[0] || {};

    const handleLoginSubmit = (e) => {
        e.preventDefault();
        loginForm.post('/login', {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const handleRegisterSubmit = (e) => {
        e.preventDefault();
        registerForm.post('/register', {
            preserveScroll: true,
            onSuccess: () => onClose(),
        });
    };

    const handleForgotSubmit = (e) => {
        e.preventDefault();
        const email = forgotForm.data.email;
        forgotForm.post('/forgot-password', {
            preserveScroll: true,
            onSuccess: (page) => {
                setSentEmail(email);
                if (page?.props?.flash?.preview_url) {
                    setDirectPreviewUrl(page.props.flash.preview_url);
                }
                setMode('forgot_success');
            },
        });
    };

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-fade-in"
                onClick={onClose}
            >
                {/* Modal Card */}
                <div
                    className={`relative w-full ${
                        mode === 'register' ? 'max-w-xl' : 'max-w-md'
                    } bg-white rounded-2xl border border-slate-200/80 shadow-2xl overflow-hidden z-10 transition-all max-h-[92vh] flex flex-col my-auto text-left`}
                    onClick={(e) => e.stopPropagation()}
                >

                {/* Modal Top Header Bar */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <img
                            src="/images/logo-mardira.jpg"
                            alt="Politeknik Mardira Indonesia"
                            className="h-7 w-7 rounded-lg border border-slate-200 object-contain p-0.5"
                        />
                        <div>
                            <span className="font-extrabold text-xs tracking-tight text-slate-900">
                                MARDIRA<span className="text-amber-500">WA</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block leading-none">
                                Politeknik Mardira Indonesia
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                        aria-label="Tutup"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body with internal scrolling */}
                <div className="p-5 sm:p-6 overflow-y-auto no-scrollbar space-y-5">
                    {/* Mode Segmented Tabs (for Login and Register) */}
                    {(mode === 'login' || mode === 'register') && (
                        <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
                            <button
                                type="button"
                                onClick={() => setMode('register')}
                                className={`flex-1 py-1.5 rounded-lg transition-all ${
                                    mode === 'register'
                                        ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Daftar & Langganan
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('login')}
                                className={`flex-1 py-1.5 rounded-lg transition-all ${
                                    mode === 'login'
                                        ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                                        : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                Masuk ke Akun
                            </button>
                        </div>
                    )}

                    {/* ================= MODE: LOGIN ================= */}
                    {mode === 'login' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                    Masuk ke Workspace
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Gunakan alamat email dan kata sandi yang telah terdaftar.
                                </p>
                            </div>

                            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block font-medium text-slate-700 mb-1">Alamat Email</label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        <input
                                            type="email"
                                            value={loginForm.data.email}
                                            onChange={(e) => loginForm.setData('email', e.target.value)}
                                            placeholder="nama@mardira.ac.id / bisnis.com"
                                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                                            required
                                        />
                                    </div>
                                    {loginForm.errors.email && (
                                        <p className="text-red-600 text-[11px] mt-1 font-medium">{loginForm.errors.email}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="font-medium text-slate-700">Kata Sandi</label>
                                        <button
                                            type="button"
                                            onClick={() => setMode('forgot')}
                                            className="text-[11px] font-semibold text-emerald-700 hover:underline"
                                        >
                                            Lupa password?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        <input
                                            type="password"
                                            value={loginForm.data.password}
                                            onChange={(e) => loginForm.setData('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 shadow-2xs"
                                            required
                                        />
                                    </div>
                                    {loginForm.errors.password && (
                                        <p className="text-red-600 text-[11px] mt-1 font-medium">{loginForm.errors.password}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                    <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={loginForm.data.remember}
                                            onChange={(e) => loginForm.setData('remember', e.target.checked)}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span>Ingat sesi masuk</span>
                                    </label>
                                </div>

                                <Button
                                    type="submit"
                                    disabled={loginForm.processing}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-lg shadow-xs"
                                >
                                    <span>{loginForm.processing ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </form>

                            <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
                                Belum memiliki akun?{' '}
                                <button
                                    type="button"
                                    onClick={() => setMode('register')}
                                    className="font-bold text-emerald-700 hover:underline"
                                >
                                    Daftar & Berlangganan Sekarang
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ================= MODE: REGISTER & SUBSCRIBE ================= */}
                    {mode === 'register' && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                                    Pendaftaran Akun & Langganan
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Pilih paket layanan dan lengkapi identitas workspace Anda.
                                </p>
                            </div>

                            {/* Interactive Plan Picker */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-2">
                                    Pilih Paket Layanan:
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {safePlans.map((p) => {
                                        const isSelected = parseInt(registerForm.data.plan_id) === p.id;
                                        const monthlyPrice = parseInt(p.price_monthly || p.price || 0);
                                        const maxDev = p.limits?.max_devices ?? p.max_devices ?? 1;
                                        const quota = p.limits?.monthly_message_quota ?? p.monthly_message_quota ?? 1000;
                                        return (
                                            <div
                                                key={p.id}
                                                onClick={() => registerForm.setData('plan_id', p.id)}
                                                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                                    isSelected
                                                        ? 'border-emerald-600 bg-emerald-50/80 ring-1 ring-emerald-600 shadow-2xs'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                                                    {isSelected && (
                                                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                                                            <Check className="w-2.5 h-2.5" />
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-emerald-700 font-extrabold text-sm font-mono tabular-nums mt-1">
                                                    Rp {monthlyPrice.toLocaleString('id-ID')}
                                                    <span className="text-[10px] font-normal text-slate-500"> /bln</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500 mt-0.5">
                                                    {maxDev} Perangkat • {quota?.toLocaleString('id-ID')} Kuota
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Registration Form */}
                            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Nama Lengkap</label>
                                        <div className="relative">
                                            <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                value={registerForm.data.name}
                                                onChange={(e) => registerForm.setData('name', e.target.value)}
                                                placeholder="Budi Santoso"
                                                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none shadow-2xs"
                                                required
                                            />
                                        </div>
                                        {registerForm.errors.name && (
                                            <p className="text-red-600 text-[11px] mt-1 font-medium">{registerForm.errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-1">
                                            <label className="block font-medium text-slate-700">Alamat Email (Login)</label>
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
                                            <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="email"
                                                value={registerForm.data.email}
                                                onChange={(e) => registerForm.setData('email', e.target.value)}
                                                placeholder="budi@kampus.ac.id"
                                                className={`w-full pl-8 pr-3 py-2 text-xs rounded-lg border transition-colors shadow-2xs ${
                                                    emailCheck.status === 'valid'
                                                        ? 'border-emerald-500 bg-emerald-50/20 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600'
                                                        : emailCheck.status === 'invalid'
                                                        ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                                        : 'border-slate-200 focus:border-emerald-600 focus:outline-none'
                                                }`}
                                                required
                                            />
                                        </div>
                                        {registerForm.errors.email && (
                                            <p className="text-red-600 text-[11px] mt-1 font-medium">{registerForm.errors.email}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Nama Workspace / Bisnis</label>
                                        <div className="relative">
                                            <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                value={registerForm.data.workspace_name}
                                                onChange={(e) => registerForm.setData('workspace_name', e.target.value)}
                                                placeholder="Prodi TI Mardira"
                                                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none shadow-2xs"
                                                required
                                            />
                                        </div>
                                        {registerForm.errors.workspace_name && (
                                            <p className="text-red-600 text-[11px] mt-1 font-medium">{registerForm.errors.workspace_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Nomor WhatsApp</label>
                                        <div className="relative">
                                            <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="text"
                                                value={registerForm.data.phone}
                                                onChange={(e) => registerForm.setData('phone', e.target.value)}
                                                placeholder="+6281234567890"
                                                className="w-full pl-8 pr-3 py-2 text-xs font-mono rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none shadow-2xs"
                                                required
                                            />
                                        </div>
                                        {registerForm.errors.phone && (
                                            <p className="text-red-600 text-[11px] mt-1 font-medium">{registerForm.errors.phone}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Kata Sandi</label>
                                        <div className="relative">
                                            <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="password"
                                                value={registerForm.data.password}
                                                onChange={(e) => registerForm.setData('password', e.target.value)}
                                                placeholder="Min. 6 karakter"
                                                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none shadow-2xs"
                                                required
                                            />
                                        </div>
                                        {registerForm.errors.password && (
                                            <p className="text-red-600 text-[11px] mt-1 font-medium">{registerForm.errors.password}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block font-medium text-slate-700 mb-1">Konfirmasi Sandi</label>
                                        <div className="relative">
                                            <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                                            <input
                                                type="password"
                                                value={registerForm.data.password_confirmation}
                                                onChange={(e) => registerForm.setData('password_confirmation', e.target.value)}
                                                placeholder="Ulangi sandi"
                                                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none shadow-2xs"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Button
                                        type="submit"
                                        disabled={registerForm.processing}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-lg shadow-xs"
                                    >
                                        <span>
                                            {registerForm.processing
                                                ? 'Memproses Akun...'
                                                : `Daftar & Aktifkan Paket ${selectedPlan ? selectedPlan.name : ''}`}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                    </Button>
                                </div>
                            </form>

                            <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
                                Sudah punya akun terdaftar?{' '}
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className="font-bold text-emerald-700 hover:underline"
                                >
                                    Masuk ke Workspace
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ================= MODE: FORGOT PASSWORD ================= */}
                    {mode === 'forgot' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setMode('login')}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                </button>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                        Atur Ulang Kata Sandi
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Tautan reset akan dikirimkan secara aman ke email Anda.
                                    </p>
                                </div>
                            </div>

                            {flash.error && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5 animate-fade-in">
                                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-950">Gagal Mengirim</p>
                                        <p className="text-[11px] text-red-800 mt-0.5">{flash.error}</p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleForgotSubmit} className="space-y-3.5 text-xs">
                                <div>
                                    <label className="block font-medium text-slate-700 mb-1">
                                        Alamat Email Terdaftar
                                    </label>
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                                        <input
                                            type="email"
                                            value={forgotForm.data.email}
                                            onChange={(e) => forgotForm.setData('email', e.target.value)}
                                            placeholder="nama@mardira.ac.id"
                                            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:border-emerald-600 focus:outline-none shadow-2xs"
                                            required
                                        />
                                    </div>
                                    {forgotForm.errors.email && (
                                        <p className="text-red-600 text-[11px] mt-1 font-medium">{forgotForm.errors.email}</p>
                                    )}
                                </div>

                                <Button
                                    type="submit"
                                    disabled={forgotForm.processing}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-lg shadow-xs"
                                >
                                    <span>{forgotForm.processing ? 'Mengirim...' : 'Kirim Tautan Reset Password'}</span>
                                    <Mail className="w-3.5 h-3.5 ml-1" />
                                </Button>
                            </form>

                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 space-y-1">
                                <p>
                                    Periksa kotak masuk (inbox) atau folder spam email Anda setelah menekan tombol di atas.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ================= MODE: FORGOT SUCCESS ================= */}
                    {mode === 'forgot_success' && (
                        <div className="space-y-4 text-center py-3">
                            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 mx-auto flex items-center justify-center">
                                <Mail className="w-6 h-6 text-emerald-600" />
                            </div>

                            <div className="space-y-1.5">
                                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                    Tautan Reset Terkirim!
                                </h3>
                                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                                    Kami telah mengirimkan instruksi dan tautan reset kata sandi ke email{' '}
                                    <strong className="text-slate-900 font-mono">{sentEmail}</strong>.
                                </p>
                            </div>

                            {/* WhatsApp Notification Alert if sent */}
                            {flash.wa_sent && (
                                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-950 text-left space-y-1 animate-fade-in">
                                    <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                        <span>Notifikasi WhatsApp Terkirim!</span>
                                    </div>
                                    <p className="text-emerald-800">
                                        Tautan reset juga telah dikirimkan ke nomor WhatsApp terdaftar Anda ({flash.user_phone || 'terdaftar'}). Silakan periksa pesan masuk.
                                    </p>
                                </div>
                            )}

                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 text-left space-y-1">
                                <div className="font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                    <span>Langkah Berikutnya:</span>
                                </div>
                                <p className="text-emerald-800">
                                    Buka email tersebut dan klik tombol <strong>"Atur Ulang Kata Sandi"</strong> untuk membuat sandi baru (berlaku 60 menit).
                                </p>
                            </div>

                            {(directPreviewUrl || flash.preview_url) && (
                                <div className="p-3.5 bg-slate-900 text-white rounded-xl text-left space-y-2 border border-emerald-500/40 animate-fade-in">
                                    <div className="flex items-center justify-between text-[11px]">
                                        <span className="font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Mode Uji Langsung (Testing Preview):
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">MAIL_MAILER=log</span>
                                    </div>
                                    <p className="text-[11px] text-slate-300 leading-relaxed">
                                        Email telah dicatat pada log sistem lokal. Klik tombol di bawah untuk langsung membuka formulir reset:
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
                                        <a
                                            href={directPreviewUrl || flash.preview_url}
                                            className="inline-flex items-center justify-center gap-1.5 flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-xs"
                                        >
                                            <span>Buka Tautan Reset Password Sekarang →</span>
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(directPreviewUrl || flash.preview_url);
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
                                                    <span>Salin</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <Button
                                type="button"
                                onClick={() => setMode('login')}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-9 rounded-lg"
                            >
                                Kembali ke Halaman Masuk
                            </Button>
                        </div>
                    )}
                </div>

                {/* Modal Footer Trust Bar */}
                <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 shrink-0">
                    <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        <span>Enkripsi TLS 256-Bit</span>
                    </span>
                    <span>Politeknik Mardira Indonesia</span>
                </div>
            </div>
        </div>
        </ModalPortal>
    );
}
