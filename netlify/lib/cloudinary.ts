/**
 * Cloudinary signed uploads. The secret never leaves the server: the admin asks
 * this module for a short-lived signature, then uploads the file directly to
 * Cloudinary from the browser. Neon only ever stores the resulting URL
 * (CLAUDE.md §2 "Images").
 *
 * Uses Node's crypto — no extra dependency.
 */
import { createHash } from "node:crypto";
import { env, flags } from "./env";
import { HttpError } from "./http";

export interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/**
 * Produce the signature for a direct browser upload.
 * The browser must send exactly the signed params (folder, timestamp) plus
 * api_key + signature to `https://api.cloudinary.com/v1_1/<cloud>/image/upload`.
 */
export function signUpload(): SignedUpload {
  if (!flags.hasCloudinary) {
    throw new HttpError(503, "cloudinary_not_configured");
  }
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = env.CLOUDINARY_UPLOAD_FOLDER;

  // Signed params sorted alphabetically, joined key=value&…, secret appended.
  const toSign = `folder=${folder}&timestamp=${timestamp}`;
  const signature = createHash("sha1")
    .update(toSign + env.CLOUDINARY_API_SECRET)
    .digest("hex");

  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
  };
}
