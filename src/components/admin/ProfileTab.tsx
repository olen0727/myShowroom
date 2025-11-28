'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Save, Upload, FileText, Loader2 } from 'lucide-react';

interface Profile {
    id: number;
    hero_title: string;
    hero_subtitle_prefix: string;
    hero_subtitle_suffix: string;
    hero_roles: string[];
    resume_url: string | null;
    about_bio: string;
}

export default function ProfileTab() {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch profile data
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data, error } = await supabase
                .from('profile')
                .select('*')
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            setMessage({ type: 'error', text: '無法載入個人資料' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setSaving(true);
        setMessage(null);

        try {
            const { error } = await supabase
                .from('profile')
                .update({
                    hero_title: profile.hero_title,
                    hero_subtitle_prefix: profile.hero_subtitle_prefix,
                    hero_subtitle_suffix: profile.hero_subtitle_suffix,
                    hero_roles: profile.hero_roles,
                    resume_url: profile.resume_url,
                    about_bio: profile.about_bio,
                })
                .eq('id', profile.id);

            if (error) throw error;
            setMessage({ type: 'success', text: '儲存成功！' });
        } catch (error) {
            console.error('Error saving profile:', error);
            setMessage({ type: 'error', text: '儲存失敗，請稍後再試' });
        } finally {
            setSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const file = e.target.files[0];
        setUploading(true);
        setMessage(null);

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `resume-${Date.now()}.${fileExt}`;
            const filePath = `resumes/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('portfolio')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('portfolio')
                .getPublicUrl(filePath);

            // Update local state
            setProfile(prev => prev ? { ...prev, resume_url: publicUrl } : null);
            setMessage({ type: 'success', text: '履歷上傳成功！別忘了點擊儲存。' });

        } catch (error: any) {
            console.error('Error uploading file:', error);
            setMessage({ type: 'error', text: `上傳失敗: ${error.message}` });
        } finally {
            setUploading(false);
        }
    };

    const handleRolesChange = (value: string) => {
        // Split by comma and trim whitespace
        const roles = value.split(',').map(role => role.trim()).filter(Boolean);
        setProfile(prev => prev ? { ...prev, hero_roles: roles } : null);
    };

    if (loading) return <div className="text-center py-8">載入中...</div>;
    if (!profile) return <div className="text-center py-8 text-red-500">找不到資料，請確認資料庫是否已初始化。</div>;

    return (
        <form onSubmit={handleSave} className="space-y-6">
            {/* Message Toast */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {message.type === 'success' ? <Save size={18} /> : <FileText size={18} />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Hero Section */}
                <div className="space-y-6">
                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full" />
                            Hero 區塊設定
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">主標題</label>
                                <input
                                    type="text"
                                    value={profile.hero_title}
                                    onChange={e => setProfile({ ...profile, hero_title: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-400 mb-1">職稱 (用逗號分隔)</label>
                                <input
                                    type="text"
                                    value={profile.hero_roles.join(', ')}
                                    onChange={e => handleRolesChange(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    placeholder="前端工程師, UX 設計師"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1">副標題前綴</label>
                                    <input
                                        type="text"
                                        value={profile.hero_subtitle_prefix}
                                        onChange={e => setProfile({ ...profile, hero_subtitle_prefix: e.target.value })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-400 mb-1">副標題後綴</label>
                                    <input
                                        type="text"
                                        value={profile.hero_subtitle_suffix}
                                        onChange={e => setProfile({ ...profile, hero_subtitle_suffix: e.target.value })}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-purple-500 rounded-full" />
                            履歷檔案
                        </h3>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={profile.resume_url || ''}
                                    onChange={e => setProfile({ ...profile, resume_url: e.target.value })}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-10 pr-3 py-2 text-neutral-300 text-sm focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                                    placeholder="或是直接貼上連結..."
                                />
                                <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                            </div>
                            <label className="cursor-pointer bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-lg shadow-purple-900/20">
                                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                <span className="hidden sm:inline">上傳 PDF</span>
                                <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                />
                            </label>
                            {profile.resume_url && (
                                <a
                                    href={profile.resume_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white transition-colors"
                                    title="預覽履歷"
                                >
                                    <FileText size={20} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: About Section */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 h-fit">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 bg-green-500 rounded-full" />
                        關於我 (About)
                    </h3>
                    <div>
                        <label className="block text-sm font-medium text-neutral-400 mb-1">自我介紹 (Bio)</label>
                        <textarea
                            value={profile.about_bio}
                            onChange={e => setProfile({ ...profile, about_bio: e.target.value })}
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white h-[300px] focus:ring-2 focus:ring-green-500/50 outline-none transition-all leading-relaxed resize-none"
                            placeholder="請輸入自我介紹..."
                        />
                        <p className="text-xs text-neutral-500 mt-2 text-right">支援換行顯示</p>
                    </div>
                </div>
            </div>

            {/* Floating Save Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    type="submit"
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-xl shadow-blue-900/30 flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span className="font-medium">儲存變更</span>
                </button>
            </div>
        </form>
    );
}
