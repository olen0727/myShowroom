'use client';

import { useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import ProjectDetailContent from './ProjectDetailContent';
import styles from '@/app/(site)/projects/[id]/ProjectDetail.module.css';

export default function ProjectDetailOverlay() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const projectId = searchParams.get('projectId');

    const handleClose = useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.replace('/');
        }
    }, [router]);

    useEffect(() => {
        if (!projectId) return;

        const { body, documentElement } = document;
        const previousOverflow = body.style.overflow;
        const previousPaddingRight = body.style.paddingRight;
        const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

        body.style.overflow = 'hidden';
        if (scrollbarWidth > 0) {
            body.style.paddingRight = `${scrollbarWidth}px`;
        }

        return () => {
            body.style.overflow = previousOverflow;
            body.style.paddingRight = previousPaddingRight;
        };
    }, [projectId]);

    useEffect(() => {
        if (!projectId) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [projectId, handleClose]);

    return (
        <AnimatePresence>
            {projectId && (
                <motion.div
                    className={styles.overlayPanel}
                    role="dialog"
                    aria-modal="true"
                    initial={{ x: '100%', opacity: 0.6 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: '100%', opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                >
                    <ProjectDetailContent
                        projectId={projectId}
                        onClose={handleClose}
                        backLabel="Close"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
