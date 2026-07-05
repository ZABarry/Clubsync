import { writeFileSync } from "fs";

const SUPPLIER_ID = "acddf672-9495-43bd-9dda-0a85d2ec6a47";
const BASE = `https://activities.bookpebble.co.uk/supplier/${SUPPLIER_ID}`;

async function fetchJson(path: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "ClubZer/1.0",
    },
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text.slice(0, 500), status: res.status };
  }
}

async function main() {
  const endpoints = [
    "/activities?theme=C6F991",
    "/activities",
    "/api/activities",
    "/api/v1/activities",
  ];

  for (const ep of endpoints) {
    console.log("\n=== ", ep, " ===");
    const data = await fetchJson(ep);
    console.log(JSON.stringify(data, null, 2).slice(0, 4000));
  }
}

main().catch(console.error);
