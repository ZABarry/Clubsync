import { BottomNav } from "@/components/layout/bottom-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { Sidebar } from "@/components/layout/sidebar";

type AppShellProps = {
  children: React.ReactNode;
  showAdmin?: boolean;
  notifications?: Array<{
    id: string;
    title: string;
    body: string | null;
    link: string | null;
    readAt: Date | null;
    createdAt: Date;
  }>;
  unreadCount?: number;
};

export function AppShell({
  children,
  showAdmin = false,
  notifications = [],
  unreadCount = 0,
}: AppShellProps) {
  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-md"
      >
        Skip to main content
      </a>
      <Sidebar showAdmin={showAdmin} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-end border-b px-4 py-2 md:flex md:px-8">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
          />
        </header>
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 md:pb-8"
        >
          {children}
        </main>
        <BottomNav showAdmin={showAdmin} />
      </div>
    </div>
  );
}
