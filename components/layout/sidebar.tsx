"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ClubZerLogo } from "@/components/brand/clubzer-logo";
import { SHELL_HEADER_ROW_CLASS } from "@/components/layout/shell-header";
import {
  ADMIN_NAV_ITEM,
  isNavItemActive,
  MORE_NAV_ITEMS,
  PRIMARY_NAV_ITEMS,
  type NavItem,
} from "@/lib/navigation/nav-config";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type SidebarProps = {
  showAdmin?: boolean;
};

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = isNavItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function Sidebar({ showAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r bg-sidebar text-sidebar-foreground md:flex">
      <div className={cn(SHELL_HEADER_ROW_CLASS, "gap-2 px-6")}>
        <Link href="/">
          <ClubZerLogo size="sm" />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Main navigation">
        {PRIMARY_NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
        <Separator className="my-2" />
        <p className="text-muted-foreground px-3 py-1 text-xs font-medium uppercase tracking-wide">
          More
        </p>
        {MORE_NAV_ITEMS.map((item) => (
          <SidebarLink key={item.href} item={item} pathname={pathname} />
        ))}
        {showAdmin ? (
          <SidebarLink item={ADMIN_NAV_ITEM} pathname={pathname} />
        ) : null}
      </nav>
    </aside>
  );
}
