'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Loader2, Upload, ArrowLeft } from 'lucide-react';
import Image from 'next/image';

interface Project {
    id: string;
    title: string;
    description: string;
    images: string[];
    tags: string[];
    demo_link?: string;
    github_link?: string;
    category?: string;
    created_at?: string;
}

export default function ProjectsTab() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProject, setCurrentProject] = useState<Partial<Project>>({});
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

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
            category: '前端開發'
        });
        setIsEditing(true);
    };

    const handleEdit = (project: Project) => {
        setCurrentProject(project);
        setIsEditing(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除這個專案嗎？')) return;

        try {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', id);

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
            const projectData = {
                title: currentProject.title,
                description: currentProject.description,
                images: currentProject.images,
                tags: currentProject.tags,
                demo_link: currentProject.demo_link,
                github_link: currentProject.github_link,
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
                const { error } = await supabase
                    .from('projects')
                    .insert([projectData]);
                if (error) throw error;
            }

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
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('圖片上傳失敗');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...(currentProject.images || [])];
        newImages.splice(index, 1);
        setCurrentProject(prev => ({ ...prev, images: newImages }));
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
    if (isEditing) {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
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
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-6 shadow-xl">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
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
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600"
                                        placeholder="例如：電商網站重構"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">分類</label>
                                    <select
                                        value={currentProject.category || '前端開發'}
                                        onChange={e => setCurrentProject({ ...currentProject, category: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all [&>option]:bg-neutral-900"
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
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white h-40 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-neutral-600"
                                    placeholder="描述專案的目標、挑戰與解決方案..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">技術標籤</label>
                                <div className="bg-black/20 border border-white/10 rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500/50 transition-all">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {currentProject.tags?.map(tag => (
                                            <span key={tag} className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded text-sm flex items-center gap-1 border border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
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

                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-6 shadow-xl">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-1 h-5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                相關連結
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">Demo 連結</label>
                                    <input
                                        type="text"
                                        value={currentProject.demo_link || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, demo_link: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 outline-none transition-all placeholder:text-neutral-600"
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">GitHub 連結</label>
                                    <input
                                        type="text"
                                        value={currentProject.github_link || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, github_link: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 outline-none transition-all placeholder:text-neutral-600"
                                        placeholder="https://github.com/..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Images */}
                    <div className="space-y-6">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 sticky top-6 shadow-xl">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                                專案圖片
                            </h4>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    {currentProject.images?.map((img, idx) => (
                                        <div key={idx} className="relative w-full group rounded-lg border border-white/10 bg-black/40 overflow-hidden" style={{ position: 'relative', height: '150px' }}>
                                            <Image src={img} alt={`Preview ${idx}`} fill className="object-cover" style={{ objectFit: 'cover' }} />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm" style={{ zIndex: 10 }}>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(idx)}
                                                    className="bg-red-500/80 p-1.5 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            {idx === 0 && (
                                                <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] px-2 py-1 rounded shadow-sm backdrop-blur-sm">
                                                    封面圖
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <label className="w-full aspect-[3/1] border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition-all group">
                                    {uploading ? <Loader2 className="animate-spin text-purple-500" /> : <Upload className="text-neutral-500 group-hover:text-purple-400 transition-colors" />}
                                    <span className="text-xs text-neutral-500 mt-2 group-hover:text-purple-300 transition-colors">點擊上傳圖片</span>
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
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <h3 className="text-lg font-semibold text-white">作品集列表</h3>
                <button
                    type="button"
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40"
                >
                    <Plus size={16} />
                    新增作品
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden group hover:border-white/20 transition-all hover:shadow-2xl hover:shadow-blue-900/10">
                        <div className="relative w-full bg-black/40">
                            {project.images?.[0] ? (
                                <Image src={project.images[0]} alt={project.title} width={300} height={200} className="object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                                <div className="flex items-center justify-center h-full text-neutral-600">
                                    <ImageIcon size={32} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm" style={{ zIndex: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => handleEdit(project)}
                                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-110 border border-white/10 backdrop-blur-md"
                                    title="編輯"
                                >
                                    <Edit2 size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(project.id)}
                                    className="p-3 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-all hover:scale-110 shadow-lg"
                                    title="刪除"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className={`text-xs px-2.5 py-1 rounded-full border ${project.category === 'UX 設計' ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-blue-500/10 text-blue-300 border-blue-500/20'}`}>
                                    {project.category}
                                </span>
                            </div>
                            <h4 className="font-semibold text-white truncate text-lg mb-1 group-hover:text-blue-400 transition-colors">{project.title}</h4>
                            <p className="text-sm text-neutral-400 line-clamp-2 leading-relaxed">{project.description}</p>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full text-center py-16 text-neutral-500 border-2 border-dashed border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
                        <p className="mb-4">目前沒有作品</p>
                        <button
                            onClick={handleCreateNew}
                            className="text-blue-400 hover:text-blue-300 underline underline-offset-4"
                        >
                            立即新增第一個作品
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
