import React, { useEffect } from "react";

/**
 * SEOHead Component
 * Dynamically updates document title, meta description, canonical link,
 * OpenGraph / Twitter tags, and injects route-specific Schema.org JSON-LD structured data.
 */
export default function SEOHead({
  title = "GARUDA AI — AI Operating System for Autonomous Business Execution",
  description = "GARUDA AI is an AI Operating System for governed business automation, software execution, revenue operations, and autonomous multi-agent workflows.",
  canonical = "https://www.garudaos.in/",
  noindex = false,
  ogType = "website",
  schema = null
}) {
  useEffect(() => {
    // 1. Document Title
    document.title = title;

    // 2. Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;

    // 3. Robots Meta (index/noindex)
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement("meta");
      metaRobots.name = "robots";
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = noindex
      ? "noindex, nofollow"
      : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

    // 4. Canonical Link
    let linkCanonical = document.querySelector('link[rel="canonical"]');
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.rel = "canonical";
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.href = canonical;

    // 5. OpenGraph Tags
    const setMetaProperty = (property, content) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("property", property);
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMetaProperty("og:title", title);
    setMetaProperty("og:description", description);
    setMetaProperty("og:url", canonical);
    setMetaProperty("og:type", ogType);
    setMetaProperty("og:site_name", "GARUDA AI");

    // 6. Twitter Tags
    const setMetaName = (name, content) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.name = name;
        document.head.appendChild(el);
      }
      el.content = content;
    };

    setMetaName("twitter:title", title);
    setMetaName("twitter:description", description);
    setMetaName("twitter:url", canonical);

    // 7. Route Specific JSON-LD Schema
    const scriptId = "garuda-route-schema";
    let schemaScript = document.getElementById(scriptId);
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement("script");
        schemaScript.id = scriptId;
        schemaScript.type = "application/ld+json";
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }

    return () => {
      // Clean up route-specific schema script on unmount
      const existing = document.getElementById(scriptId);
      if (existing) existing.remove();
    };
  }, [title, description, canonical, noindex, ogType, schema]);

  return null;
}
