// Strong's Concordance — Spanish Gloss Index
//
// Maps normalized Spanish keywords → ordered array of Strong IDs.
// This is the primary mechanism for Spanish-language search in the buscador.
//
// ─── Design principles ────────────────────────────────────────────────────────
//
//  1. Keys are lowercase, accent-free (normalized via NFD).
//     "espíritu" → "espiritu"   "corazón" → "corazon"
//
//  2. Each key maps to IDs ordered by relevance (most canonical first).
//     Multiple synonyms / partial matches share overlapping ID lists.
//
//  3. Coverage priority:
//     a) Biblical vocabulary most commonly typed in Spanish search boxes
//     b) Core theological terms (God, love, faith, grace, salvation, …)
//     c) Common verbs and nouns appearing across both Testaments
//
//  4. NOT a full bilingual dictionary — only terms users are likely to search.
//     For complete Spanish definitions, a localized dataset is needed (future).
//
// ─── How it is used ──────────────────────────────────────────────────────────
//
//  In JsonBlockStrongRepository.searchEntries():
//    1. normalizeEs(query) → stripped key
//    2. Scan GLOSS_INDEX keys for containment match
//    3. Collect matching Strong IDs, fetch entries from blocks
//    4. Merge with English field search results, deduplicate by ID
//
// ─────────────────────────────────────────────────────────────────────────────

/** Strips accents and lowercases a string for accent-insensitive comparison. */
export function normalizeEs(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Spanish gloss index.
 * Keys: normalized (lowercase, no accents) Spanish keyword.
 * Values: Strong IDs ordered by relevance (most canonical first).
 */
export const SPANISH_GLOSS_INDEX: Record<string, string[]> = {

  // ── A ──────────────────────────────────────────────────────────────────────
  'adorar':         ['H7812', 'G4352'],
  'agua':           ['H4325', 'G5204'],
  'alabar':         ['H1984', 'H8416', 'G134', 'G1867'],
  'alabanza':       ['H8416', 'H1984', 'G134'],
  'alma':           ['H5315', 'G5590'],
  'amor':           ['H157',  'H160',  'G25', 'G26'],
  'amar':           ['H157',  'G25'],
  'angel':          ['H4397', 'G32'],
  'angeles':        ['H4397', 'G32'],
  'apostol':        ['G652'],
  'apostoles':      ['G652'],
  'arrepentimiento':['G3341', 'H5162'],
  'arrepentirse':   ['G3340', 'H7725'],

  // ── B ──────────────────────────────────────────────────────────────────────
  'bendecir':       ['H1288', 'G2127'],
  'bendicion':      ['H1293', 'G2129'],
  'bien':           ['H2896', 'G18'],
  'bueno':          ['H2896', 'G18'],

  // ── C ──────────────────────────────────────────────────────────────────────
  'camino':         ['H1870', 'G3598'],
  'casa':           ['H1004', 'G3624'],
  'cielo':          ['H8064', 'G3772'],
  'cielos':         ['H8064', 'G3772'],
  'colocar':        ['H7760', 'H5117'],
  'conocer':        ['H3045', 'G1097'],
  'conocimiento':   ['H1847', 'G1108'],
  'corazon':        ['H3820', 'H3824', 'G2588'],
  'creacion':       ['H1254', 'G2937'],
  'crear':          ['H1254', 'G2936'],
  'creer':          ['H539',  'G4100'],
  'cristo':         ['G5547'],
  'cruz':           ['G4716'],

  // ── D ──────────────────────────────────────────────────────────────────────
  'dar':            ['H5414', 'G1325'],
  'david':          ['H1732'],
  'dia':            ['H3117', 'G2250'],
  'discipulo':      ['G3101'],
  'discipulos':     ['G3101'],
  'dios':           ['H430',  'H410',  'G2316'],

  // ── E ──────────────────────────────────────────────────────────────────────
  'elohim':         ['H430'],
  'espiritu':       ['H7307', 'G4151'],
  'espiritu santo': ['G40', 'G4151'],
  'establecer':     ['H7760', 'H3559', 'G2525'],
  'eterno':         ['H5769', 'G166'],
  'eterna':         ['H5769', 'G166'],
  'eternidad':      ['H5769', 'G165'],
  'evangelio':      ['G2098'],

  // ── F ──────────────────────────────────────────────────────────────────────
  'fe':             ['H530',  'G4102'],
  'fidelidad':      ['H530',  'G4102'],

  // ── G ──────────────────────────────────────────────────────────────────────
  'gloria':         ['H3519', 'G1391'],
  'glorificar':     ['H3513', 'G1392'],
  'gozo':           ['H8057', 'H8342', 'G5479'],
  'gracia':         ['H2580', 'G5485'],

  // ── H ──────────────────────────────────────────────────────────────────────
  'hacer':          ['H6213', 'H1254', 'G4160'],
  'hijo':           ['H1121', 'H1248', 'G5207'],
  'hijos':          ['H1121', 'G5207'],
  'hombre':         ['H120',  'H376',  'G444'],
  'hombres':        ['H120',  'H376',  'G444'],

  // ── I ──────────────────────────────────────────────────────────────────────
  'iglesia':        ['G1577'],
  'ir':             ['H1980', 'G4198'],

  // ── J ──────────────────────────────────────────────────────────────────────
  'jehova':         ['H3068'],
  'jesus':          ['G2424'],
  'juicio':         ['H4941', 'G2920'],
  'justo':          ['H6662', 'G1342'],
  'justicia':       ['H6664', 'H6666', 'G1343'],

  // ── L ──────────────────────────────────────────────────────────────────────
  'ley':            ['H8451', 'G3551'],
  'libertad':       ['H1865', 'G1657'],
  'luz':            ['H216',  'H215',  'G5457'],

  // ── M ──────────────────────────────────────────────────────────────────────
  'madre':          ['H517',  'G3384'],
  'mandamiento':    ['H4687', 'G1785'],
  'misericordia':   ['H2617', 'H7355', 'G1656'],
  'morir':          ['H4191', 'G599', 'G2348'],
  'muerte':         ['H4194', 'G2288'],
  'mundo':          ['H8398', 'G2889'],
  'mujer':          ['H802',  'G1135'],

  // ── N ──────────────────────────────────────────────────────────────────────
  'nacer':          ['H3205', 'G1080'],
  'noche':          ['H3915', 'G3571'],
  'nombre':         ['H8034', 'G3686'],
  'nuevo':          ['H2319', 'G2537'],

  // ── O ──────────────────────────────────────────────────────────────────────
  'oir':            ['H8085', 'G191'],
  'orar':           ['H6419', 'G4336'],
  'oracion':        ['H8605', 'H6419', 'G4335', 'G4336'],
  'oscuridad':      ['H2822', 'G4655'],

  // ── P ──────────────────────────────────────────────────────────────────────
  'padre':          ['H1',    'G3962'],
  'palabra':        ['H1697', 'G3056'],
  'pastor':         ['H7462', 'H7473', 'G4166'],
  'pastorear':      ['H7462', 'G4165'],
  'paz':            ['H7965', 'G1515'],
  'pecado':         ['H2399', 'H2403', 'G266'],
  'pecar':          ['H2398', 'G264'],
  'poder':          ['H1369', 'G1411', 'G1849'],
  'poner':          ['H7760', 'H5414', 'H7896'],
  'principio':      ['H7225', 'G746'],
  'profeta':        ['H5030', 'G4396'],
  'profetas':       ['H5030', 'G4396'],

  // ── R ──────────────────────────────────────────────────────────────────────
  'redimir':        ['H1350', 'G3084'],
  'redencion':      ['H1353', 'G629'],
  'reino':          ['H4467', 'G932'],
  'resucitar':      ['H6965', 'G386', 'G450'],
  'resurreccion':   ['G386'],
  'rey':            ['H4428', 'G935'],

  // ── S ──────────────────────────────────────────────────────────────────────
  'sacerdote':      ['H3548', 'G2409'],
  'sagrado':        ['H6918', 'G40'],
  'salvacion':      ['H3444', 'H3468', 'G4991', 'G4992'],
  'salvar':         ['H3467', 'G4982'],
  'sangre':         ['H1818', 'G129'],
  'santo':          ['H6918', 'H6944', 'G40'],
  'santidad':       ['H6944', 'G42'],
  'senor':          ['H136',  'H3068', 'G2962'],
  'siervo':         ['H5650', 'H5647', 'G1401'],
  'sabiduria':      ['H2451', 'G4678'],

  // ── T ──────────────────────────────────────────────────────────────────────
  'templo':         ['H1964', 'H1004', 'G3485', 'G2411'],
  'tierra':         ['H776',  'H127',  'G1093'],
  'tinieblas':      ['H2822', 'H653', 'G4655'],
  'torah':          ['H8451'],

  // ── U ──────────────────────────────────────────────────────────────────────
  'unigenito':      ['G3439'],

  // ── V ──────────────────────────────────────────────────────────────────────
  'verdad':         ['H571',  'G225'],
  'vida':           ['H2416', 'H2425', 'G2222'],
  'vivir':          ['H2416', 'H2421', 'G2198'],
  'verbo':          ['G3056'],

  // ── Y ──────────────────────────────────────────────────────────────────────
  'yhwh':           ['H3068'],

  // ── Extras bíblicos comunes ───────────────────────────────────────────────
  'agape':          ['G26'],
  'amen':           ['H543', 'G281'],
  'bautismo':       ['G908'],
  'bautizar':       ['G907'],
  'comunion':       ['G2842'],
  'esperanza':      ['H8615', 'G1680'],
  'escritura':      ['H3789', 'G1124'],
  'expiacion':      ['H3722', 'G2434'],
  'logos':          ['G3056'],
  'maranata':       ['G3134'],
  'mesías':         ['H4899', 'G3323'],
  'mesias':         ['H4899', 'G3323'],
  'milagro':        ['H4159', 'G4592', 'G1411'],
  'milagros':       ['H4159', 'G4592'],
  'misericordioso': ['H2623', 'G1655'],
  'omnipotente':    ['H7706', 'G3841'],
  'perdon':         ['H5547', 'H5545', 'G859'],
  'perdonar':       ['H5545', 'G863'],
  'profecia':       ['H5016', 'G4394'],
  'profetizar':     ['H5012', 'G4395'],
  'proximo':        ['H7453', 'G4139'],
  'santificar':     ['H6942', 'G37'],
  'santificacion':  ['H6942', 'G38'],
  'sanar':          ['H7495', 'G2323'],
  'sanidad':        ['H7495', 'G2392'],
  'shalom':         ['H7965'],
  'templar':        ['H6213', 'G4160'],
  'testimonio':     ['H5715', 'G3141'],
  'testigo':        ['H5707', 'G3144'],
};

/**
 * Pre-built inverted index: normalizedKey → sorted array of key strings.
 * Used for partial/substring matching ("amor" matches "amar", "amor", etc.).
 */
export const SPANISH_GLOSS_KEYS: string[] = Object.keys(SPANISH_GLOSS_INDEX);
