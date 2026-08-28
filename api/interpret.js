const LANGUAGES = {
  en: 'English', ar: 'العربية', es: 'Español', fr: 'Français',
  de: 'Deutsch', it: 'Italiano', pt: 'Português', ru: 'Русский',
  zh: '中文', ja: '日本語', ko: '한국어', tr: 'Türkçe',
  nl: 'Nederlands', pl: 'Polski', sv: 'Svenska', da: 'Dansk', no: 'Norsk',
  fi: 'Suomi', he: 'עברית', hi: 'हिंदी', th: 'ไทย', vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia', ms: 'Bahasa Melayu', el: 'Ελληνικά',
  cs: 'Čeština', hu: 'Magyar', ro: 'Română', sk: 'Slovenčina',
  uk: 'Українська', bg: 'Български', hr: 'Hrvatski',
  lt: 'Lietuvių', lv: 'Latviešu', et: 'Eesti', sl: 'Slovenščina'
};

const DREAM_SYMBOLS = {
  snake: {
    en: 'Snakes in dreams often represent transformation, hidden fears, or wisdom. Consider what is shedding or changing in your life.',
    ar: 'الأفاعي في الأحلام غالباً ما ترمز إلى التحول والمخاوف المخفية والحكمة. فكر فيما يتغير أو يتساقط في حياتك.',
    es: 'Las serpientes en los sueños a menudo representan transformación, miedos ocultos o sabiduría.',
    fr: 'Les serpents dans les rêves représentent souvent la transformation, les peurs cachées ou la sagesse.',
    de: 'Schlangen in Träumen stehen oft für Transformation, verborgene Ängste oder Weisheit.'
  },
  water: {
    en: 'Water represents emotions, the subconscious mind, and purification. Clear water suggests clarity; turbulent water suggests emotional turmoil.',
    ar: 'الماء يرمز إلى العواطف والعقل الباطن والتطهير. الماء الصافي يوحي بالوضوح، والمضطرب يوحي بالاضطراب العاطفي.',
    es: 'El agua representa emociones, el subconsciente y la purificación.',
    fr: 'L\'eau représente les émotions, l\'inconscient et la purification.',
    de: 'Wasser steht für Emotionen, das Unterbewusstsein und Reinigung.'
  },
  flying: {
    en: 'Flying in dreams symbolizes freedom, ambition, and transcendence. It often reflects a desire to rise above current circumstances.',
    ar: 'الطيران في الأحلام يرمز إلى الحرية والطموح والتسامي. غالباً ما يعكس رغبة في الارتفاع فوق الظروف الحالية.',
    es: 'Volar en sueños simboliza libertad, ambición y trascendencia.',
    fr: 'Voler dans les rêves symbolise la liberté, l\'ambition et la transcendance.',
    de: 'Fliegen im Traum symbolisiert Freiheit, Ehrgeiz und Transzendenz.'
  },
  house: {
    en: 'A house in dreams represents the self, your psyche, and different aspects of your personality. Each room may symbolize a different facet.',
    ar: 'البيت في الأحلام يمثل الذات والنفس وجوانب مختلفة من شخصيتك. كل غرفة قد ترمز لجانب مختلف.',
    es: 'Una casa en los sueños representa el yo, la psique y diferentes aspectos de tu personalidad.',
    fr: 'Une maison dans les rêves représente le soi, la psyché et différents aspects de votre personnalité.',
    de: 'Ein Haus im Traum steht für das Selbst, die Psyche und verschiedene Aspekte der Persönlichkeit.'
  },
  death: {
    en: 'Dreams of death often symbolize transformation, endings, and new beginnings rather than literal death. They mark transitions in life.',
    ar: 'أحلام الموت غالباً ما ترمز إلى التحول والنهايات والبدايات الجديدة وليس الموت الفعلي. فهي تحدد انتقالات في الحياة.',
    es: 'Los sueños de muerte a menudo simbolizan transformación, finales y nuevos comienzos.',
    fr: 'Les rêves de mort symbolisent souvent la transformation, les fins et les nouveaux départs.',
    de: 'Todesräume symbolisieren oft Transformation, Enden und Neuanfänge.'
  },
  teeth: {
    en: 'Dreaming about teeth falling out often relates to anxiety, loss of control, or concerns about appearance and communication.',
    ar: 'الحلم بسقوط الأسنان غالباً ما يتعلق بالقلق وفقدان السيطرة أو مخاوف بشأن المظهر والتواصل.',
    es: 'Soñar con dientes que se caen a menudo se relaciona con ansiedad, pérdida de control o preocupaciones sobre la apariencia.',
    fr: 'Rêver de dents qui tombent est souvent lié à l\'anxiété, à la perte de contrôle ou aux préoccupations concernant l\'apparence.',
    de: 'Von ausfallenden Zähnen zu träumen hängt oft mit Angst, Kontrollverlust oder Sorgen um das Aussehen zusammen.'
  }
};

const KEYWORDS = {
  snake: ['snake', 'serpent', 'viper', 'cobra', 'أفعى', 'ثعبان', 'حية'],
  water: ['water', 'ocean', 'river', 'sea', 'ماء', 'بحر', 'نهر'],
  flying: ['fly', 'flying', 'soar', 'أطير', 'طيران', 'حلّق'],
  house: ['house', 'home', 'building', 'بيت', 'منزل', 'دار'],
  death: ['death', 'dying', 'dead', 'موت', 'ميت', 'مامات'],
  teeth: ['teeth', 'tooth', 'أسنان', 'سنة', 'سن']
};

function detectSymbols(dream) {
  const lower = dream.toLowerCase();
  const found = [];
  for (const [symbol, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lower.includes(w))) found.push(symbol);
  }
  return found;
}

function buildInterpretation(dream, language) {
  const lang = LANGUAGES[language] ? language : 'en';
  const symbols = detectSymbols(dream);
  const intros = {
    en: 'Your dream touches on important symbols from your subconscious. Here is what they may mean:',
    ar: 'حلمك يلامس رموزاً مهمة من عقلك الباطن. إليك ما قد تعنيه:',
    es: 'Tu sueño toca símbolos importantes de tu subconsciente. Aquí está lo que pueden significar:',
    fr: 'Votre rêve touche des symboles importants de votre inconscient. Voici ce qu\'ils peuvent signifier:',
    de: 'Ihr Traum berührt wichtige Symbole Ihres Unterbewusstseins. Hier ist, was sie bedeuten können:'
  };
  const closings = {
    en: '\n\nIn Islamic tradition (Ibn Sirin), dreams are seen as messages from the soul. Reflect on what your heart is telling you, and seek wisdom through prayer and contemplation.',
    ar: '\n\nفي التراث الإسلامي (ابن سيرين)، تُعتبر الأحلام رسائل من الروح. تأمل فيما يخبرك به قلبك، واطلب الحكمة من خلال الصلاة والتأمل.',
    es: '\n\nEn la tradición islámica (Ibn Sirin), los sueños son mensajes del alma. Reflexiona sobre lo que te dice tu corazón.',
    fr: '\n\nDans la tradition islamique (Ibn Sirin), les rêves sont des messages de l\'âme. Réfléchissez à ce que votre cœur vous dit.',
    de: '\n\nIn der islamischen Tradition (Ibn Sirin) sind Träume Botschaften der Seele. Reflektieren Sie, was Ihr Herz Ihnen sagt.'
  };
  let result = intros[lang] || intros.en;
  if (symbols.length > 0) {
    for (const sym of symbols) {
      const text = DREAM_SYMBOLS[sym][lang] || DREAM_SYMBOLS[sym].en;
      result += '\n\n• ' + text;
    }
  } else {
    const generic = {
      en: '\n\nYour dream is a personal narrative from your subconscious. Consider the emotions you felt, the setting, and any people involved. These details offer keys to understanding your inner world.',
      ar: '\n\nحلمك سرد شخصي من عقلك الباطن. فكر في المشاعر التي شعرت بها والمكان وأي أشخاص مشاركين. هذه التفاصيل تقدم مفاتيح لفهم عالمك الداخلي.',
      es: '\n\nTu sueño es una narrativa personal de tu subconsciente. Considera las emociones que sentiste, el escenario y las personas involucradas.',
      fr: '\n\nVotre rêve est un récit personnel de votre inconscient. Considérez les émotions que vous avez ressenties, le décor et les personnes impliquées.',
      de: '\n\nIhr Traum ist eine persönliche Erzählung Ihres Unterbewusstseins. Betrachten Sie die Emotionen, die Sie gefühlt haben.'
    };
    result += generic[lang] || generic.en;
  }
  result += closings[lang] || closings.en;
  return result;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { dream, language } = req.body || {};
  if (!dream || !language) {
    return res.status(400).json({ error: 'Dream and language are required' });
  }
  try {
    const interpretation = buildInterpretation(dream, language);
    return res.status(200).json({
      interpretation,
      id: Date.now().toString()
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to interpret dream' });
  }
}