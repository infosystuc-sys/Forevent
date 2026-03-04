import { auth } from "@forevent/auth";
import NavBar from "../_components/public/navbar/navbar";
import Footer from "../_components/public/footer";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth()
  return (
    <>
      <header>
        <div className="fixed w-full z-10">
          <NavBar session={session} />
        </div>
      </header>
      <main className="text-neutral-300 bg-black">
        {children}
      </main>
      {/* <footer>
          <Footer />
        </footer> */}
    </>
  );
}

{/*
bg-gradient-to-br from-indigo-950  via-gray-900 to-neutral-950
*/}