import { ImageResponse } from "next/og";

const SIZES = new Set([180, 192, 512]);

/**
 * PNG app icons for the manifest and iOS home screen (PWA-01), drawn from the same shape as icon.svg.
 * `?maskable=1` adds the safe-zone padding Android expects for adaptive icons.
 */
export async function GET(request: Request, { params }: { params: Promise<{ size: string }> }) {
  const size = Number((await params).size);
  if (!SIZES.has(size)) return new Response("Not found", { status: 404 });
  const maskable = new URL(request.url).searchParams.get("maskable") === "1";
  const glyph = Math.round(size * (maskable ? 0.5 : 0.62));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FCD535",
          borderRadius: maskable || size === 180 ? 0 : size * 0.22,
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none" stroke="#181A20" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
          <path d="M9 8h6M9 12h6" />
        </svg>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
  );
}
