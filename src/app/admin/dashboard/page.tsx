'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    LayoutDashboard,
    User,
    Briefcase,
    Code2,
    MessageSquare,
    LogOut,
    Share2,
    X,
    Menu
} from 'lucide-react';

// Tabs
import ProfileTab from '@/components/admin/ProfileTab';
import ProjectsTab from '@/components/admin/ProjectsTab';
import ExperienceTab from '@/components/admin/ExperienceTab';
import SkillsTab from '@/components/admin/SkillsTab';
import MessagesTab from '@/components/admin/MessagesTab';
import SocialsTab from '@/components/admin/SocialsTab';

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            // TEMPORARY: Bypass login check for UI development
            setLoading(false);
        };
        checkUser();

        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setIsSidebarOpen(true);
            } else {
                setIsSidebarOpen(false);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-neutral-400">載入後台...</p>
                </div>
            </div>
        );
    }

    const menuItems = [
        { id: 'profile', label: '個人設定', icon: User },
        { id: 'projects', label: '作品集', icon: Briefcase },
        { id: 'experience', label: '經歷', icon: LayoutDashboard },
        { id: 'skills', label: '技能', icon: Code2 },
        { id: 'socials', label: '社群連結', icon: Share2 },
        { id: 'messages', label: '訊息', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-blue-500/30 relative overflow-hidden">
            {/* DEBUG BANNER */}
            <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 9999, background: 'red', color: 'white', padding: '20px', fontSize: '24px', width: '100%', textAlign: 'center' }}>
                DEBUG: NEW VERSION LOADED - IF YOU SEE THIS, THE CODE IS UPDATED
            </div>

            {/* Background Ambient Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '10s' }} />
            </div>

            {/* Mobile Sidebar Toggle */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-white hover:bg-white/20 transition-all"
            >
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="flex h-screen">
                {/* Glassmorphism Sidebar */}
                <aside
                    className={`
                        fixed lg:static inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 ease-in-out
                        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                        lg:translate-x-0
                        bg-black/20 backdrop-blur-2xl border-r border-white/5
                        flex flex-col
                    `}
                >
                    <div className="p-8">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Admin Console
                        </h1>
                        <p className="text-xs text-neutral-500 mt-2 tracking-wider uppercase">Content Management</p>
                    </div>

                    <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveTab(item.id);
                                        if (window.innerWidth < 1024) setIsSidebarOpen(false);
                                    }}
                                    className={`
                                        w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 group relative overflow-hidden
                                        ${isActive
                                            ? 'bg-white/10 text-white shadow-lg shadow-blue-900/20 border border-white/10'
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                        }
                                    `}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-xl" />
                                    )}
                                    <Icon size={20} className={`transition-transform duration-300 ${isActive ? 'scale-110 text-blue-400' : 'group-hover:scale-110'}`} />
                                    <span className="font-medium tracking-wide">{item.label}</span>
                                    {isActive && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-50" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-6 border-t border-white/5">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-6 py-3 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-transparent hover:border-red-500/20"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">登出系統</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                    <div className="max-w-7xl mx-auto p-6 lg:p-12">
                        <header className="mb-10 flex items-center justify-between">
                            <div>
                                <h2 className="text-3xl font-bold text-white mb-2">{menuItems.find(i => i.id === activeTab)?.label}</h2>
                                <p className="text-neutral-400">Manage your {activeTab} content here.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                    <span className="text-xs text-neutral-300">System Online</span>
                                </div>
                            </div>
                        </header>

                        {/* Glassmorphism Content Container */}
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                            {/* Subtle inner glow */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -z-10" />

                            {activeTab === 'profile' && <ProfileTab />}
                            {activeTab === 'projects' && <ProjectsTab />}
                            {activeTab === 'experience' && <ExperienceTab />}
                            {activeTab === 'skills' && <SkillsTab />}
                            {activeTab === 'socials' && <SocialsTab />}
                            {activeTab === 'messages' && <MessagesTab />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
