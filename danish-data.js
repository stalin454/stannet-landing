/* StanNet Danish Academy data. Kept separate from UI logic so curriculum can grow safely. */
window.stannetDanishData = {
  mastery: {
    B1:[
      ['01','Relatar experiencias','Pasado, conectores y detalles',['Fortæl om en oplevelse, du har haft.','Jeg har boet i Danmark i tre måneder.'],['Cuenta una experiencia que hayas tenido.','He vivido en Dinamarca durante tres meses.']],
      ['02','Explicar problemas','Pedir ayuda y proponer soluciones',['Der er et problem med min bolig.','Kan vi finde en løsning sammen?'],['Hay un problema con mi vivienda.','¿Podemos encontrar una solución juntos?']],
      ['03','Trabajo y objetivos','Hablar de planes profesionales',['Jeg vil gerne udvikle mine færdigheder.','Jeg søger et job, hvor jeg kan bruge sproget.'],['Me gustaría desarrollar mis habilidades.','Busco un trabajo donde pueda usar el idioma.']],
      ['04','Conversacion B1','Mantener un intercambio completo',['Jeg forstår, hvad du mener, men jeg ser det lidt anderledes.','Kan du forklare det på en anden måde?'],['Entiendo lo que quieres decir, pero lo veo un poco diferente.','¿Puedes explicarlo de otra manera?']]
    ],
    B2:[
      ['05','Argumentar con claridad','Justificar opiniones y comparar',['Jeg mener, at dette er den bedste løsning, fordi...','På den ene side..., men på den anden side...'],['Creo que esta es la mejor solución porque...','Por un lado..., pero por otro lado...']],
      ['06','Noticias y sociedad','Comprender temas actuales',['Ifølge artiklen er situationen mere kompleks.','Det påvirker både familier og arbejdspladser.'],['Según el artículo, la situación es más compleja.','Esto afecta tanto a las familias como a los lugares de trabajo.']],
      ['07','Reuniones','Acordar y discrepar con respeto',['Jeg vil gerne tilføje en vigtig pointe.','Jeg er ikke helt enig, men jeg forstår dit synspunkt.'],['Me gustaría añadir un punto importante.','No estoy del todo de acuerdo, pero entiendo tu punto de vista.']],
      ['08','Escritura funcional','Emails y solicitudes formales',['Jeg skriver angående vores aftale.','Jeg ser frem til at høre fra dig.'],['Le escribo con respecto a nuestro acuerdo.','Quedo a la espera de su respuesta.']]
    ],
    C1:[
      ['09','Matices y tono','Ironia, cortesía e intención',['Det kommer an på, hvordan man ser på det.','Det var vist ikke helt det, du mente.'],['Depende de cómo se mire.','Parece que no era exactamente eso lo que querías decir.']],
      ['10','Debate avanzado','Sostener una posicion',['Man kan argumentere for, at...','Det afgørende spørgsmål er, om...'],['Se puede argumentar que...','La cuestión decisiva es si...']],
      ['11','Lenguaje profesional','Presentar ideas complejas',['Jeg vil gerne fremhæve tre hovedpunkter.','Lad os vende tilbage til det vigtigste.'],['Me gustaría destacar tres puntos principales.','Volvamos a lo más importante.']],
      ['12','Cultura danesa','Interpretar contexto social',['Det hænger sammen med den danske måde at samarbejde på.','Jeg prøver at forstå perspektivet.'],['Está relacionado con la forma danesa de colaborar.','Intento comprender la perspectiva.']]
    ],
    C2:[
      ['13','Precisión lingüística','Elegir registro y formulación',['Jeg vil formulere det mere præcist.','Der er en væsentlig forskel mellem de to begreber.'],['Voy a formularlo con más precisión.','Hay una diferencia importante entre los dos conceptos.']],
      ['14','Análisis crítico','Evaluar fuentes y consecuencias',['Denne påstand kræver flere nuancer.','Man bør overveje konsekvenserne på længere sigt.'],['Esta afirmación requiere más matices.','Conviene considerar las consecuencias a largo plazo.']],
      ['15','Comunicación experta','Persuadir y negociar',['Jeg foreslår, at vi undersøger alternativerne.','Det er vigtigt at finde en balance mellem kvalitet og effektivitet.'],['Propongo que examinemos las alternativas.','Es importante encontrar un equilibrio entre calidad y eficiencia.']],
      ['16','Dominio C2','Expresarse con naturalidad',['Jeg kan tilpasse mit sprog til situationen.','Jeg kan forklare komplekse idéer klart og nuanceret.'],['Puedo adaptar mi lenguaje a la situación.','Puedo explicar ideas complejas con claridad y matices.']]
    ]
  },
  curriculum: {
    A1:[
      ['01','Presentarse, país e idioma','Nombre, origen, idiomas, profesión y preguntas básicas',[
        ['Hej, jeg hedder Luis.','Hola, me llamo Luis.'],
        ['Hvor kommer du fra?','¿De dónde eres?'],
        ['Jeg kommer fra Spanien.','Soy de España.'],
        ['Jeg taler spansk og lidt dansk.','Hablo español y un poco de danés.'],
        ['Hvad arbejder du med?','¿En qué trabajas?']
      ],'Verbo en segunda posición (V2), pronombres personales, preguntas con hvor/hvad e introducción a ikke.','Preséntate en cinco frases: nombre, país, idioma, profesión y una pregunta.'],
      ['02','Saludos, pronombres y objetos','Saludos cotidianos, pronombres y cosas que llevas contigo',[
        ['Hej, hvordan har du det?','Hola, ¿cómo estás?'],
        ['Jeg har det fint, tak.','Estoy bien, gracias.'],
        ['Det er en nøgle.','Es una llave.'],
        ['Jeg har en telefon i tasken.','Tengo un teléfono en el bolso.'],
        ['Er det din bog?','¿Es tu libro?']
      ],'Pronombres jeg/du/han/hun/vi/I/de, artículos en/et y uso básico de det.','Describe cinco objetos de tu mochila o de tu mesa.'],
      ['03','Números, hora y rutina','Edad, dirección, reloj y acciones del día',[
        ['Hvor gammel er du?','¿Cuántos años tienes?'],
        ['Hvad er klokken?','¿Qué hora es?'],
        ['Klokken er halv otte.','Son las siete y media.'],
        ['Jeg står op klokken syv.','Me levanto a las siete.'],
        ['Jeg spiser morgenmad klokken halv otte.','Desayuno a las siete y media.']
      ],'Números, orden temporal y forma definida del sustantivo: en bus → bussen, et hus → huset.','Cuenta tu mañana desde que te levantas hasta que sales de casa.'],
      ['04','Billetes, precios y café','Comprar, señalar, pedir y pagar',[
        ['En billet til centrum, tak.','Un billete al centro, por favor.'],
        ['Hvad koster den?','¿Cuánto cuesta?'],
        ['Jeg vil gerne have en kaffe og en bolle.','Quisiera un café y un bollo.'],
        ['Den her, tak.','Este de aquí, por favor.'],
        ['Jeg betaler med kort.','Pago con tarjeta.']
      ],'Demostrativos den her/det her/de her, números de precio y fórmula cortés vil gerne.','Simula una compra: pide un producto, pregunta el precio y paga.'],
      ['05','Ocio, frecuencia y adjetivos','Hablar de gustos, hábitos y descripciones',[
        ['Jeg går ofte i biografen.','Voy a menudo al cine.'],
        ['Jeg spiller nogle gange guitar.','A veces toco la guitarra.'],
        ['Filmen er god.','La película es buena.'],
        ['Det er et godt program.','Es un buen programa.'],
        ['De danske film er interessante.','Las películas danesas son interesantes.']
      ],'Adjetivo: forma común, neutra y plural; adverbios de frecuencia altid/ofte/nogle gange/sjældent/aldrig.','Explica tres actividades de ocio y con qué frecuencia las haces.'],
      ['06','Familia y pasado','Familia, posesivos y recuerdos',[
        ['Jeg har en bror og en søster.','Tengo un hermano y una hermana.'],
        ['Min søster bor i Aarhus.','Mi hermana vive en Aarhus.'],
        ['Mine forældre er pensionister.','Mis padres están jubilados.'],
        ['Da jeg var barn, boede jeg i en lille by.','Cuando era niño vivía en una ciudad pequeña.'],
        ['Min far arbejdede meget.','Mi padre trabajaba mucho.']
      ],'Posesivos min/mit/mine, din/dit/dine y pasado de verbos frecuentes.','Describe tu familia y añade dos frases sobre cómo era tu vida antes.'],
      ['07','Comida, cantidades y compras','Productos, envases, dinero y supermercado',[
        ['Har I mælk?','¿Tienen leche?'],
        ['Jeg skal have en flaske vand.','Necesito una botella de agua.'],
        ['Hvor står brødet?','¿Dónde está el pan?'],
        ['Hvad bliver det?','¿Cuánto es en total?'],
        ['Kan jeg betale med kort?','¿Puedo pagar con tarjeta?']
      ],'Sustantivos contables, cantidades, plural y preguntas de localización con hvor.','Haz una lista de compra y formula cuatro preguntas de supermercado.'],
      ['08','Experiencias, reservas y clima','Perfecto, reservas y situaciones de viaje',[
        ['Jeg har bestilt et bord til klokken syv.','He reservado una mesa para las siete.'],
        ['Har du været i København?','¿Has estado en Copenhague?'],
        ['Jeg har aldrig været der.','Nunca he estado allí.'],
        ['Det regner og blæser i dag.','Hoy llueve y hace viento.'],
        ['Jeg vil gerne reservere et værelse.','Quisiera reservar una habitación.']
      ],'Perfecto con har + participio, nunca/aldrig y fórmulas de reserva.','Cuenta dos cosas que has hecho y una que nunca has hecho.'],
      ['09','Transporte, movimiento y citas','Moverse, combinar transportes y quedar con alguien',[
        ['Jeg tager toget til Vejle.','Voy en tren a Vejle.'],
        ['Hvordan kommer jeg til stationen?','¿Cómo llego a la estación?'],
        ['Du skal skifte i Fredericia.','Tienes que hacer transbordo en Fredericia.'],
        ['Hvor skal jeg stå af?','¿Dónde tengo que bajarme?'],
        ['Vi mødes foran stationen klokken seks.','Nos vemos delante de la estación a las seis.']
      ],'Verbos de movimiento, til/fra, mod, foran/bagved y modal skal.','Explica una ruta con al menos dos medios de transporte.'],
      ['10','Dinamarca: país y vida cotidiana','Datos del país, ciudades y conversación cultural',[
        ['Danmarks hovedstad er København.','La capital de Dinamarca es Copenhague.'],
        ['Valutaen er danske kroner.','La moneda son coronas danesas.'],
        ['Aarhus ligger i Jylland.','Aarhus está en Jutlandia.'],
        ['Jeg vil gerne lære mere om Danmark.','Me gustaría aprender más sobre Dinamarca.'],
        ['Hvilken by vil du helst bo i?','¿En qué ciudad preferirías vivir?']
      ],'Nombres propios, geografía con i/på, superlativo básico y preguntas con hvilken.','Presenta Dinamarca en cinco frases y elige una ciudad para vivir.']
    ],
    A2:[
      ['11','Relaciones, personas y vida digital','Relaciones, formas del sustantivo y acciones digitales',[
        ['Hun er en god ven.','Ella es una buena amiga.'],
        ['Jeg har aldrig boet sammen med nogen.','Nunca he vivido con nadie.'],
        ['Denne computer er ny.','Este ordenador es nuevo.'],
        ['Klik på knappen og gem dokumentet.','Haz clic en el botón y guarda el documento.'],
        ['Send filen som en vedhæftet fil.','Envía el archivo como adjunto.']
      ],'Formas definida/indefinida y plural, denne/dette/disse y pronombres indefinidos.','Describe a una persona y da tres instrucciones digitales.'],
      ['12','Restaurante y servicio','Reservar, pedir, comentar la comida y pagar',[
        ['Har I et ledigt bord til tre?','¿Tienen una mesa libre para tres?'],
        ['Jeg vil gerne bestille laks.','Quisiera pedir salmón.'],
        ['Maden er for stærk.','La comida está demasiado picante.'],
        ['Kan vi få regningen, tak?','¿Nos trae la cuenta, por favor?'],
        ['Det smagte rigtig godt.','Estaba realmente bueno.']
      ],'Modalidad cortés, for + adjetivo y pasado de expresiones de valoración.','Representa un diálogo completo entre cliente y camarero.'],
      ['13','Trabajo, tiempo y movimiento','Experiencia laboral, secuencia temporal y dirección',[
        ['Jeg har arbejdet på hotel i to år.','He trabajado en un hotel durante dos años.'],
        ['I går havde jeg aftenvagt.','Ayer tuve turno de tarde.'],
        ['Først tager jeg bussen, og derefter går jeg hjem.','Primero tomo el autobús y después voy a casa.'],
        ['Jeg arbejder hjemmefra to dage om ugen.','Trabajo desde casa dos días por semana.'],
        ['Jeg går hjem klokken fem.','Me voy a casa a las cinco.']
      ],'Contraste presente/pasado/perfecto y adverbios de movimiento hjem/hjemme, ud/ude, ind/inde.','Cuenta un día laboral usando først, derefter y til sidst.'],
      ['14','Invitaciones y discurso indirecto','Invitar, aceptar, rechazar y transmitir mensajes',[
        ['Vil I komme på besøg på lørdag?','¿Queréis venir de visita el sábado?'],
        ['Ja, det vil vi gerne.','Sí, nos encantaría.'],
        ['Hun spørger, om vi kan komme.','Ella pregunta si podemos venir.'],
        ['Han siger, at fredag ikke passer.','Él dice que el viernes no le viene bien.'],
        ['Hvis det regner, bliver vi hjemme.','Si llueve, nos quedamos en casa.']
      ],'Subordinadas con at/om/hvis y orden de palabras subordinado: ikke antes del verbo finito.','Convierte tres frases directas en estilo indirecto.'],
      ['15','Trabajo, experiencia y viajes','Buscar empleo, explicar experiencia y organizar un viaje',[
        ['Jeg søger et job inden for IT.','Busco un trabajo en IT.'],
        ['Jeg har syv års erfaring med logistik.','Tengo siete años de experiencia en logística.'],
        ['Jeg vil gerne bestille en rejse til Danmark.','Quisiera reservar un viaje a Dinamarca.'],
        ['Hvor længe skal du blive?','¿Cuánto tiempo te vas a quedar?'],
        ['Jeg kan starte med kort varsel.','Puedo empezar con poca antelación.']
      ],'Experiencia con har + participio, duración con i y planificación con skal/vil.','Haz una mini entrevista laboral de cinco respuestas.'],
      ['16','Estudios y futuro','Educación, solicitudes y planes a medio plazo',[
        ['Jeg skal fortsætte med at studere dansk.','Voy a seguir estudiando danés.'],
        ['Jeg vil søge ind på en uddannelse.','Quiero solicitar plaza en una formación.'],
        ['Når jeg er færdig, vil jeg arbejde med cybersikkerhed.','Cuando termine, quiero trabajar en ciberseguridad.'],
        ['Jeg kommer til at bruge dansk hver dag.','Voy a usar danés todos los días.'],
        ['Hvilke krav er der til uddannelsen?','¿Qué requisitos tiene la formación?']
      ],'Futuro con skal, vil y kommer til at; infinitivo con at y subordinada temporal con når.','Explica tu plan académico de los próximos dos años.'],
      ['17','Vivienda y comparación','Buscar vivienda, comparar y describir ubicación',[
        ['Lejligheden er billigere end huset.','El piso es más barato que la casa.'],
        ['Huset er større, men det ligger længere væk.','La casa es más grande, pero está más lejos.'],
        ['Soveværelset ligger ved siden af køkkenet.','El dormitorio está al lado de la cocina.'],
        ['Der er en altan mod gården.','Hay un balcón hacia el patio.'],
        ['Jeg foretrækker den mindre lejlighed.','Prefiero el piso más pequeño.']
      ],'Comparativo y superlativo, der er y preposiciones espaciales.','Compara dos viviendas y decide cuál elegirías.'],
      ['18','Teléfono y comunicación profesional','Llamadas, mensajes, correo y problemas técnicos',[
        ['Det er Maria fra økonomiafdelingen.','Soy Maria del departamento de economía.'],
        ['Må jeg tale med Peter?','¿Puedo hablar con Peter?'],
        ['Vent et øjeblik, tak.','Espere un momento, por favor.'],
        ['Kan du lægge en besked?','¿Puedes dejar un mensaje?'],
        ['Jeg sender dig dokumentet med det samme.','Te envío el documento enseguida.']
      ],'Registro telefónico, imperativo cortés, pronombres de objeto y verbos separables de uso frecuente.','Deja un mensaje telefónico profesional completo.'],
      ['19','Salud y consulta médica','Síntomas, duración, medicación y hábitos',[
        ['Jeg har ondt i hovedet.','Me duele la cabeza.'],
        ['Hvor længe har du haft det sådan?','¿Cuánto tiempo llevas así?'],
        ['Jeg har haft det i flere uger.','Lo tengo desde hace varias semanas.'],
        ['Tager du nogen medicin?','¿Tomas algún medicamento?'],
        ['Jeg har svært ved at falde i søvn.','Me cuesta conciliar el sueño.']
      ],'Expresiones con have ondt i, duración con i/siden y construcción have svært ved at.','Explica cuatro síntomas y responde a preguntas del médico.'],
      ['20','Noticias, sociedad y mundo actual','Comprender titulares, porcentajes, causas y consecuencias',[
        ['Ifølge nyhederne stiger priserne igen.','Según las noticias, los precios vuelven a subir.'],
        ['Arbejdsløsheden er faldet en smule.','El desempleo ha bajado un poco.'],
        ['I morgen bliver vejret koldere.','Mañana hará más frío.'],
        ['Det skyldes flere forskellige faktorer.','Se debe a varios factores diferentes.'],
        ['Jeg mener, at udviklingen er vigtig.','Creo que la evolución es importante.']
      ],'Lenguaje de noticias, porcentajes, voz pasiva y conectores de causa/consecuencia.','Resume una noticia en cuatro frases y expresa tu opinión.']
    ]
  },
  grammarPath:[
    {id:'01',title:'Introducción al danés',focus:'Qué hay que aprender para hablar danés',rule:'Vocabulario, pronunciación, orden de palabras, flexión y construcción de oraciones se estudian juntos desde el principio.',examples:[['Jeg lærer dansk hver dag.','Aprendo danés cada día.'],['Dansk udtale kræver træning.','La pronunciación danesa requiere práctica.']]},
    {id:'02',title:'Clases de palabras',focus:'Verbo, sustantivo, número, género, pronombre, adjetivo, adverbio, preposición y numeral',rule:'El danés distingue, entre otras categorías, verbos, sustantivos en/et, pronombres, adjetivos y adverbios; aprender la categoría ayuda a prever la posición y la flexión.',examples:[['en bil · et hus','un coche · una casa'],['hurtig · hurtigt · hurtige','rápido/a · rápidamente/neutro · rápidos/as']]},
    {id:'03',title:'Sujeto, verbo y complemento',focus:'Estructura básica y regla V2',rule:'En una oración principal declarativa el verbo finito ocupa normalmente la segunda posición. El sujeto puede ir primero o después del verbo si otro elemento ocupa la primera posición.',examples:[['Jeg arbejder i dag.','Trabajo hoy.'],['I dag arbejder jeg hjemme.','Hoy trabajo desde casa.']]},
    {id:'04',title:'Tipos de oración',focus:'Negación, preguntas, inversión y respuestas breves',rule:'En principal, ikke suele ir después del verbo finito. En preguntas sí/no el verbo puede ir primero; con palabra interrogativa se mantiene V2.',examples:[['Jeg arbejder ikke i morgen.','No trabajo mañana.'],['Hvor bor du?','¿Dónde vives?']]},
    {id:'05',title:'Pronombres',focus:'Sujeto, objeto, reflexivos y orden',rule:'Distingue jeg/mig, du/dig, han/ham, hun/hende, vi/os, I/jer, de/dem. El reflexivo sig se usa con tercera persona.',examples:[['Hun hjælper mig.','Ella me ayuda.'],['Han vasker sig.','Él se lava.']]},
    {id:'06',title:'Varios verbos e imperativo',focus:'Infinitivo, modales, órdenes y cortesía',rule:'Tras kan, skal, vil, må y bør el infinitivo va normalmente sin at. El imperativo usa la raíz verbal.',examples:[['Jeg kan tale lidt dansk.','Puedo hablar un poco de danés.'],['Vent et øjeblik.','Espera un momento.']]},
    {id:'07',title:'Oraciones compuestas',focus:'Coordinación, subordinación y relativas',rule:'En subordinada, adverbios como ikke suelen colocarse antes del verbo finito: fordi jeg ikke arbejder. Las relativas usan som/der según la función.',examples:[['Jeg bliver hjemme, fordi jeg ikke arbejder.','Me quedo en casa porque no trabajo.'],['Manden, som bor her, er lærer.','El hombre que vive aquí es profesor.']]},
    {id:'08',title:'Pronunciación y ortografía',focus:'Vocales, longitud, stød, blødt d, r y reducción',rule:'El danés hablado reduce muchas sílabas. Hay que entrenar longitud vocálica, stød, d suave, r y schwa, además de la relación irregular entre escritura y sonido.',examples:[['mad','comida; la d final suele ser blanda'],['rød','rojo; combina vocal y d suave']]},
    {id:'09',title:'Conjugación del verbo',focus:'Presente, pasado, perfecto, futuro, pasiva y participios',rule:'Los verbos no cambian por persona. El presente suele acabar en -r; el perfecto usa har + participio; el futuro suele expresarse con skal/vil/kommer til at.',examples:[['jeg arbejder · vi arbejder','yo trabajo · nosotros trabajamos'],['jeg har arbejdet','he trabajado']]},
    {id:'10',title:'Flexión del sustantivo',focus:'en/et, definido, plural y genitivo',rule:'El artículo definido suele añadirse al final: en bil → bilen, et hus → huset. El plural tiene varios patrones y el genitivo se marca con -s.',examples:[['en bog · bogen · bøger · bøgerne','un libro · el libro · libros · los libros'],['Peters bil','el coche de Peter']]},
    {id:'11',title:'El adjetivo',focus:'Concordancia, forma definida y participios',rule:'El adjetivo suele tener forma común, neutra y plural/definida: en stor bil, et stort hus, store biler, den store bil.',examples:[['en gammel bil','un coche viejo'],['et gammelt hus','una casa vieja']]},
    {id:'12',title:'Posesivos y genitivo',focus:'min/mit/mine, din/dit/dine, sin/sit/sine y -s',rule:'El posesivo concuerda con el sustantivo poseído. sin/sit/sine remite al sujeto de tercera persona de la misma oración.',examples:[['mit hus · mine venner','mi casa · mis amigos'],['Hun elsker sin familie.','Ella quiere a su propia familia.']]},
    {id:'13',title:'Otros determinantes',focus:'Demostrativos, indefinidos y cuantificadores',rule:'denne/dette/disse señalan; nogen/noget/nogle expresan cantidad indefinida; ingen/intet/ingen niegan existencia según género/número.',examples:[['denne bog · dette hus · disse bøger','este libro · esta casa · estos libros'],['Jeg har ingen bil.','No tengo coche.']]},
    {id:'14',title:'Comparación',focus:'Comparativo y superlativo',rule:'Muchos adjetivos forman comparativo con -ere y superlativo con -est, aunque hay formas irregulares como god → bedre → bedst.',examples:[['billig · billigere · billigst','barato · más barato · el más barato'],['god · bedre · bedst','bueno · mejor · el mejor']]},
    {id:'15',title:'Lugar, situación y movimiento',focus:'i/på/til/fra y pares como hjem/hjemme',rule:'El danés distingue a menudo destino y situación: hjem indica movimiento hacia casa; hjemme indica estar en casa. Lo mismo ocurre con ind/inde y ud/ude.',examples:[['Jeg går hjem.','Voy a casa.'],['Jeg er hjemme.','Estoy en casa.']]},
    {id:'16',title:'Subordinadas e infinitivo',focus:'at, om, hv- indirectas e infinitivo',rule:'Las subordinadas con at/om/hv- siguen orden subordinado. El infinitivo usa at salvo después de modales y algunas construcciones fijas.',examples:[['Jeg ved, at han ikke kommer.','Sé que él no viene.'],['Jeg prøver at lære dansk.','Intento aprender danés.']]},
    {id:'17',title:'Énfasis y sujeto anticipatorio',focus:'det, der y construcciones hendidas',rule:'der introduce existencia y det puede funcionar como sujeto formal o en construcciones de énfasis: Det er Maria, der ringer.',examples:[['Der er mange mennesker her.','Hay mucha gente aquí.'],['Det er Peter, der arbejder i dag.','Es Peter quien trabaja hoy.']]}
  },
  memoryLessons: {greetings:{label:'LECCION 01 · SALUDOS',title:'Saludos formales e informales.',items:[['Hola','Hej'],['Buenos dias','Godmorgen'],['Buenas tardes','God eftermiddag'],['¿Como estas?','Hvordan har du det?'],['Adios','Farvel']]},numbers:{label:'LECCION 02 · NUMEROS',title:'Cuenta y construye seguridad.',items:[['Cero','nul'],['Uno','en'],['Cinco','fem'],['Diez','ti'],['Veinte','tyve']]},weekdays:{label:'LECCION 03 · DIAS',title:'Los dias de la semana.',items:[['Lunes','mandag'],['Martes','tirsdag'],['Miercoles','onsdag'],['Jueves','torsdag'],['Viernes','fredag'],['Sabado','lørdag'],['Domingo','søndag']]},months:{label:'LECCION 04 · MESES',title:'El calendario en danes.',items:[['Enero','januar'],['Febrero','februar'],['Marzo','marts'],['Abril','april'],['Mayo','maj'],['Junio','juni'],['Julio','juli'],['Agosto','august'],['Septiembre','september'],['Octubre','oktober'],['Noviembre','november'],['Diciembre','december']]},phrases:{label:'LECCION 05 · FRASES',title:'Frases para empezar a vivir el idioma.',items:[['Me llamo...','Jeg hedder...'],['Vivo en España','Jeg bor i Spanien'],['No entiendo','Jeg forstår ikke'],['¿Puedes repetir?','Kan du gentage?'],['Hablo un poco de danes','Jeg taler lidt dansk']]}},
  danishPhrases: [['Hej, jeg hedder Anna.','Hola, me llamo Anna.'],['Jeg bor i Spanien.','Vivo en España.'],['Hvordan har du det?','¿Como estas?'],['Jeg taler lidt dansk.','Hablo un poco de danes.']]
};
