import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

const RSS_URL =
  'https://news.google.com/rss/search?q=aviation%20OR%20aircraft%20OR%20airline&hl=pt-BR&gl=BR&ceid=BR:pt-419';

const mapRssItems = (items: any[]) =>
  items.slice(0, 6).map((item) => ({
    title: item.title,
    description: item.description || item.contentSnippet || '',
    publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
    source: { name: item.source?.['#text'] || item.source || 'Google News' },
    url: item.link,
  }));

const fetchRssNews = async () => {
  const response = await fetch(RSS_URL, {
    headers: { 'User-Agent': 'LoveToFlyPortal/1.0' },
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error('RSS fetch failed');
  }

  const xml = await response.text();
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    trimValues: true,
  });
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item;

  if (!items) {
    return [];
  }

  return mapRssItems(Array.isArray(items) ? items : [items]);
};

export async function GET() {
  try {
    const apiKey = process.env.NEWS_API_KEY;

    if (apiKey && apiKey !== 'demo') {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=aviation&language=pt&sortBy=publishedAt&pageSize=6&apiKey=${apiKey}`,
        {
          headers: { 'User-Agent': 'LoveToFlyPortal/1.0' },
          next: { revalidate: 1800 },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.articles && data.articles.length > 0) {
          return NextResponse.json({ articles: data.articles });
        }
      }
    }

    const rssArticles = await fetchRssNews();
    return NextResponse.json({ articles: rssArticles });
  } catch (error: any) {
    console.error('News fetch error:', error);
    return NextResponse.json({ articles: [] });
  }
}
