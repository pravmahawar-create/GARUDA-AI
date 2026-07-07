const assetCatalog = {
  sigil: {
    candidates: [
      "/assets/garuda/sigil.png",
      "/assets/garuda/sigil.webp",
      "/assets/garuda/sigil.svg",
      "/assets/garuda/sigil-placeholder.svg"
    ],
    fallback: "/assets/garuda/sigil-placeholder.svg"
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
  kingdom: {
    candidates: [
      "/assets/kingdom/kingdom.png",
      "/assets/kingdom/kingdom.webp",
      "/assets/kingdom/kingdom.svg",
      "/assets/kingdom/kingdom-placeholder.svg"
    ],
    fallback: "/assets/kingdom/kingdom-placeholder.svg"
  },
  branding: {
    candidates: [
      "/assets/garuda/branding.png",
      "/assets/garuda/branding.webp",
      "/assets/garuda/branding.svg",
      "/assets/garuda/garuda-placeholder.svg"
    ],
    fallback: "/assets/garuda/garuda-placeholder.svg"
  },
  audio: {
    candidates: [
      "/assets/audio/ambient.mp3",
      "/assets/audio/ambient.wav",
      "/assets/audio/audio-placeholder.txt"
    ],
    fallback: "/assets/audio/audio-placeholder.txt"
  },
  video: {
    candidates: [
      "/assets/video/arrival.webm",
      "/assets/video/arrival.mp4",
      "/assets/video/video-placeholder.txt"
    ],
    fallback: "/assets/video/video-placeholder.txt"
  }
};

export function resolveAsset(kind = "sigil") {
  const config = assetCatalog[kind] || assetCatalog.sigil;
  return {
    candidates: config.candidates,
    fallback: config.fallback
  };
}

export function getAssetFallback(kind = "sigil") {
  return resolveAsset(kind).fallback;
}

export function getAssetCandidates(kind = "sigil") {
  return resolveAsset(kind).candidates;
}
