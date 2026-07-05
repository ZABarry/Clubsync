export type ChildSex = "MALE" | "FEMALE";

export type ChildSexOption = {
  value: ChildSex;
  label: string;
};

export const CHILD_SEX_OPTIONS: ChildSexOption[] = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

export function formatChildSex(sex: ChildSex | null | undefined): string | null {
  if (!sex) return null;
  return CHILD_SEX_OPTIONS.find((option) => option.value === sex)?.label ?? null;
}
