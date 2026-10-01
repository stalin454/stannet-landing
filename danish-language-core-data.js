/* StanNet Danish Academy — core language reference and drills. */
window.stannetDanishCore = {
  pronouns: {
    notes: [
      'El danés distingue forma de sujeto y forma de objeto, igual que “yo/me” en español.',
      'La tercera persona usa sig como reflexivo cuando sujeto y objeto se refieren a la misma persona.',
      'Los posesivos min/mit/mine y din/dit/dine concuerdan con el sustantivo poseído; hans/hendes/deres no cambian.',
      'La forma formal De existe, pero hoy es poco frecuente en la conversación cotidiana.'
    ],
    rows: [
      {person:'1ª singular',subject:'jeg',object:'mig',reflexive:'mig',possessive:'min / mit / mine',es:'yo / me / mi',example:'Jeg hedder Luis. Hun hjælper mig.'},
      {person:'2ª singular',subject:'du',object:'dig',reflexive:'dig',possessive:'din / dit / dine',es:'tú / te / tu',example:'Du taler dansk. Jeg ringer til dig.'},
      {person:'3ª singular masc.',subject:'han',object:'ham',reflexive:'sig',possessive:'hans',es:'él / lo-le / su',example:'Han arbejder. Jeg kender ham.'},
      {person:'3ª singular fem.',subject:'hun',object:'hende',reflexive:'sig',possessive:'hendes',es:'ella / la-le / su',example:'Hun studerer. Jeg ser hende.'},
      {person:'3ª singular común',subject:'den',object:'den',reflexive:'sig',possessive:'dens',es:'él/ella para sustantivo en',example:'Bilen er ny. Den er dyr.'},
      {person:'3ª singular neutro',subject:'det',object:'det',reflexive:'sig',possessive:'dets',es:'ello para sustantivo et',example:'Huset er stort. Det er gammelt.'},
      {person:'1ª plural',subject:'vi',object:'os',reflexive:'os',possessive:'vores',es:'nosotros / nos / nuestro',example:'Vi lærer dansk. Læreren hjælper os.'},
      {person:'2ª plural',subject:'I',object:'jer',reflexive:'jer',possessive:'jeres',es:'vosotros/ustedes / os / vuestro',example:'I kommer i morgen. Jeg skriver til jer.'},
      {person:'3ª plural',subject:'de',object:'dem',reflexive:'sig',possessive:'deres',es:'ellos / los-les / su',example:'De bor i Aarhus. Jeg besøger dem.'}
    ]
  },

  auxiliaries: [
    {verb:'have',present:'har',past:'havde',participle:'haft',role:'Auxiliar del perfecto',es:'haber / tener',pattern:'har + participio',example:'Jeg har arbejdet hele dagen.',translation:'He trabajado todo el día.',note:'Forma el perfecto con la mayoría de los verbos.'},
    {verb:'være',present:'er',past:'var',participle:'været',role:'Ser / estar y auxiliar',es:'ser / estar',pattern:'er/var + complemento',example:'Jeg er hjemme. Jeg har været i Danmark.',translation:'Estoy en casa. He estado en Dinamarca.',note:'También participa en ciertos perfectos de cambio/movimiento y en construcciones predicativas.'},
    {verb:'blive',present:'bliver',past:'blev',participle:'blevet',role:'Cambio de estado y pasiva',es:'convertirse / quedarse / ser',pattern:'blive + participio',example:'Huset bliver solgt.',translation:'La casa es vendida / se vende.',note:'Es fundamental para la voz pasiva y para expresar cambio de estado.'},
    {verb:'kunne',present:'kan',past:'kunne',participle:'kunnet',role:'Capacidad / posibilidad',es:'poder / saber hacer',pattern:'kan + infinitivo sin at',example:'Jeg kan tale lidt dansk.',translation:'Puedo hablar un poco de danés.',note:'Después de kan el infinitivo va sin at.'},
    {verb:'skulle',present:'skal',past:'skulle',participle:'skullet',role:'Plan / obligación',es:'deber / ir a',pattern:'skal + infinitivo',example:'Jeg skal arbejde i morgen.',translation:'Voy a trabajar mañana.',note:'Puede expresar plan decidido, obligación o instrucción según contexto.'},
    {verb:'ville',present:'vil',past:'ville',participle:'villet',role:'Voluntad / intención / futuro',es:'querer / futuro',pattern:'vil + infinitivo',example:'Jeg vil lære dansk.',translation:'Quiero aprender danés.',note:'vil expresa voluntad; no equivale automáticamente a todo futuro español.'},
    {verb:'måtte',present:'må',past:'måtte',participle:'måttet',role:'Permiso / necesidad',es:'poder / tener que',pattern:'må + infinitivo',example:'Må jeg komme ind?',translation:'¿Puedo entrar?',note:'Según contexto expresa permiso o necesidad.'},
    {verb:'burde',present:'bør',past:'burde',participle:'burdet',role:'Consejo / deber moral',es:'debería',pattern:'bør + infinitivo',example:'Du bør øve dig hver dag.',translation:'Deberías practicar cada día.',note:'Menos fuerte que skal.'},
    {verb:'turde',present:'tør',past:'turde',participle:'turdet',role:'Atreverse',es:'atreverse',pattern:'tør + infinitivo',example:'Jeg tør tale dansk.',translation:'Me atrevo a hablar danés.',note:'Modal frecuente para valentía o atrevimiento.'}
  ],

  verbs: [
    {group:'irregular',da:'være',es:'ser / estar',imp:'vær',pres:'er',past:'var',part:'været',aux:'har',example:'Jeg er klar.',passive:null,note:'Verbo fundamental y altamente irregular.'},
    {group:'irregular',da:'have',es:'tener / haber',imp:'hav',pres:'har',past:'havde',part:'haft',aux:'har',example:'Jeg har tid.',passive:null,note:'También auxiliar del perfecto.'},
    {group:'irregular',da:'blive',es:'convertirse / quedarse',imp:'bliv',pres:'bliver',past:'blev',part:'blevet',aux:'er',example:'Jeg bliver hjemme.',passive:null,note:'También auxiliar de pasiva.'},
    {group:'irregular',da:'gøre',es:'hacer',imp:'gør',pres:'gør',past:'gjorde',part:'gjort',aux:'har',example:'Hvad gør du?',passive:'Det bliver gjort i dag.',note:'Muy frecuente en preguntas y expresiones fijas.'},
    {group:'irregular',da:'gå',es:'ir / caminar',imp:'gå',pres:'går',past:'gik',part:'gået',aux:'har',example:'Jeg går hjem.',passive:null,note:'“er gået” expresa a menudo resultado: se ha ido.'},
    {group:'irregular',da:'komme',es:'venir / llegar',imp:'kom',pres:'kommer',past:'kom',part:'kommet',aux:'er',example:'Jeg kommer i morgen.',passive:null,note:'El perfecto de llegada usa frecuentemente er kommet.'},
    {group:'irregular',da:'tage',es:'tomar / coger',imp:'tag',pres:'tager',past:'tog',part:'taget',aux:'har',example:'Jeg tager toget.',passive:'Toget bliver taget ud af drift.',note:'Muy frecuente en transporte y expresiones.'},
    {group:'irregular',da:'se',es:'ver',imp:'se',pres:'ser',past:'så',part:'set',aux:'har',example:'Jeg ser filmen.',passive:'Filmen bliver set af mange.',note:'Pretérito muy irregular: så.'},
    {group:'irregular',da:'sige',es:'decir',imp:'sig',pres:'siger',past:'sagde',part:'sagt',aux:'har',example:'Hvad siger du?',passive:'Det bliver sagt ofte.',note:'No confundir imperativo sig con pronombre reflexivo sig.'},
    {group:'irregular',da:'få',es:'recibir / conseguir',imp:'få',pres:'får',past:'fik',part:'fået',aux:'har',example:'Jeg får en besked.',passive:null,note:'Uno de los verbos irregulares más frecuentes.'},
    {group:'irregular',da:'give',es:'dar',imp:'giv',pres:'giver',past:'gav',part:'givet',aux:'har',example:'Jeg giver dig bogen.',passive:'Bogen bliver givet til eleven.',note:'Alternancia giver/gav/givet.'},
    {group:'irregular',da:'finde',es:'encontrar',imp:'find',pres:'finder',past:'fandt',part:'fundet',aux:'har',example:'Jeg finder en løsning.',passive:'En løsning bliver fundet.',note:'Fuerte: fandt/fundet.'},
    {group:'irregular',da:'vide',es:'saber',imp:'vid',pres:'ved',past:'vidste',part:'vidst',aux:'har',example:'Jeg ved det ikke.',passive:null,note:'Presente irregular ved.'},
    {group:'regular',da:'kende',es:'conocer',imp:'kend',pres:'kender',past:'kendte',part:'kendt',aux:'har',example:'Jeg kender byen.',passive:'Byen er kendt i Danmark.',note:'Distingue kende (conocer) de vide (saber un dato).'},
    {group:'irregular',da:'skrive',es:'escribir',imp:'skriv',pres:'skriver',past:'skrev',part:'skrevet',aux:'har',example:'Jeg skriver en mail.',passive:'Mailen bliver skrevet nu.',note:'Fuerte: skrev/skrevet.'},
    {group:'regular',da:'læse',es:'leer',imp:'læs',pres:'læser',past:'læste',part:'læst',aux:'har',example:'Jeg læser en bog.',passive:'Bogen bliver læst.',note:'Patrón regular frecuente.'},
    {group:'regular',da:'spise',es:'comer',imp:'spis',pres:'spiser',past:'spiste',part:'spist',aux:'har',example:'Jeg spiser morgenmad.',passive:'Maden bliver spist.',note:'Patrón en -te.'},
    {group:'irregular',da:'drikke',es:'beber',imp:'drik',pres:'drikker',past:'drak',part:'drukket',aux:'har',example:'Jeg drikker kaffe.',passive:'Kaffen bliver drukket.',note:'Fuerte: drak/drukket.'},
    {group:'irregular',da:'sove',es:'dormir',imp:'sov',pres:'sover',past:'sov',part:'sovet',aux:'har',example:'Jeg sover godt.',passive:null,note:'Imperativo y pasado coinciden: sov.'},
    {group:'regular',da:'arbejde',es:'trabajar',imp:'arbejd',pres:'arbejder',past:'arbejdede',part:'arbejdet',aux:'har',example:'Jeg arbejder i Danmark.',passive:'Der arbejdes på sagen.',note:'Verbo regular de alta frecuencia.'},
    {group:'regular',da:'studere',es:'estudiar',imp:'studer',pres:'studerer',past:'studerede',part:'studeret',aux:'har',example:'Jeg studerer dansk.',passive:'Dansk bliver studeret på kurset.',note:'Patrón regular en -ede.'},
    {group:'regular',da:'tale',es:'hablar',imp:'tal',pres:'taler',past:'talte',part:'talt',aux:'har',example:'Jeg taler dansk.',passive:'Dansk tales i Danmark.',note:'Pasiva -s muy natural en afirmaciones generales.'},
    {group:'regular',da:'bo',es:'vivir / residir',imp:'bo',pres:'bor',past:'boede',part:'boet',aux:'har',example:'Jeg bor i Spanien.',passive:null,note:'Infinitivo e imperativo coinciden.'},
    {group:'regular',da:'købe',es:'comprar',imp:'køb',pres:'køber',past:'købte',part:'købt',aux:'har',example:'Jeg køber en billet.',passive:'Billetten bliver købt online.',note:'Patrón en -te.'},
    {group:'regular',da:'betale',es:'pagar',imp:'betal',pres:'betaler',past:'betalte',part:'betalt',aux:'har',example:'Jeg betaler med kort.',passive:'Regningen bliver betalt.',note:'Regular.'},
    {group:'irregular',da:'hjælpe',es:'ayudar',imp:'hjælp',pres:'hjælper',past:'hjalp',part:'hjulpet',aux:'har',example:'Kan du hjælpe mig?',passive:'Han bliver hjulpet.',note:'Fuerte: hjalp/hjulpet.'},
    {group:'regular',da:'bruge',es:'usar / necesitar tiempo',imp:'brug',pres:'bruger',past:'brugte',part:'brugt',aux:'har',example:'Jeg bruger computeren.',passive:'Computeren bliver brugt hver dag.',note:'Muy frecuente; også “bruge tid”.'},
    {group:'regular',da:'lære',es:'aprender / enseñar',imp:'lær',pres:'lærer',past:'lærte',part:'lært',aux:'har',example:'Jeg lærer dansk.',passive:'Dansk bliver lært gennem praksis.',note:'El contexto decide “aprender” o “enseñar”.'},
    {group:'irregular',da:'forstå',es:'entender',imp:'forstå',pres:'forstår',past:'forstod',part:'forstået',aux:'har',example:'Jeg forstår spørgsmålet.',passive:'Spørgsmålet bliver forstået.',note:'Fuerte: forstod/forstået.'}
  ],

  tenseLabels: [
    ['infinitive','Infinitivo'],
    ['imperative','Imperativo'],
    ['present','Presente'],
    ['past','Pretérito'],
    ['perfect','Perfecto'],
    ['pluperfect','Pluscuamperfecto'],
    ['futureVil','Futuro / intención con vil'],
    ['futureSkal','Plan futuro con skal'],
    ['futurePrediction','Predicción con kommer til at'],
    ['futurePerfect','Futuro perfecto'],
    ['conditional','Condicional con ville'],
    ['conditionalPerfect','Condicional perfecto'],
    ['presentParticiple','Participio presente'],
    ['pastParticiple','Participio pasado']
  ]
};