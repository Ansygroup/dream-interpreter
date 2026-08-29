/**
 * POST /api/translate — server-side UI localization used by scripts/evolve.mjs.
 * The OpenRouter key never leaves Vercel; the client only sends a language code.
 *
 * Body: { code: string }  (target language code from the supported list)
 * Resp: { translations: object (same shape as en.json), engine }
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
  km: 'Khmer', my: 'Burmese', mn: 'Mongolian',
};

const FREE_MODELS = [
  'z-ai/glm-5.2:free',
  'minimax/minimax-m3:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'inclusionai/ling-3.0-flash-fin:free',
];

export const maxDuration = 60;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, source } = req.body || {};
  const langName = LANG_NAMES[code];
  if (!langName || !source || typeof source !== 'object') {
    return res.status(400).json({ error: 'code and source (object) are required' });
  }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });

  const prompt = `Translate the UI strings of "Dreamscope", a dream-interpretation website, from English to ${langName}.

Rules:
- Natural, warm, respectful product copy — not word-for-word.
- Keep every {placeholder} like {accent}, {n}, {year} EXACTLY as-is.
- Keep the brand name "Dreamscope" untranslated.
- Render "Ibn Sirin" appropriately for the language (e.g. ابن سيرين in Arabic).
- Dreams/spiritual content: neutral and inclusive tone.
- Respond with ONLY a valid JSON object mapping the SAME keys to the ${langName} translations. No markdown fences, no commentary.

Input JSON:
${JSON.stringify(source)}`;

  for (const model of FREE_MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dreamscope.app',
          'X-Title': 'Dreamscope UI Localization',
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 8000,
          messages: [
            { role: 'system', content: 'You are a professional UI localizer. You output only valid JSON.' },
            { role: 'user', content: prompt },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!r.ok) {
        console.log(`[translate:${code}] ${model} HTTP ${r.status}`);
        continue;
      }
      const data = await r.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) continue;
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
      const parsed = JSON.parse(cleaned);
      // Every source key must come back as a non-empty string
      const ok = Object.keys(source).every((k) => typeof parsed[k] === 'string' && parsed[k].trim());
      if (!ok) {
        console.log(`[translate:${code}] ${model} missing keys`);
        continue;
      }
      // Placeholder integrity
      const ph = (s) => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
      const broken = Object.keys(source).filter((k) => ph(source[k]) !== ph(parsed[k]));
      if (broken.length) {
        console.log(`[translate:${code}] ${model} placeholder mismatch: ${broken.slice(0, 3).join(',')}`);
        continue;
      }
      return res.status(200).json({ translations: parsed, engine: model });
    } catch (e) {
      console.log(`[translate:${code}] ${model} error ${e?.message || e}`);
      continue;
    }
  }
  return res.status(502).json({ error: 'All translation models failed' });
}
