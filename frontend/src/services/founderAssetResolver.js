const bundledAssets = import.meta.glob("../assets/**/*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  import: "default"
});

const bundledByName = Object.entries(bundledAssets).reduce((acc, [, assetUrl]) => {
  const fileName = assetUrl.split("/").pop()?.toLowerCase();
  if (fileName && !acc[fileName]) {
    acc[fileName] = assetUrl;
  }
  return acc;
}, {});

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function resolveDetected(preferredFileNames = [], publicCandidates = [], gracefulFallback = "") {
  const detected = preferredFileNames
    .map((name) => bundledByName[name.toLowerCase()])
    .filter(Boolean);

  const candidates = unique([...detected, ...publicCandidates]);
  const fallback = candidates[0] || gracefulFallback;

  return { candidates, fallback };
}

export function getFounderBrandAssets() {
  const logo = resolveDetected(
    ["garuda-logo.png", "garuda-logo.webp", "garuda-logo.svg", "garuda-primary-identity.svg"],
    [
      "/assets/branding/garuda-logo.png",
      "/assets/branding/garuda-logo.webp",
      "/assets/branding/garuda-logo.svg",
      "/assets/branding/garuda-primary-identity.svg",
      "/assets/branding/branding-placeholder.svg",
      "/assets/garuda/garuda-placeholder.svg"
    ],
    "/assets/branding/branding-placeholder.svg"
  );

  return { logo };
}
