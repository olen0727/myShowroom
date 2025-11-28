'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, Loader2, X, Code2 } from 'lucide-react';

interface Skill {
    id: string;
    name: string;
    category: string;
    icon?: string;
}

export default function SkillsTab() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newSkill, setNewSkill] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Frontend');

    const categories = ['Frontend', 'Backend', 'Database', 'Tools', 'Design', 'Other'];

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const { data, error } = await supabase
                .from('skills')
                .select('*')
                .order('category');

            if (error) throw error;
            setSkills(data || []);
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = () => {
        if (!newSkill.trim()) return;

        const skill: Skill = {
            id: Math.random().toString(36).substr(2, 9), // Temporary ID
            name: newSkill.trim(),
            category: selectedCategory
        };

        setSkills([...skills, skill]);
        setNewSkill('');
    };

    const handleRemoveSkill = (id: string) => {
        setSkills(skills.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // First delete all existing skills (simple approach for now)
            // In a real app, you'd want to diff and update/insert/delete
            const { error: deleteError } = await supabase
                .from('skills')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

            if (deleteError) throw deleteError;

            // Insert current skills
            const skillsToInsert = skills.map(({ id, ...rest }) => rest); // Remove temp IDs
            if (skillsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('skills')
                    .insert(skillsToInsert);

                if (insertError) throw insertError;
            }

            await fetchSkills(); // Refresh to get real IDs
            alert('技能列表已更新');
        } catch (error) {
            console.error('Error saving skills:', error);
            alert('儲存失敗');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>載入中...</div>;

    return (
        <div className="relative space-y-8">
            {/* Floating Save Button */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="儲存變更"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Add New Skill */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl sticky top-6">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Plus className="text-blue-400" />
                            新增技能
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm text-neutral-400">類別</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {categories.map(cat => (
                                        <button
                                            key={cat}
                                            onClick={() => setSelectedCategory(cat)}
                                            className={`
                                                px-3 py-2 rounded-lg text-sm transition-all border
                                                ${selectedCategory === cat
                                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                                    : 'bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5 hover:text-white'
                                                }
                                            `}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-neutral-400">技能名稱</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newSkill}
                                        onChange={e => setNewSkill(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600"
                                        placeholder="例如：React"
                                    />
                                    <button
                                        onClick={handleAddSkill}
                                        disabled={!newSkill.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Skills List */}
                <div className="lg:col-span-2 space-y-6">
                    {categories.map(category => {
                        const categorySkills = skills.filter(s => s.category === category);
                        if (categorySkills.length === 0) return null;

                        return (
                            <div key={category} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
                                <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Code2 size={20} className="text-purple-400" />
                                    {category}
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {categorySkills.map(skill => (
                                        <div
                                            key={skill.id}
                                            className="group flex items-center gap-2 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/20 rounded-lg pl-4 pr-2 py-2 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                                        >
                                            <span className="text-neutral-200 font-medium">{skill.name}</span>
                                            <button
                                                onClick={() => handleRemoveSkill(skill.id)}
                                                className="p-1 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {skills.length === 0 && (
                        <div className="text-center py-16 text-neutral-500 border-2 border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
                            <p>目前沒有技能資料</p>
                            <p className="text-sm mt-2">請從左側新增技能</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
