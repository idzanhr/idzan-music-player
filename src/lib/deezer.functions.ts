import { createServerFn } from "@tanstack/react-start";

// Resolves a link.deezer.com short link to the real deezer.com URL by following the redirect.
export const resolveDeezerShortLink = createServerFn({ method: "GET" })
  .inputValidator((d: { url: string }) => ({ url: String(d.url).slice(0, 500) }))
  .handler(async ({ data }) => {
    try {
      const res = await fetch(data.url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } });
      if (/^https:\/\/(www\.)?deezer\.com\//.test(res.url)) return { url: res.url as string | null };
      return { url: null as string | null };
    } catch {
      return { url: null as string | null };
    }
  });
