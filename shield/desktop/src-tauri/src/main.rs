#[path = "../../src/quarantine.rs"] mod quarantine;
#[path = "../../src/cleaner.rs"] mod cleaner;

use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{fs::File, io::Read, path::{Path, PathBuf}, time::Duration};
use walkdir::WalkDir;

const RULES: &str = include_str!("../../rules/default.yar");
const MAX_FILE_BYTES:u64=1024*1024*1024;
const MAX_YARA_BYTES:u64=64*1024*1024;
const READ_BUFFER_BYTES:usize=64*1024;
#[derive(Serialize)] struct ScanResult{path:String,size:u64,sha256:String,status:String,matches:Vec<String>,note:String}

fn scan_one(path:&Path,rules:&yara_x::Rules)->Result<ScanResult,String>{
 let meta=std::fs::symlink_metadata(path).map_err(|e|e.to_string())?;
 if meta.file_type().is_symlink(){return Err("symlink targets are not scanned".into())}
 if !meta.is_file(){return Err("not a regular file".into())}
 if meta.len()>MAX_FILE_BYTES{return Ok(ScanResult{path:path.display().to_string(),size:meta.len(),sha256:String::new(),status:"skipped".into(),matches:vec![],note:"file exceeds 1 GiB safety limit".into()})}
 let yara_enabled=meta.len()<=MAX_YARA_BYTES;
 let mut f=File::open(path).map_err(|e|e.to_string())?;let mut h=Sha256::new();let mut bytes=if yara_enabled{Vec::with_capacity(meta.len() as usize)}else{Vec::new()};let mut buf=[0u8;READ_BUFFER_BYTES];
 loop{let n=f.read(&mut buf).map_err(|e|e.to_string())?;if n==0{break}h.update(&buf[..n]);if yara_enabled{bytes.extend_from_slice(&buf[..n]);}}
 let sha256=format!("{:x}",h.finalize());
 if !yara_enabled{return Ok(ScanResult{path:path.display().to_string(),size:meta.len(),sha256,status:"hashed-yara-skipped".into(),matches:vec![],note:"SHA-256 completed. YARA-X skipped above the 64 MiB in-memory safety limit.".into()})}
 let mut scanner=yara_x::Scanner::new(rules);scanner.set_timeout(Duration::from_secs(30));let result=scanner.scan(&bytes).map_err(|e|e.to_string())?;
 let matches=result.matching_rules().map(|r|r.identifier().to_string()).collect::<Vec<_>>();let status=if matches.is_empty(){"no-rule-match"}else{"review"};
 Ok(ScanResult{path:path.display().to_string(),size:meta.len(),sha256,status:status.into(),matches,note:"Static defensive analysis only. No file was executed. A no-match result does not guarantee safety.".into()})
}
#[tauri::command] fn scan_target(path:String)->Result<Vec<ScanResult>,String>{let root=PathBuf::from(path);if !root.exists(){return Err("target does not exist".into())}let rules=yara_x::compile(RULES).map_err(|e|e.to_string())?;let paths=if root.is_file(){vec![root]}else{WalkDir::new(root).follow_links(false).max_depth(64).into_iter().filter_map(Result::ok).filter(|e|e.file_type().is_file()).map(|e|e.into_path()).collect()};paths.iter().map(|p|scan_one(p,&rules)).collect()}
#[tauri::command] fn quarantine_target(path:String,reason:String)->Result<quarantine::QuarantineRecord,String>{let root=std::env::temp_dir().join("StanNetShield").join("quarantine");quarantine::quarantine_file(Path::new(&path),&root,&reason).map_err(|e|e.to_string())}
#[tauri::command] fn analyze_cleaner()->Result<Vec<cleaner::CleanCandidate>,String>{
 let mut items=cleaner::analyze_old_files(&cleaner::default_user_temp(),Duration::from_secs(7*24*60*60)).map_err(|e|e.to_string())?;
 items.sort_by(|a,b|b.size.cmp(&a.size));
 items.truncate(500);
 Ok(items)
}
#[tauri::command] fn cleaner_delete_selected(paths:Vec<String>)->Result<u64,String>{
 if paths.is_empty(){return Err("no cleaner files selected".into())}
 if paths.len()>500{return Err("too many cleaner files selected".into())}
 let selected=paths.into_iter().map(PathBuf::from).collect::<Vec<_>>();
 cleaner::delete_selected(&selected,&[cleaner::default_user_temp()]).map_err(|e|e.to_string())
}
#[tauri::command] fn restore_quarantine(record_path:String)->Result<String,String>{
 quarantine::restore_file(Path::new(&record_path)).map(|p|p.display().to_string()).map_err(|e|e.to_string())
}
fn main(){tauri::Builder::default().invoke_handler(tauri::generate_handler![scan_target,quarantine_target,analyze_cleaner,cleaner_delete_selected,restore_quarantine]).run(tauri::generate_context!()).expect("error while running StanNet Shield")}
