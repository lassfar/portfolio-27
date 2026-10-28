import type { MetadataRoute } from "next";
import { SITE } from "./site";

/** The site's one page (P27-98). */
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE.url, changeFrequency: "monthly", priority: 1 }];
}
