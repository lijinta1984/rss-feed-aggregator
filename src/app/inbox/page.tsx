'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Article, Subscription } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import ArticleCard from '@/components/ArticleCard';
import ArticleReader from '@/components/ArticleReader';
import SkeletonCard from '@/components/SkeletonCard';

function InboxContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get('view') || 'today';

  const [articles, setArticles] = useState<Article[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchSubscriptions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSubscriptions(data);
  }, [user]);

  const fetchArticles = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: subs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id);

    if (!subs || subs.length === 0) {
      setArticles([]);
      setIsLoading(false);
      return;
    }

    const subIds = subs.map((s) => s.id);

    let query = supabase
      .from('articles')
      .select('*')
      .in('subscription_id', subIds)
      .order('published_at', { ascending: false })
      .limit(100);

    if (activeFilter) {
      query = query.eq('subscription_id', activeFilter);
    }

    if (viewMode === 'today') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      query = query.gte('published_at', yesterday.toISOString());
    }

    const { data } = await query;
    setArticles(data || []);
    setIsLoading(false);
  }, [user, activeFilter, viewMode]);

  const fetchSavedArticles = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_articles')
      .select('article_id')
      .eq('user_id', user.id);
    if (data) {
      setSavedArticleIds(new Set(data.map((s) => s.article_id)));
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    fetchSubscriptions();
    fetchArticles();
    fetchSavedArticles();
  }, [user, authLoading, router, fetchSubscriptions, fetchArticles, fetchSavedArticles]);

  useEffect(() => {
    fetchArticles();
  }, [activeFilter, viewMode, fetchArticles]);

  const handleMarkAllRead = async () => {
    if (!user) return;
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id);

    if (!subs) return;
    const subIds = subs.map((s) => s.id);

    await supabase
      .from('articles')
      .update({ is_read: true })
      .in('subscription_id', subIds)
      .eq('is_read', false);

    setArticles((prev) => prev.map((a) => ({ ...a, is_read: true })));
  };

  const handleReadArticle = (article: Article) => {
    setSelectedArticle(article);
    setArticles((prev) =>
      prev.map((a) => (a.id === article.id ? { ...a, is_read: true } : a))
    );
  };

  const handleBookmark = async (articleId: string) => {
    if (!user) return;
    const isSaved = savedArticleIds.has(articleId);

    if (isSaved) {
      setSavedArticleIds((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
      await supabase
        .from('saved_articles')
        .delete()
        .eq('user_id', user.id)
        .eq('article_id', articleId);
    } else {
      setSavedArticleIds((prev) => new Set(prev).add(articleId));
      await supabase
        .from('saved_articles')
        .insert({ user_id: user.id, article_id: articleId });
    }
  };

  const getSubscriptionForArticle = (article: Article) => {
    return subscriptions.find((s) => s.id === article.subscription_id);
  };

  const unreadCount = articles.filter((a) => !a.is_read).length;

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        subscriptions={subscriptions}
        onSubscriptionsChange={fetchSubscriptions}
        onFeedFilter={setActiveFilter}
        activeFilter={activeFilter}
      />

      <div className="lg:ml-64">
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-lg text-gray-900">Feedwise</span>
          <div className="w-10" />
        </div>

        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {activeFilter
                  ? subscriptions.find((s) => s.id === activeFilter)?.feed_title || 'Feed'
                  : viewMode === 'today'
                  ? 'Today'
                  : 'All Articles'}
              </h1>
              {unreadCount > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{unreadCount} unread</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              {subscriptions.length === 0 ? (
                <>
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm mb-4">Search for your first feed above to get started</p>
                  <button
                    onClick={() => router.push('/')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    Explore feeds
                  </button>
                </>
              ) : viewMode === 'today' ? (
                <>
                  <p className="text-gray-500 text-sm mb-2">No new articles today</p>
                  <button
                    onClick={() => router.push('/inbox?view=all')}
                    className="text-blue-500 text-sm hover:text-blue-600"
                  >
                    View all articles
                  </button>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Your feeds are being fetched. Check back in a moment.</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  subscription={getSubscriptionForArticle(article)}
                  isBookmarked={savedArticleIds.has(article.id)}
                  onRead={handleReadArticle}
                  onBookmark={handleBookmark}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <ArticleReader
        article={selectedArticle}
        subscription={selectedArticle ? getSubscriptionForArticle(selectedArticle) : undefined}
        isBookmarked={selectedArticle ? savedArticleIds.has(selectedArticle.id) : false}
        onClose={() => setSelectedArticle(null)}
        onBookmark={handleBookmark}
      />
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <InboxContent />
    </Suspense>
  );
}
