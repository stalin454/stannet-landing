#!/usr/bin/env node
// Licensed-feed updater for StanNet Land Intelligence.
// Intended for a trusted CI/Worker cron with partner-provided HTTPS JSON feeds.
// Deliberately never scrapes commercial portals or guesses availability.
import {readFileSync,writeFileSync,renameSync} from 'node:fs';
import {resolve,dirname,basename,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const dataPath=resolve(dirname(fileURLToPath(import.meta.url)),'portal-public/land/listings.json');
const existing=JSON.parse(readFileSync(dataPath,'utf8'));
const countries=['PA','DO','PY'];
const allowed=(process.env.LAND_FEED_ALLOWED_HOSTS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
const maxRecords=500;
const results=[];
for(const country of countries){
 const address=process.env['LAND_FEED_'+country+'_URL'];
 if(!address){results.push({country,status:'not_configured'});continue;}
 const url=new URL(address);
 if(url.protocol!=='https:'||url.username||url.password||!allowed.includes(url.hostname.toLowerCase())){
  throw Error(country+': feed URL must be HTTPS and its hostname explicitly allowed');
 }
 const token=process.env['LAND_FEED_'+country+'_TOKEN'];
 const signal=AbortSignal.timeout(12000);
 try{
  const headers={'Accept':'application/json','User-Agent':'StanNet-Land-Feed/1.0'};
  if(token)headers.Authorization='Bearer '+token;
  const response=await fetch(url,{headers,signal,redirect:'error',cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status);
  const length=Number(response.headers.get('content-length')||0);
  if(length>2_000_000)throw Error('feed too large');
  const raw=await response.text();if(raw.length>2_000_000)throw Error('feed too large');
  const payload=JSON.parse(raw);
  if(!Array.isArray(payload.listings)||payload.listings.length>maxRecords)throw Error('invalid listings count');
  const source=(payload.source||url.hostname).slice(0,70);
  let list=[];const seen=new Set();
  for(const candidate of payload.listings){
   if(candidate.country!==country||typeof candidate.id!=='string'||!/^[a-zA-Z0-9_-]{1,70}$/.test(candidate.id))continue;
   const source_url=new URL(candidate.source_url);
   if(source_url.protocol!=='https:'||source_url.username||source_url.password)continue;
   const area=Number(candidate.area_m2),price=Number(candidate.price);
   if(!Number.isFinite(area)||area<=0||area>1e11||!Number.isFinite(price)||price<=0||price>1e15)continue;
   if(!['USD','DOP','PYG','EUR'].includes(candidate.currency))continue;
   const id='FEED-'+country+'-'+candidate.id;
   if(seen.has(id))continue;seen.add(id);
   const checked_at=new Date().toISOString();
   list.push({id,country,name:String(candidate.name||'').slice(0,140),region:String(candidate.region||'').slice(0,100),
    area_m2:area,price,currency:candidate.currency,source,source_url:source_url.href,
    note:'Precio y disponibilidad indicados por feed externo. Titularidad y vigencia deben contrastarse con anunciante.',
    source_check:{availability:'feed_reported',checked_at}});
  }
  if(list.length<10){results.push({country,status:'insufficient_feed_results',count:list.length});continue;}
  // Replace only records previously imported from this country's feed; retain
  // the original editorial selection as a clearly older fallback.
  existing.listings=existing.listings.filter(x=>!(x.country===country&&String(x.id).startsWith('FEED-'+country+'-')));
  existing.listings.push(...list);
  results.push({country,status:'feed_imported',count:list.length});
 }catch(error){
  results.push({country,status:'source_error',detail:error.name==='TimeoutError'?'timeout':String(error.message).slice(0,90)});
 }
}
const imported=results.some(x=>x.status==='feed_imported');
existing.feed_status=Object.fromEntries(results.map(x=>[x.country,x]));
if(imported){
 existing.refreshed_at=new Date().toISOString();
 existing.listings.sort((a,b)=>a.country.localeCompare(b.country)||a.id.localeCompare(b.id));
 const temp=join(dirname(dataPath),'.'+basename(dataPath)+'.next');
 writeFileSync(temp,JSON.stringify(existing,null,2)+'\n',{mode:0o600});
 renameSync(temp,dataPath);
}
for(const x of results)console.log(x.country+': '+x.status+(x.count?' ('+x.count+' entries)':''));
if(!imported){console.log('No trusted feed imported; editorial snapshot preserved.');process.exitCode=2;}
