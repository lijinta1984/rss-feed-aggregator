'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Subscription } from '@/lib/types';
import { FaviconImage } from './FeedCard';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

interface SidebarProps {
  onFeedFilter?: (subscriptionId: string | null) => void;
  activeFilter?: string | null;
  isOpen: boolean;
  onClose: () => void;
  subscriptions: Subscription[];
  onSubscriptionsChange: () => void;
}

export default function Sidebar({
  onFeedFilter,
  activeFilter,
  isOpen,
  onClose,
  subscriptions,
}: SidebarProps) {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view');

  const navItems = [
    { href: '/inbox', label: 'Today', icon: TodayIcon, filter: 'today' },
    { href: '/inbox?view=all', label: 'All Articles', icon: AllIcon, filter: 'all' },
    { href: '/saved', label: 'Saved', icon: BookmarkIcon, filter: null },
    { href: '/', label: 'Explore', icon: ExploreIcon, filter: null },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#F7F7F5] border-r border-gray-200 z-50 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="p-4 pb-2">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
            </div>
            <span className="font-bold text-lg text-gray-900">Feedwise</span>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto px-2 py-2">
          {navItems.map((item) => {
            let isActive = false;
            if (item.href === '/') {
              isActive = pathname === '/';
            } else if (item.href === '/saved') {
              isActive = pathname === '/saved';
            } else if (item.href === '/inbox?view=all') {
              isActive = pathname === '/inbox' && currentView === 'all';
            } else if (item.href === '/inbox') {
              isActive = pathname === '/inbox' && currentView !== 'all';
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => {
                  if (item.filter && onFeedFilter) {
                    onFeedFilter(null);
                  }
                  onClose();
                }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5 ${
                  isActive && !activeFilter
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}

          {/* My Feeds section */}
          {subscriptions.length > 0 && (
            <div className="mt-4">
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                My Feeds
              </h3>
              {subscriptions.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    onFeedFilter?.(activeFilter === sub.id ? null : sub.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors mb-0.5 ${
                    activeFilter === sub.id
                      ? 'bg-white text-gray-900 shadow-sm font-medium'
                      : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                  }`}
                >
                  <FaviconImage src={sub.feed_favicon} title={sub.feed_title} />
                  <span className="truncate text-xs">{sub.feed_title}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        {/* User section */}
        {user && (
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-sm font-semibold flex-shrink-0">
                {(user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-600 truncate">{user.email}</p>
              </div>
              <button
                onClick={signOut}
                className="text-gray-400 hover:text-gray-600 p-1"
                title="Sign out"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

function TodayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function AllIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  );
}

function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  );
}

function ExploreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
