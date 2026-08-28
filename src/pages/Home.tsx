import { Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-900 to-black/80 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-display text-white mb-4">
            {t('app.title')}
          </h1>
          <p className="text-xl text-cosmic-200 max-w-2xl mx-auto">
            {t('app.description')}
          </p>
        </header>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1: Multilingual */}
          <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-xl p-6 border border-cosmic-600/30 hover:border-cosmic-400/50 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cosmic-600/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🌍</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">{t('nav.language')}</h3>
                <p className="text-cosmic-200 text-sm">
                  Interpret dreams in 17+ languages including Arabic, English, Spanish, French, and more.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2: AI Powered */}
          <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-xl p-6 border border-cosmic-600/30 hover:border-cosmic-400/50 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cosmic-600/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">AI Interpretation</h3>
                <p className="text-cosmic-200 text-sm">
                  Advanced AI models analyze your dreams using ancient wisdom and modern psychology.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 3: Free & Private */}
          <div className="bg-cosmic-800/50 backdrop-blur-sm rounded-xl p-6 border border-cosmic-600/30 hover:border-cosmic-400/50 transition-all duration-300">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cosmic-600/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">🔒</span>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">100% Free & Private</h3>
                <p className="text-cosmic-200 text-sm">
                  No hidden fees. Your dreams are yours alone - we don't store or share them.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/interpret" className="inline-block bg-cosmic-500 hover:bg-cosmic-600 text-white font-bold py-3 px-8 rounded-lg transition-transform duration-200 transform hover:scale-105 shadow-lg shadow-cosmic-500/20">
            {t('hero.button')}
          </Link>
        </div>

        {/* Dream symbols showcase */}
        <section className="mt-20">
          <h2 className="text-3xl font-display text-white text-center mb-8">
            Common Dream Symbols
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Symbol cards */}
            <div className="bg-cosmic-700/50 backdrop-blur rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-cosmic-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🐍</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Snake</h4>
              <p className="text-cosmic-200 text-sm">Transformation, hidden fears, wisdom</p>
            </div>
            <div className="bg-cosmic-700/50 backdrop-blur rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-cosmic-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">💧</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Water</h4>
              <p className="text-cosmic-200 text-sm">Emotions, subconscious, cleansing</p>
            </div>
            <div className="bg-cosmic-700/50 backdrop-blur rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-cosmic-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✈️</span>
              </div>
              <h4 className="font-semibold text-white mb-2">Flying</h4>
              <p className="text-cosmic-200 text-sm">Freedom, ambition, escape</p>
            </div>
            <div className="bg-cosmic-700/50 backdrop-blur rounded-xl p-4 text-center">
              <div className="w-10 h-10 bg-cosmic-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🏠</span>
              </div>
              <h4 className="font-semibold text-white mb-2">House</h4>
              <p className="text-cosmic-200 text-self">Self, security, family</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}