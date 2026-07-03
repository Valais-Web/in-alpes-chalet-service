/**
 * One-off: confirm Cloudinary works via OUR server-side signed-upload path
 * (netlify/lib/cloudinary.ts) — the same signature the admin editor uses.
 *   set -a; . ./.env; set +a; npx tsx scripts/test-cloudinary.mts
 * Safe to delete. The secret never appears here — only the server signs.
 */
import { signUpload } from "../netlify/lib/cloudinary.ts";

const sig = signUpload(); // { cloudName, apiKey, timestamp, folder, signature }

const form = new FormData();
form.append("file", "https://res.cloudinary.com/demo/image/upload/sample.jpg");
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
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: { message: string };
};

if (!res.ok || data.error) {
  console.log("❌ Cloudinary error:", data.error?.message ?? res.status);
  process.exit(1);
}

console.log("✅ Signed upload OK");
console.log("   secure_url:", data.secure_url);
console.log("   public_id :", data.public_id);
console.log(`   metadata  : ${data.width}×${data.height}px, ${data.format}, ${data.bytes} bytes`);

// f_auto = pick the best format per browser (WebP/AVIF); q_auto = auto-tune quality.
const optimized = data.secure_url!.replace("/upload/", "/upload/f_auto,q_auto/");
console.log("   optimized :", optimized);
console.log("\nDone! Open the optimized URL to compare size/format.");
