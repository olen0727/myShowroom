'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Input,
    Button,
    Textarea,
    Chip,
    Card,
    CardBody,
    CardHeader,
    Tooltip,
    Select,
    SelectItem,
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from "@nextui-org/react";
import { Plus, Edit2, Trash2, Search, ExternalLink, Github, GripVertical } from 'lucide-react';
import Image from 'next/image';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Project {
    id: string;
    title: string;
    description: string;
    images: string[];
    tags: string[];
    demo_url?: string;
    github_url?: string;
    category?: string;
    created_at?: string;
    display_order?: number;
}

// Sortable Item Component
function SortableProjectItem({
    project,
    onEdit,
    onDelete
}: {
    project: Project;
    onEdit: (p: Project) => void;
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

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style} className="h-full">
            <Card className="h-full py-4 bg-white/5 backdrop-blur-md border border-white/10">
                <CardHeader className="pb-0 pt-2 px-4 flex-col items-start">
                    <div className="flex justify-between w-full items-start">
                        <div className="flex items-start gap-2">
                            <div
                                {...attributes}
                                {...listeners}
                                className="mt-1 cursor-grab active:cursor-grabbing text-default-400 hover:text-white transition-colors"
                            >
                                <GripVertical size={20} />
                            </div>
                            <div>
                                <p className="text-tiny uppercase font-bold text-primary">{project.category}</p>
                                <h4 className="font-bold text-large">{project.title}</h4>
                            </div>
                        </div>
                        <div className="flex gap-1">
                            <Tooltip content="Edit">
                                <span className="text-lg text-default-400 cursor-pointer active:opacity-50 hover:text-primary transition-colors p-1" onClick={() => onEdit(project)}>
                                    <Edit2 size={18} />
                                </span>
                            </Tooltip>
                            <Tooltip content="Delete" color="danger">
                                <span className="text-lg text-danger cursor-pointer active:opacity-50 hover:text-danger-400 transition-colors p-1" onClick={() => onDelete(project.id)}>
                                    <Trash2 size={18} />
                                </span>
                            </Tooltip>
                        </div>
                    </div>
                </CardHeader>
                <CardBody className="overflow-visible py-2">
                    <div className="relative w-full h-48 rounded-xl overflow-hidden mb-4 bg-black/20">
                        {project.images?.[0] ? (
                            <Image
                                src={project.images[0]}
                                alt={project.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-default-500">
                                No Image
                            </div>
                        )}
                    </div>
                    <p className="text-default-500 text-sm line-clamp-2 mb-4 min-h-[40px]">
                        {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {project.tags?.slice(0, 3).map(tag => (
                            <Chip key={tag} size="sm" variant="flat" className="bg-white/10 text-default-300">{tag}</Chip>
                        ))}
                        {(project.tags?.length || 0) > 3 && (
                            <Chip size="sm" variant="flat" className="bg-white/10 text-default-300">+{project.tags!.length - 3}</Chip>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}

export default function ProjectsTab() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tagInput, setTagInput] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require 8px movement before drag starts to prevent accidental drags on clicks
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setCurrentProject({
            title: '',
            description: '',
            images: [],
            tags: [],
            category: '前端'
        });
        onOpen();
    };

    const handleEdit = (project: Project) => {
        setCurrentProject(project);
        onOpen();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this project?')) return;

        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
            setProjects(projects.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting project:', error);
        }
    };

    const handleSave = async (onClose: () => void) => {
        setSaving(true);
        try {
            const projectData = {
                title: currentProject.title,
                description: currentProject.description,
                images: currentProject.images || [],
                tags: currentProject.tags || [],
                demo_url: currentProject.demo_url,
                github_url: currentProject.github_url,
                category: currentProject.category,
                updated_at: new Date().toISOString(),
            };

            if (currentProject.id) {
                const { error } = await supabase
                    .from('projects')
                    .update(projectData)
                    .eq('id', currentProject.id);
                if (error) throw error;
            } else {
                // Get max display_order for new item
                const maxOrder = projects.length > 0
                    ? Math.max(...projects.map(p => p.display_order || 0))
                    : 0;

                const { error } = await supabase
                    .from('projects')
                    .insert([{ ...projectData, display_order: maxOrder + 1 }]);
                if (error) throw error;
            }

            await fetchProjects();
            onClose();
        } catch (error: any) {
            console.error('Error saving project:', error);
            alert(`Failed to save project: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(e.target.files);
        const newImages: string[] = [...(currentProject.images || [])];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('project-images')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('project-images')
                    .getPublicUrl(filePath);

                newImages.push(publicUrl);
            }

            setCurrentProject(prev => ({ ...prev, images: newImages }));
        } catch (error: any) {
            console.error('Error uploading image:', error);
            alert(`Image upload failed: ${error.message || 'Unknown error'}`);
        } finally {
            setUploading(false);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!currentProject.tags?.includes(tagInput.trim())) {
                setCurrentProject(prev => ({
                    ...prev,
                    tags: [...(prev.tags || []), tagInput.trim()]
                }));
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setCurrentProject(prev => ({
            ...prev,
            tags: prev.tags?.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setProjects((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update DB asynchronously
                const updates = newItems.map((p, idx) => ({
                    id: p.id,
                    display_order: idx + 1
                }));

                // We don't await this to keep UI responsive
                (async () => {
                    try {
                        for (const update of updates) {
                            await supabase
                                .from('projects')
                                .update({ display_order: update.display_order })
                                .eq('id', update.id);
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
                <Button color="primary" endContent={<Plus />} onPress={handleCreateNew}>
                    Add New
                </Button>
            </div>

            {filterValue ? (
                // If filtering, disable drag and drop
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
                // If not filtering, enable drag and drop
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

            <Modal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
                size="4xl"
                scrollBehavior="inside"
                backdrop="blur"
            >
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                {currentProject.id ? 'Edit Project' : 'New Project'}
                            </ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <Input
                                            label="Title"
                                            placeholder="Project Name"
                                            value={currentProject.title || ''}
                                            onValueChange={val => setCurrentProject({ ...currentProject, title: val })}
                                            variant="bordered"
                                        />
                                        <Select
                                            label="Category"
                                            placeholder="Select category"
                                            selectedKeys={currentProject.category ? [currentProject.category] : []}
                                            onChange={(e) => setCurrentProject({ ...currentProject, category: e.target.value })}
                                            variant="bordered"
                                        >
                                            <SelectItem key="前端" value="前端">前端</SelectItem>
                                            <SelectItem key="UX" value="UX">UX</SelectItem>
                                        </Select>
                                        <Textarea
                                            label="Description"
                                            placeholder="Project description..."
                                            value={currentProject.description || ''}
                                            onValueChange={val => setCurrentProject({ ...currentProject, description: val })}
                                            variant="bordered"
                                            minRows={5}
                                        />
                                        <div className="space-y-2">
                                            <Input
                                                label="Tags"
                                                placeholder="Press Enter to add tag"
                                                value={tagInput}
                                                onValueChange={setTagInput}
                                                onKeyDown={handleAddTag}
                                                variant="bordered"
                                            />
                                            <div className="flex flex-wrap gap-2">
                                                {currentProject.tags?.map(tag => (
                                                    <Chip key={tag} onClose={() => removeTag(tag)} variant="flat">
                                                        {tag}
                                                    </Chip>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <Input
                                                label="Demo Link"
                                                placeholder="https://..."
                                                startContent={<ExternalLink size={16} />}
                                                value={currentProject.demo_url || ''}
                                                onValueChange={val => setCurrentProject({ ...currentProject, demo_url: val })}
                                                variant="bordered"
                                            />
                                            <Input
                                                label="GitHub Link"
                                                placeholder="https://..."
                                                startContent={<Github size={16} />}
                                                value={currentProject.github_url || ''}
                                                onValueChange={val => setCurrentProject({ ...currentProject, github_url: val })}
                                                variant="bordered"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="border-2 border-dashed border-default-300 rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer relative">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                            <div className="py-8">
                                                <p className="text-default-500">Click or drag images here</p>
                                                {uploading && <p className="text-primary text-sm mt-2">Uploading...</p>}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                                            {currentProject.images?.map((img, idx) => (
                                                <div key={idx} className="relative group rounded-lg overflow-hidden h-32">
                                                    <Image
                                                        src={img}
                                                        alt="Preview"
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                        <Button
                                                            isIconOnly
                                                            color="danger"
                                                            size="sm"
                                                            variant="flat"
                                                            onPress={() => {
                                                                const newImages = [...(currentProject.images || [])];
                                                                newImages.splice(idx, 1);
                                                                setCurrentProject({ ...currentProject, images: newImages });
                                                            }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="danger" variant="flat" onPress={onClose}>
                                    Close
                                </Button>
                                <Button color="primary" onPress={() => handleSave(onClose)} isLoading={saving}>
                                    Save Project
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </div>
    );
}
