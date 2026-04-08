'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const TOPICS = [
  'AI', 'Cybersecurity', 'Startups', 'Climate', 'Finance',
  'Health', 'Space', 'Design', 'Geopolitics', 'IoT',
];

export default function OnboardingPage() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const handleContinue = async () => {
    if (!user || selectedTopics.length === 0) {
      router.push('/inbox');
      return;
    }

    setIsLoading(true);
    setProgress('Setting up your feeds...');

    for (const topic of selectedTopics) {
      setProgress(`Discovering ${topic} feeds...`);
      try {
        const response = await fetch(`/api/discover?q=${encodeURIComponent(topic)}`);
        const data = await response.json();
        const feeds = (data.results || []).slice(0, 3);

        for (const feed of feeds) {
          const { data: sub, error } = await supabase
            .from('subscriptions')
            .upsert(
              {
                user_id: user.id,
                feed_url: feed.feed_url,
                feed_title: feed.title,
                feed_favicon: feed.favicon,
              },
              { onConflict: 'user_id,feed_url' }
            )
            .select()
            .single();

          if (sub && !error) {
            try {
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
            } catch (e) {
              console.error('Error fetching articles for', feed.title, e);
            }
          }
        }
      } catch (e) {
        console.error('Error discovering feeds for topic:', topic, e);
      }
    }

    setProgress('All set! Redirecting to your inbox...');
    setTimeout(() => router.push('/inbox'), 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg text-center">
        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          What do you want to stay on top of?
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Select topics to auto-subscribe to the best feeds. You can always change these later.
        </p>

        {isLoading ? (
          <div className="py-12">
            <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-gray-600 font-medium">{progress}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {TOPICS.map((topic) => (
                <button
                  key={topic}
                  onClick={() => toggleTopic(topic)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedTopics.includes(topic)
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleContinue}
                disabled={selectedTopics.length === 0}
                className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm hover:bg-blue-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedTopics.length > 0
                  ? `Set up ${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''}`
                  : 'Select at least one topic'}
              </button>
              <button
                onClick={() => router.push('/inbox')}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip — I&apos;ll find feeds manually
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
