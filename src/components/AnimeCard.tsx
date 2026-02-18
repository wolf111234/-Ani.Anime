import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
  onClick: () => void;
}

export function AnimeCard({ anime, onClick }: AnimeCardProps) {
  return (
    <button
      onClick={onClick}
      className="group relative card-3d cursor-pointer text-left w-full"
    >
      {/* Glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-2xl blur opacity-0 group-hover:opacity-40 transition-all duration-500" />
      
      {/* Card */}
      <div className="relative bg-[#13131a] rounded-lg sm:rounded-xl overflow-hidden border border-violet-500/10 group-hover:border-violet-500/50 transition-all">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={anime.images.jpg.large_image_url || anime.images.jpg.image_url}
            alt={anime.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#13131a] via-transparent to-transparent opacity-60" />
          
          {/* Score badge */}
          {anime.score && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-gradient-to-r from-violet-500 to-cyan-500 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs sm:text-sm font-bold shadow-lg">
              ★ {anime.score.toFixed(1)}
            </div>
          )}

          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-violet-500/90 rounded-full flex items-center justify-center glow transform group-active:scale-90 transition-transform">
              <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white ml-0.5 sm:ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
          </div>

          {/* Episodes badge */}
          {anime.episodes && (
            <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-black/70 backdrop-blur-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium">
              {anime.episodes} эп.
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2.5 sm:p-4 space-y-1 sm:space-y-2">
          <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-2 group-hover:text-violet-400 transition-colors leading-tight">
            {anime.title}
          </h3>
          {anime.title_japanese && (
            <p className="text-xs text-gray-500 line-clamp-1 hidden sm:block">
              {anime.title_japanese}
            </p>
          )}
          {/* Genres */}
          <div className="flex flex-wrap gap-1">
            {anime.genres?.slice(0, 2).map((genre) => (
              <span
                key={genre.name}
                className="text-xs px-1.5 sm:px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full"
              >
                {genre.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}
