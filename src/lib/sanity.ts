import { createClient } from '@sanity/client';
import imageUrlBuilder from '@sanity/image-url';

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID || '0z52oxcg',
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || process.env.PUBLIC_SANITY_DATASET || 'production',
  apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION || process.env.PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false, // Important: Set to false for static generation
  perspective: 'published', // Only fetch published documents
});

// Write client with token for API routes
export const writeClient = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID || process.env.PUBLIC_SANITY_PROJECT_ID!,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET || process.env.PUBLIC_SANITY_DATASET!,
  apiVersion: import.meta.env.PUBLIC_SANITY_API_VERSION || process.env.PUBLIC_SANITY_API_VERSION || '2024-01-01',
  useCdn: false,
  token: import.meta.env.SANITY_API_TOKEN || process.env.SANITY_API_TOKEN!, // Token for write operations
  perspective: 'published',
});

const builder = imageUrlBuilder(client);

export const urlFor = (source: unknown) => builder.image(source as Parameters<typeof builder.image>[0]);

// GROQ queries
export const queries = {
  // Get paginated posts
  paginatedPosts: `{
    "posts": *[_type == "post" && defined(publishedAt)] | order(publishedAt desc) [$start...$end] {
      _id,
      title,
      slug,
      metaTitle,
      metaDescription,
      mainImage {
        image,
        alt,
        caption
      },
      author->{
        name,
        slug,
        image {
          asset,
          alt
        },
        authorData
      },
      categories[]->{
        _id,
        title,
        slug,
        description
      },
      publishedAt,
      keyTakeaways,
      body[]{
        ...,
        _type == "image" => {
          ...,
          asset->
        }
      },
      faq
    },
    "total": count(*[_type == "post" && defined(publishedAt)])
  }`,

  // Get single post by slug with SEO data
  postBySlug: `*[_type == "post" && slug.current == $slug && defined(publishedAt)][0] {
    _id,
    title,
    slug,
    metaTitle,
    metaDescription,
    mainImage {
      image,
      alt,
      caption
    },
    author->{
      name,
      slug,
      image {
        asset,
        alt
      },
      bio,
      authorData
    },
    categories[]->{
      _id,
      title,
      slug,
      description
    },
    publishedAt,
    _updatedAt,
    keyTakeaways,
    body,
    faq
  }`,

  // Get paginated tools
  paginatedTools: `{
    "tools": *[_type == "tool" && defined(publishedAt)] | order(publishedAt desc) [$start...$end] {
      _id,
      title,
      slug,
      metaTitle,
      metaDescription,
      toolComponent,
      mainImage {
        image,
        alt,
        caption
      },
      author->{
        name,
        slug,
        image {
          asset,
          alt
        },
        authorData
      },
      publishedAt,
      keyTakeaways,
      description[]{
        ...,
        _type == "image" => {
          ...,
          asset->
        }
      },
      features,
      isPremium,
      faq
    },
    "total": count(*[_type == "tool" && defined(publishedAt)])
  }`,

  // Get single tool by slug
  toolBySlug: `*[_type == "tool" && slug.current == $slug && defined(publishedAt)][0] {
    _id,
    title,
    slug,
    metaTitle,
    metaDescription,
    toolComponent,
    mainImage {
      image,
      alt,
      caption
    },
    author->{
      name,
      slug,
      image {
        asset,
        alt
      },
      bio,
      authorData
    },
    publishedAt,
    _updatedAt,
    keyTakeaways,
    description,
    features,
    isPremium,
    faq
  }`,

  // Related tools
  relatedTools: `*[_type == "tool" && defined(publishedAt) && slug.current != $excludeSlug] | order(publishedAt desc)[0...4] {
    _id,
    title,
    slug,
    toolComponent,
    mainImage {
      image,
      alt
    },
    publishedAt,
    features,
    isPremium
  }`,

  // Get posts by category with pagination
  postsByCategory: `{
    "posts": *[_type == "post" && defined(publishedAt) && references(*[_type == "category" && slug.current == $categorySlug]._id)] | order(publishedAt desc) [$start...$end] {
      _id,
      title,
      slug,
      metaTitle,
      metaDescription,
      mainImage {
        image,
        alt,
        caption
      },
      author->{
        name,
        slug,
        image {
          asset,
          alt
        },
        authorData
      },
      categories[]->{
        _id,
        title,
        slug,
        description
      },
      publishedAt
    },
    "total": count(*[_type == "post" && defined(publishedAt) && references(*[_type == "category" && slug.current == $categorySlug]._id)]),
    "category": *[_type == "category" && slug.current == $categorySlug][0] {
      title,
      slug,
      description
    }
  }`,

  // Related posts by category, excluding current post
  relatedPosts: `*[_type == "post" && defined(publishedAt) && references(*[_type == "category" && slug.current == $categorySlug]._id) && slug.current != $excludeSlug] | order(publishedAt desc)[0...4] {
    _id,
    title,
    slug,
    mainImage {
      image,
      alt
    },
    publishedAt
  }`,

  // Get posts by author with pagination
  postsByAuthor: `{
    "posts": *[_type == "post" && defined(publishedAt) && author._ref in *[_type == "author" && slug.current == $authorSlug]._id] | order(publishedAt desc) [$start...$end] {
      _id,
      title,
      slug,
      metaTitle,
      metaDescription,
      mainImage {
        image,
        alt,
        caption
      },
      author->{
        name,
        slug,
        image {
          asset,
          alt
        },
        authorData
      },
      categories[]->{
        _id,
        title,
        slug,
        description
      },
      publishedAt
    },
    "total": count(*[_type == "post" && defined(publishedAt) && author._ref in *[_type == "author" && slug.current == $authorSlug]._id]),
    "author": *[_type == "author" && slug.current == $authorSlug][0] {
      name,
      slug,
      image {
        asset,
        alt
      },
      bio,
      authorData
    }
  }`,

  // Get category by slug
  categoryBySlug: `*[_type == "category" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description
  }`,

  // Get author by slug
  authorBySlug: `*[_type == "author" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    image {
      asset,
      alt
    },
    bio,
    authorData
  }`,

  // Get all categories
  allCategories: `*[_type == "category"] {
    _id,
    title,
    slug,
    description
  }`,

  // Get all authors
  allAuthors: `*[_type == "author"] {
    _id,
    name,
    slug,
    image {
      asset,
      alt
    },
    bio,
    authorData
  }`,

  // Get all post slugs for static generation
  allPostSlugs: `*[_type == "post" && defined(publishedAt)].slug.current`,

  // Hindi posts
  allHindiPostSlugs: `*[_type == "hindiPost" && defined(publishedAt)].slug.current`,

  // Get all tool slugs for static generation
  allToolSlugs: `*[_type == "tool" && defined(publishedAt)].slug.current`,

  // Get all category slugs for static generation
  allCategorySlugs: `*[_type == "category"].slug.current`,

  // Get all author slugs for static generation
  allAuthorSlugs: `*[_type == "author"].slug.current`,
};

// Pagination helper
export const POSTS_PER_PAGE = 12;
export const TOOLS_PER_PAGE = 12;

// Data fetching functions
export async function getPosts({ limit = 6 }: { limit?: number } = {}) {
  try {
    const posts = await client.fetch(`
      *[_type == "post" && defined(publishedAt)] | order(publishedAt desc)[0...$limit] {
        _id,
        title,
        slug,
        metaDescription,
        mainImage {
          image,
          alt,
          caption
        },
        author->{
          name,
          slug,
          image {
            asset,
            alt
          },
          authorData
        },
        categories[]->{
          _id,
          title,
          slug,
          description
        },
        publishedAt
      }
    `, { limit });
    
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

export async function getTools({ limit = 6 }: { limit?: number } = {}) {
  try {
    const tools = await client.fetch(`
      *[_type == "tool" && defined(publishedAt)] | order(publishedAt desc)[0...$limit] {
        _id,
        title,
        slug,
        metaDescription,
        toolComponent,
        mainImage {
          image,
          alt,
          caption
        },
        author->{
          name,
          slug,
          image {
            asset,
            alt
          },
          authorData
        },
        publishedAt,
        features,
        isPremium
      }
    `, { limit });
    
    return tools;
  } catch (error) {
    console.error('Error fetching tools:', error);
    return [];
  }
}

export async function getPaginatedPosts(page = 1) {
  const start = (page - 1) * POSTS_PER_PAGE;
  const end = start + POSTS_PER_PAGE;

  return await client.fetch(queries.paginatedPosts, { start, end });
}

export async function getPaginatedTools(page = 1) {
  const start = (page - 1) * TOOLS_PER_PAGE;
  const end = start + TOOLS_PER_PAGE;

  return await client.fetch(queries.paginatedTools, { start, end });
}

export async function getPostBySlug(slug: string) {
  return await client.fetch(queries.postBySlug, { slug });
}

export async function getToolBySlug(slug: string) {
  return await client.fetch(queries.toolBySlug, { slug });
}

export async function getRelatedTools(excludeSlug: string) {
  return await client.fetch(queries.relatedTools, { excludeSlug });
}

export async function getRelatedPosts(categorySlug: string, excludeSlug: string) {
  return await client.fetch(queries.relatedPosts, { categorySlug, excludeSlug });
}

export async function getAllPostSlugs() {
  return await client.fetch(queries.allPostSlugs);
}

export async function getAllToolSlugs() {
  return await client.fetch(queries.allToolSlugs);
}

export async function getAllHindiPostSlugs() {
  return await client.fetch(queries.allHindiPostSlugs);
}

export async function getAllCategorySlugs() {
  return await client.fetch(queries.allCategorySlugs);
}

export async function getAllAuthorSlugs() {
  return await client.fetch(queries.allAuthorSlugs);
}
