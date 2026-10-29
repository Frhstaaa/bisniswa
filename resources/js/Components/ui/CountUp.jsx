import React, { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Animated Number Counter
 * Smooth GPU-friendly counter for dashboard metrics & KPIs
 */
export default function CountUp({
    to,
    from = 0,
    duration = 0.5,
    prefix = '',
    suffix = '',
    formatter,
    className = '',
}) {
    const shouldReduceMotion = useReducedMotion();
    const target = typeof to === 'number' ? to : parseFloat(String(to).replace(/[^0-9.-]+/g, '')) || 0;
    const [current, setCurrent] = useState(shouldReduceMotion ? target : from);

    useEffect(() => {
        if (shouldReduceMotion) {
            setCurrent(target);
            return;
        }

        let startTimestamp = null;
        let animationFrameId;
        const startValue = from;
        const change = target - startValue;
        const durationMs = duration * 1000;

        const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
            const easedProgress = easeOutExpo(progress);
            
            const currentVal = startValue + change * easedProgress;
            setCurrent(currentVal);

            if (progress < 1) {
                animationFrameId = requestAnimationFrame(step);
            } else {
                setCurrent(target);
            }
        };

        animationFrameId = requestAnimationFrame(step);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [target, from, duration, shouldReduceMotion]);

    const displayValue = () => {
        const rounded = Math.round(current);
        if (formatter) {
            return formatter(rounded);
        }
        return rounded.toLocaleString('id-ID');
    };

    return (
        <span className={`inline-block tabular-nums ${className}`}>
            {prefix}
            {displayValue()}
            {suffix}
        </span>
    );
}
