import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import Home from './pages/Home';
import Interpret from './pages/Interpret';
import History from './pages/History';
import Saved from './pages/Saved';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <div className="min-h-screen bg-background text-foreground transition-colors duration-200 dark">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/interpret" element={<Interpret />} />
            <Route path="/history" element={<History />} />
            <Route path="/saved" element={<Saved />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </I18nProvider>
    </AuthProvider>
  );
}

export default App;