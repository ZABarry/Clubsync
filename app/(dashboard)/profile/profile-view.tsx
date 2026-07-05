"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
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
  getChildForEdit,
  updateChild,
  upsertParentProfile,
} from "@/lib/actions/profiles";
import { deleteAccount, exportUserData } from "@/lib/actions/account";
import { signOut } from "@/lib/actions/auth";
import { CHILD_INTEREST_OPTIONS } from "@/lib/clubs/child-interests";
import { CHILD_SEX_OPTIONS, type ChildSex } from "@/lib/clubs/child-sex";
import type { ChildSummary } from "@/lib/privacy/child-dto";
import {
  childProfileCreateSchema,
  childProfileSchema,
  parentProfileSchema,
} from "@/lib/validation/schemas";

type ParentFormValues = z.infer<typeof parentProfileSchema>;
type ChildFormValues = z.infer<typeof childProfileSchema>;
type ChildCreateFormValues = z.infer<typeof childProfileCreateSchema>;

type ProfileViewProps = {
  userEmail: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  homePostcode: string | null;
  defaultSearchRadiusKm: number;
  children: ChildSummary[];
  showOnboarding: boolean;
  showAddChild: boolean;
  redirectTo?: string;
};

function formatDateInput(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function ProfileView({
  userEmail,
  displayName,
  firstName,
  lastName,
  homePostcode,
  defaultSearchRadiusKm,
  children: initialChildren,
  showOnboarding,
  showAddChild,
  redirectTo,
}: ProfileViewProps) {
  const router = useRouter();
  const [childDialogOpen, setChildDialogOpen] = useState(showAddChild);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [childDataConsent, setChildDataConsent] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
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

  const openChildDialog = async (child?: ChildSummary) => {
    if (child) {
      setEditingChildId(child.id);
      setChildDataConsent(true);
      const fullChild = await getChildForEdit(child.id);
      if (!fullChild) {
        toast.error("Child not found");
        return;
      }
      childForm.reset({
        nickname: fullChild.nickname,
        age: fullChild.age,
        sex: fullChild.sex ?? (undefined as unknown as ChildSex),
        schoolYear: fullChild.schoolYear ?? "",
        interests: fullChild.interests,
        availabilityStart: formatDateInput(fullChild.availabilityStart),
        availabilityEnd: formatDateInput(fullChild.availabilityEnd),
        notes: fullChild.notes ?? "",
      });
    } else {
      setEditingChildId(null);
      setChildDataConsent(false);
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
        if (redirectTo && redirectTo !== "/profile") {
          router.push(redirectTo);
        }
      } catch {
        toast.error("Failed to save profile");
      }
    });
  });

  const onChildSubmit = childForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (editingChildId) {
          await updateChild(editingChildId, values);
          toast.success("Child updated");
        } else {
          if (!childDataConsent) {
            toast.error("Please confirm consent to store your child's information");
            return;
          }
          const createValues: ChildCreateFormValues = {
            ...values,
            childDataConsent: true,
          };
          childProfileCreateSchema.parse(createValues);
          await createChild(createValues);
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
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/profile?onboarding=true">Set up profile</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/profile?addChild=true">Add child</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/friends">Invite friends</Link>
            </Button>
          </CardContent>
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
            <DialogContent className="max-h-[85dvh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingChildId ? "Edit child" : "Add child"}
                </DialogTitle>
              </DialogHeader>
              {!editingChildId ? (
                <p className="text-muted-foreground text-sm">
                  We store your child&apos;s nickname, age, interests and optional
                  notes to help plan clubs. This information is kept private unless
                  you join shared clubs or connect with trusted friends, where only
                  nickname and age may be visible to other parents.
                </p>
              ) : null}
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
                        <div
                          role="radiogroup"
                          aria-label="Child sex"
                          className="flex flex-wrap gap-2"
                        >
                          {CHILD_SEX_OPTIONS.map(({ value, label }) => (
                            <Button
                              key={value}
                              type="button"
                              size="sm"
                              role="radio"
                              aria-checked={field.value === value}
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
                    <FormLabel id="child-interests-label">Interests</FormLabel>
                    <div
                      role="group"
                      aria-labelledby="child-interests-label"
                      className="flex flex-wrap gap-2"
                    >
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
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={childForm.control}
                      name="availabilityStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available from</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={childForm.control}
                      name="availabilityEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available until</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
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
                  {!editingChildId ? (
                    <label className="flex items-start gap-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={childDataConsent}
                        onChange={(event) =>
                          setChildDataConsent(event.target.checked)
                        }
                      />
                      <span>
                        I confirm I am this child&apos;s parent or guardian and
                        consent to ClubZer storing this information to plan clubs.
                      </span>
                    </label>
                  ) : null}
                  <Button type="submit" disabled={pending} className="w-full">
                    {editingChildId ? "Update child" : "Add child"}
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

      <Card>
        <CardHeader>
          <CardTitle>Your data</CardTitle>
          <CardDescription>
            Export or permanently delete your account and associated data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              startTransition(async () => {
                try {
                  const data = await exportUserData();
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `clubzer-data-export-${new Date().toISOString().slice(0, 10)}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                  toast.success("Data export downloaded");
                } catch {
                  toast.error("Failed to export data");
                }
              });
            }}
          >
            Download my data
          </Button>
          <div className="space-y-2 border-t pt-4">
            <p className="text-muted-foreground text-sm">
              Deleting your account permanently removes your profile, children,
              plans, and friend connections. This cannot be undone.
            </p>
            <Input
              type="email"
              aria-label={`Type ${userEmail} to confirm account deletion`}
              placeholder={`Type ${userEmail} to confirm`}
              value={deleteEmail}
              onChange={(event) => setDeleteEmail(event.target.value)}
            />
            <Button
              type="button"
              variant="destructive"
              disabled={pending || deleteEmail !== userEmail}
              onClick={() => {
                startTransition(async () => {
                  try {
                    await deleteAccount({ confirmEmail: deleteEmail });
                  } catch {
                    toast.error("Failed to delete account");
                  }
                });
              }}
            >
              Delete account
            </Button>
          </div>
        </CardContent>
      </Card>

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
