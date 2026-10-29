import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({ className, ...props }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-slate-200 dark:bg-slate-800/80',
                className
            )}
            {...props}
        />
    );
}

export function TableRowSkeleton({ columns = 5 }) {
    return (
        <tr className="border-b border-slate-100 dark:border-slate-800/60 animate-pulse">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="p-4">
                    <Skeleton className="h-4 w-full max-w-[120px] rounded" />
                </td>
            ))}
        </tr>
    );
}

export function CardSkeleton() {
    return (
        <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-36 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
        </div>
    );
}
