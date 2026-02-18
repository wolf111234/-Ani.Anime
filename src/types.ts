export interface Anime {
  mal_id: number;
  title: string;
  title_japanese?: string;
  images: {
    jpg: {
      image_url: string;
      large_image_url: string;
    };
  };
  synopsis?: string;
  score?: number;
  episodes?: number;
  status?: string;
  rating?: string;
  genres?: { name: string }[];
  year?: number;
  season?: string;
}

export interface Episode {
  number: number;
  title: string;
  titleJapanese?: string;
  aired?: string;
  filler?: boolean;
  recap?: boolean;
}

export interface Voiceover {
  id: string;
  name: string;
  studio: string;
  language: string;
}

export interface DubbingStudio {
  id: string;
  name: string;
  lang: 'ru' | 'en' | 'jp';
}

export const DUBBING_STUDIOS: DubbingStudio[] = [
  { id: 'anilibria', name: 'AniLibria', lang: 'ru' },
  { id: 'anidub', name: 'AniDUB', lang: 'ru' },
  { id: 'sovet', name: 'SovetRomantica', lang: 'ru' },
  { id: 'dream', name: 'DreamCast', lang: 'ru' },
  { id: 'jam', name: 'JAM', lang: 'ru' },
  { id: 'sub', name: 'Субтитры', lang: 'jp' },
  { id: 'eng', name: 'English', lang: 'en' },
];

export type View = 'home' | 'anime' | 'watch';
