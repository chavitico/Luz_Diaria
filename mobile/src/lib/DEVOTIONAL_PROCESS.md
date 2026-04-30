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

## Paso a paso

1. **Definir el tema** del devocional (Adoración, Fe, Servicio, etc.)
2. **Elegir el versículo principal** — debe ser directo, conocido y aplicable
3. **Escribir la reflexión** — 2 párrafos, primer párrafo diagnóstico/contexto, segundo párrafo promesa/aplicación
4. **Seleccionar 3 versículos para `para_meditar`** — textos que complementen la reflexión
5. **Escribir la oración** — 2 párrafos, honesta, personal, específica al tema
6. **Registrar en `REPO_DEVOCIONALS`** al final del archivo

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
