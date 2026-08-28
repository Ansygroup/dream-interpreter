// Long-tail scenario bank: real dream phrasings users search for.
// Each scenario = { base: english phrase template (uses {sym}), tr: {lang: translated phrase} }
// Rendered as /seo/:sym/:lang/:scenario-slug with unique content.
export const SCENARIOS = [
  {
    base: 'I dreamed about {sym}',
    tr: {
      en: 'I dreamed about {sym}', ar: 'حلمت بـ {sym}', es: 'Soñé con {sym}', fr: 'J\'ai rêvé de {sym}',
      de: 'Ich habe von {sym} geträumt', pt: 'Sonhei com {sym}', ru: 'Мне снился {sym}',
      zh: '我梦见{sym}', ja: '{sym}の夢を見た', ko: '{sym} 꿈을 꿨어요', tr: '{sym} gördüm',
      hi: 'मैंने {sym} का सपना देखा', it: 'Ho sognato {sym}',
    },
  },
  {
    base: 'Dreaming of {sym} and feeling scared',
    tr: {
      en: 'Dreaming of {sym} and feeling scared', ar: 'حلمت بـ {sym} وأنا خائف', es: 'Soñando con {sym} y sintiéndome asustado',
      fr: 'Rêver de {sym} en ayant peur', de: 'Von {sym} träumen und Angst haben', pt: 'Sonhar com {sym} e sentir medo',
      ru: 'Снился {sym} и страшно', zh: '梦见{sym}并感到害怕', ja: '{sym}で怖い夢', ko: '{sym} 꿈과 무서움',
      tr: '{sym} görüp korkmak', hi: '{sym} का सपना और डर', it: 'Sognare {sym} ed essere spaventati',
    },
  },
  {
    base: 'What does it mean to see {sym} in a dream',
    tr: {
      en: 'What does it mean to see {sym} in a dream', ar: 'ماذا يعني رؤية {sym} في الحلم', es: 'Qué significa ver {sym} en un sueño',
      fr: 'Que signifie voir {sym} dans un rêve', de: 'Was bedeutet {sym} im Traum zu sehen', pt: 'O que significa ver {sym} num sonho',
      ru: 'Что значит видеть {sym} во сне', zh: '梦里见到{sym}是什么意思', ja: '夢で{sym}を見る意味', ko: '꿈에서 {sym} 보는 의미',
      tr: '{sym} görmek ne demek', hi: 'सपने में {sym} देखने का मतलब', it: 'Cosa significa vedere {sym} in sogno',
    },
  },
  {
    base: 'Dream about {sym} chasing me',
    tr: {
      en: 'Dream about {sym} chasing me', ar: 'حلمت بـ {sym} يطاردني', es: 'Soñar con {sym} persiguiéndome',
      fr: 'Rêver de {sym} qui me poursuit', de: 'Traum dass {sym} mich jagt', pt: 'Sonhar com {sym} me perseguindo',
      ru: 'Сон что {sym} гонится за мной', zh: '梦见{sym}追我', ja: '{sym}に追われる夢', ko: '{sym}이 나를 쫓는 꿈',
      tr: '{sym} beni kovalaması', hi: '{sym} का सपना जो मुझे भगाता', it: 'Sognare {sym} che mi insegue',
    },
  },
  {
    base: 'Repeated dreams of {sym}',
    tr: {
      en: 'Repeated dreams of {sym}', ar: 'أحلام متكررة عن {sym}', es: 'Sueños repetidos de {sym}',
      fr: 'Rêves répétés de {sym}', de: 'Wiederkehrende Träume von {sym}', pt: 'Sonhos repetidos de {sym}',
      ru: 'Повторяющиеся сны о {sym}', zh: '反复梦见{sym}', ja: '繰り返す{sym}の夢', ko: '반복되는 {sym} 꿈',
      tr: 'Tekrarlayan {sym} rüyaları', hi: 'बार-बार {sym} के सपने', it: 'Sogni ricorrenti di {sym}',
    },
  },
  {
    base: 'Seeing {sym} in my dream meaning',
    tr: {
      en: 'Seeing {sym} in my dream meaning', ar: 'رؤية {sym} في حلمي المعنى', es: 'Ver {sym} en mi sueño significado',
      fr: 'Voir {sym} dans mon rêve signification', de: 'Bedeutung {sym} in meinem Traum', pt: 'Ver {sym} no meu sonho significado',
      ru: 'Видеть {sym} во сне значение', zh: '梦中看见{sym}的含义', ja: '夢で{sym}を見る意味', ko: '내 꿈에 {sym} 의미',
      tr: '{sym} rüyamda görmek anlamı', hi: 'मेरे सपने में {sym} का अर्थ', it: 'Vedere {sym} nel sogno significato',
    },
  },
  {
    base: 'Dream of {sym} spiritual meaning',
    tr: {
      en: 'Dream of {sym} spiritual meaning', ar: 'حلم {sym} المعنى الروحي', es: 'Significado espiritual de soñar con {sym}',
      fr: 'Sens spirituel rêver de {sym}', de: 'Geistige Bedeutung {sym} Traum', pt: 'Significado espiritual sonhar {sym}',
      ru: 'Духовный смысл сна {sym}', zh: '{sym}梦的灵性意义', ja: '{sym}の霊的意味', ko: '{sym} 꿈 영적 의미',
      tr: '{sym} rüyanın manevi anlamı', hi: '{sym} सपने का आध्यात्मिक अर्थ', it: 'Significato spirituale sogno {sym}',
    },
  },
  {
    base: 'Is dreaming of {sym} a good sign',
    tr: {
      en: 'Is dreaming of {sym} a good sign', ar: 'هل حلم {sym} علامة جيدة', es: '¿Soñar con {sym} es buen augurio?',
      fr: 'Rêver de {sym} est-il un bon signe', de: 'Ist {sym} Traum ein gutes Zeichen', pt: 'Sonhar com {sym} é bom sinal',
      ru: 'Сон {sym} хорошая примета', zh: '梦见{sym}是吉兆吗', ja: '{sym}の夢は良い兆し', ko: '{sym} 꿈은 좋은 징조인가',
      tr: '{sym} görmek iyi işaret mi', hi: 'क्या {sym} का सपना शुभ है', it: 'Sognare {sym} è un buon segno',
    },
  },
  {
    base: 'Dream about {sym} according to Ibn Sirin',
    tr: {
      en: 'Dream about {sym} according to Ibn Sirin', ar: 'تفسير حلم {sym} عند ابن سيرين', es: 'Soñar con {sym} según Ibn Sirin',
      fr: 'Rêver de {sym} selon Ibn Sirin', de: '{sym} Traum nach Ibn Sirin', pt: 'Sonhar com {sym} segundo Ibn Sirin',
      ru: 'Сон {sym} по Ибн Сирину', zh: '按伊本·西林解梦{sym}', ja: 'イブン・シリーンによる{sym}の夢', ko: '이븐 시린의 {sym} 꿈',
      tr: '{sym} rüyası İbn Sirin\'e göre', hi: 'इब्ने सीरीन के अनुसार {sym} का सपना', it: 'Sognare {sym} secondo Ibn Sirin',
    },
  },
  {
    base: 'Meaning of {sym} in a dream for a woman',
    tr: {
      en: 'Meaning of {sym} in a dream for a woman', ar: 'معنى {sym} في حلم العزباء', es: 'Significado de {sym} en sueño de mujer',
      fr: 'Signification de {sym} en rêve pour une femme', de: 'Bedeutung {sym} Traum für Frau', pt: 'Significado de {sym} em sonho de mulher',
      ru: 'Значение {sym} во сне для женщины', zh: '女性梦见{sym}的含义', ja: '女性の{sym}の夢の意味', ko: '여성의 {sym} 꿈 의미',
      tr: 'Kadın için {sym} rüya anlamı', hi: 'स्त्री के सपने में {sym} का अर्थ', it: 'Significato di {sym} in sogno per donna',
    },
  },
];
