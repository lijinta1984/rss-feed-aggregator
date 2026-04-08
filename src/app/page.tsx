'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FeedResult, Subscription } from '@/lib/types';
import SearchInput from '@/components/SearchInput';
import FeedCard from '@/components/FeedCard';
import AuthModal from '@/components/AuthModal';
import Sidebar from '@/components/Sidebar';
import { useRouter } from 'next/navigation';

export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<FeedResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [followedUrls, setFollowedUrls] = useState<Set<string>>(new Set());

  const fetchSubscriptions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) {
      setSubscriptions(data);
      setFollowedUrls(new Set(data.map((s: Subscription) => s.feed_url)));
    }
  }, [user]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const handleResults = useCallback((newResults: FeedResult[]) => {
    setResults(newResults);
  }, []);

  const handleLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const handleError = useCallback((err: string | null) => {
    setError(err);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {user && (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          subscriptions={subscriptions}
          onSubscriptionsChange={fetchSubscriptions}
        />
      )}

      <div className={user ? 'lg:ml-64' : ''}>
        {/* Mobile header */}
        {user && (
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100">
            <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-bold text-lg text-gray-900">Feedwise</span>
            <div className="w-10" />
          </div>
        )}

        {/* Header for non-logged-in users */}
        {!user && !authLoading && (
          <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
              <span className="font-bold text-lg text-gray-900">Feedwise</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Get Started
              </button>
            </div>
          </header>
        )}

        {/* Main content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
              {user ? 'Discover new feeds' : 'Stay on top of what matters'}
            </h1>
            <p className="text-gray-500 text-base max-w-lg mx-auto">
              {user
                ? 'Search for topics and follow feeds to build your personalized reading experience.'
                : 'Discover RSS feeds on any topic. Follow your favorite sources. Read everything in one place.'}
            </p>
          </div>

          <SearchInput onResults={handleResults} onLoading={handleLoading} onError={handleError} />

          {/* Error / empty state */}
          {error && !isLoading && (
            <p className="text-center text-gray-500 mt-8 text-sm">{error}</p>
          )}

          {/* Results grid */}
          {results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
              {results.map((feed, index) => (
                <FeedCard
                  key={`${feed.feed_url}-${index}`}
                  feed={feed}
                  isFollowing={followedUrls.has(feed.feed_url)}
                  onFollowChange={fetchSubscriptions}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              ))}
            </div>
          )}

          {/* Empty state when logged in and no search */}
          {user && results.length === 0 && !isLoading && !error && subscriptions.length === 0 && (
            <div className="text-center mt-16">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Search for your first feed above to get started</p>
            </div>
          )}

          {/* Quick link to inbox if user has subscriptions */}
          {user && subscriptions.length > 0 && results.length === 0 && !isLoading && !error && (
            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/inbox')}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors"
              >
                Go to your inbox
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
              <p className="text-gray-400 text-xs mt-2">You&apos;re following {subscriptions.length} feed{subscriptions.length !== 1 ? 's' : ''}</p>
            </div>
          )}
        </main>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          fetchSubscriptions();
          router.push('/onboarding');
        }}
      />
    </div>
  );
}
