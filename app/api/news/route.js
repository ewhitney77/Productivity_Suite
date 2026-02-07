import { NextResponse } from 'next/server';

const RSS_FEEDS = {
  paloalto: [
    'https://news.google.com/rss/search?q=Palo+Alto+Networks&hl=en-US&gl=US&ceid=US:en',
  ],
  tech: [
    'https://news.google.com/rss/search?q=technology+news&hl=en-US&gl=US&ceid=US:en',
  ],
  google: [
    'https://news.google.com/rss/search?q=Google+Cloud+Platform+OR+Google+AI+OR+Gemini+AI&hl=en-US&gl=US&ceid=US:en',
  ],
  ipo: [
    'https://news.google.com/rss/search?q=upcoming+IPO+2025+OR+IPO+filing&hl=en-US&gl=US&ceid=US:en',
  ],
  finance: [
    'https://news.google.com/rss/search?q=stock+market+OR+S%26P+500+OR+NASDAQ+financial+markets&hl=en-US&gl=US&ceid=US:en',
  ],
};

function parseRSSItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];
    const title = extractTag(itemXml, 'title');
    const link = extractTag(itemXml, 'link');
    const description = extractTag(itemXml, 'description');
    const pubDate = extractTag(itemXml, 'pubDate');
    const source = extractTag(itemXml, 'source');

    if (title) {
      items.push({
        title: cleanHtml(title),
        url: link || '#',
        description: cleanHtml(description || '').substring(0, 200),
        source: source || 'Google News',
        time: pubDate ? formatTimeAgo(new Date(pubDate)) : '',
      });
    }
  }

  return items.slice(0, 10);
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's'));
  return match ? match[1].trim() : '';
}

function cleanHtml(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();
}

function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

async function fetchFeed(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRSSItems(xml);
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const results = {};

    await Promise.all(
      Object.entries(RSS_FEEDS).map(async ([category, feeds]) => {
        const allItems = [];
        for (const url of feeds) {
          const items = await fetchFeed(url);
          allItems.push(...items);
        }
        results[category] = allItems.slice(0, 15);
      })
    );

    return NextResponse.json({ news: results });
  } catch (error) {
    return NextResponse.json({ news: {}, error: 'Failed to fetch news' }, { status: 500 });
  }
}
