import * as React from 'react';
import { cn } from '@/lib/utils';

export function Switch({
    checked = false,
    onCheckedChange,
    disabled = false,
    className = '',
    size = 'default', // 'sm' | 'default'
    id,
    ...props
}) {
    const isSm = size === 'sm';

    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            id={id}
            disabled={disabled}
            onClick={(e) => {
                e.stopPropagation();
                if (!disabled && onCheckedChange) {
                    onCheckedChange(!checked);
                }
            }}
            className={cn(
                'relative inline-flex shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 select-none',
                isSm ? 'h-4 w-7' : 'h-5 w-9 sm:h-6 sm:w-11',
                checked ? 'bg-emerald-600' : 'bg-slate-200 hover:bg-slate-300',
                className
            )}
            {...props}
        >
            <span
                className={cn(
                    'pointer-events-none block rounded-full bg-white shadow-sm ring-0 transition-transform duration-200',
                    isSm
                        ? (checked ? 'translate-x-3 h-3 w-3' : 'translate-x-0.5 h-3 w-3')
                        : (checked ? 'translate-x-4 sm:translate-x-5 h-4 w-4 sm:h-5 sm:w-5' : 'translate-x-0.5 sm:translate-x-1 h-4 w-4 sm:h-5 sm:w-5')
                )}
            />
        </button>
    );
}

export default Switch;
