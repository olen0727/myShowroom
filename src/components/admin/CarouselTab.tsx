'use client';

import CarouselList from './carousel/CarouselList';
import CarouselEditor from './carousel/CarouselEditor';
import { CarouselProject } from '@/types';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

type CarouselTabProps = {
    initialProjectId?: string;
    standalone?: boolean;
};

/**
 * @deprecated CarouselTab is now split into CarouselList and CarouselEditor.
 * This component is kept for backward compatibility.
 */
export default function CarouselTab({ initialProjectId, standalone = false }: CarouselTabProps) {
    const [project, setProject] = useState<CarouselProject | null>(null);
    const [loading, setLoading] = useState(!!initialProjectId && initialProjectId !== 'new');

    useEffect(() => {
        if (initialProjectId && initialProjectId !== 'new') {
            supabase
                .from('carousel_projects')
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
        return <CarouselEditor initialProject={project || undefined} standalone={standalone} />;
    }

    return <CarouselList />;
}
