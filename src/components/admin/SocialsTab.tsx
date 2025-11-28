'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Trash2,
    GripVertical,
    Save,
    Loader2,
    Github,
    Linkedin,
    Facebook,
    Instagram,
    Twitter,
    Mail,
    Globe,
    Youtube,
    Twitch
} from 'lucide-react';

// Icon Map for dynamic rendering
const ICON_MAP: Record<string, any> = {
    Github,
    Linkedin,
    Facebook,
    Instagram,
    Twitter,
    Mail,
    Globe,
    Youtube,
    Twitch
};

interface SocialLink {
    id: number;
    platform: string;
    url: string;
    icon: string;
    is_active: boolean;
    display_order: number;
}

export default function SocialsTab() {
    const [links, setLinks] = useState<SocialLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const { data, error } = await supabase
                .from('social_links')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;
            setLinks(data || []);
        } catch (error) {
            console.error('Error fetching social links:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLink = () => {
        const newLink: SocialLink = {
            id: -1 * Math.random(), // Temporary ID
            platform: '',
            url: '',
            icon: 'Globe',
            is_active: true,
            display_order: links.length
        };
        setLinks([...links, newLink]);
    };

    const handleRemoveLink = (id: number) => {
        setLinks(links.filter(l => l.id !== id));
    };

    const handleChange = (id: number, field: keyof SocialLink, value: any) => {
        setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Delete all existing links (simplest way to handle reordering/deletions)
            // In a production app with huge data, we would diff changes. 
            // But for < 10 items, this is fine and robust.

            // First, get IDs of items to keep (that have positive IDs)
            const existingIds = links.filter(l => l.id > 0).map(l => l.id);

            // Delete items not in the new list
            if (existingIds.length > 0) {
                await supabase.from('social_links').delete().not('id', 'in', `(${existingIds.join(',')})`);
            } else {
                // If list is empty, delete everything
                await supabase.from('social_links').delete().neq('id', 0);
            }

            // 2. Upsert all items
            const upsertData = links.map((link, index) => ({
                id: link.id > 0 ? link.id : undefined, // Let DB generate ID for new items
                platform: link.platform,
                url: link.url,
                icon: link.icon,
                is_active: link.is_active,
                display_order: index // Update order based on current array index
            }));

            const { error } = await supabase.from('social_links').upsert(upsertData);
            if (error) throw error;

            await fetchLinks(); // Refresh to get real IDs
            alert('儲存成功！');

        } catch (error) {
            console.error('Error saving socials:', error);
            alert('儲存失敗');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>載入中...</div>;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
                <h3 className="text-lg font-semibold text-white">社群連結管理</h3>
                <div className="flex gap-3">
                    <button
                        onClick={handleAddLink}
                        className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-3 py-2 rounded-lg text-sm transition-colors border border-neutral-700"
                    >
                        <Plus size={16} />
                        新增連結
                    </button>
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
            </div>

            <div className="space-y-3">
                {links.map((link, index) => (
                    <div key={link.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 bg-neutral-900/50 p-4 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-all group">
                        <div className="hidden md:block cursor-move text-neutral-600 hover:text-neutral-400 p-2">
                            <GripVertical size={20} />
                        </div>

                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {/* Icon Selector */}
                            <div className="relative shrink-0">
                                <div className="w-10 h-10 bg-neutral-950 rounded-lg flex items-center justify-center border border-neutral-800 group-hover:border-neutral-600 transition-colors">
                                    {ICON_MAP[link.icon] ?
                                        (() => {
                                            const Icon = ICON_MAP[link.icon];
                                            return <Icon size={20} className="text-neutral-300" />;
                                        })()
                                        : <Globe size={20} className="text-neutral-500" />}
                                </div>
                                <select
                                    value={link.icon}
                                    onChange={(e) => handleChange(link.id, 'icon', e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    title="點擊更換圖示"
                                >
                                    {Object.keys(ICON_MAP).map(iconName => (
                                        <option key={iconName} value={iconName}>{iconName}</option>
                                    ))}
                                </select>
                                <div className="absolute -bottom-1 -right-1 bg-neutral-800 text-neutral-400 p-0.5 rounded text-[10px] pointer-events-none">
                                    ▼
                                </div>
                            </div>

                            {/* Platform Name */}
                            <div className="flex-1 md:w-40">
                                <input
                                    type="text"
                                    value={link.platform}
                                    onChange={(e) => handleChange(link.id, 'platform', e.target.value)}
                                    placeholder="平台名稱"
                                    className="w-full bg-transparent border-b border-neutral-700 focus:border-blue-500 px-0 py-1 text-white text-sm outline-none transition-colors placeholder:text-neutral-600"
                                />
                            </div>
                        </div>

                        {/* URL */}
                        <div className="flex-1 w-full">
                            <input
                                type="text"
                                value={link.url}
                                onChange={(e) => handleChange(link.id, 'url', e.target.value)}
                                placeholder="連結網址 (https://...)"
                                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white text-sm focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                            />
                        </div>

                        <div className="flex items-center justify-between w-full md:w-auto gap-4 mt-2 md:mt-0">
                            {/* Active Toggle */}
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                <div className={`w-10 h-5 rounded-full relative transition-colors ${link.is_active ? 'bg-blue-600' : 'bg-neutral-700'}`}>
                                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${link.is_active ? 'left-6' : 'left-1'}`} />
                                </div>
                                <input
                                    type="checkbox"
                                    checked={link.is_active}
                                    onChange={(e) => handleChange(link.id, 'is_active', e.target.checked)}
                                    className="hidden"
                                />
                                <span className="text-xs text-neutral-400">{link.is_active ? '已啟用' : '已停用'}</span>
                            </label>

                            {/* Delete Button */}
                            <button
                                onClick={() => handleRemoveLink(link.id)}
                                className="text-neutral-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg p-2 transition-colors"
                                title="刪除連結"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}

                {links.length === 0 && (
                    <div className="text-center py-12 text-neutral-500 border-2 border-dashed border-neutral-800 rounded-lg">
                        目前沒有社群連結，請點擊右上角新增。
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
