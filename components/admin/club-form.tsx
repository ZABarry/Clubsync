"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm, type Resolver } from "react-hook-form";
import type { z } from "zod";

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

type ClubFormProps = {
  providers: { id: string; name: string }[];
  defaultValues?: Partial<z.infer<typeof clubSchema>>;
  onSubmit: (values: z.infer<typeof clubSchema>) => void | Promise<void>;
  loading?: boolean;
  submitLabel?: string;
  className?: string;
};

type FormValues = z.infer<typeof clubSchema>;

export function ClubForm({
  providers,
  defaultValues,
  onSubmit,
  loading = false,
  submitLabel = "Save club",
  className,
}: ClubFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(clubSchema) as Resolver<FormValues>,
    defaultValues: {
      providerId: "",
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
      bookingUrl: "",
      imageUrl: "",
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

  const handleSubmit = form.handleSubmit(async (values) => {
    const isExistingClub = Boolean(defaultValues?.name?.trim());

    if (!postcode.trim() && !isExistingClub) {
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

    await onSubmit({
      ...values,
      ...resolved,
      activities: parseActivitiesInput(activitiesInput),
    });
  });

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className={cn("space-y-6 rounded-xl border bg-card p-6", className)}
      >
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
                    min={3}
                    max={18}
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
                    min={3}
                    max={18}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField
            control={form.control}
            name="dailyStartTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily start</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dailyEndTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily end</FormLabel>
                <FormControl>
                  <Input type="time" {...field} value={field.value ?? ""} />
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
                    min={0}
                    step={0.01}
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
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (£)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
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

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Image URL</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} type="url" />
              </FormControl>
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

        <Button type="submit" disabled={loading || geocoding}>
          {loading || geocoding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : null}
          {submitLabel}
        </Button>
      </form>
    </Form>
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
