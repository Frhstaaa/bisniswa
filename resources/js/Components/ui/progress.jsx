import * as React from 'react';
import { cn } from '../../lib/utils';

const Progress = React.forwardRef(({ className, value = 0, indicatorClassName, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100', className)}
        {...props}
    >
        <div
            className={cn('h-full w-full flex-1 bg-emerald-600 transition-all duration-300', indicatorClassName)}
            style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value || 0))}%)` }}
        />
    </div>
));
Progress.displayName = 'Progress';

export { Progress };
