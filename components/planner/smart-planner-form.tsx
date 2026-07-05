"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Sparkles } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChildOption, FriendOption } from "@/lib/types/club";
import { formatChildSex } from "@/lib/clubs/child-sex";
import { smartPlannerSchema } from "@/lib/validation/schemas";
import { CHILD_INTEREST_OPTIONS } from "@/lib/clubs/child-interests";
import { cn } from "@/lib/utils";

type SmartPlannerFormProps = {
  children: ChildOption[];
  friends?: FriendOption[];
  defaultValues?: Partial<z.infer<typeof smartPlannerSchema>>;
  onSubmit: (values: z.infer<typeof smartPlannerSchema>) => void | Promise<void>;
  loading?: boolean;
  className?: string;
};

type FormValues = z.infer<typeof smartPlannerSchema>;

export function SmartPlannerForm({
  children: childOptions,
  friends = [],
  defaultValues,
  onSubmit,
  loading = false,
  className,
}: SmartPlannerFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(smartPlannerSchema) as Resolver<FormValues>,
    defaultValues: {
      childProfileId: "",
      startDate: "",
      endDate: "",
      interests: [],
      maxDistanceKm: 10,
      budget: undefined,
      preferredFriendIds: [],
      ...defaultValues,
    },
  });

  const interests = form.watch("interests");
  const preferredFriendIds = form.watch("preferredFriendIds");

  const toggleInterest = (interest: string) => {
    const current = form.getValues("interests");
    if (current.includes(interest)) {
      form.setValue(
        "interests",
        current.filter((i) => i !== interest),
      );
    } else {
      form.setValue("interests", [...current, interest]);
    }
  };

  const toggleFriend = (friendId: string) => {
    const current = form.getValues("preferredFriendIds");
    if (current.includes(friendId)) {
      form.setValue(
        "preferredFriendIds",
        current.filter((id) => id !== friendId),
      );
    } else {
      form.setValue("preferredFriendIds", [...current, friendId]);
    }
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className={cn("space-y-6 rounded-xl border bg-card p-6", className)}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="text-primary size-5" />
          <h2 className="text-lg font-semibold">Smart planner</h2>
        </div>

        <FormField
          control={form.control}
          name="childProfileId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Child</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a child" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {childOptions.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.nickname} (age {child.age}
                      {formatChildSex(child.sex)
                        ? `, ${formatChildSex(child.sex)?.toLowerCase()}`
                        : ""}
                      )
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <Label>Interests</Label>
          <div className="flex flex-wrap gap-2">
            {CHILD_INTEREST_OPTIONS.map(({ value, label }) => {
              const selected = interests.includes(value);
              return (
                <Button
                  key={value}
                  type="button"
                  size="sm"
                  variant={selected ? "default" : "outline"}
                  onClick={() => toggleInterest(value)}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="maxDistanceKm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max distance (km)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Budget (£)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Optional"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {friends.length > 0 ? (
          <div className="space-y-2">
            <Label>Preferred friends</Label>
            <div className="flex flex-wrap gap-2">
              {friends.map((friend) => {
                const selected = preferredFriendIds.includes(friend.id);
                return (
                  <Button
                    key={friend.id}
                    type="button"
                    size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() => toggleFriend(friend.id)}
                  >
                    {friend.displayName}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : null}

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Find clubs
        </Button>
      </form>
    </Form>
  );
}
