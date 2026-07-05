import { describe, expect, it } from "vitest";

import {
  extractImageFromHtml,
  resolveImageUrl,
} from "@/lib/clubs/extract-page-image";

const PAGE_URL = "https://example.com/camps/kingston";

describe("resolveImageUrl", () => {
  it("resolves relative paths against the page URL", () => {
    expect(resolveImageUrl("/images/camp.jpg", PAGE_URL)).toBe(
      "https://example.com/images/camp.jpg",
    );
  });

  it("rejects data URLs and non-https schemes", () => {
    expect(resolveImageUrl("data:image/png;base64,abc", PAGE_URL)).toBeNull();
    expect(resolveImageUrl("http://example.com/image.jpg", PAGE_URL)).toBeNull();
  });
});

describe("extractImageFromHtml", () => {
  it("extracts og:image content", () => {
    const html = `
      <html>
        <head>
          <meta property="og:image" content="https://cdn.example.com/hero.jpg" />
        </head>
      </html>
    `;

    expect(extractImageFromHtml(html, PAGE_URL)).toBe(
      "https://cdn.example.com/hero.jpg",
    );
  });

  it("extracts twitter:image when og:image is missing", () => {
    const html = `
      <meta name="twitter:image" content="https://cdn.example.com/twitter.jpg" />
    `;

    expect(extractImageFromHtml(html, PAGE_URL)).toBe(
      "https://cdn.example.com/twitter.jpg",
    );
  });

  it("extracts link rel=image_src", () => {
    const html = `<link rel="image_src" href="/assets/camp.png" />`;

    expect(extractImageFromHtml(html, PAGE_URL)).toBe(
      "https://example.com/assets/camp.png",
    );
  });

  it("extracts JSON-LD image for supported types", () => {
    const html = `
      <script type="application/ld+json">
        {
          "@type": "Event",
          "name": "Summer Camp",
          "image": "https://cdn.example.com/event.jpg"
        }
      </script>
    `;

    expect(extractImageFromHtml(html, PAGE_URL)).toBe(
      "https://cdn.example.com/event.jpg",
    );
  });

  it("returns null when no image metadata is present", () => {
    expect(extractImageFromHtml("<html><body>No image</body></html>", PAGE_URL)).toBeNull();
  });
});
