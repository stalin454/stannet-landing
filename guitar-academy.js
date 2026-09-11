document.addEventListener('DOMContentLoaded', () => {
  const data = window.StanNetGuitarData;
  const $ = (selector) => document.querySelector(selector);
  const rootSelect = $('#guitarRoot');
  const scaleSelect = $('#guitarScale');
  const modeSelect = $('#guitarMode');
  const viewButtons = document.querySelectorAll('[data-view]');
  const fretboard = $('#fretboard');
  const fretNumbers = $('#fretNumbers');
  const staff = $('#staff');
  const tab = $('#tab');
  const notesOut = $('#scaleNotes');
  const formulaOut = $('#scaleFormula');
  const intervalsOut = $('#scaleIntervals');
  const characterOut = $('#scaleCharacter');
  const titleOut = $('#scaleTitle');
  const chordRoot = $('#chordRoot');
  const chordType = $('#chordType');
  const chordName = $('#chordName');
  const chordNotes = $('#chordNotes');
  const chordFormula = $('#chordFormula');
  const chordDegrees = $('#chordDegrees');
  const chordQuality = $('#chordQuality');
  const chordDiagram = $('#chordDiagram');
  const harmonyRoot = $('#harmonyRoot');
  const harmonyMode = $('#harmonyMode');
  const progressionSelect = $('#progressionSelect');
  const harmonyTitle = $('#harmonyTitle');
  const harmonyCircle = $('#harmonyCircle');
  const progressionName = $('#progressionName');
  const progressionFeel = $('#progressionFeel');
  const progressionStrip = $('#progressionStrip');
  const functionList = $('#functionList');
  const harmonyExplain = $('#harmonyExplain');
  const exerciseRoot = $('#exerciseRoot');
  const exercisePattern = $('#exercisePattern');
  const exerciseTechnique = $('#exerciseTechnique');
  const exerciseLevel = $('#exerciseLevel');
  const exerciseBpm = $('#exerciseBpm');
  const bpmValue = $('#bpmValue');
  const exerciseTitle = $('#exerciseTitle');
  const exerciseTechniqueOut = $('#exerciseTechniqueOut');
  const exerciseLevelOut = $('#exerciseLevelOut');
  const exerciseBpmOut = $('#exerciseBpmOut');
  const exerciseFingers = $('#exerciseFingers');
  const exerciseNotes = $('#exerciseNotes');
  const exerciseTab = $('#exerciseTab');
  const exerciseRoutine = $('#exerciseRoutine');
  const exerciseExplain = $('#exerciseExplain');
  let activeView = 'both';
  let currentExercise = [];

  const noteIndex = (note) => data.chromatic.indexOf(note);
  const noteAt = (root, semitones) => data.chromatic[(noteIndex(root) + semitones) % 12];
  const getPattern = () => modeSelect.value !== 'none' ? data.modes[modeSelect.value] : data.scales[scaleSelect.value];
  const getName = () => modeSelect.value !== 'none' ? data.modes[modeSelect.value].name : data.scales[scaleSelect.value].name;
  const getNotes = () => {
    const pattern = getPattern();
    return pattern.intervals.map((interval, index) => ({
      note: noteAt(rootSelect.value, interval),
      degree: pattern.degrees[index],
      interval
    }));
  };
  const noteFrequency = (note, octave = 4) => {
    const midi = (octave + 1) * 12 + noteIndex(note);
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const fillSelectors = () => {
    rootSelect.innerHTML = data.roots.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    rootSelect.value = 'A';
    chordRoot.innerHTML = data.roots.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    chordRoot.value = 'A';
    harmonyRoot.innerHTML = data.roots.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    harmonyRoot.value = 'A';
    exerciseRoot.innerHTML = data.roots.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
    exerciseRoot.value = 'A';
    const grouped = Object.entries(data.scales).reduce((acc, [key, scale]) => {
      acc[scale.category] = acc[scale.category] || [];
      acc[scale.category].push([key, scale.name]);
      return acc;
    }, {});
    scaleSelect.innerHTML = Object.entries(grouped).map(([category, scales]) => `<optgroup label="${category}">${scales.map(([key, name]) => `<option value="${key}">${name}</option>`).join('')}</optgroup>`).join('');
    scaleSelect.value = 'naturalMinor';
    modeSelect.innerHTML = '<option value="none">Usar selector de escala</option>' + Object.entries(data.modes).map(([key, mode]) => `<option value="${key}">${mode.name}</option>`).join('');
    chordType.innerHTML = Object.entries(data.chordTypes).map(([key, chord]) => `<option value="${key}">${chord.name}</option>`).join('');
    chordType.value = 'minor';
    exercisePattern.innerHTML = '<optgroup label="Escalas">' + Object.entries(data.scales).map(([key, scale]) => `<option value="scale:${key}">${scale.name}</option>`).join('') + '</optgroup><optgroup label="Modos griegos">' + Object.entries(data.modes).map(([key, mode]) => `<option value="mode:${key}">${mode.name}</option>`).join('') + '</optgroup>';
    exercisePattern.value = 'scale:naturalMinor';
    exerciseTechnique.innerHTML = Object.entries(data.exerciseTechniques).map(([key, item]) => `<option value="${key}">${item.name}</option>`).join('');
    exerciseLevel.innerHTML = Object.entries(data.exerciseLevels).map(([key, item]) => `<option value="${key}">${item.name}</option>`).join('');
    exerciseLevel.value = 'intermediate';
  };

  const renderNotes = (notes) => {
    notesOut.innerHTML = notes.map((item) => `<span class="note-pill"><b>${item.note}</b><small>${item.degree}</small></span>`).join('');
  };

  const renderFretboard = (notes) => {
    const noteMap = new Map(notes.map((item) => [item.note, item]));
    fretboard.innerHTML = data.tuning.map((string) => {
      const cells = Array.from({ length: 13 }, (_, fret) => {
        const note = noteAt(string.note, fret);
        const item = noteMap.get(note);
        const label = !item ? '' : activeView === 'notes' ? item.note : activeView === 'degrees' ? item.degree : `${item.note}<small>${item.degree}</small>`;
        return `<div class="fret-cell">${item ? `<span class="marker${item.degree === '1' ? ' root' : ''}">${label}</span>` : ''}</div>`;
      }).join('');
      return `<div class="fret-row"><span class="string-name">${string.note}${string.string}</span>${cells}</div>`;
    }).join('');
    fretNumbers.innerHTML = '<span></span>' + Array.from({ length: 13 }, (_, fret) => `<span>${fret}</span>`).join('');
  };

  const renderStaff = (notes) => {
    const lines = [56, 72, 88, 104, 120];
    const base = ['E', 'F', 'G', 'A', 'B', 'C', 'D'];
    const yFor = (note, index) => {
      const simple = note.replace('#', '');
      const step = base.indexOf(simple);
      return 126 - ((step < 0 ? 0 : step) + index) * 7;
    };
    const staffLines = lines.map((y) => `<line x1="42" y1="${y}" x2="650" y2="${y}" />`).join('');
    const noteHeads = notes.map((item, index) => {
      const x = 78 + index * 76;
      const y = yFor(item.note, index);
      const accidental = item.note.includes('#') ? `<text x="${x - 25}" y="${y + 5}" class="accidental">#</text>` : '';
      return `<g><ellipse cx="${x}" cy="${y}" rx="12" ry="8" class="${item.degree === '1' ? 'root-note' : ''}" /><line x1="${x + 11}" y1="${y}" x2="${x + 11}" y2="${y - 46}" />${accidental}<text x="${x}" y="160">${item.note}</text></g>`;
    }).join('');
    staff.innerHTML = `<svg class="staff-svg" viewBox="0 0 690 185" role="img" aria-label="Pentagrama de la escala"><style>line{stroke:rgba(255,255,255,.42);stroke-width:1}.staff-svg ellipse{fill:#d8d0bf;stroke:#f5c76b}.staff-svg .root-note{fill:#f5c76b}.staff-svg text{fill:#c9c1b2;font:10px DM Mono,monospace;text-anchor:middle}.staff-svg .accidental{fill:#72f6c7;font-size:20px}</style>${staffLines}<text x="18" y="93" style="font-size:42px;fill:#f5c76b">𝄞</text>${noteHeads}</svg>`;
  };

  const renderTab = (notes) => {
    const preferred = [
      { note: rootSelect.value, string: 6, start: 0 },
      { note: rootSelect.value, string: 5, start: 0 },
      { note: rootSelect.value, string: 4, start: 0 }
    ];
    const findPosition = (note, fromFret = 0) => {
      const positions = [];
      data.tuning.forEach((string) => {
        for (let fret = 0; fret <= 12; fret += 1) {
          if (noteAt(string.note, fret) === note) positions.push({ string: string.string, fret });
        }
      });
      return positions.sort((a, b) => Math.abs(a.fret - fromFret) - Math.abs(b.fret - fromFret))[0];
    };
    const positions = notes.map((item, index) => findPosition(item.note, preferred[index]?.start || 5));
    tab.innerHTML = data.tuning.slice().reverse().map((string) => {
      const chunks = positions.map((position) => position.string === string.string ? String(position.fret).padStart(2, '-') : '--');
      return `${string.note}|-${chunks.join('-')}-|`;
    }).join('\n');
  };

  const render = () => {
    const pattern = getPattern();
    const notes = getNotes();
    const rootLabel = data.noteLabels[rootSelect.value];
    titleOut.textContent = `${rootLabel} ${getName()}`;
    formulaOut.textContent = pattern.formula;
    intervalsOut.textContent = pattern.intervals.join(' · ') + ' semitonos';
    characterOut.textContent = pattern.character;
    renderNotes(notes);
    renderFretboard(notes);
    renderStaff(notes);
    renderTab(notes);
  };

  const playScale = () => {
    const notes = getNotes();
    const context = new (window.AudioContext || window.webkitAudioContext)();
    notes.concat(notes.slice().reverse().slice(1)).forEach((item, index) => {
      const start = context.currentTime + index * 0.42;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'triangle';
      osc.frequency.value = noteFrequency(item.note, index > notes.length - 1 ? 4 : 3);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.28, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.36);
      osc.connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  };

  const getChordNotes = () => {
    const chord = data.chordTypes[chordType.value];
    return chord.intervals.map((interval, index) => ({
      note: noteAt(chordRoot.value, interval % 12),
      degree: chord.degrees[index],
      interval
    }));
  };

  const rootFretOnString = (stringNote, root) => {
    for (let fret = 0; fret <= 12; fret += 1) {
      if (noteAt(stringNote, fret) === root) return fret;
    }
    return 0;
  };

  const getChordShape = () => {
    const type = chordType.value;
    const string6Fret = rootFretOnString('E', chordRoot.value);
    const string5Fret = rootFretOnString('A', chordRoot.value);
    const family = string6Fret <= 7 && data.chordShapes.string6[type] ? 'string6' : 'string5';
    const shape = data.chordShapes[family][type] || data.chordShapes.string5.major;
    const offset = family === 'string6' ? string6Fret : string5Fret;
    const frets = shape.base.map((fret) => fret === null ? null : fret + offset);
    const minFret = Math.min(...frets.filter((fret) => fret && fret > 0));
    const displayStart = minFret > 4 ? minFret : 1;
    return { family, shape, frets, displayStart };
  };

  const renderChordDiagram = (notes) => {
    const { shape, frets, displayStart } = getChordShape();
    const noteSet = new Set(notes.map((item) => item.note));
    const degreeByNote = new Map(notes.map((item) => [item.note, item.degree]));
    const headers = data.tuning.map((string, index) => {
      if (shape.muted.includes(string.string) || frets[index] === null) return `<span class="chord-muted">x</span>`;
      if (frets[index] === 0) return `<span class="chord-open">o</span>`;
      return '<span></span>';
    }).join('');
    const cells = [];
    for (let row = 0; row < 5; row += 1) {
      cells.push(`<span class="chord-fret-label">${displayStart + row}</span>`);
      data.tuning.forEach((string, index) => {
        const fret = frets[index];
        const currentFret = displayStart + row;
        const note = fret === null ? null : noteAt(string.note, fret);
        const isRoot = note === chordRoot.value;
        const dot = fret === currentFret && noteSet.has(note) ? `<span class="chord-dot${isRoot ? ' root' : ''}">${degreeByNote.get(note)}</span>` : '';
        cells.push(`<span class="chord-cell${displayStart === 1 && row === 0 ? ' nut' : ''}">${dot}</span>`);
      });
    }
    const fingers = shape.fingers.map((finger) => `<span class="chord-string-label">${finger}</span>`).join('');
    chordDiagram.innerHTML = `<div class="chord-grid"><span></span>${headers}${cells.join('')}<span></span>${fingers}</div>`;
  };

  const renderChord = () => {
    const chord = data.chordTypes[chordType.value];
    const notes = getChordNotes();
    const label = data.noteLabels[chordRoot.value];
    chordName.textContent = `${label}${chord.symbol}`;
    chordFormula.textContent = chord.formula;
    chordDegrees.textContent = chord.degrees.join(' · ');
    chordQuality.textContent = chord.quality;
    chordNotes.innerHTML = notes.map((item) => `<span class="note-pill"><b>${item.note}</b><small>${item.degree}</small></span>`).join('');
    renderChordDiagram(notes);
  };

  const playChord = (arpeggio = false) => {
    const notes = getChordNotes();
    const context = new (window.AudioContext || window.webkitAudioContext)();
    notes.forEach((item, index) => {
      const start = context.currentTime + (arpeggio ? index * 0.26 : 0);
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'triangle';
      osc.frequency.value = noteFrequency(item.note, 3 + Math.floor(index / 3));
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(arpeggio ? 0.24 : 0.18, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + (arpeggio ? 0.72 : 1.25));
      osc.connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + (arpeggio ? 0.78 : 1.3));
    });
  };

  const getHarmonyChords = () => {
    const harmony = data.harmony[harmonyMode.value];
    const scale = data.scales[harmony.scale];
    const offsets = harmony.offsets || scale.intervals;
    return harmony.degrees.map((degree, index) => {
      const root = noteAt(harmonyRoot.value, offsets[index]);
      const type = harmony.qualities[index];
      const chord = data.chordTypes[type] || data.chordTypes.major;
      const notes = chord.intervals.map((interval, noteOrder) => ({
        note: noteAt(root, interval % 12),
        degree: chord.degrees[noteOrder]
      }));
      return {
        degree,
        root,
        type,
        symbol: `${root}${chord.symbol}`,
        name: `${data.noteLabels[root]}${chord.symbol}`,
        functionName: harmony.functions[index],
        notes
      };
    });
  };

  const activeProgressions = () => data.progressions.filter((item) => item.mode === harmonyMode.value);

  const renderProgressionChoices = (reset = false) => {
    const selected = reset ? '0' : progressionSelect.value;
    progressionSelect.innerHTML = activeProgressions().map((item, index) => `<option value="${index}">${item.name} · ${item.degrees.join(' - ')}</option>`).join('');
    progressionSelect.value = selected || '0';
  };

  const renderHarmony = (resetProgression = false) => {
    renderProgressionChoices(resetProgression);
    const harmony = data.harmony[harmonyMode.value];
    const chords = getHarmonyChords();
    const progression = activeProgressions()[Number(progressionSelect.value || 0)] || activeProgressions()[0];
    const rootLabel = data.noteLabels[harmonyRoot.value];
    const byDegree = new Map(chords.map((chord) => [chord.degree, chord]));
    harmonyTitle.textContent = `${rootLabel} ${harmony.name}`;
    progressionName.textContent = `${progression.name} · ${progression.style}`;
    progressionFeel.textContent = progression.feel;
    harmonyExplain.textContent = harmony.explanation;
    harmonyCircle.innerHTML = chords.map((chord, index) => {
      const angle = -90 + (index * 360 / chords.length);
      const radius = 38;
      const x = 50 + Math.cos(angle * Math.PI / 180) * radius;
      const y = 50 + Math.sin(angle * Math.PI / 180) * radius;
      return `<button class="degree-node${index === 0 ? ' tonic' : ''}" type="button" data-chord-root="${chord.root}" data-chord-type="${chord.type}" style="left:${x}%;top:${y}%"><b>${chord.degree}</b><span>${chord.name}</span><small>${chord.functionName}</small></button>`;
    }).join('');
    progressionStrip.innerHTML = progression.degrees.map((degree) => {
      const chord = byDegree.get(degree);
      return `<span class="progression-step"><b>${chord.name}</b><small>${degree} · ${chord.notes.map((item) => item.note).join('-')}</small></span>`;
    }).join('');
    functionList.innerHTML = chords.map((chord) => `<div class="function-item"><b>${chord.degree} · ${chord.name}</b> ${chord.functionName}. Notas: ${chord.notes.map((item) => item.note).join(' - ')}.</div>`).join('');
    harmonyCircle.querySelectorAll('.degree-node').forEach((button) => button.addEventListener('click', () => {
      chordRoot.value = button.dataset.chordRoot;
      chordType.value = button.dataset.chordType;
      renderChord();
      document.querySelector('#chord-lab').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  };

  const playProgression = () => {
    const chords = getHarmonyChords();
    const progression = activeProgressions()[Number(progressionSelect.value || 0)] || activeProgressions()[0];
    const byDegree = new Map(chords.map((chord) => [chord.degree, chord]));
    const context = new (window.AudioContext || window.webkitAudioContext)();
    progression.degrees.forEach((degree, chordIndex) => {
      const chord = byDegree.get(degree);
      chord.notes.forEach((item, noteOrder) => {
        const start = context.currentTime + chordIndex * 1.08 + noteOrder * 0.025;
        const osc = context.createOscillator();
        const gain = context.createGain();
        osc.type = 'triangle';
        osc.frequency.value = noteFrequency(item.note, 3 + Math.floor(noteOrder / 3));
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.16, start + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.95);
        osc.connect(gain).connect(context.destination);
        osc.start(start);
        osc.stop(start + 1);
      });
    });
  };

  const getExercisePattern = () => {
    const [kind, key] = exercisePattern.value.split(':');
    return kind === 'mode' ? data.modes[key] : data.scales[key];
  };

  const findPlayablePosition = (note, targetFret = 5) => {
    const positions = [];
    data.tuning.forEach((string) => {
      for (let fret = 0; fret <= 12; fret += 1) {
        if (noteAt(string.note, fret) === note) positions.push({ string: string.string, stringNote: string.note, fret });
      }
    });
    return positions.sort((a, b) => Math.abs(a.fret - targetFret) - Math.abs(b.fret - targetFret))[0];
  };

  const makeExerciseSequence = () => {
    const pattern = getExercisePattern();
    const level = data.exerciseLevels[exerciseLevel.value];
    const scaleNotes = pattern.intervals.map((interval, index) => ({
      note: noteAt(exerciseRoot.value, interval),
      degree: pattern.degrees[index],
      interval
    }));
    const span = Math.min(level.span, scaleNotes.length + 2);
    const up = Array.from({ length: span }, (_, index) => scaleNotes[index % scaleNotes.length]);
    const down = up.slice().reverse().slice(1);
    const technique = exerciseTechnique.value;
    if (technique === 'arpeggios') return [scaleNotes[0], scaleNotes[2] || scaleNotes[0], scaleNotes[4] || scaleNotes[0], scaleNotes[6] || scaleNotes[2], scaleNotes[4] || scaleNotes[0], scaleNotes[2] || scaleNotes[0]];
    if (technique === 'sweepPicking') return [scaleNotes[0], scaleNotes[2] || scaleNotes[0], scaleNotes[4] || scaleNotes[0], scaleNotes[6] || scaleNotes[4], scaleNotes[0], scaleNotes[6] || scaleNotes[4], scaleNotes[4] || scaleNotes[0], scaleNotes[2] || scaleNotes[0], scaleNotes[0]];
    if (technique === 'stringSkipping') return [scaleNotes[0], scaleNotes[2], scaleNotes[4], scaleNotes[1], scaleNotes[3], scaleNotes[5]].filter(Boolean);
    if (technique === 'sequences') return [scaleNotes[0], scaleNotes[1], scaleNotes[2], scaleNotes[1], scaleNotes[2], scaleNotes[3], scaleNotes[2], scaleNotes[3], scaleNotes[4]].filter(Boolean);
    if (technique === 'legato') return up.concat(down).slice(0, span + 3);
    if (technique === 'slides') return [scaleNotes[0], scaleNotes[1], scaleNotes[3], scaleNotes[4], scaleNotes[2], scaleNotes[5], scaleNotes[4]].filter(Boolean);
    if (technique === 'improvisation') return [scaleNotes[0], scaleNotes[2], scaleNotes[1], scaleNotes[4], scaleNotes[3], scaleNotes[2], scaleNotes[0]].filter(Boolean);
    return up.concat(down);
  };

  const tabFromExercise = (items) => {
    const positions = items.map((item, index) => ({ ...item, position: findPlayablePosition(item.note, 3 + (index % 5)) }));
    return data.tuning.slice().reverse().map((string) => {
      const chunks = positions.map((item) => item.position.string === string.string ? String(item.position.fret).padStart(2, '-') : '--');
      return `${string.note}|-${chunks.join('-')}-|`;
    }).join('\n');
  };

  const renderExercise = () => {
    const pattern = getExercisePattern();
    const technique = data.exerciseTechniques[exerciseTechnique.value];
    const level = data.exerciseLevels[exerciseLevel.value];
    const rootLabel = data.noteLabels[exerciseRoot.value];
    currentExercise = makeExerciseSequence();
    exerciseTitle.textContent = `${technique.name} en ${rootLabel}`;
    exerciseTechniqueOut.textContent = technique.name;
    exerciseLevelOut.textContent = level.name;
    exerciseBpmOut.textContent = exerciseBpm.value;
    exerciseFingers.textContent = exerciseTechnique.value === 'sweepPicking' ? '1-2-4 / barrido' : exerciseLevel.value === 'beginner' ? '1-2-3-4' : exerciseLevel.value === 'intermediate' ? '1-2-4 / cambios' : '1-2-3-4 / desplazamientos';
    exerciseNotes.innerHTML = currentExercise.map((item, index) => `<span class="note-pill"><b>${item.note}</b><small>${index + 1} · ${item.degree}</small></span>`).join('');
    exerciseTab.textContent = tabFromExercise(currentExercise);
    exerciseRoutine.innerHTML = [
      `Toca una vuelta a ${exerciseBpm.value} BPM con sonido limpio.`,
      `Di en voz alta los grados: ${currentExercise.map((item) => item.degree).join(' - ')}.`,
      'Repite cuatro veces, descansa diez segundos y sube 5 BPM solo si no hay tension.',
      exerciseTechnique.value === 'sweepPicking' ? 'En sweep picking, deja que la pua caiga como un solo movimiento y separa cada nota con la mano izquierda.' : 'Termina improvisando una frase corta que resuelva en la tonica.'
    ].map((item) => `<li>${item}</li>`).join('');
    exerciseExplain.textContent = `${technique.focus} Material original construido desde la formula ${pattern.formula}. ${level.explanation}`;
  };

  const playExercise = () => {
    if (!currentExercise.length) renderExercise();
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const beat = 60 / Number(exerciseBpm.value);
    currentExercise.forEach((item, index) => {
      const start = context.currentTime + index * beat;
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = exerciseTechnique.value === 'legato' ? 'sine' : 'triangle';
      osc.frequency.value = noteFrequency(item.note, 3 + Math.floor(index / 6));
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + beat * 0.82);
      osc.connect(gain).connect(context.destination);
      osc.start(start);
      osc.stop(start + beat * 0.86);
    });
  };

  fillSelectors();
  [rootSelect, scaleSelect, modeSelect].forEach((select) => select.addEventListener('change', render));
  [chordRoot, chordType].forEach((select) => select.addEventListener('change', renderChord));
  [harmonyRoot, harmonyMode].forEach((select) => select.addEventListener('change', () => {
    renderHarmony(true);
  }));
  progressionSelect.addEventListener('change', renderHarmony);
  [exerciseRoot, exercisePattern, exerciseTechnique, exerciseLevel].forEach((select) => select.addEventListener('change', renderExercise));
  exerciseBpm.addEventListener('input', () => {
    bpmValue.textContent = exerciseBpm.value;
    renderExercise();
  });
  viewButtons.forEach((button) => button.addEventListener('click', () => {
    activeView = button.dataset.view;
    viewButtons.forEach((item) => item.classList.toggle('active', item === button));
    render();
  }));
  $('#listenScale').addEventListener('click', playScale);
  $('#listenChord').addEventListener('click', () => playChord(false));
  $('#arpeggiateChord').addEventListener('click', () => playChord(true));
  $('#listenProgression').addEventListener('click', playProgression);
  $('#generateExercise').addEventListener('click', renderExercise);
  $('#listenExercise').addEventListener('click', playExercise);
  $('#compareChordScale').addEventListener('click', () => {
    rootSelect.value = chordRoot.value;
    modeSelect.value = 'none';
    render();
    document.querySelector('#guitar-lab').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  render();
  renderChord();
  renderHarmony();
  renderExercise();
});
