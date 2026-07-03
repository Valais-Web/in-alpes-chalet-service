/**
 * Browser-side Cloudinary upload for the admin editor.
 *
 * The API secret never reaches the client: we ask our own signed-upload
 * function for a short-lived signature, then POST the file straight to
 * Cloudinary. Only the resulting secure URL is kept (and later stored in Neon).
 */

interface SignedUpload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
}

/** Thrown when uploads aren't available (dev/stub mode or Cloudinary unset). */
export class UploadUnavailableError extends Error {}

async function getSignature(): Promise<SignedUpload> {
  let res: Response;
  try {
    res = await fetch("/api/admin/sign-upload", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    throw new UploadUnavailableError("upload_endpoint_unreachable");
  }
  if (res.status === 503) throw new UploadUnavailableError("cloudinary_not_configured");
  if (!res.ok) throw new Error(`sign-upload failed: ${res.status}`);
  return res.json() as Promise<SignedUpload>;
}

/** Upload one file to Cloudinary; resolves to its secure URL. */
export async function uploadImage(file: File): Promise<string> {
  const sig = await getSignature();

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sig.apiKey);
  form.append("timestamp", String(sig.timestamp));
  form.append("folder", sig.folder);
  form.append("signature", sig.signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`cloudinary upload failed: ${res.status} ${detail}`);
  }
  const data = (await res.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error("cloudinary: missing secure_url");
  return data.secure_url;
}
