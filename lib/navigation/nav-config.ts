import {
  Bell,
  Calendar,
  Compass,
  Home,
  MapPin,
  Shield,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Routes that should highlight this nav item (in addition to href prefix). */
  matchPaths?: string[];
};

export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  {
    href: "/discover",
    label: "Discover",
    icon: Compass,
    matchPaths: ["/clubs"],
  },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  {
    href: "/friends",
    label: "Friends",
    icon: Users,
    matchPaths: ["/shared-clubs"],
  },
];

export const MORE_NAV_ITEMS: NavItem[] = [
  { href: "/planner", label: "Smart planner", icon: Sparkles },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/my-clubs", label: "Community clubs", icon: MapPin },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export const ADMIN_NAV_ITEM: NavItem = {
  href: "/admin",
  label: "Admin",
  icon: Shield,
};

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/") {
    return pathname === "/";
  }

  if (pathname.startsWith(item.href)) {
    return true;
  }

  return (item.matchPaths ?? []).some((path) => pathname.startsWith(path));
}

export function isMoreNavActive(pathname: string): boolean {
  return MORE_NAV_ITEMS.some((item) => isNavItemActive(pathname, item));
}
