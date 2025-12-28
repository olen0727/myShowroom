'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './ProjectDetail.module.css';
import { NODES, STYLE_KEYS, type Value } from 'platejs';
import type * as React from 'react';
import {
    Plate,
    PlateContent,
    createPlatePlugin,
    usePlateEditor,
} from 'platejs/react';
import { BasicBlocksPlugin, BasicMarksPlugin } from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import { LinkPlugin } from '@platejs/link/react';

import { ImagePlugin } from '@platejs/media/react';
import { ColumnPlugin, ColumnItemPlugin } from '@platejs/layout/react';

// Shared Imports
import { Project } from '@/types';
import { normalizeHexColor } from '@/lib/utils';
import { TAG_COLORS_TABLE } from '@/lib/constants';
import {
    ImageElement,
    CodeBlockElement,
    CalloutElement,
    HrElement,
    TableElement,
    TableRowElement,
    TableCellElement,
    TableHeaderCellElement,
    ColumnGroupElement,
    ColumnElement
} from '@/components/editor/PlateUiElements';

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

// Plugins Definition reusing shared Elements
const CodeBlockPlugin = createPlatePlugin({ key: NODES.codeBlock, node: { isElement: true }, render: { node: CodeBlockElement } });
const CalloutPlugin = createPlatePlugin({ key: NODES.callout, node: { isElement: true }, render: { node: CalloutElement } });
const HrPlugin = createPlatePlugin({ key: NODES.hr, node: { isElement: true }, render: { node: HrElement } });
const TablePlugin = createPlatePlugin({ key: NODES.table, node: { isElement: true }, render: { node: TableElement } });
const TableRowPlugin = createPlatePlugin({ key: NODES.tr, node: { isElement: true }, render: { node: TableRowElement } });
const TableCellPlugin = createPlatePlugin({ key: NODES.td, node: { isElement: true }, render: { node: TableCellElement } });
const TableHeaderCellPlugin = createPlatePlugin({ key: NODES.th, node: { isElement: true }, render: { node: TableHeaderCellElement } });
// Using official Plate.js API for column layout
// ColumnPlugin and ColumnItemPlugin will be configured with withComponent() in the plugins array

const StyledBlocksPlugin = BasicBlocksPlugin
    .extendPlugin({ key: NODES.h1 }, { node: { props: { className: 'text-3xl font-semibold text-white' } } })
    .extendPlugin({ key: NODES.h2 }, { node: { props: { className: 'text-2xl font-semibold text-white' } } })
    .extendPlugin({ key: NODES.h3 }, { node: { props: { className: 'text-xl font-semibold text-white' } } })
    .extendPlugin({ key: NODES.blockquote }, { node: { props: { className: 'border-l-2 border-white/20 pl-4 italic text-white/80' } } })
    .extendPlugin({ key: NODES.p }, { node: { props: { className: 'text-base leading-relaxed text-slate-200' } } });

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

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [contentValue, setContentValue] = useState<Value>(EMPTY_PLATE_VALUE);
    const [editorKey, setEditorKey] = useState(0);
    const [tagColorMap, setTagColorMap] = useState<Record<string, string>>({});

    const plugins = useMemo(() => ([
        StyledBlocksPlugin,
        BasicMarksPlugin,
        CalloutPlugin,
        CodeBlockPlugin,
        HrPlugin,
        TablePlugin,
        TableRowPlugin,
        TableCellPlugin,
        TableHeaderCellPlugin,
        ColumnPlugin.withComponent(ColumnGroupElement),
        ColumnItemPlugin.withComponent(ColumnElement),
        ListPlugin,
        LinkPlugin,
        ImagePlugin.withComponent(ImageElement),
    ]), []);

    const editor = usePlateEditor({ plugins, value: contentValue }, [editorKey]);

    useEffect(() => {
        if (!projectId) return;

        const fetchProject = async () => {
            setLoading(true);
            setError(null);
            try {
                const { data, error: fetchError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', projectId)
                    .single();

                if (fetchError) throw fetchError;
                setProject(data as Project);
                setContentValue(parsePlateValue(data?.content));
                setEditorKey((prev) => prev + 1);
            } catch (err: any) {
                console.error('Error fetching project:', err);
                setError('Project not found.');
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [projectId]);

    useEffect(() => {
        const fetchTagColors = async () => {
            try {
                const { data, error } = await supabase
                    .from(TAG_COLORS_TABLE)
                    .select('tag,color');

                if (error) throw error;

                const nextMap: Record<string, string> = {};
                (data || []).forEach((row: any) => {
                    if (typeof row?.tag !== 'string' || typeof row?.color !== 'string') return;
                    const normalized = normalizeHexColor(row.color);
                    if (normalized) nextMap[row.tag] = normalized;
                });
                setTagColorMap(nextMap);
            } catch (error) {
                console.error('Error fetching tag colors:', error);
            }
        };
        fetchTagColors();
    }, []);

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/#projects');
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.background} />
            <div className={styles.container}>
                <button type="button" className={styles.backButton} onClick={handleBack}>
                    Back
                </button>

                {loading && <div className={styles.status}>Loading project...</div>}
                {!loading && error && <div className={styles.status}>{error}</div>}

                {!loading && !error && project && (
                    <div className={styles.contentWrapper}>
                        <header className={styles.header}>
                            <p className={styles.kicker}>Project</p>
                            <h1 className={styles.title}>{project.title}</h1>
                            <p className={styles.description} style={{ whiteSpace: 'pre-wrap' }}>
                                {project.description}
                            </p>
                        </header>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Responsibilities</h2>
                            <div className={styles.tags}>
                                {(project.tags || []).length === 0 ? (
                                    <span className={styles.mutedText}>No tags</span>
                                ) : (
                                    project.tags.map((tag) => {
                                        const tagColor = tagColorMap[tag];
                                        const normalized = tagColor ? normalizeHexColor(tagColor) : '';
                                        const tagStyle = normalized ? { backgroundColor: normalized, borderColor: normalized } : undefined;
                                        return (
                                            <span key={tag} className={styles.tag} style={tagStyle}>
                                                {tag}
                                            </span>
                                        );
                                    })
                                )}
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Content</h2>
                            <div className={styles.contentShell}>
                                {editor ? (
                                    <Plate editor={editor} renderLeaf={renderLeaf}>
                                        <PlateContent readOnly className={styles.contentEditable} />
                                    </Plate>
                                ) : (
                                    <div className={styles.mutedText}>No content available.</div>
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </div>
    );
}

