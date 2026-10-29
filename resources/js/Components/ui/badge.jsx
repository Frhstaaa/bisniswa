import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-md border px-2.5 py-0.5 text-[11px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-emerald-600 text-white hover:bg-emerald-700',
                secondary: 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200/80',
                destructive: 'border-red-200 bg-red-50 text-red-700',
                outline: 'text-slate-700 border-slate-200',
                amber: 'border-amber-200 bg-amber-50 text-amber-800',
                navy: 'border-emerald-200 bg-emerald-50 text-emerald-800',
                emerald: 'border-emerald-200 bg-emerald-50 text-emerald-800',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

function Badge({ className, variant, ...props }) {
    return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
