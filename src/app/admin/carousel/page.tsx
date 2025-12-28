import AdminShell from '@/components/admin/AdminShell';
import CarouselList from '@/components/admin/carousel/CarouselList';

export default function AdminCarouselPage() {
    return (
        <AdminShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-400 bg-clip-text text-transparent">
                        Carousel Projects
                    </h1>
                    <p className="text-default-500">Manage your featured carousel projects</p>
                </div>
                <CarouselList />
            </div>
        </AdminShell>
    );
}
