import React, { useEffect, useMemo, useState } from "react";
import { getBrandAsset } from "../services/brandAssetManager";

export default function BrandAssetManagerImage({ kind = "sigil", alt = "GARUDA asset", className = "", ...props }) {
  const asset = useMemo(() => getBrandAsset(kind), [kind]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [kind]);

  const src = index < asset.candidates.length ? asset.candidates[index] : asset.fallback;

  const handleError = () => {
    if (index < asset.candidates.length - 1) {
      setIndex((value) => value + 1);
    }
  };

  return <img className={className} src={src} alt={alt} onError={handleError} {...props} />;
}
