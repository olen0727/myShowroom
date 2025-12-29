'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Input,
    Button,
    Chip,
    Card,
    CardBody,
    CardHeader,
} from "@nextui-org/react";
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    GripVertical
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
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
    useSortable,
    rectSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project } from '@/types';
import { preventMouseDown, normalizeHexColor, getContrastColor, hashTag } from '@/lib/utils';
import { DEFAULT_TAG_COLORS, TAG_COLORS_TABLE } from '@/lib/constants';

// --- Sortable Item Component ---
function SortableProjectItem({
    project,
    onEdit,
    onDelete,
}: {
    project: Project;
    onEdit: (project: Project) => void;
    onDelete: (id: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: project.id });

    // Use a simpler tag color logic for list view to avoid complex map passing if acceptable
    // or fetch it if needed. For now, using default hash.
    const getTagColor = (tag: string) => DEFAULT_TAG_COLORS[hashTag(tag) % DEFAULT_TAG_COLORS.length];

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 1,
        position: 'relative'
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            <Card className="w-full bg-content1 border border-white/5 hover:border-white/20 transition-all">
                <CardHeader className="flex gap-3 justify-between items-start">
                    <div className="flex gap-3 items-center overflow-hidden">
                        <button
                            className="text-default-400 hover:text-white cursor-grab active:cursor-grabbing"
                            onMouseDown={preventMouseDown}
                            {...listeners}
                        >
                            <GripVertical size={20} />
                        </button>
                        <div className="flex flex-col shrink">
                            <p className="text-md font-bold truncate">{project.title}</p>
                            <p className="text-small text-default-500 capitalize">{project.category || 'Uncategorized'}</p>
                        </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                        <Button
                            isIconOnly
                            variant="flat"
                            size="sm"
                            onPress={() => onEdit(project)}
                            className="bg-default-100 hover:bg-default-200"
                        >
                            <Edit2 size={16} />
                        </Button>
                        <Button
                            isIconOnly
                            color="danger"
                            variant="flat"
                            size="sm"
                            onPress={() => onDelete(project.id)}
                            className="bg-danger-50 hover:bg-danger-100"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                </CardHeader>
                <CardBody className="px-3 py-0 pb-3 gap-3">
                    {project.images?.[0] && (
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/20">
                            <Image
                                src={project.images[0]}
                                alt={project.title}
                                fill
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div className="flex flex-wrap gap-1">
                        {project.tags?.slice(0, 4).map((tag) => (
                            <Chip
                                key={tag}
                                size="sm"
                                variant="flat"
                                className="border border-white/10"
                                style={{
                                    backgroundColor: getTagColor(tag),
                                    color: getContrastColor(getTagColor(tag))
                                }}
                            >
                                {tag}
                            </Chip>
                        ))}
                        {(project.tags?.length || 0) > 4 && (
                            <Chip size="sm" variant="flat">+{project.tags!.length - 4}</Chip>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

export default function ProjectList() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setProjects(data || []);
        } catch (error: any) {
            console.error('Error fetching projects:', error);
            toast.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleEdit = (project: Project) => {
        // Navigate to edit page
        router.push(`/admin/projects/${project.id}`);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;
        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
            setProjects(prev => prev.filter(p => p.id !== id));
            toast.success('Project deleted');
        } catch (error: any) {
            console.error('Error deleting project:', error);
            toast.error('Failed to delete project');
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const previousItems = projects;
        const oldIndex = projects.findIndex(p => p.id === active.id);
        const newIndex = projects.findIndex(p => p.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;

        const newItems = arrayMove(projects, oldIndex, newIndex);
        setProjects(newItems);

        const updates = newItems.map((item, index) => ({
            id: item.id,
            display_order: index,
        }));

        const results = await Promise.all(
            updates.map((update) =>
                supabase
                    .from('projects')
                    .update({ display_order: update.display_order })
                    .eq('id', update.id)
            )
        );

        const errors = results.map((result) => result.error).filter(Boolean);
        if (errors.length > 0) {
            console.error('Failed to save order:', errors);
            toast.error('Failed to save order');
            setProjects(previousItems);
        }
    };

    const filteredProjects = projects.filter(project =>
        project.title.toLowerCase().includes(filterValue.toLowerCase()) ||
        project.category?.toLowerCase().includes(filterValue.toLowerCase())
    );

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
                <Button color="primary" onPress={() => router.push('/admin/projects/new')} endContent={<Plus />}>
                    Add New
                </Button>
            </div>

            {loading ? (
                <div className="text-center text-default-500 py-12">Loading projects...</div>
            ) : filterValue ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <SortableProjectItem
                            key={project.id}
                            project={project}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={projects.map(p => p.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects.map((project) => (
                                <SortableProjectItem
                                    key={project.id}
                                    project={project}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}
