'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button, Spacer, Tab, Tabs } from '@nextui-org/react';
import {
    Briefcase,
    Code2,
    Images,
    LayoutDashboard,
    LogOut,
    MessageSquare,
    Share2,
    User,
} from 'lucide-react';

type AdminShellProps = {
    children: React.ReactNode;
};

const adminTabs = [
    { key: 'profile', label: 'Profile', path: '/admin/profile', icon: User },
    { key: 'projects', label: 'Projects', path: '/admin/projects', icon: Briefcase },
    { key: 'carousel', label: 'Carousel', path: '/admin/carousel', icon: Images },
    { key: 'experience', label: 'Experience', path: '/admin/experience', icon: LayoutDashboard },
    { key: 'skills', label: 'Skills', path: '/admin/skills', icon: Code2 },
    { key: 'socials', label: 'Socials', path: '/admin/socials', icon: Share2 },
    { key: 'messages', label: 'Messages', path: '/admin/messages', icon: MessageSquare },
];

export default function AdminShell({ children }: AdminShellProps) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const currentKey = useMemo(() => {
        const match = adminTabs.find((tab) => pathname === tab.path || pathname.startsWith(`${tab.path}/`));
        return match?.key ?? 'profile';
    }, [pathname]);

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/admin/login');
                } else {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error checking auth:', error);
                router.push('/admin/login');
            }
        };
        checkUser();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/admin/login');
    };

    const handleTabChange = (key: React.Key) => {
        const next = adminTabs.find((tab) => tab.key === key);
        if (next && next.path !== pathname) {
            router.push(next.path);
        }
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
                        selectedKey={currentKey}
                        onSelectionChange={handleTabChange}
                        color="primary"
                        variant="underlined"
                        classNames={{
                            tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                            cursor: "w-full bg-primary",
                            tab: "max-w-fit px-0 h-12",
                            tabContent: "group-data-[selected=true]:text-primary text-default-500 font-medium text-lg",
                        }}
                    >
                        {adminTabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <Tab
                                    key={tab.key}
                                    title={(
                                        <div className="flex items-center space-x-2">
                                            <Icon size={20} />
                                            <span>{tab.label}</span>
                                        </div>
                                    )}
                                >
                                    {tab.key === currentKey ? (
                                        <>
                                            <Spacer y={4} />
                                            {children}
                                        </>
                                    ) : null}
                                </Tab>
                            );
                        })}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
