export interface FeedResult {
  title: string;
  url: string;
  description: string;
  favicon: string;
  feed_url: string;
  site_url?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  feed_url: string;
  feed_title: string;
  feed_favicon: string;
  created_at: string;
}

export interface Article {
  id: string;
  subscription_id: string;
  title: string;
  url: string;
  content_snippet: string;
  summary: string | null;
  published_at: string;
  is_read: boolean;
  created_at: string;
  subscription?: Subscription;
}

export interface SavedArticle {
  id: string;
  user_id: string;
  article_id: string;
  saved_at: string;
  article?: Article;
}

export interface Profile {
  id: string;
  email: string;
  created_at: string;
}
