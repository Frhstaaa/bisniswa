import * as React from 'react';
import { cn } from '../../lib/utils';

const Card = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('rounded-xl border border-[#e6ebf1] bg-white text-[#262626] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-all', className)}
        {...props}
    />
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col gap-1.5 p-5', className)} {...props} />
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('font-semibold leading-none tracking-tight text-[#262626]', className)} {...props} />
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-xs text-[#8c8c8c]', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-5 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-5 pt-0', className)} {...props} />
));
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
