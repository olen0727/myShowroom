'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Input,
    Button,
    Textarea,
    Image as NextImage, // Conflicts with next/image, using alias if needed or just component
} from "@nextui-org/react";
import { ExternalLink, Github, Image as ImageIcon } from 'lucide-react';
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
    rectSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';

import { CarouselProject } from '@/types';
import {
    normalizeHexColor,
    hashTag,
    getContrastColor
} from '@/lib/utils';
import { TAG_COLORS_TABLE, DEFAULT_TAG_COLORS } from '@/lib/constants';
import { SortableTagItem } from '@/components/admin/shared/SortableTagItem';

interface CarouselEditorProps {
    initialProject?: CarouselProject;
    onSave?: (project: CarouselProject) => void;
    onCancel?: () => void;
    standalone?: boolean;
}

export default function CarouselEditor({ initialProject, onSave, onCancel, standalone = false }: CarouselEditorProps) {
    const router = useRouter();
    const [project, setProject] = useState<Partial<CarouselProject>>({
        title: '',
        description: '',
        image: '',
        tags: [],
        demo_url: '',
        github_url: '',
        ...initialProject
    });
    const [tagInput, setTagInput] = useState("");
    const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        const fetchTagColors = async () => {
            const { data } = await supabase.from(TAG_COLORS_TABLE).select('tag,color');
            const nextMap: Record<string, string> = {};
            (data || []).forEach((row: any) => {
                if (row.tag && row.color) nextMap[row.tag] = normalizeHexColor(row.color);
            });
            setTagColorMap(nextMap);
        };
        fetchTagColors();
    }, []);

    const getTagColor = useCallback((tag: string) => {
        const stored = tagColorMap[tag];
        const normalized = stored ? normalizeHexColor(stored) : '';
        if (normalized) return normalized;
        return DEFAULT_TAG_COLORS[hashTag(tag) % DEFAULT_TAG_COLORS.length];
    }, [tagColorMap]);

    const handleTagColorChange = async (tag: string, color: string) => {
        const normalized = normalizeHexColor(color);
        if (!normalized) return;
        setTagColorMap(prev => ({ ...prev, [tag]: normalized }));
        await supabase.from(TAG_COLORS_TABLE).upsert({ tag, color: normalized });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage.from('carousel-images').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('carousel-images').getPublicUrl(filePath);
            setProject(prev => ({ ...prev, image: publicUrl }));
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error(`Image upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (!project.tags?.includes(newTag)) {
                setProject(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setProject(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tagToRemove) }));
    };

    const handleTagDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setProject((prev) => {
                const oldIndex = (prev.tags || []).indexOf(active.id as string);
                const newIndex = (prev.tags || []).indexOf(over?.id as string);
                return { ...prev, tags: arrayMove(prev.tags || [], oldIndex, newIndex) };
            });
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const payload = {
                ...project,
                // updated_at: new Date().toISOString() // Column does not exist
            };

            if (!project.id) {
                // Get max order
                const { data: orderRows } = await supabase
                    .from('carousel_projects')
                    .select('display_order')
                    .order('display_order', { ascending: false })
                    .limit(1);
                const maxOrder = orderRows?.[0]?.display_order || 0;
                (payload as any).display_order = maxOrder + 1;
            }

            const { data, error } = await supabase
                .from('carousel_projects')
                .upsert(payload)
                .select()
                .single();

            if (error) throw error;
            toast.success('Project saved successfully');
            if (onSave && data) onSave(data as CarouselProject);
        } catch (error: any) {
            console.error('Error saving carousel :', error);
            toast.error('Failed to save carousel project');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">{project.id ? 'Edit Carousel Project' : 'New Carousel Project'}</h2>
                    <p className="text-sm text-default-500">Edit carousel project details.</p>
                </div>
                <div className="flex gap-2">
                    {onCancel && <Button variant="flat" onPress={onCancel}>Cancel</Button>}
                    <Button color="primary" onPress={handleSave} isLoading={saving}>Save Carousel</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <Textarea
                        label="Title"
                        placeholder="Project Name"
                        value={project.title}
                        onValueChange={val => setProject({ ...project, title: val })}
                        variant="bordered"
                        minRows={1}
                    />
                    <Textarea
                        label="Description"
                        value={project.description}
                        onValueChange={val => setProject({ ...project, description: val })}
                        variant="bordered"
                        minRows={5}
                    />
                    <div className="space-y-2">
                        <Input
                            label="Tags"
                            value={tagInput}
                            onValueChange={setTagInput}
                            onKeyDown={handleAddTag}
                            variant="bordered"
                        />
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleTagDragEnd}>
                            <SortableContext items={project.tags || []} strategy={rectSortingStrategy}>
                                <div className="flex flex-wrap gap-2">
                                    {(project.tags || []).map((tag) => (
                                        <SortableTagItem
                                            key={tag}
                                            tag={tag}
                                            color={getTagColor(tag)}
                                            textColor={getContrastColor(getTagColor(tag))}
                                            onRemove={removeTag}
                                            onColorChange={handleTagColorChange}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                    <div className="flex gap-4">
                        <Input
                            label="Demo Link"
                            startContent={<ExternalLink size={16} />}
                            value={project.demo_url || ''}
                            onValueChange={val => setProject({ ...project, demo_url: val })}
                            variant="bordered"
                        />
                        <Input
                            label="GitHub Link"
                            startContent={<Github size={16} />}
                            value={project.github_url || ''}
                            onValueChange={val => setProject({ ...project, github_url: val })}
                            variant="bordered"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="border-2 border-dashed border-default-300 rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer relative h-64 flex items-center justify-center">
                        <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />
                        {project.image ? (
                            <div className="relative w-full h-full">
                                <Image
                                    src={project.image}
                                    alt="Preview"
                                    fill
                                    className="object-contain rounded-lg"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                    <p className="text-white font-medium">Click to change</p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8">
                                <ImageIcon size={48} className="mx-auto mb-2 text-default-400" />
                                <p className="text-default-500">Click or drag cover image</p>
                                {uploading && <p className="text-primary text-sm mt-2">Uploading...</p>}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
