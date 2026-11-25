import React from 'react';

/**
 * SAPA Unified Brand Logo Component (100% Transparent Background)
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
    showTagline = true,
    className = '',
}) {
    const sizeConfig = {
        sm: {
            iconBox: 'w-8 h-8',
            imgHeight: 'h-8',
            titleText: 'text-base font-black',
            badgeText: 'text-[9px] px-1.5 py-0.5 font-bold',
            taglineText: 'text-[9.5px]',
            gap: 'gap-2.5',
            marginBetween: 'mt-1',
        },
        md: {
            iconBox: 'w-10 h-10',
            imgHeight: 'h-10',
            titleText: 'text-lg font-black',
            badgeText: 'text-[10px] px-2 py-0.5 font-bold',
            taglineText: 'text-[11px]',
            gap: 'gap-3',
            marginBetween: 'mt-1',
        },
        lg: {
            iconBox: 'w-11 h-11',
            imgHeight: 'h-11',
            titleText: 'text-xl font-black',
            badgeText: 'text-[10.5px] px-2.5 py-0.5 font-bold',
            taglineText: 'text-xs',
            gap: 'gap-3.5',
            marginBetween: 'mt-1.5',
        },
        xl: {
            iconBox: 'w-13 h-13',
            imgHeight: 'h-13',
            titleText: 'text-2xl font-black',
            badgeText: 'text-xs px-2.5 py-1 font-bold',
            taglineText: 'text-[13px]',
            gap: 'gap-4',
            marginBetween: 'mt-2',
        },
    };

    const cfg = sizeConfig[size] || sizeConfig.md;

    // Direct Image-only variant
    if (variant === 'image') {
        return (
            <img
                src={theme === 'dark' ? '/images/logo-white.png' : '/images/logo.png'}
                alt="SAPA Logo"
                className={`${cfg.imgHeight} w-auto object-contain shrink-0 select-none ${className}`}
            />
        );
    }

    // Icon Mark Only (For Collapsed Sidebar, mobile header dock, or favicon)
    if (variant === 'icon') {
        return (
            <div className={`relative shrink-0 flex items-center justify-center ${className}`}>
                <img
                    src="/images/logo-icon.png"
                    alt="SAPA Icon"
                    className={`${cfg.iconBox} w-auto object-contain shrink-0 select-none transition-transform duration-200 group-hover:scale-105`}
                />
            </div>
        );
    }

    // Full Brand (Icon Mark + Exact Balanced Typography Lockup) - 100% Transparent
    return (
        <div className={`flex items-center ${cfg.gap} overflow-hidden select-none shrink-0 ${className}`}>
            {/* Left Anchor Icon Mark */}
            <div className="relative shrink-0 flex items-center justify-center">
                <img
                    src="/images/logo-icon.png"
                    alt="SAPA Icon"
                    className={`${cfg.iconBox} w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105`}
                />
            </div>

            {/* Right Balanced Typography Stack */}
            <div className="flex flex-col justify-center min-w-0 text-left">
                {/* Upper Line: SAPA + ENGINE Pill */}
                <div className="flex items-center gap-2 leading-none">
                    <span className={`tracking-tight ${cfg.titleText} ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        SAPA
                    </span>
                    <span
                        className={`font-mono uppercase rounded-md tracking-wider leading-none shrink-0 ${cfg.badgeText} ${
                            theme === 'dark'
                                ? 'bg-blue-950/90 text-cyan-300 border border-blue-700/60 shadow-xs'
                                : 'bg-[#e6f4ff] text-[#1677ff] border border-[#91caff]/60 shadow-2xs'
                        }`}
                    >
                        ENGINE
                    </span>
                </div>

                {/* Lower Line: Subtitle / Tagline */}
                {showTagline && (
                    <span
                        className={`font-semibold tracking-tight truncate leading-none ${cfg.marginBetween} ${cfg.taglineText} ${
                            theme === 'dark' ? 'text-slate-300' : 'text-slate-500'
                        }`}
                    >
                        Sistem Automisasi Pesan &amp; Alert
                    </span>
                )}
            </div>
        </div>
    );
}
