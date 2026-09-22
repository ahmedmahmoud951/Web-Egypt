'use client';

import React from 'react';

export interface StoryRingItem {
  id: string;
  isViewedByCurrentUser?: boolean;
  status?: string;
  isExpired?: boolean;
}

export interface WhatsAppStoryRingProps {
  items?: StoryRingItem[];
  size?: number; // Size in pixels (e.g. 64 for 4rem, 56 for 3.5rem)
  strokeWidth?: number; // Ring thickness (default: 3)
  activeColor?: string; // Color of unseen status (default: #25D366 WhatsApp green)
  viewedColor?: string; // Color of viewed status (default: #64748B slate)
  gapAngle?: number; // Gap between segments in degrees (auto-calculated if not provided)
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const radians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians),
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, startAngle);
  const end = polarToCartesian(x, y, radius, endAngle);
  const delta = endAngle - startAngle;
  const largeArcFlag = delta > 180 ? 1 : 0;

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

export function WhatsAppStoryRing({
  items = [],
  size = 64,
  strokeWidth = 3,
  activeColor = '#25D366',
  viewedColor = '#64748B',
  gapAngle,
  children,
  className = '',
  onClick,
}: WhatsAppStoryRingProps) {
  // Only consider active, non-expired statuses for the ring segments
  const activeItems = items.filter((s) => (!s.status || s.status === 'Active') && !s.isExpired);
  const count = activeItems.length;

  const center = size / 2;
  const radius = (size - strokeWidth) / 2;

  // Calculate gaps dynamically based on segment count
  const effectiveGap =
    gapAngle !== undefined
      ? gapAngle
      : count <= 1
      ? 0
      : count === 2
      ? 16
      : count === 3
      ? 12
      : count <= 6
      ? 8
      : Math.max(3, Math.floor(360 / (count * 5)));

  const arcSpan = count > 0 ? (360 - count * effectiveGap) / count : 360;

  const hasUnseen = activeItems.some((s) => !s.isViewedByCurrentUser);

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 transition-transform ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      onClick={onClick}
    >
      {/* SVG segmented or continuous story ring */}
      {count > 0 ? (
        <svg
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ opacity: hasUnseen ? 1 : 0.65 }}
        >
          {count === 1 ? (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={activeItems[0].isViewedByCurrentUser ? viewedColor : activeColor}
              strokeWidth={strokeWidth}
            />
          ) : (
            activeItems.map((item, index) => {
              const startAngle = index * (arcSpan + effectiveGap) + effectiveGap / 2;
              const endAngle = startAngle + arcSpan;
              const isViewed = !!item.isViewedByCurrentUser;
              const color = isViewed ? viewedColor : activeColor;

              return (
                <path
                  key={item.id || index}
                  d={describeArc(center, center, radius, startAngle, endAngle)}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                />
              );
            })
          )}
        </svg>
      ) : (
        /* Inactive or expired status ring */
        <div
          className="absolute inset-0 rounded-full border border-slate-600/40 pointer-events-none"
          style={{ borderWidth: Math.max(1, strokeWidth - 1) }}
        />
      )}

      {/* Inner Content (Avatar, Video, or Image) with gap between ring and content */}
      <div
        className="rounded-full overflow-hidden w-full h-full flex items-center justify-center"
        style={{
          padding: strokeWidth + 2,
        }}
      >
        <div className="w-full h-full rounded-full overflow-hidden relative bg-[#0F1B2D]">
          {children}
        </div>
      </div>
    </div>
  );
}
