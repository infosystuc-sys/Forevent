import Link from "next/link";

import { Button } from "@forevent/ui/button";

const navItems = [
  { label: "Inicio", href: "/admin" },
  { label: "Eventos", href: "/admin#eventos" },
  { label: "Finanzas", href: "/admin#finanzas" },
  { label: "Configuración", href: "/admin#configuracion" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="hidden w-64 shrink-0 border-r bg-card/40 md:flex md:flex-col">
        <div className="flex items-center gap-2 border-b px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            F
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Forevent</p>
            <p className="text-xs text-muted-foreground">Admin Dashboard</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-2 px-4 py-6">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="justify-start"
              asChild
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
        <div className="border-t px-6 py-4 text-xs text-muted-foreground">
          Monitoreo y control de eventos
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b bg-card/40 px-4 py-4 md:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {navItems.map((item) => (
              <Button key={item.label} variant="secondary" size="sm" asChild>
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-10 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
