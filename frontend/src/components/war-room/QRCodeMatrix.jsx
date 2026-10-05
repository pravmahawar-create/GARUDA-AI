import React, { useState, useEffect } from "react";
import QRCode from "qrcode";

// Pre-computed authentic QR SVG for https://www.garudaos.in/booth-cadre (Zero-latency instant SSR / fallback)
const DEFAULT_BOOTH_CADRE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 31 31" shape-rendering="crispEdges" width="100%" height="100%"><path fill="#ffffff" d="M0 0h31v31H0z"/><path stroke="#000000" d="M1 1.5h7m2 0h1m1 0h2m2 0h6m1 0h7M1 2.5h1m5 0h1m2 0h4m4 0h1m2 0h1m1 0h1m5 0h1M1 3.5h1m1 0h3m1 0h1m1 0h1m1 0h1m3 0h1m1 0h1m1 0h1m3 0h1m1 0h3m1 0h1M1 4.5h1m1 0h3m1 0h1m1 0h2m1 0h2m4 0h3m2 0h1m1 0h3m1 0h1M1 5.5h1m1 0h3m1 0h1m1 0h2m1 0h1m1 0h3m1 0h4m1 0h1m1 0h3m1 0h1M1 6.5h1m5 0h1m1 0h1m2 0h7m4 0h1m5 0h1M1 7.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M9 8.5h3m2 0h1m1 0h2m2 0h2M1 9.5h1m1 0h5m2 0h1m2 0h1m1 0h2m1 0h1m1 0h1m2 0h5M1 10.5h1m1 0h2m3 0h5m4 0h1m1 0h2m1 0h4m3 0h1M5 11.5h1m1 0h1m1 0h1m1 0h1m1 0h1m2 0h1m1 0h2m1 0h1M1 12.5h1m1 0h4m1 0h4m3 0h1m3 0h2m2 0h2m1 0h1m1 0h1M2 13.5h1m1 0h1m2 0h1m1 0h1m1 0h1m1 0h1m2 0h3m2 0h1m4 0h2M4 14.5h2m3 0h1m2 0h4m1 0h7m1 0h1m3 0h1M1 15.5h2m1 0h4m1 0h3m1 0h4m1 0h1m2 0h2m1 0h1m1 0h2M1 16.5h2m1 0h1m1 0h1m2 0h3m2 0h1m1 0h2m2 0h2m2 0h2m2 0h1M2 17.5h3m2 0h1m1 0h1m1 0h3m1 0h2m1 0h1m1 0h1m3 0h1m1 0h2M1 18.5h2m1 0h1m1 0h1m1 0h1m2 0h3m3 0h5m1 0h3m1 0h1m1 0h1M1 19.5h1m2 0h1m1 0h4m2 0h2m2 0h3m2 0h2m1 0h1m2 0h1M1 20.5h1m2 0h1m4 0h1m1 0h3m1 0h2m5 0h4m2 0h1M1 21.5h1m1 0h5m3 0h1m4 0h1m1 0h1m2 0h5m1 0h3M9 22.5h1m1 0h2m1 0h2m1 0h1m3 0h1m3 0h5M1 23.5h7m3 0h2m1 0h4m2 0h2m1 0h1m1 0h3M1 24.5h1m5 0h1m1 0h6m4 0h3m3 0h1m3 0h1M1 25.5h1m1 0h3m1 0h1m1 0h1m1 0h2m2 0h2m1 0h1m2 0h5m1 0h2M1 26.5h1m1 0h3m1 0h1m1 0h3m1 0h1m3 0h3m4 0h1m1 0h4M1 27.5h1m1 0h3m1 0h1m1 0h1m1 0h1m2 0h4m1 0h2m2 0h6M1 28.5h1m5 0h1m2 0h2m1 0h1m2 0h2m1 0h1m1 0h1m2 0h1m1 0h1m1 0h1M1 29.5h7m1 0h1m3 0h2m3 0h3m3 0h4"/></svg>`;

export default function QRCodeMatrix({
  value = "https://www.garudaos.in/booth-cadre",
  size = 160,
  className = "",
  style = {}
}) {
  const [svgMarkup, setSvgMarkup] = useState(() => {
    // If value is the default canonical URL, use the pre-computed authentic SVG immediately
    if (value === "https://www.garudaos.in/booth-cadre") {
      return DEFAULT_BOOTH_CADRE_SVG;
    }
    return "";
  });

  useEffect(() => {
    let isMounted = true;
    if (value === "https://www.garudaos.in/booth-cadre") {
      setSvgMarkup(DEFAULT_BOOTH_CADRE_SVG);
      return;
    }

    QRCode.toString(value, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF"
      }
    })
      .then((svg) => {
        if (isMounted) setSvgMarkup(svg);
      })
      .catch((err) => {
        console.warn("Dynamic QR generation fallback:", err);
        if (isMounted) setSvgMarkup(DEFAULT_BOOTH_CADRE_SVG);
      });

    return () => {
      isMounted = false;
    };
  }, [value]);

  return (
    <div
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFFFFF",
        overflow: "hidden",
        ...style
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        dangerouslySetInnerHTML={{
          __html: (svgMarkup || DEFAULT_BOOTH_CADRE_SVG).replace("<svg ", '<svg style="width:100%;height:100%;display:block;" ')
        }}
      />
    </div>
  );
}
