/**
 * POST /api/feedback — collects 👍/👎 on interpretations.
 * Persistence lands in Phase 4 (Supabase); for now this endpoint only logs
 * so the client has a stable target and no console errors.
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, helpful, language, perspective, engine } = req.body || {};
  console.log('[feedback]', JSON.stringify({ id, helpful, language, perspective, engine, at: new Date().toISOString() }));
  return res.status(200).json({ ok: true });
}
