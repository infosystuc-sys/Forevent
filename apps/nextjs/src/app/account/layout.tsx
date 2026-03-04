import { auth } from '@forevent/auth';
import { redirect } from "next/navigation";
import { Suspense } from "react";
import AccountNav from "~/app/_components/account/nav";
import { Icons } from "~/app/_components/ui/icons";


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex-1">
      <Suspense fallback={<div className="flex items-center justify-center  h-screen"><Icons.spinner className="mr-2 h-10 w-10 animate-spin" /></div>}>
        <AccountNav />
      </Suspense>
      <div className="py-6">
        {children}
      </div>
    </div>
  );
}

