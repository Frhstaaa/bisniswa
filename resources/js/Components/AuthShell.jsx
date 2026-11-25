import React from 'react';
import { Head, Link } from '@inertiajs/react';
import SapaLogo from './SapaLogo';

export default function AuthShell({ title, heading, description, children, footer, dark = false, noIndex = false, width = 'max-w-md' }) {
    return (
        <main className={`min-h-screen px-4 py-10 sm:px-6 ${dark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
            <Head title={`${title} — SAPA`}>
                {noIndex && <meta name="robots" content="noindex, nofollow, noarchive" head-key="robots" />}
            </Head>
            <div className={`mx-auto flex min-h-[calc(100vh-5rem)] w-full ${width} flex-col justify-center`}>
                <div className="mb-7 text-center">
                    <Link href="/" className="inline-flex" aria-label="Kembali ke beranda SAPA">
                        <SapaLogo variant="full" size="lg" theme={dark ? 'dark' : 'light'} />
                    </Link>
                    <h1 className={`mt-6 text-2xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-950'}`}>{heading}</h1>
                    {description && <p className={`mx-auto mt-2 max-w-sm text-sm leading-6 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{description}</p>}
                </div>
                <section className={`rounded-2xl p-6 sm:p-8 ${dark ? 'bg-slate-900' : 'bg-white shadow-sm'}`}>{children}</section>
                {footer && <div className={`mt-5 text-center text-sm ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{footer}</div>}
            </div>
        </main>
    );
}

export const inputClassName = 'mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm text-slate-900 outline-none transition focus:border-[#1e50ff] focus:ring-2 focus:ring-[#1e50ff]/15';
export const darkInputClassName = 'mt-1.5 h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
export const primaryButtonClassName = 'flex h-11 w-full items-center justify-center rounded-xl bg-[#1e50ff] px-4 text-sm font-semibold text-white transition hover:bg-[#1744d6] focus:outline-none focus:ring-2 focus:ring-[#1e50ff] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60';
