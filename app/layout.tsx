import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";

import { QueryProvider } from "@/components/providers/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "ClubSync",
    template: "%s | ClubSync",
  },
  description:
    "Discover, plan and coordinate clubs and activities with trusted parent friends",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ClubSync",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f4c5c",
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
