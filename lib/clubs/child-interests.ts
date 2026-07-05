export type ChildInterestOption = {
  value: string;
  label: string;
};

/** Curated child interests aligned to club activity values in the database. */
export const CHILD_INTEREST_OPTIONS: ChildInterestOption[] = [
  { value: "multi-activity", label: "Multi-activity" },
  { value: "sports", label: "Sports" },
  { value: "football", label: "Football" },
  { value: "swimming", label: "Swimming" },
  { value: "tennis", label: "Tennis" },
  { value: "gymnastics", label: "Gymnastics" },
  { value: "dance", label: "Dance" },
  { value: "arts", label: "Arts" },
  { value: "crafts", label: "Crafts" },
  { value: "drama", label: "Drama" },
  { value: "performing arts", label: "Performing arts" },
  { value: "music", label: "Music" },
  { value: "stem", label: "STEM & science" },
  { value: "coding", label: "Coding" },
  { value: "nature", label: "Nature & outdoors" },
  { value: "adventure", label: "Adventure" },
  { value: "climbing", label: "Climbing" },
  { value: "cooking", label: "Cooking" },
  { value: "chess", label: "Chess" },
  { value: "horse riding", label: "Horse riding" },
];

export const CHILD_INTEREST_VALUES = CHILD_INTEREST_OPTIONS.map(
  (option) => option.value,
);

export function formatChildInterest(value: string): string {
  const normalized = value.trim().toLowerCase();
  const match = CHILD_INTEREST_OPTIONS.find(
    (option) => option.value.toLowerCase() === normalized,
  );
  return match?.label ?? value;
}

/** Maps interests to related club activity labels for recommendation scoring. */
export const INTEREST_ACTIVITY_ALIASES: Record<string, readonly string[]> = {
  art: ["arts", "crafts", "creative", "creative activities", "creative workshops"],
  arts: ["art", "crafts", "creative", "creative activities"],
  crafts: ["arts", "art", "creative", "sewing", "textiles"],
  sport: ["sports", "sport", "multi-sport", "athletics"],
  sports: ["sport", "multi-sport", "athletics"],
  stem: ["science", "technology", "robotics", "engineering", "experiments"],
  science: ["stem", "experiments", "technology"],
  coding: ["stem", "technology", "robotics", "game design", "digital creativity"],
  nature: ["outdoor", "forest school", "bushcraft", "survival"],
  music: ["singing", "musical theatre", "sound"],
  drama: ["theatre", "performing arts", "musical theatre", "lamda"],
  dance: ["performing arts"],
  adventure: ["outdoor", "climbing", "archery", "survival", "bushcraft"],
};

export function interestMatchesActivity(
  interest: string,
  activity: string,
): boolean {
  const normalizedInterest = interest.trim().toLowerCase();
  const normalizedActivity = activity.trim().toLowerCase();

  if (normalizedInterest === normalizedActivity) return true;

  const aliases = INTEREST_ACTIVITY_ALIASES[normalizedInterest] ?? [];
  if (aliases.includes(normalizedActivity)) return true;

  const reverseAliases = INTEREST_ACTIVITY_ALIASES[normalizedActivity] ?? [];
  return reverseAliases.includes(normalizedInterest);
}

export function clubMatchesInterest(
  clubActivities: string[],
  interest: string,
): boolean {
  return clubActivities.some((activity) =>
    interestMatchesActivity(interest, activity),
  );
}
