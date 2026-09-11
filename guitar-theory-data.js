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
  tuning: [
    { string: 6, note: 'E', octave: 2 },
    { string: 5, note: 'A', octave: 2 },
    { string: 4, note: 'D', octave: 3 },
    { string: 3, note: 'G', octave: 3 },
    { string: 2, note: 'B', octave: 3 },
    { string: 1, note: 'E', octave: 4 }
  ]
};
