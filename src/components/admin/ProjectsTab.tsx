'use client';

import ProjectList from './projects/ProjectList';
import ProjectEditor from './projects/ProjectEditor';
import { Project } from '@/types';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

type ProjectsTabProps = {
    initialProjectId?: string;
    standalone?: boolean;
};

/**
 * @deprecated ProjectsTab is now split into ProjectList and ProjectEditor.
 * This component is kept for backward compatibility if needed, but should be replaced.
 */
export default function ProjectsTab({ initialProjectId, standalone = false }: ProjectsTabProps) {
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(!!initialProjectId);

    useEffect(() => {
        if (initialProjectId) {
            supabase
                .from('projects')
                .select('*')
                .eq('id', initialProjectId)
                .single()
                .then(({ data }) => {
                    if (data) setProject(data);
                    setLoading(false);
                });
        }
    }, [initialProjectId]);

    if (standalone || initialProjectId) {
        if (loading) return <div>Loading...</div>;
        return <ProjectEditor initialProject={project || undefined} standalone={standalone} />;
    }

    return <ProjectList />;
}
