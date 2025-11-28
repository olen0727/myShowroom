'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
    Tabs,
    Tab,
    Card,
    CardBody,
    Button,
    User as UserAvatar,
    Spacer
} from "@nextui-org/react";
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
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const checkUser = async () => {
            // TEMPORARY: Bypass login check for UI development
            setLoading(false);
        };
        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-foreground p-8 relative overflow-hidden">
            {/* Background Ambient Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/20 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary-500/20 rounded-full blur-[150px] animate-pulse" />
            </div>

            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            Admin Console
                        </h1>
                        <p className="text-default-500">Manage your portfolio content</p>
                    </div>
                    <Button
                        color="danger"
                        variant="flat"
                        startContent={<LogOut size={18} />}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </div>

                <div className="flex w-full flex-col">
                    <Tabs
                        aria-label="Admin Options"
                        color="primary"
                        variant="underlined"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-primary text-default-500 font-medium text-lg"
                        }}
                    >
                        <Tab
                            key="profile"
                            title={
                                <div className="flex items-center space-x-2">
                                    <User size={20} />
                                    <span>Profile</span>
                                </div>
                            }
                        >
                            <Spacer y={4} />
                            <ProfileTab />
                        </Tab>
                        <Tab
                            key="projects"
                            title={
                                <div className="flex items-center space-x-2">
                                    <Briefcase size={20} />
                                    <span>Projects</span>
                                </div>
                            }
                        >
                            <Spacer y={4} />
                            <ProjectsTab />
                        </Tab>
                        <Tab
                            key="experience"
                            title={
                                <div className="flex items-center space-x-2">
                                    <LayoutDashboard size={20} />
                                    <span>Experience</span>
                                </div>
                            }
                        >
                            <Spacer y={4} />
                            <ExperienceTab />
                        </Tab>
                        <Tab
                            key="skills"
                            title={
                                <div className="flex items-center space-x-2">
                                    <Code2 size={20} />
                                    <span>Skills</span>
                                </div>
                            }
                        >
                            <Spacer y={4} />
                            <SkillsTab />
                        </Tab>
                        <Tab
                            key="socials"
                            title={
                                <div className="flex items-center space-x-2">
                                    <Share2 size={20} />
                                    <span>Socials</span>
                                </div>
                            }
                        >
                            <Spacer y={4} />
                            <SocialsTab />
                        </Tab>
                        <Tab
                            key="messages"
                            title={
                                <div className="flex items-center space-x-2">
                                    <MessageSquare size={20} />
                                    <span>Messages</span>
                                </div>
                            }
                        >
                            <Spacer y={4} />
                            <MessagesTab />
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
