export async function onRequestGet(context) {
  try {
    const reqUrl = new URL(context.request.url);
    const longUrl = reqUrl.searchParams.get('url');

    if (!longUrl) {
      return json({ ok: false, shortUrl: null, error: 'Missing url parameter' }, 400);
    }

    // 1st attempt: is.gd
    try {
      const res = await fetch(
        `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`,
        { method: 'GET', headers: { 'User-Agent': 'Cloudflare-Pages-Function/1.0' } }
      );
      const text = (await res.text()).trim();
      if (text.startsWith('http://') || text.startsWith('https://')) {
        return json({ ok: true, shortUrl: text, originalUrl: longUrl, via: 'is.gd' });
      }
      // is.gd returned an error string — log it and try fallback
      console.error('[shorten] is.gd error response:', text.slice(0, 200));
    } catch (e) {
      console.error('[shorten] is.gd fetch failed:', e.message);
    }

    // 2nd attempt: v.gd (same API, different domain)
    try {
      const res = await fetch(
        `https://v.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`,
        { method: 'GET', headers: { 'User-Agent': 'Cloudflare-Pages-Function/1.0' } }
      );
      const text = (await res.text()).trim();
      if (text.startsWith('http://') || text.startsWith('https://')) {
        return json({ ok: true, shortUrl: text, originalUrl: longUrl, via: 'v.gd' });
      }
      console.error('[shorten] v.gd error response:', text.slice(0, 200));
    } catch (e) {
      console.error('[shorten] v.gd fetch failed:', e.message);
    }

    // Both failed
    return json({ ok: false, shortUrl: null, originalUrl: longUrl, error: 'All shorteners failed' });

  } catch (err) {
    return json({ ok: false, shortUrl: null, error: err?.message || 'Shortening failed' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
