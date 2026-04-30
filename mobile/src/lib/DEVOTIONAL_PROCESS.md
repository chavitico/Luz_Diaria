# Proceso para agregar nuevos devocionales

## Archivo clave
`mobile/src/lib/repo-devocional.ts`

## Estructura de cada devocional

Cada fecha necesita **2 objetos** `RepoDevocional`: uno en español (`es`) y uno en inglés (`en`).

```typescript
export const DEVOCIONAL_YYYY_MM_DD: RepoDevocional = {
  id: '[libroEspañol][cap][ver]RVR1960',   // Ej: 'romanos1013RVR1960'
  date: 'YYYY-MM-DD',
  language: 'es',
  version: 'RVR1960',
  versiculo: 'Libro Cap:Ver RVR1960: "texto completo del versículo."',
  reflexion: 'Párrafo 1 (2-4 oraciones).\n\nPárrafo 2 (2-4 oraciones).',
  para_meditar: [
    { cita: 'Libro Cap:Ver', texto: 'Texto del versículo en español.' },
    { cita: 'Libro Cap:Ver', texto: 'Texto del versículo en español.' },
    { cita: 'Libro Cap:Ver', texto: 'Texto del versículo en español.' },
  ],
  oracion: 'Párrafo 1 de oración.\n\nPárrafo 2 de oración.',
  tags: ['Tema'],  // Un solo tag que coincide con el tema
};

export const DEVOTIONAL_YYYY_MM_DD_EN: RepoDevocional = {
  id: '[bookEnglish][chap][ver]KJV',        // Ej: 'romans1013KJV'
  date: 'YYYY-MM-DD',
  language: 'en',
  version: 'KJV',
  versiculo: 'Book Chap:Ver KJV: "full verse text."',
  reflexion: 'Paragraph 1.\n\nParagraph 2.',
  para_meditar: [
    { cita: 'Book Chap:Ver', texto: 'KJV verse text.' },
    { cita: 'Book Chap:Ver', texto: 'KJV verse text.' },
    { cita: 'Book Chap:Ver', texto: 'KJV verse text.' },
  ],
  oracion: 'Prayer paragraph 1.\n\nParagraph 2.',
  tags: ['Topic'],
};
```

## Archivos mensuales (a partir de junio 11)

Para mantener el rendimiento del bundler, los devocionales nuevos se dividen por mes:

| Archivo                          | Fechas             | Devocionales |
|----------------------------------|--------------------|--------------|
| `repo-devocional.ts`             | Apr 29 – Jun 10    | 34 fechas    |
| `repo-devocional-jun2026.ts`     | Jun 11 – Jun 30    | 20 días      |
| `repo-devocional-jul2026.ts`     | Jul 1 – Jul 31     | 31 días      |
| `repo-devocional-aug2026.ts`     | Aug 1 – Aug 31     | 31 días      |
| `repo-devocional-sep2026.ts`     | Sep 1 – Sep 18     | 18 días      |

Cada archivo mensual exporta plain objects (sin `import type`). El archivo principal `repo-devocional.ts` los importa con `import * as MonthYear from './repo-devocional-monYYYY'` y los añade al mapa `REPO_DEVOCIONALS`.

## Paso a paso

1. **Definir el tema** del devocional (Adoración, Fe, Servicio, etc.)
2. **Elegir el versículo principal** — debe ser directo, conocido y aplicable
3. **Escribir la reflexión** — 2 párrafos, primer párrafo diagnóstico/contexto, segundo párrafo promesa/aplicación
4. **Seleccionar 3 versículos para `para_meditar`** — textos que complementen la reflexión
5. **Escribir la oración** — 2 párrafos, honesta, personal, específica al tema
6. **Registrar en `REPO_DEVOCIONALS`** en `repo-devocional.ts` (via import del archivo mensual)

## Registro en el mapa

```typescript
export const REPO_DEVOCIONALS: Record<...> = {
  // ...entradas existentes...
  'YYYY-MM-DD': { es: DEVOCIONAL_YYYY_MM_DD, en: DEVOTIONAL_YYYY_MM_DD_EN, imageUrl: REPO_IMAGES[N] },
};
```

## Pool de imágenes (`REPO_IMAGES`)

| Index | Descripción |
|-------|-------------|
| [0]   | Sunrise over mountains |
| [1]   | Golden field |
| [2]   | Misty forest |
| [3]   | Sunlight through trees |
| [4]   | Ocean waves |
| [5]   | Flowers |
| [6]   | Mountain valley |
| [7]   | Lake reflection |
| [8]   | Waterfall |
| [9]   | Mountain sunrise |
| [10]  | Forest path |
| [11]  | Valley view |

Rotar las imágenes secuencialmente para evitar repetición cercana.

## Reglas de calidad

- **Versículo principal**: usar RVR1960 (español) y KJV (inglés) con texto exacto
- **`para_meditar`**: siempre 3 versículos, con texto bíblico real (no paráfrasis)
- **Tags**: un solo tag en español para `es` y en inglés para `en`
- **Títulos**: no repetir títulos similares entre fechas cercanas
- **ID**: formato `[libro][cap][ver][versión]` sin espacios ni caracteres especiales

## Devocionales actuales (a partir de abril 2026)

| Fecha      | Tema              | Versículo principal |
|------------|-------------------|---------------------|
| 2026-04-29 | Obediencia        | Isaías 1:19         |
| 2026-04-30 | Gratitud          | Filipenses 4:6      |
| 2026-05-01 | Fe                | Hebreos 11:6        |
| 2026-05-02 | Amor              | 1 Corintios 13:4    |
| 2026-05-03 | Paz               | Filipenses 4:7      |
| 2026-05-04 | Esperanza         | Romanos 15:13       |
| 2026-05-05 | Gracia            | Efesios 2:8-9       |
| 2026-05-06 | Oración           | Mateo 6:6           |
| 2026-05-07 | Salvación         | Romanos 10:13       |
| 2026-05-08 | Redención         | Efesios 1:7         |
| 2026-05-10 | Adoración         | Colosenses 3:17     |
| 2026-05-11 | Oración (crisis)  | Romanos 8:26        |
| 2026-05-13 | Servicio          | Marcos 10:45        |
| 2026-05-14 | Espera            | Isaías 40:31        |
| 2026-05-15 | Decisiones        | Proverbios 3:5-6    |
| 2026-05-16 | Descanso          | Mateo 11:28         |
| 2026-05-20 | Disciplina        | Hebreos 12:11       |
| 2026-05-22 | Identidad         | Jeremías 1:5        |
| 2026-05-23 | Duelo             | Salmos 56:8         |
| 2026-05-25 | Nuevos comienzos  | Isaías 43:19        |
| 2026-05-26 | Soledad           | Deuteronomio 31:8   |
| 2026-05-27 | Dudas             | Marcos 9:24         |
| 2026-05-28 | Identidad en Cristo | 1 Juan 3:1        |
| 2026-05-30 | Relaciones        | Colosenses 3:13     |
| 2026-06-01 | Confianza         | Proverbios 3:5      |
| 2026-06-02 | Humildad          | Santiago 4:10       |
| 2026-06-03 | Perseverancia     | Gálatas 6:9         |
| 2026-06-04 | Gozo              | Nehemías 8:10       |
| 2026-06-05 | Propósito         | Jeremías 29:11      |
| 2026-06-06 | Perdón            | 1 Juan 1:9          |
| 2026-06-07 | Valentía          | Josué 1:9           |
| 2026-06-08 | Familia           | Josué 24:15         |
| 2026-06-09 | Generosidad       | 2 Corintios 9:7     |
| 2026-06-10 | Transformación    | Romanos 12:2        |
| 2026-06-11 | Mayordomía        | Mateo 25:21         |
| 2026-06-12 | Contentamiento    | Filipenses 4:11     |
| 2026-06-13 | Misericordia      | Lamentaciones 3:22-23 |
| 2026-06-14 | Unidad            | Salmos 133:1        |
| 2026-06-15 | Testimonio        | Hechos 1:8          |
| 2026-06-16 | Tentación         | 1 Corintios 10:13   |
| 2026-06-17 | Provisión         | Filipenses 4:19     |
| 2026-06-18 | Reconciliación    | 2 Corintios 5:18    |
| 2026-06-19 | Crecimiento espiritual | 2 Pedro 3:18   |
| 2026-06-20 | La Palabra Viva   | Hebreos 4:12        |
| 2026-06-21 | Santidad          | 1 Pedro 1:15-16     |
| 2026-06-22 | Comunión          | Hechos 2:42         |
| 2026-06-23 | Guía divina       | Salmos 32:8         |
| 2026-06-24 | Bendición         | Números 6:24-26     |
| 2026-06-25 | Fidelidad de Dios | Deuteronomio 7:9    |
| 2026-06-26 | Intercesión       | Romanos 8:34        |
| 2026-06-27 | Restauración      | Joel 2:25           |
| 2026-06-28 | Autocontrol       | Gálatas 5:22-23     |
| 2026-06-29 | El Evangelio      | 1 Corintios 15:3-4  |
| 2026-06-30 | Descanso en Dios  | Salmos 62:1         |
| 2026-07-01 | Protección        | Salmos 91:1         |
| 2026-07-02 | Honestidad        | Proverbios 12:17    |
| 2026-07-03 | Libertad en Cristo | Gálatas 5:1        |
| 2026-07-04 | La creación habla | Salmos 19:1         |
| 2026-07-05 | Obediencia a Dios | Hechos 5:29         |
| 2026-07-06 | Sanidad           | Santiago 5:16       |
| 2026-07-07 | Alabanza          | Salmos 150:6        |
| 2026-07-08 | Arrepentimiento   | 2 Corintios 7:10    |
| 2026-07-09 | Consuelo          | 2 Corintios 1:3-4   |
| 2026-07-10 | Justicia social   | Miqueas 6:8         |
| 2026-07-11 | Diligencia        | Proverbios 22:29    |
| 2026-07-12 | Redimir el tiempo | Efesios 5:16        |
| 2026-07-13 | La Cruz           | Gálatas 2:20        |
| 2026-07-14 | Compasión         | Mateo 9:36          |
| 2026-07-15 | Llamado           | Efesios 4:1         |
| 2026-07-16 | Sabiduría         | Proverbios 2:6      |
| 2026-07-17 | Hospitalidad      | Romanos 12:13       |
| 2026-07-18 | Perdonar para ser libre | Marcos 11:25  |
| 2026-07-19 | Corazón agradecido | Salmos 100:4       |
| 2026-07-20 | Madurez espiritual | Hebreos 5:14       |
| 2026-07-21 | Quietud           | Salmos 46:10        |
| 2026-07-22 | Amistad fiel      | Proverbios 17:17    |
| 2026-07-23 | El poder de las palabras | Santiago 3:10 |
| 2026-07-24 | Llevar cargas juntos | Gálatas 6:2      |
| 2026-07-25 | Dios nuestro Padre | Romanos 8:15       |
| 2026-07-26 | Fortaleza divina  | Isaías 40:29        |
| 2026-07-27 | Mansedumbre       | Mateo 5:5           |
| 2026-07-28 | Esperanza viva    | 1 Pedro 1:3         |
| 2026-07-29 | La presencia de Dios | Sofonías 3:17    |
| 2026-07-30 | Pruebas que forman | Santiago 1:2-3     |
| 2026-07-31 | El amor que no falla | Romanos 8:38-39  |
| 2026-08-01 | Integridad        | Salmos 15:2         |
| 2026-08-02 | Dones espirituales | 1 Corintios 12:7   |
| 2026-08-03 | Hijos de Dios     | Juan 1:12           |
| 2026-08-04 | Paciencia activa  | Santiago 5:7-8      |
| 2026-08-05 | Fidelidad en lo ordinario | Proverbios 3:3 |
| 2026-08-06 | Luz del mundo     | Juan 8:12           |
| 2026-08-07 | Servicio humilde  | Juan 13:14          |
| 2026-08-08 | Permanecer en Cristo | Juan 15:5        |
| 2026-08-09 | Mente pura        | Filipenses 4:8      |
| 2026-08-10 | Excelencia en el trabajo | Colosenses 3:23 |
| 2026-08-11 | Paz que sobrepasa | Juan 14:27          |
| 2026-08-12 | Asombro ante Dios | Salmos 8:3-4        |
| 2026-08-13 | Buena reputación  | Proverbios 22:1     |
| 2026-08-14 | Cuerpo de Cristo  | 1 Corintios 12:27   |
| 2026-08-15 | Ofrenda viva      | Romanos 12:1        |
| 2026-08-16 | La verdad libera  | Juan 14:6           |
| 2026-08-17 | Meditación en la Palabra | Salmos 1:2   |
| 2026-08-18 | Amar al prójimo   | Marcos 12:31        |
| 2026-08-19 | Corazón puro      | Salmos 51:10        |
| 2026-08-20 | El trabajo como adoración | Eclesiastés 9:10 |
| 2026-08-21 | Gracia suficiente | 2 Corintios 12:9    |
| 2026-08-22 | Resurrección y vida | Juan 11:25        |
| 2026-08-23 | Sed de Dios       | Salmos 42:1         |
| 2026-08-24 | Compromiso total  | Josué 24:21         |
| 2026-08-25 | Oración sin cesar | 1 Tesalonicenses 5:17 |
| 2026-08-26 | La Gran Comisión  | Mateo 28:19-20      |
| 2026-08-27 | Bondad activa     | Colosenses 3:12     |
| 2026-08-28 | Seguridad eterna  | Juan 10:28-29       |
| 2026-08-29 | Frente a la injusticia | Romanos 12:19  |
| 2026-08-30 | Enraizados en amor | Efesios 3:17-18    |
| 2026-08-31 | Estar preparados  | Lucas 12:40         |
| 2026-09-01 | Confianza en Dios | Salmos 46:2         |
| 2026-09-02 | Fe                | Hebreos 11:1        |
| 2026-09-03 | Gozo              | Proverbios 17:22    |
| 2026-09-04 | Unidad            | Salmos 133:1        |
| 2026-09-05 | Testimonio        | Hechos 1:8          |
| 2026-09-06 | Tentación         | 1 Corintios 10:13   |
| 2026-09-07 | Provisión         | Filipenses 4:19     |
| 2026-09-08 | Reconciliación    | 2 Corintios 5:18    |
| 2026-09-09 | Crecimiento espiritual | 2 Pedro 3:18   |
| 2026-09-10 | La Palabra Viva   | Hebreos 4:12        |
| 2026-09-11 | Santidad          | 1 Pedro 1:15-16     |
| 2026-09-12 | Comunión          | Hechos 2:42         |
| 2026-09-13 | Guía divina       | Salmos 32:8         |
| 2026-09-14 | Bendición         | Números 6:24-26     |
| 2026-09-15 | Fidelidad de Dios | Deuteronomio 7:9    |
| 2026-09-16 | Intercesión       | Romanos 8:34        |
| 2026-09-17 | Restauración      | Joel 2:25           |
| 2026-09-18 | Fruto del Espíritu | Gálatas 5:22-23    |
