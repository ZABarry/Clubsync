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
  homePostcode: z.string().min(4).max(10).optional(),
  defaultSearchRadiusKm: z.coerce.number().min(1).max(50).default(10),
});

export const childProfileSchema = z.object({
  nickname: z.string().min(1).max(30),
  age: z.coerce.number().min(3).max(18),
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
    "PAID",
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
});

export const ratingSchema = z.object({
  clubId: z.string().uuid(),
  rating: z.coerce.number().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
});

export const clubSubmissionSchema = z.object({
  clubName: z.string().min(2),
  providerName: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  notes: z.string().max(1000).optional(),
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
  startDate: z.string(),
  endDate: z.string(),
  dailyStartTime: z.string().optional(),
  dailyEndTime: z.string().optional(),
  price: z.coerce.number().optional(),
  dailyRate: z.coerce.number().optional(),
  bookingUrl: z.string().url().optional().or(z.literal("")),
  imageUrl: z.string().url().optional().or(z.literal("")),
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
