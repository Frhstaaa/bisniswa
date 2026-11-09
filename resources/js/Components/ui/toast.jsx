import React, { useState, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast() {
    const { flash = {}, errors = {} } = usePage().props;
    const [toast, setToast] = useState(null);
    const [progress, setProgress] = useState(100);
    const [isPaused, setIsPaused] = useState(false);
    const timerRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const duration = 5000;

    // Global helper exposed to window for client-side components
    useEffect(() => {
        window.showToast = ({ type = 'success', title, message, duration = 5000 }) => {
            setToast({
                id: Date.now(),
                type,
                title: title || (type === 'success' ? 'Berhasil' : type === 'error' ? 'Terjadi Kesalahan' : type === 'warning' ? 'Perhatian' : 'Informasi'),
                message,
                duration,
            });
            setProgress(100);
        };

        const handleCustomToast = (event) => {
            if (event?.detail) {
                window.showToast(event.detail);
            }
        };

        window.addEventListener('app-toast', handleCustomToast);
        return () => window.removeEventListener('app-toast', handleCustomToast);
    }, []);

    // Sync with Inertia flash and validation errors
    useEffect(() => {
        if (flash?.success) {
            window.showToast?.({
                type: 'success',
                title: 'Berhasil Dilakukan',
                message: flash.success,
            });
        } else if (flash?.error) {
            window.showToast?.({
                type: 'error',
                title: 'Perhatian / Terjadi Masalah',
                message: flash.error,
            });
        } else if (flash?.warning) {
            window.showToast?.({
                type: 'warning',
                title: 'Pemberitahuan Sistem',
                message: flash.warning,
            });
        } else if (flash?.info) {
            window.showToast?.({
                type: 'info',
                title: 'Informasi',
                message: flash.info,
            });
        } else if (errors && Object.keys(errors).length > 0) {
            const firstError = Object.values(errors)[0];
            const errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
            window.showToast?.({
                type: 'error',
                title: 'Validasi Input Tidak Sesuai',
                message: errorMessage || 'Harap periksa kembali isian formulir Anda.',
            });
        }
    }, [flash, errors]);

    // Timer and smooth progress bar countdown
    useEffect(() => {
        if (!toast) return;

        if (isPaused) {
            clearInterval(progressIntervalRef.current);
            clearTimeout(timerRef.current);
            return;
        }

        const intervalMs = 50;
        const step = (intervalMs / (toast.duration || duration)) * 100;

        progressIntervalRef.current = setInterval(() => {
            setProgress((prev) => {
                if (prev <= step) {
                    clearInterval(progressIntervalRef.current);
                    return 0;
                }
                return prev - step;
            });
        }, intervalMs);

        timerRef.current = setTimeout(() => {
            setToast(null);
        }, toast.duration || duration);

        return () => {
            clearInterval(progressIntervalRef.current);
            clearTimeout(timerRef.current);
        };
    }, [toast, isPaused]);

    if (!toast) return null;

    const themeStyles = {
        success: {
            border: 'border-emerald-500/30 dark:border-emerald-500/30',
            badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]',
            icon: <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400" />,
            progressBar: 'bg-gradient-to-r from-emerald-500 to-[#1e50ff]',
            glow: 'shadow-[0_12px_36px_-6px_rgba(16,185,129,0.18)]',
        },
        error: {
            border: 'border-rose-500/30 dark:border-rose-500/30',
            badge: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]',
            icon: <AlertCircle className="size-4.5 text-rose-600 dark:text-rose-400" />,
            progressBar: 'bg-gradient-to-r from-rose-500 to-amber-500',
            glow: 'shadow-[0_12px_36px_-6px_rgba(244,63,94,0.18)]',
        },
        warning: {
            border: 'border-amber-500/30 dark:border-amber-500/30',
            badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]',
            icon: <AlertTriangle className="size-4.5 text-amber-600 dark:text-amber-400" />,
            progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
            glow: 'shadow-[0_12px_36px_-6px_rgba(245,158,11,0.18)]',
        },
        info: {
            border: 'border-blue-500/30 dark:border-blue-500/30',
            badge: 'bg-blue-500/10 text-[#1e50ff] border border-blue-500/20 shadow-[0_0_12px_rgba(30,80,255,0.15)]',
            icon: <Info className="size-4.5 text-[#1e50ff]" />,
            progressBar: 'bg-gradient-to-r from-[#1e50ff] to-cyan-400',
            glow: 'shadow-[0_12px_36px_-6px_rgba(30,80,255,0.18)]',
        },
    };

    const currentTheme = themeStyles[toast.type] || themeStyles.info;

    return (
        <aside
            aria-live="polite"
            className="fixed top-5 right-4 sm:right-6 z-[9999] max-w-sm sm:max-w-md w-full pointer-events-auto"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={toast.id}
                    initial={{ opacity: 0, y: -24, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.94, transition: { duration: 0.18 } }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                    className={`relative overflow-hidden rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border ${currentTheme.border} ${currentTheme.glow} shadow-2xl p-4 transition-all`}
                >
                    <div className="flex items-start gap-3">
                        {/* Branded Icon Pill */}
                        <div className={`p-2 rounded-xl shrink-0 ${currentTheme.badge}`}>
                            {currentTheme.icon}
                        </div>

                        {/* Text Body */}
                        <div className="flex-1 min-w-0 pr-1">
                            <h4 className="text-xs font-black text-slate-900 dark:text-white tracking-tight mb-0.5">
                                {toast.title}
                            </h4>
                            <p className="text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-300 font-normal">
                                {toast.message}
                            </p>
                        </div>

                        {/* Close Action */}
                        <button
                            type="button"
                            onClick={() => setToast(null)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 -mr-1 -mt-1"
                            title="Tutup Notifikasi"
                        >
                            <X className="size-4" />
                        </button>
                    </div>

                    {/* Luminous Auto-Dismiss Progress Line */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                        <motion.div
                            className={`h-full ${currentTheme.progressBar}`}
                            style={{ width: `${progress}%` }}
                            transition={{ ease: 'linear' }}
                        />
                    </div>
                </motion.div>
            </AnimatePresence>
        </aside>
    );
}
