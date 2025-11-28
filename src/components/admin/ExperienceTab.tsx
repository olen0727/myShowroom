'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    Loader2,
    ArrowLeft,
    Briefcase,
    X
} from 'lucide-react';

interface Experience {
    id: number;
    period: string;
    role: string;
    company: string;
    description: string;
    skills: string[];
    display_order: number;
}

export default function ExperienceTab() {
    const [experiences, setExperiences] = useState<Experience[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentExp, setCurrentExp] = useState<Partial<Experience>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchExperiences();
    }, []);

    const fetchExperiences = async () => {
        try {
            const { data, error } = await supabase
                .from('experiences')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setExperiences(data || []);
        } catch (error) {
            console.error('Error fetching experiences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        setCurrentExp({
            period: '',
            role: '',
            company: '',
            description: '',
            skills: [],
            display_order: experiences.length
        });
        setIsEditing(true);
    };

    const handleEdit = (exp: Experience) => {
        setCurrentExp(exp);
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('確定要刪除這筆經歷嗎？')) return;

        try {
            const { error } = await supabase.from('experiences').delete().eq('id', id);
            if (error) throw error;
            setExperiences(experiences.filter(e => e.id !== id));
        } catch (error) {
            console.error('Error deleting experience:', error);
            alert('刪除失敗');
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('experiences')
                .upsert({
                    ...currentExp,
                    updated_at: new Date().toISOString(),
                } as any);

            if (error) throw error;

            await fetchExperiences();
            setIsEditing(false);
        } catch (error) {
            console.error('Error saving experience:', error);
            alert('儲存失敗');
        } finally {
            setSaving(false);
        }
    };

    const handleSkillInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = e.currentTarget.value.trim();
            if (val && !currentExp.skills?.includes(val)) {
                setCurrentExp(prev => ({
                    ...prev,
                    skills: [...(prev.skills || []), val]
                }));
                e.currentTarget.value = '';
            }
        }
    };

    const removeSkill = (skillToRemove: string) => {
        setCurrentExp(prev => ({
            ...prev,
            skills: prev.skills?.filter(s => s !== skillToRemove)
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
                            onClick={() => setIsEditing(false)}
                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-neutral-400 hover:text-white"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h3 className="text-xl font-bold text-white">
                            {currentExp.id ? '編輯經歷' : '新增經歷'}
                        </h3>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/20"
                    >
                        {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                        <span>儲存經歷</span>
                    </button>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-6 shadow-xl">
                            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                                工作資訊
                            </h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">職稱 (Role)</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentExp.role || ''}
                                        onChange={e => setCurrentExp({ ...currentExp, role: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600"
                                        placeholder="e.g. 資深前端工程師"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-neutral-400">公司名稱 (Company)</label>
                                    <input
                                        type="text"
                                        required
                                        value={currentExp.company || ''}
                                        onChange={e => setCurrentExp({ ...currentExp, company: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600"
                                        placeholder="e.g. Google"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">任職期間 (Period)</label>
                                <input
                                    type="text"
                                    required
                                    value={currentExp.period || ''}
                                    onChange={e => setCurrentExp({ ...currentExp, period: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600"
                                    placeholder="e.g. 2021 - Present"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-neutral-400">工作內容描述</label>
                                <textarea
                                    required
                                    value={currentExp.description || ''}
                                    onChange={e => setCurrentExp({ ...currentExp, description: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white h-40 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-neutral-600"
                                    placeholder="簡述您的職責與成就..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Skills */}
                    <div className="space-y-6">
                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 sticky top-6 shadow-xl">
                            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                使用技能
                            </h4>

                            <div className="space-y-4">
                                <div className="bg-black/20 border border-white/10 rounded-lg p-3 min-h-[100px] focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500/50 transition-all">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {currentExp.skills?.map(skill => (
                                            <span key={skill} className="bg-green-500/20 text-green-400 px-2 py-1 rounded text-sm flex items-center gap-1 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]">
                                                {skill}
                                                <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white transition-colors"><X size={14} /></button>
                                            </span>
                                        ))}
                                        {(!currentExp.skills || currentExp.skills.length === 0) && (
                                            <span className="text-neutral-600 text-sm italic">尚未新增技能</span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        onKeyDown={handleSkillInput}
                                        placeholder="輸入技能後按 Enter..."
                                        className="w-full bg-transparent border-none p-0 text-white focus:ring-0 placeholder:text-neutral-600 text-sm"
                                    />
                                </div>
                                <p className="text-xs text-neutral-500">
                                    列出在這份工作中使用的主要技術或工具。
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
                <h3 className="text-lg font-semibold text-white">經歷列表</h3>
                <button
                    onClick={handleCreateNew}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40"
                >
                    <Plus size={16} />
                    新增經歷
                </button>
            </div>

            <div className="space-y-4">
                {experiences.map((exp) => (
                    <div key={exp.id} className="bg-white/5 backdrop-blur-md p-6 rounded-xl border border-white/10 flex justify-between items-start group hover:border-white/20 transition-all hover:shadow-xl hover:shadow-blue-900/10">
                        <div className="flex gap-4">
                            <div className="mt-1 p-3 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                                <Briefcase size={24} />
                            </div>
                            <div>
                                <h4 className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors">{exp.role}</h4>
                                <div className="text-neutral-400 text-sm mb-2">{exp.company} • {exp.period}</div>
                                <p className="text-neutral-400 text-sm line-clamp-2 leading-relaxed">{exp.description}</p>
                                <div className="flex flex-wrap gap-2 mt-3">
                                    {exp.skills?.map(skill => (
                                        <span key={skill} className="text-xs bg-white/5 border border-white/10 text-neutral-300 px-2 py-1 rounded">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(exp)}
                                className="p-2 hover:bg-white/10 rounded-full text-neutral-400 hover:text-white transition-colors border border-transparent hover:border-white/10"
                            >
                                <Edit2 size={18} />
                            </button>
                            <button
                                onClick={() => handleDelete(exp.id)}
                                className="p-2 hover:bg-red-500/10 rounded-full text-neutral-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {experiences.length === 0 && (
                    <div className="text-center py-12 text-neutral-500 border-2 border-dashed border-white/10 rounded-xl bg-white/5 backdrop-blur-sm">
                        目前沒有經歷資料，請點擊右上角新增。
                    </div>
                )}
            </div>
        </div>
    );
}
