import { NextRequest, NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { createServerClient } from '@/lib/supabase';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'RSS-Feed-Aggregator/1.0',
  },
});

function isValidFeedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') return false;
    if (hostname.startsWith('169.254.') || hostname.startsWith('10.') || hostname.startsWith('192.168.')) return false;
    if (hostname.startsWith('172.') && parseInt(hostname.split('.')[1]) >= 16 && parseInt(hostname.split('.')[1]) <= 31) return false;
    return true;
  } catch {
    return false;
  }
}

function safeDateToISO(dateStr: string | undefined): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication via Bearer token validated against Supabase
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const { feed_url, subscription_id } = await request.json();

    if (!feed_url || !subscription_id) {
      return NextResponse.json(
        { error: 'feed_url and subscription_id are required' },
        { status: 400 }
      );
    }

    if (!isValidFeedUrl(feed_url)) {
      return NextResponse.json(
        { error: 'Invalid feed URL' },
        { status: 400 }
      );
    }

    // Verify subscription belongs to the authenticated user
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('id', subscription_id)
      .eq('user_id', user.id)
      .single();

    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 403 });
    }

    const feed = await parser.parseURL(feed_url);
    
    let newCount = 0;
    const articles = (feed.items || []).slice(0, 30).map((item) => ({
      subscription_id,
      title: item.title || 'Untitled',
      url: item.link || '',
      content_snippet: (item.contentSnippet || item.content || '').substring(0, 1000),
      published_at: safeDateToISO(item.pubDate),
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
