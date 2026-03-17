export async function onRequestGet(context) {
  try {
    const reqUrl = new URL(context.request.url);
    const longUrl = reqUrl.searchParams.get('url');

    if (!longUrl) {
      return new Response(
        JSON.stringify({
          ok: false,
          shortUrl: null,
          originalUrl: '',
          error: 'Missing url parameter'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    const target = `https://is.gd/create.php?format=simple&url=${encodeURIComponent(longUrl)}`;

    const res = await fetch(target, {
      method: 'GET',
      headers: { 'User-Agent': 'Cloudflare-Pages-Function' }
    });

    const text = (await res.text()).trim();
    const looksLikeUrl = text.startsWith('http://') || text.startsWith('https://');

    return new Response(
      JSON.stringify({
        ok: looksLikeUrl,
        shortUrl: looksLikeUrl ? text : null,
        originalUrl: longUrl,
        raw: text
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        ok: false,
        shortUrl: null,
        originalUrl: '',
        error: err?.message || 'Shortening failed'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}
