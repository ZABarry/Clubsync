import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { CLUBZER_TAGLINE } from "@/lib/brand";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ClubZer",
    template: "%s | ClubZer",
  },
  description: CLUBZER_TAGLINE,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClubZer",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF6B54",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          {children}
          <Toaster richColors position="top-center" closeButton />
        </QueryProvider>
      </body>
    </html>
  );
}
