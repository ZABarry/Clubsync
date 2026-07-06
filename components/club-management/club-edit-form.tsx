"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import type { z } from "zod";

import { ClubImageField } from "@/components/club-management/club-image-field";
import { ClubPostcodeField } from "@/components/club-management/club-postcode-field";
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
import { Textarea } from "@/components/ui/textarea";
import { resolveClubCoordinates } from "@/lib/clubs/resolve-club-coordinates";
import {
  formatActivitiesInput,
  parseActivitiesInput,
} from "@/lib/clubs/parse-activities-input";
import { clubSchema } from "@/lib/validation/schemas";
import { cn } from "@/lib/utils";

type ClubEditFormProps = {
  clubId?: string;
  providers: { id: string; name: string }[];
  defaultValues?: Partial<z.infer<typeof clubSchema>>;
  mode: "admin" | "personal";
  loading?: boolean;
  cancelHref: string;
  onSave: (values: z.infer<typeof clubSchema>) => void | Promise<void>;
  onSubmitForReview?: (submissionNote: string) => void | Promise<void>;
  promotionStatus?: string;
  reviewNote?: string | null;
};

type FormValues = z.infer<typeof clubSchema>;

export function ClubEditForm({
  clubId,
  providers,
  defaultValues,
  mode,
  loading = false,
  cancelHref,
  onSave,
  onSubmitForReview,
  promotionStatus,
  reviewNote,
}: ClubEditFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(clubSchema) as Resolver<FormValues>,
    defaultValues: {
      providerId: providers[0]?.id ?? "",
      name: "",
      description: "",
      locationName: "",
      address: "",
      latitude: 51.4545,
      longitude: -0.1945,
      activities: [],
      ageMin: 5,
      ageMax: 12,
      startDate: "",
      endDate: "",
      dailyStartTime: "",
      dailyEndTime: "",
      price: undefined,
      dailyRate: undefined,
      priceNote: "",
      bookingUrl: "",
      imageUrl: "",
      sourceUrl: "",
      dataConfidence: "",
      region: "SOUTH_WEST_LONDON",
      status: "ACTIVE",
      isIndoor: false,
      isOutdoor: true,
      sendFriendly: false,
      accessibilityNotes: "",
      ...defaultValues,
    },
  });

  const [activitiesInput, setActivitiesInput] = useState(() =>
    formatActivitiesInput(defaultValues?.activities ?? []),
  );
  const imageUrl = form.watch("imageUrl") ?? "";
  const [postcode, setPostcode] = useState("");
  const [postcodeError, setPostcodeError] = useState<string | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  useEffect(() => {
    setActivitiesInput(formatActivitiesInput(defaultValues?.activities ?? []));
  }, [defaultValues?.activities]);

  const syncActivitiesToForm = (value: string) => {
    form.setValue("activities", parseActivitiesInput(value), {
      shouldDirty: true,
    });
  };

  const handleActivitiesBlur = () => {
    const parsed = parseActivitiesInput(activitiesInput);
    form.setValue("activities", parsed, { shouldDirty: true });
    setActivitiesInput(formatActivitiesInput(parsed));
  };

  const canSubmitForReview =
    mode === "personal" &&
    onSubmitForReview &&
    (promotionStatus === "LOCAL" || promotionStatus === "DENIED");

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          if (!postcode.trim() && !clubId) {
            setPostcodeError("Enter a UK postcode to place the club on the map");
            return;
          }

          setGeocoding(true);
          setPostcodeError(null);
          const resolved = await resolveClubCoordinates(values, postcode);
          setGeocoding(false);

          if ("error" in resolved) {
            setPostcodeError(resolved.error);
            return;
          }

          await onSave({
            ...values,
            ...resolved,
            activities: parseActivitiesInput(activitiesInput),
          });
        })}
        className="space-y-6 rounded-xl border bg-card p-6"
      >
        {reviewNote ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="font-medium text-destructive">Review feedback</p>
            <p className="text-muted-foreground mt-1">{reviewNote}</p>
          </div>
        ) : null}

        {mode === "admin" ? (
          <FormField
            control={form.control}
            name="providerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provider</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {providers.map((provider) => (
                      <SelectItem key={provider.id} value={provider.id}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Club name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {mode === "admin" ? (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="locationName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <ClubPostcodeField
          value={postcode}
          onChange={(value) => {
            setPostcode(value);
            setPostcodeError(null);
          }}
          error={postcodeError}
        />

        <FormItem>
          <FormLabel>Activities (comma-separated)</FormLabel>
          <FormControl>
            <Input
              value={activitiesInput}
              onChange={(e) => {
                const value = e.target.value;
                setActivitiesInput(value);
                syncActivitiesToForm(value);
              }}
              onBlur={handleActivitiesBlur}
              placeholder="football, art, swimming"
            />
          </FormControl>
        </FormItem>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="ageMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
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
            name="ageMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
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
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
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
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (£)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
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
          <FormField
            control={form.control}
            name="dailyRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily rate (£)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
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
          <FormField
            control={form.control}
            name="bookingUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Booking URL</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="priceNote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price note</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="sourceUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source URL</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} type="url" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <ClubImageField
                clubId={clubId}
                imageUrl={imageUrl}
                onImageUrlChange={field.onChange}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="accessibilityNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Accessibility notes</FormLabel>
              <FormControl>
                <Textarea {...field} value={field.value ?? ""} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-4">
          <ToggleField
            id="isIndoor"
            label="Indoor"
            checked={form.watch("isIndoor")}
            onChange={(v) => form.setValue("isIndoor", v)}
          />
          <ToggleField
            id="isOutdoor"
            label="Outdoor"
            checked={form.watch("isOutdoor")}
            onChange={(v) => form.setValue("isOutdoor", v)}
          />
          <ToggleField
            id="sendFriendly"
            label="SEND friendly"
            checked={form.watch("sendFriendly")}
            onChange={(v) => form.setValue("sendFriendly", v)}
          />
        </div>

        <div className="flex flex-wrap gap-3 border-t pt-4">
          <Button type="submit" disabled={loading || geocoding}>
            {loading || geocoding ? (
              <Loader2 className="size-4 animate-spin" />
            ) : null}
            Save
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href={cancelHref}>Cancel</Link>
          </Button>
        </div>

        {canSubmitForReview ? (
          <SubmitForReviewSection
            loading={loading}
            onSubmit={(note) => onSubmitForReview!(note)}
          />
        ) : null}
      </form>
    </Form>
  );
}

function SubmitForReviewSection({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (note: string) => void | Promise<void>;
}) {
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <p className="text-sm font-medium">Submit for official review</p>
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Explain why this club should be added to the main list…"
        rows={3}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={loading || note.trim().length === 0}
        onClick={() => onSubmit(note.trim())}
      >
        Submit for review
      </Button>
    </div>
  );
}

function ToggleField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-input accent-primary"
      />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}
