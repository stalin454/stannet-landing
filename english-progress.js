document.addEventListener('DOMContentLoaded', () => {
  window.setTimeout(() => {
  const STORAGE_KEY = 'stannetEnglishAcademyProgress';
  const levelSelect = document.querySelector('#academyLevel');
  const lessonList = document.querySelector('#academyItems');
  const lessonPanel = document.querySelector('.academy-lesson');
  const label = document.querySelector('#academyLabel');
  const progressText = document.querySelector('#academyProgress');

  if (!levelSelect || !lessonList || !lessonPanel || !label) return;

  const defaultState = {
    currentLevel: levelSelect.value || 'A1',
    currentLesson: '',
    completed: {},
    updatedAt: ''
  };

  const loadState = () => {
    try {
      return { ...defaultState, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
    } catch (error) {
      return { ...defaultState };
    }
  };

  let state = loadState();

  const saveState = () => {
    state.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  };

  const getCurrentKey = () => {
    const lessonCode = (label.textContent || '').match(/LECCION\s+(\d+)/i);
    return `${levelSelect.value}-${lessonCode ? lessonCode[1] : '01'}`;
  };

  const getLessonKeys = () => Array.from(lessonList.querySelectorAll('.academy-item')).map((button, index) => {
    const code = (button.textContent || '').match(/(\d+)/);
    return `${levelSelect.value}-${code ? code[1] : String(index + 1).padStart(2, '0')}`;
  });

  const buildPanel = () => {
    const panel = document.createElement('div');
    panel.className = 'academy-progress-panel';
    panel.innerHTML = `
      <div class="academy-progress-head">
        <span>PROGRESO DEL NIVEL</span>
        <span id="academyProgressPercent">0%</span>
      </div>
      <div class="academy-progress-track" aria-hidden="true">
        <div class="academy-progress-fill" id="academyProgressFill"></div>
      </div>
      <div class="academy-progress-actions">
        <button id="academyResume" type="button">Continuar donde quede</button>
        <button id="academyResetProgress" type="button">Reiniciar nivel</button>
      </div>
      <div class="academy-resume-note" id="academyResumeNote">Tu avance se guarda en este dispositivo.</div>
    `;
    document.querySelector('.academy-index')?.prepend(panel);

    const completeButton = document.createElement('button');
    completeButton.className = 'academy-complete-lesson';
    completeButton.id = 'academyCompleteLesson';
    completeButton.type = 'button';
    completeButton.textContent = 'Marcar leccion completada';
    lessonPanel.append(completeButton);
  };

  const updateProgress = () => {
    const keys = getLessonKeys();
    const completedInLevel = keys.filter((key) => state.completed[key]).length;
    const percent = keys.length ? Math.round((completedInLevel / keys.length) * 100) : 0;
    const fill = document.querySelector('#academyProgressFill');
    const percentLabel = document.querySelector('#academyProgressPercent');
    const note = document.querySelector('#academyResumeNote');
    const completeButton = document.querySelector('#academyCompleteLesson');
    const currentKey = getCurrentKey();

    if (fill) fill.style.width = `${percent}%`;
    if (percentLabel) percentLabel.textContent = `${percent}%`;
    if (progressText) progressText.textContent = `${progressText.textContent.split(' · ')[0]} · ${percent}% completado`;
    if (note) note.textContent = state.updatedAt ? 'Ultimo avance guardado en este dispositivo.' : 'Tu avance se guarda en este dispositivo.';
    if (completeButton) completeButton.textContent = state.completed[currentKey] ? 'Leccion completada' : 'Marcar leccion completada';

    lessonList.querySelectorAll('.academy-item').forEach((button, index) => {
      button.classList.toggle('is-complete', Boolean(state.completed[keys[index]]));
    });
  };

  const rememberLocation = () => {
    state.currentLevel = levelSelect.value;
    state.currentLesson = getCurrentKey();
    saveState();
    updateProgress();
  };

  buildPanel();

  lessonList.addEventListener('click', () => {
    window.setTimeout(rememberLocation, 0);
  });

  levelSelect.addEventListener('change', () => {
    window.setTimeout(rememberLocation, 0);
  });

  document.querySelector('#academyCompleteLesson')?.addEventListener('click', () => {
    state.completed[getCurrentKey()] = true;
    rememberLocation();
  });

  document.querySelector('#academyResetProgress')?.addEventListener('click', () => {
    getLessonKeys().forEach((key) => {
      delete state.completed[key];
    });
    rememberLocation();
  });

  document.querySelector('#academyResume')?.addEventListener('click', () => {
    if (!state.currentLesson) return;
    const [storedLevel, storedLesson] = state.currentLesson.split('-');
    if (storedLevel && levelSelect.value !== storedLevel) {
      levelSelect.value = storedLevel;
      levelSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    window.setTimeout(() => {
      const target = Array.from(lessonList.querySelectorAll('.academy-item')).find((button) => {
        const code = (button.textContent || '').match(/(\d+)/);
        return code && code[1] === storedLesson;
      });
      target?.click();
    }, 0);
  });

  if (state.currentLevel && state.currentLevel !== levelSelect.value) {
    levelSelect.value = state.currentLevel;
    levelSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  rememberLocation();
  }, 0);
});
