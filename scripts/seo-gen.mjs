import fs from 'fs';
import path from 'path';
import { EXTRA_SYMBOLS } from './symbols-extra.mjs';
import { BATCH2_SYMBOLS } from './symbols-batch2.mjs';
import { BATCH3_SYMBOLS } from './symbols-batch3.mjs';
import { BATCH4_SYMBOLS } from './symbols-batch4.mjs';
import { BATCH5_SYMBOLS } from './symbols-batch5.mjs';
import { SCENARIOS } from './scenarios.mjs';

const BASE = 'https://dream-interpreter-alpha-ruddy.vercel.app';

// Convert EXTRA_SYMBOLS (array tuples) into the SYM format { lang: {t,h,m} }
const LANG_ORDER = ['en','ar','es','fr','de','pt','ru','zh','ja','ko','tr','hi','it'];
function convertExtra() {
  const out = {};
  for (const [sk, arr] of Object.entries(EXTRA_SYMBOLS)) {
    const rec = {};
    LANG_ORDER.forEach((lang, i) => {
      const o = i * 3;
      rec[lang] = { t: arr[o], h: arr[o+1], m: arr[o+2] };
    });
    out[sk] = rec;
  }
  return out;
}
const EXTRA = convertExtra();

// Convert BATCH2_SYMBOLS (same tuple format) into SYM format
function convertBatch2() {
  const out = {};
  for (const [sk, arr] of Object.entries(BATCH2_SYMBOLS)) {
    const rec = {};
    LANG_ORDER.forEach((lang, i) => {
      const o = i * 3;
      rec[lang] = { t: arr[o], h: arr[o+1], m: arr[o+2] };
    });
    out[sk] = rec;
  }
  return out;
}
const BATCH2 = convertBatch2();

// Convert BATCH3_SYMBOLS (same tuple format) into SYM format
function convertBatch3() {
  const out = {};
  for (const [sk, arr] of Object.entries(BATCH3_SYMBOLS)) {
    const rec = {};
    LANG_ORDER.forEach((lang, i) => {
      const o = i * 3;
      rec[lang] = { t: arr[o], h: arr[o+1], m: arr[o+2] };
    });
    out[sk] = rec;
  }
  return out;
}
const BATCH3 = convertBatch3();

// Convert BATCH4_SYMBOLS (same tuple format) into SYM format
function convertBatch4() {
  const out = {};
  for (const [sk, arr] of Object.entries(BATCH4_SYMBOLS)) {
    const rec = {};
    LANG_ORDER.forEach((lang, i) => {
      const o = i * 3;
      rec[lang] = { t: arr[o], h: arr[o+1], m: arr[o+2] };
    });
    out[sk] = rec;
  }
  return out;
}
const BATCH4 = convertBatch4();

// Convert BATCH5_SYMBOLS (same tuple format) into SYM format
function convertBatch5() {
  const out = {};
  for (const [sk, arr] of Object.entries(BATCH5_SYMBOLS)) {
    const rec = {};
    LANG_ORDER.forEach((lang, i) => {
      const o = i * 3;
      rec[lang] = { t: arr[o], h: arr[o+1], m: arr[o+2] };
    });
    out[sk] = rec;
  }
  return out;
}
const BATCH5 = convertBatch5();

// 13 core languages for programmatic pages
const LANGS = {
  en: { name: 'English', dir: 'ltr' },
  ar: { name: 'العربية', dir: 'rtl' },
  es: { name: 'Español', dir: 'ltr' },
  fr: { name: 'Français', dir: 'ltr' },
  de: { name: 'Deutsch', dir: 'ltr' },
  pt: { name: 'Português', dir: 'ltr' },
  ru: { name: 'Русский', dir: 'ltr' },
  zh: { name: '中文', dir: 'ltr' },
  ja: { name: '日本語', dir: 'ltr' },
  ko: { name: '한국어', dir: 'ltr' },
  tr: { name: 'Türkçe', dir: 'ltr' },
  hi: { name: 'हिंदी', dir: 'ltr' },
  it: { name: 'Italiano', dir: 'ltr' },
};

// Symbol dictionary: meaning per language
const SYM = {
  snake: {
    en: { t: 'Snake Dream Meaning', h: 'What Does It Mean to Dream About Snakes?', m: 'Snakes represent transformation, hidden fears, or wisdom. Consider what is changing in your life.' },
    ar: { t: 'تفسير حلم الثعبان', h: 'ما معنى رؤية الثعبان في الحلم؟', m: 'الأفاعي ترمز للتحول والمخاوف المخفية والحكمة.' },
    es: { t: 'Soñar con serpientes', h: '¿Qué significa soñar con serpientes?', m: 'Las serpientes representan transformación y sabiduría.' },
    fr: { t: 'Rêve de serpent', h: 'Que signifie rêver de serpents?', m: 'Les serpents représentent la transformation.' },
    de: { t: 'Schlangentraum', h: 'Was bedeutet Schlangentraum?', m: 'Schlangen symbolisieren Transformation.' },
    pt: { t: 'Sonhar com cobras', h: 'O que significa sonhar com cobras?', m: 'Cobras representam transformação.' },
    ru: { t: 'Сон о змее', h: 'Что значит сон о змее?', m: 'Змеи символизируют трансформацию.' },
    zh: { t: '梦见蛇的含义', h: '梦见蛇是什么意思？', m: '蛇代表转变和智慧。' },
    ja: { t: '蛇の夢の意味', h: '蛇の夢は何を意味する？', m: '蛇は変容を表す。' },
    ko: { t: '뱀 꿈 해몽', h: '뱀 꿈은 무슨 의미일까?', m: '뱀은 변신을 나타냅니다.' },
    tr: { t: 'Yılan rüyası', h: 'Yılan görmek ne anlama gelir?', m: 'Yılanlar dönüşüm sembolize eder.' },
    hi: { t: 'साँप के सपने', h: 'सपने में साँप का क्या मतलब?', m: 'साँप रूपांतरण का प्रतीक हैं।' },
    it: { t: 'Sogno di serpenti', h: 'Cosa significa sognare serpenti?', m: 'I serpenti rappresentano trasformazione.' },
  },
  water: {
    en: { t: 'Water Dream Meaning', h: 'What Does It Mean to Dream About Water?', m: 'Water represents emotions, the subconscious, and purification.' },
    ar: { t: 'تفسير حلم الماء', h: 'ما معنى رؤية الماء في الحلم؟', m: 'الماء يرمز للعواطف والعقل الباطن والتطهير.' },
    es: { t: 'Soñar con agua', h: '¿Qué significa soñar con agua?', m: 'El agua representa emociones.' },
    fr: { t: 'Rêve d\'eau', h: 'Que signifie rêver d\'eau?', m: 'L\'eau représente les émotions.' },
    de: { t: 'Wassertraum', h: 'Was bedeutet Wassertraum?', m: 'Wasser symbolisiert Emotionen.' },
    pt: { t: 'Sonhar com água', h: 'O que significa sonhar com água?', m: 'A água representa emoções.' },
    ru: { t: 'Сон о воде', h: 'Что значит сон о воде?', m: 'Вода символизирует эмоции.' },
    zh: { t: '梦见水', h: '梦见水是什么意思？', m: '水代表情感。' },
    ja: { t: '水の夢', h: '水の夢は何を意味する？', m: '水は感情を表す。' },
    ko: { t: '물 꿈', h: '물 꿈은 무슨 의미일까?', m: '물은 감정을 나타냅니다.' },
    tr: { t: 'Su rüyası', h: 'Su görmek ne demek?', m: 'Su duyguları temsil eder.' },
    hi: { t: 'पानी का सपना', h: 'पानी का सपना क्या मतलब?', m: 'पानी भावनाओं का प्रतिनिधित्व करता है।' },
    it: { t: 'Sogno d\'acqua', h: 'Cosa significa sognare l\'acqua?', m: 'L\'acqua rappresenta le emozioni.' },
  },
  flying: {
    en: { t: 'Flying Dream Meaning', h: 'What Does It Mean to Dream About Flying?', m: 'Flying symbolizes freedom, ambition, and transcendence.' },
    ar: { t: 'تفسير حلم الطيران', h: 'ما معنى رؤية الطيران؟', m: 'الطيران يرمز للحرية والطموح.' },
    es: { t: 'Soñar con volar', h: '¿Qué significa soñar con volar?', m: 'Volar simboliza libertad.' },
    fr: { t: 'Rêve de voler', h: 'Que signifie rêver de voler?', m: 'Voler symbolise la liberté.' },
    de: { t: 'Fliegentraum', h: 'Was bedeutet Fliegentraum?', m: 'Fliegen symbolisiert Freiheit.' },
    pt: { t: 'Sonhar com voo', h: 'O que significa sonhar com voo?', m: 'Voar simboliza liberdade.' },
    ru: { t: 'Сон о полёте', h: 'Что значит сон о полёте?', m: 'Полёт символизирует свободу.' },
    zh: { t: '梦见飞行', h: '梦见飞行是什么意思？', m: '飞行象征自由。' },
    ja: { t: '飛行の夢', h: '飛行の夢は何を意味する？', m: '飛行は自由を象徴する。' },
    ko: { t: '날기 꿈', h: '날기 꿈은 무슨 의미일까?', m: '비행은 자유를 상징합니다.' },
    tr: { t: 'Uçma rüyası', h: 'Uçmak ne demek?', m: 'Uçmak özgürlüğü sembolize eder.' },
    hi: { t: 'उड़ने का सपना', h: 'सपने में उड़ने का क्या मतलब?', m: 'उड़ना स्वतंत्रता का प्रतीक है।' },
    it: { t: 'Sogno di volo', h: 'Cosa significa sognare di volare?', m: 'Volar simbolizza la libertà.' },
  },
  falling: {
    en: { t: 'Falling Dream Meaning', h: 'What Does It Mean to Dream About Falling?', m: 'Falling represents loss of control, anxiety, or insecurity.' },
    ar: { t: 'تفسير حلم السقوط', h: 'ما معنى رؤية السقوط؟', m: 'السقوط يرمز لفقدان السيطرة والقلق.' },
    es: { t: 'Soñar con caer', h: '¿Qué significa soñar con caer?', m: 'Caer representa pérdida de control.' },
    fr: { t: 'Rêve de chute', h: 'Que signifie rêver de chute?', m: 'La chute représente la perte de contrôle.' },
    de: { t: 'Falltraum', h: 'Was bedeutet Falltraum?', m: 'Fallen symbolisiert Kontrollverlust.' },
    pt: { t: 'Sonhar com queda', h: 'O que significa sonhar com queda?', m: 'Queda representa perda de controle.' },
    ru: { t: 'Сон о падении', h: 'Что значит сон о падении?', m: 'Падение символизирует потерю контроля.' },
    zh: { t: '梦见坠落', h: '梦见坠落是什么意思？', m: '坠落代表失控。' },
    ja: { t: '落下の夢', h: '落下の夢は何を意味する？', m: '落下は制御不能を表す。' },
    ko: { t: '떨어지기 꿈', h: '떨어지기 꿈은 무슨 의미일까?', m: '떨어짐은 통제력을 나타냅니다.' },
    tr: { t: 'Düşme rüyası', h: 'Düşmek ne demek?', m: 'Düşmek kontrol kaybıdır.' },
    hi: { t: 'गिरने का सपना', h: 'सपने में गिरने का क्या मतलब?', m: 'गिरना नियंत्रण की हानि है।' },
    it: { t: 'Sogno di caduta', h: 'Cosa significa sognare di cadere?', m: 'Caduta rappresenta perdita di controllo.' },
  },
  teeth: {
    en: { t: 'Teeth Dream Meaning', h: 'What Does It Mean to Dream About Teeth?', m: 'Teeth represent self-confidence, appearance, and communication.' },
    ar: { t: 'تفسير حلم الأسنان', h: 'ما معنى رؤية الأسنان؟', m: 'الأسنان ترمز للثقة بالنفس والمظهر.' },
    es: { t: 'Soñar con dientes', h: '¿Qué significa soñar con dientes?', m: 'Los dientes representan confianza.' },
    fr: { t: 'Rêve de dents', h: 'Que signifie rêver de dents?', m: 'Les dents représentent la confiance.' },
    de: { t: 'Zahntraum', h: 'Was bedeutet Zahntraum?', m: 'Zähne symbolisieren Vertrauen.' },
    pt: { t: 'Sonhar com dentes', h: 'O que significa sonhar com dentes?', m: 'Dentes representam confiança.' },
    ru: { t: 'Сон о зубах', h: 'Что значит сон о зубах?', m: 'Зубы символизируют уверенность.' },
    zh: { t: '梦见牙齿', h: '梦见牙齿是什么意思？', m: '牙齿代表自信。' },
    ja: { t: '歯の夢', h: '歯の夢は何を意味する？', m: '歯は自信を表す。' },
    ko: { t: '이빨 꿈', h: '이빨 꿈은 무슨 의미일까?', m: '이는 자신감을 나타냅니다.' },
    tr: { t: 'Diş rüyası', h: 'Diş görmek ne demek?', m: 'Dişler güveni temsil eder.' },
    hi: { t: 'दांत का सपना', h: 'सपने में दांत का क्या मतलब?', m: 'दांत आत्मविश्वास का प्रतीक हैं।' },
    it: { t: 'Sogno di denti', h: 'Cosa significa sognare denti?', m: 'Denti rappresentano fiducia.' },
  },
  death: {
    en: { t: 'Death Dream Meaning', h: 'What Does It Mean to Dream About Death?', m: 'Death symbolizes transformation, endings, or closure of a life chapter.' },
    ar: { t: 'تفسير حلم الموت', h: 'ما معنى رؤية الموت؟', m: 'الموت يرمز للتحول والنهايات.' },
    es: { t: 'Soñar con la muerte', h: '¿Qué significa soñar con la muerte?', m: 'La muerte simboliza transformación.' },
    fr: { t: 'Rêve de mort', h: 'Que signifie rêver de mort?', m: 'La mort symbolise la transformation.' },
    de: { t: 'Todestraum', h: 'Was bedeutet Todestraum?', m: 'Tod symbolisiert Transformation.' },
    pt: { t: 'Sonhar com morte', h: 'O que significa sonhar com morte?', m: 'Morte representa transformação.' },
    ru: { t: 'Сон о смерти', h: 'Что значит сон о смерти?', m: 'Смерть символизирует трансформацию.' },
    zh: { t: '梦见死亡', h: '梦见死亡是什么意思？', m: '死亡象征转变。' },
    ja: { t: '死の夢', h: '死の夢は何を意味する？', m: '死は変容を象徴する。' },
    ko: { t: '죽음 꿈', h: '죽음 꿈은 무슨 의미일까?', m: '죽음은 변신을 상징합니다.' },
    tr: { t: 'Ölüm rüyası', h: 'Ölüm görmek ne demek?', m: 'Ölüm dönüşümdür.' },
    hi: { t: 'मृत्यु का सपना', h: 'सपने में मौत का क्या मतलब?', m: 'मौत रूपांतरण का प्रतीक है।' },
    it: { t: 'Sogno di morte', h: 'Cosa significa sognare la morte?', m: 'Morte rappresenta trasformazione.' },
  },
  house: {
    en: { t: 'House Dream Meaning', h: 'What Does It Mean to Dream About a House?', m: 'Houses represent the self, your mind, and life circumstances.' },
    ar: { t: 'تفسير حلم البيت', h: 'ما معنى رؤية البيت؟', m: 'البيوت ترمز للذات والعقل.' },
    es: { t: 'Soñar con casa', h: '¿Qué significa soñar con casa?', m: 'Las casas representan el yo.' },
    fr: { t: 'Rêve de maison', h: 'Que signifie rêver de maison?', m: 'Les maisons représentent le moi.' },
    de: { t: 'Hausstraum', h: 'Was bedeutet Hausstraum?', m: 'Häuser symbolisieren das Ich.' },
    pt: { t: 'Sonhar com casa', h: 'O que significa sonhar com casa?', m: 'Casas representam o eu.' },
    ru: { t: 'Сон о доме', h: 'Что значит сон о доме?', m: 'Дома символизируют личность.' },
    zh: { t: '梦见房子', h: '梦见房子是什么意思？', m: '房子代表自我。' },
    ja: { t: '家の夢', h: '家の夢は何を意味する？', m: '家は自己を表す。' },
    ko: { t: '집 꿈', h: '집 꿈은 무슨 의미일까?', m: '집은 자아를 나타냅니다.' },
    tr: { t: 'Ev rüyası', h: 'Ev görmek ne demek?', m: 'Ev benliği temsil eder.' },
    hi: { t: 'घर का सपना', h: 'सपने में घर का क्या मतलब?', m: 'घर आत्मा का प्रतीक है।' },
    it: { t: 'Sogno di casa', h: 'Cosa significa sognare casa?', m: 'Case rappresentano l\'io.' },
  },
  fire: {
    en: { t: 'Fire Dream Meaning', h: 'What Does It Mean to Dream About Fire?', m: 'Fire represents passion, anger, transformation, or destruction.' },
    ar: { t: 'تفسير حلم النار', h: 'ما معنى رؤية النار؟', m: 'النار ترمز للعاطفة والغضب والتحول.' },
    es: { t: 'Soñar con fuego', h: '¿Qué significa soñar con fuego?', m: 'El fuego simboliza pasión.' },
    fr: { t: 'Rêve de feu', h: 'Que signifie rêver de feu?', m: 'Le feu symbolise la passion.' },
    de: { t: 'Feuertraum', h: 'Was bedeutet Feuertraum?', m: 'Feuer symbolisiert Leidenschaft.' },
    pt: { t: 'Sonhar com fogo', h: 'O que significa sonhar com fogo?', m: 'Fogo representa paixão.' },
    ru: { t: 'Сон о огне', h: 'Что значит сон о огне?', m: 'Огонь символизирует страсть.' },
    zh: { t: '梦见火', h: '梦见火是什么意思？', m: '火代表激情。' },
    ja: { t: '火の夢', h: '火の夢は何を意味する？', m: '火は情熱を表す。' },
    ko: { t: '불 꿈', h: '불 꿈은 무슨 의미일까?', m: '불은 열정을 나타냅니다.' },
    tr: { t: 'Ateş rüyası', h: 'Ateş görmek ne demek?', m: 'Ateş tutkudur.' },
    hi: { t: 'आग का सपना', h: 'सपने में आग का क्या मतलब?', m: 'आग जून का प्रतीक है।' },
    it: { t: 'Sogno di fuoco', h: 'Cosa significa sognare fuoco?', m: 'Fuoco rappresenta passione.' },
  },
  dog: {
    en: { t: 'Dog Dream Meaning', h: 'What Does It Mean to Dream About a Dog?', m: 'Dogs represent loyalty, friendship, protection, and intuition.' },
    ar: { t: 'تفسير حلم الكلب', h: 'ما معنى رؤية الكلب؟', m: 'الكلاب ترمز للولاء والصداقة والحماية.' },
    es: { t: 'Soñar con perro', h: '¿Qué significa soñar con perro?', m: 'Los perros representan lealtad.' },
    fr: { t: 'Rêve de chien', h: 'Que signifie rêver de chien?', m: 'Les chiens représentent la loyauté.' },
    de: { t: 'Hundetraum', h: 'Was bedeutet Hundetraum?', m: 'Hunde symbolisieren Treue.' },
    pt: { t: 'Sonhar com cachorro', h: 'O que significa sonhar com cachorro?', m: 'Cachorros representam lealdade.' },
    ru: { t: 'Сон о собаке', h: 'Что значит сон о собаке?', m: 'Собаки символизируют верность.' },
    zh: { t: '梦见狗', h: '梦见狗是什么意思？', m: '狗代表忠诚。' },
    ja: { t: '犬の夢', h: '犬の夢は何を意味する？', m: '犬は忠実を表す。' },
    ko: { t: '개 꿈', h: '개 꿈은 무슨 의미일까?', m: '개는 충성을 나타냅니다.' },
    tr: { t: 'Köpek rüyası', h: 'Köpek görmek ne demek?', m: 'Köpek sadakattır.' },
    hi: { t: 'कुत्ते का सपना', h: 'सपने में कुत्ते का क्या मतलब?', m: 'कुत्ते वफादारी का प्रतीक हैं।' },
    it: { t: 'Sogno di cane', h: 'Cosa significa sognare cane?', m: 'Cani rappresentano lealtà.' },
  },
  marriage: {
    en: { t: 'Marriage Dream Meaning', h: 'What Does It Mean to Dream About Marriage?', m: 'Marriage represents union, commitment, and integration of different aspects of yourself.' },
    ar: { t: 'تفسير حلم الزواج', h: 'ما معنى رؤية الزواج؟', m: 'الزواج يرمز للاتحاد والالتزام.' },
    es: { t: 'Soñar con matrimonio', h: '¿Qué significa soñar con matrimonio?', m: 'El matrimonio simboliza unión.' },
    fr: { t: 'Rêve de mariage', h: 'Que signifie rêver de mariage?', m: 'Le mariage symbolise l\'union.' },
    de: { t: 'Ehetraum', h: 'Was bedeutet Ehetraum?', m: 'Ehe symbolisiert Einheit.' },
    pt: { t: 'Sonhar com casamento', h: 'O que significa sonhar com casamento?', m: 'Casamento representa união.' },
    ru: { t: 'Сон о свадьбе', h: 'Что значит сон о свадьбе?', m: 'Свадьба символизирует союз.' },
    zh: { t: '梦见结婚', h: '梦见结婚是什么意思？', m: '结婚代表联合。' },
    ja: { t: '結婚の夢', h: '結婚の夢は何を意味する？', m: '結婚は統合を表す。' },
    ko: { t: '결혼 꿈', h: '결혼 꿈은 무슨 의미일까?', m: '결혼은 통합을 나타냅니다.' },
    tr: { t: 'Evlilik rüyası', h: 'Evlilik görmek ne demek?', m: 'Evlilik birlikteliktir.' },
    hi: { t: 'शादी का सपना', h: 'सपने में शादी का क्या मतलब?', m: 'शादी एकता का प्रतीक है।' },
    it: { t: 'Sogno di matrimonio', h: 'Cosa significa sognare matrimonio?', m: 'Matrimonio rappresenta unione.' },
  },
  money: {
    en: { t: 'Money Dream Meaning', h: 'What Does It Mean to Dream About Money?', m: 'Money in dreams reflects self-worth, security, and your relationship with abundance.' },
    ar: { t: 'تفسير حلم المال', h: 'ما معنى رؤية المال في الحلم؟', m: 'المال في الأحلام يعكس تقدير الذات والأمان.' },
    es: { t: 'Soñar con dinero', h: '¿Qué significa soñar con dinero?', m: 'El dinero refleja autoestima y seguridad.' },
    fr: { t: 'Rêve d\'argent', h: 'Que signifie rêver d\'argent?', m: 'L\'argent reflète l\'estime de soi.' },
    de: { t: 'Geld Traum', h: 'Was bedeutet Geld im Traum?', m: 'Geld spiegelt Selbstwert wider.' },
    pt: { t: 'Sonhar com dinheiro', h: 'O que significa sonhar com dinheiro?', m: 'Dinheiro reflete autoestima.' },
    ru: { t: 'Сон о деньгах', h: 'Что значит сон о деньгах?', m: 'Деньги отражают самооценку.' },
    zh: { t: '梦见钱', h: '梦见钱是什么意思？', m: '钱反映自我价值。' },
    ja: { t: 'お金の夢', h: 'お金の夢は何を意味する？', m: '金は自己価値を表す。' },
    ko: { t: '돈 꿈', h: '돈 꿈은 무슨 의미일까?', m: '돈은 자아가치를 나타냅니다.' },
    tr: { t: 'Para rüyası', h: 'Para görmek ne demek?', m: 'Para öz değeri yansıtır.' },
    hi: { t: 'पैसे का सपना', h: 'सपने में पैसे का क्या मतलब?', m: 'पैसा आत्म-मूल्य को दर्शाता है।' },
    it: { t: 'Sogno di soldi', h: 'Cosa significa sognare i soldi?', m: 'I soldi riflettono l\'autostima.' },
  },
  baby: {
    en: { t: 'Baby Dream Meaning', h: 'What Does It Mean to Dream About a Baby?', m: 'Babies symbolize new beginnings, innocence, and a project or idea coming to life.' },
    ar: { t: 'تفسير حلم الطفل', h: 'ما معنى رؤية طفل في الحلم؟', m: 'الأطفال يرمزون للبدايات الجديدة والبراءة.' },
    es: { t: 'Soñar con bebé', h: '¿Qué significa soñar con un bebé?', m: 'Los bebés simbolizan nuevos comienzos.' },
    fr: { t: 'Rêve de bébé', h: 'Que signifie rêver d\'un bébé?', m: 'Les bébés symbolisent les nouveaux départs.' },
    de: { t: 'Baby Traum', h: 'Was bedeutet ein Baby im Traum?', m: 'Babys symbolisieren neue Anfänge.' },
    pt: { t: 'Sonhar com bebê', h: 'O que significa sonhar com bebê?', m: 'Bebês simbolizam novos começos.' },
    ru: { t: 'Сон о ребёнке', h: 'Что значит сон о ребёнке?', m: 'Дети символизируют новые начала.' },
    zh: { t: '梦见婴儿', h: '梦见婴儿是什么意思？', m: '婴儿象征新的开始。' },
    ja: { t: '赤ちゃんの夢', h: '赤ちゃんの夢は何を意味する？', m: '赤ちゃんは新しい始まりを表す。' },
    ko: { t: '아기 꿈', h: '아기 꿈은 무슨 의미일까?', m: '아기는 새로운 시작을 나타냅니다.' },
    tr: { t: 'Bebek rüyası', h: 'Bebek görmek ne demek?', m: 'Bebek yeni başlangıçları simgeler.' },
    hi: { t: 'बच्चे का सपना', h: 'सपने में बच्चे का क्या मतलब?', m: 'बच्चे नई शुरुआत का प्रतीक हैं।' },
    it: { t: 'Sogno di bambino', h: 'Cosa significa sognare un bambino?', m: 'I bambini simbolizzano nuovi inizi.' },
  },
  pregnancy: {
    en: { t: 'Pregnancy Dream Meaning', h: 'What Does It Mean to Dream About Pregnancy?', m: 'Pregnancy represents creativity, growth, and something new developing within you.' },
    ar: { t: 'تفسير حلم الحمل', h: 'ما معنى رؤية الحمل في الحلم؟', m: 'الحمل يرمز للإبداع والنمو.' },
    es: { t: 'Soñar con embarazo', h: '¿Qué significa soñar con embarazo?', m: 'El embarazo representa creatividad.' },
    fr: { t: 'Rêve de grossesse', h: 'Que signifie rêver de grossesse?', m: 'La grossesse représente la créativité.' },
    de: { t: 'Schwangerschaft Traum', h: 'Was bedeutet Schwangerschaft im Traum?', m: 'Schwangerschaft symbolisiert Kreativität.' },
    pt: { t: 'Sonhar com gravidez', h: 'O que significa sonhar com gravidez?', m: 'Gravidez representa criatividade.' },
    ru: { t: 'Сон о беременности', h: 'Что значит сон о беременности?', m: 'Беременность символизирует творчество.' },
    zh: { t: '梦见怀孕', h: '梦见怀孕是什么意思？', m: '怀孕象征创造力。' },
    ja: { t: '妊娠の夢', h: '妊娠の夢は何を意味する？', m: '妊娠は創造性を表す。' },
    ko: { t: '임신 꿈', h: '임신 꿈은 무슨 의미일까?', m: '임신은 창의성을 나타냅니다.' },
    tr: { t: 'Hamilelik rüyası', h: 'Hamilelik görmek ne demek?', m: 'Hamilelik yaratıcılığı simgeler.' },
    hi: { t: 'गर्भावस्था का सपना', h: 'सपने में गर्भावस्था का क्या मतलब?', m: 'गर्भावस्था रचनात्मकता का प्रतीक है।' },
    it: { t: 'Sogno di gravidanza', h: 'Cosa significa sognare gravidanza?', m: 'La gravidanza rappresenta creatività.' },
  },
  blood: {
    en: { t: 'Blood Dream Meaning', h: 'What Does It Mean to Dream About Blood?', m: 'Blood represents life force, vitality, and deep emotional bonds or loss.' },
    ar: { t: 'تفسير حلم الدم', h: 'ما معنى رؤية الدم في الحلم؟', m: 'الدم يرمز لقوة الحياة والروابط العاطفية.' },
    es: { t: 'Soñar con sangre', h: '¿Qué significa soñar con sangre?', m: 'La sangre representa vitalidad.' },
    fr: { t: 'Rêve de sang', h: 'Que signifie rêver de sang?', m: 'Le sang représente la vitalité.' },
    de: { t: 'Blut Traum', h: 'Was bedeutet Blut im Traum?', m: 'Blut symbolisiert Lebenskraft.' },
    pt: { t: 'Sonhar com sangue', h: 'O que significa sonhar com sangue?', m: 'Sangue representa vitalidade.' },
    ru: { t: 'Сон о крови', h: 'Что значит сон о крови?', m: 'Кровь символизирует жизненную силу.' },
    zh: { t: '梦见血', h: '梦见血是什么意思？', m: '血象征生命力。' },
    ja: { t: '血の夢', h: '血の夢は何を意味する？', m: '血は生命力を表す。' },
    ko: { t: '피 꿈', h: '피 꿈은 무슨 의미일까?', m: '피는 생명력을 나타냅니다.' },
    tr: { t: 'Kan rüyası', h: 'Kan görmek ne demek?', m: 'Kan yaşam gücünü simgeler.' },
    hi: { t: 'खून का सपना', h: 'सपने में खून का क्या मतलब?', m: 'खून जीवन शक्ति का प्रतीक है।' },
    it: { t: 'Sogno di sangue', h: 'Cosa significa sognare sangue?', m: 'Il sangue rappresenta vitalità.' },
  },
  cat: {
    en: { t: 'Cat Dream Meaning', h: 'What Does It Mean to Dream About a Cat?', m: 'Cats symbolize independence, intuition, femininity, and hidden mystery.' },
    ar: { t: 'تفسير حلم القطة', h: 'ما معنى رؤية القطة في الحلم؟', m: 'القطط ترمز للاستقلال والحدس والغموض.' },
    es: { t: 'Soñar con gato', h: '¿Qué significa soñar con gato?', m: 'Los gatos simbolizan independencia.' },
    fr: { t: 'Rêve de chat', h: 'Que signifie rêver de chat?', m: 'Les chats symbolisent l\'indépendance.' },
    de: { t: 'Katze Traum', h: 'Was bedeutet eine Katze im Traum?', m: 'Katzen symbolisieren Unabhängigkeit.' },
    pt: { t: 'Sonhar com gato', h: 'O que significa sonhar com gato?', m: 'Gatos representam independência.' },
    ru: { t: 'Сон о кошке', h: 'Что значит сон о кошке?', m: 'Кошки символизируют независимость.' },
    zh: { t: '梦见猫', h: '梦见猫是什么意思？', m: '猫象征独立。' },
    ja: { t: '猫の夢', h: '猫の夢は何を意味する？', m: '猫は独立を表す。' },
    ko: { t: '고양이 꿈', h: '고양이 꿈은 무슨 의미일까?', m: '고양이는 독립을 나타냅니다.' },
    tr: { t: 'Kedi rüyası', h: 'Kedi görmek ne demek?', m: 'Kedi bağımsızlığı simgeler.' },
    hi: { t: 'बिल्ली का सपना', h: 'सपने में बिल्ली का क्या मतलब?', m: 'बिल्ली स्वतंत्रता का प्रतीक है।' },
    it: { t: 'Sogno di gatto', h: 'Cosa significa sognare gatto?', m: 'I gatti simbolizzano indipendenza.' },
  },
  fish: {
    en: { t: 'Fish Dream Meaning', h: 'What Does It Mean to Dream About Fish?', m: 'Fish represent fertility, abundance, the subconscious, and spiritual insights.' },
    ar: { t: 'تفسير حلم السمك', h: 'ما معنى رؤية السمك في الحلم؟', m: 'السمك يرمز للخصوبة والوفرة.' },
    es: { t: 'Soñar con pez', h: '¿Qué significa soñar con pez?', m: 'Los peces simbolizan abundancia.' },
    fr: { t: 'Rêve de poisson', h: 'Que signifie rêver de poisson?', m: 'Les poissons symbolisent l\'abondance.' },
    de: { t: 'Fisch Traum', h: 'Was bedeutet Fisch im Traum?', m: 'Fische symbolisieren Fülle.' },
    pt: { t: 'Sonhar com peixe', h: 'O que significa sonhar com peixe?', m: 'Peixes representam abundância.' },
    ru: { t: 'Сон о рыбе', h: 'Что значит сон о рыбе?', m: 'Рыбы символизируют изобилие.' },
    zh: { t: '梦见鱼', h: '梦见鱼是什么意思？', m: '鱼象征富足。' },
    ja: { t: '魚の夢', h: '魚の夢は何を意味する？', m: '魚は豊かさを表す。' },
    ko: { t: '물고기 꿈', h: '물고기 꿈은 무슨 의미일까?', m: '물고기는 풍요를 나타냅니다.' },
    tr: { t: 'Balık rüyası', h: 'Balık görmek ne demek?', m: 'Balık bereketi simgeler.' },
    hi: { t: 'मछली का सपना', h: 'सपने में मछली का क्या मतलब?', m: 'मछली समृद्धि का प्रतीक है।' },
    it: { t: 'Sogno di pesce', h: 'Cosa significa sognare pesce?', m: 'I pesci simbolizzano abbondanza.' },
  },
  bird: {
    en: { t: 'Bird Dream Meaning', h: 'What Does It Mean to Dream About Birds?', m: 'Birds symbolize freedom, messages, hope, and a higher perspective.' },
    ar: { t: 'تفسير حلم الطير', h: 'ما معنى رؤية الطير في الحلم؟', m: 'الطيور ترمز للحرية والرسائل.' },
    es: { t: 'Soñar con pájaro', h: '¿Qué significa soñar con pájaro?', m: 'Los pájaros simbolizan libertad.' },
    fr: { t: 'Rêve d\'oiseau', h: 'Que signifie rêver d\'oiseau?', m: 'Les oiseaux symbolisent la liberté.' },
    de: { t: 'Vogel Traum', h: 'Was bedeutet Vogel im Traum?', m: 'Vögel symbolisieren Freiheit.' },
    pt: { t: 'Sonhar com pássaro', h: 'O que significa sonhar com pássaro?', m: 'Pássaros representam liberdade.' },
    ru: { t: 'Сон о птице', h: 'Что значит сон о птице?', m: 'Птицы символизируют свободу.' },
    zh: { t: '梦见鸟', h: '梦见鸟是什么意思？', m: '鸟象征自由。' },
    ja: { t: '鳥の夢', h: '鳥の夢は何を意味する？', m: '鳥は自由を表す。' },
    ko: { t: '새 꿈', h: '새 꿈은 무슨 의미일까?', m: '새는 자유를 나타냅니다.' },
    tr: { t: 'Kuş rüyası', h: 'Kuş görmek ne demek?', m: 'Kuş özgürlüğü simgeler.' },
    hi: { t: 'पक्षी का सपना', h: 'सपने में पक्षी का क्या मतलब?', m: 'पक्षी स्वतंत्रता का प्रतीक है।' },
    it: { t: 'Sogno di uccello', h: 'Cosa significa sognare uccello?', m: 'Gli uccelli simbolizzano libertà.' },
  },
  tree: {
    en: { t: 'Tree Dream Meaning', h: 'What Does It Mean to Dream About Trees?', m: 'Trees represent growth, rootedness, life, and connection to family or ancestry.' },
    ar: { t: 'تفسير حلم الشجرة', h: 'ما معنى رؤية الشجرة في الحلم؟', m: 'الأشجار ترمز للنمو والجذور.' },
    es: { t: 'Soñar con árbol', h: '¿Qué significa soñar con árbol?', m: 'Los árboles simbolizan crecimiento.' },
    fr: { t: 'Rêve d\'arbre', h: 'Que signifie rêver d\'arbre?', m: 'Les arbres symbolisent la croissance.' },
    de: { t: 'Baum Traum', h: 'Was bedeutet Baum im Traum?', m: 'Bäume symbolisieren Wachstum.' },
    pt: { t: 'Sonhar com árvore', h: 'O que significa sonhar com árvore?', m: 'Árvores representam crescimento.' },
    ru: { t: 'Сон о дереве', h: 'Что значит сон о дереве?', m: 'Деревья символизируют рост.' },
    zh: { t: '梦见树', h: '梦见树是什么意思？', m: '树象征成长。' },
    ja: { t: '木の夢', h: '木の夢は何を意味する？', m: '木は成長を表す。' },
    ko: { t: '나무 꿈', h: '나무 꿈은 무슨 의미일까?', m: '나무는 성장을 나타냅니다.' },
    tr: { t: 'Ağaç rüyası', h: 'Ağaç görmek ne demek?', m: 'Ağaç büyümeyi simgeler.' },
    hi: { t: 'पेड़ का सपना', h: 'सपने में पेड़ का क्या मतलब?', m: 'पेड़ वृद्धि का प्रतीक है।' },
    it: { t: 'Sogno di albero', h: 'Cosa significa sognare albero?', m: 'Gli alberi simbolizzano crescita.' },
  },
  car: {
    en: { t: 'Car Dream Meaning', h: 'What Does It Mean to Dream About a Car?', m: 'Cars represent your life path, control, direction, and how you navigate circumstances.' },
    ar: { t: 'تفسير حلم السيارة', h: 'ما معنى رؤية السيارة في الحلم؟', m: 'السيارة ترمز لمسار حياتك واتجاهها.' },
    es: { t: 'Soñar con coche', h: '¿Qué significa soñar con coche?', m: 'Los coches simbolizan el camino de vida.' },
    fr: { t: 'Rêve de voiture', h: 'Que signifie rêver de voiture?', m: 'Les voitures symbolisent le chemin de vie.' },
    de: { t: 'Auto Traum', h: 'Was bedeutet Auto im Traum?', m: 'Autos symbolisieren Lebensweg.' },
    pt: { t: 'Sonhar com carro', h: 'O que significa sonhar com carro?', m: 'Carros representam o caminho de vida.' },
    ru: { t: 'Сон о машине', h: 'Что значит сон о машине?', m: 'Машины символизируют жизненный путь.' },
    zh: { t: '梦见车', h: '梦见车是什么意思？', m: '车象征人生方向。' },
    ja: { t: '車の夢', h: '車の夢は何を意味する？', m: '車は人生の方向を表す。' },
    ko: { t: '차 꿈', h: '차 꿈은 무슨 의미일까?', m: '차는 인생의 방향을 나타냅니다.' },
    tr: { t: 'Araba rüyası', h: 'Araba görmek ne demek?', m: 'Araba yaşam yolunu simgeler.' },
    hi: { t: 'कार का सपना', h: 'सपने में कार का क्या मतलब?', m: 'कार जीवन के रास्ते का प्रतीक है।' },
    it: { t: 'Sogno di macchina', h: 'Cosa significa sognare macchina?', m: 'Le macchine simbolizzano il percorso di vita.' },
  },
  school: {
    en: { t: 'School Dream Meaning', h: 'What Does It Mean to Dream About School?', m: 'School represents learning, evaluation, past lessons, and anxiety about performance.' },
    ar: { t: 'تفسير حلم المدرسة', h: 'ما معنى رؤية المدرسة في الحلم؟', m: 'المدرسة ترمز للتعلم والتقييم.' },
    es: { t: 'Soñar con escuela', h: '¿Qué significa soñar con escuela?', m: 'La escuela simboliza aprendizaje.' },
    fr: { t: 'Rêve d\'école', h: 'Que signifie rêver d\'école?', m: 'L\'école symbolise l\'apprentissage.' },
    de: { t: 'Schule Traum', h: 'Was bedeutet Schule im Traum?', m: 'Schule symbolisiert Lernen.' },
    pt: { t: 'Sonhar com escola', h: 'O que significa sonhar com escola?', m: 'Escola representa aprendizado.' },
    ru: { t: 'Сон о школе', h: 'Что значит сон о школе?', m: 'Школа символизирует обучение.' },
    zh: { t: '梦见学校', h: '梦见学校是什么意思？', m: '学校象征学习。' },
    ja: { t: '学校の夢', h: '学校の夢は何を意味する？', m: '学校は学びを表す。' },
    ko: { t: '학교 꿈', h: '학교 꿈은 무슨 의미일까?', m: '학교는 배움을 나타냅니다.' },
    tr: { t: 'Okul rüyası', h: 'Okul görmek ne demek?', m: 'Okul öğrenmeyi simgeler.' },
    hi: { t: 'स्कूल का सपना', h: 'सपने में स्कूल का क्या मतलब?', m: 'स्कूल सीखने का प्रतीक है।' },
    it: { t: 'Sogno di scuola', h: 'Cosa significa sognare scuola?', m: 'La scuola simbolizza apprendimento.' },
  },
  exam: {
    en: { t: 'Exam Dream Meaning', h: 'What Does It Mean to Dream About an Exam?', m: 'Exams represent self-judgment, fear of failure, and being tested by life.' },
    ar: { t: 'تفسير حلم الامتحان', h: 'ما معنى رؤية الامتحان في الحلم؟', m: 'الامتحان يرمز للتقييم والخوف من الفشل.' },
    es: { t: 'Soñar con examen', h: '¿Qué significa soñar con examen?', m: 'Los exámenes simbolizan juicio propio.' },
    fr: { t: 'Rêve d\'examen', h: 'Que signifie rêver d\'examen?', m: 'Les examens symbolisent l\'auto-jugement.' },
    de: { t: 'Prüfung Traum', h: 'Was bedeutet Prüfung im Traum?', m: 'Prüfungen symbolisieren Selbstbewertung.' },
    pt: { t: 'Sonhar com prova', h: 'O que significa sonhar com prova?', m: 'Provas representam autojulgamento.' },
    ru: { t: 'Сон об экзамене', h: 'Что значит сон об экзамене?', m: 'Экзамены символизируют самооценку.' },
    zh: { t: '梦见考试', h: '梦见考试是什么意思？', m: '考试象征自我评判。' },
    ja: { t: '試験の夢', h: '試験の夢は何を意味する？', m: '試験は自己判断を表す。' },
    ko: { t: '시험 꿈', h: '시험 꿈은 무슨 의미일까?', m: '시험은 자기 평가를 나타냅니다.' },
    tr: { t: 'Sınav rüyası', h: 'Sınav görmek ne demek?', m: 'Sınav kendini yargılamayı simgeler.' },
    hi: { t: 'परीक्षा का सपना', h: 'सपने में परीक्षा का क्या मतलब?', m: 'परीक्षा आत्म-निर्णय का प्रतीक है।' },
    it: { t: 'Sogno di esame', h: 'Cosa significa sognare esame?', m: 'Gli esami simbolizzano autogiudizio.' },
  },
  wedding: {
    en: { t: 'Wedding Dream Meaning', h: 'What Does It Mean to Dream About a Wedding?', m: 'Weddings represent union, commitment, and integration of different parts of yourself.' },
    ar: { t: 'تفسير حلم الزفاف', h: 'ما معنى رؤية الزفاف في الحلم؟', m: 'الزفاف يرمز للاتحاد والالتزام.' },
    es: { t: 'Soñar con boda', h: '¿Qué significa soñar con boda?', m: 'Las bodas simbolizan unión.' },
    fr: { t: 'Rêve de mariage', h: 'Que signifie rêver de mariage?', m: 'Les mariages symbolisent l\'union.' },
    de: { t: 'Hochzeit Traum', h: 'Was bedeutet Hochzeit im Traum?', m: 'Hochzeiten symbolisieren Einheit.' },
    pt: { t: 'Sonhar com casamento', h: 'O que significa sonhar com casamento?', m: 'Casamentos representam união.' },
    ru: { t: 'Сон о свадьбе', h: 'Что значит сон о свадьбе?', m: 'Свадьбы символизируют союз.' },
    zh: { t: '梦见婚礼', h: '梦见婚礼是什么意思？', m: '婚礼象征联合。' },
    ja: { t: '結婚式の夢', h: '結婚式の夢は何を意味する？', m: '結婚式は統合を表す。' },
    ko: { t: '결혼식 꿈', h: '결혼식 꿈은 무슨 의미일까?', m: '결혼식은 통합을 나타냅니다.' },
    tr: { t: 'Düğün rüyası', h: 'Düğün görmek ne demek?', m: 'Düğün birlikteliktir.' },
    hi: { t: 'शादी का सपना', h: 'सपने में शादी का क्या मतलब?', m: 'शादी एकता का प्रतीक है।' },
    it: { t: 'Sogno di matrimonio', h: 'Cosa significa sognare matrimonio?', m: 'I matrimoni simbolizzano unione.' },
  },
  moon: {
    en: { t: 'Moon Dream Meaning', h: 'What Does It Mean to Dream About the Moon?', m: 'The moon represents intuition, cycles, the feminine, and hidden emotions.' },
    ar: { t: 'تفسير حلم القمر', h: 'ما معنى رؤية القمر في الحلم؟', m: 'القمر يرمز للحدس والدورات.' },
    es: { t: 'Soñar con luna', h: '¿Qué significa soñar con luna?', m: 'La luna simboliza intuición.' },
    fr: { t: 'Rêve de lune', h: 'Que signifie rêver de lune?', m: 'La lune symbolise l\'intuition.' },
    de: { t: 'Mond Traum', h: 'Was bedeutet Mond im Traum?', m: 'Der Mond symbolisiert Intuition.' },
    pt: { t: 'Sonhar com lua', h: 'O que significa sonhar com lua?', m: 'A lua representa intuição.' },
    ru: { t: 'Сон о луне', h: 'Что значит сон о луне?', m: 'Луна символизирует интуицию.' },
    zh: { t: '梦见月亮', h: '梦见月亮是什么意思？', m: '月亮象征直觉。' },
    ja: { t: '月の夢', h: '月の夢は何を意味する？', m: '月は直感を表す。' },
    ko: { t: '달 꿈', h: '달 꿈은 무슨 의미일까?', m: '달은 직관을 나타냅니다.' },
    tr: { t: 'Ay rüyası', h: 'Ay görmek ne demek?', m: 'Ay sezgiyi simgeler.' },
    hi: { t: 'चाँद का सपना', h: 'सपने में चाँद का क्या मतलब?', m: 'चाँद सहज ज्ञान का प्रतीक है।' },
    it: { t: 'Sogno di luna', h: 'Cosa significa sognare luna?', m: 'La luna simbolizza intuizione.' },
  },
  sun: {
    en: { t: 'Sun Dream Meaning', h: 'What Does It Mean to Dream About the Sun?', m: 'The sun represents vitality, clarity, success, and your true self.' },
    ar: { t: 'تفسير حلم الشمس', h: 'ما معنى رؤية الشمس في الحلم؟', m: 'الشمس ترمز للحيوية والوضوح.' },
    es: { t: 'Soñar con sol', h: '¿Qué significa soñar con sol?', m: 'El sol simboliza vitalidad.' },
    fr: { t: 'Rêve de soleil', h: 'Que signifie rêver de soleil?', m: 'Le soleil symbolise la vitalité.' },
    de: { t: 'Sonne Traum', h: 'Was bedeutet Sonne im Traum?', m: 'Die Sonne symbolisiert Lebenskraft.' },
    pt: { t: 'Sonhar com sol', h: 'O que significa sonhar com sol?', m: 'O sol representa vitalidade.' },
    ru: { t: 'Сон о солнце', h: 'Что значит сон о солнце?', m: 'Солнце символизирует жизненную силу.' },
    zh: { t: '梦见太阳', h: '梦见太阳是什么意思？', m: '太阳象征活力。' },
    ja: { t: '太陽の夢', h: '太陽の夢は何を意味する？', m: '太陽は活力を表す。' },
    ko: { t: '해 꿈', h: '해 꿈은 무슨 의미일까?', m: '해는 활력을 나타냅니다.' },
    tr: { t: 'Güneş rüyası', h: 'Güneş görmek ne demek?', m: 'Güneş canlılığı simgeler.' },
    hi: { t: 'सूरज का सपना', h: 'सपने में सूरज का क्या मतलब?', m: 'सूरज ऊर्जा का प्रतीक है।' },
    it: { t: 'Sogno di sole', h: 'Cosa significa sognare sole?', m: 'Il sole simbolizza vitalità.' },
  },
  rain: {
    en: { t: 'Rain Dream Meaning', h: 'What Does It Mean to Dream About Rain?', m: 'Rain represents cleansing, renewal, sadness, or emotional release.' },
    ar: { t: 'تفسير حلم المطر', h: 'ما معنى رؤية المطر في الحلم؟', m: 'المطر يرمز للتطهير والتجدد.' },
    es: { t: 'Soñar con lluvia', h: '¿Qué significa soñar con lluvia?', m: 'La lluvia simboliza renovación.' },
    fr: { t: 'Rêve de pluie', h: 'Que signifie rêver de pluie?', m: 'La pluie symbolise le renouveau.' },
    de: { t: 'Regen Traum', h: 'Was bedeutet Regen im Traum?', m: 'Regen symbolisiert Erneuerung.' },
    pt: { t: 'Sonhar com chuva', h: 'O que significa sonhar com chuva?', m: 'Chuva representa renovação.' },
    ru: { t: 'Сон о дожде', h: 'Что значит сон о дожде?', m: 'Дождь символизирует обновление.' },
    zh: { t: '梦见雨', h: '梦见雨是什么意思？', m: '雨象征更新。' },
    ja: { t: '雨の夢', h: '雨の夢は何を意味する？', m: '雨は刷新を表す。' },
    ko: { t: '비 꿈', h: '비 꿈은 무슨 의미일까?', m: '비는 쇄신을 나타냅니다.' },
    tr: { t: 'Yağmur rüyası', h: 'Yağmur görmek ne demek?', m: 'Yağmur yenilenmeyi simgeler.' },
    hi: { t: 'बारिश का सपना', h: 'सपने में बारिश का क्या मतलब?', m: 'बारिश नवीकरण का प्रतीक है।' },
    it: { t: 'Sogno di pioggia', h: 'Cosa significa sognare pioggia?', m: 'La pioggia simbolizza rinnovo.' },
  },
  sea: {
    en: { t: 'Sea Dream Meaning', h: 'What Does It Mean to Dream About the Sea?', m: 'The sea represents the vast subconscious, depth of emotion, and the unknown.' },
    ar: { t: 'تفسير حلم البحر', h: 'ما معنى رؤية البحر في الحلم؟', m: 'البحر يرمز للعقل الباطن العميق.' },
    es: { t: 'Soñar con mar', h: '¿Qué significa soñar con mar?', m: 'El mar simboliza el subconsciente.' },
    fr: { t: 'Rêve de mer', h: 'Que signifie rêver de mer?', m: 'La mer symbolise l\'inconscient.' },
    de: { t: 'Meer Traum', h: 'Was bedeutet Meer im Traum?', m: 'Das Meer symbolisiert das Unterbewusstsein.' },
    pt: { t: 'Sonhar com mar', h: 'O que significa sonhar com mar?', m: 'O mar representa o inconsciente.' },
    ru: { t: 'Сон о море', h: 'Что значит сон о море?', m: 'Море символизирует подсознание.' },
    zh: { t: '梦见海', h: '梦见海是什么意思？', m: '海象征潜意识。' },
    ja: { t: '海の夢', h: '海の夢は何を意味する？', m: '海は無意識を表す。' },
    ko: { t: '바다 꿈', h: '바다 꿈은 무슨 의미일까?', m: '바다는 무의식을 나타냅니다.' },
    tr: { t: 'Deniz rüyası', h: 'Deniz görmek ne demek?', m: 'Deniz bilinçaltını simgeler.' },
    hi: { t: 'समुद्र का सपना', h: 'सपने में समुद्र का क्या मतलब?', m: 'समुद्र अवचेतन का प्रतीक है।' },
    it: { t: 'Sogno di mare', h: 'Cosa significa sognare mare?', m: 'Il mare simbolizza l\'inconscio.' },
  },
  mountain: {
    en: { t: 'Mountain Dream Meaning', h: 'What Does It Mean to Dream About Mountains?', m: 'Mountains represent challenges, ambition, perspective, and spiritual ascent.' },
    ar: { t: 'تفسير حلم الجبل', h: 'ما معنى رؤية الجبل في الحلم؟', m: 'الجبال ترمز للتحديات والطموح.' },
    es: { t: 'Soñar con montaña', h: '¿Qué significa soñar con montaña?', m: 'Las montañas simbolizan desafío.' },
    fr: { t: 'Rêve de montagne', h: 'Que signifie rêver de montagne?', m: 'Les montagnes symbolisent le défi.' },
    de: { t: 'Berg Traum', h: 'Was bedeutet Berg im Traum?', m: 'Berge symbolisieren Herausforderung.' },
    pt: { t: 'Sonhar com montanha', h: 'O que significa sonhar com montanha?', m: 'Montanhas representam desafio.' },
    ru: { t: 'Сон о горе', h: 'Что значит сон о горе?', m: 'Горы символизируют вызов.' },
    zh: { t: '梦见山', h: '梦见山是什么意思？', m: '山象征挑战。' },
    ja: { t: '山の夢', h: '山の夢は何を意味する？', m: '山は挑戦を表す。' },
    ko: { t: '산 꿈', h: '산 꿈은 무슨 의미일까?', m: '산은 도전을 나타냅니다.' },
    tr: { t: 'Dağ rüyası', h: 'Dağ görmek ne demek?', m: 'Dağ meydan okumayı simgeler.' },
    hi: { t: 'पहाड़ का सपना', h: 'सपने में पहाड़ का क्या मतलब?', m: 'पहाड़ चुनौती का प्रतीक है।' },
    it: { t: 'Sogno di montagna', h: 'Cosa significa sognare montagna?', m: 'Le montagne simbolizzano sfida.' },
  },
  child: {
    en: { t: 'Child Dream Meaning', h: 'What Does It Mean to Dream About a Child?', m: 'Children represent innocence, your inner child, and a fresh start.' },
    ar: { t: 'تفسير حلم الطفل', h: 'ما معنى رؤية طفل في الحلم؟', m: 'الأطفال يرمزون للبراءة والبداية الجديدة.' },
    es: { t: 'Soñar con niño', h: '¿Qué significa soñar con niño?', m: 'Los niños simbolizan inocencia.' },
    fr: { t: 'Rêve d\'enfant', h: 'Que signifie rêver d\'enfant?', m: 'Les enfants symbolisent l\'innocence.' },
    de: { t: 'Kind Traum', h: 'Was bedeutet Kind im Traum?', m: 'Kinder symbolisieren Unschuld.' },
    pt: { t: 'Sonhar com criança', h: 'O que significa sonhar com criança?', m: 'Crianças representam inocência.' },
    ru: { t: 'Сон о ребёнке', h: 'Что значит сон о ребёнке?', m: 'Дети символизируют невинность.' },
    zh: { t: '梦见孩子', h: '梦见孩子是什么意思？', m: '孩子象征纯真。' },
    ja: { t: '子供の夢', h: '子供の夢は何を意味する？', m: '子供は純真を表す。' },
    ko: { t: '아이 꿈', h: '아이 꿈은 무슨 의미일까?', m: '아이는 순수를 나타냅니다.' },
    tr: { t: 'Çocuk rüyası', h: 'Çocuk görmek ne demek?', m: 'Çocuk masumiyeti simgeler.' },
    hi: { t: 'बच्चे का सपना', h: 'सपने में बच्चे का क्या मतलब?', m: 'बच्चे मासूमियत का प्रतीक हैं।' },
    it: { t: 'Sogno di bambino', h: 'Cosa significa sognare bambino?', m: 'I bambini simbolizzano innocenza.' },
  },
  key: {
    en: { t: 'Key Dream Meaning', h: 'What Does It Mean to Dream About a Key?', m: 'Keys represent access, secrets, solutions, and new opportunities.' },
    ar: { t: 'تفسير حلم المفتاح', h: 'ما معنى رؤية المفتاح في الحلم؟', m: 'المفاتيح ترمز للوصول والحلول.' },
    es: { t: 'Soñar con llave', h: '¿Qué significa soñar con llave?', m: 'Las llaves simbolizan acceso.' },
    fr: { t: 'Rêve de clé', h: 'Que signifie rêver de clé?', m: 'Les clés symbolisent l\'accès.' },
    de: { t: 'Schlüssel Traum', h: 'Was bedeutet Schlüssel im Traum?', m: 'Schlüssel symbolisieren Zugang.' },
    pt: { t: 'Sonhar com chave', h: 'O que significa sonhar com chave?', m: 'Chaves representam acesso.' },
    ru: { t: 'Сон о ключе', h: 'Что значит сон о ключе?', m: 'Ключи символизируют доступ.' },
    zh: { t: '梦见钥匙', h: '梦见钥匙是什么意思？', m: '钥匙象征通路。' },
    ja: { t: '鍵の夢', h: '鍵の夢は何を意味する？', m: '鍵はアクセスを表す。' },
    ko: { t: '열쇠 꿈', h: '열쇠 꿈은 무슨 의미일까?', m: '열쇠는 접근을 나타냅니다.' },
    tr: { t: 'Anahtar rüyası', h: 'Anahtar görmek ne demek?', m: 'Anahtar erişimi simgeler.' },
    hi: { t: 'चाबी का सपना', h: 'सपने में चाबी का क्या मतलब?', m: 'चाबी पहुँच का प्रतीक है।' },
    it: { t: 'Sogno di chiave', h: 'Cosa significa sognare chiave?', m: 'Le chiavi simbolizzano accesso.' },
  },
  door: {
    en: { t: 'Door Dream Meaning', h: 'What Does It Mean to Dream About a Door?', m: 'Doors represent transitions, choices, opportunities, and thresholds to the unknown.' },
    ar: { t: 'تفسير حلم الباب', h: 'ما معنى رؤية الباب في الحلم؟', m: 'الأبواب ترمز للانتقالات والفرص.' },
    es: { t: 'Soñar con puerta', h: '¿Qué significa soñar con puerta?', m: 'Las puertas simbolizan transición.' },
    fr: { t: 'Rêve de porte', h: 'Que signifie rêver de porte?', m: 'Les portes symbolisent la transition.' },
    de: { t: 'Tür Traum', h: 'Was bedeutet Tür im Traum?', m: 'Türen symbolisieren Übergang.' },
    pt: { t: 'Sonhar com porta', h: 'O que significa sonhar com porta?', m: 'Portas representam transição.' },
    ru: { t: 'Сон о двери', h: 'Что значит сон о двери?', m: 'Двери символизируют переход.' },
    zh: { t: '梦见门', h: '梦见门是什么意思？', m: '门象征转变。' },
    ja: { t: 'ドアの夢', h: 'ドアの夢は何を意味する？', m: 'ドアは変化を表す。' },
    ko: { t: '문 꿈', h: '문 꿈은 무슨 의미일까?', m: '문은 전환을 나타냅니다.' },
    tr: { t: 'Kapı rüyası', h: 'Kapı görmek ne demek?', m: 'Kapı geçişi simgeler.' },
    hi: { t: 'दरवाज़े का सपना', h: 'सपने में दरवाज़े का क्या मतलब?', m: 'दरवाज़े परिवर्तन का प्रतीक है।' },
    it: { t: 'Sogno di porta', h: 'Cosa significa sognare porta?', m: 'Le porte simbolizzano transizione.' },
  },
  book: {
    en: { t: 'Book Dream Meaning', h: 'What Does It Mean to Dream About a Book?', m: 'Books represent knowledge, memory, hidden truth, and a chapter of your life.' },
    ar: { t: 'تفسير حلم الكتاب', h: 'ما معنى رؤية الكتاب في الحلم؟', m: 'الكتب ترمز للمعرفة والحقيقة.' },
    es: { t: 'Soñar con libro', h: '¿Qué significa soñar con libro?', m: 'Los libros simbolizan conocimiento.' },
    fr: { t: 'Rêve de livre', h: 'Que signifie rêver de livre?', m: 'Les livres symbolisent la connaissance.' },
    de: { t: 'Buch Traum', h: 'Was bedeutet Buch im Traum?', m: 'Bücher symbolisieren Wissen.' },
    pt: { t: 'Sonhar com livro', h: 'O que significa sonhar com livro?', m: 'Livros representam conhecimento.' },
    ru: { t: 'Сон о книге', h: 'Что значит сон о книге?', m: 'Книги символизируют знание.' },
    zh: { t: '梦见书', h: '梦见书是什么意思？', m: '书象征知识。' },
    ja: { t: '本の夢', h: '本の夢は何を意味する？', m: '本は知識を表す。' },
    ko: { t: '책 꿈', h: '책 꿈은 무슨 의미일까?', m: '책은 지식을 나타냅니다.' },
    tr: { t: 'Kitap rüyası', h: 'Kitap görmek ne demek?', m: 'Kitap bilgiyi simgeler.' },
    hi: { t: 'किताब का सपना', h: 'सपने में किताब का क्या मतलब?', m: 'किताब ज्ञान का प्रतीक है।' },
    it: { t: 'Sogno di libro', h: 'Cosa significa sognare libro?', m: 'I libri simbolizzano conoscenza.' },
  },
  mirror: {
    en: { t: 'Mirror Dream Meaning', h: 'What Does It Mean to Dream About a Mirror?', m: 'Mirrors represent self-image, truth, reflection, and how you see yourself.' },
    ar: { t: 'تفسير حلم المرآة', h: 'ما معنى رؤية المرآة في الحلم؟', m: 'المرايا ترمز للصورة الذاتية والحقيقة.' },
    es: { t: 'Soñar con espejo', h: '¿Qué significa soñar con espejo?', m: 'Los espejos simbolizan autoimagen.' },
    fr: { t: 'Rêve de miroir', h: 'Que signifie rêver de miroir?', m: 'Les miroirs symbolisent l\'image de soi.' },
    de: { t: 'Spiegel Traum', h: 'Was bedeutet Spiegel im Traum?', m: 'Spiegel symbolisieren Selbstbild.' },
    pt: { t: 'Sonhar com espelho', h: 'O que significa sonhar com espelho?', m: 'Espelhos representam autoimagem.' },
    ru: { t: 'Сон о зеркале', h: 'Что значит сон о зеркале?', m: 'Зеркала символизируют самовосприятие.' },
    zh: { t: '梦见镜子', h: '梦见镜子是什么意思？', m: '镜子象征自我形象。' },
    ja: { t: '鏡の夢', h: '鏡の夢は何を意味する？', m: '鏡は自己像を表す。' },
    ko: { t: '거울 꿈', h: '거울 꿈은 무슨 의미일까?', m: '거울은 자아상을 나타냅니다.' },
    tr: { t: 'Ayna rüyası', h: 'Ayna görmek ne demek?', m: 'Ayna benlik imajını simgeler.' },
    hi: { t: 'शीशे का सपना', h: 'सपने में शीशे का क्या मतलब?', m: 'शीशा आत्म-छवि का प्रतीक है।' },
    it: { t: 'Sogno di specchio', h: 'Cosa significa sognare specchio?', m: 'Gli specchi simbolizzano immagine di sé.' },
  },
  horse: {
    en: { t: 'Horse Dream Meaning', h: 'What Does It Mean to Dream About a Horse?', m: 'Horses represent drive, freedom, power, and your instinctual energy.' },
    ar: { t: 'تفسير حلم الحصان', h: 'ما معنى رؤية الحصان في الحلم؟', m: 'الخيول ترمز للقوة والحرية.' },
    es: { t: 'Soñar con caballo', h: '¿Qué significa soñar con caballo?', m: 'Los caballos simbolizan poder.' },
    fr: { t: 'Rêve de cheval', h: 'Que signifie rêver de cheval?', m: 'Les chevaux symbolisent la puissance.' },
    de: { t: 'Pferd Traum', h: 'Was bedeutet Pferd im Traum?', m: 'Pferde symbolisieren Kraft.' },
    pt: { t: 'Sonhar com cavalo', h: 'O que significa sonhar com cavalo?', m: 'Cavalos representam poder.' },
    ru: { t: 'Сон о лошади', h: 'Что значит сон о лошади?', m: 'Лошади символизируют силу.' },
    zh: { t: '梦见马', h: '梦见马是什么意思？', m: '马象征力量。' },
    ja: { t: '馬の夢', h: '馬の夢は何を意味する？', m: '馬は力を表す。' },
    ko: { t: '말 꿈', h: '말 꿈은 무슨 의미일까?', m: '말은 힘을 나타냅니다.' },
    tr: { t: 'At rüyası', h: 'At görmek ne demek?', m: 'At gücü simgeler.' },
    hi: { t: 'घोड़े का सपना', h: 'सपने में घोड़े का क्या मतलब?', m: 'घोड़ा शक्ति का प्रतीक है।' },
    it: { t: 'Sogno di cavallo', h: 'Cosa significa sognare cavallo?', m: 'I cavalli simbolizzano potere.' },
  },
  lion: {
    en: { t: 'Lion Dream Meaning', h: 'What Does It Mean to Dream About a Lion?', m: 'Lions represent courage, authority, primal strength, and leadership.' },
    ar: { t: 'تفسير حلم الأسد', h: 'ما معنى رؤية الأسد في الحلم؟', m: 'الأسود ترمز للشجاعة والسلطة.' },
    es: { t: 'Soñar con león', h: '¿Qué significa soñar con león?', m: 'Los leones simbolizan coraje.' },
    fr: { t: 'Rêve de lion', h: 'Que signifie rêver de lion?', m: 'Les lions symbolisent le courage.' },
    de: { t: 'Löwe Traum', h: 'Was bedeutet Löwe im Traum?', m: 'Löwen symbolisieren Mut.' },
    pt: { t: 'Sonhar com leão', h: 'O que significa sonhar com leão?', m: 'Leões representam coragem.' },
    ru: { t: 'Сон о льве', h: 'Что значит сон о льве?', m: 'Львы символизируют храбрость.' },
    zh: { t: '梦见狮子', h: '梦见狮子是什么意思？', m: '狮子象征勇气。' },
    ja: { t: 'ライオンの夢', h: 'ライオンの夢は何を意味する？', m: 'ライオンは勇気を表す。' },
    ko: { t: '사자 꿈', h: '사자 꿈은 무슨 의미일까?', m: '사는 용기를 나타냅니다.' },
    tr: { t: 'Aslan rüyası', h: 'Aslan görmek ne demek?', m: 'Aslan cesareti simgeler.' },
    hi: { t: 'शेर का सपना', h: 'सपने में शेर का क्या मतलब?', m: 'शेर साहस का प्रतीक है।' },
    it: { t: 'Sogno di leone', h: 'Cosa significa sognare leone?', m: 'I leoni simbolizzano coraggio.' },
  },
  spider: {
    en: { t: 'Spider Dream Meaning', h: 'What Does It Mean to Dream About a Spider?', m: 'Spiders represent patience, crafting, entanglement, and feminine power.' },
    ar: { t: 'تفسير حلم العنكبوت', h: 'ما معنى رؤية العنكبوت في الحلم؟', m: 'العناكب ترمز للصبر والحبكة.' },
    es: { t: 'Soñar con araña', h: '¿Qué significa soñar con araña?', m: 'Las arañas simbolizan paciencia.' },
    fr: { t: 'Rêve d\'araignée', h: 'Que signifie rêver d\'araignée?', m: 'Les araignées symbolisent la patience.' },
    de: { t: 'Spinne Traum', h: 'Was bedeutet Spinne im Traum?', m: 'Spinnen symbolisieren Geduld.' },
    pt: { t: 'Sonhar com aranha', h: 'O que significa sonhar com aranha?', m: 'Aranhas representam paciência.' },
    ru: { t: 'Сон о пауке', h: 'Что значит сон о пауке?', m: 'Пауки символизируют терпение.' },
    zh: { t: '梦见蜘蛛', h: '梦见蜘蛛是什么意思？', m: '蜘蛛象征耐心。' },
    ja: { t: '蜘蛛の夢', h: '蜘蛛の夢は何を意味する？', m: '蜘蛛は忍耐を表す。' },
    ko: { t: '거미 꿈', h: '거미 꿈은 무슨 의미일까?', m: '거미는 인내를 나타냅니다.' },
    tr: { t: 'Örümcek rüyası', h: 'Örümcek görmek ne demek?', m: 'Örümcek sabrı simgeler.' },
    hi: { t: 'मकड़ी का सपना', h: 'सपने में मकड़ी का क्या मतलब?', m: 'मकड़ी धैर्य का प्रतीक है।' },
    it: { t: 'Sogno di ragno', h: 'Cosa significa sognare ragno?', m: 'I ragni simbolizzano pazienza.' },
  },
  road: {
    en: { t: 'Road Dream Meaning', h: 'What Does It Mean to Dream About a Road?', m: 'Roads represent your life path, direction, and the journey ahead.' },
    ar: { t: 'تفسير حلم الطريق', h: 'ما معنى رؤية الطريق في الحلم؟', m: 'الطرق ترمز لمسار الحياة.' },
    es: { t: 'Soñar con camino', h: '¿Qué significa soñar con camino?', m: 'Los caminos simbolizan el rumbo.' },
    fr: { t: 'Rêve de route', h: 'Que signifie rêver de route?', m: 'Les routes symbolisent le chemin.' },
    de: { t: 'Straße Traum', h: 'Was bedeutet Straße im Traum?', m: 'Straßen symbolisieren Lebensweg.' },
    pt: { t: 'Sonhar com estrada', h: 'O que significa sonhar com estrada?', m: 'Estradas representam caminho.' },
    ru: { t: 'Сон о дороге', h: 'Что значит сон о дороге?', m: 'Дороги символизируют путь.' },
    zh: { t: '梦见路', h: '梦见路是什么意思？', m: '路象征人生道路。' },
    ja: { t: '道の夢', h: '道の夢は何を意味する？', m: '道は人生の道を表す。' },
    ko: { t: '길 꿈', h: '길 꿈은 무슨 의미일까?', m: '길은 인생의 길을 나타냅니다.' },
    tr: { t: 'Yol rüyası', h: 'Yol görmek ne demek?', m: 'Yol yaşam yolunu simgeler.' },
    hi: { t: 'रास्ते का सपना', h: 'सपने में रास्ते का क्या मतलब?', m: 'रास्ता जीवन के मार्ग का प्रतीक है।' },
    it: { t: 'Sogno di strada', h: 'Cosa significa sognare strada?', m: 'Le strade simbolizzano il percorso.' },
  },
  friend: {
    en: { t: 'Friend Dream Meaning', h: 'What Does It Mean to Dream About a Friend?', m: 'Friends represent connection, support, and aspects of yourself reflected in others.' },
    ar: { t: 'تفسير حلم الصديق', h: 'ما معنى رؤية صديق في الحلم؟', m: 'الأصدقاء يرمزون للدعم والرابطة.' },
    es: { t: 'Soñar con amigo', h: '¿Qué significa soñar con amigo?', m: 'Los amigos simbolizan apoyo.' },
    fr: { t: 'Rêve d\'ami', h: 'Que signifie rêver d\'ami?', m: 'Les amis symbolisent le soutien.' },
    de: { t: 'Freund Traum', h: 'Was bedeutet Freund im Traum?', m: 'Freunde symbolisieren Unterstützung.' },
    pt: { t: 'Sonhar com amigo', h: 'O que significa sonhar com amigo?', m: 'Amigos representam apoio.' },
    ru: { t: 'Сон о друге', h: 'Что значит сон о друге?', m: 'Друзья символизируют поддержку.' },
    zh: { t: '梦见朋友', h: '梦见朋友是什么意思？', m: '朋友象征支持。' },
    ja: { t: '友達の夢', h: '友達の夢は何を意味する？', m: '友達は支援を表す。' },
    ko: { t: '친구 꿈', h: '친구 꿈은 무슨 의미일까?', m: '친구는 지지를 나타냅니다.' },
    tr: { t: 'Arkadaş rüyası', h: 'Arkadaş görmek ne demek?', m: 'Arkadaş desteği simgeler.' },
    hi: { t: 'दोस्त का सपना', h: 'सपने में दोस्त का क्या मतलब?', m: 'दोस्त समर्थन का प्रतीक है।' },
    it: { t: 'Sogno di amico', h: 'Cosa significa sognare amico?', m: 'Gli amici simbolizzano supporto.' },
  },
  stranger: {
    en: { t: 'Stranger Dream Meaning', h: 'What Does It Mean to Dream About a Stranger?', m: 'Strangers represent unknown parts of yourself or unexplored possibilities.' },
    ar: { t: 'تفسير حلم الغريب', h: 'ما معنى رؤية غريب في الحلم؟', m: 'الغرباء يرمزون لجوانب غير معروفة منك.' },
    es: { t: 'Soñar con desconocido', h: '¿Qué significa soñar con desconocido?', m: 'Los desconocidos simbolizan lo oculto.' },
    fr: { t: 'Rêve d\'inconnu', h: 'Que signifie rêver d\'inconnu?', m: 'Les inconnus symbolisent l\'inconnu.' },
    de: { t: 'Fremder Traum', h: 'Was bedeutet Fremder im Traum?', m: 'Fremde symbolisieren Unbekanntes.' },
    pt: { t: 'Sonhar com estranho', h: 'O que significa sonhar com estranho?', m: 'Estranhos representam o oculto.' },
    ru: { t: 'Сон о незнакомце', h: 'Что значит сон о незнакомце?', m: 'Незнакомцы символизируют неизвестное.' },
    zh: { t: '梦见陌生人', h: '梦见陌生人是什么意思？', m: '陌生人象征未知。' },
    ja: { t: '見知らぬ人の夢', h: '見知らぬ人の夢は何を意味する？', m: '見知らぬ人は未知を表す。' },
    ko: { t: '낯선 사람 꿈', h: '낯선 사람 꿈은 무슨 의미일까?', m: '낯선 사람은 미지의 것을 나타냅니다.' },
    tr: { t: 'Yabancı rüyası', h: 'Yabancı görmek ne demek?', m: 'Yabancı bilinmeyeni simgeler.' },
    hi: { t: 'अजनबी का सपना', h: 'सपने में अजनबी का क्या मतलब?', m: 'अजनबी अज्ञात का प्रतीक है।' },
    it: { t: 'Sogno di sconosciuto', h: 'Cosa significa sognare sconosciuto?', m: 'Gli sconosciuti simbolizzano l\'ignoto.' },
  },
  ghost: {
    en: { t: 'Ghost Dream Meaning', h: 'What Does It Mean to Dream About a Ghost?', m: 'Ghosts represent unresolved past, guilt, or messages from memory.' },
    ar: { t: 'تفسير حلم الشبح', h: 'ما معنى رؤية شبح في الحلم؟', m: 'الأشباح ترمز للماضي غير المحلول.' },
    es: { t: 'Soñar con fantasma', h: '¿Qué significa soñar con fantasma?', m: 'Los fantasmas simbolizan el pasado.' },
    fr: { t: 'Rêve de fantôme', h: 'Que signifie rêver de fantôme?', m: 'Les fantômes symbolisent le passé.' },
    de: { t: 'Geist Traum', h: 'Was bedeutet Geist im Traum?', m: 'Geister symbolisieren Vergangenheit.' },
    pt: { t: 'Sonhar com fantasma', h: 'O que significa sonhar com fantasma?', m: 'Fantasmas representam o passado.' },
    ru: { t: 'Сон о призраке', h: 'Что значит сон о призраке?', m: 'Призраки символизируют прошлое.' },
    zh: { t: '梦见鬼', h: '梦见鬼是什么意思？', m: '鬼象征过去。' },
    ja: { t: '幽霊の夢', h: '幽霊の夢は何を意味する？', m: '幽霊は過去を表す。' },
    ko: { t: '유령 꿈', h: '유령 꿈은 무슨 의미일까?', m: '유령은 과거를 나타냅니다.' },
    tr: { t: 'Hayalet rüyası', h: 'Hayalet görmek ne demek?', m: 'Hayalet geçmişi simgeler.' },
    hi: { t: 'भूत का सपना', h: 'सपने में भूत का क्या मतलब?', m: 'भूत अतीत का प्रतीक है।' },
    it: { t: 'Sogno di fantasma', h: 'Cosa significa sognare fantasma?', m: 'I fantasmi simbolizzano il passato.' },
  },
  hospital: {
    en: { t: 'Hospital Dream Meaning', h: 'What Does It Mean to Dream About a Hospital?', m: 'Hospitals represent healing, vulnerability, and a need for care.' },
    ar: { t: 'تفسير حلم المستشفى', h: 'ما معنى رؤية المستشفى في الحلم؟', m: 'المستشفيات ترمز للشفاء والرعاية.' },
    es: { t: 'Soñar con hospital', h: '¿Qué significa soñar con hospital?', m: 'Los hospitales simbolizan sanación.' },
    fr: { t: 'Rêve d\'hôpital', h: 'Que signifie rêver d\'hôpital?', m: 'Les hôpitaux symbolisent la guérison.' },
    de: { t: 'Krankenhaus Traum', h: 'Was bedeutet Krankenhaus im Traum?', m: 'Krankenhäuser symbolisieren Heilung.' },
    pt: { t: 'Sonhar com hospital', h: 'O que significa sonhar com hospital?', m: 'Hospitais representam cura.' },
    ru: { t: 'Сон о больнице', h: 'Что значит сон о больнице?', m: 'Больницы символизируют исцеление.' },
    zh: { t: '梦见医院', h: '梦见医院是什么意思？', m: '医院象征治愈。' },
    ja: { t: '病院の夢', h: '病院の夢は何を意味する？', m: '病院は癒やしを表す。' },
    ko: { t: '병원 꿈', h: '병원 꿈은 무슨 의미일까?', m: '병원은 치유를 나타냅니다.' },
    tr: { t: 'Hastane rüyası', h: 'Hastane görmek ne demek?', m: 'Hastane şifayı simgeler.' },
    hi: { t: 'अस्पताल का सपना', h: 'सपने में अस्पताल का क्या मतलब?', m: 'अस्पताल चंगाई का प्रतीक है।' },
    it: { t: 'Sogno di ospedale', h: 'Cosa significa sognare ospedale?', m: 'Gli ospedali simbolizzano guarigione.' },
  },
  prison: {
    en: { t: 'Prison Dream Meaning', h: 'What Does It Mean to Dream About Prison?', m: 'Prison represents restriction, guilt, feeling trapped, or self-imposed limits.' },
    ar: { t: 'تفسير حلم السجن', h: 'ما معنى رؤية السجن في الحلم؟', m: 'السجن يرمز للقيود والشعور بالحصار.' },
    es: { t: 'Soñar con cárcel', h: '¿Qué significa soñar con cárcel?', m: 'La cárcel simboliza restricción.' },
    fr: { t: 'Rêve de prison', h: 'Que signifie rêver de prison?', m: 'La prison symbolise la restriction.' },
    de: { t: 'Gefängnis Traum', h: 'Was bedeutet Gefängnis im Traum?', m: 'Gefängnis symbolisiert Einschränkung.' },
    pt: { t: 'Sonhar com prisão', h: 'O que significa sonhar com prisão?', m: 'Prisão representa restrição.' },
    ru: { t: 'Сон о тюрьме', h: 'Что значит сон о тюрьме?', m: 'Тюрьма символизирует ограничение.' },
    zh: { t: '梦见监狱', h: '梦见监狱是什么意思？', m: '监狱象征限制。' },
    ja: { t: '刑務所の夢', h: '刑務所の夢は何を意味する？', m: '刑務所は制限を表す。' },
    ko: { t: '감옥 꿈', h: '감옥 꿈은 무슨 의미일까?', m: '감옥은 제한을 나타냅니다.' },
    tr: { t: 'Hapisane rüyası', h: 'Hapisane görmek ne demek?', m: 'Hapisane kısıtlamayı simgeler.' },
    hi: { t: 'जेल का सपना', h: 'सपने में जेल का क्या मतलब?', m: 'जेल सीमा का प्रतीक है।' },
    it: { t: 'Sogno di prigione', h: 'Cosa significa sognare prigione?', m: 'Le prigioni simbolizzano restrizione.' },
  },
  earthquake: {
    en: { t: 'Earthquake Dream Meaning', h: 'What Does It Mean to Dream About an Earthquake?', m: 'Earthquakes represent sudden change, instability, or shaken foundations.' },
    ar: { t: 'تفسير حلم الزلزال', h: 'ما معنى رؤية الزلزال في الحلم؟', m: 'الزلازل ترمز للتغيير المفاجئ.' },
    es: { t: 'Soñar con terremoto', h: '¿Qué significa soñar con terremoto?', m: 'Los terremotos simbolizan cambio.' },
    fr: { t: 'Rêve de tremblement de terre', h: 'Que signifie rêver de tremblement de terre?', m: 'Les tremblements symbolisent le changement.' },
    de: { t: 'Erdbeben Traum', h: 'Was bedeutet Erdbeben im Traum?', m: 'Erdbeben symbolisieren Veränderung.' },
    pt: { t: 'Sonhar com terremoto', h: 'O que significa sonhar com terremoto?', m: 'Terremotos representam mudança.' },
    ru: { t: 'Сон о землетрясении', h: 'Что значит сон о землетрясении?', m: 'Землетрясения символизируют перемены.' },
    zh: { t: '梦见地震', h: '梦见地震是什么意思？', m: '地震象征变化。' },
    ja: { t: '地震の夢', h: '地震の夢は何を意味する？', m: '地震は変化を表す。' },
    ko: { t: '지진 꿈', h: '지진 꿈은 무슨 의미일까?', m: '지진은 변화를 나타냅니다.' },
    tr: { t: 'Deprem rüyası', h: 'Deprem görmek ne demek?', m: 'Deprem değişimi simgeler.' },
    hi: { t: 'भूकंप का सपना', h: 'सपने में भूकंप का क्या मतलब?', m: 'भूकंप परिवर्तन का प्रतीक है।' },
    it: { t: 'Sogno di terremoto', h: 'Cosa significa sognare terremoto?', m: 'I terremoti simbolizzano cambiamento.' },
  },
  flood: {
    en: { t: 'Flood Dream Meaning', h: 'What Does It Mean to Dream About a Flood?', m: 'Floods represent overwhelming emotion, release, and being swept by circumstance.' },
    ar: { t: 'تفسير حلم الفيضان', h: 'ما معنى رؤية الفيضان في الحلم؟', m: 'الفيضانات ترمز للمشاعر الغامرة.' },
    es: { t: 'Soñar con inundación', h: '¿Qué significa soñar con inundación?', m: 'Las inundaciones simbolizan emoción.' },
    fr: { t: 'Rêve d\'inondation', h: 'Que signifie rêver d\'inondation?', m: 'Les inondations symbolisent l\'émotion.' },
    de: { t: 'Flut Traum', h: 'Was bedeutet Flut im Traum?', m: 'Fluten symbolisieren Emotion.' },
    pt: { t: 'Sonhar com enchente', h: 'O que significa sonhar com enchente?', m: 'Enchentes representam emoção.' },
    ru: { t: 'Сон о наводнении', h: 'Что значит сон о наводнении?', m: 'Наводнения символизируют эмоцию.' },
    zh: { t: '梦见洪水', h: '梦见洪水是什么意思？', m: '洪水象征情感。' },
    ja: { t: '洪水の夢', h: '洪水の夢は何を意味する？', m: '洪水は感情を表す。' },
    ko: { t: '홍수 꿈', h: '홍수 꿈은 무슨 의미일까?', m: '홍수는 감정을 나타냅니다.' },
    tr: { t: 'Sel rüyası', h: 'Sel görmek ne demek?', m: 'Sel duyguyu simgeler.' },
    hi: { t: 'बाढ़ का सपना', h: 'सपने में बाढ़ का क्या मतलब?', m: 'बाढ़ भावना का प्रतीक है।' },
    it: { t: 'Sogno di alluvione', h: 'Cosa significa sognare alluvione?', m: 'Le alluvioni simbolizzano emozione.' },
  },
  star: {
    en: { t: 'Star Dream Meaning', h: 'What Does It Mean to Dream About Stars?', m: 'Stars represent hope, guidance, destiny, and your highest aspirations.' },
    ar: { t: 'تفسير حلم النجوم', h: 'ما معنى رؤية النجوم في الحلم؟', m: 'النجوم ترمز للأمل والتوجيه.' },
    es: { t: 'Soñar con estrella', h: '¿Qué significa soñar con estrella?', m: 'Las estrellas simbolizan esperanza.' },
    fr: { t: 'Rêve d\'étoile', h: 'Que signifie rêver d\'étoile?', m: 'Les étoiles symbolisent l\'espoir.' },
    de: { t: 'Stern Traum', h: 'Was bedeutet Stern im Traum?', m: 'Sterne symbolisieren Hoffnung.' },
    pt: { t: 'Sonhar com estrela', h: 'O que significa sonhar com estrela?', m: 'Estrelas representam esperança.' },
    ru: { t: 'Сон о звезде', h: 'Что значит сон о звезде?', m: 'Звёзды символизируют надежду.' },
    zh: { t: '梦见星星', h: '梦见星星是什么意思？', m: '星星象征希望。' },
    ja: { t: '星の夢', h: '星の夢は何を意味する？', m: '星は希望を表す。' },
    ko: { t: '별 꿈', h: '별 꿈은 무슨 의미일까?', m: '별은 희망을 나타냅니다.' },
    tr: { t: 'Yıldız rüyası', h: 'Yıldız görmek ne demek?', m: 'Yıldız umudu simgeler.' },
    hi: { t: 'तारे का सपना', h: 'सपने में तारे का क्या मतलब?', m: 'तारे आशा का प्रतीक है।' },
    it: { t: 'Sogno di stella', h: 'Cosa significa sognare stella?', m: 'Le stelle simbolizzano speranza.' },
  },
  cloud: {
    en: { t: 'Cloud Dream Meaning', h: 'What Does It Mean to Dream About Clouds?', m: 'Clouds represent thoughts, uncertainty, dreams, and shifting moods.' },
    ar: { t: 'تفسير حلم السحاب', h: 'ما معنى رؤية السحاب في الحلم؟', m: 'السحب ترمز للأفكار والغموض.' },
    es: { t: 'Soñar con nube', h: '¿Qué significa soñar con nube?', m: 'Las nubes simbolizan pensamiento.' },
    fr: { t: 'Rêve de nuage', h: 'Que signifie rêver de nuage?', m: 'Les nuages symbolisent la pensée.' },
    de: { t: 'Wolke Traum', h: 'Was bedeutet Wolke im Traum?', m: 'Wolken symbolisieren Gedanken.' },
    pt: { t: 'Sonhar com nuvem', h: 'O que significa sonhar com nuvem?', m: 'Nuvens representam pensamento.' },
    ru: { t: 'Сон об облаке', h: 'Что значит сон об облаке?', m: 'Облака символизируют мысль.' },
    zh: { t: '梦见云', h: '梦见云是什么意思？', m: '云象征思绪。' },
    ja: { t: '雲の夢', h: '雲の夢は何を意味する？', m: '雲は思考を表す。' },
    ko: { t: '구름 꿈', h: '구름 꿈은 무슨 의미일까?', m: '구름은 생각을 나타냅니다.' },
    tr: { t: 'Bulut rüyası', h: 'Bulut görmek ne demek?', m: 'Bulut düşünceyi simgeler.' },
    hi: { t: 'बादल का सपना', h: 'सपने में बादल का क्या मतलब?', m: 'बादल विचार का प्रतीक है।' },
    it: { t: 'Sogno di nuvola', h: 'Cosa significa sognare nuvola?', m: 'Le nuvole simbolizzano pensiero.' },
  },
  flower: {
    en: { t: 'Flower Dream Meaning', h: 'What Does It Mean to Dream About Flowers?', m: 'Flowers represent beauty, growth, tenderness, and blooming potential.' },
    ar: { t: 'تفسير حلم الزهرة', h: 'ما معنى رؤية الزهرة في الحلم؟', m: 'الزهور ترمز للجمال والنمو.' },
    es: { t: 'Soñar con flor', h: '¿Qué significa soñar con flor?', m: 'Las flores simbolizan belleza.' },
    fr: { t: 'Rêve de fleur', h: 'Que signifie rêver de fleur?', m: 'Les fleurs symbolisent la beauté.' },
    de: { t: 'Blume Traum', h: 'Was bedeutet Blume im Traum?', m: 'Blumen symbolisieren Schönheit.' },
    pt: { t: 'Sonhar com flor', h: 'O que significa sonhar com flor?', m: 'Flores representam beleza.' },
    ru: { t: 'Сон о цветке', h: 'Что значит сон о цветке?', m: 'Цветы символизируют красоту.' },
    zh: { t: '梦见花', h: '梦见花是什么意思？', m: '花象征美。' },
    ja: { t: '花の夢', h: '花の夢は何を意味する？', m: '花は美を表す。' },
    ko: { t: '꽃 꿈', h: '꽃 꿈은 무슨 의미일까?', m: '꽃은 아름다움을 나타냅니다.' },
    tr: { t: 'Çiçek rüyası', h: 'Çiçek görmek ne demek?', m: 'Çiçek güzelliği simgeler.' },
    hi: { t: 'फूल का सपना', h: 'सपने में फूल का क्या मतलब?', m: 'फूल सुंदरता का प्रतीक है।' },
    it: { t: 'Sogno di fiore', h: 'Cosa significa sognare fiore?', m: 'I fiori simbolizzano bellezza.' },
  },
  ring: {
    en: { t: 'Ring Dream Meaning', h: 'What Does It Mean to Dream About a Ring?', m: 'Rings represent commitment, wholeness, cycles, and eternal bonds.' },
    ar: { t: 'تفسير حلم الخاتم', h: 'ما معنى رؤية الخاتم في الحلم؟', m: 'الخواتم ترمز للالتزام والوحدة.' },
    es: { t: 'Soñar con anillo', h: '¿Qué significa soñar con anillo?', m: 'Los anillos simbolizan compromiso.' },
    fr: { t: 'Rêve d\'anneau', h: 'Que signifie rêver d\'anneau?', m: 'Les anneaux symbolisent l\'engagement.' },
    de: { t: 'Ring Traum', h: 'Was bedeutet Ring im Traum?', m: 'Ringe symbolisieren Bindung.' },
    pt: { t: 'Sonhar com anel', h: 'O que significa sonhar com anel?', m: 'Anéis representam compromisso.' },
    ru: { t: 'Сон о кольце', h: 'Что значит сон о кольце?', m: 'Кольца символизируют обязательство.' },
    zh: { t: '梦见戒指', h: '梦见戒指是什么意思？', m: '戒指象征承诺。' },
    ja: { t: '指輪の夢', h: '指輪の夢は何を意味する？', m: '指輪は約束を表す。' },
    ko: { t: '반지 꿈', h: '반지 꿈은 무슨 의미일까?', m: '반지는 약속을 나타냅니다.' },
    tr: { t: 'Yüzük rüyası', h: 'Yüzük görmek ne demek?', m: 'Yüzük bağı simgeler.' },
    hi: { t: 'अंगूठी का सपना', h: 'सपने में अंगूठी का क्या मतलब?', m: 'अंगूठी प्रतिबद्धता का प्रतीक है।' },
    it: { t: 'Sogno di anello', h: 'Cosa significa sognare anello?', m: 'Gli anelli simbolizzano impegno.' },
  },
  phone: {
    en: { t: 'Phone Dream Meaning', h: 'What Does It Mean to Dream About a Phone?', m: 'Phones represent communication, connection, and messages from your psyche.' },
    ar: { t: 'تفسير حلم الهاتف', h: 'ما معنى رؤية الهاتف في الحلم؟', m: 'الهواتف ترمز للتواصل والرسائل.' },
    es: { t: 'Soñar con teléfono', h: '¿Qué significa soñar con teléfono?', m: 'Los teléfonos simbolizan comunicación.' },
    fr: { t: 'Rêve de téléphone', h: 'Que signifie rêver de téléphone?', m: 'Les téléphones symbolisent communication.' },
    de: { t: 'Telefon Traum', h: 'Was bedeutet Telefon im Traum?', m: 'Telefone symbolisieren Kommunikation.' },
    pt: { t: 'Sonhar com telefone', h: 'O que significa sonhar com telefone?', m: 'Telefones representam comunicação.' },
    ru: { t: 'Сон о телефоне', h: 'Что значит сон о телефоне?', m: 'Телефоны символизируют общение.' },
    zh: { t: '梦见手机', h: '梦见手机是什么意思？', m: '手机象征沟通。' },
    ja: { t: '電話の夢', h: '電話の夢は何を意味する？', m: '電話は伝達を表す。' },
    ko: { t: '전화 꿈', h: '전화 꿈은 무슨 의미일까?', m: '전화는 소통을 나타냅니다.' },
    tr: { t: 'Telefon rüyası', h: 'Telefon görmek ne demek?', m: 'Telefon iletişimi simgeler.' },
    hi: { t: 'फ़ोन का सपना', h: 'सपने में फ़ोन का क्या मतलब?', m: 'फ़ोन संचार का प्रतीक है।' },
    it: { t: 'Sogno di telefono', h: 'Cosa significa sognare telefono?', m: 'I telefoni simbolizzano comunicazione.' },
  },
  egg: {
    en: { t: 'Egg Dream Meaning', h: 'What Does It Mean to Dream About an Egg?', m: 'Eggs represent potential, birth, fragility, and new life beginning.' },
    ar: { t: 'تفسير حلم البيضة', h: 'ما معنى رؤية البيضة في الحلم؟', m: 'البيض يرمز للإمكانات والولادة.' },
    es: { t: 'Soñar con huevo', h: '¿Qué significa soñar con huevo?', m: 'Los huevos simbolizan potencial.' },
    fr: { t: 'Rêve d\'œuf', h: 'Que signifie rêver d\'œuf?', m: 'Les œufs symbolisent le potentiel.' },
    de: { t: 'Ei Traum', h: 'Was bedeutet Ei im Traum?', m: 'Eier symbolisieren Potenzial.' },
    pt: { t: 'Sonhar com ovo', h: 'O que significa sonhar com ovo?', m: 'Ovos representam potencial.' },
    ru: { t: 'Сон о яйце', h: 'Что значит сон о яйце?', m: 'Яйца символизируют потенциал.' },
    zh: { t: '梦见蛋', h: '梦见蛋是什么意思？', m: '蛋象征潜力。' },
    ja: { t: '卵の夢', h: '卵の夢は何を意味する？', m: '卵は可能性を表す。' },
    ko: { t: '달걀 꿈', h: '달걀 꿈은 무슨 의미일까?', m: '달걀은 잠재력을 나타냅니다.' },
    tr: { t: 'Yumurta rüyası', h: 'Yumurta görmek ne demek?', m: 'Yumurta potansiyeli simgeler.' },
    hi: { t: 'अंडे का सपना', h: 'सपने में अंडे का क्या मतलब?', m: 'अंडा संभावना का प्रतीक है।' },
    it: { t: 'Sogno di uovo', h: 'Cosa significa sognare uovo?', m: 'Le uova simbolizzano potenziale.' },
  },
  gold: {
    en: { t: 'Gold Dream Meaning', h: 'What Does It Mean to Dream About Gold?', m: 'Gold represents value, wisdom, purity, and true worth.' },
    ar: { t: 'تفسير حلم الذهب', h: 'ما معنى رؤية الذهب في الحلم؟', m: 'الذهب يرمز للقيمة والحكمة.' },
    es: { t: 'Soñar con oro', h: '¿Qué significa soñar con oro?', m: 'El oro simboliza valor.' },
    fr: { t: 'Rêve d\'or', h: 'Que signifie rêver d\'or?', m: 'L\'or symbolise la valeur.' },
    de: { t: 'Gold Traum', h: 'Was bedeutet Gold im Traum?', m: 'Gold symbolisiert Wert.' },
    pt: { t: 'Sonhar com ouro', h: 'O que significa sonhar com ouro?', m: 'Ouro representa valor.' },
    ru: { t: 'Сон о золоте', h: 'Что значит сон о золоте?', m: 'Золото символизирует ценность.' },
    zh: { t: '梦见金', h: '梦见金是什么意思？', m: '金象征价值。' },
    ja: { t: '金の夢', h: '金の夢は何を意味する？', m: '金は価値を表す。' },
    ko: { t: '금 꿈', h: '금 꿈은 무슨 의미일까?', m: '금은 가치를 나타냅니다.' },
    tr: { t: 'Altın rüyası', h: 'Altın görmek ne demek?', m: 'Altın değeri simgeler.' },
    hi: { t: 'सोने का सपना', h: 'सपने में सोने का क्या मतलब?', m: 'सोना मूल्य का प्रतीक है।' },
    it: { t: 'Sogno di oro', h: 'Cosa significa sognare oro?', m: 'L\'oro simbolizza valore.' },
  },
  knife: {
    en: { t: 'Knife Dream Meaning', h: 'What Does It Mean to Dream About a Knife?', m: 'Knives represent separation, cutting ties, defense, or sharp truth.' },
    ar: { t: 'تفسير حلم السكين', h: 'ما معنى رؤية السكين في الحلم؟', m: 'السكاكين ترمز للقطع والفصل.' },
    es: { t: 'Soñar con cuchillo', h: '¿Qué significa soñar con cuchillo?', m: 'Los cuchillos simbolizan corte.' },
    fr: { t: 'Rêve de couteau', h: 'Que signifie rêver de couteau?', m: 'Les couteaux symbolisent la coupure.' },
    de: { t: 'Messer Traum', h: 'Was bedeutet Messer im Traum?', m: 'Messer symbolisieren Trennung.' },
    pt: { t: 'Sonhar com faca', h: 'O que significa sonhar com faca?', m: 'Faca representa corte.' },
    ru: { t: 'Сон о ноже', h: 'Что значит сон о ноже?', m: 'Ножи символизируют разрыв.' },
    zh: { t: '梦见刀', h: '梦见刀是什么意思？', m: '刀象征切割。' },
    ja: { t: 'ナイフの夢', h: 'ナイフの夢は何を意味する？', m: 'ナイフは切断を表す。' },
    ko: { t: '칼 꿈', h: '칼 꿈은 무슨 의미일까?', m: '칼은 절단을 나타냅니다.' },
    tr: { t: 'Bıçak rüyası', h: 'Bıçak görmek ne demek?', m: 'Bıçak ayrılığı simgeler.' },
    hi: { t: 'चाकू का सपना', h: 'सपने में चाकू का क्या मतलब?', m: 'चाकू कटाव का प्रतीक है।' },
    it: { t: 'Sogno di coltello', h: 'Cosa significa sognare coltello?', m: 'I coltelli simbolizzano taglio.' },
  },
  snake_bite: {
    en: { t: 'Snake Bite Dream Meaning', h: 'What Does It Mean to Dream About a Snake Bite?', m: 'A snake bite represents a wake-up call, betrayal, or sudden painful awareness.' },
    ar: { t: 'تفسير حلم عضة الثعبان', h: 'ما معنى رؤية عضة الثعبان في الحلم؟', m: 'عضة الثعبان ترمز لنداء استيقاظ أو خيانة.' },
    es: { t: 'Soñar con mordedura de serpiente', h: '¿Qué significa soñar con mordedura de serpiente?', m: 'La mordedura simboliza alerta.' },
    fr: { t: 'Rêve de morsure de serpent', h: 'Que signifie rêver de morsure de serpent?', m: 'La morsure symbolise l\'alerte.' },
    de: { t: 'Schlangenbiss Traum', h: 'Was bedeutet Schlangenbiss im Traum?', m: 'Der Biss symbolisiert Warnung.' },
    pt: { t: 'Sonhar com picada de cobra', h: 'O que significa sonhar com picada de cobra?', m: 'A picada representa alerta.' },
    ru: { t: 'Сон об укусе змеи', h: 'Что значит сон об укусе змеи?', m: 'Укус символизирует предупреждение.' },
    zh: { t: '梦见蛇咬', h: '梦见蛇咬是什么意思？', m: '蛇咬象征警觉。' },
    ja: { t: '蛇に噛まれる夢', h: '蛇に噛まれる夢は何を意味する？', m: '蛇の噛みは警告を表す。' },
    ko: { t: '뱀에게 물린 꿈', h: '뱀에게 물린 꿈은 무슨 의미일까?', m: '뱀 물림은 경고를 나타냅니다.' },
    tr: { t: 'Yılan sokması rüyası', h: 'Yılan sokması ne demek?', m: 'Isırık uyarısı simgeler.' },
    hi: { t: 'साँप काटने का सपना', h: 'सपने में साँप काटने का क्या मतलब?', m: 'साँप का काटना चेतावनी का प्रतीक है।' },
    it: { t: 'Sogno di morso di serpente', h: 'Cosa significa sognare morso di serpente?', m: 'Il morso simbolizza allarme.' },
  },
  losing_teeth: {
    en: { t: 'Losing Teeth Dream Meaning', h: 'What Does It Mean to Dream About Losing Teeth?', m: 'Losing teeth represents anxiety about appearance, communication, or loss of control.' },
    ar: { t: 'تفسير حلم تساقط الأسنان', h: 'ما معنى رؤية تساقط الأسنان في الحلم؟', m: 'تساقط الأسنان يرمز للقلق من المظهر.' },
    es: { t: 'Soñar con dientes que caen', h: '¿Qué significa soñar con dientes que caen?', m: 'Los dientes que caen simbolizan ansiedad.' },
    fr: { t: 'Rêve de dents qui tombent', h: 'Que signifie rêver de dents qui tombent?', m: 'Les dents qui tombent symbolisent l\'anxiété.' },
    de: { t: 'Zähne verlieren Traum', h: 'Was bedeutet Zähne verlieren im Traum?', m: 'Zähne verlieren symbolisiert Angst.' },
    pt: { t: 'Sonhar com dentes caindo', h: 'O que significa sonhar com dentes caindo?', m: 'Dentes caindo representam ansiedade.' },
    ru: { t: 'Сон о выпадении зубов', h: 'Что значит сон о выпадении зубов?', m: 'Выпадение зубов символизирует тревогу.' },
    zh: { t: '梦见牙齿脱落', h: '梦见牙齿脱落是什么意思？', m: '牙齿脱落象征焦虑。' },
    ja: { t: '歯が抜ける夢', h: '歯が抜ける夢は何を意味する？', m: '歯が抜けることは不安を表す。' },
    ko: { t: '이 빠지는 꿈', h: '이 빠지는 꿈은 무슨 의미일까?', m: '이 빠짐은 불안을 나타냅니다.' },
    tr: { t: 'Diş dökülmesi rüyası', h: 'Diş dökülmesi ne demek?', m: 'Diş dökülmesi kaygıyı simgeler.' },
    hi: { t: 'दांत गिरने का सपना', h: 'सपने में दांत गिरने का क्या मतलब?', m: 'दांत गिरना चिंता का प्रतीक है।' },
    it: { t: 'Sogno di denti che cadono', h: 'Cosa significa sognare denti che cadono?', m: 'Denti che cadono simbolizzano ansia.' },
  },
  being_chased: {
    en: { t: 'Being Chased Dream Meaning', h: 'What Does It Mean to Dream About Being Chased?', m: 'Being chased represents avoidance, fear, or a problem you are running from.' },
    ar: { t: 'تفسير حلم المطاردة', h: 'ما معنى رؤية المطاردة في الحلم؟', m: 'المطاردة ترمز للهروب من مشكلة.' },
    es: { t: 'Soñar con perseguir', h: '¿Qué significa soñar con perseguir?', m: 'Ser perseguido simboliza evasión.' },
    fr: { t: 'Rêve d\'être poursuivi', h: 'Que signifie rêver d\'être poursuivi?', m: 'Être poursuivi symbolise la fuite.' },
    de: { t: 'Verfolgt werden Traum', h: 'Was bedeutet verfolgt werden im Traum?', m: 'Verfolgt werden symbolisiert Flucht.' },
    pt: { t: 'Sonhar com perseguição', h: 'O que significa sonhar com perseguição?', m: 'Perseguição representa fuga.' },
    ru: { t: 'Сон о погоне', h: 'Что значит сон о погоне?', m: 'Погоня символизирует бегство.' },
    zh: { t: '梦见被追', h: '梦见被追是什么意思？', m: '被追象征逃避。' },
    ja: { t: '追われる夢', h: '追われる夢は何を意味する？', m: '追われることは回避を表す。' },
    ko: { t: '쫓기는 꿈', h: '쫓기는 꿈은 무슨 의미일까?', m: '쫓김은 회피를 나타냅니다.' },
    tr: { t: 'Kovalanma rüyası', h: 'Kovalanma ne demek?', m: 'Kovalanma kaçışı simgeler.' },
    hi: { t: 'भागे जाने का सपना', h: 'सपने में भागे जाने का क्या मतलब?', m: 'भागे जाना बचाव का प्रतीक है।' },
    it: { t: 'Sogno di essere inseguito', h: 'Cosa significa sognare di essere inseguito?', m: 'Essere inseguiti simbolizza fuga.' },
  },
  naked: {
    en: { t: 'Naked Dream Meaning', h: 'What Does It Mean to Dream About Being Naked?', m: 'Being naked represents vulnerability, exposure, or fear of being seen as you are.' },
    ar: { t: 'تفسير حلم العري', h: 'ما معنى رؤية العري في الحلم؟', m: 'العري يرمز للضعف والانكشاف.' },
    es: { t: 'Soñar con desnudez', h: '¿Qué significa soñar con desnudez?', m: 'La desnudez simboliza vulnerabilidad.' },
    fr: { t: 'Rêve de nudité', h: 'Que signifie rêver de nudité?', m: 'La nudité symbolise la vulnérabilité.' },
    de: { t: 'Nackt Traum', h: 'Was bedeutet nackt im Traum?', m: 'Nackt symbolisiert Verletzlichkeit.' },
    pt: { t: 'Sonhar com nudez', h: 'O que significa sonhar com nudez?', m: 'Nudez representa vulnerabilidade.' },
    ru: { t: 'Сон о наготе', h: 'Что значит сон о наготе?', m: 'Нагота символизирует уязвимость.' },
    zh: { t: '梦见裸体', h: '梦见裸体是什么意思？', m: '裸体象征脆弱。' },
    ja: { t: '裸の夢', h: '裸の夢は何を意味する？', m: '裸は脆弱性を表す。' },
    ko: { t: '벌거벗은 꿈', h: '벌거벗은 꿈은 무슨 의미일까?', m: '벌거벗음은 취약함을 나타냅니다.' },
    tr: { t: 'Çıplaklık rüyası', h: 'Çıplaklık görmek ne demek?', m: 'Çıplaklık kırılganlığı simgeler.' },
    hi: { t: 'नग्न सपना', h: 'सपने में नग्न का क्या मतलब?', m: 'नग्नता घावक्षमता का प्रतीक है।' },
    it: { t: 'Sogno di nudità', h: 'Cosa significa sognare nudità?', m: 'La nudità simbolizza vulnerabilità.' },
  },
  teeth_falling: {
    en: { t: 'Teeth Falling Out Dream Meaning', h: 'What Does It Mean to Dream About Teeth Falling Out?', m: 'Teeth falling out reflects anxiety about how others see you and loss of control.' },
    ar: { t: 'تفسير حلم سقوط الأسنان', h: 'ما معنى رؤية سقوط الأسنان في الحلم؟', m: 'سقوط الأسنان يعكس قلقاً من نظرة الآخرين.' },
    es: { t: 'Soñar con caída de dientes', h: '¿Qué significa soñar con caída de dientes?', m: 'La caída refleja ansiedad.' },
    fr: { t: 'Rêve de chute de dents', h: 'Que signifie rêver de chute de dents?', m: 'La chute reflète l\'anxiété.' },
    de: { t: 'Zähne fallen Traum', h: 'Was bedeutet Zähne fallen im Traum?', m: 'Zähne fallen spiegelt Angst.' },
    pt: { t: 'Sonhar com queda de dentes', h: 'O que significa sonhar com queda de dentes?', m: 'A queda reflete ansiedade.' },
    ru: { t: 'Сон о выпадении зубов', h: 'Что значит сон о выпадении зубов?', m: 'Выпадение отражает тревогу.' },
    zh: { t: '梦见牙齿掉落', h: '梦见牙齿掉落是什么意思？', m: '牙齿掉落反映焦虑。' },
    ja: { t: '歯が落ちる夢', h: '歯が落ちる夢は何を意味する？', m: '歯が落ちることは不安を反映。' },
    ko: { t: '이가 빠지는 꿈', h: '이가 빠지는 꿈은 무슨 의미일까?', m: '이 빠짐은 불안을 반영합니다.' },
    tr: { t: 'Diş düşmesi rüyası', h: 'Diş düşmesi ne demek?', m: 'Diş düşmesi kaygıyı yansıtır.' },
    hi: { t: 'दांत गिरने का सपना', h: 'सपने में दांत गिरने का क्या मतलब?', m: 'दांत गिरना चिंता को दर्शाता है।' },
    it: { t: 'Sogno di caduta di denti', h: 'Cosa significa sognare caduta di denti?', m: 'La caduta riflette ansia.' },
  },
  running: {
    en: { t: 'Running Dream Meaning', h: 'What Does It Mean to Dream About Running?', m: 'Running represents effort, escape, momentum, or striving toward a goal.' },
    ar: { t: 'تفسير حلم الجري', h: 'ما معنى رؤية الجري في الحلم؟', m: 'الجري يرمز للجهد والهروب.' },
    es: { t: 'Soñar con correr', h: '¿Qué significa soñar con correr?', m: 'Correr simboliza esfuerzo.' },
    fr: { t: 'Rêve de courir', h: 'Que signifie rêver de courir?', m: 'Courir symbolise l\'effort.' },
    de: { t: 'Rennen Traum', h: 'Was bedeutet Rennen im Traum?', m: 'Rennen symbolisiert Anstrengung.' },
    pt: { t: 'Sonhar com correr', h: 'O que significa sonhar com correr?', m: 'Correr representa esforço.' },
    ru: { t: 'Сон о беге', h: 'Что значит сон о беге?', m: 'Бег символизирует усилие.' },
    zh: { t: '梦见跑步', h: '梦见跑步是什么意思？', m: '跑步象征努力。' },
    ja: { t: '走る夢', h: '走る夢は何を意味する？', m: '走ることは努力を表す。' },
    ko: { t: '달리기 꿈', h: '달리기 꿈은 무슨 의미일까?', m: '달리기는 노력을 나타냅니다.' },
    tr: { t: 'Koşma rüyası', h: 'Koşma görmek ne demek?', m: 'Koşma çabayı simgeler.' },
    hi: { t: 'दौड़ने का सपना', h: 'सपने में दौड़ने का क्या मतलब?', m: 'दौड़ना प्रयास का प्रतीक है।' },
    it: { t: 'Sogno di correre', h: 'Cosa significa sognare correre?', m: 'Correre simbolizza sforzo.' },
  },
  crying: {
    en: { t: 'Crying Dream Meaning', h: 'What Does It Mean to Dream About Crying?', m: 'Crying represents release, healing, sorrow, or relief of buried emotion.' },
    ar: { t: 'تفسير حلم البكاء', h: 'ما معنى رؤية البكاء في الحلم؟', m: 'البكاء يرمز للتنفيس والشفاء.' },
    es: { t: 'Soñar con llorar', h: '¿Qué significa soñar con llorar?', m: 'Llorar simboliza liberación.' },
    fr: { t: 'Rêve de pleurer', h: 'Que signifie rêver de pleurer?', m: 'Pleurer symbolise la libération.' },
    de: { t: 'Weinen Traum', h: 'Was bedeutet Weinen im Traum?', m: 'Weinen symbolisiert Befreiung.' },
    pt: { t: 'Sonhar com chorar', h: 'O que significa sonhar com chorar?', m: 'Chorar representa liberação.' },
    ru: { t: 'Сон о плаче', h: 'Что значит сон о плаче?', m: 'Плач символизирует освобождение.' },
    zh: { t: '梦见哭', h: '梦见哭是什么意思？', m: '哭象征释放。' },
    ja: { t: '泣く夢', h: '泣く夢は何を意味する？', m: '泣くことは解放を表す。' },
    ko: { t: '우는 꿈', h: '우는 꿈은 무슨 의미일까?', m: '우는 것은 해방을 나타냅니다.' },
    tr: { t: 'Ağlama rüyası', h: 'Ağlama görmek ne demek?', m: 'Ağlama ferahlamayı simgeler.' },
    hi: { t: 'रोने का सपना', h: 'सपने में रोने का क्या मतलब?', m: 'रोना मुक्ति का प्रतीक है।' },
    it: { t: 'Sogno di piangere', h: 'Cosa significa sognare piangere?', m: 'Piangere simbolizza liberazione.' },
  },
  laughing: {
    en: { t: 'Laughing Dream Meaning', h: 'What Does It Mean to Dream About Laughing?', m: 'Laughing represents joy, relief, acceptance, or hidden mockery.' },
    ar: { t: 'تفسير حلم الضحك', h: 'ما معنى رؤية الضحك في الحلم؟', m: 'الضحك يرمز للفرح والارتياح.' },
    es: { t: 'Soñar con reír', h: '¿Qué significa soñar con reír?', m: 'Reír simboliza alegría.' },
    fr: { t: 'Rêve de rire', h: 'Que signifie rêver de rire?', m: 'Rire symbolise la joie.' },
    de: { t: 'Lachen Traum', h: 'Was bedeutet Lachen im Traum?', m: 'Lachen symbolisiert Freude.' },
    pt: { t: 'Sonhar com rir', h: 'O que significa sonhar com rir?', m: 'Rir representa alegria.' },
    ru: { t: 'Сон о смехе', h: 'Что значит сон о смехе?', m: 'Смех символизирует радость.' },
    zh: { t: '梦见笑', h: '梦见笑是什么意思？', m: '笑象征喜悦。' },
    ja: { t: '笑う夢', h: '笑う夢は何を意味する？', m: '笑いは喜びを表す。' },
    ko: { t: '웃는 꿈', h: '웃는 꿈은 무슨 의미일까?', m: '웃음은 기쁨을 나타냅니다.' },
    tr: { t: 'Gülme rüyası', h: 'Gülme görmek ne demek?', m: 'Gülme sevinci simgeler.' },
    hi: { t: 'हंसी का सपना', h: 'सपने में हंसी का क्या मतलब?', m: 'हंसी आनंद का प्रतीक है।' },
    it: { t: 'Sogno di ridere', h: 'Cosa significa sognare ridere?', m: 'Ridere simbolizza gioia.' },
  },
  kissing: {
    en: { t: 'Kissing Dream Meaning', h: 'What Does It Mean to Dream About Kissing?', m: 'Kissing represents union, affection, reconciliation, or desire.' },
    ar: { t: 'تفسير حلم القبل', h: 'ما معنى رؤية القبل في الحلم؟', m: 'القبل ترمز للاتحاد والعاطفة.' },
    es: { t: 'Soñar con beso', h: '¿Qué significa soñar con beso?', m: 'Los besos simbolizan unión.' },
    fr: { t: 'Rêve de baiser', h: 'Que signifie rêver de baiser?', m: 'Les baisers symbolisent l\'union.' },
    de: { t: 'Kuss Traum', h: 'Was bedeutet Kuss im Traum?', m: 'Küsse symbolisieren Vereinigung.' },
    pt: { t: 'Sonhar com beijo', h: 'O que significa sonhar com beijo?', m: 'Beijos representam união.' },
    ru: { t: 'Сон о поцелуе', h: 'Что значит сон о поцелуе?', m: 'Поцелуи символизируют союз.' },
    zh: { t: '梦见亲吻', h: '梦见亲吻是什么意思？', m: '亲吻象征结合。' },
    ja: { t: 'キスの夢', h: 'キスの夢は何を意味する？', m: 'キスは統合を表す。' },
    ko: { t: '키스 꿈', h: '키스 꿈은 무슨 의미일까?', m: '키스는 결합을 나타냅니다.' },
    tr: { t: 'Öpüşme rüyası', h: 'Öpüşme görmek ne demek?', m: 'Öpüşme birliği simgeler.' },
    hi: { t: 'चूमने का सपना', h: 'सपने में चूमने का क्या मतलब?', m: 'चूमना मिलन का प्रतीक है।' },
    it: { t: 'Sogno di bacio', h: 'Cosa significa sognare bacio?', m: 'I baci simbolizzano unione.' },
  },
  dead_person: {
    en: { t: 'Dead Person Dream Meaning', h: 'What Does It Mean to Dream About a Dead Person?', m: 'Seeing a dead person represents unfinished business, memory, comfort, or guidance.' },
    ar: { t: 'تفسير حلم شخص ميت', h: 'ما معنى رؤية شخص ميت في الحلم؟', m: 'رؤية ميت ترمز للذكرى والعزاء.' },
    es: { t: 'Soñar con persona muerta', h: '¿Qué significa soñar con persona muerta?', m: 'Ver a un muerto simboliza memoria.' },
    fr: { t: 'Rêve de personne morte', h: 'Que signifie rêver de personne morte?', m: 'Voir un mort symbolise mémoire.' },
    de: { t: 'Tote Person Traum', h: 'Was bedeutet tote Person im Traum?', m: 'Eine Tote symbolisiert Erinnerung.' },
    pt: { t: 'Sonhar com pessoa morta', h: 'O que significa sonhar com pessoa morta?', m: 'Ver morto representa memória.' },
    ru: { t: 'Сон об умершем', h: 'Что значит сон об умершем?', m: 'Умерший символизирует память.' },
    zh: { t: '梦见死人', h: '梦见死人是什么意思？', m: '死人象征记忆。' },
    ja: { t: '死者の夢', h: '死者の夢は何を意味する？', m: '死者は記憶を表す。' },
    ko: { t: '죽은 사람 꿈', h: '죽은 사람 꿈은 무슨 의미일까?', m: '죽은 사람은 기억을 나타냅니다.' },
    tr: { t: 'Ölmüş kişi rüyası', h: 'Ölmüş kişi görmek ne demek?', m: 'Ölü kişi anıyı simgeler.' },
    hi: { t: 'मृत व्यक्ति का सपना', h: 'सपने में मृत व्यक्ति का क्या मतलब?', m: 'मृत व्यक्ति स्मृति का प्रतीक है।' },
    it: { t: 'Sogno di persona morta', h: 'Cosa significa sognare persona morta?', m: 'Vedere un morto simbolizza memoria.' },
  },
  pregnancy_test: {
    en: { t: 'Pregnancy Test Dream Meaning', h: 'What Does It Mean to Dream About a Pregnancy Test?', m: 'A pregnancy test represents anticipation, confirmation, and a question about to be answered.' },
    ar: { t: 'تفسير حلم اختبار الحمل', h: 'ما معنى رؤية اختبار الحمل في الحلم؟', m: 'اختبار الحمل يرمز للترقب والتأكيد.' },
    es: { t: 'Soñar con test de embarazo', h: '¿Qué significa soñar con test de embarazo?', m: 'El test simboliza anticipación.' },
    fr: { t: 'Rêve de test de grossesse', h: 'Que signifie rêver de test de grossesse?', m: 'Le test symbolise l\'attente.' },
    de: { t: 'Schwangerschaftstest Traum', h: 'Was bedeutet Schwangerschaftstest im Traum?', m: 'Der Test symbolisiert Erwartung.' },
    pt: { t: 'Sonhar com teste de gravidez', h: 'O que significa sonhar com teste de gravidez?', m: 'O teste representa antecipação.' },
    ru: { t: 'Сон о тесте на беременность', h: 'Что значит сон о тесте на беременность?', m: 'Тест символизирует ожидание.' },
    zh: { t: '梦见验孕', h: '梦见验孕是什么意思？', m: '验孕象征期待。' },
    ja: { t: '妊娠判定の夢', h: '妊娠判定の夢は何を意味する？', m: '妊娠判定は期待を表す。' },
    ko: { t: '임신 테스트 꿈', h: '임신 테스트 꿈은 무슨 의미일까?', m: '임신 테스트는 기대를 나타냅니다.' },
    tr: { t: 'Gebelik testi rüyası', h: 'Gebelik testi görmek ne demek?', m: 'Test beklentiyi simgeler.' },
    hi: { t: 'गर्भावस्था परीक्षण का सपना', h: 'सपने में गर्भावस्था परीक्षण का क्या मतलब?', m: 'परीक्षण प्रतीक्षा का प्रतीक है।' },
    it: { t: 'Sogno di test di gravidanza', h: 'Cosa significa sognare test di gravidanza?', m: 'Il test simbolizza anticipazione.' },
  },
  winning: {
    en: { t: 'Winning Dream Meaning', h: 'What Does It Mean to Dream About Winning?', m: 'Winning represents self-worth, success, validation, and confidence.' },
    ar: { t: 'تفسير حلم الفوز', h: 'ما معنى رؤية الفوز في الحلم؟', m: 'الفوز يرمز للنجاح والثقة.' },
    es: { t: 'Soñar con ganar', h: '¿Qué significa soñar con ganar?', m: 'Ganar simboliza éxito.' },
    fr: { t: 'Rêve de gagner', h: 'Que signifie rêver de gagner?', m: 'Gagner symbolise le succès.' },
    de: { t: 'Gewinnen Traum', h: 'Was bedeutet Gewinnen im Traum?', m: 'Gewinnen symbolisiert Erfolg.' },
    pt: { t: 'Sonhar com ganhar', h: 'O que significa sonhar com ganhar?', m: 'Ganhar representa sucesso.' },
    ru: { t: 'Сон о победе', h: 'Что значит сон о победе?', m: 'Победа символизирует успех.' },
    zh: { t: '梦见赢', h: '梦见赢是什么意思？', m: '赢象征成功。' },
    ja: { t: '勝つ夢', h: '勝つ夢は何を意味する？', m: '勝つことは成功を表す。' },
    ko: { t: '이기는 꿈', h: '이기는 꿈은 무슨 의미일까?', m: '이김은 성공을 나타냅니다.' },
    tr: { t: 'Kazanma rüyası', h: 'Kazanma görmek ne demek?', m: 'Kazanma başarıyı simgeler.' },
    hi: { t: 'जीत का सपना', h: 'सपने में जीत का क्या मतलब?', m: 'जीत सफलता का प्रतीक है।' },
    it: { t: 'Sogno di vincere', h: 'Cosa significa sognare vincere?', m: 'Vincere simbolizza successo.' },
  },
};

// Merge EXTRA + BATCH2 symbols into SYM (skip any already present)
for (const [sk, rec] of Object.entries(EXTRA)) {
  if (!SYM[sk]) SYM[sk] = rec;
}
for (const [sk, rec] of Object.entries(BATCH2)) {
  if (!SYM[sk]) SYM[sk] = rec;
}
for (const [sk, rec] of Object.entries(BATCH3)) {
  if (!SYM[sk]) SYM[sk] = rec;
}
for (const [sk, rec] of Object.entries(BATCH4)) {
  if (!SYM[sk]) SYM[sk] = rec;
}
for (const [sk, rec] of Object.entries(BATCH5)) {
  if (!SYM[sk]) SYM[sk] = rec;
}

// Long-tail question templates per language (drives 1000+ pages)
const QUESTIONS = {
  en: ['meaning', 'interpretation', 'what it means'],
  ar: ['التفسير', 'المعنى', 'ماذا يعني'],
  es: ['significado', 'interpretación', 'qué significa'],
  fr: ['signification', 'interprétation', 'que signifie'],
  de: ['Bedeutung', 'Interpretation', 'was bedeutet'],
  pt: ['significado', 'interpretação', 'o que significa'],
  ru: ['значение', 'толкование', 'что означает'],
  zh: ['含义', '解释', '意思'],
  ja: ['意味', '解釈', '答え'],
  ko: ['의미', '해석', '뜻'],
  tr: ['anlamı', 'yorum', 'ne demek'],
  hi: ['अर्थ', 'व्याख्या', 'मतलब'],
  it: ['significato', 'interpretazione', 'cosa significa'],
};

// Shared CSS for generated pages (matches brand)
const CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0c0b;color:#eef1ec;line-height:1.7}
  .c{max-width:760px;margin:0 auto;padding:56px 20px}
  h1{font-family:Georgia,serif;font-size:2.1rem;margin-bottom:.6rem;color:#fff}
  h2{font-size:1.3rem;margin:2rem 0 .8rem;color:#34d399}
  p{margin-bottom:1rem;color:#b6bfb8}
  .ey{font-family:ui-monospace,monospace;font-size:11px;text-transform:uppercase;letter-spacing:.18em;color:#34d399;display:inline-flex;align-items:center;gap:8px;margin-bottom:18px}
  .ey:before{content:"";width:24px;height:1px;background:rgba(52,211,153,.4)}
  .card{background:#141816;border:1px solid #232b27;border-radius:10px;padding:24px;margin:20px 0}
  .cta{display:inline-block;background:#34d399;color:#04110b;padding:13px 26px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:10px}
  .ls{margin:30px 0;padding:16px;background:#141816;border:1px solid #232b27;border-radius:8px}
  .ls a{color:#34d399;text-decoration:none;margin:0 8px;font-size:.9rem}
  .ad{margin:24px 0;padding:18px;background:#141816;border:1px solid #232b27;border-radius:8px;text-align:center;color:#7e8a82;font-size:13px}
  footer{text-align:center;padding:40px 20px;color:#7e8a82;border-top:1px solid #232b27;margin-top:40px;font-size:13px}
  [dir=rtl]{direction:rtl;text-align:right}
`;

// ---- Build-time output: data module for on-demand serverless rendering ----
const outDir = path.join(process.cwd(), 'dist');
fs.mkdirSync(outDir, { recursive: true });

// Write SEO data for the serverless function (api/seo.js) — single file, no per-page files
const dataJson = JSON.stringify({ BASE, LANGS, SYM, QUESTIONS, SCENARIOS, CSS });
fs.writeFileSync(path.join(process.cwd(), 'api', 'seo-data.json'), dataJson);

// Generate branded OG images (SVG) per symbol for social share cards
const ogDir = path.join(process.cwd(), 'public', 'og');
fs.mkdirSync(ogDir, { recursive: true });
const OG_W = 1200, OG_H = 630;
function ogSvg(label) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_W}" height="${OG_H}" viewBox="0 0 ${OG_W} ${OG_H}">
  <defs><radialGradient id="g" cx="28%" cy="18%" r="95%"><stop offset="0%" stop-color="#0f1a14"/><stop offset="100%" stop-color="#070a08"/></radialGradient></defs>
  <rect width="${OG_W}" height="${OG_H}" fill="url(#g)"/>
  <circle cx="980" cy="110" r="230" fill="none" stroke="#34d399" stroke-opacity="0.16" stroke-width="2"/>
  <circle cx="980" cy="110" r="155" fill="none" stroke="#34d399" stroke-opacity="0.26" stroke-width="2"/>
  <text x="80" y="120" fill="#34d399" font-family="ui-monospace,monospace" font-size="22" letter-spacing="5">DREAMSCOPE</text>
  <text x="80" y="330" fill="#ffffff" font-family="Georgia,serif" font-size="82" font-weight="700">${label}</text>
  <text x="80" y="408" fill="#b6bfb8" font-family="-apple-system,Segoe UI,sans-serif" font-size="34">Free AI Dream Interpretation</text>
  <text x="80" y="560" fill="#7e8a82" font-family="-apple-system,Segoe UI,sans-serif" font-size="26">Ibn Sirin tradition · 36 languages · Private on device</text>
</svg>`;
}
for (const sk of Object.keys(SYM)) {
  const label = sk.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  fs.writeFileSync(path.join(ogDir, sk + '.svg'), ogSvg(label));
}
// Generic OG for homepage
fs.writeFileSync(path.join(ogDir, 'default.svg'), ogSvg('Dream Interpretation'));

// Build sitemap URL list (on-demand pages, no static files needed)
const pages = [];
const slugify = (q) => q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
for (const sk of Object.keys(SYM)) {
  for (const lang of Object.keys(LANGS)) {
    if (!SYM[sk][lang]) continue;
    pages.push('/seo/' + sk + '/' + lang);
    for (const q of (QUESTIONS[lang] || [])) {
      pages.push('/seo/' + sk + '/' + lang + '/' + slugify(q));
    }
    // Long-tail scenarios — use stable s<N> slug (phrase may be non-latin)
    SCENARIOS.forEach((sc, si) => {
      pages.push('/seo/' + sk + '/' + lang + '/s' + (si + 1));
    });
  }
}
// Sitemap: single file under 45K URLs, otherwise index + chunked files
// (Google limit: 50,000 URLs per sitemap file)
const MAX_PER = 45000;
const allPages = ['/', ...pages];
const urlXml = (urls) => '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((p) => {
    const home = p === '/';
    return '  <url><loc>' + BASE + p + '</loc><lastmod>2024-12-01</lastmod><changefreq>' + (home ? 'weekly' : 'monthly') + '</changefreq><priority>' + (home ? '1.0' : '0.8') + '</priority></url>';
  }).join('\n') +
  '\n</urlset>';

let sitemapFiles = 1;
if (allPages.length <= MAX_PER) {
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), urlXml(allPages));
} else {
  const chunks = [];
  for (let i = 0; i < allPages.length; i += MAX_PER) chunks.push(allPages.slice(i, i + MAX_PER));
  chunks.forEach((urls, i) => {
    fs.writeFileSync(path.join(outDir, 'sitemap-' + (i + 1) + '.xml'), urlXml(urls));
  });
  const index = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    chunks.map((_, i) => '  <sitemap><loc>' + BASE + '/sitemap-' + (i + 1) + '.xml</loc></sitemap>').join('\n') +
    '\n</sitemapindex>';
  fs.writeFileSync(path.join(outDir, 'sitemap.xml'), index);
  sitemapFiles = chunks.length;
}
fs.writeFileSync(path.join(outDir, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + BASE + '/sitemap.xml');

console.log('On-demand SEO mode: data module + sitemap generated');
console.log('Sitemap: ' + (pages.length + 1) + ' URLs in ' + sitemapFiles + ' file(s)');
