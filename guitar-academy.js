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
  let activeView = 'both';

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
    const grouped = Object.entries(data.scales).reduce((acc, [key, scale]) => {
      acc[scale.category] = acc[scale.category] || [];
      acc[scale.category].push([key, scale.name]);
      return acc;
    }, {});
    scaleSelect.innerHTML = Object.entries(grouped).map(([category, scales]) => `<optgroup label="${category}">${scales.map(([key, name]) => `<option value="${key}">${name}</option>`).join('')}</optgroup>`).join('');
    scaleSelect.value = 'naturalMinor';
    modeSelect.innerHTML = '<option value="none">Usar selector de escala</option>' + Object.entries(data.modes).map(([key, mode]) => `<option value="${key}">${mode.name}</option>`).join('');
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

  fillSelectors();
  [rootSelect, scaleSelect, modeSelect].forEach((select) => select.addEventListener('change', render));
  viewButtons.forEach((button) => button.addEventListener('click', () => {
    activeView = button.dataset.view;
    viewButtons.forEach((item) => item.classList.toggle('active', item === button));
    render();
  }));
  $('#listenScale').addEventListener('click', playScale);
  render();
});
