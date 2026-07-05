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
  showAdminFilters?: boolean;
  onApply: (filters: ClubManagementFilterValues) => void;
};

export function ClubManagementFilters({
  defaultLatitude,
  defaultLongitude,
  showAdminFilters = false,
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
  const [status, setStatus] = useState<string>("all");
  const [promotionStatus, setPromotionStatus] = useState<string>("all");

  const apply = () => {
    onApply({
      search: search || undefined,
      maxDistanceKm: maxDistanceKm ? Number(maxDistanceKm) : undefined,
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      region: "SOUTH_WEST_LONDON",
      status:
        status === "all"
          ? undefined
          : (status as ClubManagementFilterValues["status"]),
      promotionStatus:
        promotionStatus === "all"
          ? undefined
          : (promotionStatus as ClubManagementFilterValues["promotionStatus"]),
    });
  };

  return (
    <div className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
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
      {showAdminFilters ? (
        <>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
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
      <div className="flex items-end sm:col-span-2 lg:col-span-4">
        <Button type="button" onClick={apply}>
          Apply filters
        </Button>
      </div>
    </div>
  );
}
