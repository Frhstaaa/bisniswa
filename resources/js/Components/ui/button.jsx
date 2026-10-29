import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0 active:scale-[0.98]',
    {
        variants: {
            variant: {
                default: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
                destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
                outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-700 shadow-xs',
                secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200/80',
                ghost: 'hover:bg-slate-100 hover:text-slate-900 text-slate-600',
                link: 'text-emerald-700 underline-offset-4 hover:underline',
                amber: 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold shadow-sm',
                emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-lg px-6 text-sm',
                icon: 'h-8 w-8',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
