'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    Loader2,
    Image as ImageIcon,
    X,
    ArrowLeft,
    Upload
} from 'lucide-react';
import Image from 'next/image';

interface Project {
    id: number;
    title: string;
    category: string;
    description: string;
    images: string[];
    tags: string[];
    demo_link: string;
    github_link: string;
    display_order: number;
}

export default function ProjectsTab() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

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
            category: '前端開發',
            description: '',
            images: [],
            tags: [],
            demo_link: '',
            github_link: '',
            display_order: projects.length
        });
        setIsEditing(true);
    };

    const handleEdit = (project: Project) => {
        setCurrentProject(project);
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除這個作品嗎？此動作無法復原。')) return;

        try {
            const { error } = await supabase.from('projects').delete().eq('id', id);
            if (error) throw error;
            setProjects(projects.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('刪除失敗');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('projects')
                .upsert({
                    ...currentProject,
                    updated_at: new Date().toISOString(),
                } as any);

            if (error) throw error;

            await fetchProjects();
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving project:', error);
            alert('儲存失敗');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(e.target.files);
        const newImages: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `project-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `projects/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('portfolio')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('portfolio')
                    .getPublicUrl(filePath);

                newImages.push(publicUrl);
            }

            setCurrentProject(prev => ({
                ...prev,
                images: [...(prev.images || []), ...newImages]
            }));

        } catch (error: any) {
            console.error('Error uploading images:', error);
            alert(`上傳失敗: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (indexToRemove: number) => {
        setCurrentProject(prev => ({
            ...prev,
            images: prev.images?.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !currentProject.tags?.includes(val)) {
                setCurrentProject(prev => ({
                    ...prev,
                    tags: [...(prev.tags || []), val]
                }));
                e.currentTarget.value = '';
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setCurrentProject(prev => ({
            ...prev,
            tags: prev.tags?.filter(tag => tag !== tagToRemove)
        }));
    };

    if (loading) return <div>載入中...</div>;

    // --- Editor View ---
    // --- Editor View ---
    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="p-2 hover:bg-neutral-800 rounded-full transition-colors text-neutral-400 hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h3 className="text-xl font-bold text-white">
                            {currentProject.id ? '編輯作品' : '新增作品'}
                        </h3>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        <span>儲存專案</span>
                    </button>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-500 rounded-full" />
                                基本資訊
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">專案名稱</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentProject.title || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, title: e.target.value })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                        placeholder="例如：電商網站重構"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">分類</label>
                                    <select
                                        value={currentProject.category || '前端開發'}
                                        onChange={e => setCurrentProject({ ...currentProject, category: e.target.value })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    >
                                        <option value="前端開發">前端開發</option>
                                        <option value="UX 設計">UX 設計</option>
                                        <option value="全端開發">全端開發</option>
                                        <option value="移動應用">移動應用</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">專案描述</label>
                                <textarea
                                    required
                                    value={currentProject.description || ''}
                                    onChange={e => setCurrentProject({ ...currentProject, description: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white h-40 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all resize-none"
                                    placeholder="描述專案的目標、挑戰與解決方案..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">技術標籤</label>
                                <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {currentProject.tags?.map(tag => (
                                            <span key={tag} className="bg-blue-500/10 text-blue-400 px-2 py-1 rounded text-sm flex items-center gap-1 border border-blue-500/20">
                                                {tag}
                                                <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors"><X size={14} /></button>
                                            </span>
                                        ))}
                                        {(!currentProject.tags || currentProject.tags.length === 0) && (
                                            <span className="text-neutral-600 text-sm italic">尚未新增標籤</span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        onKeyDown={handleTagInput}
                                        placeholder="輸入技術名稱後按 Enter 新增 (例如: React, Next.js)..."
                                        className="w-full bg-transparent border-none p-0 text-white focus:ring-0 placeholder:text-neutral-600 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-6">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-1 h-5 bg-green-500 rounded-full" />
                                相關連結
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">Demo 連結</label>
                                    <input
                                        type="text"
                                        value={currentProject.demo_link || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, demo_link: e.target.value })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500/50 outline-none transition-all"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">GitHub 連結</label>
                                    <input
                                        type="text"
                                        value={currentProject.github_link || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, github_link: e.target.value })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500/50 outline-none transition-all"
                                        placeholder="https://github.com/..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Images */}
                    <div className="space-y-6">
                        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 sticky top-6">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-purple-500 rounded-full" />
                                專案圖片
                            </h4>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {currentProject.images?.map((img, idx) => (
                                        <div key={idx} className="relative w-full group rounded-lg border border-neutral-700 bg-neutral-950" style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                                            <Image src={img} alt={`Preview ${idx}`} fill className="object-cover" style={{ objectFit: 'cover' }} />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" style={{ zIndex: 10 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="bg-red-500 p-1.5 rounded-full text-white hover:bg-red-600 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            {idx === 0 && (
                                                <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded shadow-sm">
                                                    封面圖
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <label className="w-full aspect-[3/1] border-2 border-dashed border-neutral-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-500/5 transition-all group">
                                    {uploading ? <Loader2 className="animate-spin text-purple-500" /> : <Upload className="text-neutral-500 group-hover:text-purple-500 transition-colors" />}
                                    <span className="text-xs text-neutral-500 mt-2 group-hover:text-purple-400 transition-colors">點擊上傳圖片</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                <p className="text-xs text-neutral-500 text-center">
                                    第一張圖片將設為封面
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    // --- List View ---
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-semibold text-white">作品集列表</h3>
                <button
                    type="button"
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                    <Plus size={16} />
                    新增作品
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-neutral-800/50 rounded-xl border border-neutral-800 overflow-hidden group hover:border-neutral-600 transition-colors">
                        <div className="relative w-full bg-neutral-900" >
                            {project.images?.[0] ? (
                                <Image src={project.images[0]} alt={project.title} width={300} height={200} className="object-cover" style={{ objectFit: 'cover' }} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-neutral-600">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4" style={{ zIndex: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => handleEdit(project)}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                                    title="編輯"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(project.id)}
                                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                                    title="刪除"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className={`text-xs px-2 py-0.5 rounded ${project.category === 'UX 設計' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {project.category}
                                </span>
                            </div>
                            <h4 className="font-medium text-white truncate">{project.title}</h4>
                            <p className="text-sm text-neutral-400 mt-1 line-clamp-2">{project.description}</p>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-12 text-neutral-500 border-2 border-dashed border-neutral-800 rounded-lg">
                        目前沒有作品，請點擊右上角新增。
                    </div>
                )}
            </div>
        </div>
    );
}
