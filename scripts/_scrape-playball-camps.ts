async function fetchHtml(url: string) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", Cookie: "country=UK" } });
  return res.text();
}

function summarize(html: string, label: string) {
  const noCamps = html.includes("No Playball camps were found");
  const noClasses = html.includes("No Playball classes were found");
  const cards = [...html.matchAll(/class="[^"]*(?:result|venue|camp|class-row)[^"]*"[^>]*>([\s\S]*?)<\/div>/gi)]
    .map((m) => m[0].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 30);
  const links = [...html.matchAll(/href="(\/find-classes\.php[^"]+)"/gi)].map((m) => m[1]);
  return { label, noCamps, noClasses, cards: cards.slice(0, 10), links: [...new Set(links)].slice(0, 10), snippet: html.includes("Oops") ? html.match(/Oops![^<]+/)?.[0] : "has content" };
}

async function main() {
  const urls = [
    ["user url", "https://www.playballkids.com/find-classes.php?postcode=KT33HL&radius=15&termtime=Summer&agegroup=All+Ages&dow=-1&tod=Any+Time+&login=login&type=camps"],
    ["KT3 3HL spaced", "https://www.playballkids.com/find-classes.php?postcode=KT3+3HL&radius=15&termtime=Summer&agegroup=All+Ages&dow=-1&tod=Any+Time+&login=login&type=camps"],
    ["20km summer", "https://www.playballkids.com/find-classes.php?postcode=KT33HL&radius=20&termtime=Summer&agegroup=All+Ages&dow=-1&tod=Any+Time+&login=login&type=camps"],
    ["kingston 5km classes", "https://www.playballkids.com/find-classes.php?radius=5&termtime=Any&agegroup=All+Ages&dow=-1&tod=Any+Time+&login=login&type=classes"],
    ["tiffin postcode camps any", "https://www.playballkids.com/find-classes.php?postcode=KT25PL&radius=15&termtime=Any&agegroup=All+Ages&dow=-1&tod=Any+Time+&login=login&type=camps"],
  ];
  for (const [label, url] of urls) {
    const html = await fetchHtml(url);
    console.log(JSON.stringify(summarize(html, label), null, 2));
  }

  const kingston = await fetchHtml("https://www.playballkids.com/franchise/kingston");
  const scripts = [...kingston.matchAll(/venue[^;\n]{0,200}/gi)].slice(0, 20).map((m) => m[0]);
  const onclick = [...kingston.matchAll(/Find Camps[\s\S]{0,200}/gi)].map((m) => m[0].replace(/<[^>]+>/g, " "));
  console.log("onclick/findcamps:", onclick.slice(0, 3));
}

main();
