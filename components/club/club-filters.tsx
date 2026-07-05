"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clubFilterSchema } from "@/lib/validation/schemas";
import type { ClubFilterValues } from "@/lib/types/club";
import { cn } from "@/lib/utils";

type ClubFiltersProps = {
  defaultValues?: ClubFilterValues;
  onChange?: (values: ClubFilterValues) => void;
  onSubmit?: (values: ClubFilterValues) => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
  embedded?: boolean;
  showSearch?: boolean;
  formId?: string;
  className?: string;
};

export function countActiveFilters(
  values?: ClubFilterValues,
  options?: { excludeSearch?: boolean },
): number {
  if (!values) return 0;

  let count = 0;
  if (!options?.excludeSearch && values.search?.trim()) count++;
  if (values.age != null) count++;
  if (values.activity?.trim()) count++;
  if (values.startDate?.trim()) count++;
  if (values.endDate?.trim()) count++;
  if (values.maxPrice != null) count++;
  if (values.minRating != null) count++;
  if (values.maxDistanceKm != null) count++;
  if (values.friendsOnly) count++;
  if (values.indoor) count++;
  if (values.outdoor) count++;
  return count;
}

type FilterFormValues = z.infer<typeof clubFilterSchema>;

export function ClubFilters({
  defaultValues,
  onChange,
  onSubmit,
  collapsible = false,
  defaultOpen = false,
  embedded = false,
  showSearch = true,
  formId,
  className,
}: ClubFiltersProps) {
  const [open, setOpen] = useState(
    defaultOpen || countActiveFilters(defaultValues) > 0,
  );
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(clubFilterSchema) as Resolver<FilterFormValues>,
    defaultValues: {
      search: "",
      age: undefined,
      activity: "",
      startDate: "",
      endDate: "",
      maxPrice: undefined,
      minRating: undefined,
      maxDistanceKm: undefined,
      friendsOnly: false,
      indoor: false,
      outdoor: false,
      ...defaultValues,
    },
  });

  const watched = form.watch();
  const lastEmitted = useRef<string>("");

  useEffect(() => {
    if (!onChange) return;
    const snapshot = JSON.stringify(watched);
    if (snapshot === lastEmitted.current) return;
    lastEmitted.current = snapshot;
    onChange(watched);
  }, [onChange, watched]);

  useEffect(() => {
    form.reset({
      search: "",
      age: undefined,
      activity: "",
      startDate: "",
      endDate: "",
      maxPrice: undefined,
      minRating: undefined,
      maxDistanceKm: undefined,
      friendsOnly: false,
      indoor: false,
      outdoor: false,
      ...defaultValues,
    });
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit?.(values);
  });

  const emptyValues: FilterFormValues = {
    search: "",
    age: undefined,
    activity: "",
    startDate: "",
    endDate: "",
    maxPrice: undefined,
    minRating: undefined,
    maxDistanceKm: undefined,
    friendsOnly: false,
    indoor: false,
    outdoor: false,
  };

  const handleReset = () => {
    form.reset(emptyValues);
    onSubmit?.(emptyValues);
  };

  const filterForm = (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn(
        "space-y-4",
        !embedded && "p-4",
        collapsible && !embedded && "border-t",
        collapsible && !embedded && !open && "hidden",
      )}
    >
      {showSearch ? (
        <FormField
          control={form.control}
          name="search"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Filter all clubs</FormLabel>
              <FormControl>
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Name, activity, or provider…"
                    className="pl-9"
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Child age</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={3}
                    max={18}
                    placeholder="e.g. 8"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="activity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Activity</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="e.g. football"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max price (£)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="e.g. 200"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min rating</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    step={0.5}
                    placeholder="e.g. 4"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />

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
                    placeholder="e.g. 10"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : undefined,
                      )
                    }
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>From</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>To</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value ?? ""} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <ToggleField
            id="indoor"
            label="Indoor"
            checked={!!watched.indoor}
            onChange={(checked) => form.setValue("indoor", checked)}
          />
          <ToggleField
            id="outdoor"
            label="Outdoor"
            checked={!!watched.outdoor}
            onChange={(checked) => form.setValue("outdoor", checked)}
          />
          <ToggleField
            id="friendsOnly"
            label="Friends only"
            checked={!!watched.friendsOnly}
            onChange={(checked) => form.setValue("friendsOnly", checked)}
          />
        </div>

        {!embedded ? (
          <div className="flex gap-2">
            <Button type="submit">Apply filters</Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
          </div>
        ) : null}
    </form>
  );

  if (embedded) {
    return <Form {...form}>{filterForm}</Form>;
  }

  return (
    <Form {...form}>
      <div className={cn("rounded-xl border bg-card", className)}>
        {collapsible ? (
          <button
            type="button"
            className="flex w-full items-center justify-between gap-3 p-4 text-left"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">Filters</p>
              <p className="text-muted-foreground text-xs">
                {countActiveFilters(defaultValues) > 0
                  ? `${countActiveFilters(defaultValues)} active`
                  : "Age, activity, dates, and more"}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "text-muted-foreground size-4 shrink-0 transition-transform",
                open && "rotate-180",
              )}
            />
          </button>
        ) : null}
        {filterForm}
      </div>
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
