import {
  Building2,
  ClipboardList,
  FileEdit,
  MapPin,
  Star,
} from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import {
  getAdminCamps,
  getPendingChangeRequests,
  getPendingRatings,
  getPendingSubmissions,
} from "@/lib/actions/admin";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SECTIONS = [
  {
    href: "/admin/camps",
    title: "Camps",
    description: "Create and manage camp listings",
    icon: MapPin,
  },
  {
    href: "/admin/providers",
    title: "Providers",
    description: "Manage camp providers",
    icon: Building2,
  },
  {
    href: "/admin/submissions",
    title: "Submissions",
    description: "Review new camp submissions",
    icon: ClipboardList,
  },
  {
    href: "/admin/change-requests",
    title: "Change requests",
    description: "Review suggested camp updates",
    icon: FileEdit,
  },
  {
    href: "/admin/ratings",
    title: "Ratings",
    description: "Moderate user ratings and reviews",
    icon: Star,
  },
];

export default async function AdminDashboardPage() {
  const [camps, submissions, changeRequests, ratings] = await Promise.all([
    getAdminCamps(),
    getPendingSubmissions(),
    getPendingChangeRequests(),
    getPendingRatings(),
  ]);

  const pendingTotal =
    submissions.length + changeRequests.length + ratings.length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Admin dashboard"
        description={`${camps.length} camps · ${pendingTotal} items pending review`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SECTIONS.map((section) => {
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
