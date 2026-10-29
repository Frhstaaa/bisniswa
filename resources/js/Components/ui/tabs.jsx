import * as React from 'react';
import { cn } from '../../lib/utils';

const TabsContext = React.createContext({
    value: '',
    onValueChange: () => {},
});

const Tabs = React.forwardRef(({ value, defaultValue = '', onValueChange, className, children, ...props }, ref) => {
    const [selected, setSelected] = React.useState(defaultValue);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : selected;

    const handleValueChange = React.useCallback(
        (val) => {
            if (!isControlled) {
                setSelected(val);
            }
            onValueChange?.(val);
        },
        [isControlled, onValueChange]
    );

    return (
        <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
            <div ref={ref} className={cn('flex flex-col gap-4', className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
});
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        role="tablist"
        className={cn(
            'inline-flex h-9 items-center justify-start rounded-lg bg-slate-100/90 p-1 text-slate-500 border border-slate-200/60',
            className
        )}
        {...props}
    />
));
TabsList.displayName = 'TabsList';

const TabsTrigger = React.forwardRef(({ className, value, children, disabled = false, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    const isSelected = context.value === value;

    return (
        <button
            ref={ref}
            type="button"
            role="tab"
            aria-selected={isSelected}
            disabled={disabled}
            onClick={() => context.onValueChange(value)}
            className={cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
                isSelected
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50',
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
});
TabsTrigger.displayName = 'TabsTrigger';

const TabsContent = React.forwardRef(({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext);
    if (context.value !== value) return null;

    return (
        <div
            ref={ref}
            role="tabpanel"
            className={cn(
                'ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2',
                className
            )}
            {...props}
        />
    );
});
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
