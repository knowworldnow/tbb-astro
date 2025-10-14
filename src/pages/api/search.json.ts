import type { APIRoute } from 'astro';
import { client } from '../../lib/sanity';

export const GET: APIRoute = async ({ url }) => {
  try {
    const q = (url.searchParams.get('q') || '').trim();
    if (q.length < 2) {
      return new Response(JSON.stringify({ items: [] }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      });
    }

    const groq = `{
      "posts": *[_type == "post" && defined(publishedAt) && (title match $q || metaDescription match $q)]
        | order(publishedAt desc)[0...5]{ title, slug, publishedAt },
      "tools": *[_type == "tool" && defined(publishedAt) && (title match $q || metaDescription match $q)]
        | order(publishedAt desc)[0...5]{ title, slug, publishedAt }
    }`;

    const data = await client.fetch(groq, { q: `*${q}*` });

    const items = [
      ...(data.posts || []).map((p: any) => ({
        title: p.title,
        url: `/${p.slug?.current || ''}/`,
        type: 'post' as const,
      })),
      ...(data.tools || []).map((t: any) => ({
        title: t.title,
        url: `/tools/${t.slug?.current || ''}/`,
        type: 'tool' as const,
      })),
    ].slice(0, 8);

    return new Response(JSON.stringify({ items }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ items: [] }), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
      status: 200,
    });
  }
};


