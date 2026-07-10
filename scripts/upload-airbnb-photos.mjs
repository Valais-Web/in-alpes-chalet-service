/**
 * Re-host the scraped Airbnb (muscache) photos to Cloudinary.
 *
 *   set -a; . ./.env; set +a; node scripts/upload-airbnb-photos.mjs
 *
 * Cloudinary fetches each remote muscache URL directly (no local download).
 * Signature = sha1("folder=<f>&timestamp=<t>" + API_SECRET), the same formula
 * as netlify/lib/cloudinary.ts, extended with a per-apartment sub-folder.
 * Idempotent: rooms already present in .scrape/cloudinary.json are skipped.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME;
const KEY = process.env.CLOUDINARY_API_KEY;
const SECRET = process.env.CLOUDINARY_API_SECRET;
if (!CLOUD || !KEY || !SECRET) {
  console.error("Missing CLOUDINARY_* env (source .env first)");
  process.exit(1);
}

// room key → apartment slug (Cloudinary sub-folder)
const SLUGS = {
  r1: "le-combin",
  r2: "studio-in-alpes",
  r3: "perce-neige-21",
  r4: "studio-la-petite-marmotte",
};
const MAX_PER_ROOM = 18; // gallery cap; r4 has only 11

const listings = JSON.parse(readFileSync(".scrape/listings.json", "utf8"));
const OUT = ".scrape/cloudinary.json";
const done = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

function sign(params) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1")
    .update(toSign + SECRET)
    .digest("hex");
}

async function uploadOne(url, folder) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signed = { folder, timestamp };
  const signature = sign(signed);
  const form = new FormData();
  form.append("file", `${url}?im_w=1200`); // muscache serves fixed widths; 1200 is valid, 1600 404s
  form.append("api_key", KEY);
  form.append("timestamp", String(timestamp));
  form.append("folder", folder);
  form.append("signature", signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  // Bake automatic format + quality into the stored URL (resolveImage passes it through).
  return data.secure_url.replace("/upload/", "/upload/f_auto,q_auto/");
}

for (const [room, slug] of Object.entries(SLUGS)) {
  if (done[room]?.length) {
    console.log(`↷ ${room} (${slug}): already have ${done[room].length}, skipping`);
    continue;
  }
  // Keep only real listing photos: drop Airbnb UI assets and host avatars.
  const photos = (listings[room]?.photos ?? [])
    .filter(
      (u) =>
        u.includes("/im/pictures/") && !u.includes("AirbnbPlatformAssets") && !u.includes("/user/"),
    )
    .slice(0, MAX_PER_ROOM);
  const folder = `in-alpes/apartments/${slug}`;
  console.log(`\n▶ ${room} (${slug}): uploading ${photos.length} photos → ${folder}`);
  const urls = [];
  for (let i = 0; i < photos.length; i++) {
    try {
      const url = await uploadOne(photos[i], folder);
      urls.push(url);
      process.stdout.write(`  ✅ ${i + 1}/${photos.length}\r`);
    } catch (e) {
      console.log(`\n  ❌ ${i + 1}/${photos.length}: ${e.message}`);
    }
  }
  done[room] = urls;
  writeFileSync(OUT, JSON.stringify(done, null, 2)); // persist after each room
  console.log(`\n  → ${urls.length} uploaded`);
}

console.log(`\nWrote ${OUT}`);
for (const [room, urls] of Object.entries(done)) console.log(`  ${room}: ${urls.length}`);
