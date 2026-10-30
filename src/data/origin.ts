import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

/**
 * Base URL for /api/* calls. In the browser a relative path works; during SSR
 * (route loaders) Node's fetch needs an absolute URL, so we use the incoming
 * request's origin. On Netlify the Host header can only be one of this site's
 * own domains, so the origin is trusted.
 */
export const apiOrigin = createIsomorphicFn()
  .server(() => getRequestUrl().origin)
  .client(() => "");
