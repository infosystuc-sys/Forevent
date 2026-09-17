import { Suspense } from "react";
import InternalNav from "~/app/_components/internal/nav";
import { Icons } from "~/app/_components/ui/icons";
import { requireStaff } from "~/lib/staff";


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Web administrativa: exclusiva del Super Usuario (PDF §7).
  await requireStaff();

  return (
    <div className="flex-1">
      <Suspense fallback={<div className="flex items-center justify-center  h-screen">
        <Icons.spinner className="mr-2 h-10 w-10 animate-spin" />
      </div>}>
        <InternalNav options={{ logo: true, nav: true, menu: true, selector: true }} />
        <div className="py-6">
          {children}
        </div>
      </Suspense>
    </div>
  );
}

