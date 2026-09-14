document.addEventListener('DOMContentLoaded', () => {
  const levels = {
    B1: {
      name: 'Intermedio',
      subtitle: 'Conversa, narra y resuelve situaciones.',
      lessons: [
        ['Present perfect: already, yet, just', 'Conectar experiencias pasadas con el presente.', 'Present perfect usa have/has + participio. Already afirma que algo ya paso; yet se usa en preguntas o negativas; just indica algo reciente.', ['I have already finished.', 'Have you eaten yet?', 'She has just arrived.'], ['already = ya', 'yet = todavia / ya en pregunta', 'just = justo ahora', 'experience = experiencia'], [['I have just arrived.', 'Acabo de llegar.'], ['Have you finished yet?', 'Ya has terminado?'], ['She has already called.', 'Ella ya llamo.']], 'Escribe cinco cosas que ya has hecho esta semana.', ['Choose the correct sentence.', ['I has just arrived.', 'I have just arrived.', 'I just have arrive.'], 1]],
        ['For y since', 'Decir desde cuando haces algo o durante cuanto tiempo.', 'For indica duracion; since indica punto de inicio. Usa present perfect para situaciones que siguen vigentes.', ['for two years', 'since 2024', 'I have lived here for months.'], ['for = durante', 'since = desde', 'still = todavia', 'move = mudarse'], [['I have worked here since May.', 'Trabajo aqui desde mayo.'], ['We have lived here for six months.', 'Vivimos aqui desde hace seis meses.'], ['She has known him for years.', 'Ella lo conoce desde hace anos.']], 'Habla de tu trabajo, estudios o ciudad usando for y since.', ['Complete: I have lived here ___ 2022.', ['for', 'since', 'yet'], 1]],
        ['Past perfect', 'Ordenar dos acciones pasadas.', 'Past perfect usa had + participio para mostrar que una accion ocurrio antes que otra en el pasado.', ['I had left before he arrived.', 'She had studied before the test.', 'They had eaten already.'], ['before = antes', 'after = despues', 'arrive = llegar', 'leave = salir'], [['I had finished before the meeting started.', 'Habia terminado antes de que empezara la reunion.'], ['She had left when I called.', 'Ella se habia ido cuando llame.'], ['They had already eaten.', 'Ellos ya habian comido.']], 'Cuenta una historia corta con dos acciones pasadas.', ['Complete: She ___ left when I arrived.', ['has', 'had', 'did'], 1]],
        ['Primer condicional', 'Hablar de consecuencias reales o probables.', 'Usa if + presente y will + verbo base para resultados posibles en el futuro.', ['If it rains, I will stay home.', 'If you study, you will improve.', 'If we leave now, we will arrive early.'], ['if = si', 'improve = mejorar', 'result = resultado', 'early = temprano'], [['If you practise, you will improve.', 'Si practicas, mejoraras.'], ['If it rains, we will take a taxi.', 'Si llueve, tomaremos un taxi.'], ['If I have time, I will call you.', 'Si tengo tiempo, te llamare.']], 'Escribe tres condiciones reales para tu semana.', ['Choose: If she studies, she ___ pass.', ['will', 'would', 'had'], 0]],
        ['Segundo condicional', 'Imaginar situaciones hipoteticas.', 'Usa if + pasado y would + verbo base para situaciones imaginarias o poco probables.', ['If I had more time, I would travel.', 'If she knew, she would help.', 'What would you do?'], ['would = haria', 'more time = mas tiempo', 'dream = sueno', 'choice = eleccion'], [['If I had more money, I would travel.', 'Si tuviera mas dinero, viajaria.'], ['If I were you, I would wait.', 'Si yo fuera tu, esperaria.'], ['What would you do?', 'Que harias?']], 'Responde: What would you do if you had one free month?', ['Complete: If I ___ you, I would study.', ['am', 'were', 'will be'], 1]],
        ['Pasiva basica', 'Cambiar el foco de quien hace la accion a la accion.', 'La pasiva se forma con be + participio. Es util cuando el resultado importa mas que la persona que hizo la accion.', ['The email is sent.', 'The house was built in 1990.', 'English is spoken here.'], ['send = enviar', 'build = construir', 'spoken = hablado', 'focus = foco'], [['English is spoken in many countries.', 'El ingles se habla en muchos paises.'], ['The report was finished yesterday.', 'El informe fue terminado ayer.'], ['The room is cleaned every day.', 'La habitacion se limpia cada dia.']], 'Transforma tres frases activas en pasivas.', ['Choose the passive sentence.', ['They speak English.', 'English is spoken.', 'English speaks.'], 1]],
        ['Must, should y have to', 'Expresar obligacion, consejo y necesidad.', 'Must y have to indican obligacion. Should da consejo. Must not prohibe; do not have to indica que no es necesario.', ['You must stop.', 'You should rest.', 'I have to work.', 'You do not have to pay.'], ['advice = consejo', 'rule = norma', 'necessary = necesario', 'rest = descansar'], [['You should drink water.', 'Deberias beber agua.'], ['I have to work tomorrow.', 'Tengo que trabajar manana.'], ['You must not smoke here.', 'No debes fumar aqui.']], 'Da cinco consejos a un estudiante de ingles.', ['Complete: You ___ sleep more.', ['should', 'yet', 'since'], 0]],
        ['Gerundio e infinitivo', 'Usar verbos despues de otros verbos comunes.', 'Algunos verbos van con -ing y otros con to + verbo. Enjoy va con -ing; want va con to.', ['I enjoy reading.', 'I want to learn.', 'She decided to leave.', 'He avoids driving.'], ['enjoy = disfrutar', 'want = querer', 'decide = decidir', 'avoid = evitar'], [['I enjoy learning English.', 'Disfruto aprendiendo ingles.'], ['She wants to improve.', 'Ella quiere mejorar.'], ['They decided to wait.', 'Decidieron esperar.']], 'Escribe frases con enjoy, want, need y decide.', ['Choose: I enjoy ___ music.', ['listen', 'listening', 'to listening'], 1]]
      ]
    },
    B2: {
      name: 'Intermedio alto',
      subtitle: 'Argumenta, matiza y participa en debates.',
      lessons: [
        ['Perfect continuous', 'Hablar de duracion y actividad hasta ahora.', 'Present perfect continuous usa have/has been + -ing. Destaca la actividad y su duracion.', ['I have been studying for two hours.', 'She has been working since morning.'], ['duration = duracion', 'recently = recientemente', 'effort = esfuerzo'], [['I have been learning English for a year.', 'Llevo un ano aprendiendo ingles.'], ['She has been working all morning.', 'Ella lleva toda la manana trabajando.'], ['Have you been waiting long?', 'Llevas mucho esperando?']], 'Describe algo que llevas tiempo haciendo.', ['Complete: I have ___ studying.', ['be', 'been', 'being'], 1]],
        ['Future perfect y continuous', 'Hablar de acciones futuras completadas o en progreso.', 'Future perfect usa will have + participio. Future continuous usa will be + -ing.', ['I will have finished by Friday.', 'This time tomorrow, I will be flying.'], ['by = para antes de', 'deadline = fecha limite', 'progress = progreso'], [['I will have finished by Monday.', 'Habre terminado para el lunes.'], ['At eight, I will be working.', 'A las ocho estare trabajando.'], ['They will have arrived by then.', 'Habrán llegado para entonces.']], 'Planifica tu semana usando dos futuros avanzados.', ['Choose: By Friday, I will ___ finished.', ['have', 'be', 'had'], 0]],
        ['Reported speech', 'Contar lo que dijo otra persona.', 'En estilo indirecto normalmente atrasas el tiempo verbal y cambias pronombres y referencias.', ['She said she was tired.', 'He asked where I lived.', 'They told me to wait.'], ['report = contar', 'ask = preguntar', 'tell = decir / ordenar'], [['She said that she was busy.', 'Ella dijo que estaba ocupada.'], ['He asked where I lived.', 'El pregunto donde vivia.'], ['They told us to wait.', 'Nos dijeron que esperaramos.']], 'Transforma tres frases directas en reported speech.', ['Report: I am tired -> She said she ___ tired.', ['is', 'was', 'were'], 1]],
        ['Tercer condicional', 'Imaginar un pasado alternativo.', 'Usa if + had + participio, would have + participio para hablar de algo que no paso.', ['If I had studied, I would have passed.', 'If we had left earlier, we would have arrived on time.'], ['regret = arrepentimiento', 'earlier = antes', 'miss = perder'], [['If I had known, I would have helped.', 'Si lo hubiera sabido, habria ayudado.'], ['If we had left earlier, we would have arrived on time.', 'Si hubieramos salido antes, habriamos llegado a tiempo.'], ['She would have called if she had had time.', 'Ella habria llamado si hubiera tenido tiempo.']], 'Escribe tres frases sobre decisiones pasadas.', ['Complete: If I had known, I ___ have called.', ['will', 'would', 'did'], 1]],
        ['Condicionales mixtos', 'Relacionar pasado y presente de forma hipotetica.', 'Un condicional mixto puede tener causa pasada y resultado presente: If I had studied, I would be ready now.', ['If I had trained, I would be ready now.', 'If she were careful, she would not have made that mistake.'], ['ready = preparado', 'cause = causa', 'consequence = consecuencia'], [['If I had saved money, I would be travelling now.', 'Si hubiera ahorrado dinero, estaria viajando ahora.'], ['If he were more patient, he would not have quit.', 'Si fuera mas paciente, no lo habria dejado.'], ['If we had planned better, we would be calmer now.', 'Si hubieramos planeado mejor, ahora estariamos mas tranquilos.']], 'Conecta una decision pasada con una consecuencia actual.', ['Choose: If I had studied, I ___ ready now.', ['will be', 'would be', 'would have been'], 1]],
        ['Relative clauses', 'Anadir informacion esencial o extra.', 'Defining clauses identifican; non-defining clauses anaden informacion y usan comas.', ['The woman who called is my boss.', 'My car, which is old, is reliable.'], ['define = definir', 'extra = adicional', 'comma = coma'], [['The person who helped me was kind.', 'La persona que me ayudo fue amable.'], ['This is the laptop that I bought.', 'Este es el portatil que compre.'], ['Madrid, which is very lively, attracts many visitors.', 'Madrid, que es muy viva, atrae muchos visitantes.']], 'Describe tres personas u objetos usando who, which y that.', ['Choose for a person:', ['which', 'who', 'where'], 1]],
        ['Wish e if only', 'Expresar deseos y arrepentimientos.', 'Wish + pasado expresa deseo presente. Wish + past perfect expresa arrepentimiento pasado.', ['I wish I spoke better English.', 'I wish I had called earlier.'], ['wish = desear', 'if only = ojala', 'earlier = antes'], [['I wish I had more time.', 'Ojala tuviera mas tiempo.'], ['If only I spoke English fluently.', 'Ojala hablara ingles con fluidez.'], ['I wish I had studied sooner.', 'Ojala hubiera estudiado antes.']], 'Escribe dos deseos presentes y dos arrepentimientos pasados.', ['Complete: I wish I ___ more time.', ['have', 'had', 'will have'], 1]],
        ['Modales de deduccion', 'Deducir con diferentes grados de seguridad.', 'Must have indica deduccion fuerte en pasado. Might have indica posibilidad. Can not have indica imposibilidad percibida.', ['She must have forgotten.', 'He might have missed the train.', 'They can not have finished already.'], ['deduction = deduccion', 'possibility = posibilidad', 'certain = seguro'], [['She must have left early.', 'Ella debe de haberse ido temprano.'], ['He might have forgotten.', 'Puede que lo haya olvidado.'], ['They can not have arrived yet.', 'No pueden haber llegado ya.']], 'Mira tres situaciones y escribe una deduccion para cada una.', ['Choose the strong deduction:', ['might have', 'must have', 'could have'], 1]]
      ]
    },
    C1: {
      name: 'Avanzado',
      subtitle: 'Controla registro, enfasis y argumentos complejos.',
      lessons: [
        ['Inversion avanzada', 'Dar enfasis con orden formal.', 'Con adverbiales negativos al inicio, invierte auxiliar y sujeto: Rarely have I seen...', ['Rarely have I seen such clarity.', 'Not only did she help, but she also led.'], ['rarely = rara vez', 'seldom = raramente', 'not only = no solo'], [['Rarely have I seen such a useful report.', 'Rara vez he visto un informe tan util.'], ['Never had we faced that problem before.', 'Nunca habiamos enfrentado ese problema antes.'], ['Not only did he apologise, but he also helped.', 'No solo se disculpo, sino que tambien ayudo.']], 'Reescribe tres frases usando inversion.', ['Complete: Never ___ I seen this before.', ['have', 'has', 'did'], 0]],
        ['Cleft sentences', 'Enfatizar la parte importante de una idea.', 'Las cleft sentences dividen la frase para destacar una informacion: What I need is time.', ['What matters is trust.', 'It was Ana who solved it.'], ['emphasis = enfasis', 'matter = importar', 'trust = confianza'], [['What I need is more practice.', 'Lo que necesito es mas practica.'], ['It was the timing that caused the problem.', 'Fue el momento lo que causo el problema.'], ['What worries me is the lack of data.', 'Lo que me preocupa es la falta de datos.']], 'Convierte tres frases normales en frases enfaticas.', ['Choose the cleft sentence:', ['I need time.', 'What I need is time.', 'Need what time.'], 1]],
        ['Participle clauses', 'Reducir frases de forma elegante.', 'Las participle clauses compactan informacion cuando el sujeto coincide: Having finished the report, she left.', ['Having reviewed the data, we changed the plan.', 'Written in clear language, the guide is useful.'], ['review = revisar', 'written = escrito', 'reduce = reducir'], [['Having finished his work, he went home.', 'Habiendo terminado su trabajo, se fue a casa.'], ['Written in simple English, the text is easy to read.', 'Escrito en ingles simple, el texto es facil de leer.'], ['Knowing the risks, they waited.', 'Conociendo los riesgos, esperaron.']], 'Reduce dos frases con participio.', ['Complete: ___ finished, she left.', ['Having', 'Had', 'Have'], 0]],
        ['Subjuntivo formal', 'Usar estructuras formales de recomendacion o necesidad.', 'En ingles formal, despues de expresiones como it is essential that, se usa verbo base: he be, she go.', ['It is essential that he be present.', 'They suggested that she apply.'], ['essential = esencial', 'recommend = recomendar', 'apply = solicitar'], [['It is important that she be informed.', 'Es importante que ella sea informada.'], ['They recommended that he apply today.', 'Recomendaron que solicitara hoy.'], ['I suggest that the team wait.', 'Sugiero que el equipo espere.']], 'Escribe tres recomendaciones formales.', ['Complete: It is essential that he ___ present.', ['is', 'be', 'was'], 1]],
        ['Condicionales sin if', 'Usar estructuras formales con inversion.', 'En registros formales puedes omitir if e invertir: Had I known..., Were you to..., Should you need...', ['Had I known, I would have helped.', 'Were you to accept, we would begin today.'], ['omit = omitir', 'formal = formal', 'accept = aceptar'], [['Had I known, I would have called.', 'Si lo hubiera sabido, habria llamado.'], ['Were we to change the plan, we would need approval.', 'Si cambiaramos el plan, necesitariamos aprobacion.'], ['Should you need help, contact us.', 'Si necesita ayuda, contactenos.']], 'Transforma tres condicionales con if a version formal.', ['Choose the formal equivalent of If I had known:', ['Had I known', 'Have I known', 'Did I know'], 0]],
        ['Pasiva avanzada', 'Usar causative passive e impersonales.', 'Have/get something done expresa que otra persona hace algo por ti. It is said that y he is believed to son pasivas impersonales.', ['I had my phone repaired.', 'It is believed that the policy will change.'], ['repair = reparar', 'believe = creer', 'claim = afirmar'], [['I had my car repaired.', 'Me repararon el coche.'], ['She got her hair cut.', 'Se corto el pelo.'], ['It is said that prices will rise.', 'Se dice que los precios subiran.']], 'Escribe dos causative passive y una impersonal passive.', ['Complete: I had my phone ___.', ['repair', 'repaired', 'repairing'], 1]]
      ]
    },
    C2: {
      name: 'Maestria',
      subtitle: 'Matiz, precision, estilo y lectura cultural.',
      lessons: [
        ['Flexibilidad gramatical', 'Alterar enfasis, ritmo y estilo sin perder precision.', 'En C2 la gramatica se usa como herramienta de estilo: puedes mover informacion, enfatizar o condensar ideas segun la intencion.', ['What concerns me is not the cost, but the timing.', 'Had we acted sooner, the result might differ.'], ['rhythm = ritmo', 'emphasis = enfasis', 'precision = precision'], [['The issue is not whether we can do it, but whether we should.', 'El problema no es si podemos hacerlo, sino si deberiamos.'], ['What matters is the evidence behind the claim.', 'Lo que importa es la evidencia detras de la afirmacion.'], ['Had we known earlier, we might have responded differently.', 'Si lo hubieramos sabido antes, podriamos haber respondido de otra forma.']], 'Reescribe una idea de tres formas: directa, formal y enfatica.', ['Choose the most precise sentence.', ['Thing is bad.', 'The proposal raises practical concerns.', 'Bad proposal thing.'], 1]],
        ['Estructuras literarias', 'Reconocer recursos formales o arcaicos en contexto.', 'Algunas estructuras aparecen en literatura, discursos o textos legales. No se usan a diario, pero conviene reconocerlas.', ['Were it not for your help...', 'Seldom does one encounter such restraint.'], ['literary = literario', 'archaic = arcaico', 'restraint = contencion'], [['Were it not for your support, this would be impossible.', 'Si no fuera por tu apoyo, esto seria imposible.'], ['Seldom does one see such patience.', 'Rara vez se ve tanta paciencia.'], ['Be that as it may, we must continue.', 'Sea como sea, debemos continuar.']], 'Identifica si una frase suena cotidiana, formal o literaria.', ['Complete: ___ that as it may, we continue.', ['Be', 'Is', 'Being'], 0]],
        ['Modales de alta complejidad', 'Expresar juicio fino sobre posibilidades pasadas.', 'Combinaciones como might have been, should have been y could have been being son raras, pero ayudan a analizar procesos complejos.', ['It might have been misunderstood.', 'The issue should have been addressed earlier.'], ['misunderstand = malinterpretar', 'address = abordar', 'process = proceso'], [['It might have been misunderstood.', 'Puede que se haya malinterpretado.'], ['The report should have been reviewed earlier.', 'El informe deberia haberse revisado antes.'], ['The building could have been being inspected at the time.', 'El edificio podria haber estado siendo inspeccionado en ese momento.']], 'Explica certeza, posibilidad y critica usando modales pasados.', ['Choose the criticism:', ['might have been', 'should have been', 'could be'], 1]],
        ['Elipsis y sustitucion', 'Evitar repeticion manteniendo claridad.', 'Elipsis omite informacion recuperable; sustitucion usa palabras como so, neither, do so, one, ones.', ['I hope so.', 'She can play better than I can.', 'I chose the red one.'], ['ellipsis = elipsis', 'substitution = sustitucion', 'avoid = evitar'], [['I think so.', 'Creo que si.'], ['She wanted the blue one.', 'Ella queria el azul.'], ['He did not agree, and neither did I.', 'El no estuvo de acuerdo, y yo tampoco.']], 'Reescribe un dialogo evitando repeticiones innecesarias.', ['Choose the substitution:', ['I want the blue one.', 'I want the blue car blue.', 'Blue I want.'], 0]],
        ['Vocabulario disciplinar', 'Manejar terminos especializados con contexto.', 'C2 no significa saber todas las palabras, sino interpretar terminos especializados y pedir precision cuando conviene.', ['legal liability', 'clinical evidence', 'literary ambiguity', 'philosophical premise'], ['liability = responsabilidad legal', 'evidence = evidencia', 'premise = premisa'], [['The legal liability remains unclear.', 'La responsabilidad legal sigue sin estar clara.'], ['The clinical evidence is limited.', 'La evidencia clinica es limitada.'], ['The argument rests on a weak premise.', 'El argumento descansa en una premisa debil.']], 'Explica un termino especializado en lenguaje sencillo.', ['Clinical evidence belongs mostly to:', ['medicine', 'shopping', 'weather'], 0]],
        ['Ironia y dobles sentidos', 'Interpretar significado implicito y tono cultural.', 'La ironia depende del contraste entre palabras y contexto. El significado real puede ser opuesto al literal.', ['A brilliant plan, if the aim was confusion.', 'That went well, said after a disaster.'], ['irony = ironia', 'implicit = implicito', 'tone = tono'], [['A brilliant plan, if the aim was confusion.', 'Un plan brillante, si el objetivo era confundir.'], ['That was helpful, she said, staring at the broken instructions.', 'Eso fue util, dijo mirando las instrucciones rotas.'], ['The compliment was not entirely sincere.', 'El cumplido no era del todo sincero.']], 'Identifica el significado literal y el significado real de una frase ironica.', ['The phrase can mean the opposite when there is:', ['contextual contrast', 'a number', 'a color'], 0]],
        ['Sinonimia fina y connotacion', 'Elegir palabras por matiz, registro e historia.', 'Dos sinonimos raramente son identicos. Childish y childlike no transmiten lo mismo; economical y economic tampoco.', ['childish behaviour', 'childlike curiosity', 'economic policy', 'economical car'], ['connotation = connotacion', 'register = registro', 'subtle = sutil'], [['His response was childish.', 'Su respuesta fue inmadura.'], ['She has a childlike curiosity.', 'Ella tiene una curiosidad inocente.'], ['This is an economical car.', 'Este coche consume poco.']], 'Compara tres pares de palabras parecidas y explica su matiz.', ['A car that uses little fuel is:', ['economic', 'economical', 'economics'], 1]]
      ]
    }
  };

  const a2 = document.querySelector('#a2-course');
  const anchor = a2 || document.querySelector('#a1-course') || document.querySelector('#academy-route');
  if (!anchor) return;

  const section = document.createElement('section');
  section.className = 'section advanced-course';
  section.id = 'advanced-course';
  section.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">BLOQUES B Y C / B1-C2</p>
        <h2>De autonomia<br><em>a dominio real.</em></h2>
      </div>
      <p>Cuatro niveles completos para conversar, argumentar, escribir con precision y comprender matices avanzados.</p>
    </div>
    <div id="advancedLevels"></div>
  `;
  anchor.after(section);

  const speak = (text, button) => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const voice = new SpeechSynthesisUtterance(text);
    voice.lang = 'en-US';
    voice.rate = .86;
    speechSynthesis.speak(voice);
    button.textContent = 'Repetir audio';
  };

  const mountLevel = (levelKey, config) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'advanced-level';
    wrapper.innerHTML = `
      <div class="section-heading">
        <div>
          <p class="eyebrow">${levelKey} / ${config.name.toUpperCase()}</p>
          <h2>${config.name}<br><em>${config.subtitle}</em></h2>
        </div>
        <p>${config.lessons.length} capitulos con teoria, vocabulario, practica, audio y mini test.</p>
      </div>
      <div class="advanced-shell">
        <aside class="advanced-sidebar"><h3>Capitulos ${levelKey}</h3><div class="advanced-chapters" data-chapters="${levelKey}"></div></aside>
        <article class="advanced-panel">
          <div class="advanced-topline"><span data-label="${levelKey}"></span><span data-progress="${levelKey}"></span></div>
          <h2 data-title="${levelKey}"></h2>
          <p class="advanced-objective" data-objective="${levelKey}"></p>
          <div class="advanced-grid">
            <div class="advanced-card"><h4>TEORIA</h4><p data-theory="${levelKey}"></p></div>
            <div class="advanced-card"><h4>ESTRUCTURA</h4><ul data-structure="${levelKey}"></ul></div>
            <div class="advanced-card"><h4>VOCABULARIO</h4><ul data-vocab="${levelKey}"></ul></div>
            <div class="advanced-card"><h4>PRACTICA</h4><p data-practice="${levelKey}"></p></div>
          </div>
          <div class="advanced-card" style="margin-top:14px"><h4>ESCUCHA Y REPITE</h4><div class="advanced-phrase-list" data-phrases="${levelKey}"></div></div>
          <div class="advanced-card" style="margin-top:14px"><h4>MINI TEST</h4><div class="advanced-test" data-test="${levelKey}"></div><div class="advanced-result" data-result="${levelKey}"></div><div class="advanced-actions"><button class="advanced-primary" data-check="${levelKey}" type="button">Comprobar</button><button class="advanced-secondary" data-complete="${levelKey}" type="button">Marcar capitulo completado</button><button class="advanced-secondary" data-next="${levelKey}" type="button">Siguiente capitulo</button></div></div>
        </article>
      </div>
    `;
    document.querySelector('#advancedLevels').append(wrapper);

    const storeKey = `stannet${levelKey}DeepProgress`;
    const state = JSON.parse(localStorage.getItem(storeKey) || '{"current":0,"done":{}}');
    const save = () => localStorage.setItem(storeKey, JSON.stringify(state));
    let current = Math.min(Number(state.current || 0), config.lessons.length - 1);
    let selected = null;

    const render = () => {
      const lesson = config.lessons[current];
      const id = `${levelKey.toLowerCase()}-${String(current + 1).padStart(2, '0')}`;
      selected = null;
      state.current = current;
      save();
      const doneCount = Object.values(state.done).filter(Boolean).length;
      wrapper.querySelector(`[data-progress="${levelKey}"]`).textContent = `${Math.round((doneCount / config.lessons.length) * 100)}% ${levelKey}`;
      wrapper.querySelector(`[data-label="${levelKey}"]`).textContent = `${levelKey} · CAPITULO ${String(current + 1).padStart(2, '0')}`;
      wrapper.querySelector(`[data-title="${levelKey}"]`).textContent = lesson[0];
      wrapper.querySelector(`[data-objective="${levelKey}"]`).textContent = lesson[1];
      wrapper.querySelector(`[data-theory="${levelKey}"]`).textContent = lesson[2];
      wrapper.querySelector(`[data-structure="${levelKey}"]`).innerHTML = lesson[3].map((item) => `<li>${item}</li>`).join('');
      wrapper.querySelector(`[data-vocab="${levelKey}"]`).innerHTML = lesson[4].map((item) => `<li>${item}</li>`).join('');
      wrapper.querySelector(`[data-phrases="${levelKey}"]`).innerHTML = lesson[5].map(([en, es], index) => `<div class="advanced-phrase"><div><strong>${en}</strong><span>${es}</span></div><button class="advanced-audio" data-audio="${index}" type="button">Escuchar</button></div>`).join('');
      wrapper.querySelector(`[data-practice="${levelKey}"]`).textContent = lesson[6];
      wrapper.querySelector(`[data-test="${levelKey}"]`).innerHTML = `<p>${lesson[7][0]}</p>${lesson[7][1].map((option, index) => `<button class="advanced-option" data-option="${index}" type="button">${option}</button>`).join('')}`;
      wrapper.querySelector(`[data-result="${levelKey}"]`).textContent = 'Elige una respuesta y comprueba.';
      wrapper.querySelector(`[data-complete="${levelKey}"]`).textContent = state.done[id] ? 'Capitulo completado' : 'Marcar capitulo completado';
      wrapper.querySelector(`[data-chapters="${levelKey}"]`).innerHTML = config.lessons.map((item, index) => {
        const itemId = `${levelKey.toLowerCase()}-${String(index + 1).padStart(2, '0')}`;
        return `<button class="advanced-chapter${index === current ? ' active' : ''}${state.done[itemId] ? ' done' : ''}" data-chapter="${index}" type="button">${String(index + 1).padStart(2, '0')} · ${item[0]}</button>`;
      }).join('');

      wrapper.querySelectorAll('.advanced-chapter').forEach((button) => button.addEventListener('click', () => {
        current = Number(button.dataset.chapter);
        render();
      }));
      wrapper.querySelectorAll('.advanced-audio').forEach((button) => button.addEventListener('click', () => speak(lesson[5][Number(button.dataset.audio)][0], button)));
      wrapper.querySelectorAll('.advanced-option').forEach((button) => button.addEventListener('click', () => {
        selected = Number(button.dataset.option);
        wrapper.querySelectorAll('.advanced-option').forEach((item) => item.classList.remove('selected'));
        button.classList.add('selected');
      }));
    };

    wrapper.querySelector(`[data-check="${levelKey}"]`).addEventListener('click', () => {
      const lesson = config.lessons[current];
      const result = wrapper.querySelector(`[data-result="${levelKey}"]`);
      if (selected === null) {
        result.textContent = 'Selecciona una respuesta primero.';
        return;
      }
      result.innerHTML = selected === lesson[7][2] ? '<strong>Correcto.</strong> Puedes marcar el capitulo como completado.' : `<strong>Revisa la teoria.</strong> La respuesta correcta es: ${lesson[7][1][lesson[7][2]]}`;
    });

    wrapper.querySelector(`[data-complete="${levelKey}"]`).addEventListener('click', () => {
      state.done[`${levelKey.toLowerCase()}-${String(current + 1).padStart(2, '0')}`] = true;
      save();
      render();
    });

    wrapper.querySelector(`[data-next="${levelKey}"]`).addEventListener('click', () => {
      current = (current + 1) % config.lessons.length;
      render();
    });

    render();
  };

  Object.entries(levels).forEach(([levelKey, config]) => mountLevel(levelKey, config));
});
