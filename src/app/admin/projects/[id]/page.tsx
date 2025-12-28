'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import ProjectEditor from '@/components/admin/projects/ProjectEditor';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';

export default function EditProjectPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .eq('id', params.id)
                .single();

            if (error) {
                console.error('Error fetching project:', error);
                router.push('/admin/projects'); // Redirect on error
            } else {
                setProject(data);
            }
            setLoading(false);
        };

        if (params.id) {
            fetchProject();
        }
    }, [params.id, router]);

    if (loading) {
        return (
            <AdminShell>
                <div className="flex items-center justify-center h-full">Loading...</div>
            </AdminShell>
        );
    }

    if (!project) return null;

    return (
        <AdminShell>
            <ProjectEditor
                initialProject={project}
                onSave={() => router.push('/admin/projects')}
                onCancel={() => router.push('/admin/projects')}
                standalone
            />
        </AdminShell>
    );
}
