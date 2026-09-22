'use client';

import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-14 h-14',
};

const ICON_CLASS: Record<AvatarSize, string> = {
  sm: 'w-[55%] h-[55%]',
  md: 'w-[58%] h-[58%]',
  lg: 'w-[60%] h-[60%]',
  xl: 'w-[62%] h-[62%]',
};

export interface ChatUserAvatarProps {
  src?: string | null;
  alt?: string;
  size?: AvatarSize;
  /** Group chat → Users icon instead of person silhouette */
  isGroup?: boolean;
  online?: boolean;
  className?: string;
  ringClassName?: string;
}

/** WhatsApp-style default: muted circle + light person silhouette (no letter). */
function WhatsAppPersonPlaceholder({ size, isGroup }: { size: AvatarSize; isGroup?: boolean }) {
  if (isGroup) {
    return (
      <div
        className={`${SIZE_CLASS[size]} rounded-full bg-[#6a7175] flex items-center justify-center shrink-0`}
        aria-hidden
      >
        <Users className={`${ICON_CLASS[size]} text-[#dfe5e7]`} strokeWidth={2} />
      </div>
    );
  }

  return (
    <div
      className={`${SIZE_CLASS[size]} rounded-full bg-[#6a7175] flex items-center justify-center overflow-hidden shrink-0`}
      aria-hidden
    >
      <svg
        viewBox="0 0 212 212"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#cfd4d6"
          d="M106.017 0C47.48 0 0 47.48 0 106.017s47.48 106.017 106.017 106.017 106.017-47.48 106.017-106.017S164.554 0 106.017 0z"
        />
        <path
          fill="#fff"
          d="M105.99 135.276c-25.633 0-46.646-8.288-46.646-19.688 0-11.4 21.013-20.623 46.646-20.623s46.646 9.223 46.646 20.623c0 11.4-21.013 19.688-46.646 19.688zm0-89.887c13.827 0 25.022 11.195 25.022 25.022S119.817 95.433 105.99 95.433 80.968 84.238 80.968 70.411s11.195-25.022 25.022-25.022z"
        />
      </svg>
    </div>
  );
}

/**
 * Chat avatar: real profile photo when available, else WhatsApp-style person placeholder.
 */
export function ChatUserAvatar({
  src,
  alt = '',
  size = 'lg',
  isGroup = false,
  online = false,
  className = '',
  ringClassName = 'border-[#111b21]',
}: ChatUserAvatarProps) {
  const resolved = src ? resolveMediaUrl(src) : '';
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolved]);

  const showPhoto = !!resolved && !failed;

  return (
    <div className={`relative shrink-0 ${className}`}>
      {showPhoto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolved}
          alt={alt}
          className={`${SIZE_CLASS[size]} rounded-full object-cover bg-[#2a3942]`}
          onError={() => setFailed(true)}
        />
      ) : (
        <WhatsAppPersonPlaceholder size={size} isGroup={isGroup} />
      )}
      {online && (
        <span
          className={`absolute bottom-0 end-0 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#25d366] border-2 ${ringClassName} rounded-full`}
        />
      )}
    </div>
  );
}
