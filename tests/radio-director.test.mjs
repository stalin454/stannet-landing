import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { decideNext, nextItem, pickTrack } from "../radio-server/director/director.mjs";

const tracks=[
  {id:"a",title:"A",audioUrl:"https://media.stannet.space/a.mp3",blocks:["MUSIC"]},
  {id:"b",title:"B",audioUrl:"https://media.stannet.space/b.mp3",blocks:["MUSIC"]},
  {id:"c",title:"C",audioUrl:"https://media.stannet.space/c.mp3",blocks:["MUSIC","NIGHT"]}
];

const picked=pickTrack(tracks,["a","b"],"MUSIC");
assert.equal(picked.id,"c");

const bulletinProgram={current:{time:"08:00",title:"Cybersecurity Daily",type:"CYBER",mode:"bulletin"}};
let state={slotKey:"",insertIndex:0,recentTracks:[]};
let r=decideNext({program:bulletinProgram,catalog:{tracks},state,apiBase:"https://www.stannet.space",now:new Date("2026-09-29T06:00:00Z"),recentLimit:5});
assert(r.uri.includes("/api/radio/jingle?variant=station"));
state=r.state;
r=decideNext({program:bulletinProgram,catalog:{tracks},state,apiBase:"https://www.stannet.space",now:new Date("2026-09-29T06:00:30Z"),recentLimit:5});
assert(r.uri.includes("/api/radio/program-audio?category=CYBER"));
state=r.state;
r=decideNext({program:bulletinProgram,catalog:{tracks},state,apiBase:"https://www.stannet.space",now:new Date("2026-09-29T06:01:00Z"),recentLimit:5});
assert(r.uri.includes("/api/radio/jingle?variant=transition"));
state=r.state;
r=decideNext({program:bulletinProgram,catalog:{tracks},state,apiBase:"https://www.stannet.space",now:new Date("2026-09-29T06:01:30Z"),recentLimit:5});
assert(r.kind==="music");

const tmp=await fs.mkdtemp(path.join(os.tmpdir(),"stannet-director-"));
const stateFile=path.join(tmp,"director.json");
const mockFetch=async url=>{
  if(url.endsWith("/api/radio/program")) return {current:{time:"21:30",title:"Night Sessions",type:"MUSIC",mode:"music"}};
  if(url.endsWith("/api/radio/catalog")) return {tracks};
  throw new Error("unexpected url");
};
const item=await nextItem({apiBase:"https://www.stannet.space",stateFile,fetcher:mockFetch,now:new Date("2026-09-29T20:00:00Z")});
assert(item.uri.startsWith("https://media.stannet.space/"));
const persisted=JSON.parse(await fs.readFile(stateFile,"utf8"));
assert.equal(persisted.recentTracks.length,1);
await fs.rm(tmp,{recursive:true,force:true});

console.log("PASS: autonomous radio director sequence, cloud music rotation and persisted state verified.");
