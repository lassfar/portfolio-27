import Hero from "#/components/pages/home/Hero";

export default function Home() {
  return (
    <main className="bg-rich-black">
      {/* The whole cosmic journey lives in one pinned sequence inside Hero:
          star → explosion → Saturn → About reveal → The Craft (folded in as an
          overlay) → the Saturn flies away out into the wider voyage. */}
      <Hero />
    </main>
  );
}
