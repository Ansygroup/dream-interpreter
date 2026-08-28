import type { VercelRequest, VercelResponse } from '@vercel/node';

// Edge-friendly geo detection. On Vercel, the platform injects
// x-vercel-ip-country / cf-ipcountry headers at the edge.
export default function handler(req: VercelRequest, res: VercelResponse) {
  const country =
    (req.headers['x-vercel-ip-country'] as string) ||
    (req.headers['cf-ipcountry'] as string) ||
    (req.headers['x-vercel-ip-country-region'] as string) ||
    'US';

  const langMap: Record<string, string> = {
    SA: 'ar', AE: 'ar', EG: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', IQ: 'ar', JO: 'ar',
    SY: 'ar', LB: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar', YE: 'ar', PS: 'ar',
    ES: 'es', MX: 'es', AR: 'es', CO: 'es', CL: 'es', PE: 'es', VE: 'es', EC: 'es',
    FR: 'fr', CA: 'fr', BE: 'fr', CH: 'fr', LU: 'fr',
    DE: 'de', AT: 'de', LI: 'de',
    IT: 'it', BR: 'pt', PT: 'pt', RU: 'ru', CN: 'zh', TW: 'zh', HK: 'zh',
    JP: 'ja', KR: 'ko', TR: 'tr', IN: 'hi', NL: 'nl', PL: 'pl', SE: 'sv',
    DK: 'da', NO: 'no', FI: 'fi', IL: 'he', TH: 'th', VN: 'vi', ID: 'id',
    MY: 'ms', GR: 'el', CZ: 'cs', HU: 'hu', RO: 'ro', SK: 'sk', UA: 'uk',
    BG: 'bg', HR: 'hr', LT: 'lt', LV: 'lv', EE: 'et', SI: 'sl',
  };

  const lang = langMap[country] || 'en';
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).json({ country, language: lang });
}
