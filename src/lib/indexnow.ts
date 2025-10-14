// IndexNow API integration for instant Bing indexing
export const INDEXNOW_KEY = '192212f0182148218f94c0f86d45b8a0';
export const INDEXNOW_API_URL = 'https://api.indexnow.org/indexnow';

interface IndexNowResponse {
  success: boolean;
  statusCode?: number;
  message?: string;
}

/**
 * Submit a single URL to IndexNow (Bing, Yandex, etc.)
 */
export async function submitToIndexNow(url: string): Promise<IndexNowResponse> {
  try {
    const response = await fetch(
      `${INDEXNOW_API_URL}?url=${encodeURIComponent(url)}&key=${INDEXNOW_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        message: 'URL submitted successfully to IndexNow',
      };
    }

    return {
      success: false,
      statusCode: response.status,
      message: `Failed to submit URL: ${response.statusText}`,
    };
  } catch (error) {
    console.error('IndexNow submission error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit multiple URLs to IndexNow in bulk
 */
export async function submitBulkToIndexNow(urls: string[]): Promise<IndexNowResponse> {
  try {
    const host = new URL(urls[0]).hostname;
    const keyLocation = `https://${host}/${INDEXNOW_KEY}.txt`;

    const response = await fetch(INDEXNOW_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify({
        host: host,
        key: INDEXNOW_KEY,
        keyLocation: keyLocation,
        urlList: urls,
      }),
    });

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        message: `${urls.length} URLs submitted successfully to IndexNow`,
      };
    }

    return {
      success: false,
      statusCode: response.status,
      message: `Failed to submit URLs: ${response.statusText}`,
    };
  } catch (error) {
    console.error('IndexNow bulk submission error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate URLs to submit based on content type
 */
export function generateUrlsForContent(
  contentType: string,
  slug: string,
  baseUrl: string = 'https://thebetblog.com'
): string[] {
  const urls: string[] = [];

  switch (contentType) {
    case 'post':
      urls.push(`${baseUrl}/${slug}`);
      urls.push(`${baseUrl}/posts`);
      urls.push(baseUrl);
      break;

    case 'tool':
      urls.push(`${baseUrl}/tools/${slug}`);
      urls.push(`${baseUrl}/tools`);
      urls.push(baseUrl);
      break;

    case 'category':
      urls.push(`${baseUrl}/category/${slug}`);
      urls.push(baseUrl);
      break;

    case 'author':
      urls.push(`${baseUrl}/author/${slug}`);
      urls.push(baseUrl);
      break;

    default:
      urls.push(baseUrl);
  }

  return urls;
}
