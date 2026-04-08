import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');

  if (!query || query.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Use Feedly public search endpoint (no API key required)
    const response = await fetch(
      `https://cloud.feedly.com/v3/search/feeds?query=${encodeURIComponent(query)}&count=20`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error(`Feedly API error: ${response.status}`);
    }

    const data = await response.json();
    
    const results = (data.results || []).map((feed: {
      title?: string;
      feedId?: string;
      description?: string;
      iconUrl?: string;
      visualUrl?: string;
      website?: string;
    }) => ({
      title: feed.title || 'Untitled Feed',
      url: feed.website || '',
      description: feed.description || '',
      favicon: feed.iconUrl || feed.visualUrl || '',
      feed_url: feed.feedId ? feed.feedId.replace('feed/', '') : '',
      site_url: feed.website || '',
    }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Feed discovery error:', error);
    return NextResponse.json(
      { error: 'Having trouble reaching feed sources. Please try again in a moment.', results: [] },
      { status: 500 }
    );
  }
}
