'use client';

import React from 'react';
import { Card, CardHeader, CardBody, Chip, Tooltip } from "@nextui-org/react";
import { Edit2, Trash2, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { CarouselProject } from '@/types';
import { getContrastColor, normalizeHexColor } from '@/lib/utils';

interface CarouselItemProps {
    project: CarouselProject;
    onEdit: (project: CarouselProject) => void;
    onDelete: (id: string) => void;
    tagColorMap: Record<string, string>;
}

export function CarouselItem({
    project,
    onEdit,
    onDelete,
    tagColorMap,
}: CarouselItemProps) {
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
                                className="object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-default-300">
                                No Image
                            </div>
                        )}
                    </div>
                    <p className="text-default-500 text-sm mb-4 line-clamp-3">
                        {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {project.tags?.slice(0, 3).map((tag) => {
                            const color = tagColorMap[tag];
                            const normalized = color ? normalizeHexColor(color) : undefined;
                            const tagStyle = normalized ? {
                                backgroundColor: normalized,
                                borderColor: normalized,
                                color: getContrastColor(normalized),
                            } : undefined;

                            return (
                                <Chip
                                    key={tag}
                                    size="sm"
                                    variant="flat"
                                    className="bg-white/10 text-default-300"
                                    style={tagStyle}
                                >
                                    {tag}
                                </Chip>
                            );
                        })}
                        {(project.tags?.length || 0) > 3 && (
                            <Chip size="sm" variant="flat" className="bg-white/10 text-default-300">+{project.tags!.length - 3}</Chip>
                        )}
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}
