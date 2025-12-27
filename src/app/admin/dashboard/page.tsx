import { redirect } from 'next/navigation';

const tabRedirects: Record<string, string> = {
    profile: '/admin/profile',
    projects: '/admin/projects',
    carousel: '/admin/carousel',
    experience: '/admin/experience',
    skills: '/admin/skills',
    socials: '/admin/socials',
    messages: '/admin/messages',
};

type AdminDashboardRedirectProps = {
    searchParams?: { tab?: string };
};

export default function AdminDashboardRedirect({ searchParams }: AdminDashboardRedirectProps) {
    const tab = searchParams?.tab;
    const target = (tab && tabRedirects[tab]) || '/admin/profile';
    redirect(target);
}
