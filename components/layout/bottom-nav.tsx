"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NavMoreSheet } from "@/components/layout/nav-more-sheet";
import {
  isNavItemActive,
  PRIMARY_NAV_ITEMS,
} from "@/lib/navigation/nav-config";
import { cn } from "@/lib/utils";

type BottomNavProps = {
  showAdmin?: boolean;
};

export function BottomNav({ showAdmin = false }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      aria-label="Main navigation"
    >
      <ul className="flex items-stretch justify-around px-1 pb-[env(safe-area-inset-bottom)]">
        {PRIMARY_NAV_ITEMS.map((item) => {
          const isActive = isNavItemActive(pathname, item);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className={cn("size-5", isActive && "stroke-[2.5]")} aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex-1">
          <NavMoreSheet showAdmin={showAdmin} />
        </li>
      </ul>
    </nav>
  );
}
