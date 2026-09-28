import fs from "node:fs";
import path from "node:path";

const root=path.resolve(process.cwd());
const catalogPath=path.join(root,"radio-catalog.json");
const outputPath=path.join(root,"radio-server","liquidsoap","playlist.m3u");

const catalog=JSON.parse(fs.readFileSync(catalogPath,"utf8"));
const excluded=Array.isArray(catalog?.policy?.excludedPaths)?catalog.policy.excludedPaths:[];
const tracks=Array.isArray(catalog?.tracks)?catalog.tracks:[];

const safe=tracks.filter(track=>{
  const p=String(track?.path||"").replace(/\\/g,"/");
  const rights=track?.rights||{};
  return track?.enabled!==false &&
    p &&
    !excluded.some(prefix=>p.startsWith(prefix)) &&
    typeof rights.type==="string" && rights.type.trim() &&
    typeof rights.source==="string" && rights.source.trim();
});

const lines=["#EXTM3U"];
for(const track of safe){
  const title=[track.artist,track.title].filter(Boolean).join(" - ");
  if(track.durationSeconds) lines.push(`#EXTINF:${Math.round(track.durationSeconds)},${title}`);
  const rel=String(track.path).replace(/^radio-server\/music\//,"");
  lines.push("/music/"+rel);
}
fs.writeFileSync(outputPath,lines.join("\n")+"\n");
console.log(`StanNet Radio playlist: ${safe.length} authorized track(s).`);
