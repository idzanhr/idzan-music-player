import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PLATFORM_LABEL, channelEmbed, parseLink, pickBest, type ParsedLink } from "@/lib/music";
import { resolveYoutubeHandle } from "@/lib/youtube.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "One — every music link, one player" },
      { name: "description", content: "Paste Spotify, Apple Music, YouTube Music and Tidal links. Play the best option in one player." },
      { property: "og:title", content: "One — every music link, one player" },
      { property: "og:description", content: "One minimal player for all your music links." },
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

  const [channels, setChannels] = useState<Record<string, string>>({});
  const parsed = useMemo(() => {
    const seen = new Set<string>();
    return input.split(/\s+/).map(parseLink).filter((l): l is ParsedLink => {
      if (!l || seen.has(l.platform)) return false;
      seen.add(l.platform);
      return true;
    });
  }, [input]);
  useEffect(() => {
    for (const l of parsed) {
      if (l.handle && !(l.handle in channels)) {
        setChannels((c) => ({ ...c, [l.handle!]: "" }));
        resolveYoutubeHandle({ data: { handle: l.handle } })
          .then((r) => r.channelId && setChannels((c) => ({ ...c, [l.handle!]: channelEmbed(r.channelId!) })))
          .catch(() => {});
      }
    }
  }, [parsed, channels]);
  const links = parsed
    .map((l) => (l.handle ? { ...l, embed: channels[l.handle] ?? "" } : l))
    .filter((l) => l.embed);
  const best = pickBest(links);
  const current = links.find((l) => l.platform === active) ?? best;

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
    </main>
  );
}
