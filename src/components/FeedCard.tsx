'use client';

import { useState } from 'react';
import { FeedResult } from '@/lib/types';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface FeedCardProps {
  feed: FeedResult;
  isFollowing?: boolean;
  onFollowChange?: () => void;
  onAuthRequired?: () => void;
}

function FaviconImage({ src, title }: { src: string; title: string }) {
  const [error, setError] = useState(false);
  const firstLetter = (title || '?')[0].toUpperCase();
  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500'];
  const colorIndex = firstLetter.charCodeAt(0) % colors.length;

  if (error || !src) {
    return (
      <div className={`w-8 h-8 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
        {firstLetter}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      width={32}
      height={32}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
      onError={() => setError(true)}
    />
  );
}

export { FaviconImage };

export default function FeedCard({ feed, isFollowing: initialFollowing = false, onFollowChange, onAuthRequired }: FeedCardProps) {
  const { user, session } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    if (!user) {
      onAuthRequired?.();
      return;
    }

    setIsLoading(true);

    if (isFollowing) {
      // Unfollow
      setIsFollowing(false);
      const { error } = await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('feed_url', feed.feed_url);

      if (error) {
        setIsFollowing(true);
        console.error('Error unfollowing:', error);
      } else {
        onFollowChange?.();
      }
    } else {
      // Follow
      setIsFollowing(true);
      const { error } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          feed_url: feed.feed_url,
          feed_title: feed.title,
          feed_favicon: feed.favicon,
        });

      if (error) {
        if (error.code === '23505') {
          // Already following (duplicate)
          setIsFollowing(true);
        } else {
          setIsFollowing(false);
          console.error('Error following:', error);
        }
      } else {
        // Trigger article fetch for new subscription
        try {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('feed_url', feed.feed_url)
            .single();

          if (sub) {
            await fetch('/api/fetch-articles', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session?.access_token}`,
              },
              body: JSON.stringify({
                feed_url: feed.feed_url,
                subscription_id: sub.id,
              }),
            });
          }
        } catch (err) {
          console.error('Error fetching articles after follow:', err);
        }
        onFollowChange?.();
      }
    }

    setIsLoading(false);
  };

  const domain = feed.site_url || feed.url;
  let displayDomain = '';
  try {
    displayDomain = new URL(domain).hostname;
  } catch {
    displayDomain = domain;
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <FaviconImage src={feed.favicon} title={feed.title} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-gray-900 truncate">{feed.title}</h3>
          {feed.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{feed.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1 truncate">{displayDomain}</p>
        </div>
        <button
          onClick={handleFollow}
          disabled={isLoading}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            isFollowing
              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isFollowing ? (
            'Following \u2713'
          ) : (
            'Follow'
          )}
        </button>
      </div>
    </div>
  );
}
