import {
  Building2,
  ClipboardList,
  FileEdit,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import {
  getAdminClubs,
  getPendingChangeRequests,
  getPendingRatings,
} from "@/lib/actions/admin";
import { getPendingClubReviews } from "@/lib/actions/club-management";
import { syncUser } from "@/lib/auth/server";
import { isMasterAdminRole } from "@/lib/auth/roles";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const BASE_SECTIONS = [
  {
    href: "/admin/clubs",
    title: "Clubs",
    description: "Create and manage club listings",
    icon: MapPin,
  },
  {
    href: "/admin/reviews",
    title: "Reviews",
    description: "Approve community club submissions",
    icon: ClipboardList,
  },
  {
    href: "/admin/providers",
    title: "Providers",
    description: "Manage club providers",
    icon: Building2,
  },
  {
    href: "/admin/change-requests",
    title: "Change requests",
    description: "Review suggested club updates",
    icon: FileEdit,
  },
  {
    href: "/admin/ratings",
    title: "Ratings",
    description: "Moderate user ratings and reviews",
    icon: Star,
  },
];

const USERS_SECTION = {
  href: "/admin/users",
  title: "Users",
  description: "Manage users and reviewer roles",
  icon: Users,
};

export default async function AdminDashboardPage() {
  const user = await syncUser();
  const [clubs, reviews, changeRequests, ratings] = await Promise.all([
    getAdminClubs(),
    getPendingClubReviews(),
    getPendingChangeRequests(),
    getPendingRatings(),
  ]);

  const pendingTotal =
    reviews.length + changeRequests.length + ratings.length;

  const sections = isMasterAdminRole(user!.role)
    ? [...BASE_SECTIONS, USERS_SECTION]
    : BASE_SECTIONS;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin dashboard"
        description={`${clubs.length} clubs · ${pendingTotal} items pending review`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Icon className="text-primary size-5" />
                    <CardTitle className="text-base">{section.title}</CardTitle>
                  </div>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
