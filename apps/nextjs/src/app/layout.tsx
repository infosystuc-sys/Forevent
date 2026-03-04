import type { Metadata, Viewport } from "next";
import { Montserrat, Poppins } from "next/font/google";

import { cn } from "@forevent/ui";
import { ThemeProvider, ThemeToggle } from "@forevent/ui/theme";
import { Toaster } from "@forevent/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/globals.css";
import AuthProvider from "./_components/auth/provider";

const montserrat = Montserrat({
  weight: ['100','200','300','400','500','600','700','800','900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  display: 'swap',
})

const poppins = Poppins({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://dashboard.foreventapp.com"
      : "http://localhost:3000",
  ),
  title: "Forevent",
  description: "Events, parties, and more. Find the best events in your city.",
  openGraph: {
    title: "Forevent",
    description: "Events, parties, and more. Find the best events in your city.",
    url: "https://foreventapp.com",
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
