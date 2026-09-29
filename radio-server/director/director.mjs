import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_API="https://www.stannet.space";
const DEFAULT_STATE="/state/director.json";
const PORT=Number(process.env.PORT||8788);
const API_BASE=String(process.env.STANNET_RADIO_API||DEFAULT_API).replace(/\/$/,"");
const STATE_FILE=process.env.RADIO_DIRECTOR_STATE||DEFAULT_STATE;
const RECENT_LIMIT=Math.max(2,Number(process.env.RADIO_RECENT_TRACKS||5));

function madridDateKey(date=new Date()){
  const parts=new Intl.DateTimeFormat("en-CA",{
    timeZone:"Europe/Madrid",year:"numeric",month:"2-digit",day:"2-digit"
  }).formatToParts(date);
  const get=t=>parts.find(p=>p.type===t)?.value||"00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function slotKey(program,date=new Date()){
  const current=program?.current||{};
  return [madridDateKey(date),current.time||"",current.title||"",current.mode||""].join("|");
}

function blockHint(program){
  const title=String(program?.current?.title||"").toLowerCase();
  if(title.includes("guitar")) return "GUITAR";
  if(title.includes("night")) return "NIGHT";
  if(title.includes("electronic")) return "ELECTRONIC";
  if(title.includes("morning")||title.includes("sunrise")) return "MORNING";
  if(title.includes("afternoon")) return "AFTERNOON";
  return "MUSIC";
}

export function pickTrack(tracks,recent=[],hint="MUSIC"){
  const valid=(tracks||[]).filter(t=>/^https:\/\//i.test(String(t?.audioUrl||"")));
  if(!valid.length) return null;
  const tagged=valid.filter(t=>Array.isArray(t.blocks)&&t.blocks.includes(hint));
  const pool=tagged.length?tagged:valid;
  const recentSet=new Set(recent);
  const fresh=pool.filter(t=>!recentSet.has(t.id));
  const candidates=fresh.length?fresh:pool;
  return candidates[Math.floor(Math.random()*candidates.length)]||null;
}

function bulletinSequence(program,apiBase){
  const category=String(program?.current?.type||"").toUpperCase();
  if(!["CYBER","AI","TECH","DEV"].includes(category)) return [];
  return [
    apiBase+"/api/radio/jingle?variant=station",
    apiBase+"/api/radio/program-audio?category="+encodeURIComponent(category),
    apiBase+"/api/radio/jingle?variant=transition"
  ];
}

export function decideNext({program,catalog,state={},apiBase=DEFAULT_API,now=new Date(),recentLimit=5}){
  const key=slotKey(program,now);
  const nextState={
    slotKey:key,
    insertIndex:Number(state.insertIndex||0),
    recentTracks:Array.isArray(state.recentTracks)?state.recentTracks.slice(0,recentLimit):[]
  };

  if(state.slotKey!==key) nextState.insertIndex=0;

  if(program?.current?.mode==="bulletin"){
    const seq=bulletinSequence(program,apiBase);
    if(nextState.insertIndex<seq.length){
      const uri=seq[nextState.insertIndex++];
      return {uri,kind:nextState.insertIndex===2?"bulletin":"jingle",state:nextState};
    }
  }

  const track=pickTrack(catalog?.tracks||[],nextState.recentTracks,blockHint(program));
  if(track){
    nextState.recentTracks=[track.id,...nextState.recentTracks.filter(id=>id!==track.id)].slice(0,recentLimit);
    return {uri:track.audioUrl,kind:"music",track,state:nextState};
  }

  return {uri:apiBase+"/api/radio/jingle?variant=station",kind:"emergency-jingle",state:nextState};
}

async function readState(file=STATE_FILE){
  try{return JSON.parse(await fs.readFile(file,"utf8"))}
  catch{return {slotKey:"",insertIndex:0,recentTracks:[]}}
}

async function writeState(state,file=STATE_FILE){
  await fs.mkdir(path.dirname(file),{recursive:true});
  const tmp=file+".tmp";
  await fs.writeFile(tmp,JSON.stringify(state,null,2)+"\n","utf8");
  await fs.rename(tmp,file);
}

async function fetchJson(url,timeoutMs=8000){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    const response=await fetch(url,{headers:{accept:"application/json","user-agent":"StanNet-Radio-Director/8.0"},signal:controller.signal});
    if(!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }finally{clearTimeout(timer)}
}

export async function nextItem({
  apiBase=API_BASE,
  stateFile=STATE_FILE,
  fetcher=fetchJson,
  now=new Date()
}={}){
  const [program,catalog,state]=await Promise.all([
    fetcher(apiBase+"/api/radio/program"),
    fetcher(apiBase+"/api/radio/catalog"),
    readState(stateFile)
  ]);
  const result=decideNext({program,catalog,state,apiBase,now,recentLimit:RECENT_LIMIT});
  await writeState(result.state,stateFile);
  return result;
}

function send(res,status,body,type="text/plain; charset=utf-8"){
  res.writeHead(status,{"content-type":type,"cache-control":"no-store"});
  res.end(body);
}

async function handler(req,res){
  const url=new URL(req.url||"/","http://director");
  if(req.method!=="GET") return send(res,405,"method not allowed\n");
  if(url.pathname==="/health") return send(res,200,JSON.stringify({ok:true,service:"stannet-radio-director",stage:8})+"\n","application/json; charset=utf-8");
  if(url.pathname==="/state"){
    const state=await readState();
    return send(res,200,JSON.stringify(state,null,2)+"\n","application/json; charset=utf-8");
  }
  if(url.pathname!=="/next") return send(res,404,"not found\n");
  try{
    const item=await nextItem();
    console.log(new Date().toISOString(),item.kind,item.track?.title||"",item.uri);
    return send(res,200,item.uri+"\n");
  }catch(error){
    console.error(new Date().toISOString(),"director error",error?.message||error);
    return send(res,503,"");
  }
}

const isDirect=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isDirect){
  http.createServer((req,res)=>handler(req,res).catch(error=>{
    console.error(error);
    send(res,500,"");
  })).listen(PORT,"0.0.0.0",()=>console.log(`StanNet Radio Director listening on :${PORT}`));
}
