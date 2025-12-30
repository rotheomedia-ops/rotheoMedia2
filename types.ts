
export type Platform = 'instagram' | 'facebook' | 'google' | 'mercado-livre';

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';

export type AppTab = 'generate' | 'edit' | 'audio' | 'integrate';

export interface AdOption {
  id: string;
  name: string;
  ratio: AspectRatio;
  dimensions: string;
  description: string;
}

export interface GeneratedAsset {
  images: string[];
  caption: string;
  voiceover: string;
  hashtags: string[];
}

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
}

export const VOICES = [
  { id: 'Zephyr', name: 'Zephyr (Juvenil/Dinâmico)' },
  { id: 'Puck', name: 'Puck (Animado/Brilhante)' },
  { id: 'Charon', name: 'Charon (Sério/Profundo)' },
  { id: 'Kore', name: 'Kore (Calmo/Suave)' },
  { id: 'Fenrir', name: 'Fenrir (Autoritário/Forte)' },
];
