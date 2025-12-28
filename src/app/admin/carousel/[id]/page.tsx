import AdminShell from '@/components/admin/AdminShell';
import CarouselTab from '@/components/admin/CarouselTab';

type PageProps = {
    params: {
        id: string;
    };
};

export default function AdminCarouselEditorPage({ params }: PageProps) {
    return (
        <AdminShell>
            <CarouselTab standalone initialProjectId={params.id} />
        </AdminShell>
    );
}
