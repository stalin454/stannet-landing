#[path = "../../src/quarantine.rs"] mod quarantine;
#[path = "../../src/cleaner.rs"] mod cleaner;

use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{fs::File, io::Read, path::{Path, PathBuf}, time::Duration};
use walkdir::WalkDir;

const RULES: &str = include_str!("../../rules/default.yar");
const MAX_FILE_BYTES:u64=1024*1024*1024;
#[derive(Serialize)] struct ScanResult{path:String,size:u64,sha256:String,status:String,matches:Vec<String>}

fn scan_one(path:&Path,rules:&yara_x::Rules)->Result<ScanResult,String>{
 let meta=path.metadata().map_err(|e|e.to_string())?;if !meta.is_file(){return Err("not a regular file".into())}if meta.len()>MAX_FILE_BYTES{return Err("file exceeds 1 GiB safety limit".into())}
 let mut f=File::open(path).map_err(|e|e.to_string())?;let mut h=Sha256::new();let mut bytes=Vec::new();let mut buf=[0u8;1024*1024];loop{let n=f.read(&mut buf).map_err(|e|e.to_string())?;if n==0{break}h.update(&buf[..n]);bytes.extend_from_slice(&buf[..n]);}
 let result=rules.scan(&bytes).map_err(|e|e.to_string())?;let matches=result.matching_rules().map(|r|r.identifier().to_string()).collect::<Vec<_>>();let status=if matches.is_empty(){"no-rule-match"}else{"review"};Ok(ScanResult{path:path.display().to_string(),size:meta.len(),sha256:format!("{:x}",h.finalize()),status:status.into(),matches})
}
#[tauri::command] fn scan_target(path:String)->Result<Vec<ScanResult>,String>{let root=PathBuf::from(path);if !root.exists(){return Err("target does not exist".into())}let rules=yara_x::compile(RULES).map_err(|e|e.to_string())?;let paths=if root.is_file(){vec![root]}else{WalkDir::new(root).follow_links(false).max_depth(64).into_iter().filter_map(Result::ok).filter(|e|e.file_type().is_file()).map(|e|e.into_path()).collect()};paths.iter().map(|p|scan_one(p,&rules)).collect()}
#[tauri::command] fn quarantine_target(path:String,reason:String)->Result<quarantine::QuarantineRecord,String>{let root=std::env::temp_dir().join("StanNetShield").join("quarantine");quarantine::quarantine_file(Path::new(&path),&root,&reason).map_err(|e|e.to_string())}
#[tauri::command] fn analyze_cleaner()->Result<Vec<cleaner::CleanCandidate>,String>{cleaner::analyze_old_files(&cleaner::default_user_temp(),Duration::from_secs(7*24*60*60)).map_err(|e|e.to_string())}
fn main(){tauri::Builder::default().invoke_handler(tauri::generate_handler![scan_target,quarantine_target,analyze_cleaner]).run(tauri::generate_context!()).expect("error while running StanNet Shield")}
