// Types and helpers for the devocionales-json repository format
// https://github.com/develop4God/devocionales-json

import type { Devotional } from './types';

export interface ParaMeditar {
  cita: string;
  texto: string;
}

export interface RepoDevocional {
  id: string;
  date: string;
  language: string;
  version: string;
  versiculo: string;
  reflexion: string;
  para_meditar: ParaMeditar[];
  oracion: string;
  tags: string[];
}

// Parse versiculo format: "Book Chapter:Verse VERSION: \"text\""
export function parseVersiculo(versiculo: string): { reference: string; version: string; text: string } {
  // Match: "Hebreos 5:8-9 RVR1960: \"text\""
  // Version must start with a letter (e.g. RVR1960, NVI, KJV) to avoid matching chapter numbers
  const match = versiculo.match(/^(.+?)\s+([A-Z][A-Z0-9]+):\s*"?([\s\S]+?)"?\s*$/);
  if (match) {
    return {
      reference: match[1].trim(),
      version: match[2].trim(),
      text: match[3].trim().replace(/\\"/g, '"'),
    };
  }
  return { reference: '', version: '', text: versiculo };
}

// Map RepoDevocional → Devotional (for ShareSheet compatibility)
export function repoToDevotional(d: RepoDevocional, imageUrl: string): Devotional {
  const { reference, text } = parseVersiculo(d.versiculo);
  const meditacionText = d.para_meditar
    .map((v) => `${v.cita}: ${v.texto}`)
    .join('\n\n');
  return {
    date: d.date,
    title: d.tags[0] ?? 'Devocional',
    titleEs: d.tags[0] ?? 'Devocional',
    imageUrl,
    bibleVerse: text,
    bibleVerseEs: text,
    bibleReference: reference,
    bibleReferenceEs: reference,
    reflection: d.reflexion,
    reflectionEs: d.reflexion,
    story: meditacionText,
    storyEs: meditacionText,
    biblicalCharacter: '',
    biblicalCharacterEs: '',
    application: '',
    applicationEs: '',
    prayer: d.oracion,
    prayerEs: d.oracion,
    topic: d.tags.join(', '),
    topicEs: d.tags.join(', '),
  };
}

// Sample devotional from the repo (2026-08-01 entry)
export const SAMPLE_DEVOCIONAL: RepoDevocional = {
  id: 'hebreos589RVR1960',
  date: '2026-08-01',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Hebreos 5:8-9 RVR1960: "Y aunque era Hijo, por lo que padeció aprendió la obediencia; y habiendo sido perfeccionado, vino a ser autor de eterna salvación para todos los que le obedecen."',
  reflexion:
    'Este pasaje de Hebreos nos ofrece una profunda revelación sobre la humanidad y divinidad de Jesucristo. A pesar de ser el Hijo de Dios, experimentó el sufrimiento y, a través de él, aprendió la obediencia. Este aprendizaje no disminuye su divinidad, sino que la exalta, pues demuestra su total sometimiento a la voluntad del Padre.\n\nJesús no necesitó aprender la obediencia en el sentido literal; más bien, la perfeccionó a través de su sufrimiento y sacrificio. Este proceso de "perfeccionamiento" no implica una falta de perfección inicial, sino la culminación de su misión redentora.\n\nLa obediencia de Cristo, forjada en el crisol del sufrimiento, se convierte en la fuente de salvación eterna para todos los que le obedecen. Nos invita a reflexionar sobre la importancia de la obediencia, no como una carga, sino como un camino hacia la madurez espiritual y la participación en la gracia salvadora de Dios.',
  para_meditar: [
    {
      cita: 'Filipenses 2:8',
      texto:
        'Y estando en la condición de hombre, se humilló a sí mismo, haciéndose obediente hasta la muerte, y muerte de cruz.',
    },
    {
      cita: 'Romanos 5:19',
      texto:
        'Porque como por la desobediencia de un hombre los muchos fueron constituidos pecadores, así también por la obediencia de uno, los muchos serán constituidos justos.',
    },
    {
      cita: 'Juan 14:15',
      texto: 'Si me amáis, guardad mis mandamientos.',
    },
  ],
  oracion:
    'Padre celestial, te agradezco por el ejemplo de obediencia de tu Hijo Jesucristo. Reconozco que, como Él, el sufrimiento puede ser un camino para aprender y crecer en la fe. Ayúdame a aceptar las pruebas con humildad y a buscar tu voluntad en cada situación.\n\nDame la fortaleza para obedecer tus mandamientos, sabiendo que en la obediencia encuentro la verdadera salvación. Permíteme comprender que la obediencia no es una carga, sino una expresión de amor y un camino hacia la madurez espiritual. Guíame a través de las dificultades y enséñame a confiar en tu plan perfecto.\n\nQue mi vida refleje la obediencia de Jesús, y que pueda ser un testimonio de tu amor y gracia. En el nombre de Jesús, amén.',
  tags: ['Obediencia', 'Sufrimiento', 'Salvación'],
};

export const REPO_DEFAULT_IMAGE =
  'https://raw.githubusercontent.com/develop4God/Devocionales-assets/main/images/devocional_default.jpg';
