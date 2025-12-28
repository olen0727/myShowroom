import AdminShell from '@/components/admin/AdminShell';
import ProjectsTab from '@/components/admin/ProjectsTab';

type PageProps = {
    params: {
        id: string;
    };
};

export default function AdminProjectEditorPage({ params }: PageProps) {
    return (
        <AdminShell>
            <ProjectsTab standalone initialProjectId={params.id} />
        </AdminShell>
    );
}
