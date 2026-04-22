import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Zephlo — Turn your website into an Agent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(circle at 25% 20%, rgba(18,117,202,0.35) 0%, transparent 55%), radial-gradient(circle at 80% 80%, rgba(96,165,250,0.22) 0%, transparent 55%), #050508",
          color: "#EEEEF0",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "linear-gradient(135deg, #1275CA 0%, #60A5FA 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: "rgba(255,255,255,0.92)",
              }}
            />
          </div>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 600, letterSpacing: "-0.02em" }}>
            zephlo
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              alignSelf: "flex-start",
              gap: 12,
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 9999,
              padding: "10px 22px",
              fontSize: 22,
              color: "#9CA3AF",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 9999,
                background: "#34d399",
              }}
            />
            <div style={{ display: "flex" }}>The Agent platform for any website</div>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 96,
              fontWeight: 600,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              maxWidth: 1040,
            }}
          >
            <div style={{ display: "flex" }}>Turn your website into an&nbsp;</div>
            <div style={{ display: "flex", color: "#3B9AE8", fontStyle: "italic" }}>Agent</div>
            <div style={{ display: "flex" }}>.</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 22,
            color: "#6B6B80",
          }}
        >
          <div style={{ display: "flex" }}>Crawl. Embed. Chat. Act.</div>
          <div style={{ display: "flex" }}>zephlo.ai</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
