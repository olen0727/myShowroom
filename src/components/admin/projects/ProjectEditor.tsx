'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Input,
    Button,
    Textarea,
    Select,
    SelectItem,
    Tooltip,
    Chip,
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@nextui-org/react";
import { ColorPicker } from '@/components/admin/shared/ColorPicker';
import {
    ExternalLink,
    Github,
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
    Trash2,
    GripVertical
} from 'lucide-react';
import { toast } from 'sonner';
import Image from 'next/image';
import { RangeApi, STYLE_KEYS, NODES, type Value } from 'platejs';
import { Editor, Path, Transforms } from 'slate';
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
import {
    normalizeHexColor,
    dataUrlToBlob,
    hashTag,
    getContrastColor,
    preventMouseDown,
    parseMarkdownTable
} from '@/lib/utils';
import { TAG_COLORS_TABLE, DEFAULT_TAG_COLORS } from '@/lib/constants';
import { BlockDragWrapper } from '@/components/editor/BlockDragWrapper';
import {
    ImageElement,
    CodeBlockElement,
    CalloutElement,
    HrElement,
    TableElement,
    TableRowElement,
    TableCellElement,
    TableHeaderCellElement
} from '@/components/editor/PlateUiElements';

import { SortableTagItem } from '@/components/admin/shared/SortableTagItem';

// --- Plugins Definition ---
const CodeBlockPlugin = createPlatePlugin({ key: NODES.codeBlock, node: { isElement: true }, render: { node: CodeBlockElement } });
const CalloutPlugin = createPlatePlugin({ key: NODES.callout, node: { isElement: true }, render: { node: CalloutElement } });
const HrPlugin = createPlatePlugin({ key: NODES.hr, node: { isElement: true }, render: { node: HrElement } });
const TablePlugin = createPlatePlugin({ key: NODES.table, node: { isElement: true }, render: { node: TableElement } });
const TableRowPlugin = createPlatePlugin({ key: NODES.tr, node: { isElement: true }, render: { node: TableRowElement } });
const TableCellPlugin = createPlatePlugin({ key: NODES.td, node: { isElement: true }, render: { node: TableCellElement } });
const TableHeaderCellPlugin = createPlatePlugin({ key: NODES.th, node: { isElement: true }, render: { node: TableHeaderCellElement } });
const FontColorPlugin = createPlatePlugin({ key: STYLE_KEYS.color, node: { isLeaf: true } });
const FontBackgroundColorPlugin = createPlatePlugin({ key: STYLE_KEYS.backgroundColor, node: { isLeaf: true } });

const renderLeaf = ({ attributes, children, leaf }: {
    attributes: React.HTMLAttributes<HTMLSpanElement>;
    children: React.ReactNode;
    leaf: { [key: string]: unknown; color?: string; backgroundColor?: string };
}) => {
    const style: React.CSSProperties = { ...(attributes.style || {}) };

    const textColor = leaf[STYLE_KEYS.color] as string | undefined;
    const highlightColor = leaf[STYLE_KEYS.backgroundColor] as string | undefined;

    if (textColor) style.color = textColor;
    if (highlightColor) style.backgroundColor = highlightColor;

    return <span {...attributes} style={style}>{children}</span>;
};

const StyledBlocksPlugin = BasicBlocksPlugin
    .extendPlugin({ key: NODES.h1 }, { node: { props: { className: 'text-2xl font-semibold text-white' } } })
    .extendPlugin({ key: NODES.h2 }, { node: { props: { className: 'text-xl font-semibold text-white' } } })
    .extendPlugin({ key: NODES.h3 }, { node: { props: { className: 'text-lg font-semibold text-white' } } })
    .extendPlugin({ key: NODES.blockquote }, { node: { props: { className: 'border-l-2 border-white/20 pl-4 italic text-white/80' } } })
    .extendPlugin({ key: NODES.p }, { node: { props: { className: 'text-sm leading-relaxed text-white/85' } } });

type SlashState = {
    open: boolean;
    range: Range | null;
    query: string;
};

// Helper for image reading
const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
});

interface ProjectEditorProps {
    initialProject?: Project;
    onSave?: (savedProject: Project) => void;
    onCancel?: () => void;
    standalone?: boolean;
}

export default function ProjectEditor({ initialProject, onSave, onCancel, standalone = false }: ProjectEditorProps) {
    const router = useRouter();
    const [project, setProject] = useState<Partial<Project>>({
        title: '',
        description: '',
        content: [{ type: 'p', children: [{ text: '' }] }],
        images: [],
        tags: [],
        demo_url: '',
        github_url: '',
        category: '',
        ...initialProject
    });

    const [tagInput, setTagInput] = useState('');
    const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [contentUploading, setContentUploading] = useState(false);
    const [customColors, setCustomColors] = useState<string[]>([]);

    // Slash command state (kept minimal for now)
    const [slashState, setSlashState] = useState<SlashState>({ open: false, range: null, query: '' });

    // Refs
    const editorId = useMemo(() => project.id || 'new-project-editor', [project.id]);
    const dragPathRef = useRef<Path | null>(null);
    const contentImageInputRef = useRef<HTMLInputElement>(null);
    const toolbarRef = useRef<HTMLDivElement>(null);
    const toolbarPlaceholderRef = useRef<HTMLDivElement>(null);
    const toolbarAnchorRef = useRef<HTMLDivElement>(null);
    const [toolbarPinned, setToolbarPinned] = useState(false);
    const [toolbarHeight, setToolbarHeight] = useState(0);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Initialize tag colors
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

    // Handle Content Image Upload
    const handleContentImageUpload = useCallback(async (dataUrl: string | ArrayBuffer) => {
        setContentUploading(true);
        try {
            const dataUrlString = typeof dataUrl === 'string' ? dataUrl : '';
            const { blob, mime } = dataUrlString ? dataUrlToBlob(dataUrlString) : { blob: new Blob([dataUrl as any]), mime: 'application/octet-stream' };
            const extension = mime.split('/')[1] || 'png';
            const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
            const filePath = `content/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('project-images').upload(filePath, blob, { contentType: mime });
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('project-images').getPublicUrl(filePath);
            return publicUrl;
        } catch (error: any) {
            console.error('Error uploading content image:', error);
            toast.error(`Content image upload failed: ${error.message}`);
            return typeof dataUrl === 'string' ? dataUrl : '';
        } finally {
            setContentUploading(false);
        }
    }, []);

    // Plate Plugins configuration
    const autoformatRules = useMemo(() => ([
        { mode: 'block', match: '# ', type: NODES.h1 },
        { mode: 'block', match: '## ', type: NODES.h2 },
        { mode: 'block', match: '### ', type: NODES.h3 },
        { mode: 'block', match: '> ', type: NODES.blockquote },
        { mode: 'block', match: '``` ', type: NODES.codeBlock },
        { mode: 'block', match: ['- ', '* '], format: (editor: PlateEditor) => toggleList(editor, { listStyleType: ListStyleType.Disc }) },
        { mode: 'block', match: ['1. ', '1) '], format: (editor: PlateEditor) => toggleList(editor, { listStyleType: ListStyleType.Decimal }) },
        { mode: 'block', match: '---', trigger: ' ', format: (editor: PlateEditor) => Transforms.insertNodes(editor as any, { type: NODES.hr, children: [{ text: '' }] } as any) },
    ]), []);

    const blockDragPlugin = useMemo(() => createPlatePlugin({
        key: 'blockDrag',
        render: {
            aboveNodes: () => (props) => <BlockDragWrapper {...props} dragPathRef={dragPathRef} />,
        },
    }), [dragPathRef]);

    const tablePastePlugin = useMemo(() => createPlatePlugin({
        key: 'tablePaste',
        handlers: {
            onPaste: ({ editor, event }) => {
                const clipboard = event.clipboardData;
                if (!clipboard) return;
                const text = clipboard.getData('text/plain');
                if (!text) return;

                const tableRows = parseMarkdownTable(text);
                if (tableRows) {
                    event.preventDefault();
                    Transforms.insertNodes(editor as any, {
                        type: NODES.table,
                        children: tableRows.map(row => ({
                            type: NODES.tr,
                            children: row.children.map(cell => ({
                                type: NODES.td,
                                children: cell
                            }))
                        }))
                    } as any);
                }
            },
        },
    }), []);

    const plugins = useMemo(() => ([
        StyledBlocksPlugin, BasicMarksPlugin, CalloutPlugin, CodeBlockPlugin, HrPlugin,
        TablePlugin, TableRowPlugin, TableCellPlugin, TableHeaderCellPlugin,
        ListPlugin, IndentPlugin, LinkPlugin,
        FontColorPlugin, FontBackgroundColorPlugin,
        ImagePlugin.configure({ options: { uploadImage: handleContentImageUpload } }).withComponent(ImageElement),
        blockDragPlugin,
        tablePastePlugin,
        toPlatePlugin(AutoformatPlugin, { options: { rules: autoformatRules as any } }), // Cast autoformatRules
    ]), [autoformatRules, blockDragPlugin, handleContentImageUpload, tablePastePlugin]);

    const editor = usePlateEditor({ plugins, value: project.content as Value }, [editorId]);

    const handleEditorChange = useCallback(({ value }: { value: Value }) => {
        setProject(prev => ({ ...prev, content: value }));
    }, []);

    // Definition for handleContentImagePick
    const handleContentImagePick = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length || !editor) return;

        try {
            const file = event.target.files[0];
            const dataUrl = await readFileAsDataUrl(file);
            const uploadedUrl = await handleContentImageUpload(dataUrl);

            if (uploadedUrl) {
                Transforms.insertNodes(editor as any, {
                    type: NODES.img,
                    url: uploadedUrl,
                    children: [{ text: '' }],
                } as any);
            }
        } catch (error: any) {
            console.error('Error inserting content image:', error);
            toast.error(`Content image insert failed: ${error.message || 'Unknown error'}`);
        } finally {
            event.target.value = '';
        }
    }, [editor, handleContentImageUpload]);


    // --- Editor Toolbar Logic ---
    useEffect(() => {
        const handleScroll = () => {
            if (toolbarRef.current && toolbarAnchorRef.current && toolbarPlaceholderRef.current) {
                const anchorRect = toolbarAnchorRef.current.getBoundingClientRect();
                const shouldPin = anchorRect.top <= 80;
                setToolbarPinned(shouldPin);
                if (shouldPin && toolbarRef.current) {
                    setToolbarHeight(toolbarRef.current.offsetHeight);
                    toolbarRef.current.style.width = `${toolbarPlaceholderRef.current.offsetWidth}px`;
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    const toolbarClassName = `flex flex-wrap items-center gap-1 rounded-t-xl bg-default-100 p-2 border-b border-white/10 transition-all z-40 ${toolbarPinned ? 'fixed top-[65px] rounded-b-xl shadow-lg border border-white/10' : ''
        }`;

    // --- Handlers ---
    const handleSave = async () => {
        try {
            setSaving(true);
            if (!project.title) return toast.error('Title is required');

            const payload = {
                ...project,
                updated_at: new Date().toISOString(),
                content: editor.children,
                display_order: project.display_order ?? 0
            };

            const { data, error } = await supabase
                .from('projects')
                .upsert(payload)
                .select()
                .single();

            if (error) throw error;
            toast.success('Project saved successfully');

            // Update local state with the returned data (important for new projects getting an ID)
            setProject(data);

            if (onSave) onSave(data as Project);
        } catch (error: any) {
            console.error('Error saving project:', error);
            toast.error('Failed to save project');
        } finally {
            setSaving(false);
        }
    };

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (!project.tags?.includes(newTag)) {
                setProject(prev => ({ ...prev, tags: [...(prev.tags || []), newTag] }));
            }
            setTagInput('');
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
            const newImages = [...(project.images || [])];
            for (let i = 0; i < e.target.files.length; i++) {
                const file = e.target.files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage.from('project-images').upload(filePath, file);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage.from('project-images').getPublicUrl(filePath);
                newImages.push(publicUrl);
            }
            setProject(prev => ({ ...prev, images: newImages }));
        } catch (error: any) {
            toast.error(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // --- Toolbar Actions ---
    // --- Actions ---
    const setBlockType = (type: string) => {
        if (!editor) return;
        Transforms.setNodes(editor as any, { type } as any);
    };

    const toggleMark = (type: string) => {
        if (!editor) return;
        const marks = Editor.marks(editor as any) as Record<string, any> | null;
        if (marks?.[type]) {
            (editor as any).removeMark(type);
        } else {
            (editor as any).addMark(type, true);
        }
    };

    const insertDivider = () => {
        if (!editor) return;
        Transforms.insertNodes(editor as any, { type: NODES.hr, children: [{ text: '' }] } as any);
    };
    const openContentImagePicker = () => contentImageInputRef.current?.click();
    const handleInsertLink = () => {
        const url = window.prompt('Enter link URL:');
        if (url) upsertLink(editor, { url, target: '_blank' });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">{project.id ? 'Edit Project' : 'New Project'}</h2>
                    <p className="text-sm text-default-500">Edit project details and content.</p>
                </div>
                <div className="flex gap-2">
                    {onCancel && <Button variant="flat" onPress={onCancel}>Cancel</Button>}
                    <Button color="primary" onPress={handleSave} isLoading={saving}>Save Project</Button>
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
                    <Select
                        label="Category"
                        selectedKeys={project.category ? [project.category] : []}
                        onChange={(e) => setProject({ ...project, category: e.target.value })}
                        variant="bordered"
                    >
                        <SelectItem key="前端" value="前端">前端</SelectItem>
                        <SelectItem key="UX" value="UX">UX</SelectItem>
                    </Select>
                    <Textarea
                        label="Description"
                        value={project.description}
                        onValueChange={val => setProject({ ...project, description: val })}
                        variant="bordered"
                        minRows={5}
                    />
                    {/* Tags Section */}
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
                </div>

                <div className="space-y-4">
                    {/* Image Upload Area */}
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
                    {/* Image Previews */}
                    <div className="grid grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                        {project.images?.map((img, idx) => (
                            <div key={idx} className="relative group rounded-lg overflow-hidden h-32">
                                <Image src={img} alt="Preview" fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button isIconOnly color="danger" size="sm" variant="flat" onPress={() => {
                                        const newImages = [...(project.images || [])];
                                        newImages.splice(idx, 1);
                                        setProject({ ...project, images: newImages });
                                    }}>
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Plate Editor */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-default-500">Content</p>
                    {contentUploading && <span className="text-primary text-sm">Uploading image...</span>}
                </div>
                <div ref={toolbarAnchorRef} className="h-0" />
                <div ref={toolbarPlaceholderRef} style={{ height: toolbarPinned ? toolbarHeight : 0 }} />
                <div ref={toolbarRef} className={toolbarClassName} style={toolbarPinned ? { width: toolbarRef.current?.style.width } : undefined}>
                    {/* Toolbar Buttons - Simplified for brevity */}
                    {/* Text Styling */}
                    <Tooltip content="Bold"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('bold')}><Bold size={16} /></Button></Tooltip>
                    <Tooltip content="Italic"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('italic')}><Italic size={16} /></Button></Tooltip>
                    <Tooltip content="Underline"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('underline')}><Underline size={16} /></Button></Tooltip>
                    <Tooltip content="Strikethrough"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('strikethrough')}><Strikethrough size={16} /></Button></Tooltip>
                    <Tooltip content="Code"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('code')}><Code size={16} /></Button></Tooltip>

                    <div className="h-5 w-px bg-white/10" />

                    {/* Headings */}
                    <Tooltip content="Body"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.p)}><Type size={16} /></Button></Tooltip>
                    <Tooltip content="H1"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.h1)}><Heading1 size={16} /></Button></Tooltip>
                    <Tooltip content="H2"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.h2)}><Heading2 size={16} /></Button></Tooltip>
                    <Tooltip content="H3"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.h3)}><Heading3 size={16} /></Button></Tooltip>

                    <div className="h-5 w-px bg-white/10" />

                    {/* Special Blocks */}
                    <Tooltip content="Quote"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.blockquote)}><Quote size={16} /></Button></Tooltip>
                    <Tooltip content="Code Block"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.codeBlock)}><Code size={16} /></Button></Tooltip>
                    <Tooltip content="Callout"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.callout)}><MessageSquare size={16} /></Button></Tooltip>

                    <div className="h-5 w-px bg-white/10" />

                    {/* Colors */}
                    {/* Colors */}
                    <Popover placement="bottom">
                        <PopoverTrigger>
                            <Button isIconOnly size="sm" variant="flat"><Palette size={16} /></Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <ColorPicker
                                label="Text Color"
                                onChange={(color) => {
                                    if (editor) (editor as any).addMark(STYLE_KEYS.color, color);
                                }}
                                customColors={customColors}
                                onCustomColorAdd={(color) => setCustomColors(prev => [...prev, color])}
                            />
                        </PopoverContent>
                    </Popover>

                    <Popover placement="bottom">
                        <PopoverTrigger>
                            <Button isIconOnly size="sm" variant="flat"><Highlighter size={16} /></Button>
                        </PopoverTrigger>
                        <PopoverContent>
                            <ColorPicker
                                label="Highlight Color"
                                onChange={(color) => {
                                    if (editor) (editor as any).addMark(STYLE_KEYS.backgroundColor, color);
                                }}
                                customColors={customColors}
                                onCustomColorAdd={(color) => setCustomColors(prev => [...prev, color])}
                            />
                        </PopoverContent>
                    </Popover>

                    <div className="h-5 w-px bg-white/10" />

                    {/* Lists & Indentation */}
                    <Tooltip content="Bullet List"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleList(editor, { listStyleType: ListStyleType.Disc })}><List size={16} /></Button></Tooltip>
                    <Tooltip content="Numbered List"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleList(editor, { listStyleType: ListStyleType.Decimal })}><ListOrdered size={16} /></Button></Tooltip>
                    <Tooltip content="Outdent"><Button isIconOnly size="sm" variant="flat" onPress={() => outdent(editor)}><IndentDecrease size={16} /></Button></Tooltip>
                    <Tooltip content="Indent"><Button isIconOnly size="sm" variant="flat" onPress={() => indent(editor)}><IndentIncrease size={16} /></Button></Tooltip>

                    <div className="h-5 w-px bg-white/10" />

                    {/* Insertions */}
                    <Tooltip content="Link"><Button isIconOnly size="sm" variant="flat" onPress={handleInsertLink}><LinkIcon size={16} /></Button></Tooltip>
                    <Tooltip content="Image"><Button isIconOnly size="sm" variant="flat" onPress={openContentImagePicker}><ImagePlus size={16} /></Button></Tooltip>
                    <Tooltip content="Divider"><Button isIconOnly size="sm" variant="flat" onPress={insertDivider}><Minus size={16} /></Button></Tooltip>
                    <Tooltip content="Table"><Button isIconOnly size="sm" variant="flat" onPress={() => {
                        Transforms.insertNodes(editor as any, {
                            type: NODES.table,
                            children: [
                                { type: NODES.tr, children: [{ type: NODES.td, children: [{ text: '' }] }, { type: NODES.td, children: [{ text: '' }] }] },
                                { type: NODES.tr, children: [{ type: NODES.td, children: [{ text: '' }] }, { type: NODES.td, children: [{ text: '' }] }] }
                            ]
                        } as any);
                    }}><Table2 size={16} /></Button></Tooltip>
                </div>

                <div className="border border-white/10 rounded-xl bg-white/5">
                    <Plate editor={editor} onValueChange={handleEditorChange} renderLeaf={renderLeaf}>
                        <PlateContent className="min-h-[240px] px-4 py-3 text-sm outline-none" placeholder="Write here..." />
                        <input ref={contentImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleContentImagePick} />
                    </Plate>
                </div>
            </div>
        </div>
    );
}
