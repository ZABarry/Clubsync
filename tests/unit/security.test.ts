import { describe, it, expect } from "vitest";

import { isAllowedClubChangeField, CLUB_CHANGE_FIELD_NAMES } from "@/lib/clubs/change-fields";
import { isSafeNotificationLink } from "@/lib/notifications/internal";
import { sanitizeRedirectPath } from "@/lib/security/safe-redirect";
import { validateImageBuffer } from "@/lib/security/image-validation";
import { changeRequestSchema } from "@/lib/validation/schemas";

describe("notification link validation", () => {
  it("allows safe relative paths", () => {
    expect(isSafeNotificationLink("/admin")).toBe(true);
    expect(isSafeNotificationLink("/clubs/123")).toBe(true);
    expect(isSafeNotificationLink(undefined)).toBe(true);
  });

  it("blocks external and protocol-relative links", () => {
    expect(isSafeNotificationLink("https://evil.com")).toBe(false);
    expect(isSafeNotificationLink("//evil.com")).toBe(false);
    expect(isSafeNotificationLink("/\\evil.com")).toBe(false);
  });
});

describe("change request allowlist", () => {
  it("accepts allowed field names only", () => {
    for (const fieldName of CLUB_CHANGE_FIELD_NAMES) {
      expect(isAllowedClubChangeField(fieldName)).toBe(true);
    }
    expect(isAllowedClubChangeField("ownerParentProfileId")).toBe(false);
    expect(isAllowedClubChangeField("promotionStatus")).toBe(false);
  });

  it("rejects disallowed fields in schema", () => {
    expect(() =>
      changeRequestSchema.parse({
        clubId: "00000000-0000-4000-8000-000000000001",
        fieldName: "status",
        suggestedValue: "ARCHIVED",
      }),
    ).toThrow();
  });
});

describe("safe redirect paths", () => {
  it("allows relative in-app paths", () => {
    expect(sanitizeRedirectPath("/discover")).toBe("/discover");
    expect(sanitizeRedirectPath("/profile?onboarding=true")).toBe(
      "/profile?onboarding=true",
    );
  });

  it("blocks open redirects", () => {
    expect(sanitizeRedirectPath("https://evil.com")).toBe("/");
    expect(sanitizeRedirectPath("//evil.com")).toBe("/");
    expect(sanitizeRedirectPath("@evil.com")).toBe("/");
  });
});

describe("image magic-byte validation", () => {
  it("accepts PNG files with matching declared type", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateImageBuffer(png, "image/png")).toBe("image/png");
  });

  it("rejects mismatched declared type", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(validateImageBuffer(png, "image/jpeg")).toBeNull();
  });
});
