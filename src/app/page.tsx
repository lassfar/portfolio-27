import Hero from "#/components/pages/home/Hero";
import Skills from "#/components/pages/home/skills/Skills";

export default function Home() {
  return (
    <main className="bg-rich-black">
      {/* The cosmic journey: star → explosion → Saturn → About reveal, all in
          one pinned sequence inside Hero. */}
      <Hero />
      {/* Skills — the constellation of tools and creative pulls. */}
      <Skills />
    </main>
  );
}
