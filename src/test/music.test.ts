import { describe, it, expect } from "vitest";
import { parseLink, pickBest } from "@/lib/music";

describe("music links", () => {
  it("parses spotify", () => {
    expect(parseLink("https://open.spotify.com/track/abc123")?.embed).toBe("https://open.spotify.com/embed/track/abc123");
  });
  it("parses youtube music", () => {
    expect(parseLink("https://music.youtube.com/watch?v=xyz")?.embed).toBe("https://www.youtube.com/embed/xyz");
  });
  it("parses deezer", () => {
    expect(parseLink("https://www.deezer.com/hr/track/680518")?.embed).toBe("https://widget.deezer.com/widget/dark/track/680518");
    expect(parseLink("https://www.deezer.com/us/artist/182")?.embed).toBe("https://widget.deezer.com/widget/dark/artist/182/top_tracks");
    expect(parseLink("https://link.deezer.com/s/abc123")?.short).toBe(true);
  });
  it("parses tidal", () => {
    expect(parseLink("https://tidal.com/browse/track/42")?.embed).toBe("https://embed.tidal.com/tracks/42");
  });
  it("prefers youtube over spotify", () => {
    const l = [parseLink("https://open.spotify.com/track/a")!, parseLink("https://youtu.be/b")!];
    expect(pickBest(l)?.platform).toBe("youtube");
  });
});
