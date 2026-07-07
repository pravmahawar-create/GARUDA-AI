import React, { useEffect, useMemo, useState } from "react";
import { getBrandAsset } from "../services/brandAssetManager";

export default function BrandAssetImage({ kind = "sigil", alt = "GARUDA brand asset", className = "", ...props }) {
  const asset = useMemo(() => getBrandAsset(kind), [kind]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setAttempt(0);
  }, [kind]);

  const src = attempt < asset.candidates.length ? asset.candidates[attempt] : asset.fallback;

  const handleError = () => {
    if (attempt < asset.candidates.length) {
      setAttempt((value) => value + 1);
    }
  };

  return <img className={className} src={src} alt={alt} onError={handleError} {...props} />;
}
