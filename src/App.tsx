import { Routes, Route } from 'react-router-dom';
import { I18nProvider } from './contexts/I18nContext';
import Home from './pages/Home';
import Interpret from './pages/Interpret';
import History from './pages/History';
import Saved from './pages/Saved';
import SEOPage from './pages/SEOPage';
import NotFound from './pages/NotFound';
import './index.css';

function App() {
  return (
    <I18nProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/interpret" element={<Interpret />} />
        <Route path="/history" element={<History />} />
        <Route path="/saved" element={<Saved />} />
        <Route path="/seo/:symbol/:lang" element={<SEOPage />} />
        <Route path="/seo/:symbol/:lang/:slug" element={<SEOPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </I18nProvider>
  );
}

export default App;
