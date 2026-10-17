export type Platform = "youtube" | "spotify" | "apple" | "tidal";

export const PLATFORM_LABEL: Record<Platform, string> = {
  youtube: "YouTube Music",
  spotify: "Spotify",
  apple: "Apple Music",
  tidal: "Tidal",
};

// Ranked by how much of the song plays in an embedded player without sign-in.
export const PLATFORM_RANK: Platform[] = ["youtube", "spotify", "apple", "tidal"];

export interface ParsedLink {
  platform: Platform;
  url: string;
  embed: string;
}

export function parseLink(raw: string): ParsedLink | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, "");
  if (host === "open.spotify.com") {
    const m = u.pathname.match(/\/(track|album|playlist|episode)\/([A-Za-z0-9]+)/);
    if (m) return { platform: "spotify", url: raw, embed: `https://open.spotify.com/embed/${m[1]}/${m[2]}` };
  }
  if (host === "music.apple.com") {
    return { platform: "apple", url: raw, embed: `https://embed.music.apple.com${u.pathname}${u.search}` };
  }
  if (host === "music.youtube.com" || host === "youtube.com" || host === "youtu.be") {
    const id = host === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v");
    if (id) return { platform: "youtube", url: raw, embed: `https://www.youtube.com/embed/${id}` };
  }
  if (host === "tidal.com" || host === "listen.tidal.com") {
    const m = u.pathname.match(/\/(track|album)\/(\d+)/);
    if (m) return { platform: "tidal", url: raw, embed: `https://embed.tidal.com/${m[1]}s/${m[2]}` };
  }
  return null;
}

export function pickBest(links: ParsedLink[]): ParsedLink | null {
  return [...links].sort((a, b) => PLATFORM_RANK.indexOf(a.platform) - PLATFORM_RANK.indexOf(b.platform))[0] ?? null;
}

export async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  if (!artist || !title) return null;
  try {
    const r = await fetch(
      `https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`,
    );
    if (!r.ok) return null;
    const d = await r.json();
    return d.plainLyrics || null;
  } catch {
    return null;
  }
}
