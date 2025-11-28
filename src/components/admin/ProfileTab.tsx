'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Loader2, User, Mail, Github, Linkedin, Globe } from 'lucide-react';

interface Profile {
    id: string;
    full_name: string;
    headline: string;
    bio: string;
    email: string;
    location: string;
    website: string;
    avatar_url: string;
}

export default function ProfileTab() {
    const [profile, setProfile] = useState<Partial<Profile>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profile')
                .select('*')
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data) setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from('profile')
                .upsert({
                    id: '1', // Assuming single user profile for now
                    ...profile,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;
            alert('個人資料已更新');
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('儲存失敗');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white">載入中...</div>;

    return (
        <form onSubmit={handleSave} className="relative space-y-8">
            {/* Floating Save Button */}
            <div className="fixed bottom-8 right-8 z-50">
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    title="儲存變更"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <User className="text-blue-400" />
                            基本資料
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-neutral-400">全名</label>
                                <input
                                    type="text"
                                    value={profile.full_name || ''}
                                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600"
                                    placeholder="您的名字"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-neutral-400">職稱 (Headline)</label>
                                <input
                                    type="text"
                                    value={profile.headline || ''}
                                    onChange={e => setProfile({ ...profile, headline: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600"
                                    placeholder="例如：全端工程師"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm text-neutral-400">個人簡介 (Bio)</label>
                                <textarea
                                    value={profile.bio || ''}
                                    onChange={e => setProfile({ ...profile, bio: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white h-32 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all resize-none placeholder:text-neutral-600"
                                    placeholder="簡短介紹您自己..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl">
                        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                            <Globe className="text-purple-400" />
                            聯絡方式
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm text-neutral-400">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3.5 text-neutral-500" size={18} />
                                    <input
                                        type="email"
                                        value={profile.email || ''}
                                        onChange={e => setProfile({ ...profile, email: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none transition-all placeholder:text-neutral-600"
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm text-neutral-400">所在地</label>
                                <input
                                    type="text"
                                    value={profile.location || ''}
                                    onChange={e => setProfile({ ...profile, location: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none transition-all placeholder:text-neutral-600"
                                    placeholder="例如：台北, 台灣"
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm text-neutral-400">個人網站</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3.5 text-neutral-500" size={18} />
                                    <input
                                        type="url"
                                        value={profile.website || ''}
                                        onChange={e => setProfile({ ...profile, website: e.target.value })}
                                        className="w-full bg-black/20 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 outline-none transition-all placeholder:text-neutral-600"
                                        placeholder="https://yourwebsite.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Avatar & Preview */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl sticky top-6 text-center">
                        <h3 className="text-lg font-semibold text-white mb-6">頭像預覽</h3>
                        <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden border-4 border-white/10 shadow-2xl">
                            {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                                    {profile.full_name?.[0] || 'U'}
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-neutral-400">頭像連結 (URL)</label>
                            <input
                                type="text"
                                value={profile.avatar_url || ''}
                                onChange={e => setProfile({ ...profile, avatar_url: e.target.value })}
                                className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all placeholder:text-neutral-600 text-center"
                                placeholder="https://..."
                            />
                            <p className="text-xs text-neutral-500 mt-2">
                                建議使用正方形圖片以獲得最佳效果。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
