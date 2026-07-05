export type PlannedClubStatus =
  | "SUGGESTED"
  | "INTERESTED"
  | "FAVOURITE"
  | "PLANNED"
  | "BOOKED"
  | "CANCELLED";

export type PlannedClubBookingData = {
  bookedDates: string[];
  dailyRateOverride: number | null;
  totalPriceOverride: number | null;
  effectiveDailyRate: number | null;
  effectiveTotalPrice: number | null;
};

export type ClubCardData = {
  id: string;
  name: string;
  providerName: string;
  startDate: Date | string | null;
  endDate: Date | string | null;
  price?: number | null;
  dailyRate?: number | null;
  priceNote?: string | null;
  ratingAverage?: number;
  ratingCount?: number;
  activities: string[];
  distanceKm?: number | null;
  imageUrl?: string | null;
  isCommunityClub?: boolean;
  plannedStatus?: PlannedClubStatus | null;
  recommendationReasons?: string[];
  bookingUrl?: string | null;
  latitude?: number;
  longitude?: number;
};

export type ClubDetailData = ClubCardData & {
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

export type ClubMapMarker = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  variant: "mine" | "friend" | "shared" | "suggested";
};

export type MapBounds = {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
};

export type ClubCalendarEvent = {
  id: string;
  title: string;
  start: Date | string | null;
  end: Date | string | null;
  status?: PlannedClubStatus;
  clubId?: string;
  bookedDates?: string[];
  campStartDate?: Date | string | null;
  campEndDate?: Date | string | null;
  dayCount?: number;
  effectiveTotalPrice?: number | null;
  effectiveDailyRate?: number | null;
  dailyRateOverride?: number | null;
  totalPriceOverride?: number | null;
};

export type ClubFilterValues = {
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
  minLat?: number;
  maxLat?: number;
  minLng?: number;
  maxLng?: number;
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
  sex?: "MALE" | "FEMALE" | null;
};

export type FriendOption = {
  id: string;
  displayName: string;
};
