import * as React from 'react';
import { cn } from '../../lib/utils';

const Avatar = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200/60', className)}
        {...props}
    />
));
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef(({ className, src, alt = '', ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    if (hasError || !src) return null;

    return (
        <img
            ref={ref}
            src={src}
            alt={alt}
            onError={() => setHasError(true)}
            className={cn('aspect-square size-full object-cover', className)}
            {...props}
        />
    );
});
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'flex size-full items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600 text-xs select-none',
            className
        )}
        {...props}
    />
));
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarImage, AvatarFallback };
