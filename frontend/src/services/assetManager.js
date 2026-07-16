import { getFounderBrandAssets } from "./founderAssetResolver";

const founderAssets = getFounderBrandAssets();

const assetCatalog = {
  sigil: {
    candidates: founderAssets.sigil.candidates,
    fallback: founderAssets.sigil.fallback
  },
  garuda: {
    candidates: founderAssets.logo.candidates,
    fallback: founderAssets.logo.fallback
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
    candidates: founderAssets.kingdom.candidates,
    fallback: founderAssets.kingdom.fallback
  },
  branding: {
    candidates: founderAssets.logo.candidates,
    fallback: founderAssets.logo.fallback
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
