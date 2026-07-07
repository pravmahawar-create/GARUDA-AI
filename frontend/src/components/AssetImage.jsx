import React, { useEffect, useMemo, useState } from "react";
import { getAssetCandidates, getAssetFallback } from "../services/assetManager";

export default function AssetImage({ kind = "sigil", alt = "GARUDA asset", className = "", ...props }) {
  const candidates = useMemo(() => getAssetCandidates(kind), [kind]);
  const fallback = useMemo(() => getAssetFallback(kind), [kind]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [kind]);

  const src = index < candidates.length ? candidates[index] : fallback;

  const handleError = () => {
    if (index < candidates.length - 1) {
      setIndex((value) => value + 1);
    }
  };

  return <img className={className} src={src} alt={alt} onError={handleError} {...props} />;
}
