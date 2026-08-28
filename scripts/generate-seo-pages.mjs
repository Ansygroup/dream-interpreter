#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LANGS = {
  en: { name: 'English', dir: 'ltr' },
  ar: { name: 'العربية', dir: 'rtl' },
  es: { name: 'Español', dir: 'ltr' },
  fr: { name: 'Français', dir: 'ltr' },
  de: { name: 'Deutsch', dir: 'ltr' },
  it: { name: 'Italiano', dir: 'ltr' },
  pt: { name: 'Português', dir: 'ltr' },
  ru: { name: 'Русский', dir: 'ltr' },
  zh: { name: '中文', dir: 'ltr' },
  ja: { name: '日本語', dir: 'ltr' },
  ko: { name: '한국어', dir: 'ltr' },
  tr: { name: 'Türkçe', dir: 'ltr' },
  hi: { name: 'हिंदी', dir: 'ltr' },
};

const SYMBOLS = {
  snake: {
    en: { title: 'Snake Dream Meaning', h1: 'What Does It Mean to Dream About Snakes?', meaning: 'Snakes represent transformation, hidden fears, or wisdom.' },
    ar: { title: 'تفسير حلم الثعبان', h1: 'ما معنى رؤية الثعبان في الحلم؟', meaning: 'الأفاعي ترمز للتحول والمخاوف المخفية والحكمة.' },
    es: { title: 'Soñar con serpientes', h1: '¿Qué significa soñar con serpientes?', meaning: 'Las serpientes representan transformación y sabiduría.' },
    fr: { title: 'Rêve de serpent', h1: 'Que signifie rêver de serpents?', meaning: 'Les serpents représentent la transformation.' },
    de: { title: 'Schlangentraum', h1: 'Was bedeutut es, von Schlangen zu träumen?', meaning: 'Schlangen symbolisieren Transformation.' },
    it: { title: 'Sogno di serpenti', h1: 'Cosa significa sognare serpenti?', meaning: 'I serpenti rappresentano trasformazione.' },
    pt: { title: 'Sonhar com cobras', h1: 'O que significa sonhar com cobras?', meaning: 'Cobras representam transformação.' },
    ru: { title: 'Сон о змее', h1: 'Что значит сон о змее?', meaning: 'Змеи символизируют трансформацию.' },
    zh: { title: '梦见蛇的含义', h1: '梦见蛇是什么意思？', meaning: '蛇代表转变和智慧。' },
    ja: { title: '蛇の夢の意味', h1: '蛇の夢は何を意味する？', meaning: '蛇は変容を表す。' },
    ko: { title: '뱀 꿈 해몽', h1: '뱀 꿈은 무슨 의미일까?', meaning: '뱀은 변신을 나타냅니다.' },
    tr: { title: 'Yılan rüyası', h1: 'Yılan görmek ne anlama gelir?', meaning: 'Yılanlar dönüşüm sembolize eder.' },
    hi: { title: 'साँप के सपने', h1: 'सपने में साँप का क्या मतलब?', meaning: 'साँप रूपांतरण का प्रतीक हैं।' },
  },
  water: {
    en: { title: 'Water Dream Meaning', h1: 'What Does It Mean to Dream About Water?', meaning: 'Water represents emotions, the subconscious, and purification.' },
    ar: { title: 'تفسير حلم الماء', h1: 'ما معنى رؤية الماء في الحلم؟', meaning: 'الماء يرمز للعواطف والعقل الباطن والتطهير.' },
    es: { title: 'Soñar con agua', h1: '¿Qué significa soñar con agua?', meaning: 'El agua representa emociones.' },
    fr: { title: 'Rêve d\'eau', h1: 'Que signifie rêver d\'eau?', meaning: 'L\'eau représente les émotions.' },
    de: { title: 'Wassertraum', h1: 'Was bedeutut Wasseraum?', meaning: 'Wasser symbolisiert Emotionen.' },
    it: { title: 'Sogno d\'acqua', h1: 'Cosa significa sognare l\'acqua?', meaning: 'L\'acqua rappresenta le emozioni.' },
    pt: { title: 'Sonhar com água', h1: 'O que significa sonhar com água?', meaning: 'A água representa emoções.' },
    ru: { title: 'Сон о воде', h1: 'Что значит сон о воде?', meaning: 'Вода символизирует эмоции.' },
    zh: { title: '梦见水', h1: '梦见水是什么意思？', meaning: '水代表情感。' },
    ja: { title: '水の夢', h1: '水の夢は何を意味する？', meaning: '水は感情を表す。' },
    ko: { title: '물 꿈', h1: '물 꿈은 무슨 의미일까?', meaning: '물은 감정을 나타냅니다.' },
    tr: { title: 'Su rüyası', h1: 'Su görmek ne demek?', meaning: 'Su duyguları temsil eder.' },
    hi: { title: 'पानी का सपना', h1: 'पानी का सपना क्या मतलब?', meaning: 'पानी भावनाओं का प्रतिनिधित्व करता है।' },
  },
  flying: {
    en: { title: 'Flying Dream Meaning', h1: 'What Does It Mean to Dream About Flying?', meaning: 'Flying symbolizes freedom, ambition, and transcendence.' },
    ar: { title: 'تفسير حلم الطيران', h1: 'ما معنى رؤية الطيران؟', meaning: 'الطيران يرمز للحرية والطموح.' },
    es: { title: 'Soñar con volar', h1: '¿Qué significa soñar con volar?', meaning: 'Volar simboliza libertad.' },
    fr: { title: 'Rêve de voler', h1: 'Que signifie rêver de voler?', meaning: 'Voler symbolise la liberté.' },
    de: { title: 'Fliegentraum', h1: 'Was bedeutut Fliegentraum?', meaning: 'Fliegen symbolisiert Freiheit.' },
    it: { title: 'Sogno di volo', h1: 'Cosa significa sognare di volare?', meaning: 'Volar simbolizza la libertà.' },
    pt: { title: 'Sonhar com voo', h1: 'O que significa sonhar com voo?', meaning: 'Voar simboliza liberdade.' },
    ru: { title: 'Сон о полёте', h1: 'Что значит сон о полёте?', meaning: 'Полёт символизирует свободу.' },
    zh: { title: '梦见飞行', h1: '梦见飞行是什么意思？', meaning: '飞行象征着自由。' },
    ja: { title: '飛行の夢', h1: '飛行の夢は何を意味する？', meaning: '飛行は自由を象徴する。' },
    ko: { title: '날기 꿈', h1: '날기 꿈은 무슨 의미일까?', meaning: '비행은 자유를 상징합니다.' },
    tr: { title: 'Uçma rüyası', h1: 'Uçmak ne demek?', meaning: 'Uçmak özgürlüğü sembolize eder.' },
    hi: { title: 'उड़ने का सपना', h1: 'सपने में उड़ने का क्या मतलब?', meaning: 'उड़ना स्वतंत्रता का प्रतीक है।' },
  },
  falling: {
    en: { title: 'Falling Dream Meaning', h1: 'What Does It Mean to Dream About Falling?', meaning: 'Falling represents loss of control, anxiety, or insecurity.' },
    ar: { title: 'تفسير حلم السقوط', h1: 'ما معنى رؤية السقوط؟', meaning: 'السقوط يرمز لفقدان السيطرة والقلق.' },
    es: { title: 'Soñar con caer', h1: '¿Qué significa soñar con caer?', meaning: 'Caer representa pérdida de control.' },
    fr: { title: 'Rêve de chute', h1: 'Que signifie rêver de chute?', meaning: 'La chute représente la perte de contrôle.' },
    de: { title: 'Falltraum', h1: 'Was bedeutut Falltraum?', meaning: 'Fallen symbolisiert Kontrollverlust.' },
    it: { title: 'Sogno di caduta', h1: 'Cosa significa sognare di cadere?', meaning: 'Caduta rappresenta perdita di controllo.' },
    pt: { title: 'Sonhar com queda', h1: 'O que significa sonhar com queda?', meaning: 'Queda representa perda de controle.' },
    ru: { title: 'Сон о падении', h1: 'Что значит сон о падении?', meaning: 'Падение символизирует потерю контроля.' },
    zh: { title: '梦见坠落', h1: '梦见坠落是什么意思？', meaning: '坠落代表失控。' },
    ja: { title: '落下の夢', h1: '落下の夢は何を意味する？', meaning: '落下は制御不能を表す。' },
    ko: { title: '떨어지기 꿈', h1: '떨어지기 꿈은 무슨 의미일까?', meaning: '떨어짐은 통제력을 나타냅니다.' },
    tr: { title: 'Düşme rüyası', h1: 'Düşmek ne demek?', meaning: 'Düşmek kontrol kaybıdır.' },
    hi: { title: 'गिरने का सपना', h1: 'सपने में गिरने का क्या मतलब?', meaning: 'गिरना नियंत्रण की हानि है।' },
  },
  teeth: {
    en: { title: 'Teeth Dream Meaning', h1: 'What Does It Mean to Dream About Teeth?', meaning: 'Teeth represent self-confidence, appearance, and communication.' },
    ar: { title: 'تفسير حلم الأسنان', h1: 'ما معنى رؤية الأسنان؟', meaning: 'الأسنان ترمز للثقة بالنفس والمظهر.' },
    es: { title: 'Soñar con dientes', h1: '¿Qué significa soñar con dientes?', meaning: 'Los dientes representan confianza.' },
    fr: { title: 'Rêve de dents', h1: 'Que signifie rêver de dents?', meaning: 'Les dents représentent la confiance.' },
    de: { title: 'Zahntraum', h1: 'Was bedeutut Zahntraum?', meaning: 'Zähne symbolisieren Vertrauen.' },
    it: { title: 'Sogno di denti', h1: 'Cosa significa sognare denti?', meaning: 'Denti rappresentano fiducia.' },
    pt: { title: 'Sonhar com dentes', h1: 'O que significa sonhar com dentes?', meaning: 'Dentes representam confiança.' },
    ru: { title: 'Сон о зубах', h1: 'Что значит сон о зубах?', meaning: 'Зубы символизируют уверенность.' },
    zh: { title: '梦见牙齿', h1: '梦见牙齿是什么意思？', meaning: '牙齿代表自信。' },
    ja: { title: '歯の夢', h1: '歯の夢は何を意味する？', meaning: '歯は自信を表す。' },
    ko: { title: '이빨 꿈', h1: '이빨 꿈은 무슨 의미일까?', meaning: '이는 자신감을 나타냅니다.' },
    tr: { title: 'Diş rüyası', h1: 'Diş görmek ne demek?', meaning: 'Dişler güveni temsil eder.' },
    hi: { title: 'दांत का सपना', h1: 'सपने में दांत का क्या मतलब?', meaning: 'दांत आत्मविश्वास का प्रतीक हैं।' },
  },
  death: {
    en: { title: 'Death Dream Meaning', h1: 'What Does It Mean to Dream About Death?', meaning: 'Death symbolizes transformation, endings, or closure of a life chapter.' },
    ar: { title: 'تفسير حلم الموت', h1: 'ما معنى رؤية الموت؟', meaning: 'الموت يرمز للتحول والنهايات.' },
    es: { title: 'Soñar con la muerte', h1: '¿Qué significa soñar con la muerte?', meaning: 'La muerte simboliza transformación.' },
    fr: { title: 'Rêve de mort', h1: 'Que signifie rêver de mort?', meaning: 'La mort symbolise la transformation.' },
    de: { title: 'Todesraum', h1: 'Was bedeutut Todesraum?', meaning: 'Tod symbolisiert Transformation.' },
    it: { title: 'Sogno di morte', h1: 'Cosa significa sognare la morte?', meaning: 'Morte rappresenta trasformazione.' },
    pt: { title: 'Sonhar com morte', h1: 'O que significa sonhar com morte?', meaning: 'Morte representa transformação.' },
    ru: { title: 'Сон о смерти', h1: 'Что значит сон о смерти?', meaning: 'Смерть символизирует трансформацию.' },
    zh: { title: '梦见死亡', h1: '梦见死亡是什么意思？', meaning: '死亡象征转变。' },
    ja: { title: '死の夢', h1: '死の夢は何を意味する？', meaning: '死は変容を象徴する。' },
    ko: { title: '죽음 꿈', h1: '죽음 꿈은 무슨 의미일까?', meaning: '죽음은 변신을 상징합니다.' },
    tr: { title: 'Ölüm rüyası', h1: 'Ölüm görmek ne demek?', meaning: 'Ölüm dönüşümdür.' },
    hi: { title: 'मृत्यु का सपना', h1: 'सपने में मौत का क्या मतलब?', meaning: 'मौत रूपांतरण का प्रतीक है।' },
  },
  house: {
    en: { title: 'House Dream Meaning', h1: 'What Does It Mean to Dream About a House?', meaning: 'Houses represent the self, your mind, and life circumstances.' },
    ar: { title: 'تفسير حلم البيت', h1: 'ما معنى رؤية البيت؟', meaning: 'البيوت ترمز للذات والعقل.' },
    es: { title: 'Soñar con casa', h1: '¿Qué significa soñar con casa?', meaning: 'Las casas representan el yo.' },
    fr: { title: 'Rêve de maison', h1: 'Que signifie rêver de maison?', meaning: 'Les maisons représentent le moi.' },
    de: { title: 'Hausstraum', h1: 'Was bedeutut Hausstraum?', meaning: 'Häuser symbolisieren das Ich.' },
    it: { title: 'Sogno di casa', h1: 'Cosa significa sognare casa?', meaning: 'Case rappresentano l\'io.' },
    pt: { title: 'Sonhar com casa', h1: 'O que significa sonhar com casa?', meaning: 'Casas representam o eu.' },
    ru: { title: 'Сон о доме', h1: 'Что значит сон о доме?', meaning: 'Дома символизируют личность.' },
    zh: { title: '梦见房子', h1: '梦见房子是什么意思？', meaning: '房子代表自我。' },
    ja: { title: '家の夢', h1: '家の夢は何を意味する？', meaning: '家は自己を表す。' },
    ko: { title: '집 꿈', h1: '집 꿈은 무슨 의미일까?', meaning: '집은 자아를 나타냅니다.' },
    tr: { title: 'Ev rüyası', h1: 'Ev görmek ne demek?', meaning: 'Ev benliği temsil eder.' },
    hi: { title: 'घर का सपना', h1: 'सपने में घर का क्या मतलब?', meaning: 'घर आत्मा का प्रतीक है।' },
  },
  fire: {
    en: { title: 'Fire Dream Meaning', h1: 'What Does It Mean to Dream About Fire?', meaning: 'Fire represents passion, anger, transformation, or destruction.' },
    ar: { title: 'تفسير حلم النار', h1: 'ما معنى رؤية النار؟', meaning: 'النار ترمز للعاطفة والغضب والتحول.' },
    es: { title: 'Soñar con fuego', h1: '¿Qué significa soñar con fuego?', meaning: 'El fuego simboliza pasión.' },
    fr: { title: 'Rêve de feu', h1: 'Que signifie rêver de feu?', meaning: 'Le feu symbolise la passion.' },
    de: { title: 'Feuertraum', h1: 'Was bedeutut Feuertraum?', meaning: 'Feuer symbolisiert Leidenschaft.' },
    it: { title: 'Sogno di fuoco', h1: 'Cosa significa sognare fuoco?', meaning: 'Fuoco rappresenta passione.' },
    pt: { title: 'Sonhar com fogo', h1: 'O que significa sonhar com fogo?', meaning: 'Fogo representa paixão.' },
    ru: { title: 'Сон о огне', h1: 'Что значит сон о огне?', meaning: 'Огонь символизирует страсть.' },
    zh: { title: '梦见火', h1: '梦见火是什么意思？', meaning: '火代表激情。' },
    ja: { title: '火の夢', h1: '火の夢は何を意味する？', meaning: '火は情熱を表す。' },
    ko: { title: '불 꿈', h1: '불 꿈은 무슨 의미일까?', meaning: '불은 열정을 나타냅니다.' },
    tr: { title: 'Ateş rüyası', h1: 'Ateş görmek ne demek?', meaning: 'Ateş tutkudur.' },
    hi: { title: 'आग का सपना', h1: 'सपने में आग का क्या मतलब?', meaning: 'आग जून का प्रतीक है।' },
  },
  dog: {
    en: { title: 'Dog Dream Meaning', h1: 'What Does It Mean to Dream About a Dog?', meaning: 'Dogs represent loyalty, friendship, protection, and intuition.' },
    ar: { title: 'تفسير حلم الكلب', h1: 'ما معنى رؤية الكلب؟', meaning: 'الكلاب ترمز للولاء والصداقة والحماية.' },
    es: { title: 'Soñar con perro', h1: '¿Qué significa soñar con perro?', meaning: 'Los perros representan lealtad.' },
    fr: { title: 'Rêve de chien', h1: 'Que signifie rêver de chien?', meaning: 'Les chiens représentent la loyauté.' },
    de: { title: 'Hundetraum', h1: 'Was bedeutut Hundetraum?', meaning: 'Hunde symbolisieren Treue.' },
    it: { title: 'Sogno di cane', h1: 'Cosa significa sognare cane?', meaning: 'Cani rappresentano lealtà.' },
    pt: { title: 'Sonhar com cachorro', h1: 'O que significa sonhar com cachorro?', meaning: 'Cachorros representam lealdade.' },
    ru: { title: 'Сон о собаке', h1: 'Что значит сон о собаке?', meaning: 'Собаки символизируют верность.' },
    zh: { title: '梦见狗', h1: '梦见狗是什么意思？', meaning: '狗代表忠诚。' },
    ja: { title: '犬の夢', h1: '犬の夢は何を意味する？', meaning: '犬は忠実を表す。' },
    ko: { title: '개 꿈', h1: '개 꿈은 무슨 의미일까?', meaning: '개는 충성을 나타냅니다.' },
    tr: { title: 'Köpek rüyası', h1: 'Köpek görmek ne demek?', meaning: 'Köpek sadakattir.' },
    hi: { title: 'कुत्ते का सपना', h1: 'सपने में कुत्ते का क्या मतलब?', meaning: 'कुत्ते वफादारी का प्रतीक हैं।' },
  },
  marriage: {
    en: { title: 'Marriage Dream Meaning', h1: 'What Does It Mean to Dream About Marriage?', meaning: 'Marriage represents union, commitment, and integration of different aspects of yourself.' },
    ar: { title: 'تفسير حلم الزواج', h1: 'ما معنى رؤية الزواج؟', meaning: 'الزواج يرمز للاتحاد والالتزام.' },
    es: { title: 'Soñar con matrimonio', h1: '¿Qué significa soñar con matrimonio?', meaning: 'El matrimonio simboliza unión.' },
    fr: { title: 'Rêve de mariage', h1: 'Que signifie rêver de mariage?', meaning: 'Le mariage symbolise l\'union.' },
    de: { title: 'Ehetraum', h1: 'Was bedeutut Ehetraum?', meaning: 'Ehe symbolisiert Einheit.' },
    it: { title: 'Sogno di matrimonio', h1: 'Cosa significa sognare matrimonio?', meaning: 'Matrimonio rappresenta unione.' },
    pt: { title: 'Sonhar com casamento', h1: 'O que significa sonhar com casamento?', meaning: 'Casamento representa união.' },
    ru: { title: 'Сон о свадьбе', h1: 'Что значит сон о свадьбе?', meaning: 'Свадьба символизирует союз.' },
    zh: { title: '梦见结婚', h1: '梦见结婚是什么意思？', meaning: '结婚代表联合。' },
    ja: { title: '結婚の夢', h1: '結婚の夢は何を意味する？', meaning: '結婚は統合を表す。' },
    ko: { title: '결혼 꿈', h1: '결혼 꿈은 무슨 의미일까?', meaning: '결혼은 통합을 나타냅니다.' },
    tr: { title: 'Evlilik rüyası', h1: 'Evlilik görmek ne demek?', meaning: 'Evlilik birlikteliktir.' },
    hi: { title: 'शादी का सपना', h1: 'सपने में शादी का क्या मतलब?', meaning: 'शादी एकता का प्रतीक है।' },
  },
};

const BASE = 'https://dream-interpreter-alpha-ruddy.vercel.app';

function generatePage(symbolKey, lang) {
  const sym = SYMBOLS[symbolKey];
  if (!sym || !sym[lang]) return null;
  const data = sym[lang];
  const langInfo = LANGS[lang];

  let hreflang = '';
  let langLinks = '';
  for (const l of Object.keys(LANGS)) {
    if (sym[l]) {
      hreflang += '  <link rel="alternate" hreflang="' + l + '" href="' + BASE + '/seo/' + symbolKey + '/' + l + '">\n';
      langLinks += '    <a href="/seo/' + symbolKey + '/' + l + '">' + LANGS[l].name + '</a>\n';
    }
  }

  const html = `<!DOCTYPE html>
<html lang="' + lang + '" dir="' + langInfo.dir + '">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>' + data.title + ' | Dream Interpreter</title>
  <meta name="description" content="' + data.h1 + ' Free AI-powered dream interpretation.'>
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="' + BASE + '/seo/' + symbolKey + '/' + lang + '">
  ' + hreflang + '
  <meta property="og:title" content="' + data.title + '">
  <meta property="og:description" content="' + data.h1 + '">
  <meta property="og:type" content="article">
  <meta property="og:url" content="' + BASE + '/seo/' + symbolKey + '/' + lang + '">
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "' + data.title + '",
    "description": "' + data.h1 + '",
    "author": {"@type": "Organization", "name": "Dream Interpreter"},
    "datePublished": "2024-01-01",
    "dateModified": "2024-12-01"
  }
  </script>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f0f1a; color: #e0e0e0; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 2.2rem; margin-bottom: 1rem; background: linear-gradient(135deg, #667eea, #764ba2); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    h2 { font-size: 1.4rem; margin: 2rem 0 1rem; color: #a78bfa; }
    p { margin-bottom: 1rem; color: #b0b0c0; }
    .card { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 12px; padding: 24px; margin: 20px 0; }
    .cta { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 10px; }
    .lang-switch { text-align: center; margin: 30px 0; padding: 15px; background: #1a1a2e; border-radius: 8px; }
    .lang-switch a { color: #a78bfa; text-decoration: none; margin: 0 8px; font-size: 0.9rem; }
    footer { text-align: center; padding: 40px 20px; color: #666; border-top: 1px solid #2a2a4a; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>' + data.h1 + '</h1>
    <p>' + data.meaning + '</p>
    <div class="card">
      <h2>Dream Interpretation</h2>
      <p>' + data.meaning + ' This interpretation combines ancient wisdom (Ibn Sirin) with modern psychology.</p>
    </div>
    <div class="card">
      <h2>Islamic Tradition</h2>
      <p>In Islamic tradition (Ibn Sirin), dreams are seen as messages from the soul. Reflect on what your heart is telling you.</p>
    </div>
    <div class="card" style="text-align: center;">
      <h2>Interpret Your Dreams with AI</h2>
      <p>Share your dream and get a personalized AI interpretation</p>
      <a href="/" class="cta">Try Dream Interpreter</a>
    </div>
    <div class="lang-switch">
      <strong>Other languages:</strong><br>
      ' + langLinks + '
    </div>
    <footer>
      <p>&copy; 2024 Dream Interpreter. All rights reserved.</p>
    </footer>
  </div>
</body>
</html>';

  return html;
}

// Generate all pages
const outputDir = path.join(__dirname, '..', 'dist', 'seo');
fs.mkdirSync(outputDir, { recursive: true });

let pageCount = 0;
const pages = [];

for (const symbolKey of Object.keys(SYMBOLS)) {
  for (const lang of Object.keys(LANGS)) {
    const html = generatePage(symbolKey, lang);
    if (!html) continue;

    const dir = path.join(outputDir, symbolKey);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, lang + '.html'), html, 'utf8');
    pages.push('/seo/' + symbolKey + '/' + lang);
    pageCount++;
  }
}

// Sitemap
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>' + BASE + '/</loc>\n    <lastmod>2024-12-01</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n' + pages.map(function(p) { return '  <url>\n    <loc>' + BASE + p + '</loc>\n    <lastmod>2024-12-01</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>'; }).join('\n') + '\n</urlset>';

fs.writeFileSync(path.join(outputDir, '..', 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(outputDir, '..', 'robots.txt'), 'User-agent: *\nAllow: /\n\nSitemap: ' + BASE + '/sitemap.xml', 'utf8');

console.log('Generated ' + pageCount + ' SEO pages');
console.log('Sitemap: ' + (pages.length + 1) + ' URLs');
