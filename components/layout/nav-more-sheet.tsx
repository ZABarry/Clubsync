"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ADMIN_NAV_ITEM,
  isNavItemActive,
  MORE_NAV_ITEMS,
  type NavItem,
} from "@/lib/navigation/nav-config";
import { cn } from "@/lib/utils";

type NavMoreSheetProps = {
  showAdmin?: boolean;
};

function NavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const isActive = isNavItemActive(pathname, item);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-accent text-accent-foreground"
          : "text-foreground/80 hover:bg-accent/60",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {item.label}
    </Link>
  );
}

export function NavMoreSheet({ showAdmin = false }: NavMoreSheetProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreActive = MORE_NAV_ITEMS.some((item) =>
    isNavItemActive(pathname, item),
  );
  const adminActive = showAdmin && isNavItemActive(pathname, ADMIN_NAV_ITEM);
  const isActive = moreActive || adminActive;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-current={isActive ? "page" : undefined}
          className={cn(
            "flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors",
            isActive
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Menu className={cn("size-5", isActive && "stroke-[2.5]")} aria-hidden />
          <span>More</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-xl pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle>More</SheetTitle>
        </SheetHeader>
        <nav className="mt-4 flex flex-col gap-1" aria-label="More navigation">
          {MORE_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          ))}
          {showAdmin ? (
            <NavLink
              item={ADMIN_NAV_ITEM}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
