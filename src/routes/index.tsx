import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PLATFORM_LABEL, fetchLyrics, parseLink, pickBest, type ParsedLink } from "@/lib/music";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "One — every music link, one player" },
      { name: "description", content: "Paste Spotify, Apple Music, YouTube Music and Tidal links. Play the best option with lyrics." },
      { property: "og:title", content: "One — every music link, one player" },
      { property: "og:description", content: "One minimal player for all your music links, with lyrics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [input, setInput] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [loadingLyrics, setLoadingLyrics] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("one-player");
    if (s) {
      const d = JSON.parse(s);
      setTitle(d.title ?? ""); setArtist(d.artist ?? ""); setInput(d.input ?? "");
    }
  }, []);
  useEffect(() => {
    localStorage.setItem("one-player", JSON.stringify({ title, artist, input }));
  }, [title, artist, input]);

  const links = useMemo(() => {
    const seen = new Set<string>();
    return input.split(/\s+/).map(parseLink).filter((l): l is ParsedLink => {
      if (!l || seen.has(l.platform)) return false;
      seen.add(l.platform);
      return true;
    });
  }, [input]);
  const best = pickBest(links);
  const current = links.find((l) => l.platform === active) ?? best;

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoadingLyrics(true);
      setLyrics(await fetchLyrics(artist.trim(), title.trim()));
      setLoadingLyrics(false);
    }, 600);
    return () => clearTimeout(t);
  }, [artist, title]);

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-16">
      <h1 className="font-display text-sm tracking-[0.3em] text-muted-foreground uppercase">One</h1>

      <div className="mt-10 space-y-1">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" className="field text-3xl font-display" />
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist" className="field text-lg text-muted-foreground" />
      </div>

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Paste links — Spotify, Apple Music, YouTube Music, Tidal"
        rows={3}
        className="mt-8 w-full resize-none rounded-lg border border-border bg-card p-4 text-sm outline-none focus:border-primary"
      />

      {links.length > 0 && current && (
        <section className="mt-8">
          <div className="flex flex-wrap gap-2">
            {links.map((l) => (
              <button
                key={l.platform}
                onClick={() => setActive(l.platform)}
                className={`chip ${l.platform === current.platform ? "chip-active" : ""}`}
              >
                {PLATFORM_LABEL[l.platform]}
                {l.platform === best?.platform && <span className="ml-2 text-primary">★</span>}
              </button>
            ))}
          </div>
          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
            <iframe
              key={current.embed}
              src={current.embed}
              className={`w-full ${current.platform === "youtube" ? "aspect-video" : "h-[175px]"}`}
              allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture"
              title={PLATFORM_LABEL[current.platform]}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">★ Best option — plays the most without sign-in.</p>
        </section>
      )}

      <section className="mt-12">
        <h2 className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Lyrics</h2>
        <div className="mt-4 whitespace-pre-line text-lg leading-relaxed text-foreground/90">
          {loadingLyrics ? <span className="text-muted-foreground">Searching…</span>
            : lyrics ?? <span className="text-muted-foreground">{title && artist ? "No lyrics found." : "Enter title and artist to load lyrics."}</span>}
        </div>
      </section>
    </main>
  );
}
