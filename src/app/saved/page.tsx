'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Article, Subscription } from '@/lib/types';
import Sidebar from '@/components/Sidebar';
import ArticleCard from '@/components/ArticleCard';
import ArticleReader from '@/components/ArticleReader';
import SkeletonCard from '@/components/SkeletonCard';

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [savedArticleIds, setSavedArticleIds] = useState<Set<string>>(new Set());
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

  const fetchSavedArticles = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data } = await supabase
      .from('saved_articles')
      .select('article_id, saved_at, articles(*)')
      .eq('user_id', user.id)
      .order('saved_at', { ascending: false });

    if (data) {
      const savedArticles = data
        .map((sa: { article_id: string; articles: Article | Article[] | null }) => {
          const article = Array.isArray(sa.articles) ? sa.articles[0] : sa.articles;
          return article;
        })
        .filter(Boolean) as Article[];
      setArticles(savedArticles);
      setSavedArticleIds(new Set(data.map((sa: { article_id: string }) => sa.article_id)));
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
      return;
    }
    fetchSubscriptions();
    fetchSavedArticles();
  }, [user, authLoading, router, fetchSubscriptions, fetchSavedArticles]);

  const handleBookmark = async (articleId: string) => {
    if (!user) return;
    const isSaved = savedArticleIds.has(articleId);

    if (isSaved) {
      setSavedArticleIds((prev) => {
        const next = new Set(prev);
        next.delete(articleId);
        return next;
      });
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
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
      />

      <div className="lg:ml-64">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-bold text-lg text-gray-900">Feedwise</span>
          <div className="w-10" />
        </div>

        {/* Saved header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-6 py-4 z-10">
          <h1 className="text-xl font-bold text-gray-900">Saved</h1>
          {articles.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{articles.length} saved article{articles.length !== 1 ? 's' : ''}</p>
          )}
        </div>

        {/* Articles */}
        <div className="max-w-3xl mx-auto px-4 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Nothing saved yet. Bookmark articles to find them here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {articles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  subscription={getSubscriptionForArticle(article)}
                  isBookmarked={savedArticleIds.has(article.id)}
                  onRead={setSelectedArticle}
                  onBookmark={handleBookmark}
                  onSummarize={() => {}}
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
