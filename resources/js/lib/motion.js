/**
 * MARDIRA WA Motion Design Tokens & Variants
 * Following GPU-accelerated guidelines (transform & opacity only)
 * Ultra-smooth physics with Framer Motion springs and custom cubic-beziers
 */

export const EASING_SPRING = [0.16, 1, 0.3, 1];
export const EASING_IN = [0.4, 0, 1, 1];
export const EASING_OUT = [0, 0, 0.2, 1];
export const EASING_SMOOTH = [0.22, 1, 0.36, 1];

export const SPRING_TIGHT = {
    type: 'spring',
    stiffness: 450,
    damping: 32,
};

export const SPRING_SMOOTH = {
    type: 'spring',
    stiffness: 280,
    damping: 26,
};

export const SPRING_BOUNCE = {
    type: 'spring',
    stiffness: 350,
    damping: 20,
};

export const DURATION_MICRO = 0.15;
export const DURATION_FAST = 0.2;
export const DURATION_NORMAL = 0.3;
export const DURATION_MODAL = 0.35;
export const DURATION_ENTRANCE = 0.55;

export const TRANSITION_FAST = {
    duration: DURATION_FAST,
    ease: EASING_SPRING,
};

export const TRANSITION_NORMAL = {
    duration: DURATION_NORMAL,
    ease: EASING_SPRING,
};

export const TRANSITION_SMOOTH = {
    duration: DURATION_ENTRANCE,
    ease: EASING_SPRING,
};

export const TAP_MICRO = {
    scale: 0.98,
    transition: { duration: 0.08, ease: 'easeOut' },
};

export const HOVER_LIFT = {
    y: -4,
    transition: SPRING_TIGHT,
};

export const HOVER_SCALE = {
    scale: 1.02,
    y: -3,
    transition: SPRING_TIGHT,
};

export const VIEWPORT_CONFIG = {
    once: true,
    amount: 0.15,
};

export const VIEWPORT_EARLY = {
    once: true,
    amount: 0.08,
};

export const STAGGER_CONTAINER = (staggerDelay = 0.08, delayChildren = 0.05) => ({
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: staggerDelay,
            delayChildren: delayChildren,
        },
    },
});

export const STAGGER_ITEM = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.45,
            ease: EASING_SPRING,
        },
    },
};

export const HERO_CONTAINER = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
            delayChildren: 0.06,
        },
    },
};

export const HERO_ITEM = {
    hidden: { opacity: 0, y: 22 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.55,
            ease: EASING_SPRING,
        },
    },
};

export const FADE_UP = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.5,
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

