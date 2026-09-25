/* StanNet Danish Academy UI and interactions. */
document.addEventListener('DOMContentLoaded', () => {
  const data = window.stannetDanishData;
  if (!data) return;

  const playDanish = async (text, options = {}) => {
    const { button, feedback, loadingText = 'Generando voz danesa natural...' } = options;
    const original = button?.textContent || '';

    if (button) {
      button.classList.add('loading');
      button.textContent = loadingText;
    }
    if (feedback) feedback.textContent = loadingText;

    try {
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, lang: 'da-DK' })
      });
      if (!response.ok) throw new Error('speech');

      const url = URL.createObjectURL(await response.blob());
      const audio = new Audio(url);
      audio.onended = () => URL.revokeObjectURL(url);
      await audio.play();

      if (feedback) feedback.textContent = 'Escucha el ritmo y repite la frase completa en voz alta.';
      return true;
    } catch {
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const speech = new SpeechSynthesisUtterance(text);
        speech.lang = 'da-DK';
        speech.rate = .86;
        speechSynthesis.speak(speech);
        if (feedback) feedback.textContent = 'Usando la voz de respaldo del navegador.';
        return true;
      }
      if (feedback) feedback.textContent = 'No se pudo reproducir la voz en este momento.';
      return false;
    } finally {
      if (button) {
        button.classList.remove('loading');
        button.textContent = original;
      }
    }
  };

  const setupMastery = () => {
    const level = document.querySelector('#masteryLevel');
    const list = document.querySelector('#masteryItems');
    const label = document.querySelector('#masteryLabel');
    const title = document.querySelector('#masteryTitle');
    const goal = document.querySelector('#masteryGoal');
    const task = document.querySelector('#masteryTask');
    const progress = document.querySelector('#masteryProgress');
    if (!level || !list || !label || !title || !goal || !task || !progress) return;

    let activeLevel = 'B1';
    let activeIndex = 0;

    const render = () => {
      const lessons = data.mastery[activeLevel];
      const item = lessons[activeIndex];
      label.textContent = `${activeLevel} · LECCION ${item[0]}`;
      title.textContent = item[1];
      goal.textContent = item[2];
      task.innerHTML = `<strong>${item[3][0]}</strong>${item[3][1]}`;
      progress.textContent = `${activeIndex + 1} de ${lessons.length} lecciones · ${activeLevel}`;
      list.innerHTML = lessons.map((lesson, index) =>
        `<button class="mastery-item${index === activeIndex ? ' active' : ''}" data-mastery-index="${index}" type="button">${lesson[0]} · ${lesson[1]}</button>`
      ).join('');
      list.querySelectorAll('.mastery-item').forEach(button => {
        button.addEventListener('click', () => {
          activeIndex = Number(button.dataset.masteryIndex);
          render();
        });
      });
    };

    level.addEventListener('change', () => {
      activeLevel = level.value;
      activeIndex = 0;
      render();
    });
    render();
  };

  const setupCourse = () => {
    const level = document.querySelector('#courseLevel');
    const itemList = document.querySelector('#courseItems');
    const courseLabel = document.querySelector('#courseLabel');
    const courseTitle = document.querySelector('#courseTitle');
    const courseGoal = document.querySelector('#courseGoal');
    const phraseList = document.querySelector('#coursePhrases');
    const courseProgress = document.querySelector('#courseProgress');
    if (!level || !itemList || !courseLabel || !courseTitle || !courseGoal || !phraseList || !courseProgress) return;

    const renderCourse = (levelValue, index = 0) => {
      const lessons = data.curriculum[levelValue];
      const item = lessons[index];
      courseLabel.textContent = `${levelValue} · LECCION ${item[0]}`;
      courseTitle.textContent = item[1];
      courseGoal.textContent = item[2];
      courseProgress.textContent = `${index + 1} de ${lessons.length} lecciones · ${levelValue}`;
      phraseList.innerHTML = item[3].map(([danish, spanish]) =>
        `<div class="course-phrase"><div><strong>${danish}</strong><span>${spanish}</span></div><button class="course-speak" type="button">Escuchar</button></div>`
      ).join('');

      phraseList.querySelectorAll('.course-speak').forEach((button, phraseIndex) => {
        button.addEventListener('click', () => playDanish(item[3][phraseIndex][0], { button, loadingText: 'Cargando...' }));
      });
      itemList.querySelectorAll('.course-item').forEach((button, itemIndex) => button.classList.toggle('active', itemIndex === index));
    };

    const renderIndex = () => {
      const lessons = data.curriculum[level.value];
      itemList.innerHTML = lessons.map((item, index) =>
        `<button class="course-item${index === 0 ? ' active' : ''}" data-course-index="${index}" type="button">${item[0]} · ${item[1]}</button>`
      ).join('');
      itemList.querySelectorAll('.course-item').forEach(button => {
        button.addEventListener('click', () => renderCourse(level.value, Number(button.dataset.courseIndex)));
      });
      renderCourse(level.value);
    };

    level.addEventListener('change', renderIndex);
    renderIndex();
  };

  const setupMemory = () => {
    const topic = document.querySelector('#memoryTopic');
    const lessonList = document.querySelector('#lessonList');
    const label = document.querySelector('#memoryLabel');
    const title = document.querySelector('#memoryTitle');
    const prompt = document.querySelector('#memoryPrompt');
    const answer = document.querySelector('#memoryAnswer');
    const result = document.querySelector('#memoryResult');
    const progress = document.querySelector('#memoryProgress');
    const check = document.querySelector('#checkMemory');
    const reveal = document.querySelector('#revealMemory');
    const next = document.querySelector('#nextMemory');
    if (!topic || !lessonList || !label || !title || !prompt || !answer || !result || !progress || !check || !reveal || !next) return;

    let items = [];
    let index = 0;
    let correct = Number(localStorage.getItem('danishMemoryCorrect') || 0);
    let attempts = Number(localStorage.getItem('danishMemoryAttempts') || 0);

    const clean = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[¿?¡!.,]/g, '').trim();
    const updateScore = () => { progress.textContent = `${correct} aciertos · ${attempts} intentos`; };
    const selectItem = nextIndex => {
      index = nextIndex;
      prompt.textContent = items[index][0];
      answer.value = '';
      result.textContent = 'Nueva frase preparada. Intenta recordarla antes de mostrar la solución.';
      lessonList.querySelectorAll('.lesson-choice').forEach((choice, i) => choice.classList.toggle('active', i === index));
      answer.focus();
    };

    const voiceButton = document.createElement('button');
    voiceButton.className = 'memory-voice';
    voiceButton.type = 'button';
    voiceButton.textContent = 'Escuchar ejemplo danés →';
    lessonList.before(voiceButton);
    voiceButton.addEventListener('click', () => playDanish(items[index]?.[1] || '', { button: voiceButton, loadingText: 'Generando voz natural...' }));

    const render = () => {
      const lesson = data.memoryLessons[topic.value];
      items = lesson.items;
      index = 0;
      label.textContent = lesson.label;
      title.textContent = lesson.title;
      prompt.textContent = items[0][0];
      answer.value = '';
      result.textContent = 'Escribe sin mirar. Cada intento cuenta.';
      lessonList.innerHTML = items.map((item, i) =>
        `<button class="lesson-choice${i === 0 ? ' active' : ''}" data-memory-index="${i}" type="button">${String(i + 1).padStart(2, '0')} · ${item[0]}</button>`
      ).join('');
      lessonList.querySelectorAll('.lesson-choice').forEach(button => {
        button.addEventListener('click', () => selectItem(Number(button.dataset.memoryIndex)));
      });
      voiceButton.textContent = 'Escuchar ejemplo danés →';
      updateScore();
    };

    check.addEventListener('click', () => {
      const expected = items[index][1];
      attempts += 1;
      if (clean(answer.value) === clean(expected)) {
        correct += 1;
        result.innerHTML = '<strong>Muy bien.</strong> La respuesta es correcta. Ahora leela en voz alta.';
      } else {
        result.innerHTML = '<strong>Seguimos.</strong> Revisa la solución, escríbela otra vez y repítela.';
      }
      localStorage.setItem('danishMemoryCorrect', correct);
      localStorage.setItem('danishMemoryAttempts', attempts);
      updateScore();
    });

    reveal.addEventListener('click', () => {
      result.textContent = `Solución: ${items[index][1]}. Escríbela una vez y después pronúnciala.`;
      answer.focus();
    });
    next.addEventListener('click', () => selectItem((index + 1) % items.length));
    topic.addEventListener('change', render);
    render();
  };

  const setupHeroPractice = () => {
    const phrase = document.querySelector('#danishPhrase');
    const meaning = document.querySelector('#danishMeaning');
    const feedback = document.querySelector('#danishFeedback');
    const listen = document.querySelector('#listenDanish');
    const hint = document.querySelector('#showAnswer');
    const next = document.querySelector('#nextDanish');
    if (!phrase || !meaning || !feedback || !listen || !hint || !next) return;

    let index = 0;
    listen.addEventListener('click', () => playDanish(phrase.textContent, { button: listen, feedback }));
    hint.addEventListener('click', () => {
      feedback.textContent = 'Pista: ' + meaning.textContent + ' Repite ahora la frase en danes.';
    });
    next.addEventListener('click', () => {
      index = (index + 1) % data.danishPhrases.length;
      phrase.textContent = data.danishPhrases[index][0];
      meaning.textContent = data.danishPhrases[index][1];
      feedback.textContent = 'Nueva frase preparada. Escuchala y repitela sin traducir palabra por palabra.';
    });
  };

  setupMastery();
  setupCourse();
  setupMemory();
  setupHeroPractice();
});
