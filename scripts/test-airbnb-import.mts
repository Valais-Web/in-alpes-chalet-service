/**
 * Live check of the Airbnb import (netlify/lib/airbnb.ts) against the real
 * listings — run it when the admin import starts failing, to see whether
 * Airbnb changed its page structure:
 *
 *   npx tsx scripts/test-airbnb-import.mts [airbnb-url …]
 *
 * With Cloudinary creds loaded (set -a; . ./.env; set +a) it also re-hosts the
 * first photo through the same signed "upload from URL" path the admin uses,
 * then deletes that test copy.
 */
import { createHash } from "node:crypto";
import { importAirbnbListing } from "../netlify/lib/airbnb.ts";
import { signUpload } from "../netlify/lib/cloudinary.ts";
import { env, flags } from "../netlify/lib/env.ts";

const DEFAULT_URLS = [
  "https://www.airbnb.com/rooms/1577629186881048894", // Le Combin
  "https://www.airbnb.com/rooms/37198545", // Studio In-Alpes
  "https://www.airbnb.com/rooms/38210578", // Perce Neige 21
  "https://www.airbnb.com/rooms/563156915755814550", // Studio La petite marmotte
];
const urls = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_URLS;

let failures = 0;
let firstPhoto: string | undefined;

for (const url of urls) {
  try {
    const d = await importAirbnbListing(url);
    firstPhoto ??= d.images[0];
    const ok = d.title.fr && d.description.fr && d.images.length > 0;
    if (!ok) failures++;
    console.log(`${ok ? "✅" : "❌"} ${url}`);
    console.log(`   title     : ${d.title.fr} | ${d.title.en} | ${d.title.nl}`);
    console.log(`   summary fr: ${d.summary.fr}`);
    console.log(
      `   facts     : ${d.maxGuests} guests, ${d.bedrooms} bedrooms, ${d.bathrooms} baths, ` +
        `${d.surfaceM2 ?? "?"} m², ${d.images.length} photos`,
    );
    console.log(`   amenities : ${d.amenities.join(", ") || "—"}`);
    console.log(`   location  : ${d.location.lat}, ${d.location.lng} — ${d.location.address}`);
    console.log(`   rules en  : ${d.rules.en}`);
    console.log(`   warnings  : ${d.warnings.join(", ") || "none"}`);
  } catch (err) {
    failures++;
    console.log(`❌ ${url}: ${(err as Error).message}`);
  }
}

if (firstPhoto && flags.hasCloudinary) {
  const sig = signUpload();
  const form = new FormData();
  form.append("file", firstPhoto);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    error?: { message: string };
  };
  if (!res.ok || !data.public_id) {
    failures++;
    console.log(`❌ Cloudinary re-host of ${firstPhoto}: ${data.error?.message ?? res.status}`);
  } else {
    console.log(`✅ Cloudinary re-host OK: ${data.secure_url}`);
    // Remove the test copy.
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash("sha1")
      .update(`public_id=${data.public_id}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`)
      .digest("hex");
    const del = new FormData();
    del.append("public_id", data.public_id);
    del.append("api_key", sig.apiKey);
    del.append("timestamp", String(timestamp));
    del.append("signature", signature);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/destroy`, {
      method: "POST",
      body: del,
    });
    console.log(`   test copy deleted: ${(await r.json()).result ?? r.status}`);
  }
} else if (firstPhoto) {
  console.log("ℹ Cloudinary creds not loaded — photo re-host not tested.");
}

process.exit(failures ? 1 : 0);
