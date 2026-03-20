/**
 * POST /api/museum/edit-share
 * Body: { museumData: {...} }
 * Returns: { ok: true, id: "edt_XXXXXXXX" }
 *
 * KV binding required: MUSEUM_KV
 * TTL: 90 days
 */
export async function onRequestPost(context) {
  // Handle CORS preflight (#13)
  if (context.request.method === 'OPTIONS') return corsOk();

  try {
    const body = await context.request.json();
    const data = body.museumData;

    // #5 — consistent null check aligned with museum-share.js
    // null is explicitly disallowed here too; callers should pass { rooms: [] } for empty museums
    if (data == null) return jsonErr('Missing museumData', 400);

    const serialized = JSON.stringify(data); // #10 — renamed from 'json' to avoid shadowing
    if (serialized.length > 5_000_000) return jsonErr('Museum data too large (max 5MB)', 413);

    const id = 'edt_' + randomId(10);
    const kv = context.env.MUSEUM_KV;

    await kv.put(id, serialized, { expirationTtl: 7_776_000 });

    return jsonOk({ ok: true, id });
  } catch (e) {
    return jsonErr(e.message || 'Internal error', 500);
  }
}

function randomId(n) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let s = '';
  const arr = crypto.getRandomValues(new Uint8Array(n));
  for (const b of arr) s += chars[b % chars.length];
  return s;
}

// #13 — CORS headers added to all responses
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function corsOk() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function jsonOk(data)         { return jsonRes(data, 200); }
function jsonErr(msg, status) { return jsonRes({ ok: false, error: msg }, status); }
function jsonRes(data, status) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
    }
  });
}
