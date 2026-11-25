import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import AuthShell, { inputClassName, primaryButtonClassName } from '../../Components/AuthShell';
import { Alert, AlertDescription } from '../../Components/ui/alert';

export default function Login() {
    const { flash = {} } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({ email: '', password: '', remember: true });

    const handleSubmit = (event) => {
        event.preventDefault();
        post('/login');
    };

    return (
        <AuthShell
            title="Masuk"
            heading="Masuk ke SAPA"
            description="Gunakan email dan kata sandi akun Anda."
            footer={<><span>Belum punya akun? </span><Link href="/register" className="font-semibold text-[#1e50ff] hover:underline">Daftar</Link></>}
        >
            <div className="space-y-4">
                {flash.success && <Alert variant="success"><AlertDescription>{flash.success}</AlertDescription></Alert>}
                {flash.error && <Alert variant="destructive"><AlertDescription>{flash.error}</AlertDescription></Alert>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-slate-700">Email</label>
                        <input id="email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className={inputClassName} autoComplete="email" autoFocus required />
                        {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                    </div>
                    <div>
                        <div className="flex items-center justify-between gap-4">
                            <label htmlFor="password" className="text-sm font-medium text-slate-700">Kata sandi</label>
                            <Link href="/forgot-password" className="text-sm font-medium text-[#1e50ff] hover:underline">Lupa kata sandi?</Link>
                        </div>
                        <input id="password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className={inputClassName} autoComplete="current-password" required />
                        {errors.password && <p className="mt-1.5 text-sm text-red-600">{errors.password}</p>}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" checked={data.remember} onChange={(event) => setData('remember', event.target.checked)} className="size-4 rounded border-slate-300 text-[#1e50ff] focus:ring-[#1e50ff]" />
                        Ingat saya
                    </label>
                    <button type="submit" disabled={processing} className={primaryButtonClassName}>{processing ? 'Memproses...' : 'Masuk'}</button>
                </form>
            </div>
        </AuthShell>
    );
}
