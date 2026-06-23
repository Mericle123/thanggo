'use client';

import type { ReactNode } from 'react';

type MarqueeProps = {
  children: ReactNode;
  className?: string;
};

export default function Marquee({ children, className = '' }: MarqueeProps) {
  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="animate-marquee flex w-max items-center gap-2">
        <div className="flex items-center gap-2 pr-2">{children}</div>
        <div className="flex items-center gap-2 pr-2" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
