import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

if (typeof window !== 'undefined') {
    gsap.registerPlugin(useGSAP, ScrollTrigger);
    
    // Set default ease & config
    gsap.defaults({
        ease: 'power3.out',
        duration: 0.7,
    });
}

export { gsap, useGSAP, ScrollTrigger };
