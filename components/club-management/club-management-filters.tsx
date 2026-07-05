"use client";

import { Search } from "lucide-react";
import { useState } from "react";

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
import type { clubManagementFilterSchema } from "@/lib/validation/schemas";

export type ClubManagementFilterValues = z.infer<
  typeof clubManagementFilterSchema
>;

type ClubManagementFiltersProps = {
  defaultLatitude?: number | null;
  defaultLongitude?: number | null;
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
  defaultLatitude,
  defaultLongitude,
  activityTypes = [],
  showAdminFilters = false,
  showDeletedToggle = false,
  onApply,
}: ClubManagementFiltersProps) {
  const [search, setSearch] = useState("");
  const [maxDistanceKm, setMaxDistanceKm] = useState("");
  const [latitude, setLatitude] = useState(
    defaultLatitude != null ? String(defaultLatitude) : "",
  );
  const [longitude, setLongitude] = useState(
    defaultLongitude != null ? String(defaultLongitude) : "",
  );
  const [publication, setPublication] = useState<string>("all");
  const [promotionStatus, setPromotionStatus] = useState<string>("all");
  const [activity, setActivity] = useState<string>("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sortBy, setSortBy] = useState<string>("updatedAt");
  const [sortDir, setSortDir] = useState<string>("desc");

  const buildFilters = (
    includeDeletedOverride?: boolean,
  ): ClubManagementFilterValues => ({
    search: search || undefined,
    maxDistanceKm: maxDistanceKm ? Number(maxDistanceKm) : undefined,
    latitude: latitude ? Number(latitude) : undefined,
    longitude: longitude ? Number(longitude) : undefined,
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

  const apply = (includeDeletedOverride?: boolean) => {
    onApply(buildFilters(includeDeletedOverride));
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
        <Label htmlFor="filter-lat">Latitude</Label>
        <Input
          id="filter-lat"
          type="number"
          step="any"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="filter-lng">Longitude</Label>
        <Input
          id="filter-lng"
          type="number"
          step="any"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
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
                apply(next);
              }}
              className="border-input size-4 rounded border accent-primary"
            />
            <span>Show deleted clubs</span>
          </label>
        </div>
      ) : null}
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button type="button" onClick={() => apply()}>
          Apply filters
        </Button>
      </div>
    </div>
  );
}
