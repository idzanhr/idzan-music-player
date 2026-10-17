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
  /** YouTube @handle that must be resolved to a channel before it can play. */
  handle?: string;
}

/** All uploads of a YouTube channel play as a playlist: UCxxxx -> UUxxxx. */
export function channelEmbed(channelId: string) {
  return `https://www.youtube.com/embed/videoseries?list=UU${channelId.slice(2)}`;
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
    const m = u.pathname.match(/\/(track|album|playlist|episode|artist)\/([A-Za-z0-9]+)/);
    if (m) return { platform: "spotify", url: raw, embed: `https://open.spotify.com/embed/${m[1]}/${m[2]}` };
  }
  if (host === "music.apple.com") {
    return { platform: "apple", url: raw, embed: `https://embed.music.apple.com${u.pathname}${u.search}` };
  }
  if (host === "music.youtube.com" || host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be") {
    const id = host === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v");
    if (id) return { platform: "youtube", url: raw, embed: `https://www.youtube.com/embed/${id}` };
    const list = u.searchParams.get("list");
    if (list) return { platform: "youtube", url: raw, embed: `https://www.youtube.com/embed/videoseries?list=${list}` };
    const ch = u.pathname.match(/^\/channel\/(UC[\w-]{22})/);
    if (ch) return { platform: "youtube", url: raw, embed: channelEmbed(ch[1]!) };
    const h = u.pathname.match(/^\/(@[\w.\-%]+)/);
    if (h) return { platform: "youtube", url: raw, embed: "", handle: decodeURIComponent(h[1]!) };
  }
  if (host === "tidal.com" || host === "listen.tidal.com") {
    const m = u.pathname.match(/\/(track|album|playlist)\/([\w-]+)/);
    if (m) return { platform: "tidal", url: raw, embed: `https://embed.tidal.com/${m[1]}s/${m[2]}` };
  }
  return null;
}

export function pickBest(links: ParsedLink[]): ParsedLink | null {
  return [...links].sort((a, b) => PLATFORM_RANK.indexOf(a.platform) - PLATFORM_RANK.indexOf(b.platform))[0] ?? null;
}


