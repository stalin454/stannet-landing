const ALLOWED_WORD=/^[a-zA-Z'-]{1,64}$/;
const POS={v:'verb',n:'noun',adj:'adjective',adv:'adverb',u:'word'};
const ENTITIES={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&#39;':"'",'&nbsp;':' '};

function plain(value){
  return String(value||'')
    .replace(/<[^>]*>/g,' ')
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;|&nbsp;/g,m=>ENTITIES[m])
    .replace(/\s+/g,' ')
    .trim();
}

async function fetchJson(url,ms=4000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try{
    const response=await fetch(url,{signal:controller.signal,headers:{Accept:'application/json','User-Agent':'StanNetCallanDictionary/1.0 (https://www.stannet.space)'}});
    const data=await response.json().catch(()=>null);
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    return data;
  }finally{clearTimeout(timer)}
}

async function fromDictionaryApi(word,ms){
  const data=await fetchJson(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,ms);
  const item=Array.isArray(data)?data[0]:null;
  const meaning=item?.meanings?.find(m=>m?.definitions?.some(d=>d?.definition))||item?.meanings?.[0];
  const definition=meaning?.definitions?.find(d=>d?.definition)||meaning?.definitions?.[0];
  if(!definition?.definition)return null;
  const phonetics=item.phonetics||[];
  return {
    word:item.word||word,
    phonetic:phonetics.find(p=>p?.text)?.text||item.phonetic||'',
    audioUrl:phonetics.find(p=>p?.audio&&/uk|gb/i.test(p.audio))?.audio||phonetics.find(p=>p?.audio)?.audio||'',
    partOfSpeech:meaning?.partOfSpeech||'word',
    definition:plain(definition.definition),
    exampleEn:plain(definition.example||''),
    source:'dictionaryapi'
  };
}

async function fromDatamuse(word,ms){
  const data=await fetchJson(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`,ms);
  const item=Array.isArray(data)?data[0]:null;
  const raw=item?.word?.toLowerCase()===word?item.defs?.find(Boolean):null;
  if(!raw)return null;
  const [tag,text]=String(raw).split('\t');
  if(!text)return null;
  return {
    word:item.word,
    phonetic:'',
    audioUrl:'',
    partOfSpeech:POS[tag]||'word',
    definition:plain(text),
    exampleEn:'',
    source:'datamuse'
  };
}

async function fromWiktionary(word,ms){
  const data=await fetchJson(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`,ms);
  const blocks=Array.isArray(data?.en)?data.en:[];
  for(const block of blocks){
    for(const entry of block?.definitions||[]){
      const definition=plain(entry?.definition);
      if(definition.length<2)continue;
      const example=plain(entry?.parsedExamples?.[0]?.example||entry?.examples?.[0]||'');
      return {
        word,
        phonetic:'',
        audioUrl:'',
        partOfSpeech:String(block.partOfSpeech||'word').toLowerCase(),
        definition,
        exampleEn:example,
        source:'wiktionary'
      };
    }
  }
  return null;
}

async function translate(text,ms){
  if(!text)return '';
  const value=String(text).slice(0,400);
  const urls=[
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(value)}&langpair=en%7Ces`,
    `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(value)}`
  ];
  for(const url of urls){
    try{
      const data=await fetchJson(url,ms);
      const memory=data?.responseData?.translatedText;
      if(memory&&!/^(NO QUERY SPECIFIED|MYMEMORY WARNING|QUERY LENGTH LIMIT)/i.test(memory))return String(memory).trim();
      if(Array.isArray(data?.[0])){
        const joined=data[0].map(x=>Array.isArray(x)?x[0]:'').join('').trim();
        if(joined)return joined;
      }
    }catch(_){}
  }
  return '';
}

module.exports=async function handler(req,res){
  res.setHeader('Content-Type','application/json; charset=utf-8');
  const raw=Array.isArray(req.query?.word)?req.query.word[0]:req.query?.word;
  const word=String(raw||'').trim().toLowerCase();
  if(!ALLOWED_WORD.test(word)){
    res.setHeader('Cache-Control','no-store');
    return res.status(400).json({error:'Invalid word'});
  }

  const sources=await Promise.allSettled([
    fromDictionaryApi(word,2500),
    fromDatamuse(word,2500),
    fromWiktionary(word,2500)
  ]);
  const entry=sources.map(r=>r.status==='fulfilled'?r.value:null).find(v=>v?.definition)||null;

  const translated=await Promise.allSettled([
    translate(entry?.word||word,2000),
    translate(entry?.definition||'',2000),
    translate(entry?.exampleEn||'',2000)
  ]);
  const value=i=>translated[i]?.status==='fulfilled'?translated[i].value:'';
  const translation=value(0);

  if(!entry&&(!translation||translation.toLowerCase()===word)){
    res.setHeader('Cache-Control','no-store');
    return res.status(404).json({error:'Word not found'});
  }

  res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
  return res.status(200).json({
    word:entry?.word||word,
    phonetic:entry?.phonetic||'',
    audioUrl:entry?.audioUrl||'',
    partOfSpeech:entry?.partOfSpeech||'word',
    translation,
    definition:entry?.definition||'',
    definitionEs:value(1),
    exampleEn:entry?.exampleEn||'',
    exampleEs:value(2),
    source:entry?.source||'translation'
  });
};
