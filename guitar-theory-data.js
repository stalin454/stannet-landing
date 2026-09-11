window.StanNetGuitarData = {
  chromatic: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  noteLabels: {
    C: 'Do',
    'C#': 'Do#/Reb',
    D: 'Re',
    'D#': 'Re#/Mib',
    E: 'Mi',
    F: 'Fa',
    'F#': 'Fa#/Solb',
    G: 'Sol',
    'G#': 'Sol#/Lab',
    A: 'La',
    'A#': 'La#/Sib',
    B: 'Si'
  },
  roots: [
    ['C', 'Do'],
    ['C#', 'Do#/Reb'],
    ['D', 'Re'],
    ['D#', 'Re#/Mib'],
    ['E', 'Mi'],
    ['F', 'Fa'],
    ['F#', 'Fa#/Solb'],
    ['G', 'Sol'],
    ['G#', 'Sol#/Lab'],
    ['A', 'La'],
    ['A#', 'La#/Sib'],
    ['B', 'Si']
  ],
  scales: {
    major: {
      category: 'Escalas esenciales',
      name: 'Mayor',
      intervals: [0, 2, 4, 5, 7, 9, 11],
      degrees: ['1', '2', '3', '4', '5', '6', '7'],
      formula: '1 - 2 - 3 - 4 - 5 - 6 - 7',
      character: 'Sonido estable, abierto y luminoso. Base de acordes mayores y melodias claras.'
    },
    naturalMinor: {
      category: 'Escalas esenciales',
      name: 'Menor natural',
      intervals: [0, 2, 3, 5, 7, 8, 10],
      degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'],
      formula: '1 - 2 - b3 - 4 - 5 - b6 - b7',
      character: 'Color introspectivo y expresivo. Es la escala menor de referencia.'
    },
    harmonicMinor: {
      category: 'Menores',
      name: 'Menor armonica',
      intervals: [0, 2, 3, 5, 7, 8, 11],
      degrees: ['1', '2', 'b3', '4', '5', 'b6', '7'],
      formula: '1 - 2 - b3 - 4 - 5 - b6 - 7',
      character: 'Tension neoclasica, flamenca y dramatica. La septima mayor empuja hacia la tonica.'
    },
    melodicMinor: {
      category: 'Menores',
      name: 'Menor melodica',
      intervals: [0, 2, 3, 5, 7, 9, 11],
      degrees: ['1', '2', 'b3', '4', '5', '6', '7'],
      formula: '1 - 2 - b3 - 4 - 5 - 6 - 7',
      character: 'Menor sofisticada con sexta y septima mayores. Muy util en jazz y fusion.'
    },
    majorPentatonic: {
      category: 'Pentatonicas',
      name: 'Pentatonica mayor',
      intervals: [0, 2, 4, 7, 9],
      degrees: ['1', '2', '3', '5', '6'],
      formula: '1 - 2 - 3 - 5 - 6',
      character: 'Directa, cantable y segura para melodias mayores.'
    },
    minorPentatonic: {
      category: 'Pentatonicas',
      name: 'Pentatonica menor',
      intervals: [0, 3, 5, 7, 10],
      degrees: ['1', 'b3', '4', '5', 'b7'],
      formula: '1 - b3 - 4 - 5 - b7',
      character: 'La caja clasica de blues, rock y solos expresivos.'
    },
    blues: {
      category: 'Pentatonicas',
      name: 'Blues',
      intervals: [0, 3, 5, 6, 7, 10],
      degrees: ['1', 'b3', '4', 'b5', '5', 'b7'],
      formula: '1 - b3 - 4 - b5 - 5 - b7',
      character: 'Pentatonica menor con blue note. Ideal para fraseo vocal y tension controlada.'
    },
    chromatic: {
      category: 'Simetricas',
      name: 'Cromatica',
      intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
      degrees: ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'],
      formula: 'Todos los semitonos',
      character: 'Contiene las doce notas. Util para tecnica, aproximaciones y tension.'
    },
    diminished: {
      category: 'Simetricas',
      name: 'Disminuida',
      intervals: [0, 2, 3, 5, 6, 8, 9, 11],
      degrees: ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'],
      formula: 'Tono - semitono repetido',
      character: 'Simetrica, inestable y elegante. Muy fuerte sobre dominantes alterados.'
    },
    wholeTone: {
      category: 'Simetricas',
      name: 'Tonos enteros',
      intervals: [0, 2, 4, 6, 8, 10],
      degrees: ['1', '2', '3', '#4', '#5', 'b7'],
      formula: 'Tonos enteros consecutivos',
      character: 'Flotante y misteriosa. No tiene semitonos ni reposo tradicional.'
    },
    phrygianDominant: {
      category: 'Guitarra y flamenco',
      name: 'Frigia dominante',
      intervals: [0, 1, 4, 5, 7, 8, 10],
      degrees: ['1', 'b2', '3', '4', '5', 'b6', 'b7'],
      formula: '1 - b2 - 3 - 4 - 5 - b6 - b7',
      character: 'Color flamenco, arabe y metal neoclasico. Nace del quinto grado de la menor armonica.'
    }
  },
  modes: {
    ionian: { name: 'Jonico', intervals: [0, 2, 4, 5, 7, 9, 11], degrees: ['1', '2', '3', '4', '5', '6', '7'], formula: '1 - 2 - 3 - 4 - 5 - 6 - 7', character: 'Mayor puro: estable, brillante y resolutivo.' },
    dorian: { name: 'Dorico', intervals: [0, 2, 3, 5, 7, 9, 10], degrees: ['1', '2', 'b3', '4', '5', '6', 'b7'], formula: '1 - 2 - b3 - 4 - 5 - 6 - b7', character: 'Menor con sexta mayor: moderno, funk, jazz y rock modal.' },
    phrygian: { name: 'Frigio', intervals: [0, 1, 3, 5, 7, 8, 10], degrees: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'], formula: '1 - b2 - b3 - 4 - 5 - b6 - b7', character: 'Oscuro, mediterraneo y tenso por su segunda menor.' },
    lydian: { name: 'Lidio', intervals: [0, 2, 4, 6, 7, 9, 11], degrees: ['1', '2', '3', '#4', '5', '6', '7'], formula: '1 - 2 - 3 - #4 - 5 - 6 - 7', character: 'Mayor expansivo y cinematografico por su cuarta aumentada.' },
    mixolydian: { name: 'Mixolidio', intervals: [0, 2, 4, 5, 7, 9, 10], degrees: ['1', '2', '3', '4', '5', '6', 'b7'], formula: '1 - 2 - 3 - 4 - 5 - 6 - b7', character: 'Mayor con septima menor: blues, rock, funk y dominante.' },
    aeolian: { name: 'Eolico', intervals: [0, 2, 3, 5, 7, 8, 10], degrees: ['1', '2', 'b3', '4', '5', 'b6', 'b7'], formula: '1 - 2 - b3 - 4 - 5 - b6 - b7', character: 'Menor natural: emocional, directo y muy comun.' },
    locrian: { name: 'Locrio', intervals: [0, 1, 3, 5, 6, 8, 10], degrees: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'], formula: '1 - b2 - b3 - 4 - b5 - b6 - b7', character: 'Inestable por su quinta disminuida. Util para comprender tension extrema.' }
  },
  chordTypes: {
    major: { name: 'Mayor', symbol: '', intervals: [0, 4, 7], degrees: ['1', '3', '5'], formula: '1 - 3 - 5', quality: 'Estable, claro y abierto. Es el centro de las progresiones mayores.' },
    minor: { name: 'Menor', symbol: 'm', intervals: [0, 3, 7], degrees: ['1', 'b3', '5'], formula: '1 - b3 - 5', quality: 'Mas oscuro y emocional por su tercera menor.' },
    dominant7: { name: 'Septima dominante', symbol: '7', intervals: [0, 4, 7, 10], degrees: ['1', '3', '5', 'b7'], formula: '1 - 3 - 5 - b7', quality: 'Tension que pide resolver. Base del blues, funk, rock y cadencias clasicas.' },
    major7: { name: 'Maj7', symbol: 'maj7', intervals: [0, 4, 7, 11], degrees: ['1', '3', '5', '7'], formula: '1 - 3 - 5 - 7', quality: 'Mayor sofisticado, suave y cinematografico.' },
    minor7: { name: 'm7', symbol: 'm7', intervals: [0, 3, 7, 10], degrees: ['1', 'b3', '5', 'b7'], formula: '1 - b3 - 5 - b7', quality: 'Menor redondo y flexible. Muy comun en soul, funk, jazz y pop.' },
    diminished: { name: 'Disminuido', symbol: 'dim', intervals: [0, 3, 6], degrees: ['1', 'b3', 'b5'], formula: '1 - b3 - b5', quality: 'Inestable y tenso. Sirve como puente dramatico entre acordes.' },
    augmented: { name: 'Aumentado', symbol: 'aug', intervals: [0, 4, 8], degrees: ['1', '3', '#5'], formula: '1 - 3 - #5', quality: 'Ambiguo y flotante. Abre movimiento cromatico.' },
    sus2: { name: 'Sus2', symbol: 'sus2', intervals: [0, 2, 7], degrees: ['1', '2', '5'], formula: '1 - 2 - 5', quality: 'Suspendido y limpio. No define mayor o menor.' },
    sus4: { name: 'Sus4', symbol: 'sus4', intervals: [0, 5, 7], degrees: ['1', '4', '5'], formula: '1 - 4 - 5', quality: 'Suspendido con empuje. Funciona muy bien antes de volver al mayor.' },
    add9: { name: 'Add9', symbol: 'add9', intervals: [0, 4, 7, 14], degrees: ['1', '3', '5', '9'], formula: '1 - 3 - 5 - 9', quality: 'Mayor con aire moderno y melodico por la novena.' }
  },
  chordShapes: {
    string6: {
      major: { base: [0, 2, 2, 1, 0, 0], muted: [], fingers: ['1', '3', '4', '2', '1', '1'] },
      minor: { base: [0, 2, 2, 0, 0, 0], muted: [], fingers: ['1', '3', '4', '1', '1', '1'] },
      dominant7: { base: [0, 2, 0, 1, 0, 0], muted: [], fingers: ['1', '3', '1', '2', '1', '1'] },
      major7: { base: [0, 2, 1, 1, 0, 0], muted: [], fingers: ['1', '3', '2', '2', '1', '1'] },
      minor7: { base: [0, 2, 0, 0, 0, 0], muted: [], fingers: ['1', '3', '1', '1', '1', '1'] },
      sus2: { base: [0, 2, 2, 4, 0, 0], muted: [], fingers: ['1', '2', '3', '4', '1', '1'] },
      sus4: { base: [0, 2, 2, 2, 0, 0], muted: [], fingers: ['1', '2', '3', '4', '1', '1'] }
    },
    string5: {
      major: { base: [null, 0, 2, 2, 2, 0], muted: [6], fingers: ['x', '1', '3', '3', '3', '1'] },
      minor: { base: [null, 0, 2, 2, 1, 0], muted: [6], fingers: ['x', '1', '3', '4', '2', '1'] },
      dominant7: { base: [null, 0, 2, 0, 2, 0], muted: [6], fingers: ['x', '1', '3', '1', '4', '1'] },
      major7: { base: [null, 0, 2, 1, 2, 0], muted: [6], fingers: ['x', '1', '3', '2', '4', '1'] },
      minor7: { base: [null, 0, 2, 0, 1, 0], muted: [6], fingers: ['x', '1', '3', '1', '2', '1'] },
      diminished: { base: [null, 0, 1, 2, 1, null], muted: [6, 1], fingers: ['x', '1', '2', '4', '3', 'x'] },
      augmented: { base: [null, 0, 3, 2, 2, null], muted: [6, 1], fingers: ['x', '1', '4', '2', '3', 'x'] },
      add9: { base: [null, 0, 2, 2, 0, 0], muted: [6], fingers: ['x', '1', '3', '4', '1', '1'] }
    }
  },
  harmony: {
    major: {
      name: 'Mayor',
      scale: 'major',
      degrees: ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'],
      qualities: ['major', 'minor', 'minor', 'major', 'dominant7', 'minor', 'diminished'],
      functions: ['Tonica', 'Predominante', 'Tonica suave', 'Subdominante', 'Dominante', 'Relativa menor', 'Dominante inestable'],
      explanation: 'El circulo mayor organiza tension y reposo. I es casa, IV abre camino, V crea tension y vi aporta color emocional.'
    },
    minor: {
      name: 'Menor',
      scale: 'naturalMinor',
      degrees: ['i', 'ii°', 'III', 'iv', 'v', 'VI', 'VII'],
      qualities: ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'],
      functions: ['Tonica menor', 'Predominante tenso', 'Relativa mayor', 'Subdominante menor', 'Dominante suave', 'Color dramatico', 'Empuje modal'],
      explanation: 'El circulo menor natural es expresivo y modal. Para cadencias fuertes se suele convertir V en dominante usando menor armonica.'
    },
    flamenco: {
      name: 'Flamenco / Frigio',
      scale: 'phrygianDominant',
      degrees: ['i', 'bVII', 'bVI', 'V'],
      offsets: [0, 10, 8, 7],
      qualities: ['minor', 'major', 'major', 'dominant7'],
      functions: ['Centro modal', 'Descenso frigio', 'Color andaluz', 'Dominante flamenca'],
      explanation: 'El recurso flamenco clasico baja por grados y resuelve con mucha fuerza hacia el centro tonal.'
    }
  },
  progressions: [
    { name: 'Pop esencial', mode: 'major', degrees: ['I', 'V', 'vi', 'IV'], style: 'Pop / worship / balada', feel: 'Estable, cantable y muy reconocible.' },
    { name: 'Cadencia clasica', mode: 'major', degrees: ['I', 'IV', 'V', 'I'], style: 'Clasico / folk / aprendizaje', feel: 'La forma mas clara de sentir casa, salida, tension y regreso.' },
    { name: 'Rock menor', mode: 'minor', degrees: ['i', 'VI', 'III', 'VII'], style: 'Rock / metal melodico', feel: 'Oscura, epica y facil de convertir en riffs.' },
    { name: 'Soul menor', mode: 'minor', degrees: ['i', 'iv', 'VII', 'III'], style: 'Soul / R&B / balada', feel: 'Menor con movimiento amplio y emocional.' },
    { name: 'Andaluza', mode: 'flamenco', degrees: ['i', 'bVII', 'bVI', 'V'], style: 'Flamenco / fusion / metal neoclasico', feel: 'Descenso dramatico con dominante final.' },
    { name: 'Jazz entrada', mode: 'major', degrees: ['ii', 'V', 'I', 'vi'], style: 'Jazz / neo soul', feel: 'Movimiento funcional con dominante y reposo sofisticado.' }
  ],
  tuning: [
    { string: 6, note: 'E', octave: 2 },
    { string: 5, note: 'A', octave: 2 },
    { string: 4, note: 'D', octave: 3 },
    { string: 3, note: 'G', octave: 3 },
    { string: 2, note: 'B', octave: 3 },
    { string: 1, note: 'E', octave: 4 }
  ]
};
