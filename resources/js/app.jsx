import '../css/app.css';
import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';

const appName = import.meta.env.VITE_APP_NAME || 'MARDIRA WA';

if (typeof window !== 'undefined') {
    // Scroll to top on every Inertia page transition
    router.on('navigate', () => {
        if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
        }
    });

    router.on('finish', () => {
        if (!window.location.hash) {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
            if (document.documentElement) document.documentElement.scrollTop = 0;
            if (document.body) document.body.scrollTop = 0;
        }
    });
}

createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, import.meta.glob('./Pages/**/*.jsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(
            <MotionConfig reducedMotion="user">
                <App {...props} />
            </MotionConfig>
        );
    },
    progress: {
        color: '#10b981',
        showSpinner: false,
    },
});
