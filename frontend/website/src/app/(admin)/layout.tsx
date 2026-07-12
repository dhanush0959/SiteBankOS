import { AdminHeader } from '@/components/shared/admin-header';
import { AdminGate } from '@/components/shared/admin-gate';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div className="flex flex-col min-h-screen bg-slate-50">
        <AdminHeader />
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </AdminGate>
  );
}
