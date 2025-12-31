
import { Platform, AdOption } from './types';

export const PLATFORM_OPTIONS: Record<Platform, AdOption[]> = {
  instagram: [
    { id: 'ig-square', name: 'Square Feed', ratio: '1:1', dimensions: '1080x1080', description: 'Standard feed post.' },
    // Changed 4:5 to 3:4 for Gemini compatibility
    { id: 'ig-post', name: 'Portrait Post', ratio: '3:4', dimensions: '1080x1350', description: 'Maximum feed vertical real estate.' },
    { id: 'ig-reel', name: 'Reel / Story', ratio: '9:16', dimensions: '1080x1920', description: 'Full-screen immersive content.' },
  ],
  facebook: [
    { id: 'fb-landscape', name: 'Landscape Ad', ratio: '16:9', dimensions: '1200x628', description: 'Best for desktop feed and right column.' },
    { id: 'fb-square', name: 'Square Carousel', ratio: '1:1', dimensions: '1080x1080', description: 'High engagement for mobile feed.' },
    { id: 'fb-story', name: 'Story Ad', ratio: '9:16', dimensions: '1080x1920', description: 'Facebook Stories placement.' },
  ],
  google: [
    { id: 'gg-display', name: 'Display Landscape', ratio: '16:9', dimensions: '1200x628', description: 'GDN Responsive Display Ads.' },
    { id: 'gg-square', name: 'Display Square', ratio: '1:1', dimensions: '1200x1200', description: 'Google Display Network.' },
    // Changed 4:5 to 3:4 for Gemini compatibility
    { id: 'gg-portrait', name: 'Performance Max', ratio: '3:4', dimensions: '960x1200', description: 'Portrait for mobile browsing.' },
  ],
  'mercado-livre': [
    { id: 'ml-square', name: 'Produto Principal', ratio: '1:1', dimensions: '1200x1200', description: 'Foto de capa do anúncio.' },
    { id: 'ml-banner', name: 'Banner Horizontal', ratio: '16:9', dimensions: '1200x675', description: 'Banner para lojas oficiais.' },
  ],
};
