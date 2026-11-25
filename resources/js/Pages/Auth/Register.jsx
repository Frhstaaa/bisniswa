import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import AuthShell, { inputClassName, primaryButtonClassName } from '../../Components/AuthShell';

export default function Register({ plans = [], selectedPlanSlug }) {
    const defaultPlan = plans.find((plan) => plan.slug === selectedPlanSlug) || plans[1] || plans[0];
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '+628',
        workspace_name: '',
        password: '',
        password_confirmation: '',
        plan_id: defaultPlan?.id || '',
        billing_cycle: 'monthly',
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        post('/register');
    };

    const isAnnual = data.billing_cycle === 'annually';
    const selectedPlan = plans.find((plan) => Number(plan.id) === Number(data.plan_id)) || defaultPlan;
    const selectedPrice = selectedPlan
        ? Number(isAnnual ? (selectedPlan.price_annually || selectedPlan.price_monthly * 10) : selectedPlan.price_monthly)
        : 0;

    return (
        <AuthShell
            title="Daftar"
            heading="Buat akun SAPA"
            description="Isi data akun dan pilih paket."
            width="max-w-xl"
            footer={<><span>Sudah punya akun? </span><Link href="/login" className="font-semibold text-[#1e50ff] hover:underline">Masuk</Link></>}
        >
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="plan" className="text-sm font-medium text-slate-700">Paket</label>
                        <select id="plan" value={data.plan_id} onChange={(event) => setData('plan_id', event.target.value)} className={inputClassName} required>
                            {plans.map((plan) => {
                                const price = Number(isAnnual ? (plan.price_annually || plan.price_monthly * 10) : plan.price_monthly);
                                return <option key={plan.id} value={plan.id}>{plan.name} — Rp {price.toLocaleString('id-ID')}/{isAnnual ? 'tahun' : 'bulan'}</option>;
                            })}
                        </select>
                        {errors.plan_id && <p className="mt-1.5 text-sm text-red-600">{errors.plan_id}</p>}
                    </div>
                    <div>
                        <label htmlFor="billing-cycle" className="text-sm font-medium text-slate-700">Pembayaran</label>
                        <select id="billing-cycle" value={data.billing_cycle} onChange={(event) => setData('billing_cycle', event.target.value)} className={inputClassName}>
                            <option value="monthly">Bulanan</option>
                            <option value="annually">Tahunan</option>
                        </select>
                    </div>
                </div>

                {selectedPlan && (
                    <div className="flex items-center justify-between gap-4 rounded-xl bg-blue-50 px-4 py-3 text-sm">
                        <div>
                            <p className="font-semibold text-slate-900">{selectedPlan.name}</p>
                            <p className="text-slate-600">Ditagihkan {isAnnual ? 'setiap tahun' : 'setiap bulan'}</p>
                        </div>
                        <p className="shrink-0 text-base font-bold text-[#1e50ff]">Rp {selectedPrice.toLocaleString('id-ID')}</p>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="workspace-name" className="text-sm font-medium text-slate-700">Nama bisnis</label>
                        <input id="workspace-name" type="text" value={data.workspace_name} onChange={(event) => setData('workspace_name', event.target.value)} className={inputClassName} autoComplete="organization" required />
                        {errors.workspace_name && <p className="mt-1.5 text-sm text-red-600">{errors.workspace_name}</p>}
                    </div>
                    <div>
                        <label htmlFor="name" className="text-sm font-medium text-slate-700">Nama lengkap</label>
                        <input id="name" type="text" value={data.name} onChange={(event) => setData('name', event.target.value)} className={inputClassName} autoComplete="name" required />
                        {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name}</p>}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="register-email" className="text-sm font-medium text-slate-700">Email</label>
                        <input id="register-email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className={inputClassName} autoComplete="email" required />
                        {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="phone" className="text-sm font-medium text-slate-700">Nomor WhatsApp</label>
                        <input id="phone" type="tel" value={data.phone} onChange={(event) => setData('phone', event.target.value)} className={inputClassName} autoComplete="tel" required />
                        {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone}</p>}
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="register-password" className="text-sm font-medium text-slate-700">Kata sandi</label>
                        <input id="register-password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className={inputClassName} autoComplete="new-password" required />
                        {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                    </div>
                    <div>
                        <label htmlFor="register-password-confirmation" className="text-sm font-medium text-slate-700">Ulangi kata sandi</label>
                        <input id="register-password-confirmation" type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} className={inputClassName} autoComplete="new-password" required />
                    </div>
                </div>

                <button type="submit" disabled={processing} className={primaryButtonClassName}>{processing ? 'Membuat akun...' : 'Daftar'}</button>
            </form>
        </AuthShell>
    );
}
