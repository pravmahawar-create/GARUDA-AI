import { getFounderBrandAssets } from "./founderAssetResolver";

const founderAssets = getFounderBrandAssets();

const brandAssetMap = {
  sigil: {
    candidates: founderAssets.sigil.candidates,
    fallback: founderAssets.sigil.fallback
  },
  branding: {
    candidates: founderAssets.logo.candidates,
    fallback: founderAssets.logo.fallback
  },
  kingdom: {
    candidates: founderAssets.kingdom.candidates,
    fallback: founderAssets.kingdom.fallback
  },
  garuda: {
    candidates: founderAssets.logo.candidates,
    fallback: founderAssets.logo.fallback
  },
  guardian: {
    candidates: [
      "/assets/garuda/guardian-placeholder.svg"
    ],
    fallback: "/assets/garuda/guardian-placeholder.svg"
  },
  creative: {
    candidates: [
      "/assets/creative/creative-placeholder.svg"
    ],
    fallback: "/assets/garuda/garuda-placeholder.svg"
  },
  audio: {
    candidates: [],
    fallback: ""
  },
  video: {
    candidates: [],
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
