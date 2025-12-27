'use client';

import { useEffect, useRef } from 'react';

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
  const adRef = useRef<HTMLModElement>(null);
  const isAdPushed = useRef(false);

  useEffect(() => {
    // Only push once per ad instance
    if (isAdPushed.current) return;
    
    try {
      // Check if the ad element exists and hasn't been filled yet
      const adElement = adRef.current;
      if (adElement && !adElement.hasAttribute('data-adsbygoogle-status')) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isAdPushed.current = true;
      }
    } catch (e) {
      console.error('AdSense error:', e);
    }
  }, []);

  return (
    <ins
      ref={adRef}
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