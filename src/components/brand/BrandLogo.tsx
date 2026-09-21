'use client';

/**
 * Official project logo — always from /brand/egypt-logo.jpeg (copied from Image/Egypt Logo.jpeg).
 * Uses native <img> so it never fails due to Next Image optimizer.
 */
export function BrandLogo({
  size = 40,
  className = '',
  priority = false,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <div
      className={`brand-logo-ring rounded-2xl overflow-hidden bg-white shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/egypt-logo.jpeg"
        alt="النهارده في مصر"
        width={size}
        height={size}
        className="object-cover w-full h-full block"
        decoding="async"
        {...(priority ? { fetchPriority: 'high' as const } : {})}
      />
    </div>
  );
}
