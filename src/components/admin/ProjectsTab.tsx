'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type * as React from 'react';
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
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    ExternalLink,
    Github,
    GripVertical,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    ImagePlus,
    Minus,
    IndentIncrease,
    IndentDecrease,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Palette,
    Highlighter,
    Link as LinkIcon,
    MessageSquare,
    Type,
    Table2,
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { RangeApi, STYLE_KEYS, NODES, type Value } from 'platejs';
import { Editor, Path } from 'slate';
import type { Range } from 'platejs';
import {
    Plate,
    PlateContent,
    createPlatePlugin,
    toPlatePlugin,
    usePlateEditor,
    type PlateEditor,
} from 'platejs/react';
import { BasicBlocksPlugin, BasicMarksPlugin } from '@platejs/basic-nodes/react';
import { indentList, outdentList, someList, toggleList, ListStyleType } from '@platejs/list';
import { ListPlugin } from '@platejs/list/react';
import { upsertLink } from '@platejs/link';
import { LinkPlugin } from '@platejs/link/react';
import { indent, outdent } from '@platejs/indent';
import { IndentPlugin } from '@platejs/indent/react';
import { ImagePlugin } from '@platejs/media/react';
import { AutoformatPlugin } from '@platejs/autoformat';
import { getRangeBoundingClientRect } from '@platejs/floating';
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
    content?: Value | string | null;
    images: string[];
    tags: string[];
    demo_url?: string;
    github_url?: string;
    category?: string;
    created_at?: string;
    display_order?: number;
}

const EMPTY_PLATE_VALUE: Value = [
    { type: 'p', children: [{ text: '' }] },
];

const parsePlateValue = (raw: unknown): Value => {
    if (Array.isArray(raw)) {
        return raw as Value;
    }

    if (typeof raw === 'string') {
        const trimmed = raw.trim();
        if (!trimmed) {
            return EMPTY_PLATE_VALUE;
        }

        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed as Value;
            }
        } catch {
            return [
                { type: 'p', children: [{ text: trimmed }] },
            ];
        }
    }

    return EMPTY_PLATE_VALUE;
};

const dataUrlToBlob = (dataUrl: string) => {
    const [meta, base64] = dataUrl.split(',');
    const mimeMatch = /data:(.*?);base64/.exec(meta || '');
    const mime = mimeMatch?.[1] || 'image/png';
    const binary = atob(base64 || '');
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }

    return { blob: new Blob([bytes], { type: mime }), mime };
};

const parseInlineMarks = (value: string) => {
    const normalized = value.replace(/\r?\n/g, ' ');
    if (!normalized) {
        return [{ text: '' }];
    }

    const parts = normalized.split('**');
    const nodes = parts.flatMap((part, index) => {
        if (!part) return [];
        if (index % 2 === 1) {
            return [{ text: part, bold: true }];
        }
        return [{ text: part }];
    });

    return nodes.length > 0 ? nodes : [{ text: '' }];
};

const splitMarkdownRow = (line: string) => {
    const trimmed = line.trim();
    const withoutEdges = trimmed.replace(/^\|/, '').replace(/\|$/, '');
    return withoutEdges.split('|').map((cell) => cell.trim());
};

const isMarkdownSeparator = (line: string) => /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(line);

const buildTableNode = (rows: string[][], headerRowCount = 0) => {
    const maxCols = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const rowNodes = rows.map((row, rowIndex) => {
        const isHeaderRow = rowIndex < headerRowCount;
        const cellType = isHeaderRow ? NODES.th : NODES.td;
        const normalizedCells = Array.from({ length: maxCols }).map((_, idx) => row[idx] ?? '');
        return {
            type: NODES.tr,
            children: normalizedCells.map((cell) => ({
                type: cellType,
                children: parseInlineMarks(cell),
            })),
        };
    });

    return {
        type: NODES.table,
        children: rowNodes,
    };
};

const parseMarkdownTable = (text: string) => {
    const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length < 2) return null;

    const separatorIndex = lines.findIndex((line, index) => index > 0 && isMarkdownSeparator(line));
    if (separatorIndex === -1) return null;

    const headerLine = lines[separatorIndex - 1];
    const bodyLines = lines.slice(separatorIndex + 1);

    const headerCells = splitMarkdownRow(headerLine);
    if (headerCells.length === 0) return null;

    const bodyCells = bodyLines.map(splitMarkdownRow);
    const rows = [headerCells, ...bodyCells];

    return buildTableNode(rows, 1);
};

const parseHtmlTable = (html: string) => {
    if (!html) return null;
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const table = doc.querySelector('table');
    if (!table) return null;

    const rows: string[][] = [];
    let headerRowCount = 0;

    table.querySelectorAll('tr').forEach((row) => {
        const cells = Array.from(row.querySelectorAll('th,td'));
        if (cells.length === 0) return;
        const rowValues = cells.map((cell) => cell.textContent?.trim() ?? '');
        rows.push(rowValues);
        if (cells.some((cell) => cell.tagName.toLowerCase() === 'th')) {
            headerRowCount += 1;
        }
    });

    if (rows.length === 0) return null;
    return buildTableNode(rows, headerRowCount);
};

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
});

type ImageElementProps = {
    attributes: React.HTMLAttributes<HTMLDivElement>;
    children: React.ReactNode;
    element: {
        url?: string;
        alt?: string;
    };
};

const ImageElement = ({ attributes, children, element }: ImageElementProps) => (
    <div {...attributes}>
        <div contentEditable={false} className="my-3 rounded-lg border border-white/10 bg-black/40 p-2">
            {element?.url ? (
                <img
                    src={element.url}
                    alt={element.alt || 'content image'}
                    className="max-w-full rounded-md"
                />
            ) : (
                <div className="text-xs text-default-500">Image not available</div>
            )}
        </div>
        {children}
    </div>
);

type CodeBlockElementProps = {
    attributes: React.HTMLAttributes<HTMLPreElement>;
    children: React.ReactNode;
};

const CodeBlockElement = ({ attributes, children }: CodeBlockElementProps) => (
    <pre
        {...attributes}
        className="my-3 overflow-x-auto rounded-lg border border-white/10 bg-black/70 p-4 text-xs leading-relaxed text-white"
    >
        <code className="font-mono">{children}</code>
    </pre>
);

type CalloutElementProps = {
    attributes: React.HTMLAttributes<HTMLDivElement>;
    children: React.ReactNode;
};

const CalloutElement = ({ attributes, children }: CalloutElementProps) => (
    <div
        {...attributes}
        className="my-3 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white"
    >
        {children}
    </div>
);

const CodeBlockPlugin = createPlatePlugin({
    key: NODES.codeBlock,
    node: { isElement: true, isBlock: true },
    render: { node: CodeBlockElement },
});

const CalloutPlugin = createPlatePlugin({
    key: NODES.callout,
    node: { isElement: true, isBlock: true },
    render: { node: CalloutElement },
});

type TableElementProps = {
    attributes: React.HTMLAttributes<HTMLTableElement>;
    children: React.ReactNode;
};

const TableElement = ({ attributes, children }: TableElementProps) => (
    <table
        {...attributes}
        className="my-4 w-full border-collapse text-sm text-white/90"
    >
        <tbody>{children}</tbody>
    </table>
);

type TableRowElementProps = {
    attributes: React.HTMLAttributes<HTMLTableRowElement>;
    children: React.ReactNode;
};

const TableRowElement = ({ attributes, children }: TableRowElementProps) => (
    <tr
        {...attributes}
        className="border-b border-white/10 last:border-b-0"
    >
        {children}
    </tr>
);

type TableCellElementProps = {
    attributes: React.HTMLAttributes<HTMLTableCellElement>;
    children: React.ReactNode;
};

const TableCellElement = ({ attributes, children }: TableCellElementProps) => (
    <td
        {...attributes}
        className="border border-white/10 px-3 py-2 align-top"
    >
        {children}
    </td>
);

const TableHeaderCellElement = ({ attributes, children }: TableCellElementProps) => (
    <th
        {...attributes}
        className="border border-white/10 bg-white/5 px-3 py-2 text-left font-semibold"
    >
        {children}
    </th>
);

const TablePlugin = createPlatePlugin({
    key: NODES.table,
    node: { isElement: true, isBlock: true },
    render: { node: TableElement },
});

const TableRowPlugin = createPlatePlugin({
    key: NODES.tr,
    node: { isElement: true, isBlock: true },
    render: { node: TableRowElement },
});

const TableCellPlugin = createPlatePlugin({
    key: NODES.td,
    node: { isElement: true, isBlock: true },
    render: { node: TableCellElement },
});

const TableHeaderCellPlugin = createPlatePlugin({
    key: NODES.th,
    node: { isElement: true, isBlock: true },
    render: { node: TableHeaderCellElement },
});

const StyledBlocksPlugin = BasicBlocksPlugin
    .extendPlugin({ key: NODES.h1 }, {
        node: { props: { className: 'text-2xl font-semibold text-white' } },
    })
    .extendPlugin({ key: NODES.h2 }, {
        node: { props: { className: 'text-xl font-semibold text-white' } },
    })
    .extendPlugin({ key: NODES.h3 }, {
        node: { props: { className: 'text-lg font-semibold text-white' } },
    })
    .extendPlugin({ key: NODES.blockquote }, {
        node: { props: { className: 'border-l-2 border-white/20 pl-4 italic text-white/80' } },
    })
    .extendPlugin({ key: NODES.hr }, {
        node: { props: { className: 'my-4 border-white/10' } },
    })
    .extendPlugin({ key: NODES.p }, {
        node: { props: { className: 'text-sm leading-relaxed text-white/85' } },
    });

type LeafStyleProps = {
    attributes: React.HTMLAttributes<HTMLSpanElement>;
    children: React.ReactNode;
    leaf: {
        [key: string]: unknown;
        color?: string;
        backgroundColor?: string;
    };
};

type BlockDragWrapperProps = {
    children: React.ReactNode;
    editor: PlateEditor;
    element: unknown;
    path?: Path;
    dragPathRef: React.MutableRefObject<Path | null>;
};

const BlockDragWrapper = ({ children, editor, element, path, dragPathRef }: BlockDragWrapperProps) => {
    const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);

    if (!path || path.length !== 1 || !Editor.isBlock(editor, element as any)) {
        return <>{children}</>;
    }

    const getDropPosition = (event: React.DragEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after';
    };

    const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
        dragPathRef.current = path;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', 'block');
    };

    const handleDragEnd = () => {
        dragPathRef.current = null;
        setDropPosition(null);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        if (!dragPathRef.current) return;
        if (Path.equals(dragPathRef.current, path)) return;
        event.preventDefault();
        setDropPosition(getDropPosition(event));
    };

    const handleDragLeave = () => {
        setDropPosition(null);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        const dragPath = dragPathRef.current;
        if (!dragPath || Path.equals(dragPath, path)) {
            setDropPosition(null);
            return;
        }

        event.preventDefault();
        const position = getDropPosition(event);
        const targetPath = position === 'after' ? Path.next(path) : path;

        editor.tf.moveNodes({ at: dragPath, to: targetPath });
        dragPathRef.current = null;
        setDropPosition(null);
    };

    const handleSelectBlock = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        editor.tf.select(Editor.range(editor, path));
    };

    return (
        <div
            className="group relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <button
                type="button"
                className="absolute -left-7 top-1/2 -translate-y-1/2 rounded-md p-1 text-default-400 opacity-0 transition-opacity hover:text-white group-hover:opacity-100"
                draggable
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onMouseDown={handleSelectBlock}
                contentEditable={false}
            >
                <GripVertical size={16} />
            </button>
            {dropPosition && (
                <div
                    className={`absolute left-0 right-0 h-0.5 bg-primary ${
                        dropPosition === 'before' ? 'top-0' : 'bottom-0'
                    }`}
                    contentEditable={false}
                />
            )}
            {children}
        </div>
    );
};

type SlashState = {
    open: boolean;
    range: Range | null;
    query: string;
};

type SlashCommandItem = {
    id: string;
    label: string;
    description: string;
    keywords: string[];
    action: () => void;
    focusAfter?: boolean;
};

const preventMouseDown = (event: React.MouseEvent) => {
    event.preventDefault();
};

const defaultTagColors = ['#1f2937', '#111827', '#0f172a', '#1e293b', '#0b1320', '#111827'];
const TAG_COLOR_STORAGE_KEY = 'project-tag-color-map';

const hashTag = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) % 997;
    }
    return hash;
};

const normalizeHexColor = (value: string) => {
    const trimmed = value.trim();
    if (/^#([0-9a-f]{3}){1,2}$/i.test(trimmed)) {
        if (trimmed.length === 4) {
            const r = trimmed[1];
            const g = trimmed[2];
            const b = trimmed[3];
            return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
        }
        return trimmed.toLowerCase();
    }
    return '';
};

const getContrastColor = (hex: string) => {
    const normalized = normalizeHexColor(hex);
    if (!normalized) return '#ffffff';
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#111827' : '#ffffff';
};

const TagColorPicker = ({
    color,
    onChange,
}: {
    color: string;
    onChange: (value: string) => void;
}) => {
    const inputRef = useRef<HTMLInputElement | null>(null);

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
                value={normalizeHexColor(color) || '#111827'}
                onChange={(event) => onChange(event.target.value)}
            />
        </>
    );
};

function SortableTagItem({
    tag,
    color,
    textColor,
    onRemove,
    onColorChange,
}: {
    tag: string;
    color: string;
    textColor: string;
    onRemove: (tagToRemove: string) => void;
    onColorChange: (tagToUpdate: string, colorValue: string) => void;
}) {
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

export default function ProjectsTab() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterValue, setFilterValue] = useState("");
    const { isOpen, onOpen, onOpenChange } = useDisclosure();
    const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
    const [uploading, setUploading] = useState(false);
    const [contentUploading, setContentUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [tagInput, setTagInput] = useState("");
    const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});
    const [contentValue, setContentValue] = useState<Value>(EMPTY_PLATE_VALUE);
    const [editorKey, setEditorKey] = useState(0);
    const contentImageInputRef = useRef<HTMLInputElement | null>(null);
    const dragPathRef = useRef<Path | null>(null);
    const [slashState, setSlashState] = useState<SlashState>({
        open: false,
        range: null,
        query: '',
    });
    const [slashIndex, setSlashIndex] = useState(0);
    const [slashRect, setSlashRect] = useState<ReturnType<typeof getRangeBoundingClientRect> | null>(null);

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

    useEffect(() => {
        try {
            const stored = localStorage.getItem(TAG_COLOR_STORAGE_KEY);
            if (!stored) return;
            const parsed = JSON.parse(stored);
            if (!parsed || typeof parsed !== 'object') return;

            const nextMap: Record<string, string> = {};
            Object.entries(parsed as Record<string, unknown>).forEach(([key, value]) => {
                if (typeof key !== 'string' || typeof value !== 'string') return;
                const normalized = normalizeHexColor(value);
                if (normalized) {
                    nextMap[key] = normalized;
                }
            });

            setTagColorMap(nextMap);
        } catch {
            // Ignore malformed localStorage data.
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(TAG_COLOR_STORAGE_KEY, JSON.stringify(tagColorMap));
        } catch {
            // Ignore storage write failures.
        }
    }, [tagColorMap]);

    const handleContentImageUpload = useCallback(async (dataUrl: ArrayBuffer | string) => {
        setContentUploading(true);
        try {
            const dataUrlString = typeof dataUrl === 'string' ? dataUrl : '';
            const { blob, mime } = dataUrlString ? dataUrlToBlob(dataUrlString) : { blob: new Blob([dataUrl]), mime: 'application/octet-stream' };
            const extension = mime.split('/')[1] || 'png';
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
            const filePath = `content/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('project-images')
                .upload(filePath, blob, { contentType: mime });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('project-images')
                .getPublicUrl(filePath);

            return publicUrl;
        } catch (error: any) {
            console.error('Error uploading content image:', error);
            toast.error(`Content image upload failed: ${error.message || 'Unknown error'}`);
            return typeof dataUrl === 'string' ? dataUrl : '';
        } finally {
            setContentUploading(false);
        }
    }, []);

    const autoformatRules = useMemo(() => ([
        { mode: 'block', match: '# ', type: NODES.h1 },
        { mode: 'block', match: '## ', type: NODES.h2 },
        { mode: 'block', match: '### ', type: NODES.h3 },
        { mode: 'block', match: '> ', type: NODES.blockquote },
        { mode: 'block', match: '``` ', type: NODES.codeBlock },
        {
            mode: 'block',
            match: ['- ', '* '],
            format: (editor: PlateEditor) => toggleList(editor, { listStyleType: ListStyleType.Disc }),
        },
        {
            mode: 'block',
            match: ['1. ', '1) '],
            format: (editor: PlateEditor) => toggleList(editor, { listStyleType: ListStyleType.Decimal }),
        },
        {
            mode: 'block',
            match: '---',
            trigger: ' ',
            format: (editor: PlateEditor) => {
                editor.tf.insertNodes({ type: NODES.hr, children: [{ text: '' }] });
            },
        },
    ]), []);

    const blockDragPlugin = useMemo(() => createPlatePlugin({
        key: 'blockDrag',
        render: {
            aboveNodes: () => (props) => (
                <BlockDragWrapper
                    {...props}
                    dragPathRef={dragPathRef}
                />
            ),
        },
    }), [dragPathRef]);

    const tablePastePlugin = useMemo(() => createPlatePlugin({
        key: 'tablePaste',
        handlers: {
            onPaste: ({ editor, event }) => {
                const clipboard = event.clipboardData;
                if (!clipboard) return;

                const html = clipboard.getData('text/html');
                const plain = clipboard.getData('text/plain');
                const tableNode = parseHtmlTable(html) ?? parseMarkdownTable(plain);
                if (!tableNode) return;

                event.preventDefault();
                editor.tf.insertNodes(tableNode);
                return true;
            },
        },
    }), []);

    const plugins = useMemo(() => ([
        StyledBlocksPlugin,
        BasicMarksPlugin,
        CalloutPlugin,
        CodeBlockPlugin,
        TablePlugin,
        TableRowPlugin,
        TableCellPlugin,
        TableHeaderCellPlugin,
        ListPlugin,
        IndentPlugin.configure({
            inject: {
                targetPlugins: [
                    NODES.p,
                    NODES.h1,
                    NODES.h2,
                    NODES.h3,
                    NODES.blockquote,
                    NODES.callout,
                    NODES.codeBlock,
                ],
            },
        }),
        LinkPlugin,
        ImagePlugin
            .configure({ options: { uploadImage: handleContentImageUpload } })
            .withComponent(ImageElement),
        blockDragPlugin,
        tablePastePlugin,
        toPlatePlugin(AutoformatPlugin, { options: { rules: autoformatRules } }),
    ]), [autoformatRules, blockDragPlugin, handleContentImageUpload, tablePastePlugin]);

    const editor = usePlateEditor(
        {
            plugins,
            value: contentValue,
        },
        [editorKey]
    );

    const handleEditorChange = useCallback(({ value }: { value: Value }) => {
        setContentValue(value);
    }, []);

    const handleContentImagePick = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length || !editor) return;

        try {
            const file = event.target.files[0];
            const dataUrl = await readFileAsDataUrl(file);
            const uploadedUrl = await handleContentImageUpload(dataUrl);

            if (uploadedUrl) {
                editor.tf.insertNodes({
                    type: NODES.img,
                    url: uploadedUrl,
                    children: [{ text: '' }],
                });
            }
        } catch (error: any) {
            console.error('Error inserting content image:', error);
            toast.error(`Content image insert failed: ${error.message || 'Unknown error'}`);
        } finally {
            event.target.value = '';
        }
    }, [editor, handleContentImageUpload]);

    const renderLeaf = useCallback(({ attributes, children, leaf }: LeafStyleProps) => {
        const style: React.CSSProperties = {
            ...(attributes.style || {}),
        };

        const textColor = leaf[STYLE_KEYS.color] as string | undefined;
        const highlightColor = leaf[STYLE_KEYS.backgroundColor] as string | undefined;

        if (textColor) {
            style.color = textColor;
        }

        if (highlightColor) {
            style.backgroundColor = highlightColor;
        }

        return (
            <span {...attributes} style={style}>
                {children}
            </span>
        );
    }, []);

    const toggleMark = useCallback((key: string) => {
        editor?.tf.toggleMark(key);
    }, [editor]);

    const setMarkValue = useCallback((key: 'color' | 'backgroundColor', value?: string) => {
        if (!editor) return;

        if (!value) {
            editor.tf.removeMarks(key);
            return;
        }

        editor.tf.addMark(key, value);
    }, [editor]);

    const handleCustomColor = useCallback(() => {
        const color = window.prompt('Text color (hex, e.g. #ff0000)');
        if (color) {
            setMarkValue('color', color.trim());
        }
    }, [setMarkValue]);

    const handleCustomHighlight = useCallback(() => {
        const color = window.prompt('Highlight color (hex, e.g. #fff1a8)');
        if (color) {
            setMarkValue('backgroundColor', color.trim());
        }
    }, [setMarkValue]);

    const textColors = ['#ffffff', '#60a5fa', '#34d399', '#f59e0b', '#f87171', '#a78bfa'];
    const highlightColors = ['#fef3c7', '#fee2e2', '#dcfce7', '#dbeafe', '#f3e8ff', '#f1f5f9'];

    const getTagColor = useCallback((tag: string) => {
        const stored = tagColorMap[tag];
        const normalized = stored ? normalizeHexColor(stored) : '';
        if (normalized) return normalized;
        return defaultTagColors[hashTag(tag) % defaultTagColors.length];
    }, [tagColorMap]);

    const handleTagColorChange = useCallback((tag: string, color: string) => {
        const normalized = normalizeHexColor(color);
        if (!normalized) return;
        setTagColorMap((prev) => ({ ...prev, [tag]: normalized }));
    }, []);

    const handleIndentAction = useCallback((reverse = false) => {
        if (!editor) return;

        if (someList(editor)) {
            if (reverse) {
                outdentList(editor);
            } else {
                indentList(editor);
            }
            return;
        }

        if (reverse) {
            outdent(editor);
        } else {
            indent(editor);
        }
    }, [editor]);

    const closeSlashMenu = useCallback(() => {
        setSlashState((prev) => (prev.open ? { open: false, range: null, query: '' } : prev));
        setSlashIndex(0);
    }, []);

    const setBlockType = useCallback((type: string) => {
        if (!editor) return;
        editor.tf.toggleBlock(type, { defaultType: NODES.p });
    }, [editor]);

    const insertDivider = useCallback(() => {
        if (!editor) return;
        editor.tf.insertNodes({ type: NODES.hr, children: [{ text: '' }] });
    }, [editor]);

    const openContentImagePicker = useCallback(() => {
        contentImageInputRef.current?.click();
    }, []);

    const insertTable = useCallback((rows = 3, columns = 3) => {
        if (!editor) return;
        const tableRows = Array.from({ length: rows }, () => Array.from({ length: columns }, () => ''));
        const tableNode = buildTableNode(tableRows, 0);
        editor.tf.insertNodes(tableNode);
    }, [editor]);

    const handleInsertLink = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Paste a link URL');
        if (!url) return;
        upsertLink(editor, { url: url.trim() });
    }, [editor]);

    const slashItems = useMemo<SlashCommandItem[]>(() => ([
        {
            id: 'text',
            label: 'Text',
            description: 'Start writing with plain text',
            keywords: ['paragraph', 'text', 'plain'],
            action: () => setBlockType(NODES.p),
        },
        {
            id: 'h1',
            label: 'Heading 1',
            description: 'Large section heading',
            keywords: ['title', 'heading', 'h1'],
            action: () => setBlockType(NODES.h1),
        },
        {
            id: 'h2',
            label: 'Heading 2',
            description: 'Medium section heading',
            keywords: ['heading', 'h2', 'subtitle'],
            action: () => setBlockType(NODES.h2),
        },
        {
            id: 'h3',
            label: 'Heading 3',
            description: 'Small section heading',
            keywords: ['heading', 'h3'],
            action: () => setBlockType(NODES.h3),
        },
        {
            id: 'bulleted',
            label: 'Bulleted list',
            description: 'Create a bulleted list',
            keywords: ['list', 'bullet', 'ul'],
            action: () => editor && toggleList(editor, { listStyleType: ListStyleType.Disc }),
        },
        {
            id: 'numbered',
            label: 'Numbered list',
            description: 'Create a numbered list',
            keywords: ['list', 'numbered', 'ol'],
            action: () => editor && toggleList(editor, { listStyleType: ListStyleType.Decimal }),
        },
        {
            id: 'quote',
            label: 'Quote',
            description: 'Capture a quote',
            keywords: ['blockquote', 'quote'],
            action: () => setBlockType(NODES.blockquote),
        },
        {
            id: 'callout',
            label: 'Callout',
            description: 'Highlight an important note',
            keywords: ['callout', 'note', 'highlight'],
            action: () => setBlockType(NODES.callout),
        },
        {
            id: 'code-block',
            label: 'Code block',
            description: 'Insert a block of code',
            keywords: ['code', 'snippet'],
            action: () => setBlockType(NODES.codeBlock),
        },
        {
            id: 'table',
            label: 'Table',
            description: 'Insert a simple table',
            keywords: ['table', 'grid'],
            action: () => insertTable(),
        },
        {
            id: 'divider',
            label: 'Divider',
            description: 'Insert a visual divider',
            keywords: ['hr', 'separator', 'divider'],
            action: insertDivider,
        },
        {
            id: 'image',
            label: 'Image',
            description: 'Upload an image block',
            keywords: ['photo', 'media', 'image'],
            action: openContentImagePicker,
            focusAfter: false,
        },
    ]), [editor, insertDivider, insertTable, openContentImagePicker, setBlockType]);

    const filteredSlashItems = useMemo(() => {
        const query = slashState.query.trim().toLowerCase();
        if (!query) return slashItems;
        return slashItems.filter((item) =>
            [item.label, item.description, ...item.keywords]
                .join(' ')
                .toLowerCase()
                .includes(query)
        );
    }, [slashItems, slashState.query]);

    const handleSlashSelect = useCallback((item: SlashCommandItem) => {
        if (!editor) return;
        if (slashState.range) {
            editor.tf.delete({ at: slashState.range });
        }
        item.action();
        closeSlashMenu();
        if (item.focusAfter !== false) {
            editor.tf.focus();
        }
    }, [closeSlashMenu, editor, slashState.range]);

    const handleSlashKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!slashState.open || filteredSlashItems.length === 0) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSlashIndex((prev) => (prev + 1) % filteredSlashItems.length);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSlashIndex((prev) => (prev - 1 + filteredSlashItems.length) % filteredSlashItems.length);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            const item = filteredSlashItems[slashIndex];
            if (item) {
                handleSlashSelect(item);
            }
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeSlashMenu();
        }
    }, [closeSlashMenu, filteredSlashItems, handleSlashSelect, slashIndex, slashState.open]);

    const handleEditorKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        handleSlashKeyDown(event);
        if (event.defaultPrevented || !editor) return;

        const key = event.key.toLowerCase();
        const isMod = event.metaKey || event.ctrlKey;

        if (event.key === 'Tab') {
            event.preventDefault();
            handleIndentAction(event.shiftKey);
            return;
        }

        if (isMod && key === 'b') {
            event.preventDefault();
            toggleMark('bold');
            return;
        }

        if (isMod && key === 'i') {
            event.preventDefault();
            toggleMark('italic');
            return;
        }

        if (isMod && key === 'u') {
            event.preventDefault();
            toggleMark('underline');
            return;
        }

        if (isMod && event.shiftKey && key === 'x') {
            event.preventDefault();
            toggleMark('strikethrough');
            return;
        }

        if (isMod && key === 'e') {
            event.preventDefault();
            toggleMark('code');
            return;
        }

        if (isMod && key === 'k') {
            event.preventDefault();
            handleInsertLink();
            return;
        }

        if (isMod && event.shiftKey && key === '7') {
            event.preventDefault();
            toggleList(editor, { listStyleType: ListStyleType.Decimal });
            return;
        }

        if (isMod && event.shiftKey && key === '8') {
            event.preventDefault();
            toggleList(editor, { listStyleType: ListStyleType.Disc });
            return;
        }

        if (isMod && event.altKey) {
            if (key === '1') {
                event.preventDefault();
                setBlockType(NODES.h1);
                return;
            }
            if (key === '2') {
                event.preventDefault();
                setBlockType(NODES.h2);
                return;
            }
            if (key === '3') {
                event.preventDefault();
                setBlockType(NODES.h3);
            }
        }
    }, [editor, handleIndentAction, handleInsertLink, handleSlashKeyDown, setBlockType, toggleMark]);

    useEffect(() => {
        if (!editor) return;
        const { selection } = editor;

        if (!selection || !RangeApi.isCollapsed(selection)) {
            closeSlashMenu();
            return;
        }

        const blockEntry = Editor.above(editor, { match: (n) => Editor.isBlock(editor, n) });
        if (!blockEntry) {
            closeSlashMenu();
            return;
        }

        const [, blockPath] = blockEntry;
        const blockStart = Editor.start(editor, blockPath);
        const textRange = { anchor: blockStart, focus: selection.anchor };
        const textBefore = Editor.string(editor, textRange);
        const slashIndexLocal = textBefore.lastIndexOf('/');

        if (slashIndexLocal < 0) {
            closeSlashMenu();
            return;
        }

        const charBefore = textBefore[slashIndexLocal - 1];
        if (charBefore && !/\s/.test(charBefore)) {
            closeSlashMenu();
            return;
        }

        const query = textBefore.slice(slashIndexLocal + 1);
        if (/\s/.test(query)) {
            closeSlashMenu();
            return;
        }

        const slashPoint = Editor.before(editor, selection.anchor, {
            unit: 'character',
            distance: query.length + 1,
        });

        if (!slashPoint) {
            closeSlashMenu();
            return;
        }

        const nextRange = { anchor: slashPoint, focus: selection.anchor };
        setSlashState((prev) => {
            if (prev.open && prev.query === query && prev.range && RangeApi.equals(prev.range, nextRange)) {
                return prev;
            }
            return { open: true, range: nextRange, query };
        });
    }, [closeSlashMenu, editor, editor?.selection]);

    useEffect(() => {
        if (!slashState.open || !editor || !slashState.range) {
            setSlashRect(null);
            return;
        }

        const rect = getRangeBoundingClientRect(editor, slashState.range);
        setSlashRect(rect ?? null);
    }, [editor, slashState.open, slashState.range]);

    useEffect(() => {
        if (!slashState.open) return;
        setSlashIndex(0);
    }, [slashState.query, slashState.open]);

    useEffect(() => {
        if (!slashState.open) return;
        if (slashIndex >= filteredSlashItems.length) {
            setSlashIndex(0);
        }
    }, [filteredSlashItems.length, slashIndex, slashState.open]);

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

    const openEditor = (project: Partial<Project>) => {
        setCurrentProject(project);
        setContentValue(parsePlateValue(project.content));
        setEditorKey((prev) => prev + 1);
        onOpen();
    };

    const handleCreateNew = () => {
        openEditor({
            title: '',
            description: '',
            content: '',
            images: [],
            tags: [],
            category: '前端'
        });
    };

    const handleEdit = (project: Project) => {
        openEditor(project);
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
                content: contentValue,
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

    const handleTagDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        setCurrentProject((prev) => {
            const tags = prev.tags || [];
            const activeId = String(active.id);
            const overId = String(over.id);
            const oldIndex = tags.findIndex((tag) => tag === activeId);
            const newIndex = tags.findIndex((tag) => tag === overId);

            if (oldIndex < 0 || newIndex < 0) return prev;
            return { ...prev, tags: arrayMove(tags, oldIndex, newIndex) };
        });
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
                                        <Textarea
                                            label="Title"
                                            placeholder="Project Name (supports multiline)"
                                            value={currentProject.title || ''}
                                            onValueChange={val => setCurrentProject({ ...currentProject, title: val })}
                                            variant="bordered"
                                            minRows={1}
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
                                            <DndContext
                                                sensors={sensors}
                                                collisionDetection={closestCenter}
                                                onDragEnd={handleTagDragEnd}
                                            >
                                                <SortableContext
                                                    items={currentProject.tags || []}
                                                    strategy={rectSortingStrategy}
                                                >
                                                    <div className="flex flex-wrap gap-2">
                                                        {(currentProject.tags || []).map((tag) => {
                                                            const tagColor = getTagColor(tag);
                                                            const tagTextColor = getContrastColor(tagColor);
                                                            return (
                                                                <SortableTagItem
                                                                    key={tag}
                                                                    tag={tag}
                                                                    color={tagColor}
                                                                    textColor={tagTextColor}
                                                                    onRemove={removeTag}
                                                                    onColorChange={handleTagColorChange}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                </SortableContext>
                                            </DndContext>
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

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-medium text-default-500">Content</p>
                                        {contentUploading && (
                                            <span className="text-primary text-sm">Uploading image...</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                        <Tooltip content="Text">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.p)} onMouseDown={preventMouseDown}>
                                                <Type size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Heading 1">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.h1)} onMouseDown={preventMouseDown}>
                                                <Heading1 size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Heading 2">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.h2)} onMouseDown={preventMouseDown}>
                                                <Heading2 size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Heading 3">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.h3)} onMouseDown={preventMouseDown}>
                                                <Heading3 size={16} />
                                            </Button>
                                        </Tooltip>
                                        <div className="h-5 w-px bg-white/10" />
                                        <Tooltip content="Bulleted list">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => editor && toggleList(editor, { listStyleType: ListStyleType.Disc })} onMouseDown={preventMouseDown}>
                                                <List size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Numbered list">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => editor && toggleList(editor, { listStyleType: ListStyleType.Decimal })} onMouseDown={preventMouseDown}>
                                                <ListOrdered size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Quote">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.blockquote)} onMouseDown={preventMouseDown}>
                                                <Quote size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Callout">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.callout)} onMouseDown={preventMouseDown}>
                                                <MessageSquare size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Code block">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.codeBlock)} onMouseDown={preventMouseDown}>
                                                <Code size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Table">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => insertTable()} onMouseDown={preventMouseDown}>
                                                <Table2 size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Divider">
                                            <Button isIconOnly size="sm" variant="flat" onPress={insertDivider} onMouseDown={preventMouseDown}>
                                                <Minus size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Image">
                                            <Button isIconOnly size="sm" variant="flat" onPress={openContentImagePicker} onMouseDown={preventMouseDown}>
                                                <ImagePlus size={16} />
                                            </Button>
                                        </Tooltip>
                                        <div className="h-5 w-px bg-white/10" />
                                        <Tooltip content="Indent">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => handleIndentAction(false)} onMouseDown={preventMouseDown}>
                                                <IndentIncrease size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Outdent">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => handleIndentAction(true)} onMouseDown={preventMouseDown}>
                                                <IndentDecrease size={16} />
                                            </Button>
                                        </Tooltip>
                                        <div className="h-5 w-px bg-white/10" />
                                        <Tooltip content="Bold">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('bold')} onMouseDown={preventMouseDown}>
                                                <Bold size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Italic">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('italic')} onMouseDown={preventMouseDown}>
                                                <Italic size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Underline">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('underline')} onMouseDown={preventMouseDown}>
                                                <Underline size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Strikethrough">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('strikethrough')} onMouseDown={preventMouseDown}>
                                                <Strikethrough size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Inline code">
                                            <Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('code')} onMouseDown={preventMouseDown}>
                                                <Code size={16} />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip content="Link">
                                            <Button isIconOnly size="sm" variant="flat" onPress={handleInsertLink} onMouseDown={preventMouseDown}>
                                                <LinkIcon size={16} />
                                            </Button>
                                        </Tooltip>
                                        <div className="h-5 w-px bg-white/10" />
                                        <div className="flex items-center gap-2">
                                            <Palette size={14} className="text-default-400" />
                                            {textColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className="h-5 w-5 rounded border border-white/20"
                                                    style={{ backgroundColor: color }}
                                                    onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        setMarkValue('color', color);
                                                    }}
                                                />
                                            ))}
                                            <Button size="sm" variant="flat" onPress={() => setMarkValue('color')} onMouseDown={preventMouseDown}>
                                                Clear
                                            </Button>
                                            <Button size="sm" variant="flat" onPress={handleCustomColor} onMouseDown={preventMouseDown}>
                                                Custom
                                            </Button>
                                        </div>
                                        <div className="h-5 w-px bg-white/10" />
                                        <div className="flex items-center gap-2">
                                            <Highlighter size={14} className="text-default-400" />
                                            {highlightColors.map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    className="h-5 w-5 rounded border border-white/20"
                                                    style={{ backgroundColor: color }}
                                                    onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        setMarkValue('backgroundColor', color);
                                                    }}
                                                />
                                            ))}
                                            <Button size="sm" variant="flat" onPress={() => setMarkValue('backgroundColor')} onMouseDown={preventMouseDown}>
                                                Clear
                                            </Button>
                                            <Button size="sm" variant="flat" onPress={handleCustomHighlight} onMouseDown={preventMouseDown}>
                                                Custom
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="border border-white/10 rounded-xl bg-white/5">
                                        <Plate editor={editor} onValueChange={handleEditorChange} renderLeaf={renderLeaf}>
                                            <PlateContent
                                                className="min-h-[240px] px-4 py-3 text-sm outline-none"
                                                placeholder="Write here. Type / for blocks or paste images to upload."
                                                spellCheck
                                                onKeyDown={handleEditorKeyDown}
                                            />
                                            {slashState.open && slashRect && (
                                                <div
                                                    className="fixed z-[60] w-72 rounded-xl border border-white/10 bg-black/90 p-2 text-sm text-white shadow-xl backdrop-blur"
                                                    style={{
                                                        top: slashRect.bottom + 8,
                                                        left: slashRect.left,
                                                    }}
                                                    onMouseDown={(event) => event.preventDefault()}
                                                >
                                                    <p className="px-2 pb-2 text-xs uppercase tracking-wide text-default-400">Commands</p>
                                                    <div className="max-h-60 overflow-y-auto">
                                                        {filteredSlashItems.length === 0 ? (
                                                            <div className="px-2 py-3 text-xs text-default-500">No matches</div>
                                                        ) : (
                                                            filteredSlashItems.map((item, index) => (
                                                                <button
                                                                    key={item.id}
                                                                    type="button"
                                                                    className={`flex w-full flex-col gap-1 rounded-lg px-2 py-2 text-left transition-colors ${index === slashIndex ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                                                    onMouseDown={(event) => {
                                                                        event.preventDefault();
                                                                        handleSlashSelect(item);
                                                                    }}
                                                                >
                                                                    <span className="font-medium">{item.label}</span>
                                                                    <span className="text-xs text-default-400">{item.description}</span>
                                                                </button>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            <input
                                                ref={contentImageInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleContentImagePick}
                                            />
                                        </Plate>
                                    </div>
                                    <p className="text-xs text-default-500">
                                        WYSIWYG editor. Use the toolbar, type "/" for commands, and Tab/Shift+Tab for hierarchy.
                                    </p>
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
