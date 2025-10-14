import type { APIRoute } from 'astro';
import { submitToIndexNow, submitBulkToIndexNow } from '../../lib/indexnow';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Verify webhook secret (optional, for security)
    const secret = request.headers.get('x-sanity-webhook-secret');
    const expectedSecret = import.meta.env.SANITY_WEBHOOK_SECRET;
    
    if (expectedSecret && secret !== expectedSecret) {
      return new Response(JSON.stringify({ 
        error: 'Invalid webhook secret' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const { url, urls } = body;

    // Handle single URL submission
    if (url) {
      const result = await submitToIndexNow(url);
      return new Response(JSON.stringify({
        success: result.success,
        message: result.message,
        url: url,
        timestamp: new Date().toISOString()
      }), {
        status: result.success ? 200 : 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    // Handle bulk URL submission
    if (urls && Array.isArray(urls) && urls.length > 0) {
      const result = await submitBulkToIndexNow(urls);
      return new Response(JSON.stringify({
        success: result.success,
        message: result.message,
        urlCount: urls.length,
        timestamp: new Date().toISOString()
      }), {
        status: result.success ? 200 : 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Invalid request: url or urls required' 
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('IndexNow API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

// GET endpoint for testing
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    message: 'IndexNow API endpoint',
    key: '192212f0182148218f94c0f86d45b8a0',
    keyLocation: 'https://thebetblog.com/192212f0182148218f94c0f86d45b8a0.txt',
    endpoints: {
      single: 'POST with { "url": "https://thebetblog.com/page" }',
      bulk: 'POST with { "urls": ["url1", "url2", ...] }'
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
