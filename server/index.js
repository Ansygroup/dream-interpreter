import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

const dreams = [];

app.post('/api/interpret', async (req, res) => {
  try {
    const { dream, language } = req.body;
    if (!dream || !language) {
      return res.status(400).json({ error: 'Dream and language are required' });
    }
    const interpretations = {
      en: `This dream about "${dream}" suggests you are processing deep emotions or undergoing transformation. The symbols in your dream point to inner growth and self-discovery. Consider what aspects of your life are currently changing or need attention.`,
      ar: `هذا الحلم حول "${dream}" يشير إلى أنك تعالج عواطف عميقة أو تمر بعملية تحول. الرموز في حلمك تشير إلى نمو داخلي واكتشاف للنفس. فكر في جوانب حياتك التي تتغير حاليًا أو تحتاج إلى اهتمام.`,
      es: `Este sueño sobre "${dream}" sugiere que estás procesando emociones profundas o experimentando una transformación. Los símbolos en tu sueño apuntan al crecimiento interno y el autodescubrimiento. Considera qué aspectos de tu vida están cambiando actualmente o necesitan atención.`,
      fr: `Ce rêve sur "${dream}" suggère que vous traitez des émotions profondes ou que vous subissez une transformation. Les symboles de votre rêve indiquent une croissance intérieure et une découverte de soi. Réfléchissez aux aspects de votre vie qui changent actuellement ou qui nécessitent de l'attention.`,
      de: `Dieser Traum über "${dream}" deutet darauf hin, dass Sie tiefe Emotionen verarbeiten oder eine Transformation durchmachen. Die Symbole in Ihrem Traum weisen auf inneres Wachstum und Selbstfindung hin. Überlegen Sie, welche Aspekte Ihres Lebens sich derzeit ändern oder Aufmerksamkeit erfordern.`
    };
    const interpretation = interpretations[language] || interpretations.en;
    const dreamEntry = {
      id: Date.now().toString(),
      dream,
      language,
      interpretation,
      timestamp: new Date().toISOString()
    };
    dreams.push(dreamEntry);
    if (dreams.length > 100) dreams.shift();
    res.json({ interpretation, id: dreamEntry.id });
  } catch (error) {
    console.error('Error in dream interpretation:', error);
    res.status(500).json({ error: 'Failed to interpret dream. Please try again.' });
  }
});

app.get('/api/history', (req, res) => {
  res.json({ dreams: dreams.slice(-20).reverse() });
});

app.post('/api/save', (req, res) => {
  const { id } = req.body;
  const dream = dreams.find(d => d.id === id);
  if (dream) {
    dream.saved = true;
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Dream not found' });
  }
});

app.get('/api/saved', (req, res) => {
  const saved = dreams.filter(d => d.saved).reverse();
  res.json({ dreams: saved });
});

app.use(express.static(join(__dirname, '..', 'dist')));

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});