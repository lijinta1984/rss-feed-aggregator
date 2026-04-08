import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { article_id, content } = await request.json();

    if (!article_id || !content) {
      return NextResponse.json(
        { error: 'article_id and content are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if summary already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('summary')
      .eq('id', article_id)
      .single();

    if (existing?.summary) {
      return NextResponse.json({ summary: existing.summary });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `You are a professional briefing assistant. Summarize the following article in exactly 3 concise bullet points for a busy professional. Be specific, avoid filler, and lead each point with the key insight.\n\nArticle:\n${content}`,
        },
      ],
    });

    const summary = message.content[0].type === 'text' ? message.content[0].text : '';

    // Save summary to database
    await supabase
      .from('articles')
      .update({ summary })
      .eq('id', article_id);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summarize error:', error);
    return NextResponse.json(
      { error: 'Summary unavailable. Try again in a moment.' },
      { status: 500 }
    );
  }
}
