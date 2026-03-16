// Duelo de Sabiduría — Bible Trivia Questions Dataset

export type DuelCategory =
  | 'vida_jesus'
  | 'milagros'
  | 'profetas'
  | 'reyes'
  | 'personajes'
  | 'versiculos'
  | 'antiguo_testamento'
  | 'nuevo_testamento';

export interface DuelQuestion {
  id: string;
  category: DuelCategory;
  questionEs: string;
  options: [string, string, string, string]; // exactly 4 options
  correctIndex: 0 | 1 | 2 | 3; // index of the correct answer
}

export const DUEL_QUESTIONS: DuelQuestion[] = [
  // VIDA DE JESÚS
  {
    id: 'vj_001',
    category: 'vida_jesus',
    questionEs: '¿En qué ciudad nació Jesús?',
    options: ['Nazaret', 'Jerusalén', 'Belén', 'Jericó'],
    correctIndex: 2,
  },
  {
    id: 'vj_002',
    category: 'vida_jesus',
    questionEs: '¿Cuántos años tenía Jesús cuando comenzó su ministerio público?',
    options: ['25 años', '30 años', '33 años', '40 años'],
    correctIndex: 1,
  },
  {
    id: 'vj_003',
    category: 'vida_jesus',
    questionEs: '¿Quién bautizó a Jesús?',
    options: ['Pedro', 'Pablo', 'Juan el Bautista', 'Elías'],
    correctIndex: 2,
  },
  {
    id: 'vj_004',
    category: 'vida_jesus',
    questionEs: '¿En qué río fue bautizado Jesús?',
    options: ['Jordán', 'Nilo', 'Éufrates', 'Galilea'],
    correctIndex: 0,
  },
  {
    id: 'vj_005',
    category: 'vida_jesus',
    questionEs: '¿Cuántos días estuvo Jesús en el desierto siendo tentado?',
    options: ['20 días', '30 días', '40 días', '7 días'],
    correctIndex: 2,
  },
  {
    id: 'vj_006',
    category: 'vida_jesus',
    questionEs: '¿Cuántos apóstoles eligió Jesús?',
    options: ['7', '10', '12', '14'],
    correctIndex: 2,
  },
  {
    id: 'vj_007',
    category: 'vida_jesus',
    questionEs: '¿Quién traicionó a Jesús por 30 monedas de plata?',
    options: ['Pedro', 'Judas Iscariote', 'Tomás', 'Bartolomé'],
    correctIndex: 1,
  },
  {
    id: 'vj_008',
    category: 'vida_jesus',
    questionEs: '¿Cuál fue la primera señal que hizo Jesús según el Evangelio de Juan?',
    options: ['Resucitar a Lázaro', 'Curar a un ciego', 'Convertir el agua en vino', 'Caminar sobre el agua'],
    correctIndex: 2,
  },

  // MILAGROS
  {
    id: 'mi_001',
    category: 'milagros',
    questionEs: '¿A cuántas personas alimentó Jesús con 5 panes y 2 peces?',
    options: ['2,000', '3,000', '5,000', '10,000'],
    correctIndex: 2,
  },
  {
    id: 'mi_002',
    category: 'milagros',
    questionEs: '¿A quién resucitó Jesús después de 4 días en el sepulcro?',
    options: ['Jairo', 'Lázaro', 'Tabita', 'Eutico'],
    correctIndex: 1,
  },
  {
    id: 'mi_003',
    category: 'milagros',
    questionEs: '¿Qué profeta dividió las aguas del Mar Rojo?',
    options: ['Elías', 'Josué', 'Moisés', 'Samuel'],
    correctIndex: 2,
  },
  {
    id: 'mi_004',
    category: 'milagros',
    questionEs: '¿Qué milagro hizo Elías en el monte Carmelo?',
    options: ['Dividió el río Jordán', 'Hizo descender fuego del cielo', 'Resucitó a un muerto', 'Multiplicó el aceite'],
    correctIndex: 1,
  },
  {
    id: 'mi_005',
    category: 'milagros',
    questionEs: '¿Quién caminó sobre el agua junto a Jesús?',
    options: ['Juan', 'Santiago', 'Andrés', 'Pedro'],
    correctIndex: 3,
  },
  {
    id: 'mi_006',
    category: 'milagros',
    questionEs: '¿Cuántos leprosos fueron sanados por Jesús de los cuales solo uno regresó a agradecer?',
    options: ['5', '7', '10', '12'],
    correctIndex: 2,
  },
  {
    id: 'mi_007',
    category: 'milagros',
    questionEs: '¿Cómo llamó Dios a Moisés desde la zarza ardiente?',
    options: ['Por nombre dos veces', 'Con un rayo de luz', 'A través de un ángel', 'En sueños'],
    correctIndex: 0,
  },

  // PROFETAS
  {
    id: 'pr_001',
    category: 'profetas',
    questionEs: '¿En qué libro bíblico se encuentra la profecía "En el principio era el Verbo"?',
    options: ['Isaías', 'Génesis', 'Juan', 'Apocalipsis'],
    correctIndex: 2,
  },
  {
    id: 'pr_002',
    category: 'profetas',
    questionEs: '¿Qué profeta fue tragado por un pez grande?',
    options: ['Amós', 'Jonás', 'Nahúm', 'Habacuc'],
    correctIndex: 1,
  },
  {
    id: 'pr_003',
    category: 'profetas',
    questionEs: '¿Cuántos días estuvo Jonás en el vientre del gran pez?',
    options: ['1 día', '2 días', '3 días', '7 días'],
    correctIndex: 2,
  },
  {
    id: 'pr_004',
    category: 'profetas',
    questionEs: '¿Qué profeta anunció "una virgen concebirá y dará a luz un hijo"?',
    options: ['Jeremías', 'Ezequiel', 'Daniel', 'Isaías'],
    correctIndex: 3,
  },
  {
    id: 'pr_005',
    category: 'profetas',
    questionEs: '¿Qué profeta fue llevado al cielo en un carro de fuego?',
    options: ['Elías', 'Enoc', 'Eliseo', 'Ezequiel'],
    correctIndex: 0,
  },
  {
    id: 'pr_006',
    category: 'profetas',
    questionEs: '¿Qué profeta fue lanzado al foso de los leones?',
    options: ['Isaías', 'Jeremías', 'Daniel', 'Ezequiel'],
    correctIndex: 2,
  },

  // REYES
  {
    id: 're_001',
    category: 'reyes',
    questionEs: '¿Quién fue el primer rey de Israel?',
    options: ['David', 'Saúl', 'Salomón', 'Roboam'],
    correctIndex: 1,
  },
  {
    id: 're_002',
    category: 'reyes',
    questionEs: '¿Cuántos años reinó Salomón sobre Israel?',
    options: ['20 años', '30 años', '40 años', '50 años'],
    correctIndex: 2,
  },
  {
    id: 're_003',
    category: 'reyes',
    questionEs: '¿Quién construyó el primer templo de Jerusalén?',
    options: ['David', 'Salomón', 'Ezequías', 'Josías'],
    correctIndex: 1,
  },
  {
    id: 're_004',
    category: 'reyes',
    questionEs: '¿Con qué mató David a Goliat?',
    options: ['Una espada', 'Una lanza', 'Una honda y una piedra', 'Sus manos desnudas'],
    correctIndex: 2,
  },
  {
    id: 're_005',
    category: 'reyes',
    questionEs: '¿Qué don pidió Salomón a Dios?',
    options: ['Riquezas', 'Sabiduría', 'Larga vida', 'Victoria en la guerra'],
    correctIndex: 1,
  },
  {
    id: 're_006',
    category: 'reyes',
    questionEs: '¿Quién ungió a David como rey de Israel?',
    options: ['Elías', 'Moisés', 'Samuel', 'Natán'],
    correctIndex: 2,
  },

  // PERSONAJES BÍBLICOS
  {
    id: 'pe_001',
    category: 'personajes',
    questionEs: '¿Quién fue la primera mujer según la Biblia?',
    options: ['Sara', 'Rebeca', 'Eva', 'Raquel'],
    correctIndex: 2,
  },
  {
    id: 'pe_002',
    category: 'personajes',
    questionEs: '¿Cuántos años vivió Matusalén, el hombre más longevo de la Biblia?',
    options: ['800 años', '899 años', '969 años', '1000 años'],
    correctIndex: 2,
  },
  {
    id: 'pe_003',
    category: 'personajes',
    questionEs: '¿Quién fue el padre de Abraham?',
    options: ['Noé', 'Sem', 'Taré', 'Nacor'],
    correctIndex: 2,
  },
  {
    id: 'pe_004',
    category: 'personajes',
    questionEs: '¿Qué nombre le dio Dios a Abram?',
    options: ['Israel', 'Abraham', 'Isaac', 'Jacob'],
    correctIndex: 1,
  },
  {
    id: 'pe_005',
    category: 'personajes',
    questionEs: '¿Cuántos hijos tuvo Jacob, que forman las tribus de Israel?',
    options: ['10', '11', '12', '13'],
    correctIndex: 2,
  },
  {
    id: 'pe_006',
    category: 'personajes',
    questionEs: '¿Quién interpretó los sueños del faraón en Egipto?',
    options: ['Moisés', 'José', 'Daniel', 'Samuel'],
    correctIndex: 1,
  },
  {
    id: 'pe_007',
    category: 'personajes',
    questionEs: '¿Quién fue la suegra de Rut?',
    options: ['Noemí', 'Débora', 'Ana', 'Ester'],
    correctIndex: 0,
  },

  // VERSÍCULOS CONOCIDOS
  {
    id: 've_001',
    category: 'versiculos',
    questionEs: '¿Qué versículo dice "Todo lo puedo en Cristo que me fortalece"?',
    options: ['Romanos 8:28', 'Filipenses 4:13', 'Juan 3:16', 'Salmo 23:1'],
    correctIndex: 1,
  },
  {
    id: 've_002',
    category: 'versiculos',
    questionEs: '¿Cómo comienza el Salmo 23?',
    options: ['"Bendito sea el Señor"', '"El Señor es mi pastor"', '"Porque de tal manera amó Dios"', '"Toda la Escritura es útil"'],
    correctIndex: 1,
  },
  {
    id: 've_003',
    category: 'versiculos',
    questionEs: '¿Qué libro comienza con "En el principio creó Dios los cielos y la tierra"?',
    options: ['Job', 'Salmos', 'Génesis', 'Juan'],
    correctIndex: 2,
  },
  {
    id: 've_004',
    category: 'versiculos',
    questionEs: '¿Qué versículo dice "Porque tanto amó Dios al mundo que dio a su Hijo unigénito"?',
    options: ['Juan 1:1', 'Juan 3:16', 'Juan 14:6', 'Romanos 5:8'],
    correctIndex: 1,
  },
  {
    id: 've_005',
    category: 'versiculos',
    questionEs: '¿Qué versículo dice "Yo soy el camino, la verdad y la vida"?',
    options: ['Juan 10:10', 'Juan 11:25', 'Juan 14:6', 'Juan 15:5'],
    correctIndex: 2,
  },

  // ANTIGUO TESTAMENTO
  {
    id: 'at_001',
    category: 'antiguo_testamento',
    questionEs: '¿Cuántos días tardó Dios en crear el mundo según Génesis?',
    options: ['5 días', '6 días', '7 días', '10 días'],
    correctIndex: 1,
  },
  {
    id: 'at_002',
    category: 'antiguo_testamento',
    questionEs: '¿Cuántas plagas envió Dios sobre Egipto?',
    options: ['7', '8', '10', '12'],
    correctIndex: 2,
  },
  {
    id: 'at_003',
    category: 'antiguo_testamento',
    questionEs: '¿Qué árbol no podían comer Adán y Eva en el Edén?',
    options: ['El árbol de la vida', 'El árbol del bien y del mal', 'El árbol de los olivos', 'El árbol de la sabiduría'],
    correctIndex: 1,
  },
  {
    id: 'at_004',
    category: 'antiguo_testamento',
    questionEs: '¿Cuántos años pasó el pueblo de Israel en el desierto?',
    options: ['20 años', '30 años', '40 años', '50 años'],
    correctIndex: 2,
  },
  {
    id: 'at_005',
    category: 'antiguo_testamento',
    questionEs: '¿En qué monte recibió Moisés los Diez Mandamientos?',
    options: ['Monte Sión', 'Monte Carmelo', 'Monte Sinaí', 'Monte Hermón'],
    correctIndex: 2,
  },
  {
    id: 'at_006',
    category: 'antiguo_testamento',
    questionEs: '¿Cuántos libros tiene el Antiguo Testamento?',
    options: ['27', '33', '39', '46'],
    correctIndex: 2,
  },

  // NUEVO TESTAMENTO
  {
    id: 'nt_001',
    category: 'nuevo_testamento',
    questionEs: '¿Cuántos Evangelios hay en el Nuevo Testamento?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
  },
  {
    id: 'nt_002',
    category: 'nuevo_testamento',
    questionEs: '¿Quién escribió el libro de Apocalipsis?',
    options: ['Pedro', 'Pablo', 'Juan', 'Santiago'],
    correctIndex: 2,
  },
  {
    id: 'nt_003',
    category: 'nuevo_testamento',
    questionEs: '¿Cuántas cartas (epístolas) escribió Pablo en el Nuevo Testamento?',
    options: ['10', '13', '14', '7'],
    correctIndex: 1,
  },
  {
    id: 'nt_004',
    category: 'nuevo_testamento',
    questionEs: '¿En qué ciudad ocurrió Pentecostés, cuando descendió el Espíritu Santo?',
    options: ['Belén', 'Nazaret', 'Jerusalén', 'Antioquía'],
    correctIndex: 2,
  },
  {
    id: 'nt_005',
    category: 'nuevo_testamento',
    questionEs: '¿Cómo se llamaba el apóstol que dudó de la resurrección de Jesús?',
    options: ['Mateo', 'Marcos', 'Tomás', 'Felipe'],
    correctIndex: 2,
  },
  {
    id: 'nt_006',
    category: 'nuevo_testamento',
    questionEs: '¿Cuántos libros tiene el Nuevo Testamento?',
    options: ['24', '25', '27', '29'],
    correctIndex: 2,
  },
  {
    id: 'nt_007',
    category: 'nuevo_testamento',
    questionEs: '¿En qué isla estuvo Pablo prisionero cuando escribió el Apocalipsis? (Nota: era Juan)',
    options: ['Chipre', 'Patmos', 'Creta', 'Malta'],
    correctIndex: 1,
  },
  {
    id: 'nt_008',
    category: 'nuevo_testamento',
    questionEs: '¿Cuál fue la última cena que Jesús compartió con sus apóstoles?',
    options: ['La Cena de Bodas', 'La Última Cena de Pascua', 'La Fiesta del Tabernáculo', 'El Banquete de Jericó'],
    correctIndex: 1,
  },
];

/**
 * Returns a shuffled selection of questions for a duel.
 * Picks up to `count` questions, balanced across categories when possible.
 */
export function getRandomDuelQuestions(count = 10): DuelQuestion[] {
  const shuffled = [...DUEL_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export const CATEGORY_LABELS_ES: Record<DuelCategory, string> = {
  vida_jesus: 'Vida de Jesús',
  milagros: 'Milagros',
  profetas: 'Profetas',
  reyes: 'Reyes',
  personajes: 'Personajes Bíblicos',
  versiculos: 'Versículos',
  antiguo_testamento: 'Antiguo Testamento',
  nuevo_testamento: 'Nuevo Testamento',
};
