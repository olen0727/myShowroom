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
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    useDisclosure
} from "@nextui-org/react";
import { Plus, Edit2, Trash2, Search, ExternalLink, Github, GripVertical, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
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

interface CarouselProject {
    id: string;
    title: string;
    description: string;
    image: string;
    tags: string[];
    demo_url?: string;
    github_url?: string;
    display_order?: number;
}

// Sortable Item Component
function SortableCarouselItem({
    project,
    onEdit,
    onDelete
}: {
    project: CarouselProject;
    onEdit: (p: CarouselProject) => void;
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
                                <h4 className="font-bold text-large whitespace-pre-wrap">{project.title}</h4>
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
                        {project.image ? (
                            <Image
                                src={project.image}
                                alt={project.title}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-default-500 flex-col gap-2">
                                <ImageIcon size={32} />
                                <span>No Cover Image</span>
                            </div>
                        )}
                    </div>
                    <p className="text-default-500 text-sm line-clamp-2 mb-4 min-h-[40px] whitespace-pre-wrap">
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

export default function CarouselTab() {
    const [projects, setProjects] = useState<CarouselProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [currentProject, setCurrentProject] = useState<Partial<CarouselProject>>({});
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tagInput, setTagInput] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
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

    const handleCreateNew = () => {
        setCurrentProject({
            title: '',
            description: '',
            image: '',
            tags: [],
        });
        onOpen();
    };

    const handleEdit = (project: CarouselProject) => {
        setCurrentProject(project);
        onOpen();
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

    const handleSave = async (onClose: () => void) => {
        setSaving(true);
        try {
            const projectData = {
                title: currentProject.title,
                description: currentProject.description,
                image: currentProject.image,
                tags: currentProject.tags || [],
                demo_url: currentProject.demo_url,
                github_url: currentProject.github_url,
            };

            if (currentProject.id) {
                const { error } = await supabase
                    .from('carousel_projects')
                    .update(projectData)
                    .eq('id', currentProject.id);
                if (error) throw error;
            } else {
                const maxOrder = projects.length > 0
                    ? Math.max(...projects.map(p => p.display_order || 0))
                    : 0;

                const { error } = await supabase
                    .from('carousel_projects')
                    .insert([{ ...projectData, display_order: maxOrder + 1 }]);
                if (error) throw error;
            }

            await fetchProjects();
            onClose();
            toast.success('Project saved successfully');
        } catch (error: any) {
            console.error('Error saving project:', error);
            toast.error(`Failed to save project: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const file = e.target.files[0];

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('carousel-images')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('carousel-images')
                .getPublicUrl(filePath);

            setCurrentProject(prev => ({ ...prev, image: publicUrl }));
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast.error(`Image upload failed: ${error.message || 'Unknown error'}`);
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

                const updates = newItems.map((p, idx) => ({
                    id: p.id,
                    display_order: idx + 1
                }));

                (async () => {
                    try {
                        for (const update of updates) {
                            await supabase
                                .from('carousel_projects')
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
        project.title.toLowerCase().includes(filterValue.toLowerCase())
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project) => (
                        <SortableCarouselItem
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
                                <SortableCarouselItem
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
                                {currentProject.id ? 'Edit Carousel Project' : 'New Carousel Project'}
                            </ModalHeader>
                            <ModalBody>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <Textarea
                                            label="Title"
                                            placeholder="Project Name (supports multiline)"
                                            value={currentProject.title || ''}
                                            onValueChange={val => setCurrentProject({ ...currentProject, title: val })}
                                            variant="bordered"
                                            minRows={1}
                                        />
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
                                        <div className="border-2 border-dashed border-default-300 rounded-xl p-4 text-center hover:border-primary transition-colors cursor-pointer relative h-64 flex items-center justify-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                            {currentProject.image ? (
                                                <div className="relative w-full h-full">
                                                    <Image
                                                        src={currentProject.image}
                                                        alt="Preview"
                                                        fill
                                                        className="object-contain rounded-lg"
                                                    />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                                                        <p className="text-white font-medium">Click to change image</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="py-8">
                                                    <ImageIcon size={48} className="mx-auto mb-2 text-default-400" />
                                                    <p className="text-default-500">Click or drag cover image here</p>
                                                    {uploading && <p className="text-primary text-sm mt-2">Uploading...</p>}
                                                </div>
                                            )}
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
