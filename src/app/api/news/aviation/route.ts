import { NextResponse } from 'next/server';

// Enhanced mock aviation news data
function getAviationNewsData() {
  const now = Date.now();
  const newsItems = [
    {
      title: 'Boston Dynamics unleashes humanoid robots at CES 2026 with industry-leading AI',
      description: 'Hyundai-owned Boston Dynamics publicly demonstrated Atlas humanoid robots, showcasing advanced AI integration for factory automation and real-world deployment by 2028',
      publishedAt: new Date(now - 3600000).toISOString(),
      source: { name: 'TechCrunch' },
      url: '#'
    },
    {
      title: 'Nvidia announces Alpamayo platform for autonomous vehicles with human-like reasoning',
      description: 'Jensen Huang presents breakthrough AI platform enabling self-driving cars to think and reason like humans, shipping in Mercedes-Benz CLA in Q1 2026',
      publishedAt: new Date(now - 7200000).toISOString(),
      source: { name: 'Wired' },
      url: '#'
    },
    {
      title: 'FAA introduces stricter certification standards for advanced autonomous flight systems',
      description: 'New regulatory framework aims to ensure safety while accelerating adoption of AI-powered aircraft navigation and collision avoidance systems',
      publishedAt: new Date(now - 10800000).toISOString(),
      source: { name: 'Aviation Week' },
      url: '#'
    },
    {
      title: 'Airbus demonstrates hydrogen fuel cell aircraft demonstrator ahead of 2030 targets',
      description: 'European manufacturer successfully tests zero-emission propulsion system, advancing sustainable aviation goals and regional aircraft development',
      publishedAt: new Date(now - 14400000).toISOString(),
      source: { name: 'FlightGlobal' },
      url: '#'
    },
    {
      title: 'Brazil expands commercial drone regulations to support air mobility operations',
      description: 'ANAC announces new framework allowing expanded BVLOS (beyond visual line of sight) operations, positioning Brazil as regional leader in advanced air mobility',
      publishedAt: new Date(now - 18000000).toISOString(),
      source: { name: 'Aviation International News' },
      url: '#'
    }
  ];
  return newsItems;
}

export async function GET() {
  try {
    // Try to fetch real news from NewsAPI
    const apiKey = process.env.NEWS_API_KEY;
    
    if (apiKey && apiKey !== 'demo') {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=aviation&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`,
        {
          headers: {
            'User-Agent': 'LoveToFlyPortal/1.0'
          },
          next: { revalidate: 1800 } // Cache for 30 minutes
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          return NextResponse.json({ articles: data.articles });
        }
      }
    }
    
    // Return enhanced mock data
    return NextResponse.json({ articles: getAviationNewsData() });
  } catch (error: any) {
    console.error('News fetch error:', error);
    
    // Return mock data on any error
    return NextResponse.json({ articles: getAviationNewsData() });
  }
}
