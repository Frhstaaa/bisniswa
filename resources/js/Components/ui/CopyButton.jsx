import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({
    textToCopy,
    label = 'Salin',
    copiedLabel = 'Tersalin!',
    showLabel = true,
    className = '',
    size = 'sm',
    variant = 'dark',
}) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    const isLight = variant === 'light' || variant === 'outline';

    const variantStyles = {
        dark: copied
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs'
            : 'bg-slate-800/90 hover:bg-slate-850 text-slate-300 hover:text-white border-slate-700/70 hover:border-slate-600',
        light: copied
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200/90',
        outline: copied
            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs'
            : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-2xs',
        ghost: copied
            ? 'bg-emerald-50 text-emerald-700 border-transparent'
            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 border-transparent',
    };

    const currentVariant = variantStyles[variant] || variantStyles.dark;

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border cursor-pointer select-none ${currentVariant} ${className}`}
            title="Salin ke papan klip"
        >
            <AnimatePresence mode="wait" initial={false}>
                {copied ? (
                    <motion.span
                        key="check"
                        initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
                        animate={{ scale: 1, rotate: 0, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={isLight ? 'text-emerald-600' : 'text-emerald-400'}
                    >
                        <Check className="w-3.5 h-3.5" />
                    </motion.span>
                ) : (
                    <motion.span
                        key="copy"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.12 }}
                    >
                        <Copy className="w-3.5 h-3.5" />
                    </motion.span>
                )}
            </AnimatePresence>
            {showLabel && (
                <span className="transition-all duration-150">
                    {copied ? copiedLabel : label}
                </span>
            )}
        </motion.button>
    );
}
