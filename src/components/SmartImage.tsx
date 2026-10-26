import { useState } from "react";

/**
 * Image with a branded LUXORA placeholder fallback. If a remote photo
 * fails to load (offline, hotlink block), the card shows an elegant
 * navy/gold monogram tile instead of a broken-image icon.
 */
export default function SmartImage({
  src,
  alt,
  className = "",
  eager = false,
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (failed) {
    return (
      <div
        className={`img-fallback ${className}`.trim()}
        role="img"
        aria-label={alt}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" width="42" height="42">
          <path
            d="M12 3 2 21h20L12 3Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M12 10v6M9.4 13h5.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span>LUXORA</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      className={`${className} ${loaded ? "is-loaded" : "is-loading"}`.trim()}
      onError={() => setFailed(true)}
      onLoad={() => setLoaded(true)}
    />
  );
}
