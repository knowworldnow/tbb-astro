// SEO utility functions and types

export interface SEOData {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  structuredData?: any;
}

export interface PostSEOData extends SEOData {
  publishedAt: string;
  author: {
    name: string;
    url: string;
  };
  categories: Array<{
    name: string;
    url: string;
  }>;
}

export interface ToolSEOData extends SEOData {
  publishedAt: string;
  author: {
    name: string;
    url: string;
  };
  features: string[];
  isPremium: boolean;
}

// Generate SEO data for a blog post
export function generatePostSEO(post: any, siteUrl: string): PostSEOData {
  const title = post.metaTitle || post.title;
  const description = post.metaDescription || `Read about ${post.title} on The Bet Blog. Expert betting strategies and insights.`;
  const canonical = `${siteUrl}/${post.slug.current}/`;
  const ogImage = post.mainImage?.image?.asset ? 
    `https://cdn.sanity.io/images/0z52oxcg/production/${post.mainImage.image.asset._ref.replace('image-', '').replace('-webp', '.webp')}` :
    `${siteUrl}/og-default.webp`;

  return {
    title,
    description,
    canonical,
    ogImage,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    publishedAt: post.publishedAt,
    author: {
      name: post.author?.name || 'The Bet Blog Team',
      url: post.author?.slug ? `${siteUrl}/authors/${post.author.slug.current}` : `${siteUrl}/about`
    },
    categories: post.categories?.map((cat: any) => ({
      name: cat.title,
      url: `${siteUrl}/categories/${cat.slug.current}`
    })) || [],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      image: ogImage,
      author: {
        '@type': 'Person',
        name: post.author?.name || 'The Bet Blog Team',
        url: post.author?.slug ? `${siteUrl}/author/${post.author.slug.current}/` : `${siteUrl}/about-us/`
      },
      publisher: {
        '@type': 'Organization',
        name: 'The Bet Blog',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/The%20Bet%20Blog%20Logo.webp`
        }
      },
      datePublished: post.publishedAt,
      dateModified: post._updatedAt || post.publishedAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonical
      },
      articleSection: post.categories?.map((cat: any) => cat.title).join(', ') || 'Betting',
      keywords: post.categories?.map((cat: any) => cat.title).join(', ') || 'betting, gambling'
    }
  };
}

// Generate SEO data for a tool
export function generateToolSEO(tool: any, siteUrl: string): ToolSEOData {
  const title = tool.metaTitle || tool.title;
  const description = tool.metaDescription || `Use our free ${tool.title} to improve your betting strategy. Expert tools for serious bettors.`;
  const canonical = `${siteUrl}/tools/${tool.slug.current}/`;
  const ogImage = tool.mainImage?.image?.asset ? 
    `https://cdn.sanity.io/images/0z52oxcg/production/${tool.mainImage.image.asset._ref.replace('image-', '').replace('-webp', '.webp')}` :
    `${siteUrl}/og-default.webp`;

  return {
    title,
    description,
    canonical,
    ogImage,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    publishedAt: tool.publishedAt,
    author: {
      name: tool.author?.name || 'The Bet Blog Team',
      url: tool.author?.slug ? `${siteUrl}/authors/${tool.author.slug.current}` : `${siteUrl}/about`
    },
    features: tool.features || [],
    isPremium: tool.isPremium || false,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: title,
      description: description,
      image: ogImage,
      url: canonical,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: tool.isPremium ? '0' : '0',
        priceCurrency: 'USD'
      },
      author: {
        '@type': 'Person',
        name: tool.author?.name || 'The Bet Blog Team',
        url: tool.author?.slug ? `${siteUrl}/author/${tool.author.slug.current}/` : `${siteUrl}/about-us/`
      },
      publisher: {
        '@type': 'Organization',
        name: 'The Bet Blog',
        url: siteUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${siteUrl}/The%20Bet%20Blog%20Logo.webp`
        }
      },
      datePublished: tool.publishedAt,
      dateModified: tool._updatedAt || tool.publishedAt,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonical
      },
      featureList: tool.features || [],
      softwareVersion: '1.0',
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        reviewCount: '150',
        bestRating: '5',
        worstRating: '1'
      }
    }
  };
}

// Generate SEO data for a page
export function generatePageSEO(title: string, description: string, siteUrl: string, path: string = ''): SEOData {
  const canonical = `${siteUrl}${path}`;
  
  return {
    title,
    description,
    canonical,
    ogImage: `${siteUrl}/og-default.webp`,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description: description,
      url: canonical,
      mainEntity: {
        '@type': 'WebSite',
        name: 'The Bet Blog',
        url: siteUrl
      }
    }
  };
}

// Generate breadcrumb structured data
export function generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url
    }))
  };
}

// Generate FAQ structured data
export function generateFAQStructuredData(faq: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}