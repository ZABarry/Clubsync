export type PlannedCampStatus =
  | "SUGGESTED"
  | "INTERESTED"
  | "FAVOURITE"
  | "PLANNED"
  | "BOOKED"
  | "PAID"
  | "CANCELLED";

export type CampCardData = {
  id: string;
  name: string;
  providerName: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  price?: number | null;
  ratingAverage?: number;
  ratingCount?: number;
  activities: string[];
  distanceKm?: number | null;
  imageUrl?: string | null;
  plannedStatus?: PlannedCampStatus | null;
  recommendationReasons?: string[];
  latitude?: number;
  longitude?: number;
};

export type CampDetailData = CampCardData & {
  description?: string | null;
  locationName: string;
  address?: string | null;
  latitude: number;
  longitude: number;
  ageMin: number;
  ageMax: number;
  dailyStartTime?: string | null;
  dailyEndTime?: string | null;
  bookingUrl?: string | null;
  isIndoor: boolean;
  isOutdoor: boolean;
  sendFriendly: boolean;
  accessibilityNotes?: string | null;
};

export type CampMapMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  variant: "mine" | "friend" | "shared" | "suggested";
};

export type CampCalendarEvent = {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  status?: PlannedCampStatus;
  campId?: string;
};

export type CampFilterValues = {
  search?: string;
  age?: number;
  activity?: string;
  startDate?: string;
  endDate?: string;
  maxPrice?: number;
  minRating?: number;
  maxDistanceKm?: number;
  friendsOnly?: boolean;
  indoor?: boolean;
  outdoor?: boolean;
};

export type TrustedConnection = {
  id: string;
  displayName: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";
  direction: "sent" | "received";
  acceptedAt?: Date | string | null;
};

export type ModerationItem = {
  id: string;
  type: string;
  title: string;
  submittedBy: string;
  submittedAt: Date | string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  preview?: string;
};

export type ChildOption = {
  id: string;
  nickname: string;
  age: number;
};

export type FriendOption = {
  id: string;
  displayName: string;
};
