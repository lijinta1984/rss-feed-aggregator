'use client';

import { useState } from 'react';
import { Article, Subscription } from '@/lib/types';
import { FaviconImage } from './FeedCard';

interface ArticleCardProps {
  article: Article;
  subscription?: Subscription;
  isBookmarked?: boolean;
  onRead: (article: Article) => void;
  onBookmark: (articleId: string) => void;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function ArticleCard({
  article,
  subscription,
  isBookmarked = false,
  onRead,
  onBookmark,
}: ArticleCardProps) {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(article.summary);

  const handleSummarize = async () => {
    if (summary) {
      setShowSummary(!showSummary);
      return;
    }

    setSummaryLoading(true);
    setShowSummary(true);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article_id: article.id,
          content: article.content_snippet,
        }),
      });

      const data = await response.json();
      if (data.summary) {
        setSummary(data.summary);
      } else {
        setSummary('Summary unavailable. Try again in a moment.');
      }
    } catch {
      setSummary('Summary unavailable. Try again in a moment.');
    } finally {
      setSummaryLoading(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer ${
        !article.is_read ? 'border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div onClick={() => onRead(article)}>
        {/* Header: Feed info + time */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {subscription && (
              <>
                <FaviconImage src={subscription.feed_favicon} title={subscription.feed_title} />
                <span className="text-xs text-gray-400 font-medium">{subscription.feed_title}</span>
              </>
            )}
          </div>
          <span className="text-xs text-gray-400">{timeAgo(article.published_at)}</span>
        </div>

        {/* Title */}
        <h3 className={`text-base mb-1.5 line-clamp-2 ${!article.is_read ? 'font-semibold text-gray-900' : 'font-normal text-gray-700'}`}>
          {article.title}
        </h3>

        {/* Excerpt */}
        {article.content_snippet && (
          <p className="text-sm text-gray-500 line-clamp-3 mb-3">
            {article.content_snippet}
          </p>
        )}
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSummarize();
          }}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {summary ? (showSummary ? 'Hide Summary' : 'Show Summary') : 'Summarize'}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark(article.id);
          }}
          className={`p-1 rounded-lg transition-colors ${
            isBookmarked ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <svg className="w-4 h-4" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      {/* Inline summary */}
      {showSummary && (
        <div className="mt-3 p-3 bg-blue-50 border-l-2 border-blue-400 rounded-r-lg">
          {summaryLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Generating summary...
            </div>
          ) : (
            <div className="text-sm text-gray-700 whitespace-pre-wrap">{summary}</div>
          )}
        </div>
      )}
    </div>
  );
}
