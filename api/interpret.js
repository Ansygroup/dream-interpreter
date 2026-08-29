/**
 * POST /api/interpret — the Dreamscope interpretation engine.
 *
 * Hybrid chain (first success wins):
 *   1. OpenRouter LLM (primary paid-cheap model, then free fallback)
 *   2. Offline symbol-keyword DB (never fails)
 *
 * Body: { dream: string, language: string, perspective?: string }
 * Resp: { interpretation, symbols, engine, perspective, id }
 */

const LANGUAGES = {
  en: 'English', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', ru: 'Russian', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', tr: 'Turkish', nl: 'Dutch', pl: 'Polish', sv: 'Swedish',
  da: 'Danish', no: 'Norwegian', fi: 'Finnish', el: 'Greek', cs: 'Czech',
  sk: 'Slovak', hu: 'Hungarian', ro: 'Romanian', bg: 'Bulgarian', hr: 'Croatian',
  sr: 'Serbian', sl: 'Slovenian', uk: 'Ukrainian', lt: 'Lithuanian',
  lv: 'Latvian', et: 'Estonian', he: 'Hebrew', fa: 'Persian', ur: 'Urdu',
  hi: 'Hindi', bn: 'Bengali', pa: 'Punjabi', ta: 'Tamil', te: 'Telugu',
  th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', fil: 'Filipino',
  sw: 'Swahili', am: 'Amharic', ha: 'Hausa', yo: 'Yoruba', zu: 'Zulu',
  af: 'Afrikaans', ka: 'Georgian', hy: 'Armenian', az: 'Azerbaijani',
  kk: 'Kazakh', uz: 'Uzbek', ne: 'Nepali', si: 'Sinhala', km: 'Khmer',
  my: 'Burmese', mn: 'Mongolian',
};

/** Interpretation perspectives — religious traditions + psychology. */
const PERSPECTIVES = {
  general: {
    label: 'Universal blend',
    prompt: 'Blend the wisest threads of world dream traditions with depth psychology. Stay universal and inclusive.',
  },
  islamic: {
    label: 'Islamic (Ibn Sirin)',
    prompt: "Interpret through the classical Islamic tradition of Ibn Sirin and authentic oneiric science (ta'bir al-ru'ya). Use its symbolism, speak respectfully of lawful guidance, and may mention prayer and reflection (salah, dhikr) where fitting. Avoid fortune-telling claims.",
  },
  christian: {
    label: 'Christian',
    prompt: 'Interpret through the Christian biblical tradition — Joseph and Daniel-style dream reading, pastoral warmth, scriptural symbolism (light, sheep, living water). Encourage prayerful reflection. Avoid superstition.',
  },
  jewish: {
    label: 'Jewish',
    prompt: 'Interpret through the Jewish tradition — Torah and Talmudic dream wisdom (Choni, the dream-interpretation sages), symbolism of the prophets. A thoughtful, textually-grounded voice.',
  },
  hindu: {
    label: 'Hindu',
    prompt: 'Interpret through the Hindu tradition — Vedic and Upanishadic dream understanding, symbolism of deities and nature, karma and samskara. A dharmic, reflective voice.',
  },
  buddhist: {
    label: 'Buddhist',
    prompt: 'Interpret through the Buddhist tradition — mind and impermanence, Tibetan dream yoga insight, mindful awareness. Gentle, non-attached, compassionate framing.',
  },
  psychology: {
    label: 'Psychology (Jung & Freud)',
    prompt: 'Interpret through depth psychology — Jungian archetypes, the shadow, individuation, and Freudian wish-symbolism. Secular, reflective, focused on what the psyche may be processing.',
  },
  chinese: {
    label: 'Chinese (Zhou Gong)',
    prompt: 'Interpret through the Chinese tradition of Zhou Gong dream interpretation (Zhou Gong Jie Meng) — classical symbolism, yin-yang and five-elements balance. A calm, traditional voice.',
  },
};

/* ---------------- Offline fallback DB ---------------- */

const DREAM_SYMBOLS = {
  snake: {
    keywords: ['snake', 'serpent', 'viper', 'cobra', 'أفعى', 'ثعبان', 'حية'],
    en: 'Snakes in dreams often represent transformation, hidden fears, or wisdom. Consider what is shedding or changing in your life.',
    ar: 'الأفاعي في الأحلام غالباً ما ترمز إلى التحول والمخاوف المخفية والحكمة. فكر فيما يتغير أو يتساقط في حياتك.',
  },
  water: {
    keywords: ['water', 'ocean', 'river', 'sea', 'ماء', 'بحر', 'نهر'],
    en: 'Water represents emotions, the subconscious, and purification. Clear water suggests clarity; turbulent water suggests emotional turmoil.',
    ar: 'الماء يرمز إلى العواطف والعقل الباطن والتطهير. الماء الصافي يوحي بالوضوح، والمضطرب يوحي بالاضطراب العاطفي.',
  },
  flying: {
    keywords: ['fly', 'flying', 'flew', 'طيران', 'يطير'],
    en: 'Flying symbolizes freedom, ambition, and transcendence — a desire to rise above current circumstances.',
    ar: 'الطيران يرمز إلى الحرية والطموح والتسامي — رغبة في الارتفاع فوق الظروف الحالية.',
  },
  house: {
    keywords: ['house', 'home', 'room', 'بيت', 'منزل', 'غرفة'],
    en: 'A house represents the self and different facets of your personality — each room a different aspect.',
    ar: 'البيت يمثل الذات وجوانب شخصيتك المختلفة — وكل غرفة جانباً مختلفاً.',
  },
  teeth: {
    keywords: ['teeth', 'tooth', 'أسنان', 'ضرس', 'سن'],
    en: 'Teeth falling out often relates to anxiety, loss of control, or concerns about appearance and communication.',
    ar: 'سقوط الأسنان غالباً ما يتعلق بالقلق وفقدان السيطرة أو مخاوف بشأن المظهر والتواصل.',
  },
  death: {
    keywords: ['death', 'died', 'funeral', 'موت', 'ميت', 'جنازة'],
    en: 'Dreams of death symbolize transformation, endings, and new beginnings rather than literal death — a transition in life.',
    ar: 'أحلام الموت ترمز إلى التحول والنهايات والبدايات الجديدة وليس الموت الفعلي — انتقال في الحياة.',
  },
  falling: {
    keywords: ['fall', 'falling', 'سقوط', 'يسقط'],
    en: 'Falling often reflects insecurity, loss of control, or the need to let go of something.',
    ar: 'السقوط غالباً يعكس انعدام الأمان أو فقدان السيطرة أو الحاجة إلى التخلي عن شيء ما.',
  },
  baby: {
    keywords: ['baby', 'infant', 'رضيع', 'طفل صغير'],
    en: 'A baby symbolizes new beginnings, potential, or a growing responsibility or project.',
    ar: 'الرضيع يرمز إلى بدايات جديدة وإمكانات أو مسؤولية أو مشروع نامٍ.',
  },
  money: {
    keywords: ['money', 'cash', 'gold', 'مال', 'ذهب', 'نقود'],
    en: 'Money in dreams reflects self-worth, opportunity, or anxieties about security and resources.',
    ar: 'المال في الأحلام يعكس تقدير الذات أو الفرص أو مخاوف الأمان والموارد.',
  },
  wedding: {
    keywords: ['wedding', 'marriage', 'زواج', 'عرس'],
    en: 'A wedding symbolizes union — often of two parts of yourself, or a meaningful commitment beginning.',
    ar: 'الزواج يرمز إلى الاتحاد — غالباً بين جزأين منك، أو التزام ذي معنى يبدأ.',
  },
};

function detectSymbols(text) {
  const lower = (text || '').toLowerCase();
  return Object.entries(DREAM_SYMBOLS)
    .filter(([, v]) => v.keywords.some((k) => lower.includes(k)))
    .map(([k]) => k);
}

function buildFallback(dream, lang, perspective) {
  const isAr = lang === 'ar';
  const hits = detectSymbols(dream);
  const parts = [];
  if (hits.length) {
    parts.push(isAr ? 'حلمك يلامس رموزاً مهمة من عقلك الباطن:' : 'Your dream touches important symbols from your subconscious:');
    for (const h of hits.slice(0, 3)) {
      const line = DREAM_SYMBOLS[h][lang] || DREAM_SYMBOLS[h].en;
      parts.push(`• ${line}`);
    }
  } else {
    parts.push(
      isAr
        ? 'حلمك يحمل تفاصيل شخصية خاصة بك. تأمل في المشاعر السائدة فيه — هي المفتاح الحقيقي لمعناه.'
        : 'Your dream carries details that are uniquely yours. Reflect on the dominant feelings in it — they are the true key to its meaning.'
    );
  }
  const closings = {
    general: isAr
      ? 'تأمل فيما يخبرك به قلبك — الأحلام مرايا لما نحمله في الداخل.'
      : 'Reflect on what your heart tells you — dreams mirror what we carry within.',
    islamic: isAr
      ? 'وفي التراث الإسلامي (ابن سيرين) تُعدّ الأحلام رسائل للروح: تأمّل، وتحرَّ الخير، وتقرَّب بالصلاة والتأمل.'
      : 'In the Islamic tradition (Ibn Sirin), dreams are messages of the soul: reflect, seek the good, and turn to prayer and contemplation.',
    christian: isAr
      ? 'وفي التقليد المسيحي، تُقرأ الأحلام كما قرأها يوسف ودانيال: رسائل يتدبّرها القلب بالصلاة.'
      : 'In the Christian tradition, dreams are read as Joseph and Daniel read them: messages the heart ponders in prayer.',
    jewish: isAr
      ? 'وفي التقليد اليهودي، الحلم رسالة تحتاج إلى تفسير وحكمة كما في التلمود.'
      : 'In the Jewish tradition, a dream is a message awaiting wise interpretation, as the Talmud teaches.',
    hindu: isAr
      ? 'وفي التقليد الهندوسي، الحلم انعكاس للذهن الداخلي ودورة الكارما — تأمّل بعمق.'
      : 'In the Hindu tradition, a dream reflects the inner mind and the play of karma — reflect deeply.',
    buddhist: isAr
      ? 'وفي التقليد البوذي، الحلم إدراك عابر — لاحظه بوعي دون تشبث.'
      : 'In the Buddhist tradition, a dream is a passing perception — observe it with awareness, without attachment.',
    psychology: isAr
      ? 'وعلى منهج يونغ وفرويد، الحلم رسالة من اللاشعور إلى الوعي — فكّر فيما يعالجه عقلك.'
      : 'In the tradition of Jung and Freud, a dream is a message from the unconscious to the conscious mind — consider what your psyche is processing.',
    chinese: isAr
      ? 'وفي تقليد تشو قونغ الصيني، الحلم يتحدث عن توازن قوى الطبيعة — اطلب التوازن في حياتك.'
      : 'In the Chinese tradition of Zhou Gong, a dream speaks of balance among natural forces — seek balance in your life.',
  };
  parts.push(closings[perspective] || closings.general);
  return parts.join('\n\n');
}

/* ---------------- OpenRouter client ---------------- */

// Free-first chain: each free model has its own availability window, so we
// cascade. A paid model is only used when explicitly set via DREAMSCOPE_AI_MODEL.
const FREE_MODELS = [
  'z-ai/glm-5.2:free',
  'minimax/minimax-m3:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'google/gemma-4-31b-it:free',
  'inclusionai/ling-3.0-flash-fin:free',
];
const MODELS = [
  ...(process.env.DREAMSCOPE_AI_MODEL ? [process.env.DREAMSCOPE_AI_MODEL] : FREE_MODELS),
];

async function callLLM(dream, langName, perspective) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('no-key');
  const p = PERSPECTIVES[perspective] || PERSPECTIVES.general;

  const system = `You are Dreamscope, a wise and culturally-grounded dream interpreter. You write clear, warm, reflective readings in ${langName}.

${p.prompt}

Rules:
- Respond ONLY in ${langName}.
- 2 to 4 short paragraphs (max ~180 words). No headings, no markdown.
- Name the key symbols and what they traditionally mean; tie them gently to life circumstances.
- Never predict death, illness, or misfortune as fact; dreams reflect, they do not foretell.
- End with one grounding sentence of reflection or gentle guidance.
- If the dream text is too short or unclear, ask for one kind clarifying detail instead of inventing meaning.`;

  const user = `Dream (as the dreamer wrote it):\n"""${dream.slice(0, 2000)}"""\n\nFirst line of your reply must be exactly the detected symbols in English, comma-separated, like: SYMBOLS: snake, water, fire. If none are clear, write SYMBOLS: none. Then a blank line, then the ${langName} interpretation.`;

  for (const model of MODELS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dreamscope.app',
          'X-Title': 'Dreamscope',
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 700,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        console.log(`[interpret] ${model} -> HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content?.trim();
      if (!text) continue;
      // Parse "SYMBOLS: a, b" prefix
      const m = text.match(/^SYMBOLS:\s*(.+)\n*/i);
      let symbols = [];
      let interpretation = text;
      if (m) {
        symbols = m[1]
          .split(',')
          .map((s) => s.trim().toLowerCase())
          .filter((s) => s && s !== 'none')
          .slice(0, 4);
        interpretation = text.slice(m[0].length).trim();
      }
      if (interpretation.length < 40) continue;
      return { interpretation, symbols, engine: model };
    } catch (e) {
      console.log(`[interpret] ${model} -> error ${e?.message || e}`);
      continue;
    }
  }
  throw new Error('all-models-failed');
}

/* ---------------- Handler ---------------- */

// Allow the full free-model cascade to run within the function budget.
export const maxDuration = 45;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { dream, language, perspective } = req.body || {};
  if (!dream || typeof dream !== 'string' || !dream.trim()) {
    return res.status(400).json({ error: 'Dream text is required' });
  }
  const lang = LANGUAGES[language] ? language : 'en';
  const persp = PERSPECTIVES[perspective] ? perspective : 'general';
  const langName = LANGUAGES[lang];

  try {
    const result = await callLLM(dream.trim(), langName, persp);
    return res.status(200).json({
      interpretation: result.interpretation,
      symbols: result.symbols,
      engine: result.engine,
      perspective: persp,
      id: String(Date.now()),
    });
  } catch {
    // Offline keyword DB — the engine never fully fails
    return res.status(200).json({
      interpretation: buildFallback(dream, lang, persp),
      symbols: detectSymbols(dream),
      engine: 'offline',
      perspective: persp,
      id: String(Date.now()),
    });
  }
}
