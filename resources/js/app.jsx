import '../css/app.css';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { MotionConfig } from 'framer-motion';

const appName = import.meta.env.VITE_APP_NAME || 'KirimWA Pro';

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
