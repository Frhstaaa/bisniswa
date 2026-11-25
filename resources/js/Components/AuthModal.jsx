import React, { useEffect, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { X } from 'lucide-react';
import ModalPortal from './ui/ModalPortal';
import SapaLogo from './SapaLogo';
import { inputClassName, primaryButtonClassName } from './AuthShell';

const DEFAULT_PLANS = [
    { id: 1, name: 'Starter Lite', price_monthly: 99000, price_annually: 990000 },
    { id: 3, name: 'Pro Bisnis', price_monthly: 179000, price_annually: 1790000 },
    { id: 2, name: 'Enterprise Pro', price_monthly: 299000, price_annually: 2990000 },
];

export default function AuthModal({
    isOpen,
    onClose,
    initialMode = 'register',
    initialPlanId = null,
    initialBillingCycle = 'monthly',
    plans = [],
}) {
    const safePlans = plans.length > 0 ? plans : DEFAULT_PLANS;
    const { flash = {} } = usePage().props;
    const [mode, setMode] = useState(initialMode);
    const [sentEmail, setSentEmail] = useState('');
    const [previewUrl, setPreviewUrl] = useState('');

    const loginForm = useForm({ email: '', password: '', remember: true });
    const registerForm = useForm({
        name: '',
        email: '',
        phone: '+628',
        workspace_name: '',
        password: '',
        password_confirmation: '',
        plan_id: initialPlanId || safePlans[0]?.id || '',
        billing_cycle: initialBillingCycle,
    });
    const forgotForm = useForm({ email: '' });

    useEffect(() => {
        if (isOpen) {
            setMode(initialMode);
            if (initialPlanId) registerForm.setData('plan_id', initialPlanId);
            registerForm.setData('billing_cycle', initialBillingCycle || 'monthly');
        }
    }, [isOpen, initialMode, initialPlanId, initialBillingCycle]);

    useEffect(() => {
        const closeOnEscape = (event) => {
            if (event.key === 'Escape' && isOpen) onClose();
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const selectedPlan = safePlans.find((plan) => Number(plan.id) === Number(registerForm.data.plan_id)) || safePlans[0];
    const isAnnual = registerForm.data.billing_cycle === 'annually';
    const selectedPrice = Number(isAnnual ? (selectedPlan?.price_annually || selectedPlan?.price_monthly * 10) : selectedPlan?.price_monthly || 0);

    const submitLogin = (event) => {
        event.preventDefault();
        loginForm.post('/login', { preserveScroll: true, onSuccess: onClose });
    };

    const submitRegister = (event) => {
        event.preventDefault();
        registerForm.post('/register', { preserveScroll: true, onSuccess: onClose });
    };

    const submitForgot = (event) => {
        event.preventDefault();
        forgotForm.post('/forgot-password', {
            preserveScroll: true,
            onSuccess: (page) => {
                setSentEmail(forgotForm.data.email);
                setPreviewUrl(page?.props?.flash?.preview_url || '');
                setMode('forgot_success');
            },
        });
    };

    const fieldError = (message) => message && <p className="mt-1.5 text-sm text-red-600">{message}</p>;

    return (
        <ModalPortal isOpen={isOpen} onClose={onClose}>
            <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4" onClick={onClose}>
                <div className={`my-auto max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8 ${mode === 'register' ? 'max-w-xl' : 'max-w-md'}`} onClick={(event) => event.stopPropagation()}>
                    <div className="mb-6 flex items-start justify-between gap-4">
                        <SapaLogo variant="full" size="md" />
                        <button type="button" onClick={onClose} className="flex size-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label="Tutup">
                            <X className="size-5" />
                        </button>
                    </div>

                    {(mode === 'login' || mode === 'register') && (
                        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
                            <button type="button" onClick={() => setMode('login')} className={`h-10 rounded-lg ${mode === 'login' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}>Masuk</button>
                            <button type="button" onClick={() => setMode('register')} className={`h-10 rounded-lg ${mode === 'register' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600'}`}>Daftar</button>
                        </div>
                    )}

                    {flash.error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{flash.error}</p>}

                    {mode === 'login' && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Masuk ke SAPA</h2>
                            <form onSubmit={submitLogin} className="mt-5 space-y-4">
                                <div><label className="text-sm font-medium text-slate-700">Email</label><input type="email" value={loginForm.data.email} onChange={(event) => loginForm.setData('email', event.target.value)} className={inputClassName} required />{fieldError(loginForm.errors.email)}</div>
                                <div><div className="flex justify-between gap-4"><label className="text-sm font-medium text-slate-700">Kata sandi</label><button type="button" onClick={() => setMode('forgot')} className="text-sm font-medium text-[#1e50ff] hover:underline">Lupa kata sandi?</button></div><input type="password" value={loginForm.data.password} onChange={(event) => loginForm.setData('password', event.target.value)} className={inputClassName} required />{fieldError(loginForm.errors.password)}</div>
                                <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" checked={loginForm.data.remember} onChange={(event) => loginForm.setData('remember', event.target.checked)} className="size-4 rounded border-slate-300 text-[#1e50ff]" />Ingat saya</label>
                                <button type="submit" disabled={loginForm.processing} className={primaryButtonClassName}>{loginForm.processing ? 'Memproses...' : 'Masuk'}</button>
                            </form>
                        </div>
                    )}

                    {mode === 'register' && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Buat akun SAPA</h2>
                            <form onSubmit={submitRegister} className="mt-5 space-y-4">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div><label className="text-sm font-medium text-slate-700">Paket</label><select value={registerForm.data.plan_id} onChange={(event) => registerForm.setData('plan_id', event.target.value)} className={inputClassName}>{safePlans.map((plan) => { const price = Number(isAnnual ? (plan.price_annually || plan.price_monthly * 10) : plan.price_monthly); return <option key={plan.id} value={plan.id}>{plan.name} — Rp {price.toLocaleString('id-ID')}/{isAnnual ? 'tahun' : 'bulan'}</option>; })}</select></div>
                                    <div><label className="text-sm font-medium text-slate-700">Pembayaran</label><select value={registerForm.data.billing_cycle} onChange={(event) => registerForm.setData('billing_cycle', event.target.value)} className={inputClassName}><option value="monthly">Bulanan</option><option value="annually">Tahunan</option></select></div>
                                </div>
                                <div className="flex items-center justify-between gap-4 rounded-xl bg-blue-50 px-4 py-3 text-sm">
                                    <div><p className="font-semibold text-slate-900">{selectedPlan?.name}</p><p className="text-slate-600">Ditagihkan {isAnnual ? 'setiap tahun' : 'setiap bulan'}</p></div>
                                    <p className="shrink-0 font-bold text-[#1e50ff]">Rp {selectedPrice.toLocaleString('id-ID')}</p>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2"><div><label className="text-sm font-medium text-slate-700">Nama lengkap</label><input value={registerForm.data.name} onChange={(event) => registerForm.setData('name', event.target.value)} className={inputClassName} required />{fieldError(registerForm.errors.name)}</div><div><label className="text-sm font-medium text-slate-700">Nama bisnis</label><input value={registerForm.data.workspace_name} onChange={(event) => registerForm.setData('workspace_name', event.target.value)} className={inputClassName} required />{fieldError(registerForm.errors.workspace_name)}</div></div>
                                <div className="grid gap-4 sm:grid-cols-2"><div><label className="text-sm font-medium text-slate-700">Email</label><input type="email" value={registerForm.data.email} onChange={(event) => registerForm.setData('email', event.target.value)} className={inputClassName} required />{fieldError(registerForm.errors.email)}</div><div><label className="text-sm font-medium text-slate-700">Nomor WhatsApp</label><input type="tel" value={registerForm.data.phone} onChange={(event) => registerForm.setData('phone', event.target.value)} className={inputClassName} required />{fieldError(registerForm.errors.phone)}</div></div>
                                <div className="grid gap-4 sm:grid-cols-2"><div><label className="text-sm font-medium text-slate-700">Kata sandi</label><input type="password" value={registerForm.data.password} onChange={(event) => registerForm.setData('password', event.target.value)} className={inputClassName} required />{fieldError(registerForm.errors.password)}</div><div><label className="text-sm font-medium text-slate-700">Ulangi kata sandi</label><input type="password" value={registerForm.data.password_confirmation} onChange={(event) => registerForm.setData('password_confirmation', event.target.value)} className={inputClassName} required /></div></div>
                                <button type="submit" disabled={registerForm.processing} className={primaryButtonClassName}>{registerForm.processing ? 'Membuat akun...' : 'Daftar'}</button>
                            </form>
                        </div>
                    )}

                    {mode === 'forgot' && (
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">Lupa kata sandi?</h2>
                            <p className="mt-1 text-sm text-slate-600">Masukkan email akun Anda.</p>
                            <form onSubmit={submitForgot} className="mt-5 space-y-4">
                                <div><label className="text-sm font-medium text-slate-700">Email</label><input type="email" value={forgotForm.data.email} onChange={(event) => forgotForm.setData('email', event.target.value)} className={inputClassName} required />{fieldError(forgotForm.errors.email)}</div>
                                <button type="submit" disabled={forgotForm.processing} className={primaryButtonClassName}>{forgotForm.processing ? 'Mengirim...' : 'Kirim tautan reset'}</button>
                                <button type="button" onClick={() => setMode('login')} className="w-full text-sm font-medium text-slate-600 hover:text-slate-950">Kembali ke login</button>
                            </form>
                        </div>
                    )}

                    {mode === 'forgot_success' && (
                        <div className="text-center">
                            <h2 className="text-xl font-bold text-slate-950">Periksa email Anda</h2>
                            <p className="mt-2 text-sm leading-6 text-slate-600">Tautan reset dikirim ke <strong>{sentEmail}</strong>.</p>
                            {previewUrl && <a href={previewUrl} className="mt-5 flex h-11 items-center justify-center rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">Buka tautan uji coba</a>}
                            <button type="button" onClick={() => setMode('login')} className={`${primaryButtonClassName} mt-5`}>Kembali ke login</button>
                        </div>
                    )}
                </div>
            </div>
        </ModalPortal>
    );
}
