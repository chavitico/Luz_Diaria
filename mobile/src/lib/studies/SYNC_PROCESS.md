# Proceso para agregar nuevos Estudios Bíblicos

## Repositorio fuente
https://github.com/develop4God/devocionales-json/tree/main/discovery

## Índice de estudios disponibles
https://raw.githubusercontent.com/develop4God/devocionales-json/main/discovery/index.json

## Pasos para agregar un nuevo estudio

1. **El usuario dice**: "busca estudios nuevos en el repositorio"
2. Fetch `index.json` para ver todos los estudios disponibles
3. Comparar con `STUDIES_CATALOG` en `catalog.ts` para identificar IDs que faltan
4. Para cada estudio nuevo:
   a. Fetch el JSON en español: `https://raw.githubusercontent.com/develop4God/devocionales-json/main/discovery/es/<filename_es>.json`
      (el filename está en `index.json` → `files.es`)
   b. Guardar en `mobile/src/lib/studies/data/<id>_es_001.json`
   c. Agregar entrada al array `STUDIES_CATALOG` en `catalog.ts`:
      ```ts
      {
        id: '<id del index.json>',
        emoji: '<emoji del index.json>',
        title: '<titles.es del index.json>',
        subtitle: '<subtitles.es del index.json>',
        estimated_reading_minutes: <estimated_reading_minutes.es>,
        dataFile: () => require('./data/<filename_es>'),
      }
      ```
5. No se requieren cambios en el reader ni en los tipos

## Estructura del JSON de un estudio
- `key_verse`: versículo central (página 1 del reader)
- `cards[]`: array de tarjetas (páginas 2..N):
  - `opening_parallel`: narración con paralelos bíblicos
  - `greek_exegesis`: análisis de palabra griega/hebrea
  - `theological_depth`: profundidad teológica
  - `identity_transformation`: aplicación de identidad
  - `discovery_activation`: preguntas + oración final

## Estudios ya instalados
- breath_new_adam_001 → "El Soplo del Nuevo Adán"
