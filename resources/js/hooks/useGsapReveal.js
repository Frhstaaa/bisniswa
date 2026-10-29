import { useRef } from 'react';
import { gsap, useGSAP, ScrollTrigger } from '../lib/gsap';

/**
 * Custom GSAP Scroll and Page Entrance Animation Hook for React
 * Based on official GSAP React documentation (https://gsap.com/resources/React/)
 * 
 * Automatically handles:
 * - Scoped queries inside containerRef using useGSAP
 * - Hero stagger entrance on mount (.gsap-hero-item)
 * - ScrollTrigger batching for cards, sections, and grids (.gsap-reveal, .gsap-card-grid, .gsap-card)
 * - Directional reveals (.gsap-reveal-left, .gsap-reveal-right)
 * - CTA and banner bounce pop (.gsap-scale)
 * - Automatic cleanup and garbage collection on unmount
 * - Full respect for prefers-reduced-motion
 * - clearProps: 'transform' so Framer Motion hover/tap interactions remain smooth & unblocked
 */
export function useGsapReveal(dependencies = []) {
    const containerRef = useRef(null);

    useGSAP(
        () => {
            if (typeof window === 'undefined' || !containerRef.current) return;

            // Check accessibility prefers-reduced-motion
            const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (prefersReducedMotion) {
                // Instantly show all elements without motion for users who prefer reduced motion
                gsap.set(
                    containerRef.current.querySelectorAll(
                        '.gsap-hero-item, .gsap-reveal, .gsap-reveal-left, .gsap-reveal-right, .gsap-card, .gsap-scale'
                    ),
                    { opacity: 1, y: 0, x: 0, scale: 1 }
                );
                return;
            }

            // 1. Hero Elements Entrance (Mount Timeline)
            const heroItems = containerRef.current.querySelectorAll('.gsap-hero-item');
            if (heroItems.length > 0) {
                gsap.fromTo(
                    heroItems,
                    { opacity: 0, y: 28 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.75,
                        stagger: 0.08,
                        ease: 'power3.out',
                        clearProps: 'transform',
                    }
                );
            }

            // 2. ScrollTrigger for Standalone Section Headers / Single Blocks (.gsap-reveal)
            const revealItems = gsap.utils.toArray(
                containerRef.current.querySelectorAll('.gsap-reveal')
            );
            revealItems.forEach((elem) => {
                gsap.fromTo(
                    elem,
                    { opacity: 0, y: 32 },
                    {
                        opacity: 1,
                        y: 0,
                        duration: 0.7,
                        ease: 'power3.out',
                        clearProps: 'transform',
                        scrollTrigger: {
                            trigger: elem,
                            start: 'top 88%',
                            once: true,
                        },
                    }
                );
            });

            // 3. Directional Scroll Reveals (.gsap-reveal-left & .gsap-reveal-right)
            const revealLeftItems = gsap.utils.toArray(
                containerRef.current.querySelectorAll('.gsap-reveal-left')
            );
            revealLeftItems.forEach((elem) => {
                gsap.fromTo(
                    elem,
                    { opacity: 0, x: -35 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.75,
                        ease: 'power3.out',
                        clearProps: 'transform',
                        scrollTrigger: {
                            trigger: elem,
                            start: 'top 85%',
                            once: true,
                        },
                    }
                );
            });

            const revealRightItems = gsap.utils.toArray(
                containerRef.current.querySelectorAll('.gsap-reveal-right')
            );
            revealRightItems.forEach((elem) => {
                gsap.fromTo(
                    elem,
                    { opacity: 0, x: 35 },
                    {
                        opacity: 1,
                        x: 0,
                        duration: 0.75,
                        ease: 'power3.out',
                        clearProps: 'transform',
                        scrollTrigger: {
                            trigger: elem,
                            start: 'top 85%',
                            once: true,
                        },
                    }
                );
            });

            // 4. ScrollTrigger for Card Grids (.gsap-card-grid & .gsap-card)
            const cardGrids = gsap.utils.toArray(
                containerRef.current.querySelectorAll('.gsap-card-grid')
            );
            cardGrids.forEach((grid) => {
                const cards = grid.querySelectorAll('.gsap-card');
                if (cards.length > 0) {
                    gsap.fromTo(
                        cards,
                        { opacity: 0, y: 36 },
                        {
                            opacity: 1,
                            y: 0,
                            duration: 0.65,
                            stagger: 0.08,
                            ease: 'power3.out',
                            clearProps: 'transform',
                            scrollTrigger: {
                                trigger: grid,
                                start: 'top 86%',
                                once: true,
                            },
                        }
                    );
                }
            });

            // 5. ScrollTrigger for CTA & Banner Pop (.gsap-scale)
            const scaleItems = gsap.utils.toArray(
                containerRef.current.querySelectorAll('.gsap-scale')
            );
            scaleItems.forEach((elem) => {
                gsap.fromTo(
                    elem,
                    { opacity: 0, scale: 0.94 },
                    {
                        opacity: 1,
                        scale: 1,
                        duration: 0.65,
                        ease: 'back.out(1.4)',
                        clearProps: 'transform',
                        scrollTrigger: {
                            trigger: elem,
                            start: 'top 86%',
                            once: true,
                        },
                    }
                );
            });

            // Refresh ScrollTrigger after DOM has fully settled
            const timer = setTimeout(() => {
                ScrollTrigger.refresh();
            }, 100);

            return () => clearTimeout(timer);
        },
        { scope: containerRef, dependencies }
    );

    return containerRef;
}
