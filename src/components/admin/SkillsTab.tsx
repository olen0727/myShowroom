'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Trash2,
    Save,
    Loader2,
    Layout,
    Database,
    Terminal,
    Code2,
    Server,
    Smartphone,
    Globe,
    Cpu,
    Cloud,
    GitBranch,
    Box,
    Layers
} from 'lucide-react';

// Icon Map for skills
const SKILL_ICONS: Record<string, any> = {
    Layout,
    Database,
    Terminal,
    Code2,
    Server,
    Smartphone,
    Globe,
    Cpu,
    Cloud,
    GitBranch,
    Box,
    Layers
};

const CATEGORIES = ['前端開發', '後端開發', '工具與維運', '其他技能'];

interface Skill {
    id: number;
    category: string;
    name: string;
    icon: string;
    display_order: number;
}

export default function SkillsTab() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSkills();
    }, []);

    const fetchSkills = async () => {
        try {
            const { data, error } = await supabase
                .from('skills')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setSkills(data || []);
        } catch (error) {
            console.error('Error fetching skills:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSkill = () => {
        const newSkill: Skill = {
            id: -1 * Math.random(),
            category: activeCategory,
            name: '',
            icon: 'Code2',
            display_order: skills.filter(s => s.category === activeCategory).length
        };
        setSkills([...skills, newSkill]);
    };

    const handleRemoveSkill = (id: number) => {
        setSkills(skills.filter(s => s.id !== id));
    };

    const handleChange = (id: number, field: keyof Skill, value: any) => {
        setSkills(skills.map(s => s.id === id ? { ...s, [field]: value } : s));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Similar logic to SocialsTab: Delete all and re-insert
            // This is safe for small datasets
            const existingIds = skills.filter(s => s.id > 0).map(s => s.id);

            if (existingIds.length > 0) {
                await supabase.from('skills').delete().not('id', 'in', `(${existingIds.join(',')})`);
            } else {
                await supabase.from('skills').delete().neq('id', 0);
            }

            const upsertData = skills.map((skill, index) => ({
                id: skill.id > 0 ? skill.id : undefined,
                category: skill.category,
                name: skill.name,
                icon: skill.icon,
                display_order: index // Global order, or per-category order logic if needed
            }));

            const { error } = await supabase.from('skills').upsert(upsertData);
            if (error) throw error;

            await fetchSkills();
            alert('儲存成功！');

        } catch (error) {
            console.error('Error saving skills:', error);
            alert('儲存失敗');
        } finally {
            setSaving(false);
        }
    };

    const currentSkills = skills.filter(s => s.category === activeCategory);

    if (loading) return <div>載入中...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-semibold text-white">技能管理</h3>
                {/* Top Save Button (Hidden on mobile if floating button is used, but kept for accessibility) */}
                <div className="hidden md:block">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        <span>儲存變更</span>
                    </button>
                </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 border-b border-neutral-800 overflow-x-auto pb-1 scrollbar-hide">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-4 py-2 text-sm font-medium transition-colors relative whitespace-nowrap ${activeCategory === cat
                            ? 'text-white'
                            : 'text-neutral-500 hover:text-neutral-300'
                            }`}
                    >
                        {cat}
                        {activeCategory === cat && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500" />
                        )}
                    </button>
                ))}
            </div>

            {/* Skills List */}
            <div className="space-y-4 min-h-[300px]">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-neutral-500">
                        管理 <span className="text-blue-400 font-medium">{activeCategory}</span> 類別下的技能
                    </p>
                    <button
                        onClick={handleAddSkill}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors border border-neutral-700"
                    >
                        <Plus size={16} />
                        新增技能
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentSkills.map((skill) => (
                        <div key={skill.id} className="group relative bg-neutral-900/50 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 transition-all">
                            <div className="flex items-start gap-3">
                                {/* Icon Selector */}
                                <div className="relative shrink-0">
                                    <div className="w-12 h-12 bg-neutral-950 rounded-lg flex items-center justify-center border border-neutral-800 group-hover:border-neutral-600 transition-colors">
                                        {SKILL_ICONS[skill.icon] ?
                                            (() => {
                                                const Icon = SKILL_ICONS[skill.icon];
                                                return <Icon size={24} className="text-blue-400" />;
                                            })()
                                            : <Code2 size={24} className="text-neutral-500" />}
                                    </div>
                                    <select
                                        value={skill.icon}
                                        onChange={(e) => handleChange(skill.id, 'icon', e.target.value)}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        title="點擊更換圖示"
                                    >
                                        {Object.keys(SKILL_ICONS).map(iconName => (
                                            <option key={iconName} value={iconName}>{iconName}</option>
                                        ))}
                                    </select>
                                    <div className="absolute -bottom-1 -right-1 bg-neutral-800 text-neutral-400 p-0.5 rounded text-[10px] pointer-events-none">
                                        ▼
                                    </div>
                                </div>

                                {/* Skill Name */}
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs text-neutral-500">技能名稱</label>
                                    <input
                                        type="text"
                                        value={skill.name}
                                        onChange={(e) => handleChange(skill.id, 'name', e.target.value)}
                                        placeholder="e.g. React"
                                        className="w-full bg-transparent border-b border-neutral-700 focus:border-blue-500 px-0 py-1 text-white text-sm outline-none transition-colors placeholder:text-neutral-700"
                                    />
                                </div>
                            </div>

                            {/* Delete Button */}
                            <button
                                onClick={() => handleRemoveSkill(skill.id)}
                                className="absolute top-2 right-2 p-1.5 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                title="刪除技能"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    {/* Add New Placeholder */}
                    <button
                        onClick={handleAddSkill}
                        className="flex flex-col items-center justify-center gap-2 bg-neutral-900/20 border-2 border-dashed border-neutral-800 hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl p-4 transition-all h-[100px] group"
                    >
                        <div className="w-8 h-8 rounded-full bg-neutral-800 group-hover:bg-blue-500/20 flex items-center justify-center transition-colors">
                            <Plus size={16} className="text-neutral-500 group-hover:text-blue-400" />
                        </div>
                        <span className="text-sm text-neutral-500 group-hover:text-blue-400">新增技能</span>
                    </button>
                </div>

                {currentSkills.length === 0 && (
                    <div className="text-center py-12 text-neutral-500">
                        此分類目前沒有技能，點擊上方按鈕新增。
                    </div>
                )}
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-6 right-6 z-50 md:hidden">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-xl shadow-blue-900/30 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span className="font-medium">儲存變更</span>
                </button>
            </div>
        </div>
    );
}
