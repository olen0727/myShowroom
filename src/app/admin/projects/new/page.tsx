'use client';

import AdminShell from '@/components/admin/AdminShell';
import ProjectEditor from '@/components/admin/projects/ProjectEditor';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
    const router = useRouter();

    return (
        <AdminShell>
            <ProjectEditor
                onSave={() => router.push('/admin/projects')}
                onCancel={() => router.push('/admin/projects')}
                standalone
            />
        </AdminShell>
    );
}
