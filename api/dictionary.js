const ALLOWED_WORD=/^[a-zA-Z'-]{1,64}$/;

module.exports=async function handler(req,res){
  const raw=Array.isArray(req.query?.word)?req.query.word[0]:req.query?.word;
  const word=String(raw||'').trim().toLowerCase();
  res.setHeader('Cache-Control','s-maxage=86400, stale-while-revalidate=604800');
  if(!ALLOWED_WORD.test(word))return res.status(400).json({error:'Invalid word'});
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),6000);
  try{
    const response=await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,{signal:controller.signal,headers:{Accept:'application/json'}});
    const data=await response.json().catch(()=>null);
    if(!response.ok)return res.status(response.status).json(data||{error:'Dictionary lookup failed'});
    return res.status(200).json(data);
  }catch(error){
    return res.status(502).json({error:'Dictionary service unavailable'});
  }finally{
    clearTimeout(timer);
  }
};
