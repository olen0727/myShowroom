import AdminShell from '@/components/admin/AdminShell';
import ProjectList from '@/components/admin/projects/ProjectList';

export default function AdminProjectsPage() {
    return (
        <AdminShell>
            <ProjectList />
        </AdminShell>
    );
}
