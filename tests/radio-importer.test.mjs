import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { importLibrary, scanAudioFiles, SUPPORTED_EXTENSIONS } from "../radio-server/import-local-music.mjs";

const root=await fs.mkdtemp(path.join(os.tmpdir(),"stannet-radio-import-"));
const source=path.join(root,"source");
const repo=path.join(root,"repo");
await fs.mkdir(path.join(source,"album"),{recursive:true});
await fs.mkdir(path.join(repo,"radio-server","liquidsoap"),{recursive:true});
await fs.mkdir(path.join(repo,"radio-server","music"),{recursive:true});

await fs.writeFile(path.join(source,"01 Neon_Night.mp3"),"fake mp3 one");
await fs.writeFile(path.join(source,"album","Guitar-Sky.wav"),"fake wav two");
await fs.writeFile(path.join(source,"notes.txt"),"ignore me");

await fs.writeFile(path.join(repo,"radio-catalog.json"),JSON.stringify({
  version:1,
  station:"StanNet Radio",
  policy:{requireRights:true,excludedPaths:["sanacion/"]},
  tracks:[]
},null,2));

assert(SUPPORTED_EXTENSIONS.has(".mp3"));
const scanned=await scanAudioFiles(source);
assert.equal(scanned.length,2);

const first=await importLibrary({sourceDir:source,repoRoot:repo,copyFiles:true});
assert.equal(first.found,2);
assert.equal(first.added,2);
assert.equal(first.skipped,0);
assert.equal(first.authorized,2);

const catalog=JSON.parse(await fs.readFile(path.join(repo,"radio-catalog.json"),"utf8"));
assert.equal(catalog.tracks.length,2);
assert(catalog.tracks.every(track=>track.rights.type==="owned"));
assert(catalog.tracks.every(track=>track.rights.source.includes("Suno")));
assert(catalog.tracks.some(track=>track.blocks.includes("NIGHT")));
assert(catalog.tracks.some(track=>track.blocks.includes("GUITAR")));

const playlist=await fs.readFile(path.join(repo,"radio-server","liquidsoap","playlist.m3u"),"utf8");
assert(playlist.includes("#EXTM3U"));
assert(playlist.includes("/music/"));

const second=await importLibrary({sourceDir:source,repoRoot:repo,copyFiles:true});
assert.equal(second.added,0);
assert.equal(second.skipped,2);

const files=await fs.readdir(path.join(repo,"radio-server","music"));
assert.equal(files.length,2);

await fs.rm(root,{recursive:true,force:true});
console.log("PASS: StanNet Radio local Suno importer, rights metadata and deduplication verified.");
