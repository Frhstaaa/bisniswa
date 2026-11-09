import React from 'react';
import { cva } from 'class-variance-authority';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const alertVariants = cva(
    'relative w-full rounded-2xl border p-4 backdrop-blur-md transition-all shadow-xs [&>svg~*]:pl-8 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4',
    {
        variants: {
            variant: {
                default:
                    'bg-blue-50/90 border-blue-200/80 text-blue-950 dark:bg-slate-900/90 dark:border-blue-900/50 dark:text-blue-100 shadow-blue-500/5',
                brand:
                    'bg-gradient-to-r from-blue-50/95 via-indigo-50/80 to-blue-50/95 border-[#bfdbfe] text-[#0f172a] dark:from-slate-900/95 dark:via-blue-950/40 dark:to-slate-900/95 dark:border-blue-800/60 dark:text-blue-100 shadow-[0_8px_20px_-6px_rgba(30,80,255,0.12)]',
                success:
                    'bg-emerald-50/90 border-emerald-200/90 text-emerald-950 dark:bg-slate-900/90 dark:border-emerald-800/60 dark:text-emerald-100 shadow-emerald-500/5',
                destructive:
                    'bg-rose-50/90 border-rose-200/90 text-rose-950 dark:bg-slate-900/90 dark:border-rose-900/60 dark:text-rose-100 shadow-rose-500/5',
                warning:
                    'bg-amber-50/90 border-amber-200/90 text-amber-950 dark:bg-slate-900/90 dark:border-amber-800/60 dark:text-amber-100 shadow-amber-500/5',
                info:
                    'bg-slate-50/90 border-slate-200 text-slate-900 dark:bg-slate-900/90 dark:border-slate-800 dark:text-slate-100 shadow-xs',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

const iconMap = {
    default: <Info className="size-4.5 text-[#1e50ff]" />,
    brand: <Info className="size-4.5 text-[#1e50ff]" />,
    success: <CheckCircle2 className="size-4.5 text-emerald-600 dark:text-emerald-400" />,
    destructive: <AlertCircle className="size-4.5 text-rose-600 dark:text-rose-400" />,
    warning: <AlertTriangle className="size-4.5 text-amber-600 dark:text-amber-400" />,
    info: <Info className="size-4.5 text-slate-600 dark:text-slate-400" />,
};

const Alert = React.forwardRef(({ className, variant = 'default', children, onClose, ...props }, ref) => (
    <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
    >
        {iconMap[variant] || iconMap.default}
        <div className="flex-1 min-w-0 pr-6">
            {children}
        </div>
        {onClose && (
            <button
                type="button"
                onClick={onClose}
                className="absolute right-3.5 top-3.5 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                aria-label="Tutup pemberitahuan"
            >
                <X className="size-3.5" />
            </button>
        )}
    </div>
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h5
        ref={ref}
        className={cn('text-xs font-bold leading-none tracking-tight mb-1 text-slate-900 dark:text-white', className)}
        {...props}
    />
));
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal [&_p]:leading-relaxed', className)}
        {...props}
    />
));
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription, alertVariants };
