import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useReveal } from '../hooks/useReveal';

const CONTENT: Record<string, Record<string, { title: string; h1: string; meaning: string }>> = {
  snake: {
    en: { title: 'Snake Dream Meaning', h1: 'What Does It Mean to Dream About Snakes?', meaning: 'Snakes represent transformation, hidden fears, or wisdom. Consider what is changing in your life.' },
    ar: { title: 'تفسير حلم الثعبان', h1: 'ما معنى رؤية الثعبان في الحلم؟', meaning: 'الأفاعي ترمز للتحول والمخاوف المخفية والحكمة.' },
    es: { title: 'Soñar con serpientes', h1: '¿Qué significa soñar con serpientes?', meaning: 'Las serpientes representan transformación y sabiduría.' },
    fr: { title: 'Rêve de serpent', h1: 'Que signifie rêver de serpents?', meaning: 'Les serpents représentent la transformation.' },
    de: { title: 'Schlangentraum', h1: 'Was bedeutet Schlangentraum?', meaning: 'Schlangen symbolisieren Transformation.' },
    zh: { title: '梦见蛇的含义', h1: '梦见蛇是什么意思？', meaning: '蛇代表转变和智慧。' },
    ja: { title: '蛇の夢の意味', h1: '蛇の夢は何を意味する？', meaning: '蛇は変容を表す。' },
    ko: { title: '뱀 꿈 해몽', h1: '뱀 꿈은 무슨 의미일까?', meaning: '뱀은 변신을 나타냅니다.' },
    tr: { title: 'Yılan rüyası', h1: 'Yılan görmek ne anlama gelir?', meaning: 'Yılanlar dönüşüm sembolize eder.' },
    pt: { title: 'Sonhar com cobras', h1: 'O que significa sonhar com cobras?', meaning: 'Cobras representam transformação.' },
    ru: { title: 'Сон о змее', h1: 'Что значит сон о змее?', meaning: 'Змеи символизируют трансформацию.' },
    hi: { title: 'साँप के सपने', h1: 'सपने में साँप का क्या मतलब?', meaning: 'साँप रूपांतरण का प्रतीक हैं।' },
  },
  water: {
    en: { title: 'Water Dream Meaning', h1: 'What Does It Mean to Dream About Water?', meaning: 'Water represents emotions, the subconscious, and purification.' },
    ar: { title: 'تفسير حلم الماء', h1: 'ما معنى رؤية الماء في الحلم؟', meaning: 'الماء يرمز للعواطف والعقل الباطن والتطهير.' },
    es: { title: 'Soñar con agua', h1: '¿Qué significa soñar con agua?', meaning: 'El agua representa emociones.' },
    fr: { title: 'Rêve d\'eau', h1: 'Que significa rêver d\'eau?', meaning: 'L\'eau représente les émotions.' },
    de: { title: 'Wassertraum', h1: 'Was bedeutet Wassertraum?', meaning: 'Wasser symbolisiert Emotionen.' },
    zh: { title: '梦见水', h1: '梦见水是什么意思？', meaning: '水代表情感。' },
    ja: { title: '水の夢', h1: '水の夢は何を意味する？', meaning: '水は感情を表す。' },
    ko: { title: '물 꿈', h1: '물 꿈은 무슨 의미일까?', meaning: '물은 감정을 나타냅니다.' },
    tr: { title: 'Su rüyası', h1: 'Su görmek ne demek?', meaning: 'Su duyguları temsil eder.' },
    pt: { title: 'Sonhar com água', h1: 'O que significa sonhar com água?', meaning: 'A água represents emoções.' },
    ru: { title: 'Сон о воде', h1: 'Что значит сон о воде?', meaning: 'Вода символизирует эмоции.' },
    hi: { title: 'पानी का सपना', h1: 'पानी का सपना क्या मतलब?', meaning: 'पानी भावनाओं का प्रतिनिधित्व करता है।' },
  },
  flying: {
    en: { title: 'Flying Dream Meaning', h1: 'What Does It Mean to Dream About Flying?', meaning: 'Flying symbolizes freedom, ambition, and transcendence.' },
    ar: { title: 'تفسير حلم الطيران', h1: 'ما معنى رؤية الطيران؟', meaning: 'الطيران يرمز للحرية والطموح.' },
    es: { title: 'Soñar con volar', h1: '¿Qué significa soñar con volar?', meaning: 'Volar simboliza libertad.' },
    fr: { title: 'Rêve de voler', h1: 'Que significa rêver de voler?', meaning: 'Voler symbolise la liberté.' },
    de: { title: 'Fliegentraum', h1: 'Was bedeutet Fliegentraum?', meaning: 'Fliegen symbolisiert Freiheit.' },
    zh: { title: '梦见飞行', h1: '梦见飞行是什么意思？', meaning: '飞行象征自由。' },
    ja: { title: '飛行の夢', h1: '飛行の夢は何を意味する？', meaning: '飛行は自由を象徴する。' },
    ko: { title: '날기 꿈', h1: '날기 꿈은 무슨 의미일까?', meaning: '비행은 자유를 상징합니다.' },
    tr: { title: 'Uçma rüyası', h1: 'Uçmak ne demek?', meaning: 'Uçmak özgürlüğü sembolize eder.' },
    pt: { title: 'Sonhar com voo', h1: 'O que significa sonhar com voo?', meaning: 'Voar simboliza liberdade.' },
    ru: { title: 'Сон о полёте', h1: 'Что значит сон о полёте?', meaning: 'Полёт символизирует свободу.' },
    hi: { title: 'उड़ने का सपना', h1: 'सपने में उड़ने का क्या मतलब?', meaning: 'उड़ना स्वतंत्रता का प्रतीक है।' },
  },
  falling: {
    en: { title: 'Falling Dream Meaning', h1: 'What Does It Mean to Dream About Falling?', meaning: 'Falling represents loss of control, anxiety, or insecurity.' },
    ar: { title: 'تفسير حلم السقوط', h1: 'ما معنى رؤية السقوط؟', meaning: 'السقوط يرمز لفقدان السيطرة والقلق.' },
    es: { title: 'Soñar con caer', h1: '¿Qué significa soñar con caer?', meaning: 'Caer represents pérdida de control.' },
    fr: { title: 'Rêve de chute', h1: 'Que significa rêver de chute?', meaning: 'La chute représente la perte de contrôle.' },
    de: { title: 'Falltraum', h1: 'Was bedeutet Falltraum?', meaning: 'Fallen symbolisiert Kontrollverlust.' },
    zh: { title: '梦见坠落', h1: '梦见坠落是什么意思？', meaning: '坠落代表失控。' },
    ja: { title: '落下の夢', h1: '落下の夢は何を意味する？', meaning: '落下は制御不能を表す。' },
    ko: { title: '떨어지기 꿈', h1: '떨어지기 꿈은 무슨 의미일까?', meaning: '떨어짐은 통제력을 나타냅니다.' },
    tr: { title: 'Düşme rüyası', h1: 'Düşmek ne demek?', meaning: 'Düşmek kontrol kaybıdır.' },
    pt: { title: 'Sonhar com queda', h1: 'O que significa sonhar com queda?', meaning: 'Queda represents perda de controle.' },
    ru: { title: 'Сон о падении', h1: 'Что значит сон о падении?', meaning: 'Падение символизирует потерю контроля.' },
    hi: { title: 'गिरने का सपना', h1: 'सपने में गिरने का क्या मतलब?', meaning: 'गिरना नियंत्रण की हानि है।' },
  },
  teeth: {
    en: { title: 'Teeth Dream Meaning', h1: 'What Does It Mean to Dream About Teeth?', meaning: 'Teeth represent self-confidence, appearance, and communication.' },
    ar: { title: 'تفسير حلم الأسنان', h1: 'ما معنى رؤية الأسنان؟', meaning: 'الأسنان ترمز للثقة بالنفس والمظهر.' },
    es: { title: 'Soñar con dientes', h1: '¿Qué significa soñar con dientes?', meaning: 'Los dientes representan confianza.' },
    fr: { title: 'Rêve de dents', h1: 'Que signifie rêver de dents?', meaning: 'Les dents représentent la confiance.' },
    de: { title: 'Zahntraum', h1: 'Was bedeutet Zahntraum?', meaning: 'Zähne symbolisieren Vertrauen.' },
    zh: { title: '梦见牙齿', h1: '梦见牙齿是什么意思？', meaning: '牙齿代表自信。' },
    ja: { title: '歯の夢', h1: '歯の夢は何を意味する？', meaning: '歯は自信を表す。' },
    ko: { title: '이빨 꿈', h1: '이빨 꿈은 무슨 의미일까?', meaning: '이는 자신감을 나타냅니다.' },
    tr: { title: 'Diş rüyası', h1: 'Diş görmek ne demek?', meaning: 'Dişler güveni temsil eder.' },
    pt: { title: 'Sonhar com dentes', h1: 'O que significa sonhar com dentes?', meaning: 'Dentes representam confiança.' },
    ru: { title: 'Сон о зубах', h1: 'Что значит сон о зубах?', meaning: 'Зубы символизируют уверенность.' },
    hi: { title: 'दांत का सपना', h1: 'सपने में दांत का क्या मतलब?', meaning: 'दांत आत्मविश्वास का प्रतीक हैं।' },
  },
  death: {
    en: { title: 'Death Dream Meaning', h1: 'What Does It Mean to Dream About Death?', meaning: 'Death symbolizes transformation, endings, or closure of a life chapter.' },
    ar: { title: 'تفسير حلم الموت', h1: 'ما معنى رؤية الموت؟', meaning: 'الموت يرمز للتحول والنهايات.' },
    es: { title: 'Soñar con la muerte', h1: '¿Qué significa soñar con la muerte?', meaning: 'La muerte simboliza transformación.' },
    fr: { title: 'Rêve de mort', h1: 'Que significa rêver de mort?', meaning: 'La mort symbolise la transformation.' },
    de: { title: 'Todestraum', h1: 'Was bedeutet Todestraum?', meaning: 'Tod symbolisiert Transformation.' },
    zh: { title: '梦见死亡', h1: '梦见死亡是什么意思？', meaning: '死亡象征转变。' },
    ja: { title: '死の夢', h1: '死の夢は何を意味する？', meaning: '死は変容を象徴する。' },
    ko: { title: '죽음 꿈', h1: '죽음 꿈은 무슨 의미일까?', meaning: '죽음은 변신을 상징합니다.' },
    tr: { title: 'Ölüm rüyası', h1: 'Ölüm görmek ne demek?', meaning: 'Ölüm dönüşümdür.' },
    pt: { title: 'Sonhar com morte', h1: 'O que significa sonhar com morte?', meaning: 'Morte represents transformação.' },
    ru: { title: 'Сон о смерти', h1: 'Что значит сон о смерти?', meaning: 'Смерть символизирует трансформацию.' },
    hi: { title: 'मृत्यु का सपना', h1: 'सपने में मौत का क्या मतलब?', meaning: 'मौत रूपांतरण का प्रतीक है।' },
  },
  house: {
    en: { title: 'House Dream Meaning', h1: 'What Does It Mean to Dream About a House?', meaning: 'Houses represent the self, your mind, and life circumstances.' },
    ar: { title: 'تفسير حلم البيت', h1: 'ما معنى رؤية البيت؟', meaning: 'البيوت ترمز للذات والعقل.' },
    es: { title: 'Soñar con casa', h1: '¿Qué significa soñar con casa?', meaning: 'Las casas representan el yo.' },
    fr: { title: 'Rêve de maison', h1: 'Que signifie rêver de maison?', meaning: 'Les maisons représentent le moi.' },
    de: { title: 'Hausstraum', h1: 'Was bedeutet Hausstraum?', meaning: 'Häuser symbolisieren das Ich.' },
    zh: { title: '梦见房子', h1: '梦见房子是什么意思？', meaning: '房子代表自我。' },
    ja: { title: '家の夢', h1: '家の夢は何を意味する？', meaning: '家は自己を表す。' },
    ko: { title: '집 꿈', h1: '집 꿈은 무슨 의미일까?', meaning: '집은 자아를 나타냅니다.' },
    tr: { title: 'Ev rüyası', h1: 'Ev görmek ne demek?', meaning: 'Ev benliği temsil eder.' },
    pt: { title: 'Sonhar com casa', h1: 'O que significa sonhar com casa?', meaning: 'Casas representam o eu.' },
    ru: { title: 'Сон о доме', h1: 'Что значит сон о доме?', meaning: 'Дома символизируют личность.' },
    hi: { title: 'घर का सपना', h1: 'सपने में घर का क्या मतलब?', meaning: 'घर आत्मा का प्रतीक है।' },
  },
  fire: {
    en: { title: 'Fire Dream Meaning', h1: 'What Does It Mean to Dream About Fire?', meaning: 'Fire represents passion, anger, transformation, or destruction.' },
    ar: { title: 'تفسير حلم النار', h1: 'ما معنى رؤية النار؟', meaning: 'النار ترمز للعاطفة والغضب والتحول.' },
    es: { title: 'Soñar con fuego', h1: '¿Qué significa soñar con fuego?', meaning: 'El fuego simboliza pasión.' },
    fr: { title: 'Rêve de feu', h1: 'Que significa rêver de feu?', meaning: 'Le feu symbolise la passion.' },
    de: { title: 'Feuertraum', h1: 'Was bedeutet Feuertraum?', meaning: 'Feuer symbolisiert Leidenschaft.' },
    zh: { title: '梦见火', h1: '梦见火是什么意思？', meaning: '火代表激情。' },
    ja: { title: '火の夢', h1: '火の夢は何を意味する？', meaning: '火は情熱を表す。' },
    ko: { title: '불 꿈', h1: '불 꿈은 무슨 의미일까?', meaning: '불은 열정을 나타냅니다.' },
    tr: { title: 'Ateş rüyası', h1: 'Ateş görmek ne demek?', meaning: 'Ateş tutkudır.' },
    pt: { title: 'Sonhar com fogo', h1: 'O que significa sonhar com fogo?', meaning: 'Fogo represents paixão.' },
    ru: { title: 'Сон о огне', h1: 'Что значит сон о огне?', meaning: 'Огонь символизирует страсть.' },
    hi: { title: 'आग का सपना', h1: 'सपने में आग का क्या मतलब?', meaning: 'आग जून का प्रतीक है।' },
  },
  dog: {
    en: { title: 'Dog Dream Meaning', h1: 'What Does It Mean to Dream About a Dog?', meaning: 'Dogs represent loyalty, friendship, protection, and intuition.' },
    ar: { title: 'تفسير حلم الكلب', h1: 'ما معنى رؤية الكلب؟', meaning: 'الكلاب ترمز للولاء والصداقة والحماية.' },
    es: { title: 'Soñar con perro', h1: '¿Qué significa soñar con perro?', meaning: 'Los perros representan lealtad.' },
    fr: { title: 'Rêve de chien', h1: 'Que signifie rêver de chien?', meaning: 'Les chiens représentent la loyauté.' },
    de: { title: 'Hundetraum', h1: 'Was bedeutet Hundetraum?', meaning: 'Hunde symbolisieren Treue.' },
    zh: { title: '梦见狗', h1: '梦见狗是什么意思？', meaning: '狗代表忠诚。' },
    ja: { title: '犬の夢', h1: '犬の夢は何を意味する？', meaning: '犬は忠実を表す。' },
    ko: { title: '개 꿈', h1: '개 꿈은 무슨 의미일까?', meaning: '개는 충성을 나타냅니다.' },
    tr: { title: 'Köpek rüyası', h1: 'Köpek görmek ne demek?', meaning: 'Köpek sadakattır.' },
    pt: { title: 'Sonhar com cachorro', h1: 'O que significa sonhar com cachorro?', meaning: 'Cachorros representam lealdade.' },
    ru: { title: 'Сон о собаке', h1: 'Что значит сон о собаке?', meaning: 'Собаки символизируют верность.' },
    hi: { title: 'कुत्ते का सपना', h1: 'सपने में कुत्ते का क्या मतलब?', meaning: 'कुत्ते वफादारी का प्रतीक हैं।' },
  },
  marriage: {
    en: { title: 'Marriage Dream Meaning', h1: 'What Does It Mean to Dream About Marriage?', meaning: 'Marriage represents union, commitment, and integration of different aspects of yourself.' },
    ar: { title: 'تفسير حلم الزواج', h1: 'ما معنى رؤية الزواج؟', meaning: 'الزواج يرمز للاتحاد والالتزام.' },
    es: { title: 'Soñar con matrimonio', h1: '¿Qué significa soñar con matrimonio?', meaning: 'El matrimonio simboliza unión.' },
    fr: { title: 'Rêve de mariage', h1: 'Que signifie rêver de mariage?', meaning: 'Le mariage symbolise l\'union.' },
    de: { title: 'Ehetraum', h1: 'Was bedeutet Ehetraum?', meaning: 'Ehe symbolisiert Einheit.' },
    zh: { title: '梦见结婚', h1: '梦见结婚是什么意思？', meaning: '结婚代表联合。' },
    ja: { title: '結婚の夢', h1: '結婚の夢は何を意味する？', meaning: '結婚は統合を表す。' },
    ko: { title: '결혼 꿈', h1: '결혼 꿈은 무슨 의미일까?', meaning: '결혼은 통합을 나타냅니다.' },
    tr: { title: 'Evlilik rüyası', h1: 'Evlilik görmek ne demek?', meaning: 'Evlilik birlikteliktir.' },
    pt: { title: 'Sonhar com casamento', h1: 'O que significa sonhar com casamento?', meaning: 'Casamento represents união.' },
    ru: { title: 'Сон о свадьбе', h1: 'Что значит сон о свадьбе?', meaning: 'Свадьба символизирует союз.' },
    hi: { title: 'शादी का सपना', h1: 'सपने में शादी का क्या मतलब?', meaning: 'शादी एकता का प्रतीक है।' },
  },
};

const LANG_NAMES: Record<string, string> = {
  en: 'English', ar: 'العربية', es: 'Español', fr: 'Français', de: 'Deutsch',
  zh: '中文', ja: '日本語', ko: '한국어', tr: 'Türkçe', pt: 'Português',
  ru: 'Русский', hi: 'हिंदी',
};

export default function SEOPage() {
  const { symbol, lang } = useParams<{ symbol: string; lang: string }>();
  const { language } = useI18n();
  const ref = useReveal<HTMLDivElement>();

  const content = symbol && lang ? CONTENT[symbol]?.[lang] : null;
  const currentLang = lang || language;

  useEffect(() => {
    if (!content || !symbol || !lang) return;
    document.title = content.title + ' | Dreamscope';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', content.h1 + ' Free AI-powered dream interpretation.');
  }, [content, symbol, lang]);

  if (!content) {
    return (
      <>
        <div className="ambient" />
        <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24 }}>
        <div>
          <span className="eyebrow">404</span>
          <h1 className="display serif" style={{ marginBottom: 14 }}>No such symbol</h1>
          <p className="lede" style={{ margin: '0 auto 28px' }}>This dream symbol page doesn't exist.</p>
          <Link to="/" className="btn btn-primary">Back to Home</Link>
        </div>
      </div>
      </>
    );
  }

  const allSymbols = Object.keys(CONTENT);
  const allLangs = Object.keys(LANG_NAMES);

  return (
    <>
      <div className="ambient" />
      <div ref={ref}>
      {/* Nav */}
      <header style={{ position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(12px)', background: 'rgba(10,12,11,0.72)', borderBottom: '1px solid var(--border-soft)' }}>
        <nav className="container" style={{ height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--accent-glow)', border: '1px solid var(--accent-line)', display: 'grid', placeItems: 'center' }}>
              <svg className="icon" viewBox="0 0 24 24" style={{ width: 15, height: 15, color: 'var(--accent)' }}><path d="M12 3a6 6 0 0 0 0 12 4 4 0 0 1 0 6" /><path d="M12 3a6 6 0 0 1 0 12" /></svg>
            </span>
            <span className="serif" style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)' }}>Dreamscope</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            <Link to="/interpret" className="navlink">Interpret</Link>
            <Link to="/history" className="navlink">History</Link>
            <Link to="/saved" className="navlink">Saved</Link>
          </div>
        </nav>
      </header>

      <main className="section" style={{ position: 'relative', zIndex: 1, paddingTop: 'clamp(48px, 7vw, 80px)' }}>
        <div className="container-narrow">
        <div className="reveal" style={{ marginBottom: 48 }}>
          <div className="eyebrow">Dream Symbol</div>
          <h1 className="h2 serif" style={{ marginBottom: 16 }}>
            {content.h1}
          </h1>
          <p className="lede">
            {content.meaning}
          </p>
        </div>

        {/* AdSense */}
        <div className="reveal" style={{ margin: '32px 0', padding: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', textAlign: 'center' }}>
          <ins className="adsbygoogle" style={{ display: 'block' }} data-ad-client="ca-pub-3423159322001021" data-ad-slot="auto" data-ad-format="auto" data-full-width-responsive="true"></ins>
        </div>

        <div className="space-y-6">
          <div className="card reveal">
            <h2 className="h3 serif" style={{ color: 'var(--accent)', marginBottom: 12 }}>Dream Interpretation</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>{content.meaning} This interpretation combines ancient wisdom (Ibn Sirin) with modern psychology to give you a comprehensive understanding of your dream.</p>
          </div>

          <div className="card reveal">
            <h2 className="h3 serif" style={{ color: 'var(--accent)', marginBottom: 12 }}>Islamic Tradition</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.8 }}>In Islamic tradition, dreams are seen as messages from the soul. The interpretation depends on the dreamer's circumstances, the emotions felt, and the overall context of the dream.</p>
          </div>

          <div className="card reveal" style={{ textAlign: 'center', borderColor: 'var(--accent-line)', background: 'var(--accent-glow)' }}>
            <h2 className="h3 serif" style={{ color: 'var(--accent)', marginBottom: 12 }}>Interpret Your Dreams with AI</h2>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Share your dream and get a personalized AI interpretation</p>
            <Link to="/interpret" className="btn btn-primary">Try Dreamscope</Link>
          </div>

          <div className="card reveal">
            <h3 className="h3 serif" style={{ color: 'var(--accent)', marginBottom: 12 }}>Other Languages</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allLangs.filter(l => CONTENT[symbol!]?.[l]).map(l => (
                <a key={l} href={`/seo/${symbol}/${l}`} className="tag" style={{ textDecoration: 'none' }}>
                  {LANG_NAMES[l]}
                </a>
              ))}
            </div>
          </div>

          <div className="card reveal">
            <h3 className="h3 serif" style={{ color: 'var(--accent)', marginBottom: 12 }}>Other Dream Symbols</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {allSymbols.filter(s => s !== symbol).map(s => (
                <a key={s} href={`/seo/${s}/${currentLang}`} className="tag" style={{ textDecoration: 'none', textTransform: 'capitalize' }}>
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
        </div>
      </main>

      <footer className="section-line" style={{ padding: '40px 0' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <span className="serif" style={{ fontSize: 18, color: 'var(--text-dim)' }}>Dreamscope</span>
          <Link to="/" className="navlink">Home</Link>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>© 2024 Dreamscope</span>
        </div>
      </footer>
      </div>
    </>
  );
}
