import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createServerClient } from '@/lib/supabase';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'RSS-Feed-Aggregator/1.0',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { feed_url, subscription_id } = await request.json();

    if (!feed_url || !subscription_id) {
      return NextResponse.json(
        { error: 'feed_url and subscription_id are required' },
        { status: 400 }
      );
    }

    const feed = await parser.parseURL(feed_url);
    const supabase = createServerClient();
    
    let newCount = 0;
    const articles = (feed.items || []).slice(0, 30).map((item) => ({
      subscription_id,
      title: item.title || 'Untitled',
      url: item.link || '',
      content_snippet: (item.contentSnippet || item.content || '').substring(0, 1000),
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      is_read: false,
    }));

    if (articles.length > 0) {
      const { data, error } = await supabase
        .from('articles')
        .upsert(articles, {
          onConflict: 'subscription_id,url',
          ignoreDuplicates: true,
        })
        .select();

      if (error) {
        console.error('Error inserting articles:', error);
      } else {
        newCount = data?.length || 0;
      }
    }

    return NextResponse.json({ count: newCount, total: articles.length });
  } catch (error) {
    console.error('Article fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles from feed' },
      { status: 500 }
    );
  }
}
