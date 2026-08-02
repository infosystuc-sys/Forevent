import { Suspense } from "react";
import AdminSidebarNav from "~/app/_components/admin/sidebar-nav";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <Suspense fallback={<div className="w-full border-b md:h-screen md:w-64 md:border-b-0 md:border-r" />}>
        <AdminSidebarNav />
      </Suspense>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8">
        {children}
      </main>
    </div>
  );
}
