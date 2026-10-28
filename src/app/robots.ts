import type { MetadataRoute } from "next";
import { SITE } from "./site";

/** Every crawler welcome, and where the one page is listed (P27-98). */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${SITE.url}/sitemap.xml` };
}
