// Serves the IndexNow key file (required by IndexNow Option 1).
// Any /<anything>.txt request is routed here by vercel.json; the body is the key.
// Get a free key at https://www.indexnow.org, then set INDEXNOW_KEY env in Vercel.
export default function handler(req, res) {
  const key = process.env.INDEXNOW_KEY;
  if (!key) {
    res.status(500).send('INDEXNOW_KEY env not set');
    return;
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send(key);
}
