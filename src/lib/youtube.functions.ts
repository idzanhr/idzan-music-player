import { createServerFn } from "@tanstack/react-start";

const H = { "user-agent": "Mozilla/5.0 Chrome/120", "accept-language": "en" };

/**
 * Resolves a YouTube @handle or UC channel ID to a music-only playlist
 * (the artist's "Songs"/"Song Releases" playlist, else an album) — never channel videos.
 */
export const resolveYoutubeHandle = createServerFn({ method: "GET" })
  .inputValidator((d: { handle: string }) => ({ handle: String(d.handle).replace(/[^\w.\-@]/g, "").slice(0, 100) }))
  .handler(async ({ data }) => {
    let channelId: string | null = /^UC[\w-]{22}$/.test(data.handle) ? data.handle : null;
    if (!channelId) {
      const res = await fetch(`https://www.youtube.com/${data.handle}`, { headers: H });
      if (!res.ok) return { list: null as string | null };
      const html = await res.text();
      const m =
        html.match(/"externalId":"(UC[\w-]{22})"/) ??
        html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) ??
        html.match(/"channelId":"(UC[\w-]{22})"/);
      channelId = m ? m[1]! : null;
    }
    if (!channelId) return { list: null as string | null };
    const res = await fetch(`https://music.youtube.com/channel/${channelId}`, { headers: H });
    if (!res.ok) return { list: null as string | null };
    const html = (await res.text()).replace(/\\x22/g, '"').replace(/\\x7b/g, "{").replace(/\\x5b/g, "[").replace(/\\\//g, "/");
    const songs = html.match(/"text":"(?:Songs|Song Releases)"[^}]{0,400}?"browseId":"VL((?:PL|OLAK5uy_)[\w-]+)"/);
    const album = html.match(/OLAK5uy_[\w-]+/);
    return { list: songs ? songs[1]! : album ? album[0] : null };
  });
