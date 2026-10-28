import { CONTACT_LINKS } from "#/components/pages/home/contact/config";
import { SITE } from "./site";

/**
 * Who this is, for search engines (P27-98): a Person (name, role, the profiles that are theirs)
 * and the WebSite it publishes, as JSON-LD. `<` escaped, as Next advises for inline JSON.
 */
const GRAPH = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE.url}/#person`,
      name: SITE.name,
      jobTitle: SITE.role,
      url: SITE.url,
      sameAs: CONTACT_LINKS.filter((link) => link.external).map((link) => link.href),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: "en",
      publisher: { "@id": `${SITE.url}/#person` },
    },
  ],
};

const JsonLd = () => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(GRAPH).replace(/</g, "\\u003c") }}
  />
);

export default JsonLd;
