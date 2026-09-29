import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const DEFAULT_WINDOWS_LIBRARY = String.raw`C:\CStanNetRadioMusic`;
export const SUPPORTED_EXTENSIONS = new Set([".mp3",".wav",".m4a",".flac",".ogg",".aac"]);

function normalizeSlashes(value){
  return String(value||"").replace(/\\/g,"/");
}

function slugify(value){
  return String(value||"track")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g,"")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .slice(0,72)||"track";
}

function titleFromFilename(filePath){
  const base=path.basename(filePath,path.extname(filePath));
  return base
    .replace(/^\s*\d+[\s._-]+/,"")
    .replace(/[_-]+/g," ")
    .replace(/\s+/g," ")
    .trim()||base;
}

function inferBlocks(title){
  const value=String(title||"").toLowerCase();
  const blocks=["MUSIC"];
  if(/electro|electronic|edm|house|techno|trance|dance|synth|club/.test(value)) blocks.push("ELECTRONIC");
  if(/guitar|guitarra|rock|metal|solo/.test(value)) blocks.push("GUITAR");
  if(/night|noct|ambient|chill|sleep|dream|luna|moon/.test(value)) blocks.push("NIGHT");
  if(/morning|sunrise|amanecer|mañana/.test(value)) blocks.push("MORNING");
  if(/afternoon|tarde|sunset|atardecer/.test(value)) blocks.push("AFTERNOON");
  return [...new Set(blocks)];
}

export async function sha256File(filePath){
  return new Promise((resolve,reject)=>{
    const hash=crypto.createHash("sha256");
    const stream=fs.createReadStream(filePath);
    stream.on("error",reject);
    stream.on("data",chunk=>hash.update(chunk));
    stream.on("end",()=>resolve(hash.digest("hex")));
  });
}

export async function scanAudioFiles(rootDir){
  const results=[];
  async function walk(dir){
    const entries=await fsp.readdir(dir,{withFileTypes:true});
    for(const entry of entries){
      const full=path.join(dir,entry.name);
      if(entry.isDirectory()) await walk(full);
      else if(entry.isFile()&&SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) results.push(full);
    }
  }
  await walk(rootDir);
  return results.sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:"base"}));
}

function playlistLine(track){
  const title=[track.artist,track.title].filter(Boolean).join(" - ");
  const lines=[];
  if(track.durationSeconds) lines.push(`#EXTINF:${Math.round(track.durationSeconds)},${title}`);
  const rel=String(track.path||"").replace(/^radio-server\/music\//,"");
  lines.push("/music/"+normalizeSlashes(rel));
  return lines;
}

export async function importLibrary({
  sourceDir=DEFAULT_WINDOWS_LIBRARY,
  repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."),
  copyFiles=true,
  dryRun=false
}={}){
  const resolvedSource=path.resolve(sourceDir);
  const stat=await fsp.stat(resolvedSource).catch(()=>null);
  if(!stat?.isDirectory()) throw new Error(`No existe la carpeta de música: ${resolvedSource}`);

  const catalogPath=path.join(repoRoot,"radio-catalog.json");
  const musicDir=path.join(repoRoot,"radio-server","music");
  const playlistPath=path.join(repoRoot,"radio-server","liquidsoap","playlist.m3u");
  const catalog=JSON.parse(await fsp.readFile(catalogPath,"utf8"));
  if(!Array.isArray(catalog.tracks)) catalog.tracks=[];

  const existingHashes=new Set(
    catalog.tracks.map(track=>String(track?.fingerprint?.sha256||"").toLowerCase()).filter(Boolean)
  );
  const files=await scanAudioFiles(resolvedSource);
  const added=[];
  const skipped=[];

  if(copyFiles&&!dryRun) await fsp.mkdir(musicDir,{recursive:true});

  for(const sourcePath of files){
    const hash=await sha256File(sourcePath);
    if(existingHashes.has(hash)){
      skipped.push({file:sourcePath,reason:"duplicate-hash"});
      continue;
    }

    const ext=path.extname(sourcePath).toLowerCase();
    const title=titleFromFilename(sourcePath);
    const safeName=`${slugify(title)}-${hash.slice(0,12)}${ext}`;
    const destination=path.join(musicDir,safeName);
    const statFile=await fsp.stat(sourcePath);

    const track={
      id:"suno-"+hash.slice(0,16),
      title,
      artist:"StanNet",
      path:"radio-server/music/"+safeName,
      blocks:inferBlocks(title),
      enabled:true,
      source:{
        platform:"Suno",
        originalFilename:path.basename(sourcePath),
        importedAt:new Date().toISOString()
      },
      rights:{
        type:"owned",
        source:"Suno · derechos declarados por el propietario de la biblioteca"
      },
      fingerprint:{
        sha256:hash,
        bytes:statFile.size
      }
    };

    if(copyFiles&&!dryRun) await fsp.copyFile(sourcePath,destination);
    catalog.tracks.push(track);
    existingHashes.add(hash);
    added.push(track);
  }

  catalog.version=Number(catalog.version||1)+(!dryRun&&added.length?1:0);
  catalog.updatedAt=new Date().toISOString();

  const authorized=catalog.tracks.filter(track=>{
    const rights=track?.rights||{};
    return track?.enabled!==false &&
      track?.path &&
      typeof rights.type==="string"&&rights.type.trim() &&
      typeof rights.source==="string"&&rights.source.trim();
  });

  const playlist=["#EXTM3U"];
  for(const track of authorized) playlist.push(...playlistLine(track));

  if(!dryRun){
    await fsp.writeFile(catalogPath,JSON.stringify(catalog,null,2)+"\n","utf8");
    await fsp.mkdir(path.dirname(playlistPath),{recursive:true});
    await fsp.writeFile(playlistPath,playlist.join("\n")+"\n","utf8");
  }

  return {
    sourceDir:resolvedSource,
    found:files.length,
    added:added.length,
    skipped:skipped.length,
    authorized:authorized.length,
    dryRun,
    tracks:added,
    skippedFiles:skipped
  };
}

function parseArgs(argv){
  const args={sourceDir:DEFAULT_WINDOWS_LIBRARY,copyFiles:true,dryRun:false};
  for(let i=0;i<argv.length;i++){
    const item=argv[i];
    if(item==="--dry-run") args.dryRun=true;
    else if(item==="--no-copy") args.copyFiles=false;
    else if(item==="--source"&&argv[i+1]) args.sourceDir=argv[++i];
    else if(!item.startsWith("--")) args.sourceDir=item;
  }
  return args;
}

async function main(){
  const args=parseArgs(process.argv.slice(2));
  console.log("StanNet Radio · Suno Library Importer");
  console.log("Origen:",args.sourceDir);
  const result=await importLibrary(args);
  console.log(`Encontradas: ${result.found}`);
  console.log(`Añadidas: ${result.added}`);
  console.log(`Duplicadas/omitidas: ${result.skipped}`);
  console.log(`Autorizadas en catálogo: ${result.authorized}`);
  if(result.dryRun) console.log("Modo DRY RUN: no se modificó ningún archivo.");
  else console.log("Catálogo y playlist actualizados.");
}

const isDirect=process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url);
if(isDirect){
  main().catch(error=>{
    console.error("ERROR:",error.message);
    process.exitCode=1;
  });
}
