'use client';

import React, { useRef } from 'react';
import { Chip } from "@nextui-org/react";
import { GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { preventMouseDown, normalizeHexColor } from '@/lib/utils';
import { DEFAULT_TAG_COLORS } from '@/lib/constants';

// Internal TagColorPicker
const TagColorPicker = ({
    color,
    onChange,
}: {
    color: string;
    onChange: (value: string) => void;
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <>
            <button
                type="button"
                className="h-4 w-4 rounded border border-white/30"
                style={{ backgroundColor: color }}
                onMouseDown={preventMouseDown}
                onClick={() => inputRef.current?.click()}
            />
            <input
                ref={inputRef}
                type="color"
                className="hidden"
                value={normalizeHexColor(color) || DEFAULT_TAG_COLORS[1]}
                onChange={(event) => onChange(event.target.value)}
            />
        </>
    );
};

export interface SortableTagItemProps {
    tag: string;
    color: string;
    textColor: string;
    onRemove: (tagToRemove: string) => void;
    onColorChange: (tagToUpdate: string, colorValue: string) => void;
}

export function SortableTagItem({
    tag,
    color,
    textColor,
    onRemove,
    onColorChange,
}: SortableTagItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: tag });

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.7 : 1,
    };

    return (
        <div ref={setNodeRef} style={style}>
            <Chip
                onClose={() => onRemove(tag)}
                variant="flat"
                className="flex items-center gap-2 border border-white/10"
                style={{ backgroundColor: color, color: textColor }}
            >
                <span className="flex items-center gap-2">
                    <button
                        type="button"
                        className="cursor-grab text-white/70 hover:text-white"
                        onMouseDown={preventMouseDown}
                        {...attributes}
                        {...listeners}
                    >
                        <GripVertical size={12} />
                    </button>
                    <span className="text-xs font-medium">{tag}</span>
                    <TagColorPicker
                        color={color}
                        onChange={(value) => onColorChange(tag, value)}
                    />
                </span>
            </Chip>
        </div>
    );
}
