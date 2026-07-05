"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { z } from "zod";
import { geocodePostcode } from "@/lib/utils/geocode";
import type { clubManagementFilterSchema } from "@/lib/validation/schemas";

export type ClubManagementFilterValues = z.infer<
  typeof clubManagementFilterSchema
>;

type ClubManagementFiltersProps = {
  defaultPostcode?: string | null;
  activityTypes?: string[];
  showAdminFilters?: boolean;
  showDeletedToggle?: boolean;
  onApply: (filters: ClubManagementFilterValues) => void;
};

function formatActivityLabel(value: string) {
  return value
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ClubManagementFilters({
  defaultPostcode,
  activityTypes = [],
  showAdminFilters = false,
  showDeletedToggle = false,
  onApply,
}: ClubManagementFiltersProps) {
  const [search, setSearch] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState("");
  const [postcode, setPostcode] = useState(defaultPostcode ?? "");
  const [publication, setPublication] = useState<string>("all");
  const [promotionStatus, setPromotionStatus] = useState<string>("all");
  const [activity, setActivity] = useState<string>("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortDir, setSortDir] = useState<string>("desc");
  const [applying, setApplying] = useState(false);

  const buildFilters = (
    includeDeletedOverride?: boolean,
    origin?: { latitude: number; longitude: number },
  ): ClubManagementFilterValues => ({
    search: search || undefined,
    maxDistanceKm: maxDistanceKm ? Number(maxDistanceKm) : undefined,
    latitude: origin?.latitude,
    longitude: origin?.longitude,
    region: "SOUTH_WEST_LONDON",
    status:
      publication === "published"
        ? "ACTIVE"
        : publication === "draft"
          ? "DRAFT"
          : undefined,
    promotionStatus:
      promotionStatus === "all"
        ? undefined
        : (promotionStatus as ClubManagementFilterValues["promotionStatus"]),
    activity: activity === "all" ? undefined : activity,
    includeDeleted: (includeDeletedOverride ?? includeDeleted) || undefined,
    sortBy: sortBy as ClubManagementFilterValues["sortBy"],
    sortDir: sortDir as ClubManagementFilterValues["sortDir"],
  });

  const apply = async (includeDeletedOverride?: boolean) => {
    const trimmedPostcode = postcode.trim();

    if (maxDistanceKm && !trimmedPostcode) {
      toast.error("Enter a UK postcode to filter by distance");
      return;
    }

    if (sortBy === "distance" && !trimmedPostcode) {
      toast.error("Enter a UK postcode to sort by distance");
      return;
    }

    let origin: { latitude: number; longitude: number } | undefined;

    if (trimmedPostcode) {
      setApplying(true);
      const coords = await geocodePostcode(trimmedPostcode);
      setApplying(false);

      if (!coords) {
        toast.error("Could not find that UK postcode");
        return;
      }

      origin = { latitude: coords.lat, longitude: coords.lng };
    }

    onApply(buildFilters(includeDeletedOverride, origin));
  };

  return (
    <div className="grid min-w-0 gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="club-search">Search</Label>
        <div className="relative">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
          <Input
            id="club-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
            placeholder="Name, location…"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-postcode">From postcode</Label>
        <Input
          id="filter-postcode"
          value={postcode}
          onChange={(e) => setPostcode(e.target.value)}
          placeholder="e.g. KT3 4AA"
          autoComplete="postal-code"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="max-distance">Max distance (km)</Label>
        <Input
          id="max-distance"
          type="number"
          min={1}
          value={maxDistanceKm}
          onChange={(e) => setMaxDistanceKm(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Club type</Label>
        <Select value={activity} onValueChange={setActivity}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">All types</SelectItem>
            {activityTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {formatActivityLabel(type)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Sort by</Label>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updatedAt">Recently updated</SelectItem>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="locationName">Location</SelectItem>
            <SelectItem value="provider">Provider</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="distance">Distance</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Order</Label>
        <Select value={sortDir} onValueChange={setSortDir}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc">
              {sortBy === "updatedAt"
                ? "Oldest first"
                : sortBy === "distance"
                  ? "Nearest first"
                  : sortBy === "name" ||
                      sortBy === "locationName" ||
                      sortBy === "provider"
                    ? "A → Z"
                    : "Ascending"}
            </SelectItem>
            <SelectItem value="desc">
              {sortBy === "updatedAt"
                ? "Newest first"
                : sortBy === "distance"
                  ? "Farthest first"
                  : sortBy === "name" ||
                      sortBy === "locationName" ||
                      sortBy === "provider"
                    ? "Z → A"
                    : "Descending"}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      {showAdminFilters ? (
        <>
          <div className="space-y-1">
            <Label>Publication</Label>
            <Select value={publication} onValueChange={setPublication}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All clubs</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Promotion</Label>
            <Select value={promotionStatus} onValueChange={setPromotionStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="OFFICIAL">Official</SelectItem>
                <SelectItem value="LOCAL">Community</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="DENIED">Denied</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      ) : null}
      {showDeletedToggle ? (
        <div className="flex items-end sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => {
                const next = e.target.checked;
                setIncludeDeleted(next);
                void apply(next);
              }}
              className="border-input size-4 rounded border accent-primary"
            />
            <span>Show deleted clubs</span>
          </label>
        </div>
      ) : null}
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button type="button" disabled={applying} onClick={() => void apply()}>
          {applying ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Looking up postcode…
            </>
          ) : (
            "Apply filters"
          )}
        </Button>
      </div>
    </div>
  );
}
