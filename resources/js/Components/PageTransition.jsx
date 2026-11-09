import React from 'react';
import { motion } from 'framer-motion';

export const pageVariants = {
    initial: {
        opacity: 0,
        y: 4,
    },
    animate: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.12,
            ease: [0.25, 1, 0.5, 1],
        },
        transitionEnd: {
            transform: 'none',
        },
    },
};

export default function PageTransition({ children, routeKey, className = '' }) {
    return (
        <motion.div
            key={routeKey}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            className={`w-full ${className}`}
        >
            {children}
        </motion.div>
    );
}
