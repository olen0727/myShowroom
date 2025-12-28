'use client';

import AdminShell from '@/components/admin/AdminShell';
import ProjectEditor from '@/components/admin/projects/ProjectEditor';
import { useRouter } from 'next/navigation';

export default function NewProjectPage() {
    const router = useRouter();

    return (
        <AdminShell>
            <ProjectEditor
                onSave={(savedProject) => router.replace(`/admin/projects/${savedProject.id}`)}
                onCancel={() => router.push('/admin/projects')}
                standalone
            />
        </AdminShell>
    );
}
