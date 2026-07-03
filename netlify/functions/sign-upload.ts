/**
 * POST /api/admin/sign-upload   (owner only)
 *
 * Returns a short-lived Cloudinary signature so the admin can upload images
 * directly from the browser without exposing the API secret. Neon stores only
 * the returned secure URL.
 */
import { requireOwner } from "../lib/auth";
import { signUpload } from "../lib/cloudinary";
import { json, requireMethod, toErrorResponse } from "../lib/http";

export default async (req: Request): Promise<Response> => {
  try {
    requireMethod(req, "POST");
    await requireOwner(req);
    return json(signUpload());
  } catch (err) {
    return toErrorResponse(err);
  }
};

export const config = { path: "/api/admin/sign-upload" };
