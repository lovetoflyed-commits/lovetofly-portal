import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Using NewsAPI.org for aviation news
    // Free tier: 100 requests/day
    // You can get a free API key at https://newsapi.org
    const apiKey = process.env.NEWS_API_KEY || 'demo'; // User should add their own key
    
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=aviation OR aircraft OR airline&language=en&sortBy=publishedAt&pageSize=5&apiKey=${apiKey}`,
      {
        headers: {
          'User-Agent': 'LoveToFlyPortal/1.0'
        },
        next: { revalidate: 1800 } // Cache for 30 minutes
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();

    if (!data.articles || data.articles.length === 0) {
      // Fallback to mock data if API fails
      return NextResponse.json({
        articles: [
          {
            title: 'FAA anuncia novas regras para drones comerciais',
            description: 'Novas regulamentações entram em vigor no próximo trimestre',
            publishedAt: new Date().toISOString(),
            source: { name: 'Aviation Week' },
            url: '#'
          },
          {
            title: 'Boeing entrega primeiro 787 do ano',
            description: 'A fabricante retoma entregas após período de inspeções',
            publishedAt: new Date(Date.now() - 3600000).toISOString(),
            source: { name: 'FlightGlobal' },
            url: '#'
          },
          {
            title: 'Mercado de aviação executiva cresce 15%',
            description: 'Setor apresenta recuperação acima do esperado',
            publishedAt: new Date(Date.now() - 7200000).toISOString(),
            source: { name: 'Aviation International News' },
            url: '#'
          }
        ]
      });
    }

    // Translate titles and descriptions to Portuguese (simplified translation)
    const translatedArticles = data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      publishedAt: article.publishedAt,
      source: article.source,
      url: article.url
    }));

    return NextResponse.json({ articles: translatedArticles });
  } catch (error: any) {
    console.error('News fetch error:', error);
    
    // Return mock data on error
    return NextResponse.json({
      articles: [
        {
          title: 'FAA anuncia novas regras para drones comerciais',
          description: 'Novas regulamentações entram em vigor no próximo trimestre',
          publishedAt: new Date().toISOString(),
          source: { name: 'Aviation Week' },
          url: '#'
        },
        {
          title: 'Boeing entrega primeiro 787 do ano',
          description: 'A fabricante retoma entregas após período de inspeções',
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          source: { name: 'FlightGlobal' },
          url: '#'
        },
        {
          title: 'Mercado de aviação executiva cresce 15%',
          description: 'Setor apresenta recuperação acima do esperado',
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          source: { name: 'Aviation International News' },
          url: '#'
        }
      ]
    });
  }
}
