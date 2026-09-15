mod quarantine;
mod cleaner;

use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{env, fs::File, io::{self, Read}, path::{Path, PathBuf}, time::Duration};
use walkdir::WalkDir;

const MAX_FILE_BYTES: u64 = 1024 * 1024 * 1024;
const MAX_YARA_BYTES: u64 = 64 * 1024 * 1024;
const RULES: &str = include_str!("../rules/default.yar");

#[derive(Serialize)]
struct ScanResult { path:String, size:u64, sha256:String, status:String, matches:Vec<String>, note:String }

fn scan_file(path:&Path,rules:&yara_x::Rules)->Result<ScanResult,Box<dyn std::error::Error>>{
 let meta=std::fs::symlink_metadata(path)?;
 if meta.file_type().is_symlink(){return Err(io::Error::new(io::ErrorKind::InvalidInput,"symlink targets are not scanned").into())}
 if !meta.is_file(){return Err(io::Error::new(io::ErrorKind::InvalidInput,"not a regular file").into())}
 if meta.len()>MAX_FILE_BYTES{return Ok(ScanResult{path:path.display().to_string(),size:meta.len(),sha256:String::new(),status:"skipped".into(),matches:vec![],note:"file exceeds 1 GiB safety limit".into()})}
 let yara_enabled=meta.len()<=MAX_YARA_BYTES;
 let mut f=File::open(path)?;let mut hasher=Sha256::new();let mut bytes=if yara_enabled{Vec::with_capacity(meta.len() as usize)}else{Vec::new()};let mut buf=[0u8;1024*1024];
 loop{let n=f.read(&mut buf)?;if n==0{break}hasher.update(&buf[..n]);if yara_enabled{bytes.extend_from_slice(&buf[..n]);}}
 let sha256=format!("{:x}",hasher.finalize());
 if !yara_enabled{return Ok(ScanResult{path:path.display().to_string(),size:meta.len(),sha256,status:"hashed-yara-skipped".into(),matches:vec![],note:"SHA-256 completed. YARA-X skipped above the 64 MiB in-memory safety limit.".into()})}
 let mut scanner=yara_x::Scanner::new(rules);
 scanner.set_timeout(Duration::from_secs(30));
 let results=scanner.scan(&bytes)?;
 let matches:Vec<String>=results.matching_rules().map(|r|r.identifier().to_string()).collect();let status=if matches.is_empty(){"no-rule-match"}else{"review"};
 Ok(ScanResult{path:path.display().to_string(),size:meta.len(),sha256,status:status.into(),matches,note:"Static defensive analysis only. No file was executed. A no-match result does not guarantee safety.".into()})
}
fn targets(root:&Path)->Vec<PathBuf>{if root.is_file(){return vec![root.to_path_buf()]}WalkDir::new(root).follow_links(false).max_depth(64).into_iter().filter_map(Result::ok).filter(|e|e.file_type().is_file()).map(|e|e.into_path()).collect()}
fn usage(){eprintln!("Usage: stannet-shield scan <file-or-folder> | quarantine <file> <quarantine-dir> <reason> | restore <record.json> | cleaner-analyze [temp-dir] | cleaner-delete <allowlisted-root> <file>...")}
fn main(){
 let args:Vec<String>=env::args().collect();if args.len()<2{usage();std::process::exit(2)}
 match args[1].as_str(){
  "scan"=>{let Some(arg)=args.get(2)else{usage();return};let root=PathBuf::from(arg);if !root.exists(){eprintln!("Target does not exist");std::process::exit(2)}let rules=yara_x::compile(RULES).unwrap_or_else(|e|{eprintln!("YARA-X rules failed to compile: {e}");std::process::exit(3)});for path in targets(&root){match scan_file(&path,&rules){Ok(r)=>println!("{}",serde_json::to_string(&r).unwrap()),Err(e)=>eprintln!("{}: {}",path.display(),e)}}},
  "quarantine"=>{if args.len()<5{usage();return}match quarantine::quarantine_file(Path::new(&args[2]),Path::new(&args[3]),&args[4]){Ok(r)=>println!("{}",serde_json::to_string_pretty(&r).unwrap()),Err(e)=>{eprintln!("Quarantine failed: {e}");std::process::exit(4)}}},
  "restore"=>{let Some(p)=args.get(2)else{usage();return};match quarantine::restore_file(Path::new(p)){Ok(dest)=>println!("restored: {}",dest.display()),Err(e)=>{eprintln!("Restore failed: {e}");std::process::exit(5)}}},
  "cleaner-analyze"=>{let root=args.get(2).map(PathBuf::from).unwrap_or_else(cleaner::default_user_temp);match cleaner::analyze_old_files(&root,Duration::from_secs(7*24*60*60)){Ok(items)=>println!("{}",serde_json::to_string_pretty(&items).unwrap()),Err(e)=>{eprintln!("Cleaner analysis failed: {e}");std::process::exit(6)}}},
  "cleaner-delete"=>{if args.len()<4{usage();return}let allowed=vec![PathBuf::from(&args[2])];let selected:Vec<PathBuf>=args[3..].iter().map(PathBuf::from).collect();match cleaner::delete_selected(&selected,&allowed){Ok(bytes)=>println!("freed_bytes: {bytes}"),Err(e)=>{eprintln!("Cleaner refused operation: {e}");std::process::exit(7)}}},
  _=>{usage();std::process::exit(2)}
 }
}
