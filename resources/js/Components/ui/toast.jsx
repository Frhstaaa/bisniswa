import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, AlertCircle, Info, X, Zap } from 'lucide-react';

export default function Toast() {
    const { flash, errors } = usePage().props;
    const [visible, setVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState('success');

    useEffect(() => {
        if (flash?.success) {
            setToastMessage(flash.success);
            setToastType('success');
            setVisible(true);
        } else if (flash?.error) {
            setToastMessage(flash.error);
            setToastType('error');
            setVisible(true);
        } else if (errors && Object.keys(errors).length > 0) {
            setToastMessage(Object.values(errors)[0]);
            setToastType('error');
            setVisible(true);
        }
    }, [flash, errors]);

    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                setVisible(false);
            }, 4500);
            return () => clearTimeout(timer);
        }
    }, [visible, toastMessage]);

    if (!visible || !toastMessage) return null;

    const isSuccess = toastType === 'success';

    return (
        <div className="fixed top-20 right-4 sm:right-6 z-50 max-w-sm w-full animate-fade-in-up">
            <div
                className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 transition-all ${
                    isSuccess
                        ? 'bg-[#064e3b]/95 border-emerald-700/80 text-white shadow-wa-glow'
                        : 'bg-red-950/95 border-red-800 text-white'
                }`}
            >
                <div className="p-1 rounded-xl shrink-0 mt-0.5">
                    {isSuccess ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                </div>

                <div className="flex-1 text-xs">
                    <div className="font-extrabold tracking-tight text-white mb-0.5">
                        {isSuccess ? 'Berhasil Dilakukan' : 'Perhatian / Terjadi Masalah'}
                    </div>
                    <p className="text-slate-200 leading-relaxed font-normal">{toastMessage}</p>
                </div>

                <button
                    onClick={() => setVisible(false)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors shrink-0"
                    title="Tutup Notifikasi"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
