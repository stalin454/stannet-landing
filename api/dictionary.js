const ALLOWED_WORD=/^[a-zA-Z'-]{1,64}$/;

async function jsonFetch(url,ms=6500){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{
    const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'StanNet-Callan-Dictionary/1.0'}});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    return await response.json();
  }finally{clearTimeout(timer)}
}

async function translate(text){
  if(!text)return '';
  try{
    const data=await jsonFetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|es`,5000);
    const value=data?.responseData?.translatedText;
    return typeof value==='string'&&value.trim()?value.trim():'';
  }catch(_){return ''}
}

module.exports=async function handler(req,res){
  const raw=Array.isArray(req.query?.word)?req.query.word[0]:req.query?.word;
  const word=String(raw||'').trim().toLowerCase();
  res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
  if(!ALLOWED_WORD.test(word))return res.status(400).json({error:'Invalid word'});
  try{
    const data=await jsonFetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    const item=Array.isArray(data)?data[0]:null;
    const meaning=item?.meanings?.find(m=>m?.definitions?.[0]?.definition)||item?.meanings?.[0];
    const definition=meaning?.definitions?.find(d=>d?.definition)||meaning?.definitions?.[0];
    if(!item||!definition?.definition)return res.status(404).json({error:'Word not found'});
    const phonetics=item.phonetics||[];
    const phonetic=phonetics.find(p=>p?.text)?.text||item.phonetic||'';
    const audio=phonetics.find(p=>p?.audio&&/uk|gb/i.test(p.audio))?.audio||phonetics.find(p=>p?.audio)?.audio||'';
    const exampleEn=definition.example||'';
    const [translation,definitionEs,exampleEs]=await Promise.all([
      translate(item.word||word),
      translate(definition.definition),
      translate(exampleEn)
    ]);
    return res.status(200).json({
      word:item.word||word,
      phonetic,
      audioUrl:audio,
      partOfSpeech:meaning?.partOfSpeech||'word',
      translation:translation||'',
      definition:definition.definition,
      definitionEs:definitionEs||'',
      exampleEn,
      exampleEs:exampleEs||''
    });
  }catch(error){
    return res.status(502).json({error:'Dictionary service unavailable'});
  }
};
