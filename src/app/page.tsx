import Hero from "#/components/pages/home/Hero";
import EarthGallery from "#/components/pages/home/gallery/EarthGallery";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Home() {
  return (
    <main className="bg-rich-black">
      {/* The whole cosmic journey lives in one pinned sequence inside Hero:
          star → explosion → Saturn → About reveal → The Craft (folded in as an
          overlay) → the Saturn flies away out into the wider voyage → dive to
          the interactive Earth. */}
      <Hero />

      {/* Fixed DOM overlays (crisp media) opened by the Earth photo-pins. */}
      <EarthGallery />
    </main>
  );
}
