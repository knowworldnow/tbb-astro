export interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  metaTitle?: string;
  metaDescription?: string;
  mainImage?: {
    image: any;
    alt?: string;
    caption?: string;
  };
  author?: {
    name: string;
    slug: {
      current: string;
    };
    image?: {
      asset: any;
      alt?: string;
    };
    bio?: string;
    authorData?: any;
  };
  categories?: Array<{
    _id: string;
    title: string;
    slug: {
      current: string;
    };
    description?: string;
  }>;
  publishedAt: string;
  _updatedAt?: string;
  keyTakeaways?: string[];
  body?: any[];
  faq?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface Tool {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  metaTitle?: string;
  metaDescription?: string;
  toolComponent: string;
  mainImage?: {
    image: any;
    alt?: string;
    caption?: string;
  };
  author?: {
    name: string;
    slug: {
      current: string;
    };
    image?: {
      asset: any;
      alt?: string;
    };
    bio?: string;
    authorData?: any;
  };
  publishedAt: string;
  _updatedAt?: string;
  keyTakeaways?: string[];
  description?: any[];
  features?: string[];
  isPremium?: boolean;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
}

export interface Category {
  _id: string;
  title: string;
  slug: {
    current: string;
  };
  description?: string;
}

export interface Author {
  _id: string;
  name: string;
  slug: {
    current: string;
  };
  image?: {
    asset: any;
    alt?: string;
  };
  bio?: string;
  authorData?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface Breadcrumb {
  name: string;
  url: string;
}

export interface SEOData {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  structuredData?: any;
}
