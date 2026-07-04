"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useEffect } from "react";
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
import { campFilterSchema } from "@/lib/validation/schemas";
import type { CampFilterValues } from "@/lib/types/camp";
import { cn } from "@/lib/utils";

type CampFiltersProps = {
  defaultValues?: CampFilterValues;
  onChange?: (values: CampFilterValues) => void;
  onSubmit?: (values: CampFilterValues) => void;
  className?: string;
};

type FilterFormValues = z.infer<typeof campFilterSchema>;

export function CampFilters({
  defaultValues,
  onChange,
  onSubmit,
  className,
}: CampFiltersProps) {
  const form = useForm<FilterFormValues>({
    resolver: zodResolver(campFilterSchema) as Resolver<FilterFormValues>,
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

  useEffect(() => {
    onChange?.(watched);
  }, [onChange, watched]);

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit?.(values);
  });

  const handleReset = () => {
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
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit}
        className={cn("space-y-4 rounded-xl border bg-card p-4", className)}
      >
        <FormField
          control={form.control}
          name="search"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Search</FormLabel>
              <FormControl>
                <div className="relative">
                  <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Camp name or activity..."
                    className="pl-9"
                  />
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        <div className="flex gap-2">
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
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
