'use client';

import { useEffect } from 'react';
import { Article, Subscription } from '@/lib/types';
import { FaviconImage } from './FeedCard';
import { supabase } from '@/lib/supabase';

interface ArticleReaderProps {
  article: Article | null;
  subscription?: Subscription;
  isBookmarked?: boolean;
  onClose: () => void;
  onBookmark: (articleId: string) => void;
}

export default function ArticleReader({
  article,
  subscription,
  isBookmarked = false,
  onClose,
  onBookmark,
}: ArticleReaderProps) {
  // Mark as read on open
  useEffect(() => {
    if (article && !article.is_read) {
      supabase
        .from('articles')
        .update({ is_read: true })
        .eq('id', article.id)
        .then(() => {});
    }
  }, [article]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!article) return null;

  const publishDate = new Date(article.published_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white z-50 shadow-2xl overflow-y-auto animate-slide-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            {subscription && (
              <>
                <FaviconImage src={subscription.feed_favicon} title={subscription.feed_title} />
                <span className="text-sm text-gray-500 font-medium">{subscription.feed_title}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBookmark(article.id)}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked ? 'text-blue-500 bg-blue-50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill={isBookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
            {article.title}
          </h1>

          <p className="text-sm text-gray-400 mb-6">{publishDate}</p>

          {article.summary && (
            <div className="mb-6 p-4 bg-blue-50 border-l-2 border-blue-400 rounded-r-lg">
              <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">AI Summary</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">{article.summary}</div>
            </div>
          )}

          <div className="text-base text-gray-700 leading-relaxed whitespace-pre-wrap">
            {article.content_snippet}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors"
            >
              Read full article
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
