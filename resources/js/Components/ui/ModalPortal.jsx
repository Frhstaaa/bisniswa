import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalPortal: Teleports modal dialogs directly into document.body.
 *
 * This ensures modals:
 * 1. Span the entire browser viewport (covering sidebar, topbar, and full screen).
 * 2. Blur the complete background uniformly with backdrop-blur.
 * 3. Float in the true geometric center of the screen without being confined
 *    by parent containers, layout margins (e.g. lg:pl-64), or CSS transform stacking contexts.
 * 4. Lock background body scrolling while active.
 * 5. Handle ESC key press to close gracefully.
 */
export default function ModalPortal({ children, isOpen = true, onClose }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    // Lock background scroll when modal is open
    useEffect(() => {
        if (!isOpen) return;

        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    // Handle ESC key press
    useEffect(() => {
        if (!isOpen || !onClose) return;

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!mounted || typeof document === 'undefined') {
        return null;
    }

    return createPortal(children, document.body);
}
