import type { APIRoute } from 'astro';
import { generateUrlsForContent, submitBulkToIndexNow } from '../../lib/indexnow';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    
    // Verify webhook secret
    const secret = request.headers.get('x-sanity-webhook-secret');
    const expectedSecret = import.meta.env.SANITY_WEBHOOK_SECRET;
    
    if (!expectedSecret || secret !== expectedSecret) {
      return new Response(JSON.stringify({ 
        error: 'Invalid webhook secret' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    console.log('Rebuild triggered by Sanity webhook:', {
      type: body._type,
      id: body._id,
      timestamp: new Date().toISOString()
    });

    // Submit to IndexNow for instant Bing/Yandex indexing
    let indexNowResult = null;
    if (body.slug?.current) {
      const urls = generateUrlsForContent(body._type, body.slug.current);
      indexNowResult = await submitBulkToIndexNow(urls);
      console.log('IndexNow submission:', indexNowResult);
    }

    // Trigger rebuild based on your hosting platform
    const platform = import.meta.env.PUBLIC_HOSTING_PLATFORM || 'netlify';
    const buildHookUrl = import.meta.env.BUILD_HOOK_URL;

    if (buildHookUrl) {
      // Trigger the build hook
      const buildResponse = await fetch(buildHookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trigger: 'sanity-webhook',
          contentType: body._type,
          contentId: body._id
        })
      });

      if (buildResponse.ok) {
        console.log('Build triggered successfully');
        return new Response(JSON.stringify({ 
          success: true,
          message: 'Build triggered successfully',
          platform,
          indexNow: indexNowResult,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      } else {
        throw new Error('Failed to trigger build');
      }
    }

    // If no build hook is configured, return success anyway
    return new Response(JSON.stringify({ 
      success: true,
      message: 'Webhook received (no build hook configured)',
      note: 'Add BUILD_HOOK_URL to environment variables to enable auto-rebuild',
      indexNow: indexNowResult,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Rebuild webhook error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to trigger rebuild',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    message: 'Rebuild endpoint is active',
    method: 'POST',
    headers: {
      required: ['x-sanity-webhook-secret']
    },
    configuration: {
      BUILD_HOOK_URL: import.meta.env.BUILD_HOOK_URL ? 'Configured ✓' : 'Not configured ✗',
      SANITY_WEBHOOK_SECRET: import.meta.env.SANITY_WEBHOOK_SECRET ? 'Configured ✓' : 'Not configured ✗'
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
