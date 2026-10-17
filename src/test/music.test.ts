import { describe, it, expect } from "vitest";
import { parseLink, pickBest } from "@/lib/music";

describe("music links", () => {
  it("parses spotify", () => {
    expect(parseLink("https://open.spotify.com/track/abc123")?.embed).toBe("https://open.spotify.com/embed/track/abc123");
  });
  it("parses youtube music", () => {
    expect(parseLink("https://music.youtube.com/watch?v=xyz")?.embed).toBe("https://www.youtube.com/embed/xyz");
  });
  it("parses tidal", () => {
    expect(parseLink("https://tidal.com/browse/track/42")?.embed).toBe("https://embed.tidal.com/tracks/42");
  });
  it("prefers youtube over spotify", () => {
    const l = [parseLink("https://open.spotify.com/track/a")!, parseLink("https://youtu.be/b")!];
    expect(pickBest(l)?.platform).toBe("youtube");
  });
});
