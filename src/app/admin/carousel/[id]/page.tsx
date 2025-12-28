'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CarouselProject } from '@/types';
import CarouselEditor from '@/components/admin/carousel/CarouselEditor';
import AdminShell from '@/components/admin/AdminShell';

export default function EditCarouselProjectPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [project, setProject] = useState<CarouselProject | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            if (params.id === 'new') {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('carousel_projects')
                .select('*')
                .eq('id', params.id)
                .single();

            if (data) setProject(data);
            setLoading(false);
        };
        fetchProject();
    }, [params.id]);

    const handleSave = () => {
        router.push('/admin/carousel');
    };

    const handleCancel = () => {
        router.push('/admin/carousel');
    };

    if (loading) {
        return (
            <AdminShell>
                <div className="flex items-center justify-center p-8">
                    <div className="text-default-500">Loading...</div>
                </div>
            </AdminShell>
        );
    }

    return (
        <AdminShell>
            <CarouselEditor
                initialProject={project || undefined}
                onSave={handleSave}
                onCancel={handleCancel}
                standalone
            />
        </AdminShell>
    );
}
