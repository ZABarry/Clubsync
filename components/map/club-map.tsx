"use client";

import { useCallback, useMemo } from "react";
import Map, { Marker, type MapLayerMouseEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import type { ClubMapMarker } from "@/lib/types/club";
import { cn } from "@/lib/utils";

const OSM_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm",
    },
  ],
};

const MARKER_COLORS: Record<ClubMapMarker["variant"], string> = {
  mine: "#0ea5e9",
  friend: "#8b5cf6",
  shared: "#ec4899",
  suggested: "#f59e0b",
};

type ClubMapProps = {
  markers: ClubMapMarker[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  onMarkerClick?: (marker: ClubMapMarker) => void;
  className?: string;
};

export function ClubMap({
  markers,
  center,
  zoom = 11,
  onMarkerClick,
  className,
}: ClubMapProps) {
  const defaultCenter = useMemo(() => {
    if (center) return center;
    if (markers.length > 0) {
      return {
        latitude: markers[0].latitude,
        longitude: markers[0].longitude,
      };
    }
    return { latitude: 51.4545, longitude: -0.1945 };
  }, [center, markers]);

  const handleClick = useCallback(
    (marker: ClubMapMarker) => () => {
      onMarkerClick?.(marker);
    },
    [onMarkerClick],
  );

  return (
    <div
      className={cn(
        "h-[400px] w-full overflow-hidden rounded-xl border",
        className,
      )}
    >
      <Map
        initialViewState={{
          latitude: defaultCenter.latitude,
          longitude: defaultCenter.longitude,
          zoom,
        }}
        mapStyle={OSM_STYLE}
        style={{ width: "100%", height: "100%" }}
        onClick={(e: MapLayerMouseEvent) => e.originalEvent.stopPropagation()}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            anchor="bottom"
            onClick={handleClick(marker)}
          >
            <button
              type="button"
              className="flex flex-col items-center"
              aria-label={marker.name}
              onClick={(e) => e.stopPropagation()}
            >
              <span
                className="size-4 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: MARKER_COLORS[marker.variant] }}
              />
              <span className="mt-0.5 max-w-24 truncate rounded bg-background/90 px-1 text-[10px] font-medium shadow-sm">
                {marker.name}
              </span>
            </button>
          </Marker>
        ))}
      </Map>
    </div>
  );
}
