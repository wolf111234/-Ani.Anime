import { useState, useMemo } from 'react';
import { Episode } from '../types';

interface EpisodeListProps {
  episodes: Episode[];
  currentEpisode: Episode;
  onEpisodeSelect: (episode: Episode) => void;
  totalEpisodes: number;
}

const EPISODES_PER_PAGE = 50;

export function EpisodeList({ episodes, currentEpisode, onEpisodeSelect, totalEpisodes }: EpisodeListProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  // Фильтрация по поиску
  const filteredEpisodes = useMemo(() => {
    if (!search.trim()) return episodes;
    const query = search.toLowerCase();
    return episodes.filter(ep => 
      ep.number.toString().includes(query) ||
      ep.title?.toLowerCase().includes(query)
    );
  }, [episodes, search]);

  // Пагинация
  const totalPages = Math.ceil(filteredEpisodes.length / EPISODES_PER_PAGE);
  const paginatedEpisodes = filteredEpisodes.slice(
    currentPage * EPISODES_PER_PAGE,
    (currentPage + 1) * EPISODES_PER_PAGE
  );

  // Перейти к странице с текущим эпизодом
  const goToCurrentEpisode = () => {
    const index = filteredEpisodes.findIndex(ep => ep.number === currentEpisode.number);
    if (index >= 0) {
      setCurrentPage(Math.floor(index / EPISODES_PER_PAGE));
    }
  };

  return (
    <div className="bg-[#13131a] rounded-xl border border-violet-500/20 overflow-hidden">
      {/* Заголовок */}
      <div className="p-3 sm:p-4 border-b border-violet-500/20 bg-gradient-to-r from-violet-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <span className="text-xl sm:text-2xl">📺</span>
            <span>Эпизоды</span>
            <span className="text-xs sm:text-sm font-normal text-gray-400">({totalEpisodes})</span>
          </h3>
          <button
            onClick={goToCurrentEpisode}
            className="text-xs px-2 sm:px-3 py-1 bg-violet-500/30 hover:bg-violet-500/50 rounded-lg transition-colors whitespace-nowrap"
          >
            К текущей
          </button>
        </div>
        
        {/* Поиск */}
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск эпизода..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(0);
            }}
            className="w-full bg-black/30 border border-violet-500/30 rounded-lg pl-9 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm focus:outline-none focus:border-violet-500"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Быстрые кнопки навигации */}
      {totalEpisodes > 10 && (
        <div className="p-2 border-b border-violet-500/10 flex gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={() => onEpisodeSelect(episodes[0])}
            className="text-xs px-2 sm:px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Первая
          </button>
          <button
            onClick={() => onEpisodeSelect(episodes[episodes.length - 1])}
            className="text-xs px-2 sm:px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            Последняя
          </button>
          {currentEpisode.number > 1 && (
            <button
              onClick={() => {
                const prev = episodes.find(e => e.number === currentEpisode.number - 1);
                if (prev) onEpisodeSelect(prev);
              }}
              className="text-xs px-2 sm:px-3 py-1 bg-violet-500/20 hover:bg-violet-500/30 rounded-lg transition-colors"
            >
              ← Пред.
            </button>
          )}
          {currentEpisode.number < episodes.length && (
            <button
              onClick={() => {
                const next = episodes.find(e => e.number === currentEpisode.number + 1);
                if (next) onEpisodeSelect(next);
              }}
              className="text-xs px-2 sm:px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg transition-colors"
            >
              След. →
            </button>
          )}
        </div>
      )}

      {/* Пагинация сверху (если много эпизодов) */}
      {totalPages > 1 && (
        <div className="p-2 border-b border-violet-500/10 flex flex-wrap gap-1 justify-center">
          {Array.from({ length: totalPages }).map((_, i) => {
            const start = i * EPISODES_PER_PAGE + 1;
            const end = Math.min((i + 1) * EPISODES_PER_PAGE, filteredEpisodes.length);
            return (
              <button
                key={i}
                onClick={() => setCurrentPage(i)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  currentPage === i
                    ? 'bg-gradient-to-r from-violet-500 to-cyan-500 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-gray-400'
                }`}
              >
                {start}-{end}
              </button>
            );
          })}
        </div>
      )}

      {/* Список эпизодов */}
      <div className="p-2 max-h-[350px] sm:max-h-[500px] overflow-y-auto">
        <div className="grid grid-cols-6 sm:grid-cols-5 md:grid-cols-4 lg:grid-cols-5 gap-1">
          {paginatedEpisodes.map((episode) => {
            const isCurrent = episode.number === currentEpisode.number;
            return (
              <button
                key={episode.number}
                onClick={() => onEpisodeSelect(episode)}
                className={`
                  relative p-1.5 sm:p-2 rounded-lg text-center transition-all
                  ${isCurrent 
                    ? 'bg-gradient-to-br from-violet-600 to-cyan-600 text-white shadow-lg shadow-violet-500/30 scale-105 z-10' 
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white active:scale-95'
                  }
                  ${episode.filler ? 'ring-1 ring-yellow-500/50' : ''}
                  ${episode.recap ? 'ring-1 ring-orange-500/50' : ''}
                `}
                title={episode.title || `Эпизод ${episode.number}`}
              >
                <span className="font-bold text-sm">{episode.number}</span>
                
                {/* Индикаторы */}
                {(episode.filler || episode.recap) && (
                  <div className="absolute -top-0.5 -right-0.5 flex gap-0.5">
                    {episode.filler && (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full" title="Филлер" />
                    )}
                    {episode.recap && (
                      <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full" title="Рекап" />
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {paginatedEpisodes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Эпизоды не найдены</p>
          </div>
        )}
      </div>

      {/* Легенда */}
      <div className="p-2 sm:p-3 border-t border-violet-500/10 flex flex-wrap gap-2 sm:gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-yellow-500 rounded-full" />
          Филлер
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-orange-500 rounded-full" />
          Рекап
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gradient-to-br from-violet-600 to-cyan-600 rounded" />
          Смотришь
        </div>
      </div>

      {/* Текущий эпизод */}
      <div className="p-2 sm:p-3 border-t border-violet-500/10 bg-gradient-to-r from-violet-500/5 to-cyan-500/5">
        <div className="text-xs sm:text-sm">
          <span className="text-gray-500">Сейчас:</span>
          <span className="font-medium ml-1">
            Серия {currentEpisode.number}
            {currentEpisode.title && (
              <span className="text-gray-400 hidden sm:inline"> • {currentEpisode.title}</span>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}

export default EpisodeList;
