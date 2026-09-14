document.addEventListener('DOMContentLoaded', () => {
  const lessons = [
    {
      id: 'a2-01',
      title: 'Pasado simple regular',
      objective: 'Contar acciones terminadas usando verbos regulares en pasado.',
      theory: 'El pasado simple habla de acciones terminadas. En verbos regulares se anade -ed: work -> worked. Usa did para preguntas y did not para negativas.',
      structure: ['I worked yesterday.', 'She visited London.', 'Did you study?', 'I did not watch TV.'],
      vocab: ['yesterday = ayer', 'last week = la semana pasada', 'visit = visitar', 'finish = terminar', 'start = empezar'],
      phrases: [['I visited my friend yesterday.', 'Visite a mi amigo ayer.'], ['She finished the lesson.', 'Ella termino la leccion.'], ['Did you study last night?', 'Estudiaste anoche?'], ['I did not watch TV.', 'No vi la television.']],
      practice: 'Escribe cinco frases sobre lo que hiciste ayer usando verbos regulares.',
      test: { question: 'Choose the correct past sentence.', options: ['I visit yesterday.', 'I visited yesterday.', 'I did visited yesterday.'], answer: 1 }
    },
    {
      id: 'a2-02',
      title: 'Pasado simple irregular',
      objective: 'Usar verbos irregulares frecuentes para hablar de experiencias pasadas.',
      theory: 'Los verbos irregulares no terminan siempre en -ed. Debes aprender sus formas: go -> went, have -> had, see -> saw.',
      structure: ['I went to work.', 'We had breakfast.', 'She saw a film.', 'Did they come?'],
      vocab: ['went = fui / fue', 'had = tuve / tenia', 'saw = vi / vio', 'bought = compre / compro', 'came = vino'],
      phrases: [['I went to the supermarket.', 'Fui al supermercado.'], ['We had dinner at eight.', 'Cenamos a las ocho.'], ['She bought a new coat.', 'Ella compro un abrigo nuevo.'], ['Did he come home late?', 'El llego tarde a casa?']],
      practice: 'Cuenta una pequena historia usando went, had, saw y bought.',
      test: { question: 'Past of go:', options: ['goed', 'went', 'goes'], answer: 1 }
    },
    {
      id: 'a2-03',
      title: 'Pasado continuo',
      objective: 'Describir una accion que estaba ocurriendo en un momento pasado.',
      theory: 'El pasado continuo se forma con was/were + verbo en -ing. Se usa para acciones en progreso en el pasado.',
      structure: ['I was cooking.', 'They were studying.', 'She was waiting when I arrived.', 'Were you sleeping?'],
      vocab: ['while = mientras', 'when = cuando', 'wait = esperar', 'sleep = dormir', 'arrive = llegar'],
      phrases: [['I was studying at seven.', 'Estaba estudiando a las siete.'], ['They were waiting for the bus.', 'Estaban esperando el autobus.'], ['She was cooking when I called.', 'Ella estaba cocinando cuando llame.'], ['Were you sleeping?', 'Estabas durmiendo?']],
      practice: 'Escribe tres frases con was/were + -ing y una con when.',
      test: { question: 'Complete: They ___ watching TV.', options: ['was', 'were', 'did'], answer: 1 }
    },
    {
      id: 'a2-04',
      title: 'Futuro con going to',
      objective: 'Hablar de planes e intenciones ya decididas.',
      theory: 'Going to expresa un plan o una intencion previa. Se forma con to be + going to + verbo base.',
      structure: ['I am going to study.', 'She is going to travel.', 'We are going to cook.', 'Are you going to call?'],
      vocab: ['plan = plan', 'tonight = esta noche', 'tomorrow = manana', 'travel = viajar', 'call = llamar'],
      phrases: [['I am going to study tonight.', 'Voy a estudiar esta noche.'], ['She is going to visit her family.', 'Ella va a visitar a su familia.'], ['We are going to cook dinner.', 'Vamos a cocinar la cena.'], ['Are you going to call me?', 'Vas a llamarme?']],
      practice: 'Escribe tus tres planes para manana con going to.',
      test: { question: 'Choose the correct plan.', options: ['I going to study.', 'I am going to study.', 'I am going study.'], answer: 1 }
    },
    {
      id: 'a2-05',
      title: 'Futuro con will',
      objective: 'Hacer predicciones, promesas, ofrecimientos y decisiones rapidas.',
      theory: 'Will + verbo base se usa para predicciones, promesas, ofrecimientos y decisiones tomadas en el momento.',
      structure: ['I will help you.', 'It will rain.', 'I will call later.', 'Will you come?'],
      vocab: ['help = ayudar', 'later = mas tarde', 'promise = prometer', 'probably = probablemente', 'maybe = quizas'],
      phrases: [['I will help you.', 'Te ayudare.'], ['It will probably rain.', 'Probablemente llovera.'], ['I will call you later.', 'Te llamare mas tarde.'], ['Will you come with us?', 'Vendras con nosotros?']],
      practice: 'Escribe dos predicciones y dos promesas con will.',
      test: { question: 'Complete: I ___ help you.', options: ['will', 'am', 'going'], answer: 0 }
    },
    {
      id: 'a2-06',
      title: 'Comparativos y superlativos',
      objective: 'Comparar personas, lugares y objetos con claridad.',
      theory: 'Usa -er con adjetivos cortos: cheaper. Usa more con adjetivos largos: more expensive. El superlativo usa the: the cheapest, the most interesting.',
      structure: ['This bag is cheaper than that one.', 'Madrid is bigger than my town.', 'This is the best option.', 'It is more expensive.'],
      vocab: ['cheap = barato', 'expensive = caro', 'bigger = mas grande', 'better = mejor', 'the best = el mejor'],
      phrases: [['This phone is cheaper than that one.', 'Este telefono es mas barato que aquel.'], ['My city is smaller than London.', 'Mi ciudad es mas pequena que Londres.'], ['This is the most comfortable chair.', 'Esta es la silla mas comoda.'], ['Which one is better?', 'Cual es mejor?']],
      practice: 'Compara dos ciudades, dos comidas y dos formas de estudiar.',
      test: { question: 'Choose the correct comparative.', options: ['more cheap', 'cheaper', 'cheap than'], answer: 1 }
    },
    {
      id: 'a2-07',
      title: 'Modales basicos',
      objective: 'Pedir permiso, expresar habilidad y hacer peticiones educadas.',
      theory: 'Can expresa habilidad o posibilidad. Could hace peticiones mas educadas. May se usa para permiso en tono mas formal.',
      structure: ['I can swim.', 'Can I sit here?', 'Could you help me?', 'May I come in?'],
      vocab: ['can = poder', 'could = podria', 'may = puedo / podria formal', 'permission = permiso', 'ability = habilidad'],
      phrases: [['I can speak a little English.', 'Puedo hablar un poco de ingles.'], ['Can I pay by card?', 'Puedo pagar con tarjeta?'], ['Could you repeat that?', 'Podrias repetir eso?'], ['May I ask a question?', 'Puedo hacer una pregunta?']],
      practice: 'Escribe tres habilidades y tres peticiones educadas.',
      test: { question: 'Choose the polite request.', options: ['Could you help me?', 'You help me.', 'Help me now.'], answer: 0 }
    },
    {
      id: 'a2-08',
      title: 'Cuantificadores',
      objective: 'Hablar de cantidades con much, many, some, any y a lot of.',
      theory: 'Many se usa con contables plurales; much con incontables. Some aparece en afirmativas y any en negativas o preguntas. A lot of funciona con ambos.',
      structure: ['many books', 'much water', 'some apples', 'any money', 'a lot of time'],
      vocab: ['money = dinero', 'time = tiempo', 'people = personas', 'food = comida', 'water = agua'],
      phrases: [['There are many people here.', 'Hay muchas personas aqui.'], ['I do not have much time.', 'No tengo mucho tiempo.'], ['We need some water.', 'Necesitamos algo de agua.'], ['Do you have any questions?', 'Tienes alguna pregunta?']],
      practice: 'Describe tu nevera o tu mochila usando some, any, much y many.',
      test: { question: 'Complete: I do not have ___ money.', options: ['many', 'much', 'some'], answer: 1 }
    },
    {
      id: 'a2-09',
      title: 'Conectores y relativos',
      objective: 'Unir ideas sencillas con and, but, because, so, who, which y that.',
      theory: 'Los conectores ayudan a explicar relaciones. Because da razon; so da resultado; but contrasta. Who habla de personas; which y that hablan de cosas o ideas.',
      structure: ['I am tired because I worked late.', 'It was raining, so I stayed home.', 'This is the woman who helped me.', 'This is the book that I bought.'],
      vocab: ['because = porque', 'so = asi que', 'but = pero', 'who = quien / que para personas', 'which = que / cual'],
      phrases: [['I stayed home because I was tired.', 'Me quede en casa porque estaba cansado.'], ['It was late, so we took a taxi.', 'Era tarde, asi que tomamos un taxi.'], ['This is the man who called you.', 'Este es el hombre que te llamo.'], ['I bought a coat that was very warm.', 'Compre un abrigo que era muy calido.']],
      practice: 'Une seis frases cortas usando because, so, but, who y that.',
      test: { question: 'Choose the reason connector.', options: ['because', 'so', 'who'], answer: 0 }
    },
    {
      id: 'a2-10',
      title: 'Viajes, compras y salud',
      objective: 'Usar A2 en situaciones reales: comprar, viajar, pedir ayuda y explicar sintomas.',
      theory: 'En A2 combinas tiempos, modales y vocabulario cotidiano para resolver situaciones. La prioridad es comunicar el mensaje con claridad.',
      structure: ['Could you tell me the way?', 'I would like to buy this.', 'I have a headache.', 'I am going to travel by train.'],
      vocab: ['ticket = billete', 'receipt = recibo', 'headache = dolor de cabeza', 'station = estacion', 'size = talla'],
      phrases: [['Could you tell me the way to the station?', 'Podrias decirme el camino a la estacion?'], ['I would like to buy this shirt.', 'Me gustaria comprar esta camisa.'], ['I have a headache.', 'Me duele la cabeza.'], ['What size do you need?', 'Que talla necesitas?']],
      practice: 'Crea un dialogo corto en una tienda, una estacion o una consulta medica.',
      test: { question: 'Choose the health sentence.', options: ['I have a headache.', 'I have a station.', 'I have a ticket blue.'], answer: 0 }
    }
  ];

  const a1 = document.querySelector('#a1-course');
  const route = document.querySelector('#academy-route');
  const anchor = a1 || route;
  if (!anchor) return;

  const section = document.createElement('section');
  section.className = 'section a2-course';
  section.id = 'a2-course';
  section.innerHTML = `
    <div class="section-heading">
      <div>
        <p class="eyebrow">BLOQUE A / A2 ELEMENTAL</p>
        <h2>Gana autonomia<br><em>en situaciones reales.</em></h2>
      </div>
      <p>Diez capitulos para hablar del pasado, hacer planes, comparar, pedir ayuda y desenvolverte viajando, comprando o cuidando tu salud.</p>
    </div>
    <div class="a2-shell">
      <aside class="a2-sidebar">
        <h3>Capitulos A2</h3>
        <div class="a2-chapters" id="a2Chapters"></div>
      </aside>
      <article class="a2-panel">
        <div class="a2-topline"><span id="a2Label">A2 · CAPITULO 01</span><span id="a2Progress">0% A2</span></div>
        <h2 id="a2Title"></h2>
        <p class="a2-objective" id="a2Objective"></p>
        <div class="a2-grid">
          <div class="a2-card"><h4>TEORIA</h4><p id="a2Theory"></p></div>
          <div class="a2-card"><h4>ESTRUCTURA</h4><ul id="a2Structure"></ul></div>
          <div class="a2-card"><h4>VOCABULARIO</h4><ul id="a2Vocab"></ul></div>
          <div class="a2-card"><h4>PRACTICA</h4><p id="a2Practice"></p></div>
        </div>
        <div class="a2-card" style="margin-top:14px"><h4>ESCUCHA Y REPITE</h4><div class="a2-phrase-list" id="a2Phrases"></div></div>
        <div class="a2-card" style="margin-top:14px"><h4>MINI TEST</h4><div class="a2-test" id="a2Test"></div><div class="a2-result" id="a2Result"></div><div class="a2-actions"><button class="a2-primary" id="a2Check" type="button">Comprobar</button><button class="a2-secondary" id="a2Complete" type="button">Marcar capitulo completado</button><button class="a2-secondary" id="a2Next" type="button">Siguiente capitulo</button></div></div>
      </article>
    </div>
  `;
  anchor.after(section);

  const storeKey = 'stannetA2DeepProgress';
  const state = JSON.parse(localStorage.getItem(storeKey) || '{"current":0,"done":{}}');
  const save = () => localStorage.setItem(storeKey, JSON.stringify(state));
  let current = Math.min(Number(state.current || 0), lessons.length - 1);
  let selected = null;

  const speak = (text, button) => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      const voice = new SpeechSynthesisUtterance(text);
      voice.lang = 'en-US';
      voice.rate = .86;
      speechSynthesis.speak(voice);
      button.textContent = 'Repetir audio';
    }
  };

  const render = () => {
    const lesson = lessons[current];
    selected = null;
    state.current = current;
    save();
    const doneCount = Object.values(state.done).filter(Boolean).length;
    document.querySelector('#a2Progress').textContent = `${Math.round((doneCount / lessons.length) * 100)}% A2`;
    document.querySelector('#a2Label').textContent = `A2 · CAPITULO ${String(current + 1).padStart(2, '0')}`;
    document.querySelector('#a2Title').textContent = lesson.title;
    document.querySelector('#a2Objective').textContent = lesson.objective;
    document.querySelector('#a2Theory').textContent = lesson.theory;
    document.querySelector('#a2Practice').textContent = lesson.practice;
    document.querySelector('#a2Structure').innerHTML = lesson.structure.map((item) => `<li>${item}</li>`).join('');
    document.querySelector('#a2Vocab').innerHTML = lesson.vocab.map((item) => `<li>${item}</li>`).join('');
    document.querySelector('#a2Phrases').innerHTML = lesson.phrases.map(([en, es], index) => `<div class="a2-phrase"><div><strong>${en}</strong><span>${es}</span></div><button class="a2-audio" data-audio="${index}" type="button">Escuchar</button></div>`).join('');
    document.querySelector('#a2Test').innerHTML = `<p>${lesson.test.question}</p>${lesson.test.options.map((option, index) => `<button class="a2-option" data-option="${index}" type="button">${option}</button>`).join('')}`;
    document.querySelector('#a2Result').textContent = 'Elige una respuesta y comprueba.';
    document.querySelector('#a2Chapters').innerHTML = lessons.map((item, index) => `<button class="a2-chapter${index === current ? ' active' : ''}${state.done[item.id] ? ' done' : ''}" data-chapter="${index}" type="button">${String(index + 1).padStart(2, '0')} · ${item.title}</button>`).join('');
    document.querySelector('#a2Complete').textContent = state.done[lesson.id] ? 'Capitulo completado' : 'Marcar capitulo completado';

    document.querySelectorAll('.a2-chapter').forEach((button) => button.addEventListener('click', () => {
      current = Number(button.dataset.chapter);
      render();
    }));
    document.querySelectorAll('.a2-audio').forEach((button) => button.addEventListener('click', () => speak(lesson.phrases[Number(button.dataset.audio)][0], button)));
    document.querySelectorAll('.a2-option').forEach((button) => button.addEventListener('click', () => {
      selected = Number(button.dataset.option);
      document.querySelectorAll('.a2-option').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
    }));
  };

  document.querySelector('#a2Check').addEventListener('click', () => {
    const lesson = lessons[current];
    const result = document.querySelector('#a2Result');
    if (selected === null) {
      result.textContent = 'Selecciona una respuesta primero.';
      return;
    }
    result.innerHTML = selected === lesson.test.answer ? '<strong>Correcto.</strong> Puedes marcar el capitulo como completado.' : `<strong>Revisa la teoria.</strong> La respuesta correcta es: ${lesson.test.options[lesson.test.answer]}`;
  });

  document.querySelector('#a2Complete').addEventListener('click', () => {
    state.done[lessons[current].id] = true;
    save();
    render();
  });

  document.querySelector('#a2Next').addEventListener('click', () => {
    current = (current + 1) % lessons.length;
    render();
  });

  render();
});
