/**
 * Small HTTP helpers for Netlify Functions v2 (web-standard Request/Response).
 */

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...JSON_HEADERS, ...headers },
  });
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Convert any thrown value into a JSON error Response. */
export function toErrorResponse(err: unknown): Response {
  if (err instanceof HttpError) {
    return json({ error: err.message }, err.status);
  }
  console.error("[in-alpes] unhandled error:", err);
  return json({ error: "internal_error" }, 500);
}

/** Reject any method not in the allow-list (405). */
export function requireMethod(req: Request, ...methods: string[]): void {
  if (!methods.includes(req.method)) {
    throw new HttpError(405, `method_not_allowed: use ${methods.join(", ")}`);
  }
}

export async function readJson<T>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new HttpError(400, "invalid_json_body");
  }
}
