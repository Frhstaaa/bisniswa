import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const pageVariants = {
    initial: {
        opacity: 0,
        y: 8,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.18,
            ease: [0.16, 1, 0.3, 1],
        },
        transitionEnd: {
            transform: 'none',
        },
    },
    exit: {
        opacity: 0,
        y: -6,
        transition: {
            duration: 0.12,
            ease: 'easeIn',
        },
    },
};

export default function PageTransition({ children, routeKey, className = '' }) {
    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={routeKey}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`w-full ${className}`}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
