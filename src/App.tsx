import { useState } from 'react';
import { Anime, View } from './types';
import { Particles } from './components/Particles';
import { Header } from './components/Header';
import { HomePage } from './components/HomePage';
import { AnimePage } from './components/AnimePage';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

function AppContent() {
  const [view, setView] = useState<View>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);

  const handleAnimeSelect = (anime: Anime) => {
    setSelectedAnime(anime);
    setView('anime');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (newView: View) => {
    setView(newView);
    if (newView === 'home') {
      setSelectedAnime(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <Particles />
      <Header 
        onNavigate={handleNavigate}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
      />
      
      {view === 'home' && (
        <HomePage 
          searchQuery={searchQuery}
          onAnimeSelect={handleAnimeSelect}
        />
      )}
      
      {view === 'anime' && selectedAnime && (
        <AnimePage 
          anime={selectedAnime}
          onNavigate={handleNavigate}
        />
      )}

      {/* Footer */}
      <footer className="mt-12 sm:mt-20 border-t border-violet-500/20 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className="font-bold gradient-text text-sm sm:text-base">AniWatch 3D</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            Данные предоставлены MyAnimeList API (Jikan)
          </p>
          <p className="text-xs text-gray-600 mt-1 sm:mt-2">
            © 2024 AniWatch. Все права защищены.
          </p>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
