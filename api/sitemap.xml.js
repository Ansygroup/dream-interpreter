import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const p = path.join(process.cwd(), 'dist', 'sitemap.xml');
    const xml = fs.readFileSync(p, 'utf8');
    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (e) {
    res.status(500).send('sitemap error');
  }
}
