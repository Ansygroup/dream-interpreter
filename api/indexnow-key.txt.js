// Serves the IndexNow key file at /API_KEY.txt (required by IndexNow protocol).
// Get a free key at https://www.indexnow.org, then set INDEXNOW_KEY env in Vercel.
export default function handler(req, res) {
  const key = process.env.INDEXNOW_KEY || 'REPLACE-WITH-YOUR-INDEXNOW-KEY';
  res.setHeader('Content-Type', 'text/plain');
  res.status(200).send(key);
}
