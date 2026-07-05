"use client";

import { Crosshair, Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, {
  Marker,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";
import { toast } from "sonner";
import "maplibre-gl/dist/maplibre-gl.css";

import { Button } from "@/components/ui/button";
import type { ClubMapMarker, MapBounds } from "@/lib/types/club";
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
  mine: "#FF6B54",
  friend: "#38BDF8",
  shared: "#C084FC",
  suggested: "#FBBF24",
};

type ClubMapProps = {
  markers: ClubMapMarker[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  fitBounds?: MapBounds | null;
  onMarkerClick?: (marker: ClubMapMarker) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  showLocateControl?: boolean;
  className?: string;
};

function readMapBounds(map: {
  getBounds: () => {
    getSouth: () => number;
    getNorth: () => number;
    getWest: () => number;
    getEast: () => number;
  };
}): MapBounds {
  const bounds = map.getBounds();
  return {
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast(),
  };
}

function boundsKey(bounds: MapBounds | null | undefined): string | null {
  if (!bounds) return null;
  return [
    bounds.minLat.toFixed(5),
    bounds.maxLat.toFixed(5),
    bounds.minLng.toFixed(5),
    bounds.maxLng.toFixed(5),
  ].join("|");
}

type ClubMapMarkerPinProps = {
  marker: ClubMapMarker;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
};

function ClubMapMarkerPin({
  marker,
  isHovered,
  onHover,
  onLeave,
}: ClubMapMarkerPinProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex flex-col items-center transition-transform duration-200 ease-out",
        isHovered ? "z-10 scale-110" : "scale-100",
      )}
      aria-label={marker.name}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <span className="relative flex items-center justify-center">
        {isHovered ? (
          <span
            className="absolute size-8 animate-ping rounded-full opacity-40"
            style={{ backgroundColor: MARKER_COLORS[marker.variant] }}
            aria-hidden
          />
        ) : null}
        <span
          className={cn(
            "relative rounded-full border-2 border-white shadow-md transition-all duration-200 ease-out",
            isHovered ? "size-5 shadow-lg" : "size-4",
          )}
          style={{ backgroundColor: MARKER_COLORS[marker.variant] }}
        />
      </span>
      <span
        className={cn(
          "mt-0.5 rounded bg-background/95 font-medium shadow-sm transition-all duration-200 ease-out",
          isHovered
            ? "max-w-none px-2 py-0.5 text-xs whitespace-nowrap"
            : "max-w-24 truncate px-1 text-[10px]",
        )}
      >
        {marker.name}
      </span>
    </button>
  );
}

export function ClubMap({
  markers,
  center,
  zoom = 11,
  fitBounds = null,
  onMarkerClick,
  onBoundsChange,
  showLocateControl = false,
  className,
}: ClubMapProps) {
  const mapRef = useRef<MapRef>(null);
  const lastEmittedBoundsRef = useRef<string | null>(null);
  const lastFittedBoundsRef = useRef<string | null>(null);
  const isProgrammaticMoveRef = useRef(false);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);

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

  const orderedMarkers = useMemo(() => {
    if (!hoveredMarkerId) return markers;
    const hovered = markers.find((marker) => marker.id === hoveredMarkerId);
    if (!hovered) return markers;
    return [
      ...markers.filter((marker) => marker.id !== hoveredMarkerId),
      hovered,
    ];
  }, [markers, hoveredMarkerId]);

  const handleClick = useCallback(
    (marker: ClubMapMarker) => () => {
      onMarkerClick?.(marker);
    },
    [onMarkerClick],
  );

  const emitBounds = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map || !onBoundsChange) return;
    if (isProgrammaticMoveRef.current) return;

    const bounds = readMapBounds(map);
    const key = boundsKey(bounds);
    if (key === lastEmittedBoundsRef.current) return;

    lastEmittedBoundsRef.current = key;
    onBoundsChange(bounds);
  }, [onBoundsChange]);

  useEffect(() => {
    if (!fitBounds) {
      lastFittedBoundsRef.current = null;
      return;
    }
    if (!mapRef.current) return;

    const key = boundsKey(fitBounds);
    if (key === lastFittedBoundsRef.current) return;

    lastFittedBoundsRef.current = key;
    isProgrammaticMoveRef.current = true;
    mapRef.current.fitBounds(
      [
        [fitBounds.minLng, fitBounds.minLat],
        [fitBounds.maxLng, fitBounds.maxLat],
      ],
      { padding: 48, duration: 0 },
    );
  }, [fitBounds?.minLat, fitBounds?.maxLat, fitBounds?.minLng, fitBounds?.maxLng]);

  const handleLocate = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Your browser does not support location services");
      return;
    }

    setLocating(true);

    try {
      if (navigator.permissions) {
        try {
          const permission = await navigator.permissions.query({
            name: "geolocation",
          });
          if (permission.state === "denied") {
            toast.error(
              "Location access is blocked. Enable location for this site in your browser settings, then try again.",
            );
            return;
          }
        } catch {
          // Permissions API may not support geolocation in this browser.
        }
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      setUserLocation({ latitude, longitude });
      mapRef.current?.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        duration: 1200,
      });
    } catch (error) {
      const geoError = error as GeolocationPositionError;
      if (geoError.code === geoError.PERMISSION_DENIED) {
        toast.error(
          "Location access denied. Enable location for this site in your browser settings, then try again.",
        );
        return;
      }
      if (geoError.code === geoError.POSITION_UNAVAILABLE) {
        toast.error("Your location is unavailable right now.");
        return;
      }
      if (geoError.code === geoError.TIMEOUT) {
        toast.error("Location request timed out. Try again.");
        return;
      }
      toast.error("Could not get your location. Try again.");
    } finally {
      setLocating(false);
    }
  }, []);

  return (
    <div
      className={cn(
        "relative h-[400px] w-full overflow-hidden rounded-xl border",
        className,
      )}
    >
      {showLocateControl ? (
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 z-10 size-8 bg-background/95 shadow-md backdrop-blur"
          onClick={handleLocate}
          disabled={locating}
          aria-label="Center map on my location"
          title="My location"
        >
          {locating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Crosshair className="size-4" />
          )}
        </Button>
      ) : null}

      <Map
        ref={mapRef}
        initialViewState={{
          latitude: defaultCenter.latitude,
          longitude: defaultCenter.longitude,
          zoom,
        }}
        mapStyle={OSM_STYLE}
        style={{ width: "100%", height: "100%" }}
        onLoad={emitBounds}
        onMoveEnd={() => {
          if (isProgrammaticMoveRef.current) {
            isProgrammaticMoveRef.current = false;
            const map = mapRef.current?.getMap();
            if (map && onBoundsChange) {
              const bounds = readMapBounds(map);
              lastEmittedBoundsRef.current = boundsKey(bounds);
              onBoundsChange(bounds);
            }
            return;
          }
          emitBounds();
        }}
        onClick={(e: MapLayerMouseEvent) => e.originalEvent.stopPropagation()}
      >
        {userLocation ? (
          <Marker
            latitude={userLocation.latitude}
            longitude={userLocation.longitude}
            anchor="center"
          >
            <span
              className="relative flex size-4 items-center justify-center"
              aria-hidden
            >
              <span className="absolute size-8 rounded-full bg-sky-400/25" />
              <span className="size-3 rounded-full border-2 border-white bg-sky-500 shadow-md" />
            </span>
          </Marker>
        ) : null}

        {orderedMarkers.map((marker) => (
          <Marker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            anchor="bottom"
            onClick={handleClick(marker)}
          >
            <ClubMapMarkerPin
              marker={marker}
              isHovered={hoveredMarkerId === marker.id}
              onHover={() => setHoveredMarkerId(marker.id)}
              onLeave={() =>
                setHoveredMarkerId((current) =>
                  current === marker.id ? null : current,
                )
              }
            />
          </Marker>
        ))}
      </Map>
    </div>
  );
}
