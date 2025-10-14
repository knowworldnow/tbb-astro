import type { APIRoute } from 'astro';
import { getPosts, getTools } from '../lib/sanity';

export const GET: APIRoute = async () => {
  const site = 'https://thebetblog.com';
  const currentDate = new Date().toISOString();
  
  // Get latest posts and tools
  const [posts, tools] = await Promise.all([
    getPosts({ limit: 25 }),
    getTools({ limit: 25 })
  ]);
  
  // Combine and sort by publishedAt
  const allContent = [
    ...posts.map((post) => ({ ...post, type: 'post' as const })),
    ...tools.map((tool) => ({ ...tool, type: 'tool' as const })),
  ]
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 50); // Limit to 50 total items
  
  const rssItems = allContent
    .map((item) => {
      const url = item.type === 'post' 
        ? `${site}/${item.slug.current}/` 
        : `${site}/tools/${item.slug.current}/`;
      
      const title = item.metaTitle || item.title;
      const description = item.metaDescription || `Read ${item.title} on The Bet Blog.`;
      const pubDate = new Date(item.publishedAt).toUTCString();
      
      return `
  <item>
    <title><![CDATA[${title}]]></title>
    <description><![CDATA[${description}]]></description>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${pubDate}</pubDate>
    <category><![CDATA[${item.type === 'post' ? 'Blog Post' : 'Betting Tool'}]]></category>
    ${item.author?.name ? `<author>${item.author.name}</author>` : ''}
  </item>`;
    })
    .join('');
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>The Bet Blog - Expert Betting Strategies & Free Tools</title>
    <description>Expert betting strategies, free calculators, and trusted bookmaker reviews. Learn matched betting, arbitrage, and casino games with our comprehensive guides and tools.</description>
    <link>${site}</link>
    <language>en-us</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${site}/The%20Bet%20Blog%20Logo.webp</url>
      <title>The Bet Blog</title>
      <link>${site}</link>
      <width>144</width>
      <height>144</height>
    </image>
    <category>Betting</category>
    <category>Gambling</category>
    <category>Sports Betting</category>
    <category>Casino Games</category>
    <category>Matched Betting</category>
    <category>Arbitrage</category>
    <managingEditor>samchyweb@gmail.com (The Bet Blog Team)</managingEditor>
    <webMaster>samchyweb@gmail.com (The Bet Blog Team)</webMaster>
    <copyright>Copyright ${new Date().getFullYear()} The Bet Blog. All rights reserved.</copyright>
    <ttl>60</ttl>
    ${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
