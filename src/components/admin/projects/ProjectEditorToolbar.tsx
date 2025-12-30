'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    Button,
    Input,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Tooltip,
} from '@nextui-org/react';
import {
    Bold,
    Code,
    Columns,
    Columns3,
    Heading1,
    Heading2,
    Heading3,
    Highlighter,
    ImagePlus,
    IndentDecrease,
    IndentIncrease,
    Link as LinkIcon,
    List,
    ListOrdered,
    MessageSquare,
    Minus,
    Palette,
    Quote,
    SlidersHorizontal,
    Strikethrough,
    Table2,
    Type,
    Underline,
    Italic,
} from 'lucide-react';
import { Editor, Element, Transforms } from 'slate';
import { NODES, STYLE_KEYS } from 'platejs';
import type { PlateEditor } from 'platejs/react';
import { toggleList, ListStyleType } from '@platejs/list';
import { indent, outdent } from '@platejs/indent';
import { upsertLink } from '@platejs/link';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { ColorPicker } from '@/components/admin/shared/ColorPicker';

const EMPTY_COLUMN_STYLE = {
    backgroundColor: '',
    borderColor: '',
    borderWidth: '',
};

type ColumnStyleDraft = typeof EMPTY_COLUMN_STYLE;

type ProjectEditorToolbarProps = {
    editor: PlateEditor | null;
    onOpenImagePicker: () => void;
};

export function ProjectEditorToolbar({ editor, onOpenImagePicker }: ProjectEditorToolbarProps) {
    const [customColors, setCustomColors] = useState<string[]>([]);
    const [customColorsLoaded, setCustomColorsLoaded] = useState(false);
    const customColorsSyncDisabledRef = useRef(false);
    const skipInitialCustomColorsSyncRef = useRef(true);
    const [columnStyleDraft, setColumnStyleDraft] = useState(EMPTY_COLUMN_STYLE);
    const [columnStyleContext, setColumnStyleContext] = useState<'none' | 'column' | 'group'>('none');
    const [isColumnStyleOpen, setIsColumnStyleOpen] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const loadCustomColors = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data, error } = await supabase
                    .from('profile')
                    .select('editor_custom_colors')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') throw error;

                const colors = data?.editor_custom_colors;
                if (Array.isArray(colors) && isMounted) {
                    setCustomColors(colors.filter((color) => typeof color === 'string'));
                }
            } catch (error) {
                console.warn('Failed to load custom colors from server', error);
                toast.error('Failed to load custom colors from server');
            } finally {
                if (isMounted) setCustomColorsLoaded(true);
            }
        };

        loadCustomColors();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!customColorsLoaded || customColorsSyncDisabledRef.current) return;
        if (skipInitialCustomColorsSyncRef.current) {
            skipInitialCustomColorsSyncRef.current = false;
            return;
        }

        const syncCustomColors = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { error } = await supabase
                    .from('profile')
                    .upsert({
                        id: user.id,
                        editor_custom_colors: customColors,
                        updated_at: new Date().toISOString(),
                    });

                if (error) throw error;
            } catch (error) {
                console.warn('Failed to sync custom colors', error);
                customColorsSyncDisabledRef.current = true;
                toast.error('Failed to sync custom colors to server');
            }
        };

        syncCustomColors();
    }, [customColors, customColorsLoaded]);

    const getColumnTargets = useCallback(() => {
        if (!editor?.selection) return null;
        const columnEntry = Editor.above(editor, {
            at: editor.selection,
            match: (node) => Element.isElement(node) && node.type === NODES.column,
        }) as any;
        if (!columnEntry) return null;
        const groupEntry = Editor.above(editor, {
            at: editor.selection,
            match: (node) => Element.isElement(node) && node.type === NODES.columnGroup,
        }) as any;
        return { columnEntry, groupEntry };
    }, [editor]);

    const syncColumnStyleDraft = useCallback(() => {
        const targets = getColumnTargets();
        if (!targets?.columnEntry) {
            setColumnStyleDraft(EMPTY_COLUMN_STYLE);
            setColumnStyleContext('none');
            return;
        }

        const [node] = targets.columnEntry as any;
        const rawBorderWidth = node?.columnBorderWidth;
        const parsedBorderWidth = typeof rawBorderWidth === 'number'
            ? rawBorderWidth
            : typeof rawBorderWidth === 'string' && rawBorderWidth.trim()
                ? Number(rawBorderWidth)
                : null;

        setColumnStyleDraft({
            backgroundColor: typeof node?.columnBackgroundColor === 'string' ? node.columnBackgroundColor : '',
            borderColor: typeof node?.columnBorderColor === 'string' ? node.columnBorderColor : '',
            borderWidth: Number.isFinite(parsedBorderWidth) ? String(parsedBorderWidth) : '',
        });
        setColumnStyleContext(targets.groupEntry ? 'group' : 'column');
    }, [getColumnTargets]);

    useEffect(() => {
        if (isColumnStyleOpen) {
            syncColumnStyleDraft();
        }
    }, [isColumnStyleOpen, syncColumnStyleDraft]);

    const applyColumnStyle = useCallback((draft: ColumnStyleDraft) => {
        if (!editor) return;
        const targets = getColumnTargets();
        if (!targets?.columnEntry) {
            toast.error('Place the cursor inside a column to update its style.');
            return;
        }

        const backgroundColor = draft.backgroundColor.trim();
        const borderColor = draft.borderColor.trim();
        const borderWidthValue = draft.borderWidth.trim();
        const borderWidth = borderWidthValue === '' ? null : Number(borderWidthValue);
        const props: Record<string, unknown> = {};
        const unset: string[] = [];

        if (backgroundColor) props.columnBackgroundColor = backgroundColor;
        else unset.push('columnBackgroundColor');

        if (borderColor) props.columnBorderColor = borderColor;
        else unset.push('columnBorderColor');

        if (borderWidthValue !== '' && Number.isFinite(borderWidth)) props.columnBorderWidth = borderWidth;
        else unset.push('columnBorderWidth');

        const options = targets.groupEntry
            ? { at: targets.groupEntry[1], match: (node: any) => Element.isElement(node) && node.type === NODES.column }
            : { at: targets.columnEntry[1] };

        if (Object.keys(props).length > 0) {
            Transforms.setNodes(editor, props as any, options as any);
        }
        if (unset.length > 0) {
            Transforms.unsetNodes(editor, unset as any, options as any);
        }
    }, [editor, getColumnTargets]);

    const handleResetColumnStyle = useCallback(() => {
        setColumnStyleDraft(EMPTY_COLUMN_STYLE);
        applyColumnStyle(EMPTY_COLUMN_STYLE);
    }, [applyColumnStyle]);

    const setBlockType = useCallback((type: string) => {
        if (!editor) return;
        Transforms.setNodes(editor as any, { type } as any);
    }, [editor]);

    const toggleMark = useCallback((type: string) => {
        if (!editor) return;
        const marks = Editor.marks(editor as any) as Record<string, any> | null;
        if (marks?.[type]) {
            (editor as any).removeMark(type);
        } else {
            (editor as any).addMark(type, true);
        }
    }, [editor]);

    const insertDivider = useCallback(() => {
        if (!editor) return;
        Transforms.insertNodes(editor as any, {
            type: NODES.hr,
            children: [{ text: '' }]
        } as any);
    }, [editor]);

    const handleInsertLink = useCallback(() => {
        if (!editor) return;
        const url = window.prompt('Enter link URL:');
        if (url) upsertLink(editor, { url, target: '_blank' });
    }, [editor]);

    if (!editor) return null;

    return (
        <>
            <Tooltip content="Bold"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('bold')}><Bold size={16} /></Button></Tooltip>
            <Tooltip content="Italic"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('italic')}><Italic size={16} /></Button></Tooltip>
            <Tooltip content="Underline"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('underline')}><Underline size={16} /></Button></Tooltip>
            <Tooltip content="Strikethrough"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('strikethrough')}><Strikethrough size={16} /></Button></Tooltip>
            <Tooltip content="Code"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleMark('code')}><Code size={16} /></Button></Tooltip>

            <div className="h-5 w-px bg-white/10" />

            <Tooltip content="Body"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.p)}><Type size={16} /></Button></Tooltip>
            <Tooltip content="H1"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.h1)}><Heading1 size={16} /></Button></Tooltip>
            <Tooltip content="H2"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.h2)}><Heading2 size={16} /></Button></Tooltip>
            <Tooltip content="H3"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.h3)}><Heading3 size={16} /></Button></Tooltip>

            <div className="h-5 w-px bg-white/10" />

            <Tooltip content="Quote"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.blockquote)}><Quote size={16} /></Button></Tooltip>
            <Tooltip content="Code Block"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.codeBlock)}><Code size={16} /></Button></Tooltip>
            <Tooltip content="Callout"><Button isIconOnly size="sm" variant="flat" onPress={() => setBlockType(NODES.callout)}><MessageSquare size={16} /></Button></Tooltip>

            <div className="h-5 w-px bg-white/10" />

            <Popover placement="bottom">
                <PopoverTrigger>
                    <Button isIconOnly size="sm" variant="flat"><Palette size={16} /></Button>
                </PopoverTrigger>
                <PopoverContent>
                    <ColorPicker
                        label="Text Color"
                        onChange={(color) => {
                            (editor as any).addMark(STYLE_KEYS.color, color);
                        }}
                        customColors={customColors}
                        onCustomColorAdd={(color) => setCustomColors(prev => [...prev, color])}
                        onCustomColorDelete={(color) => setCustomColors(prev => prev.filter(c => c !== color))}
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
                            (editor as any).addMark(STYLE_KEYS.backgroundColor, color);
                        }}
                        customColors={customColors}
                        onCustomColorAdd={(color) => setCustomColors(prev => [...prev, color])}
                        onCustomColorDelete={(color) => setCustomColors(prev => prev.filter(c => c !== color))}
                    />
                </PopoverContent>
            </Popover>

            <div className="h-5 w-px bg-white/10" />

            <Tooltip content="Bullet List"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleList(editor, { listStyleType: ListStyleType.Disc })}><List size={16} /></Button></Tooltip>
            <Tooltip content="Numbered List"><Button isIconOnly size="sm" variant="flat" onPress={() => toggleList(editor, { listStyleType: ListStyleType.Decimal })}><ListOrdered size={16} /></Button></Tooltip>
            <Tooltip content="Outdent"><Button isIconOnly size="sm" variant="flat" onPress={() => outdent(editor)}><IndentDecrease size={16} /></Button></Tooltip>
            <Tooltip content="Indent"><Button isIconOnly size="sm" variant="flat" onPress={() => indent(editor)}><IndentIncrease size={16} /></Button></Tooltip>

            <div className="h-5 w-px bg-white/10" />

            <Tooltip content="Link"><Button isIconOnly size="sm" variant="flat" onPress={handleInsertLink}><LinkIcon size={16} /></Button></Tooltip>
            <Tooltip content="Image"><Button isIconOnly size="sm" variant="flat" onPress={onOpenImagePicker}><ImagePlus size={16} /></Button></Tooltip>
            <Tooltip content="Two Columns"><Button isIconOnly size="sm" variant="flat" onPress={() => {
                Transforms.insertNodes(editor as any, {
                    type: 'column_group',
                    children: [
                        { type: 'column', children: [{ type: NODES.p, children: [{ text: 'Left column' }] }] },
                        { type: 'column', children: [{ type: NODES.p, children: [{ text: 'Right column' }] }] }
                    ]
                } as any);
            }}><Columns size={16} /></Button></Tooltip>
            <Tooltip content="Three Columns"><Button isIconOnly size="sm" variant="flat" onPress={() => {
                Transforms.insertNodes(editor as any, {
                    type: 'column_group',
                    children: [
                        { type: 'column', children: [{ type: NODES.p, children: [{ text: 'Column 1' }] }] },
                        { type: 'column', children: [{ type: NODES.p, children: [{ text: 'Column 2' }] }] },
                        { type: 'column', children: [{ type: NODES.p, children: [{ text: 'Column 3' }] }] }
                    ]
                } as any);
            }}><Columns3 size={16} /></Button></Tooltip>
            <Popover placement="bottom" shouldFlip={false} offset={8} isOpen={isColumnStyleOpen} onOpenChange={setIsColumnStyleOpen}>
                <PopoverTrigger>
                    <Button isIconOnly size="sm" variant="flat" aria-label="Column style">
                        <SlidersHorizontal size={16} />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="z-50 max-h-[70vh] overflow-y-auto overscroll-contain">
                    <div className="w-[46rem] max-w-[92vw] p-3">
                        <div className="space-y-3">
                            <div className="text-xs font-semibold text-default-500">Column Style</div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-3">
                                    <ColorPicker
                                        label="Background"
                                        className="w-full"
                                        color={columnStyleDraft.backgroundColor}
                                        onChange={(color) => setColumnStyleDraft((prev) => ({ ...prev, backgroundColor: color }))}
                                        customColors={customColors}
                                        onCustomColorAdd={(color) => setCustomColors(prev => [...prev, color])}
                                        onCustomColorDelete={(color) => setCustomColors(prev => prev.filter(c => c !== color))}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <ColorPicker
                                        label="Border Color"
                                        className="w-full"
                                        color={columnStyleDraft.borderColor}
                                        onChange={(color) => setColumnStyleDraft((prev) => ({ ...prev, borderColor: color }))}
                                        customColors={customColors}
                                        onCustomColorAdd={(color) => setCustomColors(prev => [...prev, color])}
                                        onCustomColorDelete={(color) => setCustomColors(prev => prev.filter(c => c !== color))}
                                    />
                                    <Input
                                        label="Border Width (px)"
                                        type="number"
                                        min="0"
                                        size="sm"
                                        variant="bordered"
                                        value={columnStyleDraft.borderWidth}
                                        onValueChange={(value) => setColumnStyleDraft((prev) => ({ ...prev, borderWidth: value }))}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    color="primary"
                                    onPress={() => applyColumnStyle(columnStyleDraft)}
                                    isDisabled={columnStyleContext === 'none'}
                                >
                                    Apply
                                </Button>
                                <Button
                                    size="sm"
                                    variant="flat"
                                    onPress={handleResetColumnStyle}
                                    isDisabled={columnStyleContext === 'none'}
                                >
                                    Reset
                                </Button>
                            </div>
                            <div className="text-[11px] text-default-400">Use Reset to clear colors.</div>
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
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
        </>
    );
}
