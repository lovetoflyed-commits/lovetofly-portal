// Client-side analytics tracking utility
export const trackPageView = async (page?: string) => {
  if (typeof window === 'undefined') return;

  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: page || window.location.pathname,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent
      })
    });
  } catch (error) {
    // Fail silently - analytics should never break the app
    console.debug('Analytics tracking failed:', error);
  }
};

export const trackEvent = async (eventName: string, pageOverride?: string) => {
  const page = pageOverride ? pageOverride : `/event/${eventName}`;
  await trackPageView(page);
};

// Track visit on component mount
export const usePageTracking = () => {
  if (typeof window !== 'undefined') {
    trackPageView();
  }
};
