/**
 * POST /api/translate-one — translate ONE flat key+value at a time.
 *
 * Used by translate-live.mjs to bypass the chunked-merge 502 ceiling for
 * stubborn languages (Greek, Khmer, Lithuanian): the script splits the
 * source into 200+ tiny calls, each fast enough to fit under Vercel's 60s
 * serverless budget. The OpenRouter key never leaves Vercel.
 *
 * Body: { code, key, value, context? }
 * Resp: { translation, engine }
 */
const LANG_NAMES = {
  ar: 'Arabic (Modern Standard)', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', ru: 'Russian', zh: 'Simplified Chinese',
  ja: 'Japanese', ko: 'Korean', tr: 'Turkish', nl: 'Dutch', pl: 'Polish',
  sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish', el: 'Greek',
  cs: 'Czech', sk: 'Slovak', hu: 'Hungarian', ro: 'Romanian', bg: 'Bulgarian',
  hr: 'Croatian', sr: 'Serbian (Cyrillic)', sl: 'Slovenian', uk: 'Ukrainian',
  lt: 'Lithuanian', lv: 'Latvian', et: 'Estonian', he: 'Hebrew', fa: 'Persian',
  ur: 'Urdu', hi: 'Hindi', bn: 'Bengali', pa: 'Punjabi', ta: 'Tamil',
  te: 'Telugu', th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay',
  fil: 'Filipino', sw: 'Swahili', am: 'Amharic', ha: 'Hausa', yo: 'Yoruba',
  zu: 'Zulu', af: 'Afrikaans', ka: 'Georgian', hy: 'Armenian',
  az: 'Azerbaijani', kk: 'Kazakh', uz: 'Uzbek', ne: 'Nepali', si: 'Sinhala',
  km: 'Khmer', my: 'Burmese', mn: 'Mongolian', lo: 'Lao',
};

const FREE_MODELS = [
  'z-ai/glm-5.2:free',
  'minimax/minimax-m3:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'inclusionai/ling-3.0-flash-fin:free',
];

export const maxDuration = 30;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, key: keyName, value, context } = req.body || {};
  const langName = LANG_NAMES[code];
  if (!langName || !keyName || typeof value !== 'string') {
    return res.status(400).json({ error: 'code, key, value (string) required' });
  }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });

  const ctx = context ? `\n\nContext: ${context}` : '';
  const prompt = `Translate the UI string of "Dreamscope" (dream-interpretation website) from English to ${langName}.
Key: ${keyName}
Value: ${value}${ctx}

Rules:
- Natural, warm product copy — not word-for-word.
- Keep every {placeholder} like {accent}, {n}, {year} EXACTLY as-is.
- Keep "Dreamscope" untranslated.
- Respond with ONLY the translation string, no JSON, no quotes, no commentary.`;

  for (const model of FREE_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dreamscope.app',
          'X-Title': 'Dreamscope UI Localization (one-key)',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 400,
          messages: [
            { role: 'system', content: 'You are a professional UI localizer. Output only the translation string.' },
            { role: 'user', content: prompt },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!r.ok) { console.log(`[translate-one:${code}] ${model} HTTP ${r.status}`); continue; }
      const data = await r.json();
      const text = (data?.choices?.[0]?.message?.content || '').trim();
      if (!text) continue;
      const cleaned = text.replace(/^["'`]+|["'`]+$/g, '').trim();
      if (!cleaned) continue;
      return res.status(200).json({ translation: cleaned, engine: model });
    } catch {
      continue;
    }
  }
  return res.status(502).json({ error: 'All models failed' });
}
