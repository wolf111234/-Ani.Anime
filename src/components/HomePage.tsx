import { useState, useEffect } from 'react';
import { Anime } from '../types';
import { AnimeCard } from './AnimeCard';

interface HomePageProps {
  searchQuery: string;
  onAnimeSelect: (anime: Anime) => void;
}

export function HomePage({ searchQuery, onAnimeSelect }: HomePageProps) {
  const [topAnime, setTopAnime] = useState<Anime[]>([]);
  const [searchResults, setSearchResults] = useState<Anime[]>([]);
  const [seasonalAnime, setSeasonalAnime] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'popular' | 'seasonal' | 'top'>('popular');
  const [error, setError] = useState<string | null>(null);

  // Fetch top anime
  useEffect(() => {
    const fetchAnime = async () => {
      setLoading(true);
      setError(null);
      try {
        const [topRes, seasonalRes] = await Promise.all([
          fetch('https://api.jikan.moe/v4/top/anime?limit=12'),
          fetch('https://api.jikan.moe/v4/seasons/now?limit=12')
        ]);
        
        if (!topRes.ok || !seasonalRes.ok) {
          throw new Error('Ошибка загрузки данных');
        }
        
        const topData = await topRes.json();
        const seasonalData = await seasonalRes.json();
        
        setTopAnime(topData.data || []);
        setSeasonalAnime(seasonalData.data || []);
      } catch (err) {
        console.error('Error fetching anime:', err);
        setError('Не удалось загрузить аниме. Попробуйте обновить страницу.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnime();
  }, []);

  // Search anime
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const searchAnime = async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?q=${encodeURIComponent(searchQuery)}&limit=24`);
        const data = await res.json();
        setSearchResults(data.data || []);
      } catch (err) {
        console.error('Error searching anime:', err);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounce = setTimeout(searchAnime, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const displayedAnime = searchQuery 
    ? searchResults 
    : activeTab === 'seasonal' 
      ? seasonalAnime 
      : topAnime;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Hero Section */}
      {!searchQuery && (
        <div className="mb-8 sm:mb-12 text-center">
          <div className="relative inline-block">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold gradient-text mb-3 sm:mb-4">
              AniWatch 3D
            </h1>
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 blur-3xl -z-10" />
          </div>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto px-4">
            Погрузись в мир аниме с нашим уникальным плеером. 
            Тысячи тайтлов, множество озвучек, 3D интерфейс.
          </p>
          
          {/* Stats */}
          <div className="flex justify-center gap-6 sm:gap-8 mt-6 sm:mt-8">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">10K+</div>
              <div className="text-xs sm:text-sm text-gray-500">Аниме</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">100K+</div>
              <div className="text-xs sm:text-sm text-gray-500">Эпизодов</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold gradient-text">8+</div>
              <div className="text-xs sm:text-sm text-gray-500">Озвучек</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {!searchQuery && (
        <div className="flex items-center gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0">
          {[
            { id: 'popular', label: '🔥 Популярное' },
            { id: 'seasonal', label: '📺 Сезон' },
            { id: 'top', label: '⭐ Топ' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/30'
                  : 'bg-[#13131a] hover:bg-violet-500/20 border border-violet-500/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search Results Title */}
      {searchQuery && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold">
            Результаты: <span className="gradient-text">{searchQuery}</span>
          </h2>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            {searchLoading ? 'Поиск...' : `Найдено ${searchResults.length}`}
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12 sm:py-20">
          <div className="text-5xl sm:text-6xl mb-4">😕</div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Ошибка загрузки</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-violet-500 hover:bg-violet-600 rounded-lg transition-colors"
          >
            Обновить
          </button>
        </div>
      )}

      {/* Loading State */}
      {(loading || searchLoading) && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-[#13131a] rounded-xl aspect-[3/4]" />
              <div className="mt-2 sm:mt-3 h-3 sm:h-4 bg-[#13131a] rounded w-3/4" />
              <div className="mt-1.5 sm:mt-2 h-2.5 sm:h-3 bg-[#13131a] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Anime Grid */}
      {!loading && !searchLoading && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
          {displayedAnime.map((anime) => (
            <AnimeCard 
              key={anime.mal_id} 
              anime={anime} 
              onClick={() => onAnimeSelect(anime)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !searchLoading && !error && displayedAnime.length === 0 && searchQuery && (
        <div className="text-center py-12 sm:py-20">
          <div className="text-5xl sm:text-6xl mb-4">🔍</div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Ничего не найдено</h3>
          <p className="text-gray-500">Попробуйте изменить запрос</p>
        </div>
      )}
    </div>
  );
}
