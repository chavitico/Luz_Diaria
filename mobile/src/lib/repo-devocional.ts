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

// Map two RepoDevocionals (ES + EN) → single bilingual Devotional for library use
export function repoToDevotionalBilingual(
  es: RepoDevocional,
  en: RepoDevocional,
  imageUrl: string,
  date?: string,
): Devotional {
  const { reference: refEs, text: textEs } = parseVersiculo(es.versiculo);
  const { reference: refEn, text: textEn } = parseVersiculo(en.versiculo);
  const meditacionEs = es.para_meditar.map((v) => `${v.cita}: ${v.texto}`).join('\n\n');
  const meditacionEn = en.para_meditar.map((v) => `${v.cita}: ${v.texto}`).join('\n\n');
  return {
    date: date ?? es.date,
    title: en.tags[0] ?? 'Devotional',
    titleEs: es.tags[0] ?? 'Devocional',
    imageUrl,
    bibleVerse: textEn,
    bibleVerseEs: textEs,
    bibleReference: refEn,
    bibleReferenceEs: refEs,
    reflection: en.reflexion,
    reflectionEs: es.reflexion,
    story: meditacionEn,
    storyEs: meditacionEs,
    biblicalCharacter: '',
    biblicalCharacterEs: '',
    application: '',
    applicationEs: '',
    prayer: en.oracion,
    prayerEs: es.oracion,
    topic: en.tags[0] ?? '',
    topicEs: es.tags[0] ?? '',
    source: 'repo',
  };
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
    topic: d.tags[0] ?? '',
    topicEs: d.tags[0] ?? '',
  };
}

export const REPO_DEFAULT_IMAGE =
  'https://raw.githubusercontent.com/develop4God/Devocionales-assets/main/images/devocional_default.jpg';

// ─── 2026-04-29: Obediencia / Obedience ──────────────────────────────────────

export const SAMPLE_DEVOCIONAL: RepoDevocional = {
  id: 'hebreos589RVR1960',
  date: '2026-04-29',
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
  tags: ['Obediencia'],
};

export const SAMPLE_DEVOCIONAL_EN: RepoDevocional = {
  id: 'hebrews589KJV',
  date: '2026-04-29',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Hebrews 5:8-9 KJV: "Though he were a Son, yet learned he obedience by the things which he suffered; And being made perfect, he became the author of eternal salvation unto all them that obey him."',
  reflexion:
    'This passage from Hebrews offers a profound revelation about the humanity and divinity of Jesus Christ. Despite being the Son of God, He experienced suffering and through it learned obedience. This learning does not diminish His divinity, but exalts it, for it demonstrates His total submission to the Father\'s will.\n\nJesus did not need to learn obedience in the literal sense; rather, He perfected it through His suffering and sacrifice. This process of "perfecting" does not imply an initial lack of perfection, but the culmination of His redemptive mission.\n\nThe obedience of Christ, forged in the crucible of suffering, becomes the source of eternal salvation for all who obey Him. It invites us to reflect on the importance of obedience — not as a burden, but as a path toward spiritual maturity and participation in God\'s saving grace.',
  para_meditar: [
    {
      cita: 'Philippians 2:8',
      texto:
        'And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross.',
    },
    {
      cita: 'Romans 5:19',
      texto:
        "For as by one man's disobedience many were made sinners, so by the obedience of one shall many be made righteous.",
    },
    {
      cita: 'John 14:15',
      texto: 'If ye love me, keep my commandments.',
    },
  ],
  oracion:
    "Heavenly Father, I thank You for the example of obedience of Your Son Jesus Christ. I recognize that, like Him, suffering can be a path to learning and growing in faith. Help me to accept trials with humility and to seek Your will in every situation.\n\nGive me the strength to obey Your commandments, knowing that in obedience I find true salvation. Allow me to understand that obedience is not a burden, but an expression of love and a path toward spiritual maturity. Guide me through difficulties and teach me to trust in Your perfect plan.\n\nMay my life reflect the obedience of Jesus, and may I be a testimony of Your love and grace. In Jesus' name, amen.",
  tags: ['Obedience'],
};

// ─── 2026-04-30: Gratitud / Gratitude ────────────────────────────────────────

export const DEVOCIONAL_2026_04_30: RepoDevocional = {
  id: 'tesalonicenses518RVR1960',
  date: '2026-04-30',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    '1 Tesalonicenses 5:18 RVR1960: "Dad gracias en todo, porque esta es la voluntad de Dios para con vosotros en Cristo Jesús."',
  reflexion:
    'La gratitud es mucho más que una simple cortesía; es una postura del alma que nos transforma desde adentro. Cuando Pablo escribe "dad gracias en todo", no nos pide que fingamos alegría en medio del dolor, sino que encontremos a Dios incluso en los momentos más difíciles. El agradecimiento genuino actúa como una lente que nos ayuda a ver la presencia de Dios donde antes solo veíamos vacío.\n\nPracticar la gratitud deliberadamente cambia nuestra perspectiva espiritual. Cuando entrenamos nuestros ojos para buscar las bondades de Dios cada día, comenzamos a vivir desde la abundancia y no desde la escasez. Desde ese lugar, somos capaces de dar más, amar mejor y confiar con mayor firmeza en Aquel que nunca nos abandona.',
  para_meditar: [
    {
      cita: 'Salmo 107:1',
      texto: 'Alabad a Jehová, porque él es bueno; porque para siempre es su misericordia.',
    },
    {
      cita: 'Santiago 1:17',
      texto: 'Toda buena dádiva y todo don perfecto desciende de lo alto, del Padre de las luces.',
    },
    {
      cita: 'Colosenses 3:15',
      texto: 'Y la paz de Dios gobierne en vuestros corazones; y sed agradecidos.',
    },
  ],
  oracion:
    'Padre, hoy quiero detenerme y reconocer todo lo que has hecho en mi vida. A veces el ruido del día me impide ver tus bondades, pero sé que están ahí. Por el pan de esta mañana, por la vida que respiro, por las personas que me aman, gracias.\n\nEnséñame a tener ojos de gratitud que vean tu mano incluso en las circunstancias que no entiendo. Que mi corazón sea uno que da gracias no solo cuando todo va bien, sino especialmente en los momentos difíciles, sabiendo que tú estás obrando para bien. En el nombre de Jesús, amén.',
  tags: ['Gratitud'],
};

export const DEVOTIONAL_2026_04_30_EN: RepoDevocional = {
  id: 'thessalonians518KJV',
  date: '2026-04-30',
  language: 'en',
  version: 'KJV',
  versiculo:
    '1 Thessalonians 5:18 KJV: "In every thing give thanks: for this is the will of God in Christ Jesus concerning you."',
  reflexion:
    'Gratitude is far more than a social courtesy; it is a posture of the soul that transforms us from within. When Paul writes "give thanks in everything," he is not asking us to pretend joy in the midst of pain, but to find God even in our most difficult moments. Genuine gratitude acts as a lens that helps us see God\'s presence where we once saw only emptiness.\n\nPracticing gratitude deliberately changes our spiritual perspective. When we train our eyes to seek God\'s goodness each day, we begin to live from abundance rather than scarcity. From that place, we are capable of giving more, loving better, and trusting more firmly in the One who never abandons us.',
  para_meditar: [
    {
      cita: 'Psalm 107:1',
      texto: 'O give thanks unto the LORD, for he is good: for his mercy endureth for ever.',
    },
    {
      cita: 'James 1:17',
      texto: 'Every good gift and every perfect gift is from above, and cometh down from the Father of lights.',
    },
    {
      cita: 'Colossians 3:15',
      texto: 'And let the peace of God rule in your hearts; and be ye thankful.',
    },
  ],
  oracion:
    "Father, today I want to pause and acknowledge everything You have done in my life. Sometimes the noise of the day keeps me from seeing Your goodness, but I know it is there. For the bread of this morning, for the life I breathe, for the people who love me, thank You.\n\nTeach me to have eyes of gratitude that see Your hand even in circumstances I don't understand. May my heart be one that gives thanks not only when everything goes well, but especially in difficult moments, knowing that You are working all things for good. In Jesus' name, amen.",
  tags: ['Gratitude'],
};

// ─── 2026-05-01: Fe / Faith ───────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_01: RepoDevocional = {
  id: 'hebreos111RVR1960',
  date: '2026-05-01',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Hebreos 11:1 RVR1960: "Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve."',
  reflexion:
    'La fe no es la ausencia de dudas, sino la decisión de confiar a pesar de ellas. Hebreos nos dice que la fe es "la certeza de lo que se espera", lo cual significa que opera en el espacio entre la promesa y su cumplimiento. Ese espacio puede sentirse oscuro, pero es precisamente allí donde la fe crece y se fortalece.\n\nMuchos héroes de la Biblia experimentaron largos períodos de espera antes de ver las promesas de Dios cumplidas. Abraham esperó décadas; José pasó años en prisión; David fue ungido rey mucho antes de sentarse en el trono. Sus vidas nos enseñan que la fe no acelera el tiempo de Dios, pero sí nos sostiene dentro de él.',
  para_meditar: [
    {
      cita: 'Santiago 2:17',
      texto: 'Así también la fe, si no tiene obras, es muerta en sí misma.',
    },
    {
      cita: 'Marcos 9:24',
      texto: 'Creo; ayuda mi incredulidad.',
    },
    {
      cita: '2 Corintios 5:7',
      texto: 'Porque por fe andamos, no por vista.',
    },
  ],
  oracion:
    'Señor, a veces caminar por fe se siente como caminar en la oscuridad. No veo el camino completo, no entiendo todos tus planes, y hay momentos en que mis dudas son más ruidosas que mi confianza. Pero hoy vengo a ti con esa fe pequeña que tengo, sabiendo que tú la recibes tal como es.\n\nAyúdame a confiar en tus promesas cuando las circunstancias digan lo contrario. Dame la valentía de dar el próximo paso aunque no vea más allá de él. Y cuando la fe me falte, recuérdame que tú eres fiel, incluso cuando yo no lo soy. En el nombre de Jesús, amén.',
  tags: ['Fe'],
};

export const DEVOTIONAL_2026_05_01_EN: RepoDevocional = {
  id: 'hebrews111KJV',
  date: '2026-05-01',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Hebrews 11:1 KJV: "Now faith is the substance of things hoped for, the evidence of things not seen."',
  reflexion:
    'Faith is not the absence of doubt, but the decision to trust in spite of it. Hebrews tells us that faith is "the substance of things hoped for," meaning it operates in the space between promise and fulfillment. That space can feel dark, but it is precisely there that faith grows and is strengthened.\n\nMany heroes of the Bible experienced long periods of waiting before seeing God\'s promises fulfilled. Abraham waited decades; Joseph spent years in prison; David was anointed king long before sitting on the throne. Their lives teach us that faith does not speed up God\'s timing, but it does sustain us within it.',
  para_meditar: [
    {
      cita: 'James 2:17',
      texto: 'Even so faith, if it hath not works, is dead, being alone.',
    },
    {
      cita: 'Mark 9:24',
      texto: 'Lord, I believe; help thou mine unbelief.',
    },
    {
      cita: '2 Corinthians 5:7',
      texto: 'For we walk by faith, not by sight.',
    },
  ],
  oracion:
    "Lord, sometimes walking by faith feels like walking in the dark. I cannot see the full path, I do not understand all Your plans, and there are moments when my doubts are louder than my trust. But today I come to You with the small faith I have, knowing that You receive it just as it is.\n\nHelp me to trust Your promises when circumstances say otherwise. Give me the courage to take the next step even when I cannot see beyond it. And when faith fails me, remind me that You are faithful, even when I am not. In Jesus' name, amen.",
  tags: ['Faith'],
};

// ─── 2026-05-02: Amor / Love ──────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_02: RepoDevocional = {
  id: 'juan419RVR1960',
  date: '2026-05-02',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    '1 Juan 4:19 RVR1960: "Nosotros le amamos a él, porque él nos amó primero."',
  reflexion:
    '"Nosotros le amamos a él, porque él nos amó primero." Esta verdad es el fundamento de toda vida espiritual. No comenzamos el camino del amor por mérito propio ni por esfuerzo religioso, sino como respuesta a un amor que ya existía antes de que naciéramos. El amor de Dios no está condicionado por nuestro comportamiento; es la causa, no el efecto, de nuestra transformación.\n\nCuando comprendemos que somos amados profunda e incondicionalmente, algo cambia en nosotros. El miedo que nos paraliza comienza a ceder. La vergüenza que nos aísla pierde su poder. El amor de Dios no solo nos perdona; nos rehace desde adentro, dándonos la capacidad de amar a otros con la misma generosidad que hemos recibido.',
  para_meditar: [
    {
      cita: 'Juan 3:16',
      texto: 'Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree no se pierda, mas tenga vida eterna.',
    },
    {
      cita: 'Romanos 8:38-39',
      texto: 'Por lo cual estoy seguro de que ni la muerte, ni la vida, ni ángeles, ni principados... nos podrá separar del amor de Dios.',
    },
    {
      cita: '1 Corintios 13:4',
      texto: 'El amor es sufrido, es benigno; el amor no tiene envidia.',
    },
  ],
  oracion:
    'Padre amoroso, gracias porque me amaste primero. Gracias porque tu amor no dependió de mi perfección ni de mis méritos. En los momentos en que me siento indigno de ser amado, recuérdame que el amor que me ofreces no tiene condiciones ni fecha de expiración.\n\nAyúdame a recibir tu amor profundamente, para poder darlo con generosidad. Que pueda amar a los que me resultan difíciles de amar, a los que me han herido, a los que son diferentes a mí. Que tu amor fluya a través de mí como un río que no se agota. En el nombre de Jesús, amén.',
  tags: ['Amor'],
};

export const DEVOTIONAL_2026_05_02_EN: RepoDevocional = {
  id: 'john419KJV',
  date: '2026-05-02',
  language: 'en',
  version: 'KJV',
  versiculo:
    '1 John 4:19 KJV: "We love him, because he first loved us."',
  reflexion:
    '"We love him, because he first loved us." This truth is the foundation of all spiritual life. We do not begin the journey of love through our own merit or religious effort, but as a response to a love that already existed before we were born. God\'s love is not conditioned by our behavior; it is the cause, not the effect, of our transformation.\n\nWhen we understand that we are deeply and unconditionally loved, something changes within us. The fear that paralyzes us begins to yield. The shame that isolates us loses its power. God\'s love does not only forgive us; it remakes us from within, giving us the capacity to love others with the same generosity we have received.',
  para_meditar: [
    {
      cita: 'John 3:16',
      texto: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    },
    {
      cita: 'Romans 8:38-39',
      texto: 'For I am persuaded, that neither death, nor life, nor angels, nor principalities... shall be able to separate us from the love of God.',
    },
    {
      cita: '1 Corinthians 13:4',
      texto: 'Charity suffereth long, and is kind; charity envieth not.',
    },
  ],
  oracion:
    "Loving Father, thank You for loving me first. Thank You that Your love did not depend on my perfection or my merits. In moments when I feel unworthy of being loved, remind me that the love You offer has no conditions and no expiration date.\n\nHelp me to receive Your love deeply, so that I may give it generously. May I be able to love those who are difficult for me to love, those who have hurt me, those who are different from me. May Your love flow through me like a river that never runs dry. In Jesus' name, amen.",
  tags: ['Love'],
};

// ─── 2026-05-03: Paz / Peace ──────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_03: RepoDevocional = {
  id: 'filipenses47RVR1960',
  date: '2026-05-03',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Filipenses 4:7 RVR1960: "Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús."',
  reflexion:
    'La paz que Dios ofrece es radicalmente diferente a la paz que el mundo conoce. La paz del mundo depende de las circunstancias: cuando todo va bien, hay calma; cuando algo falla, la ansiedad regresa. Pero la paz de Dios, según Pablo, "sobrepasa todo entendimiento", lo cual significa que puede coexistir con el caos, la incertidumbre y el dolor.\n\nEsta paz no es pasividad ni indiferencia. Es el fruto de una relación profunda con Dios, cultivada en la oración y el conocimiento de su Palabra. Cuando llevamos nuestras preocupaciones a Dios con acción de gracias, experimentamos una transformación interior que ninguna filosofía puede explicar completamente.',
  para_meditar: [
    {
      cita: 'Juan 14:27',
      texto: 'La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da. No se turbe vuestro corazón, ni tenga miedo.',
    },
    {
      cita: 'Isaías 26:3',
      texto: 'Tú guardarás en completa paz a aquel cuyo pensamiento en ti persevera.',
    },
    {
      cita: 'Filipenses 4:6',
      texto: 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias.',
    },
  ],
  oracion:
    'Príncipe de Paz, hoy vengo ante ti con el peso que cargo. Hay preocupaciones que no sé cómo soltar, miedos que regresan en la noche, situaciones que escapan a mi control. Pero tú me invitas a traerte todo eso en oración, con acción de gracias.\n\nToma mis ansiedades y dales tu paz. No la paz que el mundo promete y no puede dar, sino esa paz profunda que solo viene de ti. Que mi corazón aprenda a descansar en ti, incluso cuando los problemas no han sido resueltos. En el nombre de Jesús, amén.',
  tags: ['Paz'],
};

export const DEVOTIONAL_2026_05_03_EN: RepoDevocional = {
  id: 'philippians47KJV',
  date: '2026-05-03',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Philippians 4:7 KJV: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus."',
  reflexion:
    "The peace God offers is radically different from the peace the world knows. The world's peace depends on circumstances: when all goes well, there is calm; when something fails, anxiety returns. But God's peace, according to Paul, \"passeth all understanding,\" meaning it can coexist with chaos, uncertainty, and pain.\n\nThis peace is not passivity or indifference. It is the fruit of a deep relationship with God, cultivated in prayer and knowledge of His Word. When we bring our worries to God with thanksgiving, we experience an inner transformation that no philosophy can fully explain.",
  para_meditar: [
    {
      cita: 'John 14:27',
      texto: 'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
    },
    {
      cita: 'Isaiah 26:3',
      texto: 'Thou wilt keep him in perfect peace, whose mind is stayed on thee.',
    },
    {
      cita: 'Philippians 4:6',
      texto: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
    },
  ],
  oracion:
    "Prince of Peace, today I come before You with the weight I carry. There are worries I don't know how to release, fears that return in the night, situations that are beyond my control. But You invite me to bring all of that to You in prayer, with thanksgiving.\n\nTake my anxieties and give them Your peace. Not the peace the world promises and cannot give, but that deep peace that only comes from You. May my heart learn to rest in You, even when the problems have not yet been resolved. In Jesus' name, amen.",
  tags: ['Peace'],
};

// ─── 2026-05-04: Esperanza / Hope ────────────────────────────────────────────

export const DEVOCIONAL_2026_05_04: RepoDevocional = {
  id: 'romanos1513RVR1960',
  date: '2026-05-04',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Romanos 15:13 RVR1960: "Y el Dios de esperanza os llene de todo gozo y paz en el creer, para que abundéis en esperanza por el poder del Espíritu Santo."',
  reflexion:
    'La esperanza cristiana no es optimismo superficial ni negación de la realidad. Es la certeza fundamentada en quién es Dios y en lo que ya ha hecho por nosotros en Cristo. Cuando Pablo habla del "Dios de esperanza", nos dice que la esperanza no es algo que generamos por voluntad propia, sino algo que recibimos como don de un Dios que ya conoce el final de nuestra historia.\n\nEn los momentos en que la vida nos decepciona, la esperanza nos recuerda que ninguna situación presente tiene la última palabra. Los padecimientos actuales no se pueden comparar con la gloria que ha de manifestarse. Eso no nos hace escapistas; nos hace perseverantes, porque sabemos que nuestro trabajo y nuestra fe no son en vano.',
  para_meditar: [
    {
      cita: 'Jeremías 29:11',
      texto: 'Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.',
    },
    {
      cita: 'Lamentaciones 3:22-23',
      texto: 'Por la misericordia de Jehová no hemos sido consumidos; porque nunca decayeron sus misericordias. Nuevas son cada mañana.',
    },
    {
      cita: 'Romanos 5:3-4',
      texto: 'También nos gloriamos en las tribulaciones, sabiendo que la tribulación produce paciencia; y la paciencia, prueba; y la prueba, esperanza.',
    },
  ],
  oracion:
    'Dios de esperanza, hay momentos en que la vida parece no tener salida. Situaciones que se prolongan demasiado, sueños que tardan en cumplirse, pérdidas que duelen profundo. En esos momentos, te pido que seas mi ancla.\n\nLléname con tu gozo y tu paz en el creer, para que pueda abundar en esperanza por el poder de tu Espíritu Santo. Que mi confianza en ti no dependa de ver resultados inmediatos, sino del conocimiento de que tú eres bueno y que tu historia todavía no ha terminado. En el nombre de Jesús, amén.',
  tags: ['Esperanza'],
};

export const DEVOTIONAL_2026_05_04_EN: RepoDevocional = {
  id: 'romans1513KJV',
  date: '2026-05-04',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Romans 15:13 KJV: "Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost."',
  reflexion:
    "Christian hope is not superficial optimism or denial of reality. It is a certainty grounded in who God is and what He has already done for us in Christ. When Paul speaks of the \"God of hope,\" he is telling us that hope is not something we generate by willpower, but something we receive as a gift from a God who already knows the end of our story.\n\nIn moments when life disappoints us, hope reminds us that no present situation has the final word. Present sufferings cannot be compared to the glory that is to be revealed. This does not make us escapists; it makes us perseverant, because we know that our work and our faith are not in vain.",
  para_meditar: [
    {
      cita: 'Jeremiah 29:11',
      texto: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
    },
    {
      cita: 'Lamentations 3:22-23',
      texto: "It is of the LORD's mercies that we are not consumed; because his compassions fail not. They are new every morning.",
    },
    {
      cita: 'Romans 5:3-4',
      texto: 'We glory in tribulations also: knowing that tribulation worketh patience; and patience, experience; and experience, hope.',
    },
  ],
  oracion:
    "God of hope, there are moments when life seems to have no way out. Situations that last too long, dreams that are slow to be fulfilled, losses that hurt deeply. In those moments, I ask You to be my anchor.\n\nFill me with Your joy and peace in believing, that I may abound in hope through the power of Your Holy Spirit. May my trust in You not depend on seeing immediate results, but on the knowledge that You are good and that Your story is not yet finished. In Jesus' name, amen.",
  tags: ['Hope'],
};

// ─── 2026-05-05: Gracia / Grace ──────────────────────────────────────────────

export const DEVOCIONAL_2026_05_05: RepoDevocional = {
  id: 'efesios28RVR1960',
  date: '2026-05-05',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Efesios 2:8 RVR1960: "Porque por gracia sois salvos por medio de la fe; y esto no de vosotros, pues es don de Dios."',
  reflexion:
    'La gracia es quizás la doctrina más radical del cristianismo. Nos dice que la salvación no se gana ni se merece, sino que se recibe. En un mundo que valora el rendimiento, la productividad y el mérito, el mensaje de la gracia resulta casi escandaloso: Dios nos ama no porque lo hayamos impresionado, sino a pesar de todo lo contrario.\n\nEfesios 2:8-9 deja en claro que "no de vosotros" se refiere tanto a la fe como a la salvación misma; todo es don de Dios. Esto no nos hace pasivos, sino profundamente agradecidos. La gracia no anula el esfuerzo, sino que lo reencuadra: ya no trabajamos para ganar el amor de Dios, sino desde el amor que ya hemos recibido.',
  para_meditar: [
    {
      cita: 'Romanos 6:14',
      texto: 'Porque el pecado no se enseñoreará de vosotros; pues no estáis bajo la ley, sino bajo la gracia.',
    },
    {
      cita: '2 Corintios 12:9',
      texto: 'Y me ha dicho: Bástate mi gracia; porque mi poder se perfecciona en la debilidad.',
    },
    {
      cita: 'Hebreos 4:16',
      texto: 'Acerquémonos, pues, confiadamente al trono de la gracia, para alcanzar misericordia y hallar gracia para el oportuno socorro.',
    },
  ],
  oracion:
    'Padre de misericordias, gracias porque me amas no por lo que hago, sino a pesar de lo que soy. Tu gracia es más grande que mis fracasos, más profunda que mi vergüenza, más poderosa que mis hábitos más difíciles de romper. Hoy quiero recibir esa gracia de nuevo.\n\nEn los momentos en que siento que no merezco acercarme a ti, recuérdame que el trono al que me invitas es un trono de gracia, no de juicio. Que pueda vivir libre del peso del rendimiento religioso y en la libertad de quien sabe que ya es amado. En el nombre de Jesús, amén.',
  tags: ['Gracia'],
};

export const DEVOTIONAL_2026_05_05_EN: RepoDevocional = {
  id: 'ephesians28KJV',
  date: '2026-05-05',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Ephesians 2:8 KJV: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God."',
  reflexion:
    "Grace is perhaps Christianity's most radical doctrine. It tells us that salvation is not earned or deserved, but received. In a world that values performance, productivity, and merit, the message of grace is almost scandalous: God loves us not because we have impressed Him, but in spite of everything to the contrary.\n\nEphesians 2:8-9 makes clear that \"not of yourselves\" refers to both faith and salvation itself; everything is the gift of God. This does not make us passive, but deeply grateful. Grace does not nullify effort, but reframes it: we no longer work to earn God's love, but from the love we have already received.",
  para_meditar: [
    {
      cita: 'Romans 6:14',
      texto: 'For sin shall not have dominion over you: for ye are not under the law, but under grace.',
    },
    {
      cita: '2 Corinthians 12:9',
      texto: 'And he said unto me, My grace is sufficient for thee: for my strength is made perfect in weakness.',
    },
    {
      cita: 'Hebrews 4:16',
      texto: 'Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need.',
    },
  ],
  oracion:
    "Father of mercies, thank You for loving me not for what I do, but in spite of who I am. Your grace is greater than my failures, deeper than my shame, more powerful than my hardest habits to break. Today I want to receive that grace anew.\n\nIn moments when I feel I don't deserve to come before You, remind me that the throne You invite me to is a throne of grace, not judgment. May I live free from the weight of religious performance, in the freedom of one who already knows they are loved. In Jesus' name, amen.",
  tags: ['Grace'],
};

// ─── 2026-05-06: Oración / Prayer ────────────────────────────────────────────

export const DEVOCIONAL_2026_05_06: RepoDevocional = {
  id: 'mateo66RVR1960',
  date: '2026-05-06',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Mateo 6:6 RVR1960: "Mas tú, cuando ores, entra en tu aposento, y cerrada la puerta, ora a tu Padre que está en secreto; y tu Padre que ve en lo secreto te recompensará en público."',
  reflexion:
    'La oración es mucho más que una lista de peticiones; es el lenguaje de la relación con Dios. Cuando Jesús nos enseña a orar "en secreto", nos está invitando a una intimidad que va más allá de las palabras formales. La oración en privado es donde realmente nos encontramos con Dios, lejos del deseo de impresionar a otros y con toda nuestra vulnerabilidad.\n\nMuchas personas sienten que sus oraciones "no funcionan" porque entienden la oración principalmente como un mecanismo para obtener respuestas. Pero Jesús nos muestra que el propósito más profundo de la oración es la transformación del que ora, no solo la solución de sus problemas. En la presencia de Dios, somos formados, consolados y enviados de vuelta al mundo con mayor claridad y amor.',
  para_meditar: [
    {
      cita: 'Mateo 6:9',
      texto: 'Vosotros, pues, oraréis así: Padre nuestro que estás en los cielos, santificado sea tu nombre.',
    },
    {
      cita: '1 Juan 5:14',
      texto: 'Y esta es la confianza que tenemos en él, que si pedimos alguna cosa conforme a su voluntad, él nos oye.',
    },
    {
      cita: 'Santiago 5:16',
      texto: 'La oración eficaz del justo puede mucho.',
    },
  ],
  oracion:
    'Padre, eres el Dios que escucha. No porque mis palabras sean elocuentes ni mis argumentos sean convincentes, sino porque soy tu hijo y tú amas escucharme. Hoy vengo a ti con todo lo que soy: mis miedos, mis esperanzas, mis arrepentimientos, mis sueños.\n\nEnséñame a orar con más honestidad y menos religiosidad. Que mis momentos a solas contigo sean verdaderos encuentros y no simples rituales. Transforma mi corazón en el proceso de la oración, para que cuando salga de ese lugar secreto, sea más parecido a ti. En el nombre de Jesús, amén.',
  tags: ['Oración'],
};

export const DEVOTIONAL_2026_05_06_EN: RepoDevocional = {
  id: 'matthew66KJV',
  date: '2026-05-06',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Matthew 6:6 KJV: "But thou, when thou prayest, enter into thy closet, and when thou hast shut thy door, pray to thy Father which is in secret; and thy Father which seeth in secret shall reward thee openly."',
  reflexion:
    "Prayer is far more than a list of requests; it is the language of relationship with God. When Jesus teaches us to pray \"in secret,\" He is inviting us into an intimacy that goes beyond formal words. Private prayer is where we truly encounter God, away from the desire to impress others and with all our vulnerability.\n\nMany people feel their prayers \"don't work\" because they understand prayer primarily as a mechanism to obtain answers. But Jesus shows us that the deeper purpose of prayer is the transformation of the one who prays, not only the solution of their problems. In God's presence, we are formed, comforted, and sent back into the world with greater clarity and love.",
  para_meditar: [
    {
      cita: 'Matthew 6:9',
      texto: 'After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.',
    },
    {
      cita: '1 John 5:14',
      texto: 'And this is the confidence that we have in him, that, if we ask any thing according to his will, he heareth us.',
    },
    {
      cita: 'James 5:16',
      texto: 'The effectual fervent prayer of a righteous man availeth much.',
    },
  ],
  oracion:
    "Father, You are the God who listens. Not because my words are eloquent or my arguments are convincing, but because I am Your child and You love to hear me. Today I come to You with all that I am: my fears, my hopes, my repentances, my dreams.\n\nTeach me to pray with more honesty and less religion. May my private moments with You be true encounters and not mere rituals. Transform my heart through the process of prayer, so that when I leave that secret place, I am more like You. In Jesus' name, amen.",
  tags: ['Prayer'],
};

export const DEVOCIONAL_2026_05_07: RepoDevocional = {
  id: 'romanos1013RVR1960',
  date: '2026-05-07',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Romanos 10:13 RVR1960: "Porque todo aquel que invocare el nombre del Señor, será salvo."',
  reflexion:
    'Hay momentos en los que la desesperación parece tener la última palabra. Cuando las puertas se cierran, las fuerzas se agotan y el futuro luce oscuro, resulta difícil imaginar que algo pueda cambiar. Sin embargo, la salvación no es solo un evento puntual del pasado; es una realidad viva que irrumpe precisamente en los momentos de mayor quebranto.\n\nDios no espera a que estés en tu mejor versión para acercarse. El apóstol Pablo lo deja claro: cualquiera —sin excepción, sin requisitos previos— que clame al Señor recibirá salvación. Esta no es una promesa para los que ya tienen todo resuelto, sino para los que reconocen que no pueden solos. La desesperación, cuando se convierte en clamor, se transforma en el umbral de la esperanza.',
  para_meditar: [
    {
      cita: 'Salmos 34:18',
      texto: 'Cercano está Jehová a los quebrantados de corazón; y salva a los contritos de espíritu.',
    },
    {
      cita: 'Romanos 8:38-39',
      texto: 'Por lo cual estoy seguro de que ni la muerte, ni la vida... ni ninguna otra cosa creada nos podrá separar del amor de Dios, que es en Cristo Jesús Señor nuestro.',
    },
    {
      cita: 'Isaías 43:1',
      texto: 'No temas, porque yo te redimí; te puse nombre, mío eres tú.',
    },
  ],
  oracion:
    'Señor, hoy te clamo desde el lugar donde estoy, no desde donde quisiera estar. Mi corazón está cansado y mis fuerzas son pocas. Pero tú prometiste que todo el que te invocare sería salvo, y hoy me acojo a esa promesa.\n\nSálvame del desánimo, de la duda, de la voz que me dice que ya no hay salida. Recuérdame que tu salvación no tiene fecha de vencimiento ni depende de mis méritos. Transforma mi desesperación en esperanza y mi llanto en fortaleza. En el nombre de Jesús, amén.',
  tags: ['Salvación'],
};

export const DEVOTIONAL_2026_05_07_EN: RepoDevocional = {
  id: 'romans1013KJV',
  date: '2026-05-07',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Romans 10:13 KJV: "For whosoever shall call upon the name of the Lord shall be saved."',
  reflexion:
    "There are moments when despair seems to have the final word. When doors close, strength runs out, and the future looks dark, it is hard to imagine that anything can change. Yet salvation is not merely a past event — it is a living reality that breaks in precisely at our most broken moments.\n\nGod does not wait for you to be at your best before drawing near. The apostle Paul makes it clear: anyone — without exception, without prerequisites — who calls on the Lord will receive salvation. This is not a promise for those who have it all figured out, but for those who recognize they cannot make it on their own. Despair, when it becomes a cry, is transformed into the threshold of hope.",
  para_meditar: [
    {
      cita: 'Psalm 34:18',
      texto: 'The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.',
    },
    {
      cita: 'Romans 8:38-39',
      texto: 'For I am persuaded, that neither death, nor life... nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.',
    },
    {
      cita: 'Isaiah 43:1',
      texto: 'Fear not: for I have redeemed thee, I have called thee by thy name; thou art mine.',
    },
  ],
  oracion:
    "Lord, today I call out to You from where I am, not from where I wish I were. My heart is weary and my strength is low. But You promised that whoever calls on Your name will be saved, and today I hold on to that promise.\n\nSave me from discouragement, from doubt, from the voice that tells me there is no way out. Remind me that Your salvation has no expiration date and does not depend on my merits. Turn my despair into hope and my tears into strength. In Jesus' name, amen.",
  tags: ['Salvation'],
};

export const DEVOCIONAL_2026_05_08: RepoDevocional = {
  id: 'efesios17RVR1960',
  date: '2026-05-08',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Efesios 1:7 RVR1960: "En quien tenemos redención por su sangre, el perdón de pecados según las riquezas de su gracia."',
  reflexion:
    'Todos llevamos historias que preferiríamos reescribir. Decisiones pasadas, heridas acumuladas, identidades forjadas en el dolor. Nuestra tendencia es cargar esas páginas como condena, como prueba de que somos lo que el mundo —o nosotros mismos— hemos dicho que somos. Pero la redención de Dios no edita superficialmente nuestra historia: la reescribe desde adentro.\n\nLa palabra redención en el griego original evoca la imagen de alguien que paga el precio para liberar a un cautivo. Eso es exactamente lo que Cristo hizo: entró en nuestra historia, pagó lo que nosotros no podíamos pagar, y nos devolvió la autoría de nuestra propia vida. La gracia no borra el pasado, pero le cambia el significado. Lo que antes era vergüenza puede convertirse en testimonio; lo que era cadena, en llamado.',
  para_meditar: [
    {
      cita: 'Colosenses 1:13-14',
      texto: 'El cual nos ha librado de la potestad de las tinieblas, y trasladado al reino de su amado Hijo, en quien tenemos redención por su sangre, el perdón de pecados.',
    },
    {
      cita: '1 Pedro 1:18-19',
      texto: 'Sabiendo que fuisteis rescatados de vuestra vana manera de vivir... con la sangre preciosa de Cristo.',
    },
    {
      cita: 'Tito 2:14',
      texto: 'Quien se dio a sí mismo por nosotros para redimirnos de toda iniquidad y purificar para sí un pueblo propio, celoso de buenas obras.',
    },
  ],
  oracion:
    'Padre, gracias porque tu gracia no se asusta de mi historia. Hoy traigo ante ti las páginas que me avergüenzan, las decisiones que quisiera borrar, las heridas que todavía duelen.\n\nCreo que en Cristo tengo redención. No como teoría, sino como realidad que puede transformar mi presente. Ayúdame a dejar de leer mi vida solo a través de mis errores y a verla a través de tu gracia. Que lo que hoy parece ruina, en tus manos se convierta en fundamento. En el nombre de Jesús, amén.',
  tags: ['Redención'],
};

export const DEVOTIONAL_2026_05_08_EN: RepoDevocional = {
  id: 'ephesians17KJV',
  date: '2026-05-08',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Ephesians 1:7 KJV: "In whom we have redemption through his blood, the forgiveness of sins, according to the riches of his grace."',
  reflexion:
    "We all carry stories we would rather rewrite. Past decisions, accumulated wounds, identities forged in pain. Our tendency is to carry those pages as a verdict — as proof that we are what the world, or we ourselves, have said we are. But God's redemption does not superficially edit our story: it rewrites it from the inside out.\n\nThe word redemption in the original Greek evokes the image of someone paying the price to free a captive. That is exactly what Christ did: He entered our story, paid what we could not pay, and gave us back the authorship of our own lives. Grace does not erase the past, but it changes its meaning. What was once shame can become testimony; what was a chain can become a calling.",
  para_meditar: [
    {
      cita: 'Colossians 1:13-14',
      texto: 'Who hath delivered us from the power of darkness, and hath translated us into the kingdom of his dear Son: in whom we have redemption through his blood, even the forgiveness of sins.',
    },
    {
      cita: '1 Peter 1:18-19',
      texto: 'Forasmuch as ye know that ye were not redeemed with corruptible things... but with the precious blood of Christ.',
    },
    {
      cita: 'Titus 2:14',
      texto: 'Who gave himself for us, that he might redeem us from all iniquity, and purify unto himself a peculiar people, zealous of good works.',
    },
  ],
  oracion:
    "Father, thank You that Your grace is not frightened by my story. Today I bring before You the pages that shame me, the decisions I wish I could undo, the wounds that still ache.\n\nI believe that in Christ I have redemption — not as a theory, but as a reality that can transform my present. Help me stop reading my life only through my mistakes and to see it through Your grace. May what looks like ruin today become, in Your hands, a foundation. In Jesus' name, amen.",
  tags: ['Redemption'],
};

// ─── Image pool (same as backend, 12 Unsplash photos) ─────────────────────────

export const REPO_IMAGES = [
  'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&q=80', // Sunrise over mountains
  'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&q=80', // Golden field
  'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=800&q=80', // Misty forest
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&q=80', // Sunlight through trees
  'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&q=80', // Ocean waves
  'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80', // Flowers
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80', // Mountain valley
  'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&q=80', // Lake reflection
  'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&q=80', // Waterfall
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80', // Mountain sunrise
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80', // Forest path
  'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=800&q=80', // Valley view
] as const;

// ─── Master lookup map (date → ES + EN pair + image) ─────────────────────────

export const REPO_DEVOCIONALS: Record<string, { es: RepoDevocional; en: RepoDevocional; imageUrl: string }> = {
  '2026-04-29': { es: SAMPLE_DEVOCIONAL,      en: SAMPLE_DEVOCIONAL_EN,      imageUrl: REPO_IMAGES[3]  }, // Sunlight through trees
  '2026-04-30': { es: DEVOCIONAL_2026_04_30,  en: DEVOTIONAL_2026_04_30_EN,  imageUrl: REPO_IMAGES[1]  }, // Golden field
  '2026-05-01': { es: DEVOCIONAL_2026_05_01,  en: DEVOTIONAL_2026_05_01_EN,  imageUrl: REPO_IMAGES[0]  }, // Sunrise over mountains
  '2026-05-02': { es: DEVOCIONAL_2026_05_02,  en: DEVOTIONAL_2026_05_02_EN,  imageUrl: REPO_IMAGES[4]  }, // Ocean waves
  '2026-05-03': { es: DEVOCIONAL_2026_05_03,  en: DEVOTIONAL_2026_05_03_EN,  imageUrl: REPO_IMAGES[2]  }, // Misty forest
  '2026-05-04': { es: DEVOCIONAL_2026_05_04,  en: DEVOTIONAL_2026_05_04_EN,  imageUrl: REPO_IMAGES[5]  }, // Flowers
  '2026-05-05': { es: DEVOCIONAL_2026_05_05,  en: DEVOTIONAL_2026_05_05_EN,  imageUrl: REPO_IMAGES[6]  }, // Mountain valley
  '2026-05-06': { es: DEVOCIONAL_2026_05_06,  en: DEVOTIONAL_2026_05_06_EN,  imageUrl: REPO_IMAGES[7]  }, // Lake reflection
  '2026-05-07': { es: DEVOCIONAL_2026_05_07,  en: DEVOTIONAL_2026_05_07_EN,  imageUrl: REPO_IMAGES[8]  }, // Waterfall
  '2026-05-08': { es: DEVOCIONAL_2026_05_08,  en: DEVOTIONAL_2026_05_08_EN,  imageUrl: REPO_IMAGES[9]  }, // Mountain sunrise
};
