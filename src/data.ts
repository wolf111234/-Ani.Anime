import { Voiceover } from './types';

export const voiceovers: Voiceover[] = [
  { id: 'anilibria', name: 'AniLibria', studio: 'AniLibria', language: 'Русский' },
  { id: 'anidub', name: 'AniDUB', studio: 'AniDUB', language: 'Русский' },
  { id: 'studio_band', name: 'StudioBand', studio: 'StudioBand', language: 'Русский' },
  { id: 'animevost', name: 'AnimeVost', studio: 'AnimeVost', language: 'Русский' },
  { id: 'sovetromantika', name: 'SovetRomantica', studio: 'SovetRomantica', language: 'Русский' },
  { id: 'jam', name: 'JAM', studio: 'JAM Club', language: 'Русский' },
  { id: 'shiza', name: 'Shiza Project', studio: 'Shiza', language: 'Русский' },
  { id: 'original', name: 'Оригинал', studio: 'Japan', language: 'Японский' },
];

export const generateEpisodes = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    number: i + 1,
    title: `Эпизод ${i + 1}`,
    aired: `2024-0${Math.min(i + 1, 9)}-${10 + i}`,
    filler: Math.random() > 0.9,
    recap: Math.random() > 0.95,
  }));
};
