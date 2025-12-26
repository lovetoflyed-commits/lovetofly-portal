'use client';

import { useEffect } from 'react';

type GoogleAdProps = {
  slot: string;
  format?: 'auto' | 'fluid';
  layoutKey?: string;
  style?: React.CSSProperties;
  responsive?: boolean;
  className?: string;
};

export default function GoogleAd({
  slot,
  format = 'auto',
  layoutKey,
  style,
  responsive = true,
  className,
}: GoogleAdProps) {
  useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // ignore
    }
  }, [slot, format, layoutKey]);

  return (
    <ins
      className={`adsbygoogle ${className ?? ''}`}
      style={style ?? { display: 'block' }}
      data-ad-client="ca-pub-3204295995338267"
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? 'true' : 'false'}
      {...(layoutKey ? { 'data-ad-layout-key': layoutKey } : {})}
    />
  );
}
