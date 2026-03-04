import { Suspense } from "react";



export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-max h-full">
      <div className="absolute top-0 h-[30rem] w-screen bg-gradient-to-br from-amber-500 via-pink-500 to-violet-500" />
      <Suspense fallback="...">
        <div className="">
          {/* <Nav /> */}
        </div>
      </Suspense>
      <div className="min-h-screen w-full pt-28">
        {children}
      </div>
    </div>
  );
}
