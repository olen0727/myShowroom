'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, Loader2, X, Share2, Github, Linkedin, Twitter, Facebook, Instagram, Youtube, Globe } from 'lucide-react';

interface SocialLink {
    id: string;
    platform: string;
    url: string;
    icon?: string;
}

export default function SocialsTab() {
    const [socials, setSocials] = useState<SocialLink[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState('Github');

    const platforms = [
        { name: 'Github', icon: Github },
        { name: 'Linkedin', icon: Linkedin },
        { name: 'Twitter', icon: Twitter },
        { name: 'Facebook', icon: Facebook },
        { name: 'Instagram', icon: Instagram },
        { name: 'Youtube', icon: Youtube },
        { name: 'Website', icon: Globe },
    ];

    useEffect(() => {
        fetchSocials();
    }, []);

    const fetchSocials = async () => {
        try {
            const { data, error } = await supabase
                .from('social_links')
                .select('*');

            if (error) throw error;
            setSocials(data || []);
        } catch (error) {
            console.error('Error fetching socials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSocial = () => {
        if (!newUrl.trim()) return;

        const social: SocialLink = {
            id: Math.random().toString(36).substr(2, 9),
            platform: selectedPlatform,
            url: newUrl.trim()
        };

        setSocials([...socials, social]);
        setNewUrl('');
    };

    const handleRemoveSocial = (id: string) => {
        setSocials(socials.filter(s => s.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error: deleteError } = await supabase
                .from('social_links')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (deleteError) throw deleteError;

            const socialsToInsert = socials.map(({ id, ...rest }) => rest);
            if (socialsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('social_links')
                    .insert(socialsToInsert);

                if (insertError) throw insertError;
            }

            await fetchSocials();
            alert('社群連結已更新');
        } catch (error) {
            console.error('Error saving socials:', error);
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
                {/* Left Column: Add New Social */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl sticky top-6">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Plus className="text-blue-400" />
                            新增連結
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm text-neutral-400">選擇平台</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {platforms.map(p => {
                                        const Icon = p.icon;
                                        return (
                                            <button
                                                key={p.name}
                                                onClick={() => setSelectedPlatform(p.name)}
                                                className={`
                                                    flex flex-col items-center gap-2 p-3 rounded-xl transition-all border
                                                    ${selectedPlatform === p.name
                                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                                                        : 'bg-black/20 text-neutral-400 border-white/5 hover:bg-white/5 hover:text-white'
                                                    }
                                                `}
                                            >
                                                <Icon size={20} />
                                                <span className="text-xs">{p.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm text-neutral-400">連結 URL</label>
                                <div className="flex gap-2">
                                    <input
                                        type="url"
                                        value={newUrl}
                                        onChange={e => setNewUrl(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddSocial()}
                                        className="flex-1 bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600"
                                        placeholder="https://..."
                                    />
                                    <button
                                        onClick={handleAddSocial}
                                        disabled={!newUrl.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Socials List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
                        <h4 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                            <Share2 className="text-purple-400" />
                            已連結帳號
                        </h4>

                        <div className="space-y-4">
                            {socials.map(social => {
                                const platformInfo = platforms.find(p => p.name === social.platform) || { icon: Globe };
                                const Icon = platformInfo.icon;

                                return (
                                    <div
                                        key={social.id}
                                        className="group flex items-center gap-4 bg-black/20 hover:bg-black/40 border border-white/5 hover:border-white/20 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-purple-500/10"
                                    >
                                        <div className="p-3 bg-white/5 rounded-lg text-neutral-300 group-hover:text-white group-hover:bg-blue-500/20 transition-colors">
                                            <Icon size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h5 className="text-white font-medium">{social.platform}</h5>
                                            <p className="text-sm text-neutral-500 truncate group-hover:text-neutral-400 transition-colors">{social.url}</p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveSocial(social.id)}
                                            className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                            title="移除"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                );
                            })}

                            {socials.length === 0 && (
                                <div className="text-center py-12 text-neutral-500 border-2 border-dashed border-white/10 rounded-xl">
                                    <p>目前沒有社群連結</p>
                                    <p className="text-sm mt-2">請從左側新增連結</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
