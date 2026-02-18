import { useState, useEffect, useRef } from 'react';
import { Anime, Episode, View, DubbingStudio, DUBBING_STUDIOS } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { EpisodeList } from './EpisodeList';
import WatchTogether from './WatchTogether';

interface AnimePageProps {
  anime: Anime;
  onNavigate: (view: View) => void;
}

interface JikanEpisode {
  mal_id: number;
  title: string;
  title_japanese?: string;
  title_romanji?: string;
  aired?: string;
  filler: boolean;
  recap: boolean;
}

export function AnimePage({ anime, onNavigate }: AnimePageProps) {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalEpisodes, setTotalEpisodes] = useState(anime.episodes || 12);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [selectedDubbing, setSelectedDubbing] = useState<DubbingStudio>(DUBBING_STUDIOS[0]);
  const [showDubbingMenu, setShowDubbingMenu] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Загружаем реальные эпизоды из Jikan API
  useEffect(() => {
    const fetchAllEpisodes = async () => {
      setLoading(true);
      setLoadingProgress(0);
      const allEpisodes: Episode[] = [];
      let page = 1;
      let hasMore = true;
      
      try {
        while (hasMore && page <= 10) {
          const response = await fetch(
            `https://api.jikan.moe/v4/anime/${anime.mal_id}/episodes?page=${page}`
          );
          
          if (!response.ok) {
            throw new Error('API error');
          }
          
          const data = await response.json();
          
          if (data.data && data.data.length > 0) {
            const pageEpisodes: Episode[] = data.data.map((ep: JikanEpisode) => ({
              number: ep.mal_id,
              title: ep.title || ep.title_romanji || `Эпизод ${ep.mal_id}`,
              titleJapanese: ep.title_japanese,
              aired: ep.aired,
              filler: ep.filler || false,
              recap: ep.recap || false,
            }));
            
            allEpisodes.push(...pageEpisodes);
            setLoadingProgress(allEpisodes.length);
            hasMore = data.pagination?.has_next_page || false;
            page++;
            
            if (hasMore) {
              await new Promise(resolve => setTimeout(resolve, 400));
            }
          } else {
            hasMore = false;
          }
        }
        
        if (allEpisodes.length > 0) {
          setEpisodes(allEpisodes);
          setCurrentEpisode(allEpisodes[0]);
          setTotalEpisodes(allEpisodes.length);
        } else {
          const count = anime.episodes || 12;
          const generated = generateFallbackEpisodes(count);
          setEpisodes(generated);
          setCurrentEpisode(generated[0]);
          setTotalEpisodes(count);
        }
      } catch (error) {
        console.error('Error fetching episodes:', error);
        const count = anime.episodes || 12;
        const generated = generateFallbackEpisodes(count);
        setEpisodes(generated);
        setCurrentEpisode(generated[0]);
        setTotalEpisodes(count);
      }
      
      setLoading(false);
    };

    fetchAllEpisodes();
  }, [anime.mal_id, anime.episodes]);

  const generateFallbackEpisodes = (count: number): Episode[] => {
    return Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      title: `Эпизод ${i + 1}`,
      aired: undefined,
      filler: false,
      recap: false,
    }));
  };

  const handleNextEpisode = () => {
    if (!currentEpisode) return;
    const currentIndex = episodes.findIndex(ep => ep.number === currentEpisode.number);
    if (currentIndex < episodes.length - 1) {
      setCurrentEpisode(episodes[currentIndex + 1]);
    }
  };

  const handlePrevEpisode = () => {
    if (!currentEpisode) return;
    const currentIndex = episodes.findIndex(ep => ep.number === currentEpisode.number);
    if (currentIndex > 0) {
      setCurrentEpisode(episodes[currentIndex - 1]);
    }
  };

  const handleEpisodeChange = (episodeNumber: number) => {
    const ep = episodes.find(e => e.number === episodeNumber);
    if (ep) {
      setCurrentEpisode(ep);
    }
  };

  const currentIndex = currentEpisode ? episodes.findIndex(ep => ep.number === currentEpisode.number) : 0;
  const hasNext = currentIndex < episodes.length - 1;
  const hasPrev = currentIndex > 0;

  if (loading || !currentEpisode) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Загружаем эпизоды...</p>
          {loadingProgress > 0 && (
            <p className="text-sm text-gray-600 mt-2">Найдено: {loadingProgress} эпизодов</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-10">
      {/* Hero Banner */}
      <div className="relative h-48 sm:h-64 md:h-72 overflow-hidden">
        <img 
          src={anime.images.jpg.large_image_url}
          alt={anime.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-transparent to-transparent" />
        
        {/* Back button */}
        <button
          onClick={() => onNavigate('home')}
          className="absolute top-3 sm:top-4 left-3 sm:left-4 flex items-center gap-1.5 sm:gap-2 bg-black/50 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:bg-violet-500/30 active:scale-95 transition-all text-sm sm:text-base"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Назад</span>
        </button>

        {/* Watch Together Button */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          <WatchTogether
            animeId={anime.mal_id}
            animeTitle={anime.title}
            animeCover={anime.images.jpg.image_url}
            currentEpisode={currentEpisode.number}
            onEpisodeChange={handleEpisodeChange}
            videoRef={videoRef}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 -mt-20 sm:-mt-28 md:-mt-32 relative z-10">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Dubbing Selector */}
            <div className="relative">
              <button
                onClick={() => setShowDubbingMenu(!showDubbingMenu)}
                className="w-full sm:w-auto flex items-center justify-between gap-2 bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2.5 rounded-xl font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-shadow"
              >
                <span>🎙 Озвучка: {selectedDubbing.name}</span>
                <svg className={`w-4 h-4 transition-transform ${showDubbingMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showDubbingMenu && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-64 bg-gray-900/95 backdrop-blur border border-violet-500/30 rounded-xl shadow-xl overflow-hidden z-50">
                  {DUBBING_STUDIOS.map((studio) => (
                    <button
                      key={studio.id}
                      onClick={() => {
                        setSelectedDubbing(studio);
                        setShowDubbingMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-violet-500/20 transition-colors ${
                        selectedDubbing.id === studio.id ? 'bg-violet-500/30' : ''
                      }`}
                    >
                      <span>{studio.name}</span>
                      <span className="text-xs text-gray-500 uppercase">{studio.lang}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Video Player */}
            <VideoPlayer 
              ref={videoRef}
              animeTitle={anime.title}
              animeTitleEnglish={anime.title}
              episode={currentEpisode}
              dubbing={selectedDubbing}
              onNextEpisode={handleNextEpisode}
              onPrevEpisode={handlePrevEpisode}
              hasNext={hasNext}
              hasPrev={hasPrev}
              totalEpisodes={totalEpisodes}
            />

            {/* Mobile Episodes */}
            <div className="lg:hidden">
              <EpisodeList 
                episodes={episodes}
                currentEpisode={currentEpisode}
                onEpisodeSelect={setCurrentEpisode}
                totalEpisodes={totalEpisodes}
              />
            </div>

            {/* Anime Info */}
            <div className="bg-[#13131a] rounded-xl border border-violet-500/20 p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <img 
                  src={anime.images.jpg.image_url}
                  alt={anime.title}
                  className="w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-lg mx-auto sm:mx-0 flex-shrink-0"
                />
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h1 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{anime.title}</h1>
                  {anime.title_japanese && (
                    <p className="text-gray-500 mb-3 sm:mb-4 text-sm sm:text-base">{anime.title_japanese}</p>
                  )}
                  
                  {/* Stats */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3 mb-3 sm:mb-4">
                    {anime.score && (
                      <div className="flex items-center gap-1 bg-violet-500/20 px-2.5 sm:px-3 py-1 rounded-lg text-sm">
                        <span className="text-yellow-400">★</span>
                        <span className="font-semibold">{anime.score.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="bg-cyan-500/20 px-2.5 sm:px-3 py-1 rounded-lg text-cyan-400 text-sm">
                      {totalEpisodes} эп.
                    </div>
                    {anime.status && (
                      <div className={`px-2.5 sm:px-3 py-1 rounded-lg text-sm ${
                        anime.status === 'Currently Airing' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {anime.status === 'Currently Airing' ? 'Онгоинг' : 'Завершен'}
                      </div>
                    )}
                    {anime.year && (
                      <div className="bg-white/10 px-2.5 sm:px-3 py-1 rounded-lg text-sm">
                        {anime.year}
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-2">
                    {anime.genres?.map((genre) => (
                      <span 
                        key={genre.name}
                        className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/30 rounded-full text-xs sm:text-sm"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Synopsis */}
              {anime.synopsis && (
                <div>
                  <h3 className="font-semibold mb-2">Описание</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{anime.synopsis}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Episodes */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20">
              <EpisodeList 
                episodes={episodes}
                currentEpisode={currentEpisode}
                onEpisodeSelect={setCurrentEpisode}
                totalEpisodes={totalEpisodes}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
