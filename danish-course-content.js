/* StanNet Danish Academy — deep A1+A2 course content.
   The sequence mirrors the pedagogical progression of the user's Nordic study materials,
   while all Danish explanations, examples and exercises are original/adapted for Danish. */
window.stannetDanishDeepCourse = (function(){
  const chapter = (id, level, title, overview, objectives, vocab, theory, patterns, dialogue, pronunciation, exercises, exam, production) => ({
    id, level, title, overview, objectives, vocab, theory, patterns, dialogue, pronunciation, exercises, exam, production
  });

  const chapters = [
    chapter('01','A1','Presentarse, país e idioma',
      'Primer contacto real: decir quién eres, de dónde vienes, qué idiomas hablas y a qué te dedicas. Desde el primer capítulo se trabaja el verbo en segunda posición y la negación con ikke.',
      ['saludar y presentarte','preguntar nombre y procedencia','decir qué idiomas hablas','decir profesión o estudios','formar preguntas básicas con hvad/hvor'],
      [['hej','hola'],['at hedde','llamarse'],['at komme fra','venir de / ser de'],['et land','país'],['et sprog','idioma'],['at tale','hablar'],['lidt','un poco'],['at arbejde','trabajar'],['at studere','estudiar'],['hvad','qué'],['hvor','dónde'],['ikke','no']],
      [
        'En una oración principal danesa el verbo finito ocupa normalmente la segunda posición: Jeg taler dansk. Si colocas otra información primero, el sujeto pasa detrás del verbo: I Spanien taler jeg spansk.',
        'Los verbos daneses no cambian por persona. hedder sirve con jeg, du, han, hun, vi, I y de. Esto reduce la conjugación, pero hace más importante el orden de palabras.',
        'La negación ikke se coloca normalmente después del verbo finito en una oración principal: Jeg taler ikke svensk.'
      ],
      [['Sujeto + verbo + resto','Jeg hedder Luis.'],['Elemento inicial + verbo + sujeto','I dag arbejder jeg hjemme.'],['Verbo + sujeto en pregunta sí/no','Taler du dansk?']],
      [['A','Hej! Jeg hedder Sara. Hvad hedder du?','¡Hola! Me llamo Sara. ¿Cómo te llamas?'],['B','Jeg hedder Luis.','Me llamo Luis.'],['A','Hvor kommer du fra?','¿De dónde eres?'],['B','Jeg kommer fra Spanien.','Soy de España.'],['A','Hvilke sprog taler du?','¿Qué idiomas hablas?'],['B','Jeg taler spansk, engelsk og lidt dansk.','Hablo español, inglés y un poco de danés.'],['A','Hvad arbejder du med?','¿En qué trabajas?'],['B','Jeg arbejder med logistik, men jeg studerer webudvikling.','Trabajo en logística, pero estudio desarrollo web.']],
      ['Escucha la reducción natural de jeg delante de consonante.','No intentes pronunciar cada letra de hedder de forma española; escucha el modelo completo.','Repite las preguntas como unidades rítmicas, no palabra por palabra.'],
      [
        {type:'fill',prompt:'Jeg ___ Luis.',answer:'hedder',hint:'verbo “llamarse”'},
        {type:'fill',prompt:'Jeg kommer ___ Spanien.',answer:'fra',hint:'preposición de origen'},
        {type:'order',prompt:'Ordena: dansk / taler / jeg / lidt',answer:'Jeg taler lidt dansk.'},
        {type:'translate',prompt:'Traduce: No hablo sueco.',answer:'Jeg taler ikke svensk.'},
        {type:'translate',prompt:'Traduce: ¿De dónde eres?',answer:'Hvor kommer du fra?'},
        {type:'produce',prompt:'Escribe cuatro frases sobre ti: nombre, país, idiomas y ocupación.',answer:''}
      ],
      [
        {q:'¿Dónde va normalmente el verbo finito en una oración principal?',options:['Primero','Segundo','Al final'],answer:1},
        {q:'¿Cuál es la negación danesa?',options:['nej','ikke','ingen'],answer:1},
        {q:'“Jeg kommer fra Spanien” significa…',options:['Voy a España','Soy de España','Hablo español'],answer:1},
        {q:'Forma correcta:',options:['Jeg dansk taler','Jeg taler dansk','Jeg dansk tale'],answer:1}
      ],
      {speaking:'Preséntate durante 30 segundos sin leer.',writing:'Escribe un perfil de 6–8 frases y añade dos preguntas para conocer a otra persona.'}
    ),

    chapter('02','A1','Saludos, pronombres y objetos',
      'Amplía el primer contacto con saludos cotidianos, pronombres personales y objetos frecuentes. Se introduce de forma práctica la distinción en/et.',
      ['usar saludos informales y neutros','reconocer pronombres personales','nombrar objetos','usar en y et','preguntar posesión y propiedad'],
      [['godmorgen','buenos días'],['farvel','adiós'],['tak','gracias'],['en nøgle','una llave'],['en telefon','un teléfono'],['en bog','un libro'],['et kort','una tarjeta'],['et bord','una mesa'],['en taske','un bolso'],['min/mit','mi'],['din/dit','tu'],['hvem','quién']],
      [
        'Los sustantivos daneses pertenecen en general a dos géneros gramaticales: común (en) y neutro (et). Conviene aprender cada palabra con su artículo: en bog, et hus.',
        'Los pronombres sujeto básicos son jeg, du, han, hun, den/det, vi, I, de. El pronombre I (“vosotros/ustedes”) se escribe con mayúscula.',
        'Los posesivos min/mit y din/dit cambian según el género del sustantivo: min telefon, mit kort. En plural se usa mine/dine.'
      ],
      [['en + sustantivo común','en telefon'],['et + sustantivo neutro','et kort'],['posesivo + sustantivo','min bog / mit kort']],
      [['A','Godmorgen. Hvordan har du det?','Buenos días. ¿Cómo estás?'],['B','Jeg har det fint, tak.','Estoy bien, gracias.'],['A','Er det din telefon?','¿Es tu teléfono?'],['B','Nej, det er ikke min.','No, no es mío.'],['A','Hvem har nøglen?','¿Quién tiene la llave?'],['B','Jeg har den.','Yo la tengo.']],
      ['Presta atención a hvordan como una sola unidad sonora.','I se escribe con mayúscula aunque aparezca en medio de la oración.','Entrena den y det escuchando primero y leyendo después.'],
      [
        {type:'fill',prompt:'Det er ___ bog. (mi)',answer:'min'},
        {type:'fill',prompt:'Det er ___ kort. (mi)',answer:'mit'},
        {type:'order',prompt:'Ordena: det / din / er / telefon / ?',answer:'Er det din telefon?'},
        {type:'translate',prompt:'Traduce: Tengo una llave.',answer:'Jeg har en nøgle.'},
        {type:'translate',prompt:'Traduce: No es mi bolso.',answer:'Det er ikke min taske.'},
        {type:'produce',prompt:'Nombra seis objetos a tu alrededor con en/et.',answer:''}
      ],
      [
        {q:'¿Qué artículo usa “bog”?',options:['en','et'],answer:0},
        {q:'¿Qué forma corresponde a “mi tarjeta”?',options:['min kort','mit kort'],answer:1},
        {q:'¿Cuál significa “ellos/ellas”?',options:['I','vi','de'],answer:2},
        {q:'“Er det din telefon?” es…',options:['afirmación','pregunta','orden'],answer:1}
      ],
      {speaking:'Señala objetos reales y nómbralos con su artículo.',writing:'Haz una lista de 10 objetos con en/et y añade cinco frases posesivas.'}
    ),

    chapter('03','A1','Números, hora y rutina',
      'Los números y la hora se conectan con una rutina diaria completa. También se presenta la forma definida del sustantivo y el orden temporal.',
      ['decir edad y números','decir la hora','describir una rutina','usar marcadores temporales','reconocer forma definida'],
      [['klokken','el reloj / la hora'],['halv','media'],['kvart over','y cuarto'],['kvart i','menos cuarto'],['at stå op','levantarse'],['at spise morgenmad','desayunar'],['at tage på arbejde','ir al trabajo'],['om morgenen','por la mañana'],['om aftenen','por la tarde/noche'],['bussen','el autobús'],['huset','la casa'],['hver dag','cada día']],
      [
        'En danés “halv otte” significa literalmente “media hacia ocho”: 7:30. Es una diferencia importante respecto al español.',
        'La forma definida suele añadirse al final del sustantivo: en bus → bussen; et hus → huset. No se coloca un artículo separado como “el/la” en español.',
        'Los complementos de tiempo pueden ocupar la primera posición y activar V2: Om morgenen drikker jeg kaffe.'
      ],
      [['Klokken er + hora','Klokken er otte.'],['halv + hora siguiente','halv otte = 7:30'],['Tiempo + V + S','Om morgenen spiser jeg morgenmad.']],
      [['A','Hvad er klokken?','¿Qué hora es?'],['B','Den er halv otte.','Son las siete y media.'],['A','Hvornår står du op?','¿Cuándo te levantas?'],['B','Jeg står op klokken syv.','Me levanto a las siete.'],['A','Hvad gør du bagefter?','¿Qué haces después?'],['B','Så spiser jeg morgenmad og tager bussen.','Después desayuno y tomo el autobús.']],
      ['Repite halv otte, halv ni, halv ti como bloques.','Distingue hvornår (cuándo) de hvor (dónde).','Practica el ritmo de Om morgenen arbejder jeg…'],
      [
        {type:'fill',prompt:'Klokken er ___ otte. = 7:30',answer:'halv'},
        {type:'fill',prompt:'en bus → ___',answer:'bussen'},
        {type:'order',prompt:'Ordena: morgenen / jeg / om / kaffe / drikker',answer:'Om morgenen drikker jeg kaffe.'},
        {type:'translate',prompt:'Traduce: Me levanto a las siete.',answer:'Jeg står op klokken syv.'},
        {type:'translate',prompt:'Traduce: Son las ocho y cuarto.',answer:'Klokken er kvart over otte.'},
        {type:'produce',prompt:'Escribe tu rutina de mañana en 6 frases.',answer:''}
      ],
      [
        {q:'“halv otte” es…',options:['8:30','7:30','7:00'],answer:1},
        {q:'Forma definida de “en bus”',options:['den bus','bussen','buset'],answer:1},
        {q:'Si empiezas por “Om morgenen”…',options:['mantienes V2','verbo al final','sin sujeto'],answer:0},
        {q:'“Hvornår” pregunta por…',options:['lugar','tiempo','persona'],answer:1}
      ],
      {speaking:'Cuenta tu mañana mirando solo horas clave.',writing:'Crea un horario desde las 06:00 hasta las 22:00 con 8 acciones.'}
    ),

    chapter('04','A1','Billetes, precios y café',
      'Situaciones de compra: transporte, cafetería y precios. Se practica la fórmula cortés vil gerne y los demostrativos.',
      ['pedir un billete','preguntar precio','pedir comida/bebida','señalar objetos','pagar'],
      [['en billet','un billete'],['en kaffe','un café'],['en bolle','un bollo'],['den her','este/a'],['den der','ese/a'],['hvad koster…?','¿cuánto cuesta…?'],['det bliver…','son… / queda en…'],['kontant','en efectivo'],['med kort','con tarjeta'],['at betale','pagar'],['at købe','comprar'],['gerne','con gusto / gustosamente']],
      [
        'Jeg vil gerne… es una de las fórmulas más útiles para pedir algo de manera natural y cortés.',
        'Los demostrativos se combinan con el género: den her con sustantivos en; det her con et; de her para plural.',
        'Para precios se usa Hvad koster…? y en caja es frecuente Det bliver… seguido de la cantidad.'
      ],
      [['Jeg vil gerne have…','Jeg vil gerne have en kaffe.'],['den/det her','den her billet / det her kort'],['Hvad koster X?','Hvad koster billetten?']],
      [['Kunde','En billet til centrum, tak.','Un billete al centro, por favor.'],['Sælger','Det bliver 24 kroner.','Son 24 coronas.'],['Kunde','Kan jeg betale med kort?','¿Puedo pagar con tarjeta?'],['Sælger','Ja, selvfølgelig.','Sí, por supuesto.'],['Kunde','Og en kaffe, tak.','Y un café, por favor.'],['Sælger','Vil du have den her eller den der?','¿Quieres este o ese?']],
      ['Practica gerne sin pronunciar una “g” española fuerte.','Escucha la diferencia entre den her y det her.','Repite cantidades completas con kroner.'],
      [
        {type:'fill',prompt:'Jeg vil ___ have en kaffe.',answer:'gerne'},
        {type:'fill',prompt:'Hvad ___ billetten?',answer:'koster'},
        {type:'order',prompt:'Ordena: med / jeg / betale / kan / kort / ?',answer:'Kan jeg betale med kort?'},
        {type:'translate',prompt:'Traduce: Quisiera un billete al centro.',answer:'Jeg vil gerne have en billet til centrum.'},
        {type:'translate',prompt:'Traduce: ¿Cuánto cuesta?',answer:'Hvad koster det?'},
        {type:'produce',prompt:'Crea un diálogo de compra con precio y pago.',answer:''}
      ],
      [
        {q:'La fórmula cortés más útil es…',options:['Jeg vil gerne…','Jeg skal ikke…','Jeg hedder…'],answer:0},
        {q:'“este mapa” (et kort)',options:['den her kort','det her kort','de her kort'],answer:1},
        {q:'“Hvad koster det?” pregunta…',options:['hora','precio','dirección'],answer:1},
        {q:'“med kort” significa…',options:['con tarjeta','con mapa','con billete'],answer:0}
      ],
      {speaking:'Simula una compra de 45 segundos.',writing:'Escribe dos diálogos: uno en una estación y otro en una cafetería.'}
    ),

    chapter('05','A1','Ocio, frecuencia y adjetivos',
      'Hablar de lo que haces en tu tiempo libre y con qué frecuencia. Introducción a la concordancia del adjetivo.',
      ['hablar de ocio','usar frecuencia','describir cosas','concordar adjetivos','expresar gustos'],
      [['fritid','tiempo libre'],['at gå i biografen','ir al cine'],['at spille guitar','tocar guitarra'],['at træne','entrenar'],['altid','siempre'],['ofte','a menudo'],['nogle gange','a veces'],['sjældent','raramente'],['aldrig','nunca'],['god/godt/gode','bueno'],['interessant','interesante'],['kedelig','aburrido']],
      [
        'Los adverbios de frecuencia suelen colocarse después del verbo finito en una principal: Jeg går ofte i biografen.',
        'El adjetivo presenta forma básica con en, normalmente -t con et y -e en plural/definido: en god film, et godt program, gode film.',
        'kan godt lide significa “gustar” en el uso cotidiano: Jeg kan godt lide dansk musik.'
      ],
      [['V + frecuencia','Jeg træner ofte.'],['en + adjetivo base','en god film'],['et + adjetivo -t','et godt program']],
      [['A','Hvad laver du i din fritid?','¿Qué haces en tu tiempo libre?'],['B','Jeg spiller ofte guitar.','Toco guitarra a menudo.'],['A','Går du tit i biografen?','¿Vas mucho al cine?'],['B','Nogle gange. Jeg kan godt lide danske film.','A veces. Me gustan las películas danesas.'],['A','Er den nye film god?','¿Es buena la película nueva?'],['B','Ja, den er rigtig god.','Sí, es realmente buena.']],
      ['Escucha godt: la d no suena como una d española fuerte.','Practica nogle gange como bloque rítmico.','Diferencia en god film / et godt program.'],
      [
        {type:'fill',prompt:'Jeg går ___ i biografen. (a menudo)',answer:'ofte'},
        {type:'fill',prompt:'et ___ program (bueno)',answer:'godt'},
        {type:'order',prompt:'Ordena: jeg / musik / godt / kan / lide / dansk',answer:'Jeg kan godt lide dansk musik.'},
        {type:'translate',prompt:'Traduce: Nunca juego al tenis.',answer:'Jeg spiller aldrig tennis.'},
        {type:'translate',prompt:'Traduce: Es una buena película.',answer:'Det er en god film.'},
        {type:'produce',prompt:'Describe tu tiempo libre usando 4 adverbios de frecuencia.',answer:''}
      ],
      [
        {q:'Con “et program” usamos…',options:['god','godt','gode'],answer:1},
        {q:'“aldrig” significa…',options:['siempre','a veces','nunca'],answer:2},
        {q:'“kan godt lide” significa…',options:['puede hablar','gustar','tener que'],answer:1},
        {q:'En plural suele aparecer…',options:['-e','-t','sin adjetivo'],answer:0}
      ],
      {speaking:'Habla un minuto sobre tu ocio.',writing:'Escribe 8 frases sobre hábitos, gustos y frecuencia.'}
    ),

    chapter('06','A1','Familia y pasado',
      'Familia, relaciones y primeras narraciones en pasado. Se conectan posesivos con verbos en pretérito.',
      ['describir familia','usar posesivos','decir edades','hablar del pasado','describir dónde vivías'],
      [['familie','familia'],['forældre','padres'],['søskende','hermanos'],['bror','hermano'],['søster','hermana'],['datter','hija'],['søn','hijo'],['gift','casado/a'],['single','soltero/a'],['at bo','vivir'],['at arbejde','trabajar'],['da jeg var barn','cuando era niño/a']],
      [
        'Los posesivos min/mit/mine y din/dit/dine concuerdan con el sustantivo poseído, no con la persona que posee.',
        'El pasado danés no cambia por persona. Muchos verbos regulares forman pasado con -ede o -te: arbejde → arbejdede, bo → boede.',
        'Da se usa con frecuencia para situar hechos en un momento pasado: Da jeg var barn…'
      ],
      [['min/mit/mine','min bror / mit barn / mine forældre'],['verbo pasado','jeg arbejdede / hun arbejdede'],['Da + pasado','Da jeg var barn, boede jeg…']],
      [['A','Har du søskende?','¿Tienes hermanos?'],['B','Ja, jeg har en bror og en søster.','Sí, tengo un hermano y una hermana.'],['A','Hvor bor de?','¿Dónde viven?'],['B','Min bror bor i Madrid, og min søster bor i Barcelona.','Mi hermano vive en Madrid y mi hermana en Barcelona.'],['A','Hvor boede I, da du var barn?','¿Dónde vivíais cuando eras niño?'],['B','Vi boede i en lille by.','Vivíamos en una ciudad pequeña.']],
      ['El grupo æ en forældre necesita escucha repetida.','Practica bo/boede y arbejde/arbejdede como pares.','No pronuncies todas las consonantes de manera española.'],
      [
        {type:'fill',prompt:'___ forældre bor i Spanien. (mis)',answer:'Mine'},
        {type:'fill',prompt:'Da jeg var barn, ___ jeg i Loja.',answer:'boede'},
        {type:'order',prompt:'Ordena: en / jeg / søster / har / og / bror / en',answer:'Jeg har en bror og en søster.'},
        {type:'translate',prompt:'Traduce: Mi hermana trabaja en un hospital.',answer:'Min søster arbejder på et hospital.'},
        {type:'translate',prompt:'Traduce: Cuando era niño vivía en Ecuador.',answer:'Da jeg var barn, boede jeg i Ecuador.'},
        {type:'produce',prompt:'Escribe un retrato familiar de 8 frases.',answer:''}
      ],
      [
        {q:'“mine forældre” significa…',options:['mi padre','mis padres','sus padres'],answer:1},
        {q:'Pasado de arbejde',options:['arbejder','arbejdede','arbejdet'],answer:1},
        {q:'“Da jeg var barn” introduce…',options:['futuro','pasado','imperativo'],answer:1},
        {q:'Los verbos cambian por persona?',options:['sí','no'],answer:1}
      ],
      {speaking:'Describe tu familia durante un minuto.',writing:'Escribe 10 frases: 5 actuales y 5 sobre tu infancia.'}
    ),

    chapter('07','A1','Comida, cantidades y compras',
      'Supermercado, alimentos, envases y cantidades. El objetivo es resolver una compra completa sin cambiar al español.',
      ['nombrar alimentos','pedir cantidades','preguntar ubicación','entender total','usar plural básico'],
      [['mælk','leche'],['brød','pan'],['vand','agua'],['kaffe','café'],['en flaske','una botella'],['en pose','una bolsa'],['en pakke','un paquete'],['et kilo','un kilo'],['hylden','el estante'],['kassen','la caja'],['at koste','costar'],['tilbage','de vuelta / cambio']],
      [
        'Las expresiones de cantidad suelen combinar un contenedor o medida con el producto: en flaske vand, en pose ris, et kilo kartofler.',
        'Los plurales daneses tienen varios patrones. No intentes adivinar siempre: aprende singular y plural juntos en vocabulario frecuente.',
        'Hvor står…? pregunta dónde se encuentra algo colocado; Hvor er…? es más general.'
      ],
      [['cantidad + producto','en flaske vand'],['Hvor står X?','Hvor står brødet?'],['total','Det bliver 84 kroner.']],
      [['Kunde','Undskyld, hvor står brødet?','Perdone, ¿dónde está el pan?'],['Medarbejder','Det står ved siden af mælken.','Está al lado de la leche.'],['Kunde','Tak. Jeg skal også have en flaske vand.','Gracias. También necesito una botella de agua.'],['Kasse','Var det det hele?','¿Eso es todo?'],['Kunde','Ja, tak.','Sí, gracias.'],['Kasse','Det bliver 84 kroner.','Son 84 coronas.']],
      ['Practica brød, rød yød con audio: la ortografía engaña al hispanohablante.','Escucha el final de mælken y kassen sin sobreactuar consonantes.','Entrena cifras con kroner.'],
      [
        {type:'fill',prompt:'en ___ vand',answer:'flaske'},
        {type:'fill',prompt:'Hvor ___ brødet?',answer:'står'},
        {type:'order',prompt:'Ordena: have / jeg / mælk / også / skal',answer:'Jeg skal også have mælk.'},
        {type:'translate',prompt:'Traduce: Necesito un kilo de patatas.',answer:'Jeg skal have et kilo kartofler.'},
        {type:'translate',prompt:'Traduce: ¿Eso es todo?',answer:'Var det det hele?'},
        {type:'produce',prompt:'Escribe una lista de 10 productos y un diálogo de caja.',answer:''}
      ],
      [
        {q:'“en flaske vand” es…',options:['un vaso de agua','una botella de agua','una bolsa de agua'],answer:1},
        {q:'Para preguntar dónde está colocado algo…',options:['Hvor står…?','Hvornår…?','Hvem…?'],answer:0},
        {q:'“Det bliver 84 kroner” significa…',options:['Cuesta demasiado','Son 84 coronas','Tengo 84 coronas'],answer:1},
        {q:'Plural danés…',options:['siempre -s','tiene varios patrones','no existe'],answer:1}
      ],
      {speaking:'Haz una compra imaginaria de un minuto.',writing:'Crea una lista de compra por categorías y un diálogo de 10 líneas.'}
    ),

    chapter('08','A1','Experiencias, reservas y clima',
      'Se introduce el perfecto con har + participio en situaciones de viaje, reservas y conversación sobre experiencias.',
      ['hablar de experiencias','reservar mesa/habitación','usar perfecto','hablar de clima','usar aldrig'],
      [['at bestille','reservar/pedir'],['et bord','una mesa'],['et værelse','una habitación'],['at være','estar/ser'],['har været','ha estado'],['har boet','ha vivido'],['aldrig','nunca'],['regn','lluvia'],['vind','viento'],['at sne','nevar'],['en nat','una noche'],['ledig','libre/disponible']],
      [
        'El perfecto se construye muy frecuentemente con har + participio: Jeg har arbejdet, jeg har boet, jeg har været.',
        'aldrig suele colocarse después del auxiliar en una principal: Jeg har aldrig været i Danmark.',
        'Para reservar son muy útiles jeg vil gerne bestille… y har I et ledigt…?'
      ],
      [['har + participio','Jeg har boet her i to år.'],['har aldrig + participio','Jeg har aldrig været i Aalborg.'],['reserva','Jeg vil gerne bestille et værelse.']],
      [['Gæst','Jeg vil gerne bestille et værelse til fredag.','Quisiera reservar una habitación para el viernes.'],['Reception','Hvor mange nætter?','¿Cuántas noches?'],['Gæst','To nætter.','Dos noches.'],['Reception','Har du været hos os før?','¿Ha estado antes con nosotros?'],['Gæst','Nej, jeg har aldrig været her før.','No, nunca he estado aquí antes.'],['Reception','Fint. Vi har et ledigt værelse.','Perfecto. Tenemos una habitación libre.']],
      ['Escucha været varias veces: la forma escrita no predice bien el sonido.','Practica har været como unidad.','Repite nætter/ledigt sin separar sílabas artificialmente.'],
      [
        {type:'fill',prompt:'Jeg har ___ i Danmark. (vivido)',answer:'boet'},
        {type:'fill',prompt:'Jeg har aldrig ___ i Aarhus. (estado)',answer:'været'},
        {type:'order',prompt:'Ordena: et / gerne / jeg / værelse / bestille / vil',answer:'Jeg vil gerne bestille et værelse.'},
        {type:'translate',prompt:'Traduce: He vivido aquí durante dos años.',answer:'Jeg har boet her i to år.'},
        {type:'translate',prompt:'Traduce: Nunca he estado allí.',answer:'Jeg har aldrig været der.'},
        {type:'produce',prompt:'Escribe una reserva de hotel de 8 líneas.',answer:''}
      ],
      [
        {q:'El perfecto usa normalmente…',options:['har + participio','er + infinitivo','skal + pasado'],answer:0},
        {q:'“aldrig” significa…',options:['ya','nunca','todavía'],answer:1},
        {q:'“ledig” en hotel significa…',options:['ocupado','caro','disponible'],answer:2},
        {q:'“Har du været…?” pregunta…',options:['experiencia','precio','hora'],answer:0}
      ],
      {speaking:'Cuenta tres experiencias y una cosa que nunca has hecho.',writing:'Escribe una reserva y una respuesta de recepción.'}
    ),

    chapter('09','A1','Transporte, movimiento y citas',
      'Moverse por Dinamarca combinando tren, autobús, bicicleta y trayectos a pie. Se trabajan destino, origen y obligación con skal.',
      ['pedir direcciones','usar transportes','explicar transbordos','decir dónde bajar','quedar con alguien'],
      [['tog','tren'],['bus','autobús'],['cykel','bicicleta'],['station','estación'],['at skifte','hacer transbordo'],['at stå af','bajarse'],['at stå på','subirse'],['til','a/hacia'],['fra','desde/de'],['mod','dirección hacia'],['foran','delante de'],['bagved','detrás de']],
      [
        'til marca destino y fra origen: Jeg tager toget til Odense. Jeg kommer fra Aarhus.',
        'skal expresa obligación, plan o instrucción según contexto: Du skal skifte i Fredericia.',
        'Los verbos stå på / stå af se aprenden como unidades porque la partícula cambia el significado.'
      ],
      [['tage + transporte','Jeg tager toget.'],['skal + infinitivo','Du skal skifte.'],['mødes + lugar','Vi mødes foran stationen.']],
      [['A','Undskyld, hvordan kommer jeg til Vejle?','Perdone, ¿cómo llego a Vejle?'],['B','Tag toget mod Aarhus.','Tome el tren dirección Aarhus.'],['A','Skal jeg skifte?','¿Tengo que hacer transbordo?'],['B','Ja, du skal skifte i Fredericia.','Sí, tiene que cambiar en Fredericia.'],['A','Hvor skal jeg stå af?','¿Dónde tengo que bajarme?'],['B','På Vejle Station.','En la estación de Vejle.']],
      ['Practica tog y tager sin añadir vocales.','Escucha skifte y station en contexto, no aisladas.','Repite stå af / stå på con gesto físico.'],
      [
        {type:'fill',prompt:'Jeg tager toget ___ Aarhus.',answer:'til'},
        {type:'fill',prompt:'Du ___ skifte i Fredericia.',answer:'skal'},
        {type:'order',prompt:'Ordena: stå / hvor / jeg / af / skal / ?',answer:'Hvor skal jeg stå af?'},
        {type:'translate',prompt:'Traduce: Nos vemos delante de la estación.',answer:'Vi mødes foran stationen.'},
        {type:'translate',prompt:'Traduce: Vengo de Odense.',answer:'Jeg kommer fra Odense.'},
        {type:'produce',prompt:'Explica una ruta con un transbordo.',answer:''}
      ],
      [
        {q:'“til” marca…',options:['destino','origen','tiempo'],answer:0},
        {q:'“stå af” significa…',options:['subirse','bajarse','esperar'],answer:1},
        {q:'“skal” puede expresar…',options:['obligación/plan','plural','género'],answer:0},
        {q:'“foran stationen” significa…',options:['dentro','delante de','detrás de'],answer:1}
      ],
      {speaking:'Explica cómo ir de tu casa a una estación.',writing:'Escribe instrucciones de viaje en 8 pasos.'}
    ),

    chapter('10','A1','Dinamarca: país y vida cotidiana',
      'Cierre de A1: hablar del país, ciudades, moneda, geografía y preferencias personales. Se consolida el vocabulario de Ruta Dinamarca.',
      ['presentar Dinamarca','nombrar ciudades','hablar de moneda','describir geografía','decir preferencias'],
      [['Danmark','Dinamarca'],['København','Copenhague'],['Aarhus','Aarhus'],['Odense','Odense'],['Jylland','Jutlandia'],['Sjælland','Zelanda'],['danske kroner','coronas danesas'],['hovedstad','capital'],['en ø','una isla'],['en by','una ciudad'],['at bo','vivir'],['helst','preferiblemente']],
      [
        'Los nombres de países y ciudades normalmente no llevan artículo en danés.',
        'Se usa i con países y la mayoría de ciudades: i Danmark, i København. Algunas islas y contextos usan på.',
        'helst sirve para expresar preferencia: Jeg vil helst bo i Aarhus.'
      ],
      [['X ligger i Y','Aarhus ligger i Jylland.'],['Jeg vil helst…','Jeg vil helst bo i Vejle.'],['valuta','Valutaen er danske kroner.']],
      [['A','Hvad er Danmarks hovedstad?','¿Cuál es la capital de Dinamarca?'],['B','Det er København.','Es Copenhague.'],['A','Hvor ligger Aarhus?','¿Dónde está Aarhus?'],['B','Aarhus ligger i Jylland.','Aarhus está en Jutlandia.'],['A','Hvor vil du helst bo?','¿Dónde preferirías vivir?'],['B','Jeg vil helst bo i Vejle.','Preferiría vivir en Vejle.']],
      ['København necesita escucha repetida: no la leas con valores españoles.','Entrena Jylland y Sjælland con audio.','Practica kroner en cifras reales.'],
      [
        {type:'fill',prompt:'Aarhus ligger ___ Jylland.',answer:'i'},
        {type:'fill',prompt:'Jeg vil ___ bo i Vejle.',answer:'helst'},
        {type:'order',prompt:'Ordena: hovedstad / København / er / Danmarks',answer:'København er Danmarks hovedstad.'},
        {type:'translate',prompt:'Traduce: La moneda son coronas danesas.',answer:'Valutaen er danske kroner.'},
        {type:'translate',prompt:'Traduce: Quiero aprender más sobre Dinamarca.',answer:'Jeg vil gerne lære mere om Danmark.'},
        {type:'produce',prompt:'Presenta Dinamarca en 8 frases.',answer:''}
      ],
      [
        {q:'Capital de Dinamarca en danés',options:['København','Odense','Vejle'],answer:0},
        {q:'Aarhus está en…',options:['Jylland','Sjælland'],answer:0},
        {q:'“helst” ayuda a expresar…',options:['negación','preferencia','pasado'],answer:1},
        {q:'“danske kroner” son…',options:['coronas danesas','euros','billetes de tren'],answer:0}
      ],
      {speaking:'Haz una presentación de Dinamarca de 90 segundos.',writing:'Escribe un texto: “La ciudad danesa en la que quiero vivir”.'}
    ),

    chapter('11','A2','Relaciones, personas y vida digital',
      'Inicio de A2: describir relaciones, personas y acciones digitales. Se profundiza en formas del sustantivo y demostrativos.',
      ['hablar de relaciones','describir personas','usar plural definido','dar instrucciones digitales','usar demostrativos'],
      [['en ven','un amigo'],['en kæreste','pareja'],['en kollega','compañero'],['en computer','ordenador'],['en skærm','pantalla'],['et tastatur','teclado'],['at gemme','guardar'],['at vedhæfte','adjuntar'],['en fil','archivo'],['denne/dette/disse','este/esta/estos'],['nogen','alguien/algunos'],['ingen','nadie/ningún']],
      [
        'En A2 conviene aprender el paradigma del sustantivo completo: en ven – vennen – venner – vennerne.',
        'denne/dette/disse se usan como demostrativos más formales o enfáticos; en conversación también son frecuentes den her/det her/de her.',
        'nogen/noget/nogle e ingen/intet/ingen dependen de género, número y polaridad.'
      ],
      [['singular/plural','en ven / venner / vennerne'],['demostrativo','denne fil / dette dokument / disse filer'],['instrucción','Klik, gem og send.']],
      [['A','Kan du sende mig filen?','¿Puedes enviarme el archivo?'],['B','Ja. Skal jeg vedhæfte den i en mail?','Sí. ¿La adjunto en un correo?'],['A','Ja, og gem også dokumentet.','Sí, y guarda también el documento.'],['B','Hvilken mappe?','¿Qué carpeta?'],['A','Denne mappe her.','Esta carpeta de aquí.'],['B','Fint, så er det gjort.','Perfecto, ya está hecho.']],
      ['Escucha denne/dette/disse en frase completa.','Repite vedhæfte lentamente y luego a velocidad normal.','Practica venner/vennerne sin enfatizar la r final.'],
      [
        {type:'fill',prompt:'en ven → plural: ___',answer:'venner'},
        {type:'fill',prompt:'___ dokument (este documento)',answer:'dette'},
        {type:'order',prompt:'Ordena: dokumentet / gem / først',answer:'Gem dokumentet først.'},
        {type:'translate',prompt:'Traduce: Adjunta el archivo.',answer:'Vedhæft filen.'},
        {type:'translate',prompt:'Traduce: No conozco a nadie aquí.',answer:'Jeg kender ingen her.'},
        {type:'produce',prompt:'Da 5 instrucciones para guardar y enviar un documento.',answer:''}
      ],
      [
        {q:'Plural de “ven”',options:['venner','vene','vens'],answer:0},
        {q:'“dette dokument” significa…',options:['ese documento','este documento','estos documentos'],answer:1},
        {q:'“ingen” puede significar…',options:['nadie/ningún','siempre','mucho'],answer:0},
        {q:'Imperativo de gemme',options:['gem','gemmer','gemte'],answer:0}
      ],
      {speaking:'Explica cómo enviar un archivo.',writing:'Escribe un mensaje con instrucciones digitales paso a paso.'}
    ),

    chapter('12','A2','Restaurante y servicio',
      'Pedir, modificar pedidos, valorar la comida y resolver problemas con cortesía.',
      ['reservar mesa','pedir menú','hacer cambios','quejarte cortésmente','pedir cuenta'],
      [['et bord','una mesa'],['et menukort','una carta'],['en ret','un plato'],['laks','salmón'],['stærk','picante/fuerte'],['salt','salado'],['regningen','la cuenta'],['at bestille','pedir'],['at anbefale','recomendar'],['uden','sin'],['med','con'],['desværre','por desgracia']],
      [
        'vil gerne sigue siendo útil, pero en A2 se amplía con kunne tænke mig (“me apetecería/me gustaría”) para peticiones más elaboradas.',
        'for + adjetivo expresa exceso: for stærk, for salt, for dyr.',
        'Para resolver un problema de manera cortés usa Undskyld, men… y preguntas con kunne/kan.'
      ],
      [['for + adjetivo','Suppen er for salt.'],['sin X','uden løg'],['petición','Kunne jeg få regningen?']],
      [['Tjener','God aften. Har I bestilt bord?','Buenas noches. ¿Han reservado mesa?'],['Gæst','Ja, et bord til tre klokken syv.','Sí, una mesa para tres a las siete.'],['Tjener','Hvad vil I gerne bestille?','¿Qué desean pedir?'],['Gæst','Jeg tager laksen, men uden løg.','Tomaré el salmón, pero sin cebolla.'],['Gæst','Undskyld, men saucen er lidt for stærk.','Perdone, pero la salsa está un poco demasiado picante.'],['Tjener','Jeg henter en ny med det samme.','Le traigo una nueva enseguida.']],
      ['Escucha tjener y bestille sin aplicar pronunciación española.','Practica kunne jeg få… como bloque cortés.','Diferencia stærk y stor mediante contexto y audio.'],
      [
        {type:'fill',prompt:'Suppen er ___ salt.',answer:'for'},
        {type:'fill',prompt:'Jeg vil gerne have den ___ løg.',answer:'uden'},
        {type:'order',prompt:'Ordena: få / kunne / regningen / jeg / ?',answer:'Kunne jeg få regningen?'},
        {type:'translate',prompt:'Traduce: La comida está demasiado picante.',answer:'Maden er for stærk.'},
        {type:'translate',prompt:'Traduce: Tomaré el salmón.',answer:'Jeg tager laksen.'},
        {type:'produce',prompt:'Escribe un diálogo con pedido, problema y solución.',answer:''}
      ],
      [
        {q:'“for dyr” significa…',options:['muy barato','demasiado caro','muy bueno'],answer:1},
        {q:'“uden løg” significa…',options:['con cebolla','sin cebolla','más cebolla'],answer:1},
        {q:'Una petición cortés puede empezar…',options:['Kunne jeg…','Skal du…','Hvorfor ikke…'],answer:0},
        {q:'“regningen” es…',options:['reserva','cuenta','carta'],answer:1}
      ],
      {speaking:'Representa cliente y camarero durante 2 minutos.',writing:'Escribe una reseña breve de una comida y una queja educada.'}
    ),

    chapter('13','A2','Trabajo, tiempo y movimiento',
      'Relatar una jornada laboral conectando presente, pasado y perfecto con expresiones de movimiento.',
      ['describir experiencia laboral','hablar de turnos','secuenciar acciones','distinguir destino/situación','usar perfecto'],
      [['erfaring','experiencia'],['en vagt','un turno'],['at møde','entrar/llegar al trabajo'],['at få fri','terminar/quedar libre'],['først','primero'],['derefter','después'],['til sidst','por último'],['hjem','a casa'],['hjemme','en casa'],['ud/ude','hacia fuera/fuera'],['ind/inde','hacia dentro/dentro'],['i to år','durante dos años']],
      [
        'El danés distingue dirección y situación en varios adverbios: hjem (hacia casa) / hjemme (en casa); ud/ude; ind/inde.',
        'El pasado cuenta un hecho terminado; el perfecto conecta experiencia o periodo con el presente: Jeg arbejdede i går / Jeg har arbejdet her i to år.',
        'først, derefter y til sidst ayudan a construir narraciones claras.'
      ],
      [['destino/situación','Jeg går hjem / Jeg er hjemme'],['pasado','I går arbejdede jeg sent.'],['perfecto','Jeg har arbejdet her i to år.']],
      [['A','Hvor længe har du arbejdet her?','¿Cuánto tiempo has trabajado aquí?'],['B','Jeg har arbejdet her i to år.','He trabajado aquí dos años.'],['A','Hvornår møder du?','¿A qué hora entras?'],['B','Jeg møder klokken ni.','Entro a las nueve.'],['A','Hvad gjorde du i går efter arbejde?','¿Qué hiciste ayer después del trabajo?'],['B','Først tog jeg bussen hjem, og derefter lavede jeg mad.','Primero tomé el autobús a casa y después cociné.']],
      ['Contrasta hjem/hjemme con movimiento real.','Escucha arbejdede y arbejdet como formas distintas.','Repite først-derefter-til sidst en secuencia.'],
      [
        {type:'fill',prompt:'Jeg går ___. (a casa)',answer:'hjem'},
        {type:'fill',prompt:'Jeg er ___. (en casa)',answer:'hjemme'},
        {type:'order',prompt:'Ordena: arbejdet / her / to / jeg / i / har / år',answer:'Jeg har arbejdet her i to år.'},
        {type:'translate',prompt:'Traduce: Ayer trabajé hasta tarde.',answer:'I går arbejdede jeg sent.'},
        {type:'translate',prompt:'Traduce: Primero fui a casa y después cené.',answer:'Først gik jeg hjem, og derefter spiste jeg aftensmad.'},
        {type:'produce',prompt:'Escribe tu jornada usando tres tiempos verbales.',answer:''}
      ],
      [
        {q:'“hjem” expresa…',options:['situación','movimiento hacia casa'],answer:1},
        {q:'“hjemme” expresa…',options:['estar en casa','ir a casa'],answer:0},
        {q:'Perfecto para experiencia',options:['har + participio','skal + infinitivo'],answer:0},
        {q:'“derefter” significa…',options:['antes','después','nunca'],answer:1}
      ],
      {speaking:'Cuenta un día laboral completo.',writing:'Escribe 120 palabras sobre tu experiencia laboral.'}
    ),

    chapter('14','A2','Invitaciones y discurso indirecto',
      'Aceptar/rechazar invitaciones y transmitir lo que otra persona pregunta o dice. Se introduce en serio el orden subordinado.',
      ['invitar','aceptar/rechazar','transmitir mensajes','usar at/om/hvis','aplicar orden subordinado'],
      [['at invitere','invitar'],['at passe','venir bien'],['på besøg','de visita'],['at spørge','preguntar'],['at sige','decir'],['at undre sig','preguntarse'],['at','que'],['om','si'],['hvis','si (condición)'],['fordi','porque'],['desværre','por desgracia'],['i stedet','en su lugar']],
      [
        'En una subordinada danesa, ikke aparece normalmente antes del verbo finito: fordi jeg ikke arbejder.',
        'om introduce preguntas indirectas de sí/no: Hun spørger, om vi kan komme.',
        'at introduce declaraciones indirectas: Han siger, at fredag ikke passer.'
      ],
      [['principal','Jeg arbejder ikke fredag.'],['subordinada','… fordi jeg ikke arbejder fredag.'],['indirecta','Hun spørger, om jeg kan komme.']],
      [['A','Vil I komme på besøg på lørdag?','¿Queréis venir de visita el sábado?'],['B','Ja, det vil vi gerne.','Sí, nos encantaría.'],['C','Hvad siger hun?','¿Qué dice ella?'],['B','Hun spørger, om vi kan komme på lørdag.','Pregunta si podemos venir el sábado.'],['C','Fredag passer ikke for mig.','El viernes no me viene bien.'],['B','Han siger, at fredag ikke passer.','Dice que el viernes no le viene bien.']],
      ['Escucha el ritmo de subordinadas largas.','Practica om vi kan komme sin pausa interna.','Marca la diferencia estructural entre principal y subordinada.'],
      [
        {type:'fill',prompt:'Hun spørger, ___ vi kan komme.',answer:'om'},
        {type:'fill',prompt:'Han siger, ___ fredag ikke passer.',answer:'at'},
        {type:'order',prompt:'Ordena subordinada: fordi / ikke / arbejder / jeg',answer:'fordi jeg ikke arbejder'},
        {type:'translate',prompt:'Traduce: Ella pregunta si puedo venir.',answer:'Hun spørger, om jeg kan komme.'},
        {type:'translate',prompt:'Traduce: Me quedo en casa porque no trabajo.',answer:'Jeg bliver hjemme, fordi jeg ikke arbejder.'},
        {type:'produce',prompt:'Convierte cuatro frases directas en indirectas.',answer:''}
      ],
      [
        {q:'En subordinada, ikke va normalmente…',options:['antes del verbo finito','al final siempre'],answer:0},
        {q:'Pregunta indirecta sí/no',options:['at','om','men'],answer:1},
        {q:'Declaración indirecta',options:['at','hvor','eller'],answer:0},
        {q:'“hvis” introduce…',options:['condición','posesión','plural'],answer:0}
      ],
      {speaking:'Transmite oralmente tres mensajes de otras personas.',writing:'Escribe una conversación y luego conviértela en discurso indirecto.'}
    ),

    chapter('15','A2','Trabajo, experiencia y viajes',
      'Lenguaje útil para buscar empleo y organizar un viaje. El capítulo conecta experiencia, duración y disponibilidad.',
      ['hablar de experiencia','describir competencias','decir disponibilidad','reservar viaje','preguntar duración'],
      [['at søge job','buscar empleo'],['erfaring','experiencia'],['færdigheder','habilidades'],['en ansøgning','solicitud'],['et CV','currículum'],['at starte','empezar'],['med kort varsel','con poca antelación'],['en rejse','un viaje'],['at blive','quedarse'],['hvor længe','cuánto tiempo'],['ledig','disponible/libre'],['stilling','puesto']],
      [
        'Para experiencia profesional es natural combinar har + participio con i + periodo: Jeg har arbejdet med logistik i syv år.',
        'søge puede significar buscar/solicitar según construcción: søge job, søge en stilling, søge ind på en uddannelse.',
        'kan expresa capacidad o disponibilidad: Jeg kan starte på mandag.'
      ],
      [['experiencia','Jeg har arbejdet med X i Y år.'],['solicitud','Jeg søger en stilling som…'],['disponibilidad','Jeg kan starte med kort varsel.']],
      [['Interviewer','Kan du fortælle lidt om din erfaring?','¿Puedes contar un poco sobre tu experiencia?'],['Kandidat','Jeg har arbejdet med logistik i syv år.','He trabajado en logística siete años.'],['Interviewer','Hvilke færdigheder har du?','¿Qué habilidades tienes?'],['Kandidat','Jeg arbejder struktureret og lærer hurtigt.','Trabajo de forma estructurada y aprendo rápido.'],['Interviewer','Hvornår kan du starte?','¿Cuándo puedes empezar?'],['Kandidat','Jeg kan starte med kort varsel.','Puedo empezar con poca antelación.']],
      ['Practica færdigheder con audio lento y normal.','Repite søge job / søge en stilling como combinaciones fijas.','Entrena cifras de años con i syv år.'],
      [
        {type:'fill',prompt:'Jeg har arbejdet med logistik ___ syv år.',answer:'i'},
        {type:'fill',prompt:'Jeg ___ en stilling som supportmedarbejder.',answer:'søger'},
        {type:'order',prompt:'Ordena: starte / jeg / mandag / kan / på',answer:'Jeg kan starte på mandag.'},
        {type:'translate',prompt:'Traduce: Tengo siete años de experiencia.',answer:'Jeg har syv års erfaring.'},
        {type:'translate',prompt:'Traduce: Busco un trabajo en IT.',answer:'Jeg søger et job inden for IT.'},
        {type:'produce',prompt:'Escribe respuestas a cinco preguntas de entrevista.',answer:''}
      ],
      [
        {q:'“søge en stilling” significa…',options:['rechazar puesto','solicitar puesto','dejar empleo'],answer:1},
        {q:'Duración: “durante siete años”',options:['på syv år','i syv år','til syv år'],answer:1},
        {q:'“med kort varsel”',options:['con poca antelación','por contrato','a tiempo parcial'],answer:0},
        {q:'“færdigheder”',options:['habilidades','vacaciones','salario'],answer:0}
      ],
      {speaking:'Haz una mini entrevista de trabajo.',writing:'Escribe un perfil profesional danés de 120–150 palabras.'}
    ),

    chapter('16','A2','Estudios y futuro',
      'Planificar estudios, requisitos y carrera profesional usando skal, vil, kommer til at y subordinadas temporales.',
      ['hablar de estudios','expresar planes','distinguir skal/vil','preguntar requisitos','usar når'],
      [['en uddannelse','una formación'],['et krav','un requisito'],['at søge ind','solicitar admisión'],['at fortsætte','continuar'],['at blive færdig','terminar'],['at bestå','aprobar'],['en eksamen','un examen'],['fremtid','futuro'],['skal','ir a / deber'],['vil','querer / voluntad'],['kommer til at','ir a / previsión'],['når','cuando (futuro/hábito)']],
      [
        'skal suele expresar plan o decisión ya establecida; vil expresa voluntad/intención; kommer til at puede expresar una previsión o consecuencia futura.',
        'Con verbos modales el infinitivo va sin at: Jeg skal studere. Con muchos otros verbos aparece at: Jeg prøver at lære.',
        'Når introduce tiempo futuro o repetido: Når jeg er færdig, vil jeg søge job.'
      ],
      [['plan','Jeg skal studere i Vejle.'],['intención','Jeg vil arbejde med IT.'],['previsión','Det kommer til at tage tid.']],
      [['A','Hvad skal du gøre næste år?','¿Qué vas a hacer el año que viene?'],['B','Jeg skal fortsætte med at studere dansk.','Voy a seguir estudiando danés.'],['A','Vil du søge ind på en uddannelse?','¿Quieres solicitar una formación?'],['B','Ja, når jeg er færdig med DAW.','Sí, cuando termine DAW.'],['A','Hvad vil du arbejde med?','¿En qué quieres trabajar?'],['B','Jeg vil arbejde med cybersikkerhed.','Quiero trabajar en ciberseguridad.']],
      ['Distingue skal y vil por intención, no por traducción literal.','Practica uddannelse y færdig con audio.','Repite Når jeg er færdig… como inicio de frase.'],
      [
        {type:'fill',prompt:'Jeg ___ fortsætte med at studere.',answer:'skal'},
        {type:'fill',prompt:'Når jeg er ___, vil jeg søge job.',answer:'færdig'},
        {type:'order',prompt:'Ordena: arbejde / vil / cybersikkerhed / jeg / med',answer:'Jeg vil arbejde med cybersikkerhed.'},
        {type:'translate',prompt:'Traduce: ¿Qué requisitos hay?',answer:'Hvilke krav er der?'},
        {type:'translate',prompt:'Traduce: Cuando termine, buscaré trabajo.',answer:'Når jeg er færdig, vil jeg søge job.'},
        {type:'produce',prompt:'Describe tu plan académico y profesional a dos años.',answer:''}
      ],
      [
        {q:'Plan ya decidido',options:['skal','vil','har'],answer:0},
        {q:'Voluntad/intención',options:['vil','er','blev'],answer:0},
        {q:'Tras modal, infinitivo normalmente…',options:['con at','sin at'],answer:1},
        {q:'“når” puede introducir…',options:['tiempo futuro/hábito','negación','género'],answer:0}
      ],
      {speaking:'Expón tu plan de dos años durante 90 segundos.',writing:'Escribe un plan con 3 usos de skal, 3 de vil y 2 de når.'}
    ),

    chapter('17','A2','Vivienda y comparación',
      'Buscar vivienda, comparar opciones y describir una casa. Se profundiza en comparativo, superlativo y expresiones espaciales.',
      ['describir vivienda','comparar precios/tamaño','usar superlativos','describir distribución','usar der er'],
      [['en lejlighed','un piso'],['et hus','una casa'],['husleje','alquiler'],['et soveværelse','dormitorio'],['et køkken','cocina'],['en altan','balcón'],['billig/billigere','barato/más barato'],['stor/større','grande/más grande'],['god/bedre/bedst','bueno/mejor/el mejor'],['ved siden af','al lado de'],['overfor','enfrente de'],['der er','hay']],
      [
        'Muchos comparativos terminan en -ere, pero hay formas irregulares: stor → større; god → bedre → bedst.',
        'der er introduce existencia: Der er en altan. No se traduce palabra por palabra.',
        'Las preposiciones y locuciones espaciales deben aprenderse con escenas: ved siden af, overfor, mellem, foran, bagved.'
      ],
      [['comparativo','A er billigere end B.'],['superlativo','Det er den bedste løsning.'],['existencia','Der er to værelser.']],
      [['A','Hvad synes du om lejligheden?','¿Qué opinas del piso?'],['B','Den er mindre, men billigere.','Es más pequeño, pero más barato.'],['A','Hvor ligger køkkenet?','¿Dónde está la cocina?'],['B','Det ligger ved siden af stuen.','Está al lado del salón.'],['A','Er der en altan?','¿Hay balcón?'],['B','Ja, der er en stor altan mod gården.','Sí, hay un balcón grande hacia el patio.']],
      ['Escucha større, bedre y bedst como formas independientes.','Practica der er rápido, sin separar.','Repite ved siden af como unidad preposicional.'],
      [
        {type:'fill',prompt:'Lejligheden er ___ end huset. (más barata)',answer:'billigere'},
        {type:'fill',prompt:'Der ___ en altan.',answer:'er'},
        {type:'order',prompt:'Ordena: siden / køkkenet / stuen / af / ved / ligger',answer:'Køkkenet ligger ved siden af stuen.'},
        {type:'translate',prompt:'Traduce: La casa es más grande.',answer:'Huset er større.'},
        {type:'translate',prompt:'Traduce: Es la mejor opción.',answer:'Det er den bedste mulighed.'},
        {type:'produce',prompt:'Compara dos viviendas con 8 criterios.',answer:''}
      ],
      [
        {q:'Comparativo de stor',options:['storere','større','storst'],answer:1},
        {q:'Superlativo de god',options:['bedst','bedre','goder'],answer:0},
        {q:'“Der er” significa…',options:['hay','allí','porque'],answer:0},
        {q:'“ved siden af”',options:['encima de','al lado de','dentro de'],answer:1}
      ],
      {speaking:'Compara dos anuncios de vivienda.',writing:'Escribe qué vivienda elegirías y por qué.'}
    ),

    chapter('18','A2','Teléfono y comunicación profesional',
      'Llamadas formales e informales, mensajes y comunicación de oficina.',
      ['contestar teléfono','pedir hablar con alguien','dejar mensaje','usar pronombres de objeto','dar instrucciones corteses'],
      [['at ringe','llamar'],['en afdeling','departamento'],['et øjeblik','un momento'],['en besked','un mensaje'],['at stille om','pasar una llamada'],['at sende','enviar'],['ham','lo/le (él)'],['hende','la/le (ella)'],['dem','los/las/les'],['med det samme','enseguida'],['desværre','por desgracia'],['optaget','ocupado']],
      [
        'En contexto profesional es frecuente contestar con empresa/departamento + nombre: Økonomiafdelingen, Maria Jensen.',
        'Los pronombres objeto distinguen han/ham, hun/hende, de/dem.',
        'Las peticiones pueden suavizarse con kan/kunne/må: Må jeg tale med…?'
      ],
      [['sujeto/objeto','han/ham · hun/hende · de/dem'],['petición','Må jeg tale med Peter?'],['mensaje','Kan du lægge en besked?']],
      [['Reception','Økonomiafdelingen, Maria Jensen.','Departamento de economía, Maria Jensen.'],['Kunde','Hej, må jeg tale med Peter?','Hola, ¿puedo hablar con Peter?'],['Reception','Et øjeblik. Jeg stiller dig om.','Un momento. Le paso.'],['Reception','Han er desværre optaget.','Por desgracia está ocupado.'],['Kunde','Kan du lægge en besked?','¿Puede dejarle un mensaje?'],['Reception','Ja, jeg beder ham ringe tilbage.','Sí, le pediré que devuelva la llamada.']],
      ['Practica må jeg tale med… como fórmula fija.','Escucha ham/hende en habla rápida.','Repite ringe tilbage sin traducir palabra por palabra.'],
      [
        {type:'fill',prompt:'Må jeg tale ___ Peter?',answer:'med'},
        {type:'fill',prompt:'Jeg beder ___ ringe tilbage. (a él)',answer:'ham'},
        {type:'order',prompt:'Ordena: en / lægge / kan / besked / du / ?',answer:'Kan du lægge en besked?'},
        {type:'translate',prompt:'Traduce: Un momento, por favor.',answer:'Et øjeblik, tak.'},
        {type:'translate',prompt:'Traduce: Le envío el documento enseguida.',answer:'Jeg sender dig dokumentet med det samme.'},
        {type:'produce',prompt:'Escribe un mensaje telefónico profesional.',answer:''}
      ],
      [
        {q:'Objeto de han',options:['han','ham','hans'],answer:1},
        {q:'Objeto de hun',options:['hun','hende','hendes'],answer:1},
        {q:'“optaget” en teléfono',options:['ocupado','apagado','gratis'],answer:0},
        {q:'“ringe tilbage”',options:['volver a llamar','colgar','marcar mal'],answer:0}
      ],
      {speaking:'Simula una llamada profesional completa.',writing:'Escribe una nota telefónica con nombre, motivo, número y acción.'}
    ),

    chapter('19','A2','Salud y consulta médica',
      'Explicar síntomas, duración, medicación y sueño en una consulta.',
      ['describir dolor','decir duración','hablar de medicación','responder al médico','explicar sueño'],
      [['at have ondt i','doler'],['hovedet','la cabeza'],['halsen','la garganta'],['feber','fiebre'],['medicin','medicación'],['en tablet','una pastilla'],['siden','desde'],['i flere uger','durante varias semanas'],['at sove','dormir'],['at falde i søvn','conciliar el sueño'],['at hjælpe','ayudar'],['en læge','médico']],
      [
        'El dolor se expresa a menudo con have ondt i + parte del cuerpo: Jeg har ondt i hovedet.',
        'i + periodo expresa duración total; siden + punto inicial expresa “desde”: i tre dage / siden mandag.',
        'have svært ved at + infinitivo expresa dificultad: Jeg har svært ved at falde i søvn.'
      ],
      [['dolor','Jeg har ondt i ryggen.'],['duración','i tre dage / siden mandag'],['dificultad','Jeg har svært ved at sove.']],
      [['Læge','Hvad har du for besvær?','¿Qué molestias tiene?'],['Patient','Jeg har ondt i hovedet og halsen.','Me duelen la cabeza y la garganta.'],['Læge','Hvor længe har du haft det?','¿Desde cuándo lo tiene?'],['Patient','I fire dage.','Desde hace cuatro días.'],['Læge','Tager du nogen medicin?','¿Toma algún medicamento?'],['Patient','Ja, jeg tager smertestillende.','Sí, tomo analgésicos.']],
      ['Escucha hovedet, halsen y læge con el modelo.','Practica har ondt i como bloque.','No pronuncies siden con sonido español de “s”.'],
      [
        {type:'fill',prompt:'Jeg har ___ i hovedet.',answer:'ondt'},
        {type:'fill',prompt:'Jeg har haft det ___ mandag.',answer:'siden'},
        {type:'order',prompt:'Ordena: svært / sove / jeg / ved / har / at',answer:'Jeg har svært ved at sove.'},
        {type:'translate',prompt:'Traduce: Tengo fiebre desde ayer.',answer:'Jeg har haft feber siden i går.'},
        {type:'translate',prompt:'Traduce: ¿Toma algún medicamento?',answer:'Tager du nogen medicin?'},
        {type:'produce',prompt:'Describe cuatro síntomas y su duración.',answer:''}
      ],
      [
        {q:'“have ondt i” expresa…',options:['dolor','hambre','precio'],answer:0},
        {q:'“siden mandag”',options:['hasta lunes','desde lunes','cada lunes'],answer:1},
        {q:'“svært ved at”',options:['facilidad','dificultad','obligación'],answer:1},
        {q:'“læge” es…',options:['enfermero','médico','farmacia'],answer:1}
      ],
      {speaking:'Simula una consulta de 2 minutos.',writing:'Escribe un historial breve: síntomas, inicio, medicación y sueño.'}
    ),

    chapter('20','A2','Noticias, sociedad y mundo actual',
      'Cierre de A2: comprender titulares, porcentajes, causas, pasiva y opinión. El estudiante debe poder resumir una noticia breve.',
      ['entender titulares','hablar de porcentajes','explicar causas','reconocer pasiva','expresar opinión'],
      [['nyheder','noticias'],['en overskrift','titular'],['arbejdsløshed','desempleo'],['priser','precios'],['at stige','subir'],['at falde','bajar'],['procent','porcentaje'],['ifølge','según'],['på grund af','a causa de'],['det skyldes','se debe a'],['at blive + participio','pasiva'],['udvikling','evolución/desarrollo']],
      [
        'Los titulares omiten a menudo información y usan formas compactas; conviene identificar primero verbo, sujeto y cifra.',
        'La pasiva puede formarse con blive + participio o con -s según verbo y registro: Huset bliver solgt / Huset sælges.',
        'ifølge introduce fuente; på grund af introduce causa nominal; fordi introduce una oración causal.'
      ],
      [['fuente','Ifølge rapporten…'],['causa','på grund af vejret / fordi det regner'],['pasiva','Huset bliver solgt.']],
      [['A','Har du set nyhederne?','¿Has visto las noticias?'],['B','Ja. Priserne stiger igen.','Sí. Los precios vuelven a subir.'],['A','Hvor meget?','¿Cuánto?'],['B','Ifølge rapporten omkring tre procent.','Según el informe, alrededor de un tres por ciento.'],['A','Hvad skyldes det?','¿A qué se debe?'],['B','Det skyldes flere forskellige faktorer.','Se debe a varios factores distintos.']],
      ['Practica arbejdsløshed en segmentos y luego completo.','Escucha procent con números reales.','Diferencia stiger (sube) y falder (baja).'],
      [
        {type:'fill',prompt:'___ rapporten stiger priserne.',answer:'Ifølge'},
        {type:'fill',prompt:'Det ___ flere faktorer.',answer:'skyldes'},
        {type:'order',prompt:'Ordena: bliver / huset / solgt',answer:'Huset bliver solgt.'},
        {type:'translate',prompt:'Traduce: El desempleo ha bajado.',answer:'Arbejdsløsheden er faldet.'},
        {type:'translate',prompt:'Traduce: Se debe al clima.',answer:'Det skyldes vejret.'},
        {type:'produce',prompt:'Resume una noticia en 5 frases y da tu opinión.',answer:''}
      ],
      [
        {q:'“ifølge” significa…',options:['según','aunque','sin'],answer:0},
        {q:'“stige” significa…',options:['bajar','subir','quedarse'],answer:1},
        {q:'Una pasiva posible',options:['blive + participio','skal + adjetivo'],answer:0},
        {q:'“Det skyldes…” introduce…',options:['causa','hora','posesión'],answer:0}
      ],
      {speaking:'Resume una noticia durante un minuto.',writing:'Escribe un texto de 150 palabras con fuente, dato, causa y opinión.'}
    )
  ];

  const grammarDeep = [
    ['01','Introducción al danés',
      ['El danés exige trabajar simultáneamente vocabulario, pronunciación, morfología y orden de palabras. Memorizar palabras aisladas no basta.',
       'Para un hispanohablante, las mayores dificultades iniciales suelen ser la distancia entre escritura y pronunciación, la regla V2 y los dos géneros en/et.',
       'Método recomendado: escucha primero, identifica estructura después y produce una variación propia inmediatamente.'],
      [['Identifica verbo y sujeto en: I dag arbejder jeg hjemme.','verbo: arbejder; sujeto: jeg'],['Transforma “Jeg bor i Spanien” empezando por “Nu”.','Nu bor jeg i Spanien.']]],
    ['02','Clases de palabras',
      ['Clasificar las palabras permite prever qué puede flexionarse y dónde aparece en la oración.',
       'Los sustantivos tienen género y número; los adjetivos concuerdan; los verbos se flexionan en tiempo pero no en persona.',
       'Los adverbios como ikke, ofte y altid tienen posiciones muy relevantes para el orden de la oración.'],
      [['Clasifica “hurtigt” en “Han arbejder hurtigt”.','adverbio'],['Clasifica “stor” en “en stor bil”.','adjetivo']]],
    ['03','Sujeto, verbo y complemento',
      ['La oración principal declarativa sigue la regla V2: el verbo finito ocupa la segunda posición estructural.',
       'La primera posición puede contener sujeto, tiempo, lugar u otro constituyente completo.',
       'Cuando un elemento distinto del sujeto ocupa la primera posición, se produce inversión: I dag arbejder jeg.'],
      [['Reordena: I dag / jeg / arbejder / hjemme.','I dag arbejder jeg hjemme.'],['Empieza por “På mandag”: Jeg starter et nyt kursus.','På mandag starter jeg et nyt kursus.']]],
    ['04','Tipos de oración',
      ['En principal, ikke suele ir después del verbo finito: Jeg kommer ikke.',
       'En pregunta sí/no el verbo finito ocupa la primera posición: Kommer du?',
       'Con palabra interrogativa: Hvor bor du? Hvad laver du? Hvornår kommer du?'],
      [['Niega: Jeg arbejder i morgen.','Jeg arbejder ikke i morgen.'],['Pregunta sí/no: Du taler dansk.','Taler du dansk?']]],
    ['05','Pronombres',
      ['Distingue pronombres sujeto y objeto: jeg/mig, du/dig, han/ham, hun/hende, vi/os, I/jer, de/dem.',
       'El reflexivo sig se refiere al sujeto de tercera persona: Han vasker sig.',
       'Los posesivos de tercera persona requieren distinguir sin/sit/sine de hans/hendes.'],
      [['Sustituye “Peter” por pronombre objeto: Jeg ser Peter.','Jeg ser ham.'],['Completa: Hun vasker ___.','sig']]],
    ['06','Varios verbos e imperativo',
      ['Los modales kan, skal, vil, må y bør se combinan con infinitivo sin at.',
       'El imperativo suele coincidir con la raíz: kom!, vent!, læs!, skriv!',
       'vil gerne funciona como petición/deseo cortés y debe aprenderse como unidad.'],
      [['Completa: Jeg kan ___ dansk.','tale'],['Imperativo de “at vente”.','Vent!']]],
    ['07','Oraciones compuestas',
      ['Las coordinadas con og, men, eller conservan estructura de principal.',
       'Las subordinadas introducidas por fordi, at, om, hvis, når alteran la posición de adverbios: fordi jeg ikke kommer.',
       'Las relativas usan som/der en muchos contextos y permiten añadir información sobre un sustantivo.'],
      [['Principal → subordinada: Jeg arbejder ikke. fordi…','fordi jeg ikke arbejder'],['Une: Manden bor her. Han er lærer.','Manden, som bor her, er lærer.']]],
    ['08','Pronunciación y ortografía',
      ['La pronunciación danesa no se obtiene leyendo letra por letra. Hay reducción de sílabas, consonantes debilitadas y schwa.',
       'El blødt d aparece en numerosas palabras y no equivale a la d española. El stød es un rasgo prosódico que distingue palabras y formas.',
       'La estrategia de la academia es audio → repetición → texto; nunca al revés en palabras nuevas.'],
      [['Escucha y repite con audio: mad, rød, gade.','repetición oral'],['Marca la sílaba fuerte en “arbejde”.','primera sílaba']]],
    ['09','Conjugación del verbo',
      ['Los verbos no concuerdan con persona: jeg arbejder, du arbejder, de arbejder.',
       'El presente suele llevar -r; el pasado tiene patrones regulares e irregulares; el perfecto usa har + participio.',
       'El futuro se expresa con presente contextual, skal, vil o kommer til at según intención y significado.'],
      [['Pasa a perfecto: Jeg arbejder.','Jeg har arbejdet.'],['Pasa a pasado: Jeg bor i Aarhus.','Jeg boede i Aarhus.']]],
    ['10','Flexión del sustantivo',
      ['Aprende sustantivo + artículo como una unidad: en bil, et hus.',
       'El definido suele ser sufijo: bilen, huset. El plural puede ser -er, -e, cero u otros cambios.',
       'La forma definida plural suele acabar en -ne/-ene según el paradigma.'],
      [['Completa: en bil → ___','bilen'],['Paradigma de bog','en bog · bogen · bøger · bøgerne']]],
    ['11','El adjetivo',
      ['Forma básica con en: en stor bil. Forma -t con et: et stort hus. Plural/definido normalmente -e: store biler, den store bil.',
       'Algunos adjetivos tienen particularidades ortográficas o no añaden -t de la forma esperada.',
       'Los adjetivos predicativos también concuerdan: bilen er stor; huset er stort; bilerne er store.'],
      [['Completa: et ___ hus (stor).','stort'],['Completa: de ___ biler (ny).','nye']]],
    ['12','Posesivos y genitivo',
      ['min/mit/mine y din/dit/dine concuerdan con lo poseído.',
       'sin/sit/sine se refiere al sujeto de tercera persona en la misma oración; hans/hendes señala otro poseedor.',
       'El genitivo se forma normalmente añadiendo -s al poseedor: Peters bil.'],
      [['Completa: Hun elsker ___ familie. (su propia)','sin'],['Forma genitivo: bilen til Peter','Peters bil']]],
    ['13','Otros determinantes',
      ['denne/dette/disse son demostrativos; den her/det her/de her son muy comunes en conversación.',
       'nogen/noget/nogle expresan cantidad o existencia indefinida en distintos contextos.',
       'ingen/intet/ingen niegan existencia y deben concordar con género/número.'],
      [['Completa: Jeg har ___ bil. (ningún coche)','ingen'],['Este documento','dette dokument']]],
    ['14','Comparación',
      ['Muchos comparativos usan -ere y superlativos -est: billig, billigere, billigst.',
       'Hay formas irregulares de alta frecuencia: god, bedre, bedst; stor, større, størst.',
       'Comparación de igualdad: lige så… som. Comparación de desigualdad: -ere end.'],
      [['Completa: billig → ___','billigere'],['Traduce: tan grande como','lige så stor som']]],
    ['15','Lugar, situación y movimiento',
      ['i/på dependen del tipo de lugar y de convenciones léxicas. til marca dirección y fra origen.',
       'El danés distingue pares direccionales/situacionales: hjem/hjemme, ud/ude, ind/inde, op/oppe, ned/nede.',
       'Aprende estos pares mediante escenas y verbos de movimiento, no como listas aisladas.'],
      [['Voy a casa.','Jeg går hjem.'],['Estoy fuera.','Jeg er ude.']]],
    ['16','Subordinadas e infinitivo',
      ['at introduce muchas subordinadas declarativas y también marca infinitivo.',
       'Después de modales, el infinitivo aparece sin at: Jeg kan komme.',
       'Las preguntas indirectas con om/hv- siguen orden subordinado.'],
      [['Completa: Jeg ved, ___ han ikke kommer.','at'],['Completa: Jeg prøver ___ lære dansk.','at']]],
    ['17','Énfasis y sujeto anticipatorio',
      ['der introduce existencia: Der er mange mennesker her.',
       'det puede ser sujeto formal en expresiones meteorológicas y evaluativas: Det regner. Det er vigtigt.',
       'Las construcciones hendidas enfatizan: Det er Maria, der ringer.'],
      [['Traduce: Hay un problema.','Der er et problem.'],['Enfatiza “Peter”: Peter arbejder i dag.','Det er Peter, der arbejder i dag.']]]
  ].map(function(row){return {id:row[0],title:row[1],theory:row[2],drills:row[3]};});

  return {chapters:chapters, grammar:grammarDeep};
})();