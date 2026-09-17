const ALLOWED_WORD=/^[a-zA-Z'-]{1,64}$/;

async function fetchJson(url,ms=7000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{
    const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json'}});
    const data=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    return data;
  }finally{clearTimeout(timer)}
}

async function translate(text){
  if(!text)return '';
  const urls=[
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en%7Ces`,
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(text)}`
  ];
  for(const url of urls){
    try{
      const data=await fetchJson(url,4500);
      if(data?.responseData?.translatedText)return String(data.responseData.translatedText).trim();
      if(Array.isArray(data?.[0])){
        const value=data[0].map(x=>Array.isArray(x)?x[0]:'').join('').trim();
        if(value)return value;
      }
    }catch(_){}
  }
  return '';
}

module.exports=async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const raw=Array.isArray(req.query?.word)?req.query.word[0]:req.query?.word;
  const word=String(raw||'').trim().toLowerCase();
  if(!ALLOWED_WORD.test(word))return res.status(400).json({error:'Invalid word'});

  let data;
  try{
    data=await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,7000);
  }catch(_){
    return res.status(502).json({error:'Dictionary lookup unavailable'});
  }

  const item=Array.isArray(data)?data[0]:null;
  const meaning=item?.meanings?.find(m=>m?.definitions?.some(d=>d?.definition))||item?.meanings?.[0];
  const definition=meaning?.definitions?.find(d=>d?.definition)||meaning?.definitions?.[0];
  if(!item||!definition?.definition)return res.status(404).json({error:'Word not found'});

  const phonetics=item.phonetics||[];
  const phonetic=phonetics.find(p=>p?.text)?.text||item.phonetic||'';
  const audio=phonetics.find(p=>p?.audio&&/uk|gb/i.test(p.audio))?.audio||phonetics.find(p=>p?.audio)?.audio||'';
  const exampleEn=definition.example||'';

  const translated=await Promise.allSettled([
    translate(item.word||word),
    translate(definition.definition),
    translate(exampleEn)
  ]);
  const value=i=>translated[i]?.status==='fulfilled'?translated[i].value:'';

  return res.status(200).json({
    word:item.word||word,
    phonetic,
    audioUrl:audio,
    partOfSpeech:meaning?.partOfSpeech||'word',
    translation:value(0),
    definition:definition.definition,
    definitionEs:value(1),
    exampleEn,
    exampleEs:value(2)
  });
};
