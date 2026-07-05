import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = loginSchema.extend({
  displayName: z.string().min(2, "Display name is required"),
});

export const parentProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  homePostcode: z.string().min(4).max(10).optional(),
  defaultSearchRadiusKm: z.coerce.number().min(1).max(50).default(10),
});

export const childProfileSchema = z.object({
  nickname: z.string().min(1).max(30),
  age: z.coerce.number().min(3).max(18),
  sex: z.enum(["MALE", "FEMALE"], { message: "Select male or female" }),
  schoolYear: z.string().max(20).optional(),
  interests: z.array(z.string()).default([]),
  availabilityStart: z.string().optional(),
  availabilityEnd: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export const plannedClubSchema = z.object({
  clubId: z.string().uuid(),
  childProfileId: z.string().uuid().optional(),
  status: z.enum([
    "SUGGESTED",
    "INTERESTED",
    "FAVOURITE",
    "PLANNED",
    "BOOKED",
    "CANCELLED",
  ]),
  notes: z.string().max(500).optional(),
  bookedDates: z
    .array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  dailyRateOverride: z.coerce.number().positive().optional().nullable(),
  totalPriceOverride: z.coerce.number().positive().optional().nullable(),
});

export const clubFilterSchema = z.object({
  search: z.string().optional(),
  age: z.coerce.number().optional(),
  activity: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  maxDistanceKm: z.coerce.number().optional(),
  friendsOnly: z.coerce.boolean().optional(),
  indoor: z.coerce.boolean().optional(),
  outdoor: z.coerce.boolean().optional(),
  minLat: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  minLng: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
});

export const ratingSchema = z.object({
  clubId: z.string().uuid(),
  rating: z.coerce.number().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
});

export const clubManagementFilterSchema = z.object({
  search: z.string().optional(),
  region: z.enum(["SOUTH_WEST_LONDON"]).optional(),
  maxDistanceKm: z.coerce.number().min(1).max(100).optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).optional(),
  includeDeleted: z.boolean().optional(),
  sortBy: z
    .enum(["updatedAt", "name", "locationName", "provider", "status", "distance"])
    .optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
  promotionStatus: z
    .enum(["OFFICIAL", "LOCAL", "PENDING", "DENIED"])
    .optional(),
  activity: z.string().optional(),
});

export const clubReviewSchema = z.object({
  clubId: z.string().uuid(),
  decision: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().max(1000).optional(),
});

export const clubSubmitForReviewSchema = z.object({
  clubId: z.string().uuid(),
  submissionNote: z.string().min(1).max(1000),
});

export const dashboardRecommendationsSchema = z.object({
  limit: z.coerce.number().min(1).max(12).default(4),
  offset: z.coerce.number().min(0).default(0),
});

export const adminUserFilterSchema = z.object({
  search: z.string().optional(),
});

export const promoteUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["PARENT", "REVIEWER"]),
});

export const changeRequestSchema = z.object({
  clubId: z.string().uuid(),
  fieldName: z.string().min(1),
  suggestedValue: z.string().min(1),
  notes: z.string().max(500).optional(),
});

export const smartPlannerSchema = z.object({
  childProfileId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  interests: z.array(z.string()).default([]),
  maxDistanceKm: z.coerce.number().min(1).max(50).default(10),
  budget: z.coerce.number().optional(),
  preferredFriendIds: z.array(z.string()).default([]),
});

export const providerSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export const clubSchema = z.object({
  providerId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  locationName: z.string().min(2),
  address: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  activities: z.array(z.string()).default([]),
  ageMin: z.coerce.number().min(3),
  ageMax: z.coerce.number().max(18),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  dailyStartTime: z.string().optional(),
  dailyEndTime: z.string().optional(),
  price: z.coerce.number().optional(),
  dailyRate: z.coerce.number().optional(),
  priceNote: z.string().optional(),
  bookingUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  dataConfidence: z.string().optional(),
  region: z.enum(["SOUTH_WEST_LONDON"]).default("SOUTH_WEST_LONDON"),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]).default("ACTIVE"),
  isIndoor: z.boolean().default(false),
  isOutdoor: z.boolean().default(true),
  sendFriendly: z.boolean().default(false),
  accessibilityNotes: z.string().optional(),
});

export const sharedClubSchema = z.object({
  clubId: z.string().uuid(),
  title: z.string().min(2).max(100),
  notes: z.string().max(500).optional(),
});
