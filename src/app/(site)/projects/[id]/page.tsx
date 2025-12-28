'use client';

import { useParams, useRouter } from 'next/navigation';
import ProjectDetailContent from '@/components/projects/ProjectDetailContent';

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/#projects');
        }
    };

    return (
        <ProjectDetailContent
            projectId={projectId}
            onClose={handleBack}
            backLabel="Back"
        />
    );
}
