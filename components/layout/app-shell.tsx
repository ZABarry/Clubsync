import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";

type AppShellProps = {
  children: React.ReactNode;
  showAdmin?: boolean;
};

export function AppShell({ children, showAdmin = false }: AppShellProps) {
  return (
    <div className="flex min-h-full flex-1">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-md"
      >
        Skip to main content
      </a>
      <Sidebar showAdmin={showAdmin} />
      <div className="flex min-h-full flex-1 flex-col">
        <main
          id="main-content"
          className="flex-1 overflow-auto px-4 py-6 pb-24 md:px-8 md:pb-8"
        >
          {children}
        </main>
        <BottomNav showAdmin={showAdmin} />
      </div>
    </div>
  );
}
