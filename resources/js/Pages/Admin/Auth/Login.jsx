import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import AuthShell, { darkInputClassName, primaryButtonClassName } from '../../../Components/AuthShell';
import { Alert, AlertDescription } from '../../../Components/ui/alert';

export default function AdminLogin() {
    const { flash = {} } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({ email: '', password: '', remember: true });

    const handleSubmit = (event) => {
        event.preventDefault();
        post('/admin/login');
    };

    return (
        <AuthShell title="Login Admin" heading="Login admin" description="Khusus administrator SAPA." dark noIndex footer={<Link href="/login" className="hover:text-white hover:underline">Kembali ke login pengguna</Link>}>
            <div className="space-y-4">
                {flash.success && <Alert variant="success"><AlertDescription>{flash.success}</AlertDescription></Alert>}
                {flash.error && <Alert variant="destructive"><AlertDescription>{flash.error}</AlertDescription></Alert>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="admin-email" className="text-sm font-medium text-slate-300">Email</label>
                        <input id="admin-email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className={darkInputClassName} autoComplete="email" autoFocus required />
                        {errors.email && <p className="mt-1.5 text-sm text-red-400">{errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="admin-password" className="text-sm font-medium text-slate-300">Kata sandi</label>
                        <input id="admin-password" type="password" value={data.password} onChange={(event) => setData('password', event.target.value)} className={darkInputClassName} autoComplete="current-password" required />
                        {errors.password && <p className="mt-1.5 text-sm text-red-400">{errors.password}</p>}
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-400">
                        <input type="checkbox" checked={data.remember} onChange={(event) => setData('remember', event.target.checked)} className="size-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500" />
                        Ingat saya
                    </label>
                    <button type="submit" disabled={processing} className={primaryButtonClassName}>{processing ? 'Memproses...' : 'Masuk sebagai admin'}</button>
                </form>
            </div>
        </AuthShell>
    );
}
