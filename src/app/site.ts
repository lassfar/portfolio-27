/**
 * The site as search engines and link previews see it (P27-98). Its address is Netlify's primary
 * domain at build (`URL`): lassfar.com once it points here, the netlify.app address until then.
 */
export const SITE = {
  url: process.env.URL ?? "https://www.lassfar.com",
  name: "Aymane Lassfar",
  role: "Frontend Developer",
  title: "Aymane Lassfar — Frontend Developer",
  description:
    "Aymane Lassfar, frontend developer. A quiet maker of small universes: a story told in dots and light, from the craft I build with to the places I photograph.",
  /** The page's background (--color-rich-black): the browser's bar on phones, the images'. */
  background: "#19191C",
} as const;
