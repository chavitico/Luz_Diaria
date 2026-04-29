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

## Estudios ya instalados (33 total)
- mammon_anxiety_freedom_001 → "Desatado de las Riquezas"
- morning_star_001 → "Estrella de la Mañana"
- hammer_of_god_001 → "El Martillo de Dios"
- balaam_humble_vision_001 → "Cuando la Burra Vio al Ángel y el Profeta Estaba Ciego"
- logos_creation_001 → "En el Principio era el Verbo"
- lamb_of_god_001 → "El Cordero de Dios"
- natanael_fig_tree_001 → "Debajo de la Higuera"
- cana_wedding_001 → "Las Bodas de Caná"
- born_again_001 → "Es Necesario Nacer de Nuevo"
- temple_cleansing_001 → "La Purificación del Templo"
- woman_at_well_001 → "La Mujer del Pozo"
- i_am_before_abraham_001 → "YO SOY: Antes que Abraham Fuese"
- good_shepherd_001 → "El Buen Pastor"
- jesus_troubled_himself_001 → "Se Turbó a Sí Mismo"
- passed_from_death_001 → "Pasados de Muerte a Vida"
- transfiguration_001 → "La Transfiguración"
- buried_talent_001 → "El Talento Enterrado"
- triumphal_entry_001 → "La Entrada Triunfal"
- gethsemane_agony_001 → "La Agonía del Testador"
- new_covenant_cup_001 → "La Copa del Nuevo Pacto"
- cup_of_wrath_001 → "La Copa de la Ira"
- veil_torn_001 → "El Velo Rasgado"
- saints_resurrected_001 → "Los Santos Resucitados"
- breath_new_adam_001 → "El Soplo del Nuevo Adán"
- road_to_emmaus_001 → "El Camino a Emaús"
- restoration_by_fire_001 → "Las Brasas de la Restauración"
- great_commission_001 → "La Gran Comisión"
- ascension_victory_001 → "La Ascensión Victoriosa"
- pentecost_power_001 → "El Poder de Pentecostés"
- damascus_road_001 → "El Camino a Damasco"
- gold_silver_ashes_001 → "Oro, Plata o Cenizas"
- zechariah_14_return_001 → "Zacarías 14: Cuando Sus Pies Toquen el Monte de los Olivos"
- full_hands_king_001 → "Manos Llenas para el Rey"
