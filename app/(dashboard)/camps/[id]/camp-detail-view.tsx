"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { CampDetail } from "@/components/camp/camp-detail";
import { FriendActivityList } from "@/components/camp/friend-activity-list";
import { SharedCampSection } from "@/components/camp/shared-camp-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { submitRating } from "@/lib/actions/ratings";
import { createSharedCamp } from "@/lib/actions/shared-camps";
import { submitChangeRequest } from "@/lib/actions/submissions";
import { upsertPlannedCamp } from "@/lib/actions/planned-camps";
import type { FriendCampActivity } from "@/lib/privacy/friend-visibility";
import type { CampDetailData, PlannedCampStatus } from "@/lib/types/camp";
import {
  changeRequestSchema,
  ratingSchema,
  sharedCampSchema,
} from "@/lib/validation/schemas";

type Rating = {
  id: string;
  rating: number;
  reviewText: string | null;
  moderationStatus: string;
  parent: { displayName: string };
};

type CampDetailViewProps = {
  camp: CampDetailData;
  plannedStatus: PlannedCampStatus | null;
  ratings: Rating[];
  friendActivity: FriendCampActivity[];
  sharedCamps: Array<{
    id: string;
    title: string;
    createdBy: { displayName: string };
    participants: Array<{ parent: { id: string; displayName: string } }>;
    _count: { participants: number };
  }>;
  currentParentId: string | null;
};

const CHANGE_FIELDS = [
  { value: "name", label: "Camp name" },
  { value: "description", label: "Description" },
  { value: "price", label: "Price" },
  { value: "bookingUrl", label: "Booking URL" },
  { value: "locationName", label: "Location" },
];

export function CampDetailView({
  camp,
  plannedStatus,
  ratings,
  friendActivity,
  sharedCamps,
  currentParentId,
}: CampDetailViewProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [shareOpen, setShareOpen] = useState(false);

  const ratingForm = useForm<z.infer<typeof ratingSchema>>({
    resolver: zodResolver(ratingSchema) as Resolver<z.infer<typeof ratingSchema>>,
    defaultValues: { campId: camp.id, rating: 5, reviewText: "" },
  });

  const changeForm = useForm<z.infer<typeof changeRequestSchema>>({
    resolver: zodResolver(changeRequestSchema) as Resolver<
      z.infer<typeof changeRequestSchema>
    >,
    defaultValues: {
      campId: camp.id,
      fieldName: "description",
      suggestedValue: "",
      notes: "",
    },
  });

  const shareForm = useForm<z.infer<typeof sharedCampSchema>>({
    resolver: zodResolver(sharedCampSchema) as Resolver<
      z.infer<typeof sharedCampSchema>
    >,
    defaultValues: {
      campId: camp.id,
      title: camp.name,
      notes: "",
    },
  });

  const handleStatusChange = (status: PlannedCampStatus) => {
    startTransition(async () => {
      try {
        await upsertPlannedCamp({ campId: camp.id, status });
        toast.success("Status updated");
        router.refresh();
      } catch {
        toast.error("Failed to update status");
      }
    });
  };

  const onRatingSubmit = ratingForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await submitRating(values);
        toast.success("Rating submitted for review");
        ratingForm.reset({ campId: camp.id, rating: 5, reviewText: "" });
        router.refresh();
      } catch {
        toast.error("Failed to submit rating");
      }
    });
  });

  const onChangeSubmit = changeForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await submitChangeRequest(values);
        toast.success("Change request submitted");
        changeForm.reset({
          campId: camp.id,
          fieldName: "description",
          suggestedValue: "",
          notes: "",
        });
        router.refresh();
      } catch {
        toast.error("Failed to submit change request");
      }
    });
  });

  const onShareSubmit = shareForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        const shared = await createSharedCamp(values);
        toast.success("Shared camp created");
        setShareOpen(false);
        router.push(`/shared-camps/${shared.id}`);
      } catch {
        toast.error("Failed to create shared camp");
      }
    });
  });

  return (
    <div className="space-y-8">
      <CampDetail
        camp={camp}
        plannedStatus={plannedStatus}
        onStatusChange={handleStatusChange}
        statusControlsDisabled={pending}
      />

      <div className="flex flex-wrap gap-2">
        <Dialog open={shareOpen} onOpenChange={setShareOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Users className="size-4" />
              Share with friends
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create shared camp</DialogTitle>
            </DialogHeader>
            <Form {...shareForm}>
              <form onSubmit={onShareSubmit} className="space-y-4">
                <FormField
                  control={shareForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={shareForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={pending} className="w-full">
                  Create shared camp
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {currentParentId ? (
        <SharedCampSection
          sharedCamps={sharedCamps}
          currentParentId={currentParentId}
        />
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Ratings</h2>
        {ratings.length === 0 ? (
          <Card className="py-6">
            <CardContent className="text-muted-foreground text-center text-sm">
              No ratings yet. Be the first to review this camp.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {ratings.map((r) => (
              <li key={r.id}>
                <Card className="py-4">
                  <CardHeader className="px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">
                        {r.parent.displayName}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-sm">
                          <Star className="size-4 fill-amber-400 text-amber-400" />
                          {r.rating}
                        </span>
                        {r.moderationStatus === "PENDING" ? (
                          <Badge variant="secondary">Pending review</Badge>
                        ) : null}
                      </div>
                    </div>
                    {r.reviewText ? (
                      <CardDescription className="mt-2">
                        {r.reviewText}
                      </CardDescription>
                    ) : null}
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Leave a rating</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...ratingForm}>
              <form onSubmit={onRatingSubmit} className="space-y-4">
                <FormField
                  control={ratingForm.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rating (1–5)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={5}
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={ratingForm.control}
                  name="reviewText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Review</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={pending}>
                  {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                  Submit rating
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Friend activity</h2>
        <FriendActivityList
          activities={friendActivity}
          emptyMessage="No friends have planned this camp yet."
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Suggest a change</h2>
        <Card>
          <CardContent className="pt-6">
            <Form {...changeForm}>
              <form onSubmit={onChangeSubmit} className="space-y-4">
                <FormField
                  control={changeForm.control}
                  name="fieldName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CHANGE_FIELDS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={changeForm.control}
                  name="suggestedValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suggested value</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={changeForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={pending}>
                  Submit change request
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      <Button variant="ghost" asChild>
        <Link href="/discover">← Back to discover</Link>
      </Button>
    </div>
  );
}
