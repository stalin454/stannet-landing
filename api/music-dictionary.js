const valid = /^[a-z]+(?:'[a-z]+)?$/;
const proper = /^(?:a |an |the )?(?:surname|given name|place|village|town|city|county|municipality|acronym|abbreviation|initialism)\b/i;

async function read(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(1900), headers: { Accept:'application/json' } });
  if (!response.ok) throw new Error('provider');
  return response.json();
}

module.exports = async function handler(req, res) {
  const word = String(Array.isArray(req.query?.word) ? req.query.word[0] : req.query?.word || '').trim().toLowerCase();
  if (!valid.test(word) || word.length > 48) return res.status(400).json({ error:'Palabra no válida.' });

  const encoded = encodeURIComponent(word);
  const [dictionary, google, memory] = await Promise.allSettled([
    read('https://api.dictionaryapi.dev/api/v2/entries/en/' + encoded),
    read('https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=' + encoded),
    read('https://api.mymemory.translated.net/get?q=' + encoded + '&langpair=en%7Ces')
  ]);
  const item = dictionary.status === 'fulfilled' && Array.isArray(dictionary.value) ? dictionary.value[0] : null;
  const senses = (item?.meanings || []).flatMap(group => (group.definitions || []).map(sense => ({
    part:group.partOfSpeech, definition:sense.definition, example:sense.example
  })));
  const sense = senses.find(s => typeof s.definition === 'string' && s.definition.length > 8 && !proper.test(s.definition));
  const fromGoogle = google.status === 'fulfilled' ? google.value?.[0]?.map(part => part?.[0] || '').join('').trim() : '';
  const fromMemory = memory.status === 'fulfilled' ? memory.value?.responseData?.translatedText?.trim() : '';
  const translation = fromGoogle || (!/^(?:NO QUERY SPECIFIED|MYMEMORY WARNING|QUERY LENGTH LIMIT)/i.test(fromMemory || '') ? fromMemory : '');
  if (!sense && (!translation || translation.toLowerCase() === word)) {
    res.setHeader('Cache-Control','no-store');
    return res.status(404).json({ error:'Palabra no encontrada.' });
  }
  res.setHeader('Cache-Control','s-maxage=604800, stale-while-revalidate=86400');
  return res.status(200).json({
    word, translation:translation || '', meaning:sense?.definition || '', example:sense?.example || '',
    partOfSpeech:sense?.part || '', phonetic:item?.phonetics?.find(p=>p.text)?.text || item?.phonetic || '',
    audio:item?.phonetics?.find(p=>p.audio && /uk|gb/i.test(p.audio))?.audio ||
      item?.phonetics?.find(p=>p.audio)?.audio || ''
  });
};
