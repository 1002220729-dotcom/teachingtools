/**
 * GET /api/shorten?url=<encoded-url>
 * Shortens a URL using is.gd and returns { ok: true, shortUrl: "https://is.gd/..." }
 *
 * Deploy location: functions/api/shorten.js  (Cloudflare Pages Functions)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet({ request }) {
  const urlParam = new URL(request.url).searchParams.get('url');

  if (!urlParam) {
    return jsonRes({ ok: false, error: 'Missing url parameter' }, 400);
  }

  // Basic sanity check — only allow http/https URLs
  let targetUrl;
  try {
    targetUrl = new URL(urlParam);
    if (targetUrl.protocol !== 'http:' && targetUrl.protocol !== 'https:') {
      return jsonRes({ ok: false, error: 'Only http/https URLs allowed' }, 400);
    }
  } catch {
    return jsonRes({ ok: false, error: 'Invalid URL' }, 400);
  }

  try {
    const isgdUrl = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(targetUrl.href)}`;

    const res = await fetch(isgdUrl, {
      headers: { 'User-Agent': 'museum-shortener/1.0' },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return jsonRes({ ok: false, error: `is.gd returned ${res.status}` }, 502);
    }

    const shortUrl = (await res.text()).trim();

    // is.gd returns an error message as plain text when it fails
    if (!shortUrl.startsWith('https://is.gd/') && !shortUrl.startsWith('http://is.gd/')) {
      return jsonRes({ ok: false, error: `Unexpected is.gd response: ${shortUrl.slice(0, 100)}` }, 502);
    }

    return jsonRes({ ok: true, shortUrl });
  } catch (e) {
    return jsonRes({ ok: false, error: e?.message || 'Fetch failed' }, 500);
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
    },
  });
}
