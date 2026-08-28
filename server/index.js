require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// In-memory storage for dreams (in production, use a database)
const dreams = [];

// OpenRouter API key
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Language names for display
const LANGUAGES = {
  en: 'English',
  ar: 'العربية',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  tr: 'Türkçe',
  nl: 'Nederlands',
  pl: 'Polski',
  sv: 'Svenska',
  da: 'Dansk',
  no: 'Norsk',
  fi: 'Suomi',
  he: 'עברית',
  hi: 'हिंदी',
  th: 'ไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  ms: 'Bahasa Melayu',
  el: 'Ελληνικά',
  cs: 'Čeština',
  hu: 'Magyar',
  ro: 'Română',
  sk: 'Slovenčina',
  uk: 'Українська',
  bg: 'Български',
  hr: 'Hrvatski',
  lt: 'Lietuvių',
  lv: 'Latviešu',
  et: 'Eesti',
  sl: 'Slovenščina'
};

// Dream interpretation endpoint
app.post('/api/interpret', async (req, res) => {
  try {
    const { dream, language } = req.body;
    
    if (!dream || !language) {
      return res.status(400).json({ error: 'Dream and language are required' });
    }
    
    // Check if we have the API key
    if (!OPENROUTER_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured' });
    }
    
    // Prepare the prompt for dream interpretation
    const systemPrompt = `You are an expert dream interpreter with knowledge of ancient dream meanings (like Ibn Sirin) and modern psychology. Provide a thoughtful, insightful interpretation of the dream in ${LANGUAGES[language] || language}. Be compassionate and helpful. If the dream is unclear, ask for more details. Provide both symbolic meaning and practical life advice.`;
    
    const userPrompt = `Dream: "${dream}"\n\nPlease interpret this dream.`;
    
    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://dream-interpret.com',
        'X-Title': 'Dream Interpret'
      },
      body: JSON.stringify({
        model: 'google/gemma-4-31b-it:free', // Using a reliable free model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }
    
    const data = await response.json();
    const interpretation = data.choices[0].message.content;
    
    // Save to history
    const dreamEntry = {
      id: Date.now().toString(),
      dream,
      language,
      interpretation,
      timestamp: new Date().toISOString()
    };
    dreams.push(dreamEntry);
    
    // Keep only last 100 dreams in memory
    if (dreams.length > 100) {
      dreams.shift();
    }
    
    res.json({ interpretation, id: dreamEntry.id });
  } catch (error) {
    console.error('Error in dream interpretation:', error);
    res.status(500).json({ error: 'Failed to interpret dream. Please try again.' });
  }
});

// Get dream history
app.get('/api/history', (req, res) => {
  // In a real app, we would get this from a database based on user/session
  // For now, return recent dreams
  res.json({ dreams: dreams.slice(-20).reverse() });
});

// Save a dream (for user to save favorites)
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

// Get saved dreams
app.get('/api/saved', (req, res) => {
  const saved = dreams.filter(d => d.saved).reverse();
  res.json({ dreams: saved });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});