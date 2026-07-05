import { writeFileSync } from "fs";

async function main() {
  const url = "https://beyondblocks.co.uk/booking/";

  const html = await fetch(url, {
    headers: { "User-Agent": "ClubZer/1.0", Accept: "text/html" },
  }).then((r) => r.text());

  writeFileSync("scripts/_bb-booking.html", html);

  const urls = [...html.matchAll(/https?:\/\/[^"'\\s<>]+/g)].map((m) => m[0]);
  const interesting = [...new Set(urls)].filter((u) =>
    /book|class|camp|widget|embed|api|session|event|forkids|when|pembee/i.test(u),
  );

  console.log("HTML length:", html.length);
  console.log("\nInteresting URLs:");
  for (const u of interesting.slice(0, 40)) console.log(u);

  for (const pat of [/classforkids[^"']*/gi, /iframe[^>]+/gi, /script[^>]+src[^>]+/gi]) {
    const m = html.match(pat);
    if (m) console.log("\n", String(pat), m.slice(0, 8));
  }
}

main().catch(console.error);
