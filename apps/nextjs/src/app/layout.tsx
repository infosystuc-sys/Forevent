import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";

import { cn } from "@forevent/ui";
import { ThemeProvider, ThemeToggle } from "@forevent/ui/theme";
import { Toaster } from "@forevent/ui/toast";

import { getSiteUrl } from "~/lib/site-url";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";
import AuthProvider from "./_components/auth/provider";

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  // Derivada del entorno (AUTH_URL / NEXT_PUBLIC_BASE_URL / VERCEL_URL): foreventapp.com
  // no está registrado, así que no se hardcodea ningún dominio acá.
  metadataBase: new URL(getSiteUrl()),
  title: "Forevent",
  description: "Events, parties, and more. Find the best events in your city.",
  openGraph: {
    title: "Forevent",
    description: "Events, parties, and more. Find the best events in your city.",
    url: getSiteUrl(),
    siteName: "Forevent",
  },
  twitter: {
    card: "summary_large_image",
    site: "@foreventapp",
    creator: "@foreventapp",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          poppins.className
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
          <TRPCReactProvider>
            {props.children}
            </TRPCReactProvider>
          <div className="fixed bottom-4 right-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
