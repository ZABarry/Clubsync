"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
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
import { ChildProfileCard } from "@/components/profile/child-profile-card";
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
import { CHILD_INTEREST_OPTIONS } from "@/lib/clubs/child-interests";
import { CHILD_SEX_OPTIONS, type ChildSex } from "@/lib/clubs/child-sex";
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
  sex: "MALE" | "FEMALE" | null;
  schoolYear: string | null;
  interests: string[];
  availabilityStart: Date | null;
  availabilityEnd: Date | null;
  notes: string | null;
};

type ProfileViewProps = {
  displayName: string;
  firstName: string | null;
  lastName: string | null;
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
  firstName,
  lastName,
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
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      homePostcode: homePostcode ?? "",
      defaultSearchRadiusKm,
    },
  });

  const childForm = useForm<ChildFormValues>({
    resolver: zodResolver(childProfileSchema) as Resolver<ChildFormValues>,
    defaultValues: {
      nickname: "",
      age: 8,
      sex: undefined as unknown as ChildSex,
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
        sex: child.sex ?? (undefined as unknown as ChildSex),
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
        sex: undefined as unknown as ChildSex,
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

  return (
    <div className="space-y-8">
      {showOnboarding ? (
        <Card className="border-primary/30 bg-accent/30">
          <CardHeader>
            <CardTitle className="text-base">Welcome to ClubZer!</CardTitle>
            <CardDescription>
              Add your children and invite trusted parent friends to discover
              and share clubs together.
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
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={parentForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              Add children to plan clubs for each of them
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
                  <FormField
                    control={childForm.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sex</FormLabel>
                        <div className="flex flex-wrap gap-2">
                          {CHILD_SEX_OPTIONS.map(({ value, label }) => (
                            <Button
                              key={value}
                              type="button"
                              size="sm"
                              variant={
                                field.value === value ? "default" : "outline"
                              }
                              onClick={() => field.onChange(value)}
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <FormLabel>Interests</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {CHILD_INTEREST_OPTIONS.map(({ value, label }) => {
                        const selected =
                          childForm.watch("interests").includes(value);
                        return (
                          <Button
                            key={value}
                            type="button"
                            size="sm"
                            variant={selected ? "default" : "outline"}
                            onClick={() => {
                              const current = childForm.getValues("interests");
                              childForm.setValue(
                                "interests",
                                selected
                                  ? current.filter((i) => i !== value)
                                  : [...current, value],
                              );
                            }}
                          >
                            {label}
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
              No children added yet. Add a child to start planning clubs.
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {initialChildren.map((child) => (
              <li key={child.id}>
                <ChildProfileCard
                  child={child}
                  onEdit={() => openChildDialog(child)}
                  onDelete={() => handleDeleteChild(child.id)}
                  disabled={pending}
                />
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
