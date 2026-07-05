import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { CLUBZER_COLORS, CLUBZER_TAGLINE } from "@/lib/brand";
import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ClubZer",
    template: "%s | ClubZer",
  },
  description: CLUBZER_TAGLINE,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClubZer",
  },
};

export const viewport: Viewport = {
  themeColor: CLUBZER_COLORS.theme,
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
