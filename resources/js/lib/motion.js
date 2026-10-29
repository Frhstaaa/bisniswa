/**
 * MARDIRA WA Motion Design Tokens & Variants
 * Following GPU-accelerated guidelines (transform & opacity only)
 * Micro-interactions: 100-200ms
 * Section/Card entrances: 250-400ms
 * Modals/Drawers: 300-400ms
 */

export const EASING_SPRING = [0.16, 1, 0.3, 1];
export const EASING_IN = [0.4, 0, 1, 1];
export const EASING_OUT = [0, 0, 0.2, 1];

export const DURATION_MICRO = 0.15;
export const DURATION_FAST = 0.2;
export const DURATION_NORMAL = 0.3;
export const DURATION_MODAL = 0.35;

export const TRANSITION_FAST = {
    duration: DURATION_FAST,
    ease: EASING_SPRING,
};

export const TRANSITION_NORMAL = {
    duration: DURATION_NORMAL,
    ease: EASING_SPRING,
};

export const TAP_MICRO = {
    scale: 0.98,
    transition: { duration: 0.08, ease: 'easeOut' },
};

export const HOVER_LIFT = {
    y: -3,
    transition: { duration: 0.2, ease: EASING_SPRING },
};

export const STAGGER_CONTAINER = (staggerDelay = 0.04) => ({
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay,
        },
    },
});

export const STAGGER_ITEM = {
    hidden: { opacity: 0, y: 10 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.25,
            ease: EASING_SPRING,
        },
    },
};

export const FADE_IN_SCALE = {
    hidden: { opacity: 0, scale: 0.96 },
    show: {
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.25,
            ease: EASING_SPRING,
        },
    },
    exit: {
        opacity: 0,
        scale: 0.96,
        transition: {
            duration: 0.15,
            ease: EASING_IN,
        },
    },
};
