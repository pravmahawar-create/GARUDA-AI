import { getFounderBrandAssets } from "./founderAssetResolver";

const founderAssets = getFounderBrandAssets();

const brandAssetMap = {
  branding: {
    candidates: founderAssets.logo.candidates,
    fallback: founderAssets.logo.fallback
  },
  garuda: {
    candidates: founderAssets.logo.candidates,
    fallback: founderAssets.logo.fallback
  },
  creative: {
    candidates: [
      "/assets/creative/creative-placeholder.svg"
    ],
    fallback: "/assets/garuda/garuda-placeholder.svg"
  }
};

export function getBrandAsset(kind = "branding") {
  const config = brandAssetMap[kind] || brandAssetMap.branding;
  return {
    candidates: config.candidates,
    fallback: config.fallback
  };
}

export function getBrandAssetSrc(kind = "branding") {
  return getBrandAsset(kind).candidates[0];
}

export function getBrandAssetFallback(kind = "branding") {
  return getBrandAsset(kind).fallback;
}

export function createBrandAssetHandler(kind = "branding") {
  const fallback = getBrandAssetFallback(kind);
  return (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallback;
  };
}
