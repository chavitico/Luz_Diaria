// Studies catalog — add new studies here as they are downloaded from the repo.
// Process to add a new study:
//   1. Download the ES JSON from https://github.com/develop4God/devocionales-json/tree/main/discovery/es
//   2. Save it to mobile/src/lib/studies/data/<id>_es_001.json
//   3. Add an entry below in STUDIES_CATALOG

import type { StudyCatalogEntry } from './types';

export const STUDIES_CATALOG: StudyCatalogEntry[] = [
  {
    id: 'breath_new_adam_001',
    emoji: '☁️',
    title: 'El Soplo del Nuevo Adán',
    subtitle: 'Cuando Jesús reconecta al hombre con Dios',
    estimated_reading_minutes: 7,
    imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80',
    dataFile: () => require('./data/breath_new_adam_es_001.json'),
  },
];
