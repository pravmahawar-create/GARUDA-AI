const brandAssetMap = {
  sigil: {
    candidates: [
      "/assets/sigil/sigil.png",
      "/assets/sigil/sigil.svg",
      "/assets/sigil/garuda-sigil.png",
      "/assets/sigil/garuda-sigil.svg"
    ],
    fallback: "/assets/sigil/sigil-placeholder.svg"
  },
  branding: {
    candidates: [
      "/assets/branding/branding.png",
      "/assets/branding/branding.svg",
      "/assets/branding/garuda-branding.png",
      "/assets/branding/garuda-branding.svg"
    ],
    fallback: "/assets/branding/branding-placeholder.svg"
  },
  kingdom: {
    candidates: [
      "/assets/kingdom/kingdom.png",
      "/assets/kingdom/kingdom.svg",
      "/assets/kingdom/arrival-portal.png",
      "/assets/kingdom/arrival-portal.svg"
    ],
    fallback: "/assets/kingdom/kingdom-placeholder.svg"
  },
  creative: {
    candidates: [
      "/assets/creative/creative.png",
      "/assets/creative/creative.svg",
      "/assets/creative/creative-studio.png",
      "/assets/creative/creative-studio.svg"
    ],
    fallback: "/assets/creative/creative-placeholder.svg"
  }
};

export function getBrandAsset(kind = "sigil") {
  const config = brandAssetMap[kind] || brandAssetMap.sigil;
  return {
    candidates: config.candidates,
    fallback: config.fallback
  };
}

export function getBrandAssetSrc(kind = "sigil") {
  return getBrandAsset(kind).candidates[0];
}

export function getBrandAssetFallback(kind = "sigil") {
  return getBrandAsset(kind).fallback;
}

export function createBrandAssetHandler(kind = "sigil") {
  const fallback = getBrandAssetFallback(kind);
  return (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallback;
  };
}
