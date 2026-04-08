'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { FeedResult } from '@/lib/types';

interface SearchInputProps {
  onResults: (results: FeedResult[]) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

export default function SearchInput({ onResults, onLoading, onError }: SearchInputProps) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (debouncedQuery.length < 3) {
      onResults([]);
      onError(null);
      return;
    }

    const controller = new AbortController();

    async function search() {
      setIsSearching(true);
      onLoading(true);
      onError(null);

      try {
        const response = await fetch(
          `/api/discover?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal }
        );
        const data = await response.json();

        if (data.error) {
          onError(data.error);
          onResults([]);
        } else if (data.results.length === 0) {
          onError('No feeds found for this topic. Try a broader term.');
          onResults([]);
        } else {
          onResults(data.results);
        }
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          onError('Having trouble reaching feed sources. Please try again in a moment.');
          onResults([]);
        }
      } finally {
        setIsSearching(false);
        onLoading(false);
      }
    }

    search();

    return () => controller.abort();
  }, [debouncedQuery, onResults, onLoading, onError]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you interested in? e.g. cybersecurity, AI, climate..."
          className="w-full pl-12 pr-12 py-4 text-base border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm transition-shadow hover:shadow-md"
        />
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
