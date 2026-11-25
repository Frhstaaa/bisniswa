import React from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import AuthShell, { inputClassName, primaryButtonClassName } from '../../Components/AuthShell';
import { Alert, AlertDescription } from '../../Components/ui/alert';

export default function ForgotPassword() {
    const { flash = {} } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const handleSubmit = (event) => {
        event.preventDefault();
        post('/forgot-password');
    };

    return (
        <AuthShell
            title="Lupa Kata Sandi"
            heading="Lupa kata sandi?"
            description="Masukkan email akun Anda. Kami akan mengirim tautan reset."
            footer={<Link href="/login" className="font-medium text-[#1e50ff] hover:underline">Kembali ke login</Link>}
        >
            <div className="space-y-4">
                {flash.error && <Alert variant="destructive"><AlertDescription>{flash.error}</AlertDescription></Alert>}
                {flash.status && <Alert variant="success"><AlertDescription>{flash.status}</AlertDescription></Alert>}
                {flash.wa_sent && <Alert variant="success"><AlertDescription>Tautan reset juga dikirim ke WhatsApp terdaftar.</AlertDescription></Alert>}

                {flash.preview_url && (
                    <a href={flash.preview_url} className="flex h-11 w-full items-center justify-center rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                        Buka tautan reset uji coba
                    </a>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="reset-email" className="text-sm font-medium text-slate-700">Email</label>
                        <input id="reset-email" type="email" value={data.email} onChange={(event) => setData('email', event.target.value)} className={inputClassName} autoComplete="email" autoFocus required />
                        {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email}</p>}
                    </div>
                    <button type="submit" disabled={processing} className={primaryButtonClassName}>{processing ? 'Mengirim...' : 'Kirim tautan reset'}</button>
                </form>
            </div>
        </AuthShell>
    );
}
