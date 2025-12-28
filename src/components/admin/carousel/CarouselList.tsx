'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input, Button } from "@nextui-org/react";
import { Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
    DndContext,
    closestCenter,
    useSensor,
    useSensors,
    DragEndEvent,
    PointerSensor,
    KeyboardSensor
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';

import { CarouselProject } from '@/types';
import { TAG_COLORS_TABLE, DEFAULT_TAG_COLORS } from '@/lib/constants';
import { normalizeHexColor, getContrastColor } from '@/lib/utils';
import { CarouselItem } from './CarouselItem';

export default function CarouselList() {
    const router = useRouter();
    const [projects, setProjects] = useState<CarouselProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");
    const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        fetchProjects();
        fetchTagColors();
    }, []);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('carousel_projects')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching carousel projects:', error);
            // toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const fetchTagColors = async () => {
        const { data } = await supabase.from(TAG_COLORS_TABLE).select('tag,color');
        const nextMap: Record<string, string> = {};
        (data || []).forEach((row: any) => {
            if (row.tag && row.color) nextMap[row.tag] = normalizeHexColor(row.color);
        });
        setTagColorMap(nextMap);
    };

    const handleCreateNew = () => {
        router.push('/admin/carousel/new');
    };

    const handleEdit = (project: CarouselProject) => {
        router.push(`/admin/carousel/${project.id}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            const { error } = await supabase.from('carousel_projects').delete().eq('id', id);
            if (error) throw error;
            setProjects(projects.filter(p => p.id !== id));
            toast.success('Project deleted');
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error('Failed to delete project');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setProjects((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                const updates = newItems.map((p, idx) => ({ id: p.id, display_order: idx + 1 }));

                // Optimistic update, background sync
                (async () => {
                    try {
                        for (const update of updates) {
                            await supabase.from('carousel_projects').update({ display_order: update.display_order }).eq('id', update.id);
                        }
                    } catch (err) {
                        console.error('Failed to update order in DB', err);
                    }
                })();

                return newItems;
            });
        }
    };

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(filterValue.toLowerCase())
    );

    if (loading) return <div>Loading projects...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between gap-3 items-end">
                <Input
                    isClearable
                    className="w-full sm:max-w-[44%]"
                    placeholder="Search by name..."
                    startContent={<Search className="text-default-300" />}
                    value={filterValue}
                    onClear={() => setFilterValue("")}
                    onValueChange={setFilterValue}
                />
                <Button color="primary" endContent={<Plus />} onPress={handleCreateNew}>
                    Add New
                </Button>
            </div>

            {
                filterValue ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <CarouselItem
                                key={project.id}
                                project={project}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                tagColorMap={tagColorMap}
                            />
                        ))}
                    </div>
                ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={projects.map(p => p.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map((project) => (
                                    <CarouselItem
                                        key={project.id}
                                        project={project}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        tagColorMap={tagColorMap}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )
            }
        </div >
    );
}
