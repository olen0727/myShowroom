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
    Share2
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
            // const { data: { session } } = await supabase.auth.getSession();
            // if (!session) {
            //     router.push('/admin/login');
            // } else {
            //     setLoading(false);
            // }
            setLoading(false); // Always allow access
        };
        checkUser();
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

    const tabs = [
        { id: 'profile', label: '個人設定', icon: User },
        { id: 'projects', label: '作品集', icon: Briefcase },
        { id: 'experience', label: '經歷', icon: LayoutDashboard },
        { id: 'skills', label: '技能', icon: Code2 },
        { id: 'socials', label: '社群連結', icon: Share2 },
        { id: 'messages', label: '訊息', icon: MessageSquare },
    ];

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex">
            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full bg-neutral-900 border-r border-neutral-800 transition-all duration-300 z-20 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'
                    }`}
            >
                <div className="p-4 border-b border-neutral-800 flex items-center justify-between h-16">
                    {isSidebarOpen && <h1 className="text-lg font-bold truncate">後台管理</h1>}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors mx-auto"
                    >
                        {isSidebarOpen ? <LayoutDashboard size={20} /> : <LayoutDashboard size={24} />}
                    </button>
                </div>

                <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all group relative ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                    } ${!isSidebarOpen && 'justify-center'}`}
                                title={!isSidebarOpen ? tab.label : ''}
                            >
                                <Icon size={20} className="shrink-0" />
                                {isSidebarOpen && <span className="truncate">{tab.label}</span>}

                                {/* Tooltip for collapsed state */}
                                {!isSidebarOpen && (
                                    <div className="absolute left-full ml-4 px-2 py-1 bg-neutral-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-neutral-700">
                                        {tab.label}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-3 border-t border-neutral-800">
                    <button
                        onClick={handleLogout}
                        className={`w-full flex items-center gap-3 px-3 py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors ${!isSidebarOpen && 'justify-center'
                            }`}
                        title={!isSidebarOpen ? '登出' : ''}
                    >
                        <LogOut size={20} className="shrink-0" />
                        {isSidebarOpen && <span>登出</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main
                className={`flex-1 transition-all duration-300 min-h-screen ${isSidebarOpen ? 'ml-64' : 'ml-20'
                    }`}
            >
                <div className="p-8 max-w-7xl mx-auto">
                    <header className="mb-8 flex items-center justify-between">
                        <h2 className="text-2xl font-bold">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                        {/* Breadcrumb or extra actions can go here */}
                    </header>

                    {/* Content Area - Removed the rigid container to allow tabs to control their own layout */}
                    <div className="animate-in fade-in duration-300">
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
    );
}
