import type { APIRoute } from 'astro';

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

    // Log the webhook payload
    console.log('Received Sanity webhook:', {
      type: body._type,
      id: body._id,
      slug: body.slug?.current,
      timestamp: new Date().toISOString()
    });

    // Get the document type and slug
    const documentType = body._type;
    const slug = body.slug?.current;

    // For Astro static builds, we need to trigger a rebuild
    // You can implement different strategies here:
    
    // Strategy 1: Return success (Netlify/Vercel will rebuild automatically via webhook)
    // Strategy 2: Trigger a build via API (if you have build hooks)
    // Strategy 3: Use Astro's server-side rendering for dynamic updates
    
    const revalidatedPaths = [];

    // Determine which paths to revalidate based on content type
    if (documentType === 'post' && slug) {
      revalidatedPaths.push(`/${slug}`);
      revalidatedPaths.push('/posts');
      revalidatedPaths.push('/');
    } else if (documentType === 'tool' && slug) {
      revalidatedPaths.push(`/tools/${slug}`);
      revalidatedPaths.push('/tools');
      revalidatedPaths.push('/');
    } else if (documentType === 'hindiPost' && slug) {
      revalidatedPaths.push(`/hi/${slug}`);
      revalidatedPaths.push('/hi');
      revalidatedPaths.push('/');
    } else if (documentType === 'category' && slug) {
      revalidatedPaths.push(`/category/${slug}`);
      revalidatedPaths.push('/');
    } else if (documentType === 'author' && slug) {
      revalidatedPaths.push(`/author/${slug}`);
      revalidatedPaths.push('/');
    }

    // Log what would be revalidated
    console.log('Content updated, affected paths:', revalidatedPaths);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Webhook received successfully',
      documentType,
      slug,
      revalidatedPaths,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Webhook error:', error);
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

// Also support GET for testing
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({ 
    message: 'Revalidation endpoint is active',
    method: 'POST',
    headers: {
      required: ['x-sanity-webhook-secret'],
      body: {
        _type: 'post | tool | category | author',
        _id: 'document-id',
        slug: { current: 'document-slug' }
      }
    }
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
