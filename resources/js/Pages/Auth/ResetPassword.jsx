import React from 'react';
import { Link, useForm } from '@inertiajs/react';
import AuthShell, { inputClassName, primaryButtonClassName } from '../../Components/AuthShell';
import { Alert, AlertDescription } from '../../Components/ui/alert';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors } = useForm({
        token: token || '',
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        post('/reset-password');
    };

    return (
        <AuthShell
            title="Buat Kata Sandi Baru"
            heading="Buat kata sandi baru"
            description="Gunakan minimal 6 karakter."
            footer={<Link href="/login" className="font-medium text-[#1e50ff] hover:underline">Kembali ke login</Link>}
        >
            <div className="space-y-4">
                {(errors.email || errors.token) && (
                    <Alert variant="destructive">
                        <AlertDescription>{errors.email || errors.token} <Link href="/forgot-password" className="font-semibold underline">Minta tautan baru</Link></AlertDescription>
                    </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" value={data.token} />
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                        <input id="email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className={inputClassName} autoComplete="email" required />
                    </div>
                    <div>
                        <label htmlFor="new-password" className="text-sm font-medium text-slate-700">Kata sandi baru</label>
                        <input id="new-password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className={inputClassName} autoComplete="new-password" autoFocus required />
                        {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                    </div>
                    <div>
                        <label htmlFor="password-confirmation" className="text-sm font-medium text-slate-700">Ulangi kata sandi</label>
                        <input id="password-confirmation" type="password" value={data.password_confirmation} onChange={(event) => setData('password_confirmation', event.target.value)} className={inputClassName} autoComplete="new-password" required />
                    </div>
                    <button type="submit" disabled={processing} className={primaryButtonClassName}>{processing ? 'Menyimpan...' : 'Simpan kata sandi'}</button>
                </form>
            </div>
        </AuthShell>
    );
}
