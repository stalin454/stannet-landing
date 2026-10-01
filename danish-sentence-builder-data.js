/* StanNet Danish Academy — interactive sentence builder data. */
window.stannetDanishSentenceBuilder = {
  subjects: [
    {da:'jeg',es:'yo',person:0},
    {da:'du',es:'tú',person:1},
    {da:'han',es:'él',person:2},
    {da:'hun',es:'ella',person:3},
    {da:'vi',es:'nosotros',person:4},
    {da:'I',es:'vosotros / ustedes',person:5},
    {da:'de',es:'ellos / ellas',person:6}
  ],
  modes: [
    {id:'statement',label:'Afirmativa · sujeto primero',hint:'SUJETO + VERBO FINITO + RESTO'},
    {id:'negative',label:'Negativa · sujeto primero',hint:'SUJETO + VERBO FINITO + IKKE + RESTO'},
    {id:'timeFirst',label:'Afirmativa · tiempo primero (V2)',hint:'TIEMPO + VERBO FINITO + SUJETO + RESTO'},
    {id:'timeFirstNegative',label:'Negativa · tiempo primero (V2)',hint:'TIEMPO + VERBO FINITO + SUJETO + IKKE + RESTO'},
    {id:'question',label:'Pregunta sí/no',hint:'VERBO FINITO + SUJETO + RESTO ?'},
    {id:'whQuestion',label:'Pregunta con palabra interrogativa',hint:'INTERROGATIVO + VERBO FINITO + SUJETO + RESTO ?'}
  ],
  tenses: [
    {id:'present',label:'Presente',esLabel:'presente'},
    {id:'past',label:'Pasado',esLabel:'pasado'},
    {id:'perfect',label:'Perfecto',esLabel:'pretérito perfecto'},
    {id:'pluperfect',label:'Pluscuamperfecto',esLabel:'pluscuamperfecto'},
    {id:'futureVil',label:'Futuro / intención · vil',esLabel:'futuro'},
    {id:'futureSkal',label:'Plan futuro · skal',esLabel:'ir a + infinitivo'},
    {id:'futurePrediction',label:'Predicción · kommer til at',esLabel:'ir a + infinitivo'},
    {id:'conditional',label:'Condicional · ville',esLabel:'condicional'},
    {id:'conditionalPerfect',label:'Condicional perfecto',esLabel:'condicional perfecto'}
  ],
  whWords: [
    {da:'hvorfor',es:'por qué'},
    {da:'hvornår',es:'cuándo'},
    {da:'hvor',es:'dónde'},
    {da:'hvordan',es:'cómo'}
  ],
  times: [
    {da:'',es:'',label:'— sin expresión de tiempo —'},
    {da:'i dag',es:'hoy',label:'i dag · hoy'},
    {da:'i morgen',es:'mañana',label:'i morgen · mañana'},
    {da:'i går',es:'ayer',label:'i går · ayer'},
    {da:'hver dag',es:'cada día',label:'hver dag · cada día'},
    {da:'om morgenen',es:'por la mañana',label:'om morgenen · por la mañana'},
    {da:'om aftenen',es:'por la tarde/noche',label:'om aftenen · por la tarde/noche'},
    {da:'på mandag',es:'el lunes',label:'på mandag · el lunes'},
    {da:'i weekenden',es:'el fin de semana',label:'i weekenden · el fin de semana'}
  ],
  places: [
    {da:'',es:'',label:'— sin lugar —'},
    {da:'hjemme',es:'en casa',label:'hjemme · en casa'},
    {da:'i Danmark',es:'en Dinamarca',label:'i Danmark · en Dinamarca'},
    {da:'i Spanien',es:'en España',label:'i Spanien · en España'},
    {da:'i København',es:'en Copenhague',label:'i København · en Copenhague'},
    {da:'i Aarhus',es:'en Aarhus',label:'i Aarhus · en Aarhus'},
    {da:'på arbejde',es:'en el trabajo',label:'på arbejde · en el trabajo'},
    {da:'på skolen',es:'en la escuela',label:'på skolen · en la escuela'},
    {da:'på universitetet',es:'en la universidad',label:'på universitetet · en la universidad'}
  ],
  adverbs: [
    {da:'',es:'',label:'— sin adverbio —'},
    {da:'ofte',es:'a menudo',label:'ofte · a menudo'},
    {da:'altid',es:'siempre',label:'altid · siempre'},
    {da:'nogle gange',es:'a veces',label:'nogle gange · a veces'},
    {da:'sjældent',es:'raramente',label:'sjældent · raramente'},
    {da:'gerne',es:'con gusto / gustosamente',label:'gerne · con gusto'}
  ],
  verbs: [
    {
      da:'arbejde',esInf:'trabajar',pres:'arbejder',past:'arbejdede',part:'arbejdet',aux:'har',
      esPresent:['trabajo','trabajas','trabaja','trabaja','trabajamos','trabajáis','trabajan'],
      esPast:['trabajé','trabajaste','trabajó','trabajó','trabajamos','trabajasteis','trabajaron'],
      esPart:'trabajado',
      complements:[
        {da:'',es:'',label:'— sin complemento —'},
        {da:'med IT',es:'con IT',label:'med IT · con IT'},
        {da:'med logistik',es:'con logística',label:'med logistik · con logística'},
        {da:'med kunder',es:'con clientes',label:'med kunder · con clientes'}
      ]
    },
    {
      da:'bo',esInf:'vivir',pres:'bor',past:'boede',part:'boet',aux:'har',
      esPresent:['vivo','vives','vive','vive','vivimos','vivís','viven'],
      esPast:['viví','viviste','vivió','vivió','vivimos','vivisteis','vivieron'],
      esPart:'vivido',
      complements:[
        {da:'',es:'',label:'— sin complemento —'},
        {da:'med min familie',es:'con mi familia',label:'med min familie · con mi familia'},
        {da:'alene',es:'solo/a',label:'alene · solo/a'},
        {da:'sammen med min partner',es:'con mi pareja',label:'sammen med min partner · con mi pareja'}
      ]
    },
    {
      da:'lære',esInf:'aprender',pres:'lærer',past:'lærte',part:'lært',aux:'har',
      esPresent:['aprendo','aprendes','aprende','aprende','aprendemos','aprendéis','aprenden'],
      esPast:['aprendí','aprendiste','aprendió','aprendió','aprendimos','aprendisteis','aprendieron'],
      esPart:'aprendido',
      complements:[
        {da:'dansk',es:'danés',label:'dansk · danés'},
        {da:'nye ord',es:'palabras nuevas',label:'nye ord · palabras nuevas'},
        {da:'grammatik',es:'gramática',label:'grammatik · gramática'},
        {da:'hurtigt',es:'rápidamente',label:'hurtigt · rápidamente'}
      ]
    },
    {
      da:'tale',esInf:'hablar',pres:'taler',past:'talte',part:'talt',aux:'har',
      esPresent:['hablo','hablas','habla','habla','hablamos','habláis','hablan'],
      esPast:['hablé','hablaste','habló','habló','hablamos','hablasteis','hablaron'],
      esPart:'hablado',
      complements:[
        {da:'dansk',es:'danés',label:'dansk · danés'},
        {da:'med min lærer',es:'con mi profesor/a',label:'med min lærer · con mi profesor/a'},
        {da:'med mine kolleger',es:'con mis compañeros',label:'med mine kolleger · con mis compañeros'},
        {da:'om arbejde',es:'sobre trabajo',label:'om arbejde · sobre trabajo'}
      ]
    },
    {
      da:'studere',esInf:'estudiar',pres:'studerer',past:'studerede',part:'studeret',aux:'har',
      esPresent:['estudio','estudias','estudia','estudia','estudiamos','estudiáis','estudian'],
      esPast:['estudié','estudiaste','estudió','estudió','estudiamos','estudiasteis','estudiaron'],
      esPart:'estudiado',
      complements:[
        {da:'dansk',es:'danés',label:'dansk · danés'},
        {da:'programmering',es:'programación',label:'programmering · programación'},
        {da:'cybersikkerhed',es:'ciberseguridad',label:'cybersikkerhed · ciberseguridad'}
      ]
    },
    {
      da:'spise',esInf:'comer',pres:'spiser',past:'spiste',part:'spist',aux:'har',
      esPresent:['como','comes','come','come','comemos','coméis','comen'],
      esPast:['comí','comiste','comió','comió','comimos','comisteis','comieron'],
      esPart:'comido',
      complements:[
        {da:'morgenmad',es:'desayuno',label:'morgenmad · desayuno'},
        {da:'frokost',es:'almuerzo',label:'frokost · almuerzo'},
        {da:'aftensmad',es:'cena',label:'aftensmad · cena'},
        {da:'en sandwich',es:'un sándwich',label:'en sandwich · un sándwich'}
      ]
    },
    {
      da:'drikke',esInf:'beber',pres:'drikker',past:'drak',part:'drukket',aux:'har',
      esPresent:['bebo','bebes','bebe','bebe','bebemos','bebéis','beben'],
      esPast:['bebí','bebiste','bebió','bebió','bebimos','bebisteis','bebieron'],
      esPart:'bebido',
      complements:[
        {da:'kaffe',es:'café',label:'kaffe · café'},
        {da:'vand',es:'agua',label:'vand · agua'},
        {da:'te',es:'té',label:'te · té'}
      ]
    },
    {
      da:'købe',esInf:'comprar',pres:'køber',past:'købte',part:'købt',aux:'har',
      esPresent:['compro','compras','compra','compra','compramos','compráis','compran'],
      esPast:['compré','compraste','compró','compró','compramos','comprasteis','compraron'],
      esPart:'comprado',
      complements:[
        {da:'en billet',es:'un billete',label:'en billet · un billete'},
        {da:'en bog',es:'un libro',label:'en bog · un libro'},
        {da:'mad',es:'comida',label:'mad · comida'},
        {da:'en ny computer',es:'un ordenador nuevo',label:'en ny computer · un ordenador nuevo'}
      ]
    },
    {
      da:'læse',esInf:'leer',pres:'læser',past:'læste',part:'læst',aux:'har',
      esPresent:['leo','lees','lee','lee','leemos','leéis','leen'],
      esPast:['leí','leíste','leyó','leyó','leímos','leísteis','leyeron'],
      esPart:'leído',
      complements:[
        {da:'en bog',es:'un libro',label:'en bog · un libro'},
        {da:'nyhederne',es:'las noticias',label:'nyhederne · las noticias'},
        {da:'en artikel',es:'un artículo',label:'en artikel · un artículo'}
      ]
    },
    {
      da:'skrive',esInf:'escribir',pres:'skriver',past:'skrev',part:'skrevet',aux:'har',
      esPresent:['escribo','escribes','escribe','escribe','escribimos','escribís','escriben'],
      esPast:['escribí','escribiste','escribió','escribió','escribimos','escribisteis','escribieron'],
      esPart:'escrito',
      complements:[
        {da:'en mail',es:'un correo',label:'en mail · un correo'},
        {da:'en besked',es:'un mensaje',label:'en besked · un mensaje'},
        {da:'en rapport',es:'un informe',label:'en rapport · un informe'}
      ]
    },
    {
      da:'forstå',esInf:'entender',pres:'forstår',past:'forstod',part:'forstået',aux:'har',
      esPresent:['entiendo','entiendes','entiende','entiende','entendemos','entendéis','entienden'],
      esPast:['entendí','entendiste','entendió','entendió','entendimos','entendisteis','entendieron'],
      esPart:'entendido',
      complements:[
        {da:'dansk',es:'danés',label:'dansk · danés'},
        {da:'spørgsmålet',es:'la pregunta',label:'spørgsmålet · la pregunta'},
        {da:'læreren',es:'al profesor/a',label:'læreren · al profesor/a'}
      ]
    },
    {
      da:'hjælpe',esInf:'ayudar',pres:'hjælper',past:'hjalp',part:'hjulpet',aux:'har',
      esPresent:['ayudo','ayudas','ayuda','ayuda','ayudamos','ayudáis','ayudan'],
      esPast:['ayudé','ayudaste','ayudó','ayudó','ayudamos','ayudasteis','ayudaron'],
      esPart:'ayudado',
      complements:[
        {da:'min familie',es:'a mi familia',label:'min familie · a mi familia'},
        {da:'kunden',es:'al cliente',label:'kunden · al cliente'},
        {da:'min ven',es:'a mi amigo/a',label:'min ven · a mi amigo/a'}
      ]
    },
    {
      da:'bruge',esInf:'usar',pres:'bruger',past:'brugte',part:'brugt',aux:'har',
      esPresent:['uso','usas','usa','usa','usamos','usáis','usan'],
      esPast:['usé','usaste','usó','usó','usamos','usasteis','usaron'],
      esPart:'usado',
      complements:[
        {da:'computeren',es:'el ordenador',label:'computeren · el ordenador'},
        {da:'dansk på arbejde',es:'danés en el trabajo',label:'dansk på arbejde · danés en el trabajo'},
        {da:'telefonen',es:'el teléfono',label:'telefonen · el teléfono'}
      ]
    }
  ]
};