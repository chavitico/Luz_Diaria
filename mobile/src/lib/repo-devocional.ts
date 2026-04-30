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

// ─── May 10 — Worship ─────────────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_10: RepoDevocional = {
  id: 'colosenses317RVR1960',
  date: '2026-05-10',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Colosenses 3:17 RVR1960: "Y todo lo que hacéis, sea de palabra o de hecho, hacedlo todo en el nombre del Señor Jesús, dando gracias a Dios Padre por medio de él."',
  reflexion:
    'Solemos pensar que la adoración ocurre en un recinto con música y predicación. Pero hay un tipo de adoración que Dios valora profundamente: la que sucede cuando nadie está mirando, cuando lavas los platos, preparas el almuerzo o doblas la ropa. Pablo no dice "algunas cosas" sino "todo lo que hacéis". Esa totalidad es la invitación de Dios a convertir cada momento ordinario en un acto de amor.\n\nLa adoración cotidiana no requiere palabras elaboradas ni circunstancias perfectas. Requiere intención. Cuando haces tu trabajo pensando en agradar a Dios, cuando cuidas a alguien con amor genuino, cuando terminas una tarea con honestidad aunque nadie te vea —estás adorando. El corazón que canta en la cocina es el que ha aprendido que lo sagrado y lo cotidiano no son opuestos: son el mismo territorio.',
  para_meditar: [
    {
      cita: 'Salmo 100:2',
      texto: 'Servid a Jehová con alegría; venid ante su presencia con regocijo.',
    },
    {
      cita: 'Juan 4:24',
      texto: 'Dios es Espíritu; y los que le adoran, en espíritu y en verdad es necesario que adoren.',
    },
    {
      cita: 'Romanos 12:1',
      texto: 'Os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable a Dios, que es vuestro culto racional.',
    },
  ],
  oracion:
    'Señor, perdóname por limitar mi adoración a ciertos momentos y lugares. Hoy quiero aprender a adorarte en lo ordinario: en el trabajo que realizo, en las personas que sirvo, en los momentos que parecen insignificantes.\n\nQue mi vida entera sea un acto de gratitud hacia ti. Que mis manos, mis palabras y mis decisiones reflejen que te pertenezco. Transforma mis rutinas en liturgia y mi esfuerzo diario en ofrenda. En el nombre de Jesús, amén.',
  tags: ['Adoración'],
};

export const DEVOTIONAL_2026_05_10_EN: RepoDevocional = {
  id: 'colossians317KJV',
  date: '2026-05-10',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Colossians 3:17 KJV: "And whatsoever ye do in word or deed, do all in the name of the Lord Jesus, giving thanks to God and the Father by him."',
  reflexion:
    "We tend to think worship happens inside a building with music and preaching. But there is a kind of worship God values deeply — the kind that happens when no one is watching, when you wash the dishes, cook a meal, or fold the laundry. Paul does not say 'some things' but 'whatsoever ye do.' That totality is God's invitation to turn every ordinary moment into an act of love.\n\nEveryday worship does not require elaborate words or perfect circumstances. It requires intention. When you do your work with a desire to please God, when you care for someone with genuine love, when you finish a task honestly even when no one sees — you are worshipping. The heart that sings in the kitchen is the one that has learned that the sacred and the everyday are not opposites: they are the same territory.",
  para_meditar: [
    {
      cita: 'Psalm 100:2',
      texto: 'Serve the LORD with gladness: come before his presence with singing.',
    },
    {
      cita: 'John 4:24',
      texto: 'God is a Spirit: and they that worship him must worship him in spirit and in truth.',
    },
    {
      cita: 'Romans 12:1',
      texto: 'I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.',
    },
  ],
  oracion:
    "Lord, forgive me for limiting my worship to certain moments and places. Today I want to learn to worship You in the ordinary: in the work I do, in the people I serve, in the moments that seem insignificant.\n\nMay my whole life be an act of gratitude toward You. May my hands, my words, and my decisions reflect that I belong to You. Transform my routines into liturgy and my daily effort into an offering. In Jesus' name, amen.",
  tags: ['Worship'],
};

// ─── May 11 — Prayer ──────────────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_11: RepoDevocional = {
  id: 'romanos826RVR1960',
  date: '2026-05-11',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Romanos 8:26 RVR1960: "Y de igual manera el Espíritu nos ayuda en nuestra debilidad; pues qué hemos de pedir como conviene, no lo sabemos, pero el Espíritu mismo intercede por nosotros con gemidos indecibles."',
  reflexion:
    'Hay temporadas en las que no sabemos qué pedirle a Dios. El corazón está tan cargado, o tan vacío, que las palabras no alcanzan. Nos sentamos en silencio frente a Dios y lo único que podemos ofrecer es nuestra presencia rota. En esos momentos, la promesa de Romanos 8 es un ancla: el Espíritu Santo ora por nosotros cuando nosotros no podemos.\n\nDios nunca requirió elocuencia. Lo que busca es honestidad. Un suspiro cansado, un llanto sin explicación, un "no sé cómo más pedirte" —son oraciones tan válidas como las más elaboradas. Cuando el corazón deja de esperar es porque ha olvidado que Dios ya está trabajando en lo que no podemos ver. La oración no mueve a Dios hacia nosotros: nos mueve a nosotros hacia su perspectiva.',
  para_meditar: [
    {
      cita: 'Lamentaciones 3:22-23',
      texto: 'Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad.',
    },
    {
      cita: 'Lucas 18:1',
      texto: 'También les refirió Jesús una parábola sobre la necesidad de orar siempre, y no desmayar.',
    },
    {
      cita: 'Filipenses 4:6-7',
      texto: 'Por nada estéis afanosos, sino sean conocidas vuestras peticiones delante de Dios en toda oración y ruego, con acción de gracias. Y la paz de Dios, que sobrepasa todo entendimiento, guardará vuestros corazones y vuestros pensamientos en Cristo Jesús.',
    },
  ],
  oracion:
    'Espíritu Santo, gracias porque oras en mí cuando yo no sé cómo. Hoy vengo a ti sin palabras perfectas, sin certezas claras, solo con la necesidad de estar en tu presencia.\n\nAyúdame a no rendirme en la oración cuando no veo respuestas. Recuérdame que tu silencio no es abandono. Que cuando mi corazón ya no puede esperar, sea precisamente entonces cuando confíe más. En el nombre de Jesús, amén.',
  tags: ['Oración'],
};

export const DEVOTIONAL_2026_05_11_EN: RepoDevocional = {
  id: 'romans826KJV',
  date: '2026-05-11',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Romans 8:26 KJV: "Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered."',
  reflexion:
    "There are seasons when we do not know what to ask God for. The heart is so burdened, or so empty, that words fall short. We sit in silence before God and the only thing we can offer is our broken presence. In those moments, the promise of Romans 8 is an anchor: the Holy Spirit prays for us when we cannot.\n\nGod has never required eloquence. What He seeks is honesty. A weary sigh, a tear without explanation, an 'I don't know how to ask You anymore' — these are prayers as valid as the most carefully worded ones. When the heart stops hoping, it is because it has forgotten that God is already working on what we cannot see. Prayer does not move God toward us: it moves us toward His perspective.",
  para_meditar: [
    {
      cita: 'Lamentations 3:22-23',
      texto: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
    },
    {
      cita: 'Luke 18:1',
      texto: 'And he spake a parable unto them to this end, that men ought always to pray, and not to faint.',
    },
    {
      cita: 'Philippians 4:6-7',
      texto: 'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
    },
  ],
  oracion:
    "Holy Spirit, thank You for praying in me when I do not know how. Today I come to You without perfect words, without clear certainty, only with the need to be in Your presence.\n\nHelp me not to give up in prayer when I see no answers. Remind me that Your silence is not abandonment. May the very moment my heart can no longer hope be the moment I trust You most. In Jesus' name, amen.",
  tags: ['Prayer'],
};

// ─── May 13 — Service ─────────────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_13: RepoDevocional = {
  id: 'marcos1045RVR1960',
  date: '2026-05-13',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Marcos 10:45 RVR1960: "Porque el Hijo del Hombre no vino para ser servido, sino para servir, y para dar su vida en rescate por muchos."',
  reflexion:
    'Hay una paradoja en el corazón del servicio cristiano: lo que damos termina transformándonos más a nosotros que a quienes servimos. Cuando Cristo lavó los pies de sus discípulos, no solo les demostró humildad —les reveló que el poder verdadero no domina, sino que desciende. El que sirve con amor genuino está ejerciendo una de las formas más radicales de libertad.\n\nServir no es una obligación que Dios nos impone como carga; es una invitación a participar en su naturaleza. Cuando te inclinas para ayudar a alguien que no puede pagarte, cuando das sin esperar reconocimiento, cuando pones las necesidades de otro antes que las tuyas —algo en ti se libera. Lo que entregamos en amor nunca se pierde: se multiplica de maneras que a veces tardamos en ver.',
  para_meditar: [
    {
      cita: 'Juan 13:14-15',
      texto: 'Pues si yo, el Señor y el Maestro, he lavado vuestros pies, vosotros también debéis lavaros los pies los unos a los otros. Porque ejemplo os he dado, para que como yo os he hecho, vosotros también hagáis.',
    },
    {
      cita: 'Gálatas 5:13',
      texto: 'Porque vosotros, hermanos, a libertad fuisteis llamados; solamente que no uséis la libertad como ocasión para la carne, sino servíos por amor los unos a los otros.',
    },
    {
      cita: '1 Pedro 4:10',
      texto: 'Cada uno según el don que ha recibido, minístrelo a los otros, como buenos administradores de la multiforme gracia de Dios.',
    },
  ],
  oracion:
    'Señor Jesús, tú que siendo el más grande te hiciste el más pequeño: enséñame el camino del servicio sin cálculo. Quita de mí el deseo de servir solo cuando me conviene o cuando alguien me ve.\n\nQue pueda entregarme hoy en las cosas pequeñas: una palabra de aliento, una mano tendida, un tiempo ofrecido sin prisa. Que lo que entregue hoy en tu nombre toque la vida de quien lo recibe y me transforme a mí en el proceso. En el nombre de Jesús, amén.',
  tags: ['Servicio'],
};

export const DEVOTIONAL_2026_05_13_EN: RepoDevocional = {
  id: 'mark1045KJV',
  date: '2026-05-13',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Mark 10:45 KJV: "For even the Son of man came not to be ministered unto, but to minister, and to give his life a ransom for many."',
  reflexion:
    "There is a paradox at the heart of Christian service: what we give ends up transforming us more than those we serve. When Christ washed his disciples' feet, He was not merely demonstrating humility — He was revealing that true power does not dominate, it descends. The one who serves with genuine love is exercising one of the most radical forms of freedom.\n\nServing is not an obligation God imposes on us as a burden; it is an invitation to participate in His own nature. When you bend down to help someone who cannot repay you, when you give without expecting recognition, when you place another's needs before your own — something in you is set free. What we give in love is never lost: it multiplies in ways we sometimes take time to see.",
  para_meditar: [
    {
      cita: 'John 13:14-15',
      texto: 'If I then, your Lord and Master, have washed your feet; ye also ought to wash one another\'s feet. For I have given you an example, that ye should do as I have done to you.',
    },
    {
      cita: 'Galatians 5:13',
      texto: 'For, brethren, ye have been called unto liberty; only use not liberty for an occasion to the flesh, but by love serve one another.',
    },
    {
      cita: '1 Peter 4:10',
      texto: 'As every man hath received the gift, even so minister the same one to another, as good stewards of the manifold grace of God.',
    },
  ],
  oracion:
    "Lord Jesus, You who being the greatest made Yourself the least — teach me the way of uncalculating service. Remove from me the desire to serve only when it is convenient or when someone is watching.\n\nMay I give myself today in small things: an encouraging word, an outstretched hand, time offered without hurry. May what I give today in Your name touch the life of the one who receives it, and transform me in the process. In Jesus' name, amen.",
  tags: ['Service'],
};

// ─── May 14 — Waiting on God ──────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_14: RepoDevocional = {
  id: 'isaias4031RVR1960',
  date: '2026-05-14',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Isaías 40:31 RVR1960: "pero los que esperan a Jehová tendrán nuevas fuerzas; levantarán alas como las águilas; correrán, y no se cansarán; caminarán, y no se fatigarán."',
  reflexion:
    'Esperar es quizás la tarea más difícil que Dios nos encomienda. Vivimos en una cultura que recompensa la velocidad y castiga la pausa. Cuando la respuesta de Dios tarda, solemos interpretar el silencio como ausencia, y la espera como abandono. Pero la Escritura presenta la espera no como un tiempo vacío, sino como un tiempo de formación.\n\nIsaías usa la imagen del águila: ese proceso de renovación de plumas por el que el ave atraviesa antes de volar más alto. La espera en Dios no nos deja iguales; nos rehace. Las nuevas fuerzas que promete no son simplemente energía repuesta, sino una fortaleza construida sobre confianza, sobre haber aprendido que Dios es fiel incluso cuando tarda. Confiar en medio de la espera es el regalo más maduro que podemos ofrecer a Dios.',
  para_meditar: [
    {
      cita: 'Salmo 27:14',
      texto: 'Aguarda a Jehová; esfuérzate, y aliéntese tu corazón; sí, espera a Jehová.',
    },
    {
      cita: 'Miqueas 7:7',
      texto: 'Mas yo a Jehová miraré, esperaré al Dios de mi salvación; el Dios mío me oirá.',
    },
    {
      cita: 'Hebreos 6:15',
      texto: 'Y habiendo esperado con paciencia, alcanzó la promesa.',
    },
  ],
  oracion:
    'Padre, confieso que la espera me cuesta. Quisiera respuestas rápidas y caminos despejados. Pero hoy decido confiar en que tu tiempo es mejor que el mío.\n\nRenueva mis fuerzas mientras espero. Que este tiempo de pausa no sea pérdida, sino preparación. Que aprenda a descansar en tu fidelidad antes de ver el resultado. Ayúdame a mantener los ojos en ti, no en las circunstancias. En el nombre de Jesús, amén.',
  tags: ['Espera'],
};

export const DEVOTIONAL_2026_05_14_EN: RepoDevocional = {
  id: 'isaiah4031KJV',
  date: '2026-05-14',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Isaiah 40:31 KJV: "But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint."',
  reflexion:
    "Waiting may be the most difficult task God entrusts to us. We live in a culture that rewards speed and penalizes pause. When God's answer is delayed, we tend to interpret the silence as absence, and the wait as abandonment. But Scripture presents waiting not as an empty time, but as a time of formation.\n\nIsaiah uses the image of the eagle: that process of feather renewal the bird passes through before flying higher. Waiting on God does not leave us the same; it remakes us. The renewed strength He promises is not simply replenished energy, but a strength built on trust — on having learned that God is faithful even when He takes His time. Trusting in the midst of waiting is the most mature gift we can offer to God.",
  para_meditar: [
    {
      cita: 'Psalm 27:14',
      texto: 'Wait on the LORD: be of good courage, and he shall strengthen thine heart: wait, I say, on the LORD.',
    },
    {
      cita: 'Micah 7:7',
      texto: 'Therefore I will look unto the LORD; I will wait for the God of my salvation: my God will hear me.',
    },
    {
      cita: 'Hebrews 6:15',
      texto: 'And so, after he had patiently endured, he obtained the promise.',
    },
  ],
  oracion:
    "Father, I confess that waiting is hard for me. I want quick answers and clear paths. But today I choose to trust that Your timing is better than mine.\n\nRenew my strength while I wait. May this time of pause not be a loss, but a preparation. May I learn to rest in Your faithfulness before I see the result. Help me keep my eyes on You, not on circumstances. In Jesus' name, amen.",
  tags: ['Waiting on God'],
};

// ─── May 15 — Hard Decisions ──────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_15: RepoDevocional = {
  id: 'proverbios35RVR1960',
  date: '2026-05-15',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Proverbios 3:5-6 RVR1960: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas."',
  reflexion:
    'Las decisiones difíciles nos revelan cuánto confiamos realmente en Dios. Es fácil reconocerlo en los días tranquilos, pero cuando hay una encrucijada importante —un trabajo, una relación, una mudanza, una ruptura— la tentación es depender solo de nuestra propia lógica, nuestros miedos y nuestros cálculos. Proverbios nos invita a algo más radical: fiarnos de todo corazón.\n\nFiarse no significa no pensar. Significa incluir a Dios en el proceso de pensamiento. Significa orar antes de decidir, buscar consejo sabio, estar dispuesto a que el resultado difiera de lo que esperabas. La promesa es notable: Dios "enderezará tus veredas". No dice que el camino será sencillo, sino que será el correcto. A veces los caminos enderezados pasan por valles antes de llegar a cumbres.',
  para_meditar: [
    {
      cita: 'Santiago 1:5',
      texto: 'Y si alguno de vosotros tiene falta de sabiduría, pídala a Dios, el cual da a todos abundantemente y sin reproche, y le será dada.',
    },
    {
      cita: 'Salmo 25:4-5',
      texto: 'Muéstrame, oh Jehová, tus caminos; enséñame tus sendas. Encamíname en tu verdad, y enséñame, porque tú eres el Dios de mi salvación.',
    },
    {
      cita: 'Isaías 30:21',
      texto: 'Entonces tus oídos oirán a tus espaldas palabra que diga: Este es el camino, andad por él; y no echéis a la mano derecha, ni tampoco torzáis a la mano izquierda.',
    },
  ],
  oracion:
    'Dios de sabiduría, hoy enfrento decisiones que me superan. Mi mente analiza y el corazón duda. Vengo a ti no porque tenga todo claro, sino porque sé que tú sí lo tienes.\n\nGuíame. Habla con claridad a mi espíritu. Dame discernimiento para reconocer tu voz entre tanto ruido. Y cuando tome la decisión, dame también la paz de saber que no estoy solo en el camino. En el nombre de Jesús, amén.',
  tags: ['Decisiones'],
};

export const DEVOTIONAL_2026_05_15_EN: RepoDevocional = {
  id: 'proverbs35KJV',
  date: '2026-05-15',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Proverbs 3:5-6 KJV: "Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths."',
  reflexion:
    "Difficult decisions reveal how much we truly trust God. It is easy to acknowledge Him on calm days, but when there is an important crossroads — a job, a relationship, a move, a ending — the temptation is to rely solely on our own logic, our fears, and our calculations. Proverbs invites us to something more radical: to trust with all our heart.\n\nTrusting does not mean not thinking. It means including God in the thinking process. It means praying before deciding, seeking wise counsel, being willing to accept an outcome different from what you expected. The promise is remarkable: God 'shall direct thy paths.' It does not say the path will be easy, only that it will be right. Sometimes the directed paths pass through valleys before reaching summits.",
  para_meditar: [
    {
      cita: 'James 1:5',
      texto: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',
    },
    {
      cita: 'Psalm 25:4-5',
      texto: 'Shew me thy ways, O LORD; teach me thy paths. Lead me in thy truth, and teach me: for thou art the God of my salvation.',
    },
    {
      cita: 'Isaiah 30:21',
      texto: 'And thine ears shall hear a word behind thee, saying, This is the way, walk ye in it, when ye turn to the right hand, and when ye turn to the left.',
    },
  ],
  oracion:
    "God of wisdom, today I face decisions that are beyond me. My mind analyzes and my heart hesitates. I come to You not because I have everything figured out, but because I know that You do.\n\nGuide me. Speak clearly to my spirit. Give me discernment to recognize Your voice amid so much noise. And when I make the decision, give me the peace of knowing I am not alone on the path. In Jesus' name, amen.",
  tags: ['Hard Decisions'],
};

// ─── May 16 — Spiritual Weariness ────────────────────────────────────────────

export const DEVOCIONAL_2026_05_16: RepoDevocional = {
  id: 'mateo1128RVR1960',
  date: '2026-05-16',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Mateo 11:28 RVR1960: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar."',
  reflexion:
    'El cansancio espiritual es uno de los estados más solitarios que existen. No es falta de fe, sino el resultado de cargar mucho durante demasiado tiempo. Puede manifestarse como indiferencia ante cosas que antes te llenaban, como la incapacidad de orar, o como la sensación de que Dios está muy lejos. Si alguna vez has sentido eso, Jesús tiene un mensaje directo para ti: ven.\n\nLa invitación de Jesús en Mateo 11 no va dirigida a los fuertes y productivos, sino a los cargados. Él no pide que primero te recuperes para luego acercarte; te invita a acercarte para recuperarte. El descanso que ofrece no es solo físico, sino una restauración del alma: volver a la certeza de que eres amado y que no tienes que ganarte tu lugar. En su presencia, las cargas no desaparecen de golpe, pero se vuelven llevaderas.',
  para_meditar: [
    {
      cita: 'Isaías 40:29',
      texto: 'El da esfuerzo al cansado, y multiplica las fuerzas al que no tiene ningunas.',
    },
    {
      cita: 'Isaías 41:10',
      texto: 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.',
    },
    {
      cita: 'Salmo 23:2-3',
      texto: 'En lugares de delicados pastos me hará descansar; junto a aguas de reposo me pastoreará. Confortará mi alma.',
    },
  ],
  oracion:
    'Jesús, estoy cansado. No solo en el cuerpo, sino en el espíritu. He cargado demasiado tiempo cosas que quizás nunca me correspondió cargar solo.\n\nVengo a ti tal como estás prometiste: cargado. Recíbeme y dame ese descanso que solo tú puedes dar. Recuérdame que tu yugo es fácil y tu carga ligera. Restaura mi alma hoy, no porque lo haya ganado, sino porque eres fiel. En el nombre de Jesús, amén.',
  tags: ['Descanso'],
};

export const DEVOTIONAL_2026_05_16_EN: RepoDevocional = {
  id: 'matthew1128KJV',
  date: '2026-05-16',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Matthew 11:28 KJV: "Come unto me, all ye that labour and are heavy laden, and I will give you rest."',
  reflexion:
    "Spiritual weariness is one of the loneliest states that exists. It is not a lack of faith, but the result of carrying much for too long. It can show up as indifference toward things that once filled you, as an inability to pray, or as the feeling that God is very far away. If you have ever felt that, Jesus has a direct message for you: come.\n\nThe invitation of Jesus in Matthew 11 is not directed at the strong and productive, but at the burdened. He does not ask you to first recover before drawing near; He invites you to draw near in order to recover. The rest He offers is not merely physical, but a restoration of the soul: returning to the certainty that you are loved and that you do not have to earn your place. In His presence, burdens do not vanish all at once, but they become bearable.",
  para_meditar: [
    {
      cita: 'Isaiah 40:29',
      texto: 'He giveth power to the faint; and to them that have no might he increaseth strength.',
    },
    {
      cita: 'Isaiah 41:10',
      texto: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
    },
    {
      cita: 'Psalm 23:2-3',
      texto: 'He maketh me to lie down in green pastures: he leadeth me beside the still waters. He restoreth my soul.',
    },
  ],
  oracion:
    "Jesus, I am tired. Not only in my body, but in my spirit. I have carried for too long things that perhaps were never mine to carry alone.\n\nI come to You just as You promised: burdened. Receive me and give me the rest that only You can give. Remind me that Your yoke is easy and Your burden is light. Restore my soul today, not because I have earned it, but because You are faithful. In Jesus' name, amen.",
  tags: ['Spiritual Weariness'],
};

// ─── May 20 — Spiritual Discipline ───────────────────────────────────────────

export const DEVOCIONAL_2026_05_20: RepoDevocional = {
  id: 'hebreos1211RVR1960',
  date: '2026-05-20',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Hebreos 12:11 RVR1960: "Es verdad que ninguna disciplina al presente parece ser causa de gozo, sino de tristeza; pero después da fruto apacible de justicia a los que en ella han sido ejercitados."',
  reflexion:
    'Rendir partes de nuestra vida a Dios duele porque implica soltar el control. La disciplina espiritual —el ayuno, la obediencia, el silencio, el perdón— a menudo se siente como pérdida antes de sentirse como ganancia. Nuestra cultura promueve la comodidad como meta suprema, pero Jesús nos llama a algo diferente: a cargar nuestra cruz, a negarnos a nosotros mismos, a morir para vivir.\n\nHebreos usa la imagen del atletismo: el entrenamiento nunca es agradable en el momento, pero produce una capacidad que de otra manera no existiría. Dios no nos disciplina para aplastarnos; lo hace porque quiere que llevemos fruto real. El "fruto apacible de justicia" no crece en suelo cómodo. Crece en el terreno de la entrega, del sí pronunciado con esfuerzo, del no dicho a lo que nos destruye.',
  para_meditar: [
    {
      cita: 'Lucas 9:23',
      texto: 'Y decía a todos: Si alguno quiere venir en pos de mí, niéguese a sí mismo, tome su cruz cada día, y sígame.',
    },
    {
      cita: 'Romanos 12:1',
      texto: 'Así que, hermanos, os ruego por las misericordias de Dios, que presentéis vuestros cuerpos en sacrificio vivo, santo, agradable a Dios, que es vuestro culto racional.',
    },
    {
      cita: '1 Corintios 9:27',
      texto: 'Sino que golpeo mi cuerpo, y lo pongo en servidumbre, no sea que habiendo sido heraldo para otros, yo mismo venga a ser eliminado.',
    },
  ],
  oracion:
    'Padre, confieso que me cuesta rendirme. Hay partes de mí que quiero retener, hábitos que no quiero soltar, áreas donde no te he dado acceso. Hoy te pido valentía para la entrega.\n\nQue la disciplina no me asuste sino que me forme. Que cada "no" a lo que me daña sea un "sí" más profundo a ti. Transforma el proceso de moldearme en algo que pueda abrazar con esperanza, sabiendo que el fruto valdrá el esfuerzo. En el nombre de Jesús, amén.',
  tags: ['Disciplina'],
};

export const DEVOTIONAL_2026_05_20_EN: RepoDevocional = {
  id: 'hebrews1211KJV',
  date: '2026-05-20',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Hebrews 12:11 KJV: "Now no chastening for the present seemeth to be joyous, but grievous: nevertheless afterward it yieldeth the peaceable fruit of righteousness unto them which are exercised thereby."',
  reflexion:
    "Surrendering parts of our life to God hurts because it involves releasing control. Spiritual discipline — fasting, obedience, silence, forgiveness — often feels like loss before it feels like gain. Our culture promotes comfort as the supreme goal, but Jesus calls us to something different: to carry our cross, to deny ourselves, to die in order to live.\n\nHebrews uses the image of athletics: training is never pleasant in the moment, but it produces a capacity that would not otherwise exist. God does not discipline us to crush us; He does it because He wants us to bear real fruit. The 'peaceable fruit of righteousness' does not grow in comfortable soil. It grows in the terrain of surrender, of a yes spoken with effort, of a no said to what destroys us.",
  para_meditar: [
    {
      cita: 'Luke 9:23',
      texto: 'And he said to them all, If any man will come after me, let him deny himself, and take up his cross daily, and follow me.',
    },
    {
      cita: 'Romans 12:1',
      texto: 'I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.',
    },
    {
      cita: '1 Corinthians 9:27',
      texto: 'But I keep under my body, and bring it into subjection: lest that by any means, when I have preached to others, I myself should be a castaway.',
    },
  ],
  oracion:
    "Father, I confess that surrender is hard for me. There are parts of myself I want to keep, habits I do not want to release, areas where I have not given You access. Today I ask You for the courage to surrender.\n\nMay discipline not frighten me but form me. May every 'no' to what harms me be a deeper 'yes' to You. Transform the process of being shaped into something I can embrace with hope, knowing the fruit will be worth the effort. In Jesus' name, amen.",
  tags: ['Spiritual Discipline'],
};

// ─── May 22 — Youth and Identity ─────────────────────────────────────────────

export const DEVOCIONAL_2026_05_22: RepoDevocional = {
  id: 'jeremias15RVR1960',
  date: '2026-05-22',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Jeremías 1:5 RVR1960: "Antes que te formase en el vientre te conocí, y antes que nacieses te santifiqué, te di por profeta a las naciones."',
  reflexion:
    'La soledad de no saber quién eres tiene un peso particular en la juventud. Vivimos en una era donde la identidad se construye —o se destruye— en pantallas, en comparaciones, en cuántos likes recibes y qué rol juegas en el grupo. En medio de esa presión, Dios le dice a Jeremías algo que lo precede todo: yo te conocí antes de que existieras.\n\nEsa afirmación no es solo histórica; es personal. Dios te conoce no como concepto abstracto, sino como individuo único, con nombre, con historia, con propósito específico. Tu identidad no se construye desde afuera hacia adentro —desde lo que el mundo opina de ti— sino desde adentro hacia afuera: desde lo que Dios dice que eres. La soledad encuentra su nombre cuando deja de buscar quién eres en los demás y empieza a encontrarlo en Aquel que te formó.',
  para_meditar: [
    {
      cita: 'Salmo 139:14',
      texto: 'Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.',
    },
    {
      cita: 'Efesios 2:10',
      texto: 'Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano para que anduviésemos en ellas.',
    },
    {
      cita: '1 Timoteo 4:12',
      texto: 'Ninguno tenga en poco tu juventud, sino sé ejemplo de los creyentes en palabra, conducta, amor, espíritu, fe y pureza.',
    },
  ],
  oracion:
    'Dios que me conociste antes de que yo me conociera a mí mismo: ayúdame a anclar mi identidad en ti. Cansa me de buscarme en los ojos de otros y en los espejos rotos del mundo.\n\nQue sepa quién soy porque sé de quién soy. Transforma mi soledad en solitud —ese espacio donde puedo escucharte y descubrir el propósito con que me creaste. En el nombre de Jesús, amén.',
  tags: ['Identidad'],
};

export const DEVOTIONAL_2026_05_22_EN: RepoDevocional = {
  id: 'jeremiah15KJV',
  date: '2026-05-22',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Jeremiah 1:5 KJV: "Before I formed thee in the belly I knew thee; and before thou camest forth out of the womb I sanctified thee, and I ordained thee a prophet unto the nations."',
  reflexion:
    "The loneliness of not knowing who you are carries a particular weight in youth. We live in an era where identity is built — or destroyed — on screens, in comparisons, in how many likes you receive and what role you play in the group. Amid that pressure, God tells Jeremiah something that precedes everything: I knew you before you existed.\n\nThat declaration is not merely historical; it is personal. God knows you not as an abstract concept, but as a unique individual, with a name, a story, a specific purpose. Your identity is not built from the outside in — from what the world thinks of you — but from the inside out: from what God says you are. Loneliness finds its name when it stops looking for who you are in others and starts finding it in the One who formed you.",
  para_meditar: [
    {
      cita: 'Psalm 139:14',
      texto: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
    },
    {
      cita: 'Ephesians 2:10',
      texto: 'For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.',
    },
    {
      cita: '1 Timothy 4:12',
      texto: 'Let no man despise thy youth; but be thou an example of the believers, in word, in conversation, in charity, in spirit, in faith, in purity.',
    },
  ],
  oracion:
    "God who knew me before I knew myself: help me anchor my identity in You. May I grow tired of searching for myself in the eyes of others and in the broken mirrors of the world.\n\nMay I know who I am because I know Whose I am. Transform my loneliness into solitude — that space where I can hear You and discover the purpose for which You created me. In Jesus' name, amen.",
  tags: ['Identity'],
};

// ─── May 23 — Grief and Loss ──────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_23: RepoDevocional = {
  id: 'salmos568RVR1960',
  date: '2026-05-23',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Salmos 56:8 RVR1960: "Mis huidas tú has contado; pon mis lágrimas en tu redoma; ¿No están ellas en tu libro?"',
  reflexion:
    'El duelo tiene mala prensa en algunos círculos cristianos, como si llorar fuera una señal de poca fe. Pero la Biblia no evita el dolor; lo nombra. David, el hombre conforme al corazón de Dios, llora con toda libertad. Jesús lloró ante la tumba de Lázaro, aunque sabía lo que iba a hacer. El dolor no es lo opuesto de la fe; es el camino por el que a veces transita la fe.\n\nLo que Dios hace con nuestras lágrimas es extraordinario: las guarda. La imagen de la redoma —el recipiente donde se guardaban las lágrimas en el antiguo Oriente— dice que nuestro dolor no es insignificante ni inadvertido. Dios no nos dice "ya supéralo"; nos dice "yo vi cada lágrima". En el dolor más profundo, la oración no siempre tiene palabras; a veces es solo un llanto honesto ante un Dios que lo recibe como ofrenda.',
  para_meditar: [
    {
      cita: '2 Corintios 1:3-4',
      texto: 'Bendito sea el Dios y Padre de nuestro Señor Jesucristo, Padre de misericordias y Dios de toda consolación, el cual nos consuela en todas nuestras tribulaciones.',
    },
    {
      cita: 'Apocalipsis 21:4',
      texto: 'Enjugará Dios toda lágrima de los ojos de ellos; y ya no habrá muerte, ni habrá más llanto, ni clamor, ni dolor.',
    },
    {
      cita: 'Juan 16:22',
      texto: 'También vosotros ahora tenéis tristeza; pero os volveré a ver, y se gozará vuestro corazón, y nadie os quitará vuestro gozo.',
    },
  ],
  oracion:
    'Padre, hoy no tengo palabras, solo lágrimas. Y si es verdad que las guardas en tu redoma, entonces estás recibiendo una ofrenda de honestidad que no sé dar de otra manera.\n\nConsuélame con tu presencia, no con respuestas fáciles. Acompáñame en este dolor sin apurarte a quitármelo. Y cuando llegue el momento, transforma este duelo en algo que solo tú puedes hacer: en testimonio de tu fidelidad. En el nombre de Jesús, amén.',
  tags: ['Duelo'],
};

export const DEVOTIONAL_2026_05_23_EN: RepoDevocional = {
  id: 'psalm568KJV',
  date: '2026-05-23',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Psalm 56:8 KJV: "Thou tellest my wanderings: put thou my tears into thy bottle: are they not in thy book?"',
  reflexion:
    "Grief has a bad reputation in some Christian circles, as if crying were a sign of weak faith. But the Bible does not avoid pain; it names it. David, the man after God's own heart, weeps with complete freedom. Jesus wept at the tomb of Lazarus, even though He knew what He was about to do. Pain is not the opposite of faith; it is sometimes the road faith travels.\n\nWhat God does with our tears is extraordinary: He keeps them. The image of the bottle — the vessel used to collect tears in the ancient Near East — says that our pain is neither insignificant nor unnoticed. God does not tell us 'just get over it'; He says 'I saw every tear.' In the deepest pain, prayer does not always have words; sometimes it is just an honest weeping before a God who receives it as an offering.",
  para_meditar: [
    {
      cita: '2 Corinthians 1:3-4',
      texto: 'Blessed be God, even the Father of our Lord Jesus Christ, the Father of mercies, and the God of all comfort; who comforteth us in all our tribulation.',
    },
    {
      cita: 'Revelation 21:4',
      texto: 'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain.',
    },
    {
      cita: 'John 16:22',
      texto: 'And ye now therefore have sorrow: but I will see you again, and your heart shall rejoice, and your joy no man taketh from you.',
    },
  ],
  oracion:
    "Father, today I have no words, only tears. And if it is true that You keep them in Your bottle, then You are receiving an offering of honesty that I do not know how to give any other way.\n\nComfort me with Your presence, not with easy answers. Stay with me in this pain without rushing to take it away. And when the time comes, transform this grief into something only You can do: a testimony of Your faithfulness. In Jesus' name, amen.",
  tags: ['Grief and Loss'],
};

// ─── May 25 — New Beginnings ──────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_25: RepoDevocional = {
  id: 'isaias4319RVR1960',
  date: '2026-05-25',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Isaías 43:19 RVR1960: "He aquí que yo hago cosa nueva; pronto saldrá a luz; ¿no la conoceréis? Otra vez abriré camino en el desierto, y ríos en la soledad."',
  reflexion:
    'Los comienzos nuevos asustan, incluso cuando los hemos pedido. Hay algo en el ser humano que se aferra a lo conocido aunque sea doloroso, porque al menos es predecible. Pero Dios tiene una firma característica: hace cosas nuevas. No recicla, no remienda por encima; transforma desde adentro y abre caminos donde parecía no haber ninguno.\n\nLa promesa de Isaías 43:19 es doble: algo nuevo está sucediendo (presente), y hay un camino en el desierto (futuro). Dios no dice que el desierto desaparecerá inmediatamente, pero sí que habrá río en él. Comenzar de nuevo no significa ignorar lo que pasó; significa abrirte a que Dios escriba los próximos capítulos. El corazón que aprende a comenzar de nuevo es el que ha dejado de creer que el pasado define el futuro.',
  para_meditar: [
    {
      cita: '2 Corintios 5:17',
      texto: 'De modo que si alguno está en Cristo, nueva criatura es; las cosas viejas pasaron; he aquí todas son hechas nuevas.',
    },
    {
      cita: 'Lamentaciones 3:22-23',
      texto: 'Por la misericordia de Jehová no hemos sido consumidos, porque nunca decayeron sus misericordias. Nuevas son cada mañana; grande es tu fidelidad.',
    },
    {
      cita: 'Filipenses 3:13-14',
      texto: 'Olvidando ciertamente lo que queda atrás, y extendiéndome a lo que está delante, prosigo a la meta, al premio del supremo llamamiento de Dios en Cristo Jesús.',
    },
  ],
  oracion:
    'Dios de lo nuevo, hoy vengo con el peso de lo viejo pero con el deseo de comenzar. Hay páginas que quisiera no haber escrito, pero que no puedo borrar. Tú sí puedes redimirlas.\n\nAbre camino donde yo solo veo desierto. Dame la valentía de soltar lo que fue y abrirme a lo que puede ser. Que el miedo al comienzo no me robe la vida que tienes para mí. En el nombre de Jesús, amén.',
  tags: ['Nuevos Comienzos'],
};

export const DEVOTIONAL_2026_05_25_EN: RepoDevocional = {
  id: 'isaiah4319KJV',
  date: '2026-05-25',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Isaiah 43:19 KJV: "Behold, I will do a new thing; now it shall spring forth; shall ye not know it? I will even make a way in the wilderness, and rivers in the desert."',
  reflexion:
    "New beginnings are frightening, even when we have asked for them. Something in the human heart clings to the familiar even when it is painful, because at least it is predictable. But God has a characteristic signature: He does new things. He does not recycle or patch over the surface; He transforms from within and opens paths where there seemed to be none.\n\nThe promise of Isaiah 43:19 is twofold: something new is happening (present), and there is a way in the wilderness (future). God does not say the desert will immediately disappear, but that there will be a river in it. Starting over does not mean ignoring what happened; it means opening yourself to God writing the next chapters. The heart that learns to begin again is the one that has stopped believing the past defines the future.",
  para_meditar: [
    {
      cita: '2 Corinthians 5:17',
      texto: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
    },
    {
      cita: 'Lamentations 3:22-23',
      texto: "It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",
    },
    {
      cita: 'Philippians 3:13-14',
      texto: 'Forgetting those things which are behind, and reaching forth unto those things which are before, I press toward the mark for the prize of the high calling of God in Christ Jesus.',
    },
  ],
  oracion:
    "God of new things, today I come with the weight of the old but with the desire to begin. There are pages I wish I had not written, but cannot erase. You can redeem them.\n\nOpen a way where I see only desert. Give me the courage to release what was and open myself to what can be. May the fear of beginning not rob me of the life You have for me. In Jesus' name, amen.",
  tags: ['New Beginnings'],
};

// ─── May 26 — Loneliness ──────────────────────────────────────────────────────

export const DEVOCIONAL_2026_05_26: RepoDevocional = {
  id: 'deuteronomio318RVR1960',
  date: '2026-05-26',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Deuteronomio 31:8 RVR1960: "Y Jehová va delante de ti; él estará contigo, no te dejará, ni te desamparará; no temas ni te intimides."',
  reflexion:
    'La soledad de un cuarto vacío no es solo física; es la sensación de que nadie está al tanto de tu mundo interior. Puedes estar rodeado de personas y sentirte completamente solo. Es una de las experiencias más universales y al mismo tiempo más privadas que existen. En esa soledad, Dios hace una promesa que Moisés le repite a Josué en uno de los momentos más vulnerables de la historia de Israel: no te dejaré.\n\nLa promesa no es que la soledad desaparecerá instantáneamente, sino que nunca estás solo en ella. Hay una diferencia enorme entre estar solo y estar acompañado en la soledad. Dios no solo va contigo; va delante de ti. Ya conoce el cuarto vacío al que te diriges. Ya estuvo ahí. Ya preparó su presencia para cuando llegues. La soledad, en manos de Dios, puede convertirse en el lugar donde aprendes a escucharle como en ningún otro.',
  para_meditar: [
    {
      cita: 'Salmo 23:4',
      texto: 'Aunque ande en valle de sombra de muerte, no temeré mal alguno, porque tú estarás conmigo.',
    },
    {
      cita: 'Mateo 28:20',
      texto: 'He aquí yo estoy con vosotros todos los días, hasta el fin del mundo.',
    },
    {
      cita: 'Hebreos 13:5',
      texto: 'No te desampararé, ni te dejaré.',
    },
  ],
  oracion:
    'Señor, hoy el cuarto se siente vacío. Las personas que quisiera tener cerca están lejos, o simplemente no comprenden. Y en ese vacío, tú eres lo único que queda.\n\nQue ese "lo único" sea suficiente hoy. Que tu presencia llene lo que ninguna persona puede llenar. Transforma mi soledad en el lugar donde más te encuentro. Y si es posible, envíame también la presencia de alguien que me recuerde que no estoy solo. En el nombre de Jesús, amén.',
  tags: ['Soledad'],
};

export const DEVOTIONAL_2026_05_26_EN: RepoDevocional = {
  id: 'deuteronomy318KJV',
  date: '2026-05-26',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Deuteronomy 31:8 KJV: "And the LORD, he it is that doth go before thee; he will be with thee, he will not fail thee, neither forsake thee: fear not, neither be dismayed."',
  reflexion:
    "The loneliness of an empty room is not only physical; it is the feeling that no one is aware of your inner world. You can be surrounded by people and feel completely alone. It is one of the most universal and at the same time most private experiences that exist. In that loneliness, God makes a promise that Moses repeats to Joshua at one of the most vulnerable moments in Israel's history: I will not leave you.\n\nThe promise is not that loneliness will vanish instantly, but that you are never alone in it. There is an enormous difference between being alone and being accompanied in solitude. God does not only go with you; He goes before you. He already knows the empty room you are heading toward. He was already there. He already prepared His presence for when you arrive. Loneliness, in God's hands, can become the place where you learn to hear Him as nowhere else.",
  para_meditar: [
    {
      cita: 'Psalm 23:4',
      texto: 'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me.',
    },
    {
      cita: 'Matthew 28:20',
      texto: 'Lo, I am with you alway, even unto the end of the world.',
    },
    {
      cita: 'Hebrews 13:5',
      texto: 'I will never leave thee, nor forsake thee.',
    },
  ],
  oracion:
    "Lord, today the room feels empty. The people I wish were near are far away, or simply do not understand. And in that emptiness, You are all that remains.\n\nMay that 'all that remains' be enough today. May Your presence fill what no person can fill. Transform my loneliness into the place where I find You most. And if it is possible, also send me the presence of someone who reminds me I am not alone. In Jesus' name, amen.",
  tags: ['Loneliness'],
};

// ─── May 27 — Doubt and Questions ────────────────────────────────────────────

export const DEVOCIONAL_2026_05_27: RepoDevocional = {
  id: 'marcos924RVR1960',
  date: '2026-05-27',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Marcos 9:24 RVR1960: "E inmediatamente el padre del muchacho clamó y dijo: Creo; ayuda mi incredulidad."',
  reflexion:
    'La duda no es lo opuesto de la fe; es parte del camino de la fe. Los que nunca dudan quizás nunca han creído con suficiente profundidad como para que algo les cueste. El padre del evangelio de Marcos es quizás el creyente más honesto de toda la Escritura: en la misma frase declara fe y pide ayuda para su incredulidad. No finge. No actúa. Llega a Jesús tal como está.\n\nLa incertidumbre es incómoda, pero abrazar la fe en medio de ella es un acto de valentía, no de debilidad. Job dudó, Tomás dudó, Juan el Bautista dudó —y ninguno de ellos fue descalificado por eso. Dios no asusta a las preguntas; las recibe. La fe que nunca ha sido probada por la duda es frágil. La fe que ha sobrevivido la noche de la incertidumbre tiene raíces profundas.',
  para_meditar: [
    {
      cita: 'Hebreos 11:1',
      texto: 'Es, pues, la fe la certeza de lo que se espera, la convicción de lo que no se ve.',
    },
    {
      cita: 'Juan 20:27',
      texto: 'Luego dijo a Tomás: Pon aquí tu dedo, y mira mis manos; y acerca tu mano, y métela en mi costado; y no seas incrédulo, sino creyente.',
    },
    {
      cita: 'Job 23:10',
      texto: 'Mas él conoce mi camino; me probará, y saldré como oro.',
    },
  ],
  oracion:
    'Señor, hoy traigo mis preguntas sin respuesta, mis dudas que no desaparecen solo por ignorarlas. No quiero fingir una fe que no tengo, ni abandonar la fe que sí tengo.\n\nComo el padre del evangelio: creo. Ayuda mi incredulidad. Que la honestidad de mi duda sea también una forma de buscarte. Que en la incertidumbre aprenda a confiar más en quién eres tú que en lo que entiendo yo. En el nombre de Jesús, amén.',
  tags: ['Dudas'],
};

export const DEVOTIONAL_2026_05_27_EN: RepoDevocional = {
  id: 'mark924KJV',
  date: '2026-05-27',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Mark 9:24 KJV: "And straightway the father of the child cried out, and said with tears, Lord, I believe; help thou mine unbelief."',
  reflexion:
    "Doubt is not the opposite of faith; it is part of the journey of faith. Those who never doubt have perhaps never believed deeply enough for something to cost them. The father in Mark's Gospel is perhaps the most honest believer in all of Scripture: in the same sentence he declares faith and asks for help with his unbelief. He does not pretend. He does not perform. He comes to Jesus as he is.\n\nUncertainty is uncomfortable, but embracing faith in the midst of it is an act of courage, not weakness. Job doubted, Thomas doubted, John the Baptist doubted — and none of them was disqualified for it. God is not frightened by questions; He receives them. Faith that has never been tested by doubt is fragile. Faith that has survived the night of uncertainty has deep roots.",
  para_meditar: [
    {
      cita: 'Hebrews 11:1',
      texto: 'Now faith is the substance of things hoped for, the evidence of things not seen.',
    },
    {
      cita: 'John 20:27',
      texto: 'Then saith he to Thomas, Reach hither thy finger, and behold my hands; and reach hither thy hand, and thrust it into my side: and be not faithless, but believing.',
    },
    {
      cita: 'Job 23:10',
      texto: 'But he knoweth the way that I take: when he hath tried me, I shall come forth as gold.',
    },
  ],
  oracion:
    "Lord, today I bring my unanswered questions, my doubts that do not disappear just by ignoring them. I do not want to fake a faith I do not have, nor abandon the faith I do have.\n\nLike the father in the Gospel: I believe. Help my unbelief. May the honesty of my doubt also be a way of seeking You. May in the uncertainty I learn to trust more in who You are than in what I understand. In Jesus' name, amen.",
  tags: ['Doubt'],
};

// ─── May 28 — Identity in Christ ─────────────────────────────────────────────

export const DEVOCIONAL_2026_05_28: RepoDevocional = {
  id: '1juan31RVR1960',
  date: '2026-05-28',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    '1 Juan 3:1 RVR1960: "Mirad cuál amor nos ha dado el Padre, para que seamos llamados hijos de Dios; por esto el mundo no nos conoce, porque no le conoció a él."',
  reflexion:
    'Vivimos buscando validación en los lugares equivocados: el trabajo que define nuestro valor, la pareja que confirma que somos amables, los logros que demuestran que merecemos existir. Esa búsqueda agota porque ningún logro ni ninguna persona puede darte permanentemente lo que solo Dios puede darte: un valor que no depende de tu rendimiento.\n\nJuan queda asombrado: "mirad cuál amor". No lo da por sentado. El hecho de que seamos llamados hijos de Dios no es un dato de rutina sino una revelación que debería detenernos. Tu verdadero valor no se construye; se recibe. No se gana; se hereda. Redescubrir quiénes somos en Cristo no es un ejercicio de autoestima; es un acto de fe: elegir creer lo que Dios dice sobre ti por encima de lo que dice el espejo, el jefe, o la voz interna que nunca está satisfecha.',
  para_meditar: [
    {
      cita: 'Efesios 2:10',
      texto: 'Porque somos hechura suya, creados en Cristo Jesús para buenas obras, las cuales Dios preparó de antemano para que anduviésemos en ellas.',
    },
    {
      cita: 'Salmo 139:14',
      texto: 'Te alabaré; porque formidables, maravillosas son tus obras; estoy maravillado, y mi alma lo sabe muy bien.',
    },
    {
      cita: 'Gálatas 3:26',
      texto: 'Pues todos sois hijos de Dios por la fe en Cristo Jesús.',
    },
  ],
  oracion:
    'Padre, hoy quiero creer lo que dices sobre mí, aunque me cueste. Hay voces que me dicen que no soy suficiente, que tengo que demostrar más, que mi valor está en lo que produzco.\n\nRecuérdame que antes de cualquier logro, antes de cualquier fracaso, soy tu hijo. Que esa verdad sea más fuerte que cualquier otra. Que pueda vivir desde ese lugar de amor recibido, no de amor por ganar. En el nombre de Jesús, amén.',
  tags: ['Identidad en Cristo'],
};

export const DEVOTIONAL_2026_05_28_EN: RepoDevocional = {
  id: '1john31KJV',
  date: '2026-05-28',
  language: 'en',
  version: 'KJV',
  versiculo:
    '1 John 3:1 KJV: "Behold, what manner of love the Father hath bestowed upon us, that we should be called the sons of God: therefore the world knoweth us not, because it knew him not."',
  reflexion:
    "We live searching for validation in the wrong places: the job that defines our worth, the relationship that confirms we are lovable, the achievements that prove we deserve to exist. That search is exhausting because no achievement and no person can permanently give you what only God can give you: a worth that does not depend on your performance.\n\nJohn is astonished: 'Behold, what manner of love.' He does not take it for granted. The fact that we are called children of God is not routine information but a revelation that should stop us. Your true worth is not built; it is received. It is not earned; it is inherited. Rediscovering who we are in Christ is not a self-esteem exercise; it is an act of faith: choosing to believe what God says about you above what the mirror, the boss, or the inner voice that is never satisfied says.",
  para_meditar: [
    {
      cita: 'Ephesians 2:10',
      texto: 'For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them.',
    },
    {
      cita: 'Psalm 139:14',
      texto: 'I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works; and that my soul knoweth right well.',
    },
    {
      cita: 'Galatians 3:26',
      texto: 'For ye are all the children of God by faith in Christ Jesus.',
    },
  ],
  oracion:
    "Father, today I want to believe what You say about me, even when it costs me. There are voices telling me I am not enough, that I must prove more, that my worth is in what I produce.\n\nRemind me that before any achievement, before any failure, I am Your child. May that truth be stronger than any other. May I live from that place of received love, not of love yet to be earned. In Jesus' name, amen.",
  tags: ['Identity in Christ'],
};

// ─── May 30 — Broken Relationships ───────────────────────────────────────────

export const DEVOCIONAL_2026_05_30: RepoDevocional = {
  id: 'colosenses313RVR1960',
  date: '2026-05-30',
  language: 'es',
  version: 'RVR1960',
  versiculo:
    'Colosenses 3:13 RVR1960: "Soportándoos unos a otros, y perdonándoos unos a otros si alguno tuviere queja contra otro. De la manera que Cristo os perdonó, así también hacedlo vosotros."',
  reflexion:
    'Las relaciones rotas son quizás la herida más común y más difícil de sanar. Una traición, una palabra dicha en el momento equivocado, años de silencio acumulado —el daño entre personas puede ser profundo y duradero. Y sin embargo, Dios tiene la costumbre de entrar precisamente en esos espacios quebrados para hacer algo que parecía imposible.\n\nPablo no banaliza el perdón cuando dice "soportándoos unos a otros". Soportar implica que hay algo que cuesta. El perdón cristiano no es fingir que no pasó nada, ni borrar el dolor por decreto. Es un proceso que comienza con una decisión: soltar el derecho a cobrar la deuda. Lo que Dios puede restaurar va más allá de lo que nosotros podemos imaginar. Algunas relaciones se sanan por completo; otras se transforman en algo diferente pero también valioso. Lo que Dios menda, nunca queda igual —queda mejor.',
  para_meditar: [
    {
      cita: 'Efesios 4:32',
      texto: 'Antes sed benignos unos con otros, misericordiosos, perdonándoos unos a otros, como Dios también os perdonó a vosotros en Cristo.',
    },
    {
      cita: 'Génesis 50:20',
      texto: 'Vosotros pensasteis mal contra mí, mas Dios lo encaminó a bien.',
    },
    {
      cita: 'Mateo 18:21-22',
      texto: 'Pedro le dijo: Señor, ¿cuántas veces perdonaré a mi hermano que peque contra mí? ¿Hasta siete? Jesús le dijo: No te digo hasta siete, sino aun hasta setenta veces siete.',
    },
  ],
  oracion:
    'Señor, hay relaciones en mi vida que están rotas o heridas. Algunas duelen más de lo que puedo expresar. Y en algunas, reconozco que yo también he contribuido al daño.\n\nDame la gracia de perdonar como has perdonado tú: no porque el otro lo merezca, sino porque el perdón me libera a mí también. Sana lo que puede ser sanado. Transforma lo que no puede volver a ser como antes. Y donde hay reconciliación posible, dame el valor de dar el primer paso. En el nombre de Jesús, amén.',
  tags: ['Relaciones'],
};

export const DEVOTIONAL_2026_05_30_EN: RepoDevocional = {
  id: 'colossians313KJV',
  date: '2026-05-30',
  language: 'en',
  version: 'KJV',
  versiculo:
    'Colossians 3:13 KJV: "Forbearing one another, and forgiving one another, if any man have a quarrel against any: even as Christ forgave you, so also do ye."',
  reflexion:
    "Broken relationships are perhaps the most common and most difficult wound to heal. A betrayal, a word said at the wrong moment, years of accumulated silence — the damage between people can be deep and lasting. And yet, God has a habit of entering precisely those broken spaces to do something that seemed impossible.\n\nPaul does not trivialize forgiveness when he says 'forbearing one another.' Forbearing implies there is something that is costly. Christian forgiveness is not pretending nothing happened, nor erasing pain by decree. It is a process that begins with a decision: releasing the right to collect the debt. What God can restore goes beyond what we can imagine. Some relationships heal completely; others are transformed into something different but also valuable. What God mends never stays the same — it becomes better.",
  para_meditar: [
    {
      cita: 'Ephesians 4:32',
      texto: 'And be ye kind one to another, tenderhearted, forgiving one another, even as God for Christ\'s sake hath forgiven you.',
    },
    {
      cita: 'Genesis 50:20',
      texto: 'But as for you, ye thought evil against me; but God meant it unto good.',
    },
    {
      cita: 'Matthew 18:21-22',
      texto: 'Then came Peter to him, and said, Lord, how oft shall my brother sin against me, and I forgive him? till seven times? Jesus saith unto him, I say not unto thee, Until seven times: but, Until seventy times seven.',
    },
  ],
  oracion:
    "Lord, there are relationships in my life that are broken or wounded. Some hurt more than I can express. And in some of them, I recognize that I too have contributed to the damage.\n\nGive me the grace to forgive as You have forgiven: not because the other person deserves it, but because forgiveness also sets me free. Heal what can be healed. Transform what cannot go back to what it was. And where reconciliation is possible, give me the courage to take the first step. In Jesus' name, amen.",
  tags: ['Broken Relationships'],
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
  '2026-05-10': { es: DEVOCIONAL_2026_05_10,  en: DEVOTIONAL_2026_05_10_EN,  imageUrl: REPO_IMAGES[10] }, // Forest path
  '2026-05-11': { es: DEVOCIONAL_2026_05_11,  en: DEVOTIONAL_2026_05_11_EN,  imageUrl: REPO_IMAGES[11] }, // Valley view
  '2026-05-13': { es: DEVOCIONAL_2026_05_13,  en: DEVOTIONAL_2026_05_13_EN,  imageUrl: REPO_IMAGES[0]  }, // Sunrise over mountains
  '2026-05-14': { es: DEVOCIONAL_2026_05_14,  en: DEVOTIONAL_2026_05_14_EN,  imageUrl: REPO_IMAGES[1]  }, // Golden field
  '2026-05-15': { es: DEVOCIONAL_2026_05_15,  en: DEVOTIONAL_2026_05_15_EN,  imageUrl: REPO_IMAGES[2]  }, // Misty forest
  '2026-05-16': { es: DEVOCIONAL_2026_05_16,  en: DEVOTIONAL_2026_05_16_EN,  imageUrl: REPO_IMAGES[3]  }, // Sunlight through trees
  '2026-05-20': { es: DEVOCIONAL_2026_05_20,  en: DEVOTIONAL_2026_05_20_EN,  imageUrl: REPO_IMAGES[4]  }, // Ocean waves
  '2026-05-22': { es: DEVOCIONAL_2026_05_22,  en: DEVOTIONAL_2026_05_22_EN,  imageUrl: REPO_IMAGES[5]  }, // Flowers
  '2026-05-23': { es: DEVOCIONAL_2026_05_23,  en: DEVOTIONAL_2026_05_23_EN,  imageUrl: REPO_IMAGES[6]  }, // Mountain valley
  '2026-05-25': { es: DEVOCIONAL_2026_05_25,  en: DEVOTIONAL_2026_05_25_EN,  imageUrl: REPO_IMAGES[7]  }, // Lake reflection
  '2026-05-26': { es: DEVOCIONAL_2026_05_26,  en: DEVOTIONAL_2026_05_26_EN,  imageUrl: REPO_IMAGES[8]  }, // Waterfall
  '2026-05-27': { es: DEVOCIONAL_2026_05_27,  en: DEVOTIONAL_2026_05_27_EN,  imageUrl: REPO_IMAGES[9]  }, // Mountain sunrise
  '2026-05-28': { es: DEVOCIONAL_2026_05_28,  en: DEVOTIONAL_2026_05_28_EN,  imageUrl: REPO_IMAGES[10] }, // Forest path
  '2026-05-30': { es: DEVOCIONAL_2026_05_30,  en: DEVOTIONAL_2026_05_30_EN,  imageUrl: REPO_IMAGES[11] }, // Valley view
};
