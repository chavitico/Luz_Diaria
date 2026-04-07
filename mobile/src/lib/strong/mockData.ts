// Strong's Concordance — Mock dataset
// MVP: a representative sample of real Strong entries across OT and NT.
// TODO: Replace with real dataset from strongsnumbers.com or similar source.
//
// Sample verses covered:
//  - GEN_1_1  (Génesis 1:1)
//  - GEN_1_2  (Génesis 1:2)
//  - EXO_1_10 (Éxodo 1:10)   ← H7760 caso de estudio
//  - PSA_23_1 (Salmos 23:1)
//  - JHN_1_1  (Juan 1:1)
//  - JHN_3_16 (Juan 3:16)
//  - ROM_8_28 (Romanos 8:28)

import type { StrongEntry, VerseWordLink, VerseStrongMap } from './types';

// ─── Strong Entries ────────────────────────────────────────────────────────────

export const STRONG_ENTRIES: Record<string, StrongEntry> = {
  // ── Hebrew (OT) ──────────────────────────────────────────────────────────────

  H7760: {
    id: 'H7760',
    testament: 'OT',
    lemmaOriginal: 'שׂוּם',
    transliteration: 'sum',
    language: 'Hebrew',
    grammarCategory: 'Verbo',
    shortDefinition: 'Poner, colocar, establecer, disponer',
    longDefinition:
      'Un verbo primitivo; poner (en muchas aplicaciones, literal, figurativa, inferencialmente e idiomáticamente): aplicar, asignar, colocar, comprometerse, considerar, designar, destinar, disponer, establecer, fijar, imponer, nombrar, ordenar, poner. Es uno de los verbos más versátiles del hebreo bíblico. En Éxodo 1 describe la acción de "poner/establecer" capataces sobre el pueblo (v.11), pero el mismo verbo subyace al plan que Faraón propone en el v.10: disponer una estrategia sabia contra Israel. Aparece también en el establecimiento de pactos, leyes y mandatos divinos a lo largo del AT.',
    occurrencesCount: 589,
    relatedVerses: ['Éxodo 1:10', 'Éxodo 1:11', 'Génesis 2:8', 'Deuteronomio 1:13'],
  },

  H7225: {
    id: 'H7225',
    testament: 'OT',
    lemmaOriginal: 'רֵאשִׁית',
    transliteration: "re'shiyth",
    language: 'Hebrew',
    grammarCategory: 'Sustantivo femenino',
    shortDefinition: 'Principio, primicias, lo primero',
    longDefinition:
      'Del mismo radical que H7218; el principio, en el lugar o tiempo más importante; también (adverbialmente) antes: principio, primicias, lo primero. Usado 51 veces para denotar el inicio de algo, o la primera parte de algo, como las primicias de la cosecha.',
    occurrencesCount: 51,
    relatedVerses: ['Génesis 1:1', 'Proverbios 8:22', 'Isaías 46:10'],
  },

  H430: {
    id: 'H430',
    testament: 'OT',
    lemmaOriginal: 'אֱלֹהִים',
    transliteration: "'elohiym",
    language: 'Hebrew',
    grammarCategory: 'Sustantivo masculino plural',
    shortDefinition: 'Dios, dioses, seres divinos, poderosos',
    longDefinition:
      "Plural de H433; dioses en el sentido ordinario; pero específicamente usado (en el plural, así expresando majestad) del Dios Supremo; ocasionalmente aplicado por deferencia a magistrados; y a veces como superlativo: ángeles, Dios (dioses). Forma plural que expresa la plenitud y majestad de Dios.",
    occurrencesCount: 2606,
    relatedVerses: ['Génesis 1:1', 'Deuteronomio 6:4', 'Salmos 82:6'],
  },

  H1254: {
    id: 'H1254',
    testament: 'OT',
    lemmaOriginal: 'בָּרָא',
    transliteration: "bara'",
    language: 'Hebrew',
    grammarCategory: 'Verbo',
    shortDefinition: 'Crear, formar, hacer (algo nuevo)',
    longDefinition:
      'Un verbo primitivo; (absolutamente) crear; (calificado) cortar, talar, despachar: crear, hacer, elegir, alimentar. Este verbo es usado exclusivamente para la actividad creadora de Dios, nunca para la creación humana. Siempre implica producir algo nuevo y sin precedentes.',
    occurrencesCount: 54,
    relatedVerses: ['Génesis 1:1', 'Génesis 1:27', 'Isaías 45:18'],
  },

  H8064: {
    id: 'H8064',
    testament: 'OT',
    lemmaOriginal: 'שָׁמַיִם',
    transliteration: 'shamayim',
    language: 'Hebrew',
    grammarCategory: 'Sustantivo masculino dual',
    shortDefinition: 'Cielos, firmamento, morada de Dios',
    longDefinition:
      'Dual de un primitivo singular שָׁמֶה shameh; cielo o firmamento (como el lugar elevado): aire, astros, cielos. Término siempre en forma dual o plural, indicando la vasta extensión de los cielos. Incluye tanto el cielo atmosférico como el espiritual.',
    occurrencesCount: 421,
    relatedVerses: ['Génesis 1:1', 'Salmos 19:1', 'Isaías 55:9'],
  },

  H776: {
    id: 'H776',
    testament: 'OT',
    lemmaOriginal: 'אֶרֶץ',
    transliteration: "'erets",
    language: 'Hebrew',
    grammarCategory: 'Sustantivo femenino',
    shortDefinition: 'Tierra, suelo, nación, mundo',
    longDefinition:
      'De un radical no usado; la tierra (en el sentido de ser firme); el campo; el suelo; también la tierra como país: campo, nación, suelo, tierra. Puede referirse a la tierra física como planeta, al suelo como superficie, o a una región o nación específica.',
    occurrencesCount: 2504,
    relatedVerses: ['Génesis 1:1', 'Salmos 24:1', 'Isaías 6:3'],
  },

  H7462: {
    id: 'H7462',
    testament: 'OT',
    lemmaOriginal: 'רָעָה',
    transliteration: "ra'ah",
    language: 'Hebrew',
    grammarCategory: 'Verbo',
    shortDefinition: 'Apacentar, pastorear, cuidar, guiar',
    longDefinition:
      'Un verbo primitivo; apacentar un rebaño, es decir, pastorear; por extensión, cuidar, guiar, asociarse con (como amigo): apocentar, dar de comer, pastorear. Implica no solo alimentar sino también guiar, proteger y cuidar con diligencia.',
    occurrencesCount: 173,
    relatedVerses: ['Salmos 23:1', 'Ezequiel 34:23', 'Miqueas 5:4'],
  },

  H3068: {
    id: 'H3068',
    testament: 'OT',
    lemmaOriginal: 'יְהוָה',
    transliteration: 'Yehovah',
    language: 'Hebrew',
    grammarCategory: 'Sustantivo propio masculino',
    shortDefinition: 'YHWH — el nombre propio de Dios (Jehová)',
    longDefinition:
      "Del H1961 (verbo 'ser'); (el) Eterno; Jehová, nombre judío de Dios: Jehová, el Eterno. El nombre más sagrado de Dios en el Antiguo Testamento, conocido como el Tetragrámaton (YHWH). Expresa la existencia eterna y auto-suficiente de Dios.",
    occurrencesCount: 6828,
    relatedVerses: ['Salmos 23:1', 'Éxodo 3:14', 'Isaías 42:8'],
  },

  // ── Greek (NT) ──────────────────────────────────────────────────────────────

  G2316: {
    id: 'G2316',
    testament: 'NT',
    lemmaOriginal: 'θεός',
    transliteration: 'theos',
    language: 'Greek',
    grammarCategory: 'Sustantivo masculino',
    shortDefinition: 'Dios, dios, deidad',
    longDefinition:
      "Del latín y griego antiguo deus y theos respectivamente; un dios o divinidad; figuradamente, un magistrado; por excelencia, (the) Dios: Dios, divinamente. Usado más de 1300 veces en el Nuevo Testamento para referirse al único Dios verdadero o, en contextos politeístas, a deidades paganas.",
    occurrencesCount: 1343,
    relatedVerses: ['Juan 3:16', 'Juan 1:1', 'Romanos 1:7'],
  },

  G25: {
    id: 'G25',
    testament: 'NT',
    lemmaOriginal: 'ἀγαπάω',
    transliteration: 'agapaō',
    language: 'Greek',
    grammarCategory: 'Verbo',
    shortDefinition: 'Amar (amor sacrificial, ágape)',
    longDefinition:
      'Quizás de ἄγαν agan (mucho) [o comparar H5689]; amar (en un sentido social o moral): amar, querer. Este amor (ágape) es el amor más elevado, desinteresado y sacrificial, distinto del amor romántico (eros) o fraternal (phileo). Es el amor que dio a su Hijo unigénito.',
    occurrencesCount: 143,
    relatedVerses: ['Juan 3:16', 'Romanos 8:37', '1 Juan 4:8'],
  },

  G2889: {
    id: 'G2889',
    testament: 'NT',
    lemmaOriginal: 'κόσμος',
    transliteration: 'kosmos',
    language: 'Greek',
    grammarCategory: 'Sustantivo masculino',
    shortDefinition: 'Mundo, orden, universo, humanidad',
    longDefinition:
      'Probablemente del H3634 (comparar H3633); un estado de cosas ordenado y arreglado, es decir, (por extensión) el mundo (en un sentido amplio o literal): mundo. En el NT puede referirse al universo físico, a la humanidad en general, o al sistema de valores contrario a Dios.',
    occurrencesCount: 187,
    relatedVerses: ['Juan 3:16', 'Juan 1:10', '1 Juan 2:15'],
  },

  G3439: {
    id: 'G3439',
    testament: 'NT',
    lemmaOriginal: 'μονογενής',
    transliteration: 'monogenēs',
    language: 'Greek',
    grammarCategory: 'Adjetivo',
    shortDefinition: 'Unigénito, único en su clase',
    longDefinition:
      'De G3441 y G1096; de nacimiento único, es decir, solo hijo: unigénito. Enfatiza la unicidad y el carácter especial del Hijo. No significa necesariamente "engendrado solo", sino "único en su clase". Aparece 9 veces en el NT, 5 de las cuales se refieren a Jesús.',
    occurrencesCount: 9,
    relatedVerses: ['Juan 3:16', 'Juan 1:14', 'Juan 1:18'],
  },

  G4100: {
    id: 'G4100',
    testament: 'NT',
    lemmaOriginal: 'πιστεύω',
    transliteration: 'pisteuō',
    language: 'Greek',
    grammarCategory: 'Verbo',
    shortDefinition: 'Creer, confiar, tener fe',
    longDefinition:
      'De G4102; tener fe (en, sobre, con referencia a, una persona o cosa), es decir, creer; por implicación, confiar (en, a): creer, comprometerse, confiar. En Juan, este verbo aparece 98 veces y es central al evangelio: la fe que salva no es solo asentimiento intelectual sino confianza activa y compromiso personal.',
    occurrencesCount: 248,
    relatedVerses: ['Juan 3:16', 'Juan 20:31', 'Romanos 10:9'],
  },

  G166: {
    id: 'G166',
    testament: 'NT',
    lemmaOriginal: 'αἰώνιος',
    transliteration: 'aiōnios',
    language: 'Greek',
    grammarCategory: 'Adjetivo',
    shortDefinition: 'Eterno, sin principio ni fin, de la era venidera',
    longDefinition:
      'De G165; perpetuo (también pasado; o futuro): eterno, por siempre (eterno), mundo sin fin. La vida aiōnios es la vida de la era venidera del reino de Dios, que comienza en el creyente en el momento de la fe y continúa para siempre.',
    occurrencesCount: 71,
    relatedVerses: ['Juan 3:16', 'Juan 17:3', 'Romanos 6:23'],
  },

  G3056: {
    id: 'G3056',
    testament: 'NT',
    lemmaOriginal: 'λόγος',
    transliteration: 'logos',
    language: 'Greek',
    grammarCategory: 'Sustantivo masculino',
    shortDefinition: 'Palabra, discurso, razón, el Verbo (Cristo)',
    longDefinition:
      "De G3004; algo dicho (incluyendo el pensamiento); por implicación, un tema (discurso, razón o razonamiento, motivo); por extensión, Cristo (como la expresión de Dios): cuenta, comunicación, ...comunión, doctrina, fama, la Palabra. En Juan 1:1 se usa para designar a Jesucristo como la eterna auto-expresión de Dios.",
    occurrencesCount: 330,
    relatedVerses: ['Juan 1:1', 'Juan 1:14', 'Apocalipsis 19:13'],
  },

  G4982: {
    id: 'G4982',
    testament: 'NT',
    lemmaOriginal: 'σῴζω',
    transliteration: 'sōzō',
    language: 'Greek',
    grammarCategory: 'Verbo',
    shortDefinition: 'Salvar, sanar, rescatar, preservar',
    longDefinition:
      'De un primitivo σῶς sōs (contraído; seguro): salvar, es decir, ofrecer o efectuar salvación: curar, preservar, salvo (hacer), hacer toda la diferencia. Abarca salvación espiritual, sanidad física y liberación de peligro. En el NT, principalmente describe la obra salvadora de Cristo.',
    occurrencesCount: 106,
    relatedVerses: ['Juan 3:17', 'Romanos 10:9', 'Efesios 2:8'],
  },
};

// ─── Verse Word Links ──────────────────────────────────────────────────────────
// Each entry maps verseId → array of word links.
// Words are identified by their 0-based index in the tokenized verse.
// These are mapped to the RVR60 Spanish text.

export const VERSE_STRONG_LINKS: VerseStrongMap = {
  // Génesis 1:1 — "En el principio creó Dios los cielos y la tierra."
  // Tokens:  0:En 1:el 2:principio 3:creó 4:Dios 5:los 6:cielos 7:y 8:la 9:tierra.
  GEN_1_1: [
    { verseId: 'GEN_1_1', wordIndex: 2, displayedWord: 'principio', strongId: 'H7225' },
    { verseId: 'GEN_1_1', wordIndex: 3, displayedWord: 'creó',      strongId: 'H1254' },
    { verseId: 'GEN_1_1', wordIndex: 4, displayedWord: 'Dios',      strongId: 'H430'  },
    { verseId: 'GEN_1_1', wordIndex: 6, displayedWord: 'cielos',    strongId: 'H8064' },
    { verseId: 'GEN_1_1', wordIndex: 9, displayedWord: 'tierra',    strongId: 'H776'  },
  ],

  // Génesis 1:2 — "Y la tierra estaba desordenada y vacía..."
  // Tokens: 0:Y 1:la 2:tierra 3:estaba ...
  GEN_1_2: [
    { verseId: 'GEN_1_2', wordIndex: 2, displayedWord: 'tierra', strongId: 'H776' },
  ],

  // Éxodo 1:10 — "Ahora, pues, seamos sabios [3†] para con él, para que no se multiplique..."
  // Texto real RVR60 con nota footnote [3†] en posición 4.
  // Tokens: 0:Ahora, 1:pues, 2:seamos 3:sabios 4:[3†] 5:para 6:con 7:él, ...
  // H7760 (שׂוּם) subyace al acto de Faraón de "establecer/disponer" un plan contra Israel.
  // TODO: con dataset real, mapear también las formas verbales de v.11 ("pusieron capataces").
  EXO_1_10: [
    { verseId: 'EXO_1_10', wordIndex: 2, displayedWord: 'seamos', strongId: 'H7760' },
  ],

  // Salmos 23:1 — "Jehová es mi pastor; nada me faltará."
  // Tokens: 0:Jehová 1:es 2:mi 3:pastor; 4:nada 5:me 6:faltará.
  PSA_23_1: [
    { verseId: 'PSA_23_1', wordIndex: 0, displayedWord: 'Jehová',  strongId: 'H3068' },
    { verseId: 'PSA_23_1', wordIndex: 3, displayedWord: 'pastor',  strongId: 'H7462' },
  ],

  // Juan 1:1 — "En el principio era el Verbo, y el Verbo era con Dios, y el Verbo era Dios."
  // Tokens: 0:En 1:el 2:principio 3:era 4:el 5:Verbo, 6:y 7:el 8:Verbo 9:era 10:con 11:Dios, 12:y 13:el 14:Verbo 15:era 16:Dios.
  JHN_1_1: [
    { verseId: 'JHN_1_1', wordIndex: 5,  displayedWord: 'Verbo', strongId: 'G3056' },
    { verseId: 'JHN_1_1', wordIndex: 8,  displayedWord: 'Verbo', strongId: 'G3056' },
    { verseId: 'JHN_1_1', wordIndex: 11, displayedWord: 'Dios',  strongId: 'G2316' },
    { verseId: 'JHN_1_1', wordIndex: 14, displayedWord: 'Verbo', strongId: 'G3056' },
    { verseId: 'JHN_1_1', wordIndex: 16, displayedWord: 'Dios',  strongId: 'G2316' },
  ],

  // Juan 3:16 — "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito..."
  // Tokens: 0:Porque 1:de 2:tal 3:manera 4:amó 5:Dios 6:al 7:mundo, 8:que 9:ha 10:dado 11:a 12:su 13:Hijo 14:unigénito, 15:para 16:que 17:todo 18:aquel 19:que 20:en 21:él 22:cree, 23:no 24:se 25:pierda, 26:mas 27:tenga 28:vida 29:eterna.
  JHN_3_16: [
    { verseId: 'JHN_3_16', wordIndex: 4,  displayedWord: 'amó',        strongId: 'G25'   },
    { verseId: 'JHN_3_16', wordIndex: 5,  displayedWord: 'Dios',       strongId: 'G2316' },
    { verseId: 'JHN_3_16', wordIndex: 7,  displayedWord: 'mundo',      strongId: 'G2889' },
    { verseId: 'JHN_3_16', wordIndex: 14, displayedWord: 'unigénito',  strongId: 'G3439' },
    { verseId: 'JHN_3_16', wordIndex: 22, displayedWord: 'cree',       strongId: 'G4100' },
    { verseId: 'JHN_3_16', wordIndex: 29, displayedWord: 'eterna',     strongId: 'G166'  },
  ],

  // Romanos 8:28 — "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien..."
  ROM_8_28: [
    { verseId: 'ROM_8_28', wordIndex: 5,  displayedWord: 'aman',  strongId: 'G25'   },
    { verseId: 'ROM_8_28', wordIndex: 7,  displayedWord: 'Dios',  strongId: 'G2316' },
  ],
};

// ─── Favorites storage key ────────────────────────────────────────────────────
// TODO: Replace with backend-persisted favorites when real dataset is available
export const STRONG_FAVORITES_KEY = 'strong_favorites_v1';
