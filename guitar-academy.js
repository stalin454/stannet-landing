document.addEventListener('DOMContentLoaded', () => {
  const data = window.StanNetGuitarData;
  const $ = (selector) => document.querySelector(selector);
  const rootSelect = $('#guitarRoot');
  const scaleSelect = $('#guitarScale');
  const modeSelect = $('#guitarMode');
  const guitarTone = $('#guitarTone');
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
  const studyCategory = $('#studyCategory');
  const studySelect = $('#studySelect');
  const studyBpm = $('#studyBpm');
  const studyBpmValue = $('#studyBpmValue');
  const studyCategoryLabel = $('#studyCategoryLabel');
  const studyTitle = $('#studyTitle');
  const studySource = $('#studySource');
  const studyTab = $('#studyTab');
  const studyNote = $('#studyNote');
  const guitarSongQuery = $('#guitarSongQuery');
  const guitarSongSearch = $('#guitarSongSearch');
  const guitarSongStatus = $('#guitarSongStatus');
  const guitarSongResults = $('#guitarSongResults');
  const guitarSongWorkspace = $('#guitarSongWorkspace');
  const guitarSongPlayer = $('#guitarSongPlayer');
  const guitarSongTitle = $('#guitarSongTitle');
  const guitarSongChannel = $('#guitarSongChannel');
  const songPracticeRoot = $('#songPracticeRoot');
  const songPracticeMode = $('#songPracticeMode');
  const songPracticeProgression = $('#songPracticeProgression');
  const songPracticeLevel = $('#songPracticeLevel');
  const songPracticeBpm = $('#songPracticeBpm');
  const songPracticeBpmValue = $('#songPracticeBpmValue');
  const songPracticeOutput = $('#songPracticeOutput');
  const songPracticeChords = $('#songPracticeChords');
  const songPracticeTab = $('#songPracticeTab');
  const songPracticeSteps = $('#songPracticeSteps');
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

  const makeDriveCurve = (amount = 18) => {
    const samples = 2048;
    const curve = new Float32Array(samples);
    const k = typeof amount === 'number' ? amount : 18;
    for (let i = 0; i < samples; i += 1) {
      const x = i * 2 / samples - 1;
      curve[i] = ((3 + k) * x * 20 * Math.PI / 180) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  };

  const createGuitarBus = (context, tone = 'acoustic') => {
    const input = context.createGain();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 16;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.2;

    if (tone === 'electricDrive') {
      const drive = context.createWaveShaper();
      drive.curve = makeDriveCurve(28);
      drive.oversample = '4x';
      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = 4200;
      lowpass.Q.value = 0.8;
      input.connect(drive).connect(lowpass).connect(compressor).connect(context.destination);
    } else {
      const body = context.createBiquadFilter();
      body.type = 'peaking';
      body.frequency.value = tone === 'acoustic' ? 190 : 1100;
      body.Q.value = tone === 'acoustic' ? 1.2 : 0.8;
      body.gain.value = tone === 'acoustic' ? 5 : 2;
      const lowpass = context.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.value = tone === 'acoustic' ? 6500 : 5200;
      input.connect(body).connect(lowpass).connect(compressor).connect(context.destination);
    }
    return input;
  };

  const pluckGuitarNote = (context, destination, frequency, start, duration = 1.15, velocity = 0.22, tone = 'acoustic') => {
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, start);
    master.gain.exponentialRampToValueAtTime(Math.max(0.03, velocity), start + 0.008);
    master.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    master.connect(destination);

    const fundamental = context.createOscillator();
    fundamental.type = tone === 'acoustic' ? 'triangle' : 'sawtooth';
    fundamental.frequency.setValueAtTime(frequency, start);
    fundamental.detune.setValueAtTime(tone === 'electricDrive' ? -3 : 0, start);
    fundamental.connect(master);
    fundamental.start(start);
    fundamental.stop(start + duration + 0.03);

    const harmonic = context.createOscillator();
    const harmonicGain = context.createGain();
    harmonic.type = 'sine';
    harmonic.frequency.setValueAtTime(frequency * 2, start);
    harmonicGain.gain.setValueAtTime(tone === 'acoustic' ? 0.11 : 0.075, start);
    harmonicGain.gain.exponentialRampToValueAtTime(0.0001, start + duration * 0.52);
    harmonic.connect(harmonicGain).connect(master);
    harmonic.start(start);
    harmonic.stop(start + duration * 0.58);

    const noiseBuffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.03), context.sampleRate);
    const noise = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noise.length; i += 1) noise[i] = (Math.random() * 2 - 1) * (1 - i / noise.length);
    const pick = context.createBufferSource();
    const pickFilter = context.createBiquadFilter();
    const pickGain = context.createGain();
    pick.buffer = noiseBuffer;
    pickFilter.type = 'bandpass';
    pickFilter.frequency.value = tone === 'acoustic' ? 2400 : 3200;
    pickFilter.Q.value = 0.7;
    pickGain.gain.setValueAtTime(tone === 'acoustic' ? 0.35 : 0.18, start);
    pickGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.035);
    pick.connect(pickFilter).connect(pickGain).connect(master);
    pick.start(start);
  };

  const playGuitarSequence = (events, options = {}) => {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const context = new AudioCtx();
    const tone = guitarTone?.value || 'acoustic';
    const bus = createGuitarBus(context, tone);
    const baseTime = context.currentTime + 0.03;
    events.forEach((event) => {
      pluckGuitarNote(
        context,
        bus,
        event.frequency,
        baseTime + (event.offset || 0),
        event.duration || (tone === 'acoustic' ? 1.05 : 1.35),
        event.velocity || 0.2,
        tone
      );
    });
    const end = Math.max(0, ...events.map(event => (event.offset || 0) + (event.duration || 1.3)));
    setTimeout(() => context.close().catch(() => {}), Math.ceil((end + 0.6) * 1000));
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
    if (songPracticeRoot) {
      songPracticeRoot.innerHTML = data.roots.map(([value, label]) => `<option value="${value}">${label}</option>`).join('');
      songPracticeRoot.value = 'A';
    }
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

  const tabStringLabel = (stringNumber) => ({1:'e',2:'B',3:'G',4:'D',5:'A',6:'E'}[stringNumber]);

  const allPositionsForNote = (note) => {
    const positions = [];
    data.tuning.forEach((string) => {
      for (let fret = 0; fret <= 12; fret += 1) {
        if (noteAt(string.note, fret) === note) positions.push({ string: string.string, fret });
      }
    });
    return positions;
  };

  const chooseCompactPositions = (items, preferredFret = 5) => {
    let previous = null;
    return items.map((item) => {
      const candidates = allPositionsForNote(item.note);
      const ranked = candidates.slice().sort((a, b) => {
        const score = (position) => {
          if (!previous) return Math.abs(position.fret - preferredFret) + Math.abs(position.string - 4) * 0.7;
          const fretMove = Math.abs(position.fret - previous.fret);
          const stringMove = Math.abs(position.string - previous.string);
          const extremeJump = fretMove > 5 ? 8 : 0;
          return fretMove + stringMove * 2.4 + extremeJump;
        };
        return score(a) - score(b);
      });
      previous = ranked[0];
      return { ...item, position: previous };
    });
  };

  const formatTabPositions = (positions) => {
    const rows = [1,2,3,4,5,6].map((stringNumber) => {
      const cells = positions.map((item) => item.position.string === stringNumber ? String(item.position.fret).padStart(2, '-') : '--');
      return `${tabStringLabel(stringNumber)}|-${cells.join('-')}-|`;
    });
    return rows.join('\n');
  };

  const frequencyAtPosition = (stringNumber, fret) => {
    const string = data.tuning.find((item) => item.string === stringNumber);
    const midi = (string.octave + 1) * 12 + noteIndex(string.note) + fret;
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const renderTab = (notes) => {
    const positions = chooseCompactPositions(notes, 5);
    tab.textContent = formatTabPositions(positions);
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
    const sequence = notes.concat(notes.slice().reverse().slice(1));
    playGuitarSequence(sequence.map((item, index) => ({
      frequency: noteFrequency(item.note, index > notes.length - 1 ? 4 : 3),
      offset: index * 0.42,
      duration: 1.0,
      velocity: 0.22
    })));
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
    const preferred = string6Fret <= 7 ? 'string6' : 'string5';
    const alternate = preferred === 'string6' ? 'string5' : 'string6';

    let family = data.chordShapes[preferred]?.[type] ? preferred : alternate;
    let shape = data.chordShapes[family]?.[type];

    if (!shape) return null;

    const offset = family === 'string6' ? string6Fret : string5Fret;
    const frets = shape.base.map((fret) => fret === null ? null : fret + offset);
    const soundingFrets = frets.filter((fret) => Number.isInteger(fret) && fret > 0);
    const displayStart = soundingFrets.length && Math.min(...soundingFrets) > 4 ? Math.min(...soundingFrets) : 1;
    return { family, shape, frets, displayStart };
  };

  const renderChordDiagram = (notes) => {
    const resolved = getChordShape();
    if (!resolved) {
      chordDiagram.innerHTML = '<div class="diagram-warning"><strong>Digitación no publicada.</strong><span>La fórmula del acorde es correcta, pero StanNet no mostrará un dibujo hasta tener una posición verificada.</span></div>';
      return;
    }
    const { family, shape, frets, displayStart } = resolved;
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
    const rootString = family === 'string6' ? '6ª cuerda' : '5ª cuerda';
    chordDiagram.innerHTML = `<div class="chord-root-family">Forma movible · fundamental en ${rootString}</div><div class="chord-grid"><span></span>${headers}${cells.join('')}<span></span>${fingers}</div><div class="diagram-legend"><span><b>x</b> no tocar</span><span><b>o</b> al aire</span><span><b>●</b> nota pulsada</span><span><b>1–4</b> dedos mano izquierda</span></div>`;
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
    playGuitarSequence(notes.map((item, index) => ({
      frequency: noteFrequency(item.note, 3 + Math.floor(index / 3)),
      offset: arpeggio ? index * 0.24 : index * 0.018,
      duration: arpeggio ? 1.25 : 1.55,
      velocity: arpeggio ? 0.22 : 0.17
    })));
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
    const events = [];
    progression.degrees.forEach((degree, chordIndex) => {
      const chord = byDegree.get(degree);
      chord.notes.forEach((item, noteOrder) => {
        events.push({
          frequency: noteFrequency(item.note, 3 + Math.floor(noteOrder / 3)),
          offset: chordIndex * 1.08 + noteOrder * 0.028,
          duration: 1.05,
          velocity: 0.16
        });
      });
    });
    playGuitarSequence(events);
  };

  const getExercisePattern = () => {
    const [kind, key] = exercisePattern.value.split(':');
    return kind === 'mode' ? data.modes[key] : data.scales[key];
  };

  const findPlayablePosition = (note, targetFret = 5, previous = null) => {
    const candidates = allPositionsForNote(note);
    return candidates.sort((a, b) => {
      const score = (position) => {
        if (!previous) return Math.abs(position.fret - targetFret) + Math.abs(position.string - 4) * 0.7;
        return Math.abs(position.fret - previous.fret) + Math.abs(position.string - previous.string) * 2.4 + (Math.abs(position.fret - previous.fret) > 5 ? 8 : 0);
      };
      return score(a) - score(b);
    })[0];
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
    let previous = null;
    const positions = items.map((item) => {
      const position = findPlayablePosition(item.note, previous?.fret ?? 5, previous);
      previous = position;
      return { ...item, position };
    });
    return formatTabPositions(positions);
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
    const beat = 60 / Number(exerciseBpm.value);
    playGuitarSequence(currentExercise.map((item, index) => ({
      frequency: noteFrequency(item.note, 3 + Math.floor(index / 6)),
      offset: index * beat,
      duration: Math.max(0.38, beat * 0.92),
      velocity: exerciseTechnique.value === 'legato' ? 0.18 : 0.23
    })));
  };

  const songDegreeMaps = {
    major: {
      I: [0, 'major'], ii: [2, 'minor'], iii: [4, 'minor'], IV: [5, 'major'],
      V: [7, 'dominant7'], vi: [9, 'minor'], 'vii°': [11, 'diminished']
    },
    minor: {
      i: [0, 'minor'], 'ii°': [2, 'diminished'], III: [3, 'major'], iv: [5, 'minor'],
      v: [7, 'minor'], V: [7, 'dominant7'], VI: [8, 'major'], VII: [10, 'major']
    }
  };

  const progressionTokens = (value) => value.split('-').filter(Boolean);

  const buildSongPractice = () => {
    const root = songPracticeRoot?.value || 'A';
    const mode = songPracticeMode?.value || 'major';
    const tokens = progressionTokens(songPracticeProgression?.value || 'I-V-vi-IV');
    const map = songDegreeMaps[mode];
    const chords = tokens.map((degree) => {
      const spec = map[degree] || songDegreeMaps.major[degree] || songDegreeMaps.minor[degree];
      if (!spec) return null;
      const [offset, type] = spec;
      const chord = data.chordTypes[type];
      const chordRootNote = noteAt(root, offset);
      return {
        degree,
        root: chordRootNote,
        type,
        name: chordRootNote + chord.symbol,
        notes: chord.intervals.map((interval) => noteAt(chordRootNote, interval % 12))
      };
    }).filter(Boolean);

    songPracticeChords.innerHTML = chords.map((chord) =>
      `<button class="progression-step song-chord-step" type="button" data-root="${chord.root}" data-type="${chord.type}"><b>${chord.name}</b><small>${chord.degree} · ${chord.notes.join('-')}</small></button>`
    ).join('');

    const roots = chords.map((chord) => ({ note: chord.root }));
    songPracticeTab.textContent = formatTabPositions(chooseCompactPositions(roots, songPracticeLevel?.value === 'advanced' ? 9 : 5));

    const level = songPracticeLevel?.value || 'intermediate';
    const bpm = Number(songPracticeBpm?.value || 90);
    const instructions = level === 'beginner'
      ? [
          `Toca cada acorde durante 4 pulsos a ${bpm} BPM.`,
          'Practica primero solo los cambios de acorde sin ritmo.',
          'Después toca únicamente las fundamentales siguiendo la TAB.',
          'Por último acompaña el vídeo y escucha dónde cambia la armonía.'
        ]
      : level === 'advanced'
        ? [
            `Practica a ${bpm} BPM y después sube 5 BPM por vuelta limpia.`,
            'Arpegia cada acorde y localiza 3ª y 7ª antes del siguiente cambio.',
            'Crea una segunda voz usando notas de la escala de la tonalidad.',
            'Improvisa 8 compases y resuelve cada frase sobre una nota del acorde.'
          ]
        : [
            `Toca la progresión a ${bpm} BPM con rasgueo constante.`,
            'Alterna una vuelta de acordes y una vuelta de arpegios.',
            'Usa la TAB de raíces para memorizar el movimiento armónico.',
            'Toca con el vídeo y ajusta manualmente tonalidad/BPM si hace falta.'
          ];
    songPracticeSteps.innerHTML = instructions.map((item) => `<li>${item}</li>`).join('');
    songPracticeOutput.hidden = false;

    songPracticeChords.querySelectorAll('.song-chord-step').forEach((button) => {
      button.addEventListener('click', () => {
        chordRoot.value = button.dataset.root;
        chordType.value = button.dataset.type;
        renderChord();
        document.querySelector('#chord-lab')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
    return chords;
  };

  const playSongPractice = () => {
    const chords = buildSongPractice();
    const beat = 60 / Number(songPracticeBpm?.value || 90);
    const events = [];
    chords.forEach((chord, chordIndex) => {
      const chordData = data.chordTypes[chord.type];
      chordData.intervals.forEach((interval, noteIndexInChord) => {
        events.push({
          frequency: noteFrequency(noteAt(chord.root, interval % 12), 3 + Math.floor(noteIndexInChord / 3)),
          offset: chordIndex * beat * 4 + noteIndexInChord * 0.025,
          duration: Math.max(1.0, beat * 3.7),
          velocity: 0.16
        });
      });
    });
    playGuitarSequence(events);
  };

  const selectSongResult = (result) => {
    guitarSongWorkspace.hidden = false;
    guitarSongPlayer.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(result.id)}?rel=0`;
    guitarSongTitle.textContent = result.title;
    guitarSongChannel.textContent = result.channel;
    guitarSongWorkspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const searchSongs = async () => {
    const query = guitarSongQuery?.value.trim();
    if (!query) {
      guitarSongStatus.textContent = 'Escribe una canción o artista.';
      guitarSongQuery?.focus();
      return;
    }
    guitarSongSearch.disabled = true;
    guitarSongStatus.textContent = 'Buscando en YouTube…';
    guitarSongResults.innerHTML = '';
    try {
      const response = await fetch('/api/youtube-search?q=' + encodeURIComponent(query));
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'No se pudo buscar.');
      const results = Array.isArray(payload.results) ? payload.results : [];
      guitarSongStatus.textContent = results.length ? `${results.length} resultados. Elige uno para practicar.` : 'No se encontraron resultados.';
      guitarSongResults.innerHTML = results.map((item, index) => `
        <button class="song-result-card" type="button" data-song-index="${index}">
          <img src="${item.thumbnail}" alt="" loading="lazy">
          <span><b>${item.title}</b><small>${item.channel}</small></span>
        </button>`).join('');
      guitarSongResults.querySelectorAll('.song-result-card').forEach((button) => {
        button.addEventListener('click', () => selectSongResult(results[Number(button.dataset.songIndex)]));
      });
    } catch (error) {
      guitarSongStatus.textContent = error.message || 'No se pudo buscar en YouTube.';
    } finally {
      guitarSongSearch.disabled = false;
    }
  };

  const getActiveStudies = () => data.referenceStudies.filter((study) => !studyCategory.value || study.category === studyCategory.value);

  const renderStudyChoices = () => {
    const categories = [...new Set(data.referenceStudies.map((study) => study.category))];
    if (!studyCategory.options.length) {
      studyCategory.innerHTML = categories.map((category) => `<option value="${category}">${category}</option>`).join('');
    }
    const studies = getActiveStudies();
    studySelect.innerHTML = studies.map((study, index) => `<option value="${index}">${study.title}</option>`).join('');
    studySelect.value = '0';
    renderStudy();
  };

  const renderStudy = () => {
    const studies = getActiveStudies();
    const study = studies[Number(studySelect.value || 0)] || studies[0];
    if (!study) return;
    const positions = study.events.map(([string, fret]) => ({ position: { string, fret } }));
    studyCategoryLabel.textContent = study.category.toUpperCase();
    studyTitle.textContent = study.title;
    studySource.textContent = study.source;
    studyTab.textContent = formatTabPositions(positions);
    studyNote.textContent = study.note;
  };

  const playStudy = () => {
    const studies = getActiveStudies();
    const study = studies[Number(studySelect.value || 0)] || studies[0];
    if (!study) return;
    const beat = 60 / Number(studyBpm.value || 80);
    playGuitarSequence(study.events.map(([string, fret], index) => ({
      frequency: frequencyAtPosition(string, fret),
      offset: index * beat * 0.5,
      duration: Math.max(0.32, beat * 0.72),
      velocity: 0.21
    })));
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
  if (guitarSongSearch && guitarSongQuery) {
    guitarSongSearch.addEventListener('click', searchSongs);
    guitarSongQuery.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') searchSongs();
    });
    songPracticeBpm?.addEventListener('input', () => { songPracticeBpmValue.textContent = songPracticeBpm.value; });
    $('#generateSongPractice')?.addEventListener('click', buildSongPractice);
    $('#playSongPractice')?.addEventListener('click', playSongPractice);
    songPracticeMode?.addEventListener('change', () => {
      const minor = songPracticeMode.value === 'minor';
      songPracticeProgression.innerHTML = minor
        ? '<option value="i-VI-III-VII">i – VI – III – VII</option><option value="i-VII-VI-V">i – VII – VI – V</option>'
        : '<option value="I-V-vi-IV">I – V – vi – IV</option><option value="I-IV-V-I">I – IV – V – I</option><option value="ii-V-I-vi">ii – V – I – vi</option>';
    });
  }

  if (studyCategory && studySelect && studyBpm) {
    studyCategory.addEventListener('change', renderStudyChoices);
    studySelect.addEventListener('change', renderStudy);
    studyBpm.addEventListener('input', () => { studyBpmValue.textContent = studyBpm.value; });
    $('#listenStudy')?.addEventListener('click', playStudy);
    renderStudyChoices();
  }

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
