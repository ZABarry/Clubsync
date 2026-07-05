"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  Compass,
  Home,
  MapPin,
  Shield,
  User,
  Users,
} from "lucide-react";

import { ClubZerLogo } from "@/components/brand/clubzer-logo";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/my-clubs", label: "Community clubs", icon: MapPin },
];

const ADMIN_ITEM: NavItem = {
  href: "/admin",
  label: "Admin",
  icon: Shield,
};

type SidebarProps = {
  showAdmin?: boolean;
};

export function Sidebar({ showAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const items = showAdmin ? [...NAV_ITEMS, ADMIN_ITEM] : NAV_ITEMS;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <Link href="/">
          <ClubZerLogo size="md" />
        </Link>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Main navigation">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
