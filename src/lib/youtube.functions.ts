import { createServerFn } from "@tanstack/react-start";

// Resolves a YouTube @handle to its channel ID by reading the public channel page.
export const resolveYoutubeHandle = createServerFn({ method: "GET" })
  .inputValidator((d: { handle: string }) => ({ handle: String(d.handle).replace(/[^\w.\-@]/g, "").slice(0, 100) }))
  .handler(async ({ data }) => {
    const res = await fetch(`https://www.youtube.com/${data.handle}`, {
      headers: { "user-agent": "Mozilla/5.0", "accept-language": "en" },
    });
    if (!res.ok) return { channelId: null as string | null };
    const html = await res.text();
    const m =
      html.match(/"externalId":"(UC[\w-]{22})"/) ??
      html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/) ??
      html.match(/"channelId":"(UC[\w-]{22})"/);
    return { channelId: m ? m[1] : null };
  });
