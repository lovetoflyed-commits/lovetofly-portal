import StaffSidebar from '@/components/StaffSidebar';

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <StaffSidebar />
      <main className="flex-1 p-8 bg-gradient-to-b from-blue-50 to-white">
        {children}
      </main>
    </div>
  );
}
