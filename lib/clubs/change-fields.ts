export const CLUB_CHANGE_FIELD_NAMES = [
  "name",
  "description",
  "price",
  "bookingUrl",
  "locationName",
] as const;

export type ClubChangeFieldName = (typeof CLUB_CHANGE_FIELD_NAMES)[number];

export const CLUB_CHANGE_FIELD_OPTIONS: ReadonlyArray<{
  value: ClubChangeFieldName;
  label: string;
}> = [
  { value: "name", label: "Club name" },
  { value: "description", label: "Description" },
  { value: "price", label: "Price" },
  { value: "bookingUrl", label: "Booking URL" },
  { value: "locationName", label: "Location" },
];

export function isAllowedClubChangeField(
  fieldName: string,
): fieldName is ClubChangeFieldName {
  return (CLUB_CHANGE_FIELD_NAMES as readonly string[]).includes(fieldName);
}
