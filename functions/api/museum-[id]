/**
 * GET /api/museum/:id
 * :id can be mus_XXXXXXXX (visitor) or edt_XXXXXXXX (edit)
 * Returns: { ok: true, museumData: {...}, mode: "view"|"edit" }
 *
 * KV binding required: MUSEUM_KV
 */

// #13 — CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context) {
  try {
    const id = context.params.id;
    if (!id) return jsonErr('Missing id', 400);

    const kv   = context.env.MUSEUM_KV;
    const raw  = await kv.get(id);

    if (!raw) return jsonErr('Not found: ' + id, 404);

    const museumData = JSON.parse(raw);
    // #8 — mode is returned from the server so the client can use it directly
    const mode = id.startsWith('edt_') ? 'edit' : 'view';

    return jsonOk({ ok: true, museumData, mode });
  } catch (e) {
    return jsonErr(e.message || 'Internal error', 500);
  }
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
