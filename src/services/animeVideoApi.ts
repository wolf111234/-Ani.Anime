// API для получения реальных аниме видео
// Используем несколько источников для надёжности

const CONSUMET_BASE = 'https://api.consumet.org';

export interface VideoSource {
  url: string;
  quality: string;
  isM3U8: boolean;
}

export interface EpisodeSource {
  sources: VideoSource[];
  subtitles?: { url: string; lang: string }[];
}

export interface SearchResult {
  id: string;
  title: string;
  image: string;
  releaseDate?: string;
  subOrDub: string;
}

export interface AnimeInfo {
  id: string;
  title: string;
  episodes: {
    id: string;
    number: number;
    title?: string;
  }[];
}

// Поиск аниме
export async function searchAnime(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch(`${CONSUMET_BASE}/anime/gogoanime/${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching anime:', error);
    return [];
  }
}

// Получить информацию об аниме (включая эпизоды)
export async function getAnimeInfo(id: string): Promise<AnimeInfo | null> {
  try {
    const response = await fetch(`${CONSUMET_BASE}/anime/gogoanime/info/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting anime info:', error);
    return null;
  }
}

// Получить видео источники для эпизода
export async function getEpisodeSources(episodeId: string): Promise<EpisodeSource | null> {
  try {
    const response = await fetch(`${CONSUMET_BASE}/anime/gogoanime/watch/${episodeId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting episode sources:', error);
    return null;
  }
}

// Конвертировать название из Jikan в формат для gogoanime
export function convertToGogoId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Получить ID эпизода
export function getEpisodeId(animeId: string, episodeNum: number): string {
  return `${animeId}-episode-${episodeNum}`;
}

// Резервные источники видео (если основной не работает)
export const FALLBACK_VIDEOS: Record<string, string[]> = {
  default: [
    'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
  ]
};

// Генерация embed URL для различных плееров
export function getKodikSearchUrl(title: string): string {
  return `https://kodik.info/find-player?title=${encodeURIComponent(title)}`;
}

export function getAnilibriaSearchUrl(title: string): string {
  return `https://www.anilibria.tv/public/search.php?search=${encodeURIComponent(title)}`;
}
