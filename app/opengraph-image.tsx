import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "FTC Flow: run your FIRST Tech Challenge team in one place";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [logo, plexSemiBold, plexRegular] = await Promise.all([
    readFile(join(process.cwd(), "public/logo.png")),
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff",
      ),
    ),
    readFile(
      join(
        process.cwd(),
        "node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff",
      ),
    ),
  ]);

  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          backgroundImage:
            "radial-gradient(circle at 50% 130%, rgba(45,140,255,0.25), transparent 62%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={144} height={144} alt="" style={{ borderRadius: 32 }} />
        <div
          style={{
            marginTop: 40,
            fontSize: 76,
            fontFamily: "IBM Plex Sans",
            fontWeight: 600,
            color: "#f0f0f5",
            letterSpacing: "-2px",
          }}
        >
          FTC Flow
        </div>
        <div
          style={{
            marginTop: 14,
            fontSize: 30,
            fontFamily: "IBM Plex Sans",
            fontWeight: 400,
            color: "#a0a0b0",
          }}
        >
          Run your FTC team in one place
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "IBM Plex Sans",
          data: plexSemiBold,
          weight: 600,
          style: "normal",
        },
        {
          name: "IBM Plex Sans",
          data: plexRegular,
          weight: 400,
          style: "normal",
        },
      ],
    },
  );
}
