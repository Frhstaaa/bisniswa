import React from 'react';

/**
 * SAPA official brand logo component.
 * 
 * Sizing:
 * - 'sm': Mobile topbars, compact tables, small modals (Icon 32px, Text balanced)
 * - 'md': Desktop sidebar header, standard modals, compact cards (Icon 38px, Text balanced)
 * - 'lg': Public landing top navbar, footer, prominent cards (Icon 44px, Text balanced)
 * - 'xl': Auth pages (Login, Register, Password Reset) (Icon 52px, Text balanced)
 */
export default function SapaLogo({
    variant = 'full',
    theme = 'light',
    size = 'md',
    className = '',
}) {
    const sizeConfig = {
        sm: {
            iconBox: 'w-8 h-8',
            imgHeight: 'h-8',
        },
        md: {
            iconBox: 'w-10 h-10',
            imgHeight: 'h-10',
        },
        lg: {
            iconBox: 'w-11 h-11',
            imgHeight: 'h-11',
        },
        xl: {
            iconBox: 'w-13 h-13',
            imgHeight: 'h-13',
        },
    };

    const cfg = sizeConfig[size] || sizeConfig.md;

    const iconSource = theme === 'dark'
        ? '/images/logo-icon-white.svg?v=6'
        : '/images/logo-icon.svg?v=6';

    // Icon Mark Only (For Collapsed Sidebar, mobile header dock, or favicon)
    if (variant === 'icon') {
        return (
            <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
                <img
                    src={iconSource}
                    alt="SAPA Icon"
                    className={`${cfg.iconBox} w-auto object-contain shrink-0 select-none transition-transform duration-200 group-hover:scale-105`}
                />
            </div>
        );
    }

    // Full lockup uses the official artwork, including its wordmark and tagline.
    return (
        <img
            src="/images/logo.svg?v=6"
            alt="SAPA — Sistem Automisasi Pesan & Alert"
            className={`${cfg.imgHeight} w-auto max-w-full object-contain shrink-0 select-none transition-transform duration-200 group-hover:scale-[1.02] ${
                theme === 'dark' ? 'brightness-0 invert' : ''
            } ${className}`}
        />
    );
}
