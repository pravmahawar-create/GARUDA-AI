const brandAssetMap = {
  sigil: {
    candidates: [
      "/assets/garuda/sigil.png",
      "/assets/garuda/sigil.webp",
      "/assets/garuda/sigil.svg",
      "/assets/sigil/sigil.png",
      "/assets/sigil/sigil.svg",
      "/assets/sigil/garuda-sigil.png",
      "/assets/sigil/garuda-sigil.svg"
    ],
    fallback: "/assets/garuda/sigil-placeholder.svg"
  },
  branding: {
    candidates: [
      "/assets/garuda/branding.png",
      "/assets/garuda/branding.webp",
      "/assets/garuda/branding.svg",
      "/assets/branding/branding.png",
      "/assets/branding/branding.svg",
      "/assets/branding/garuda-branding.png",
      "/assets/branding/garuda-branding.svg"
    ],
    fallback: "/assets/garuda/garuda-placeholder.svg"
  },
  kingdom: {
    candidates: [
      "/assets/kingdom/kingdom.png",
      "/assets/kingdom/kingdom.webp",
      "/assets/kingdom/kingdom.svg",
      "/assets/kingdom/arrival-portal.png",
      "/assets/kingdom/arrival-portal.svg",
      "/assets/kingdom/kingdom-placeholder.svg"
    ],
    fallback: "/assets/kingdom/kingdom-placeholder.svg"
  },
  garuda: {
    candidates: [
      "/assets/garuda/garuda.png",
      "/assets/garuda/garuda.webp",
      "/assets/garuda/garuda.svg",
      "/assets/garuda/garuda-placeholder.svg"
    ],
    fallback: "/assets/garuda/garuda-placeholder.svg"
  },
  guardian: {
    candidates: [
      "/assets/garuda/guardian.png",
      "/assets/garuda/guardian.webp",
      "/assets/garuda/guardian.svg",
      "/assets/garuda/guardian-placeholder.svg"
    ],
    fallback: "/assets/garuda/guardian-placeholder.svg"
  },
  creative: {
    candidates: [
      "/assets/creative/creative.png",
      "/assets/creative/creative.svg",
      "/assets/creative/creative-studio.png",
      "/assets/creative/creative-studio.svg"
    ],
    fallback: "/assets/garuda/garuda-placeholder.svg"
  },
  audio: {
    candidates: [
      "/assets/audio/ambient.mp3",
      "/assets/audio/ambient.wav",
      "/assets/audio/ambient.ogg"
    ],
    fallback: ""
  },
  video: {
    candidates: [
      "/assets/video/arrival.webm",
      "/assets/video/arrival.mp4",
      "/assets/video/arrival.mov"
    ],
    fallback: ""
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
