"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

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
import { Textarea } from "@/components/ui/textarea";
import {
  createChild,
  deleteChild,
  updateChild,
  upsertParentProfile,
} from "@/lib/actions/profiles";
import { signOut } from "@/lib/actions/auth";
import {
  childProfileSchema,
  parentProfileSchema,
} from "@/lib/validation/schemas";

type ParentFormValues = z.infer<typeof parentProfileSchema>;
type ChildFormValues = z.infer<typeof childProfileSchema>;

type Child = {
  id: string;
  nickname: string;
  age: number;
  schoolYear: string | null;
  interests: string[];
  availabilityStart: Date | null;
  availabilityEnd: Date | null;
  notes: string | null;
};

type ProfileViewProps = {
  displayName: string;
  homePostcode: string | null;
  defaultSearchRadiusKm: number;
  children: Child[];
  showOnboarding: boolean;
  showAddChild: boolean;
};

function formatDateInput(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function ProfileView({
  displayName,
  homePostcode,
  defaultSearchRadiusKm,
  children: initialChildren,
  showOnboarding,
  showAddChild,
}: ProfileViewProps) {
  const router = useRouter();
  const [childDialogOpen, setChildDialogOpen] = useState(showAddChild);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [pending, startTransition] = useTransition();

  const parentForm = useForm<ParentFormValues>({
    resolver: zodResolver(parentProfileSchema) as Resolver<ParentFormValues>,
    defaultValues: {
      displayName,
      homePostcode: homePostcode ?? "",
      defaultSearchRadiusKm,
    },
  });

  const childForm = useForm<ChildFormValues>({
    resolver: zodResolver(childProfileSchema) as Resolver<ChildFormValues>,
    defaultValues: {
      nickname: "",
      age: 8,
      schoolYear: "",
      interests: [],
      availabilityStart: "",
      availabilityEnd: "",
      notes: "",
    },
  });

  const openChildDialog = (child?: Child) => {
    if (child) {
      setEditingChild(child);
      childForm.reset({
        nickname: child.nickname,
        age: child.age,
        schoolYear: child.schoolYear ?? "",
        interests: child.interests,
        availabilityStart: formatDateInput(child.availabilityStart),
        availabilityEnd: formatDateInput(child.availabilityEnd),
        notes: child.notes ?? "",
      });
    } else {
      setEditingChild(null);
      childForm.reset({
        nickname: "",
        age: 8,
        schoolYear: "",
        interests: [],
        availabilityStart: "",
        availabilityEnd: "",
        notes: "",
      });
    }
    setChildDialogOpen(true);
  };

  const onParentSubmit = parentForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        await upsertParentProfile(values);
        toast.success("Profile saved");
        router.refresh();
      } catch {
        toast.error("Failed to save profile");
      }
    });
  });

  const onChildSubmit = childForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (editingChild) {
          await updateChild(editingChild.id, values);
          toast.success("Child updated");
        } else {
          await createChild(values);
          toast.success("Child added");
        }
        setChildDialogOpen(false);
        router.refresh();
      } catch {
        toast.error("Failed to save child");
      }
    });
  });

  const handleDeleteChild = (childId: string) => {
    startTransition(async () => {
      try {
        await deleteChild(childId);
        toast.success("Child removed");
        router.refresh();
      } catch {
        toast.error("Failed to remove child");
      }
    });
  };

  const COMMON_INTERESTS = [
    "football",
    "art",
    "science",
    "drama",
    "swimming",
    "coding",
    "music",
    "nature",
  ];

  return (
    <div className="space-y-8">
      {showOnboarding ? (
        <Card className="border-primary/30 bg-accent/30">
          <CardHeader>
            <CardTitle className="text-base">Welcome to ClubSync!</CardTitle>
            <CardDescription>
              Complete your profile and add your children to start planning
              camps.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Parent profile</CardTitle>
          <CardDescription>Your details and search preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...parentForm}>
            <form onSubmit={onParentSubmit} className="space-y-4">
              <FormField
                control={parentForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={parentForm.control}
                  name="homePostcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Home postcode</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. SW19 1AA"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={parentForm.control}
                  name="defaultSearchRadiusKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Search radius (km)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={50}
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
              </div>
              <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                Save profile
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Children</h2>
            <p className="text-muted-foreground text-sm">
              Add children to plan camps for each of them
            </p>
          </div>
          <Dialog open={childDialogOpen} onOpenChange={setChildDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openChildDialog()}>
                <Plus className="size-4" />
                Add child
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingChild ? "Edit child" : "Add child"}
                </DialogTitle>
              </DialogHeader>
              <Form {...childForm}>
                <form onSubmit={onChildSubmit} className="space-y-4">
                  <FormField
                    control={childForm.control}
                    name="nickname"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nickname</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={childForm.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={3}
                              max={18}
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
                      control={childForm.control}
                      name="schoolYear"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>School year</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <FormLabel>Interests</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {COMMON_INTERESTS.map((interest) => {
                        const selected =
                          childForm.watch("interests").includes(interest);
                        return (
                          <Button
                            key={interest}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            onClick={() => {
                              const current = childForm.getValues("interests");
                              childForm.setValue(
                                "interests",
                                selected
                                  ? current.filter((i) => i !== interest)
                                  : [...current, interest],
                              );
                            }}
                          >
                            {interest}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                  <FormField
                    control={childForm.control}
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
                    {editingChild ? "Update child" : "Add child"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {initialChildren.length === 0 ? (
          <Card className="py-8">
            <CardContent className="text-muted-foreground text-center text-sm">
              No children added yet. Add a child to start planning camps.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {initialChildren.map((child) => (
              <li key={child.id}>
                <Card className="gap-3 py-4">
                  <CardHeader className="flex-row items-center justify-between space-y-0 px-4">
                    <div>
                      <CardTitle className="text-sm">
                        {child.nickname}
                      </CardTitle>
                      <CardDescription>
                        Age {child.age}
                        {child.schoolYear ? ` · ${child.schoolYear}` : ""}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openChildDialog(child)}
                        aria-label={`Edit ${child.nickname}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteChild(child.id)}
                        disabled={pending}
                        aria-label={`Delete ${child.nickname}`}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  {child.interests.length > 0 ? (
                    <CardContent className="px-4 text-sm text-muted-foreground">
                      Interests: {child.interests.join(", ")}
                    </CardContent>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="pt-4">
        <form action={signOut}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
