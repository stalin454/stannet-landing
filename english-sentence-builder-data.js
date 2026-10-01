/* StanNet English Academy — sentence builder data. */
window.stannetEnglishSentenceBuilder = {
  subjects:[
    {en:'I',es:'yo',person:0},{en:'you',es:'tú',person:1},{en:'he',es:'él',person:2},
    {en:'she',es:'ella',person:3},{en:'we',es:'nosotros',person:4},{en:'they',es:'ellos',person:5}
  ],
  modes:[
    {id:'statement',label:'Affirmative',hint:'SUBJECT + VERB / AUXILIARY + REST'},
    {id:'negative',label:'Negative',hint:'SUBJECT + AUXILIARY + NOT + VERB'},
    {id:'question',label:'Yes / No question',hint:'AUXILIARY + SUBJECT + VERB ?'},
    {id:'whQuestion',label:'Wh-question',hint:'WH-WORD + AUXILIARY + SUBJECT + VERB ?'}
  ],
  tenses:[
    {id:'presentSimple',label:'Present simple'},
    {id:'presentContinuous',label:'Present continuous'},
    {id:'pastSimple',label:'Past simple'},
    {id:'pastContinuous',label:'Past continuous'},
    {id:'presentPerfect',label:'Present perfect'},
    {id:'pastPerfect',label:'Past perfect'},
    {id:'futureWill',label:'Future with will'},
    {id:'futureGoingTo',label:'Future with going to'},
    {id:'conditional',label:'Conditional with would'},
    {id:'conditionalPerfect',label:'Conditional perfect'}
  ],
  whWords:[
    {en:'what',es:'qué'},{en:'where',es:'dónde'},{en:'when',es:'cuándo'},
    {en:'why',es:'por qué'},{en:'how',es:'cómo'}
  ],
  adverbs:[
    {en:'',es:'',label:'— no adverb —'},{en:'often',es:'a menudo',label:'often · a menudo'},
    {en:'always',es:'siempre',label:'always · siempre'},{en:'usually',es:'normalmente',label:'usually · normalmente'},
    {en:'sometimes',es:'a veces',label:'sometimes · a veces'},{en:'never',es:'nunca',label:'never · nunca'}
  ],
  places:[
    {en:'',es:'',label:'— no place —'},{en:'at home',es:'en casa',label:'at home · en casa'},
    {en:'in Spain',es:'en España',label:'in Spain · en España'},{en:'in Denmark',es:'en Dinamarca',label:'in Denmark · en Dinamarca'},
    {en:'at work',es:'en el trabajo',label:'at work · en el trabajo'},{en:'at school',es:'en la escuela',label:'at school · en la escuela'},
    {en:'in London',es:'en Londres',label:'in London · en Londres'}
  ],
  times:[
    {en:'',es:'',label:'— no time expression —'},{en:'today',es:'hoy',label:'today · hoy'},
    {en:'tomorrow',es:'mañana',label:'tomorrow · mañana'},{en:'yesterday',es:'ayer',label:'yesterday · ayer'},
    {en:'every day',es:'cada día',label:'every day · cada día'},{en:'in the morning',es:'por la mañana',label:'in the morning · por la mañana'},
    {en:'at night',es:'por la noche',label:'at night · por la noche'},{en:'on Monday',es:'el lunes',label:'on Monday · el lunes'}
  ],
  verbs:[
    {base:'work',third:'works',past:'worked',part:'worked',ing:'working',esInf:'trabajar',
      esPres:['trabajo','trabajas','trabaja','trabaja','trabajamos','trabajan'],esPast:['trabajé','trabajaste','trabajó','trabajó','trabajamos','trabajaron'],esPart:'trabajado',esGer:'trabajando',
      complements:[{en:'',es:'',label:'— no complement —'},{en:'with computers',es:'con ordenadores',label:'with computers · con ordenadores'},{en:'with customers',es:'con clientes',label:'with customers · con clientes'},{en:'in cybersecurity',es:'en ciberseguridad',label:'in cybersecurity · en ciberseguridad'}]},
    {base:'live',third:'lives',past:'lived',part:'lived',ing:'living',esInf:'vivir',
      esPres:['vivo','vives','vive','vive','vivimos','viven'],esPast:['viví','viviste','vivió','vivió','vivimos','vivieron'],esPart:'vivido',esGer:'viviendo',
      complements:[{en:'',es:'',label:'— no complement —'},{en:'with my family',es:'con mi familia',label:'with my family · con mi familia'},{en:'alone',es:'solo/a',label:'alone · solo/a'},{en:'with my partner',es:'con mi pareja',label:'with my partner · con mi pareja'}]},
    {base:'study',third:'studies',past:'studied',part:'studied',ing:'studying',esInf:'estudiar',
      esPres:['estudio','estudias','estudia','estudia','estudiamos','estudian'],esPast:['estudié','estudiaste','estudió','estudió','estudiamos','estudiaron'],esPart:'estudiado',esGer:'estudiando',
      complements:[{en:'English',es:'inglés',label:'English · inglés'},{en:'programming',es:'programación',label:'programming · programación'},{en:'cybersecurity',es:'ciberseguridad',label:'cybersecurity · ciberseguridad'}]},
    {base:'learn',third:'learns',past:'learned',part:'learned',ing:'learning',esInf:'aprender',
      esPres:['aprendo','aprendes','aprende','aprende','aprendemos','aprenden'],esPast:['aprendí','aprendiste','aprendió','aprendió','aprendimos','aprendieron'],esPart:'aprendido',esGer:'aprendiendo',
      complements:[{en:'English',es:'inglés',label:'English · inglés'},{en:'new words',es:'palabras nuevas',label:'new words · palabras nuevas'},{en:'grammar',es:'gramática',label:'grammar · gramática'}]},
    {base:'speak',third:'speaks',past:'spoke',part:'spoken',ing:'speaking',esInf:'hablar',
      esPres:['hablo','hablas','habla','habla','hablamos','hablan'],esPast:['hablé','hablaste','habló','habló','hablamos','hablaron'],esPart:'hablado',esGer:'hablando',
      complements:[{en:'English',es:'inglés',label:'English · inglés'},{en:'with my teacher',es:'con mi profesor/a',label:'with my teacher · con mi profesor/a'},{en:'with my colleagues',es:'con mis compañeros',label:'with my colleagues · con mis compañeros'}]},
    {base:'write',third:'writes',past:'wrote',part:'written',ing:'writing',esInf:'escribir',
      esPres:['escribo','escribes','escribe','escribe','escribimos','escriben'],esPast:['escribí','escribiste','escribió','escribió','escribimos','escribieron'],esPart:'escrito',esGer:'escribiendo',
      complements:[{en:'an email',es:'un correo',label:'an email · un correo'},{en:'a message',es:'un mensaje',label:'a message · un mensaje'},{en:'a report',es:'un informe',label:'a report · un informe'}]},
    {base:'read',third:'reads',past:'read',part:'read',ing:'reading',esInf:'leer',
      esPres:['leo','lees','lee','lee','leemos','leen'],esPast:['leí','leíste','leyó','leyó','leímos','leyeron'],esPart:'leído',esGer:'leyendo',
      complements:[{en:'a book',es:'un libro',label:'a book · un libro'},{en:'the news',es:'las noticias',label:'the news · las noticias'},{en:'an article',es:'un artículo',label:'an article · un artículo'}]},
    {base:'eat',third:'eats',past:'ate',part:'eaten',ing:'eating',esInf:'comer',
      esPres:['como','comes','come','come','comemos','comen'],esPast:['comí','comiste','comió','comió','comimos','comieron'],esPart:'comido',esGer:'comiendo',
      complements:[{en:'breakfast',es:'desayuno',label:'breakfast · desayuno'},{en:'lunch',es:'almuerzo',label:'lunch · almuerzo'},{en:'dinner',es:'cena',label:'dinner · cena'},{en:'a sandwich',es:'un sándwich',label:'a sandwich · un sándwich'}]},
    {base:'drink',third:'drinks',past:'drank',part:'drunk',ing:'drinking',esInf:'beber',
      esPres:['bebo','bebes','bebe','bebe','bebemos','beben'],esPast:['bebí','bebiste','bebió','bebió','bebimos','bebieron'],esPart:'bebido',esGer:'bebiendo',
      complements:[{en:'coffee',es:'café',label:'coffee · café'},{en:'water',es:'agua',label:'water · agua'},{en:'tea',es:'té',label:'tea · té'}]},
    {base:'buy',third:'buys',past:'bought',part:'bought',ing:'buying',esInf:'comprar',
      esPres:['compro','compras','compra','compra','compramos','compran'],esPast:['compré','compraste','compró','compró','compramos','compraron'],esPart:'comprado',esGer:'comprando',
      complements:[{en:'a ticket',es:'un billete',label:'a ticket · un billete'},{en:'a book',es:'un libro',label:'a book · un libro'},{en:'food',es:'comida',label:'food · comida'}]},
    {base:'help',third:'helps',past:'helped',part:'helped',ing:'helping',esInf:'ayudar',
      esPres:['ayudo','ayudas','ayuda','ayuda','ayudamos','ayudan'],esPast:['ayudé','ayudaste','ayudó','ayudó','ayudamos','ayudaron'],esPart:'ayudado',esGer:'ayudando',
      complements:[{en:'my family',es:'a mi familia',label:'my family · a mi familia'},{en:'the customer',es:'al cliente',label:'the customer · al cliente'},{en:'my friend',es:'a mi amigo/a',label:'my friend · a mi amigo/a'}]},
    {base:'use',third:'uses',past:'used',part:'used',ing:'using',esInf:'usar',
      esPres:['uso','usas','usa','usa','usamos','usan'],esPast:['usé','usaste','usó','usó','usamos','usaron'],esPart:'usado',esGer:'usando',
      complements:[{en:'the computer',es:'el ordenador',label:'the computer · el ordenador'},{en:'English at work',es:'inglés en el trabajo',label:'English at work · inglés en el trabajo'},{en:'the phone',es:'el teléfono',label:'the phone · el teléfono'}]},
    {base:'understand',third:'understands',past:'understood',part:'understood',ing:'understanding',esInf:'entender',
      esPres:['entiendo','entiendes','entiende','entiende','entendemos','entienden'],esPast:['entendí','entendiste','entendió','entendió','entendimos','entendieron'],esPart:'entendido',esGer:'entendiendo',
      complements:[{en:'English',es:'inglés',label:'English · inglés'},{en:'the question',es:'la pregunta',label:'the question · la pregunta'},{en:'the teacher',es:'al profesor/a',label:'the teacher · al profesor/a'}]}
  ]
};