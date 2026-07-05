const ACTIVITY_URLS = [
  "https://activities.bookpebble.co.uk/activity/beyond-blocks-introduction-to-robotics-with-lego-grand-avenue-surbiton-9a345577-93ec-40c3-a9d4-e1bd34696730",
  "https://activities.bookpebble.co.uk/activity/beyond-blocks-introduction-to-robotics-with-lego-st-matthews-surbiton-d2749e0e-55ea-4220-aaee-d0c7e150b71a",
  "https://activities.bookpebble.co.uk/activity/beyond-blocks-pre-intermediate-lego-robotics-shmc-surbiton-a512264f-dff6-4611-bd2b-38d0deeb8671",
  "https://activities.bookpebble.co.uk/activity/beyond-blocks-intermediate-lego-robotics-shmc-surbiton-43341de0-b448-4a54-94db-4aa7cd7fe1af",
  "https://activities.bookpebble.co.uk/activity/beyond-blocks-advanced-robotics-competition-training-ages-916-surbiton-abb632c5-07e7-489f-9abc-63914bef1e77",
  "https://activities.bookpebble.co.uk/activity/beyond-blocks-beyond-blocks-innovation-lab-invitation-only-surbiton-eb8ba57f-affe-4b51-9823-bd6aad63d0a2",
  "https://activities.bookpebble.co.uk/activity/beyond-blocks-summer-big-build-the-big-star-destroyer-challenge-surbiton-ad2b1ecf-88d9-437e-a143-04356f41c59c",
  "https://activities.bookpebble.co.uk/activity/beyond-blocks-introduction-to-robotics-with-lego-cc-surbiton-surbiton-5c222ce0-2877-48aa-8b16-217236e7daae",
  "https://activities.bookpebble.co.uk/activity/beyond-blocks-introduction-to-robotics-with-lego-tolworth-surbiton-a19cf3fe-ffe3-4d79-b378-01dde210526b",
];

type Ticket = {
  name: string;
  price: number;
  pricingPolicy: string;
  ticketType: string;
  isAvailable: boolean;
};

type Block = {
  dateRange: string;
  startTime: string;
  endTime: string;
  weekdays: string[];
  spotsLeft: number;
  numberOfSessionsAvailable: number;
};

type ClassProduct = {
  name: string;
  dateRange: string;
  weekdays: string[];
  blocks: Block[];
  tickets: { block: Ticket[]; individual: Ticket[] };
};

async function fetchActivity(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error(`No __NEXT_DATA__ for ${url}`);
  const data = JSON.parse(match[1]);
  const details = data.props.pageProps.activityDetails;
  const activity = details.activity;
  const loc = activity.location;

  const classes: ClassProduct[] = (details.classes ?? [])
    .filter((c: ClassProduct) => {
      const hasBlocks = c.blocks?.length > 0;
      const hasTickets =
        (c.tickets?.block?.length ?? 0) > 0 || (c.tickets?.individual?.length ?? 0) > 0;
      return hasBlocks || hasTickets;
    })
    .map((c: ClassProduct) => ({
      name: c.name,
      dateRange: c.dateRange,
      weekdays: c.weekdays,
      blocks: (c.blocks ?? []).map((b: Block) => ({
        dateRange: b.dateRange,
        startTime: b.startTime,
        endTime: b.endTime,
        weekdays: b.weekdays,
        spotsLeft: b.spotsLeft,
        numberOfSessionsAvailable: b.numberOfSessionsAvailable,
      })),
      tickets: {
        block: (c.tickets?.block ?? []).map((t: Ticket) => ({
          name: t.name,
          price: t.price,
          pricingPolicy: t.pricingPolicy,
          ticketType: t.ticketType,
          isAvailable: t.isAvailable,
        })),
        individual: (c.tickets?.individual ?? []).map((t: Ticket) => ({
          name: t.name,
          price: t.price,
          pricingPolicy: t.pricingPolicy,
          ticketType: t.ticketType,
          isAvailable: t.isAvailable,
        })),
      },
    }));

  const allPrices = classes.flatMap((c) =>
    [...c.tickets.block, ...c.tickets.individual].map((t) => t.price / 100),
  );

  return {
    name: activity.name,
    slug: activity.slug,
    url,
    ageRange: activity.ageRange,
    activityType: activity.activityType,
    blockSubtype: activity.blockSubtype,
    allowBlockBookings: activity.allowBlockBookings,
    allowIndividualBookings: activity.allowIndividualBookings,
    bookingType: activity.bookingType,
    status: activity.status,
    anySpotsLeft: details.anySpotsLeft,
    location: {
      name: loc.addressLine1,
      address: [loc.addressLine1, loc.addressLine2, loc.city, loc.postCode]
        .filter(Boolean)
        .join(", "),
      postcode: loc.postCode,
      lat: parseFloat(loc.latitude),
      lng: parseFloat(loc.longitude),
    },
    categories: activity.categories?.map((c: { name: string }) => c.name) ?? [],
    priceMin: allPrices.length ? Math.min(...allPrices) : null,
    priceMax: allPrices.length ? Math.max(...allPrices) : null,
    classes,
  };
}

async function main() {
  const results = [];
  for (const url of ACTIVITY_URLS) {
    try {
      results.push(await fetchActivity(url));
    } catch (e) {
      results.push({ url, error: String(e) });
    }
  }
  console.log(JSON.stringify(results, null, 2));
}

main();
