use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{env, fs::File, io::{self, Read}, path::{Path, PathBuf}};
use walkdir::WalkDir;

const MAX_FILE_BYTES: u64 = 1024 * 1024 * 1024;
const RULES: &str = include_str!("../rules/default.yar");

#[derive(Serialize)]
struct ScanResult {
    path: String,
    size: u64,
    sha256: String,
    status: String,
    matches: Vec<String>,
    note: String,
}

fn scan_file(path: &Path, rules: &yara_x::Rules) -> Result<ScanResult, Box<dyn std::error::Error>> {
    let meta = path.metadata()?;
    if !meta.is_file() { return Err(io::Error::new(io::ErrorKind::InvalidInput, "not a regular file").into()); }
    if meta.len() > MAX_FILE_BYTES {
        return Ok(ScanResult { path:path.display().to_string(), size:meta.len(), sha256:String::new(), status:"skipped".into(), matches:vec![], note:"file exceeds 1 GiB safety limit".into() });
    }

    let mut f=File::open(path)?;
    let mut hasher=Sha256::new();
    let mut bytes=Vec::with_capacity(meta.len().min(64 * 1024 * 1024) as usize);
    let mut buf=[0u8; 1024*1024];
    loop {
        let n=f.read(&mut buf)?;
        if n==0 { break; }
        hasher.update(&buf[..n]);
        bytes.extend_from_slice(&buf[..n]);
    }

    let results = rules.scan(&bytes)?;
    let matches: Vec<String> = results.matching_rules().map(|r| r.identifier().to_string()).collect();
    let status = if matches.is_empty() { "no-rule-match" } else { "review" };
    Ok(ScanResult {
        path:path.display().to_string(),
        size:meta.len(),
        sha256:format!("{:x}",hasher.finalize()),
        status:status.into(),
        matches,
        note:"Static defensive analysis only. No file was executed, modified or deleted. A no-match result does not guarantee safety.".into(),
    })
}

fn targets(root:&Path)->Vec<PathBuf>{
    if root.is_file(){return vec![root.to_path_buf()]}
    WalkDir::new(root).follow_links(false).max_depth(64).into_iter().filter_map(Result::ok).filter(|e|e.file_type().is_file()).map(|e|e.into_path()).collect()
}

fn main(){
    let Some(arg)=env::args().nth(1) else { eprintln!("Usage: stannet-shield <file-or-folder>"); std::process::exit(2); };
    let root=PathBuf::from(arg);
    if !root.exists(){eprintln!("Target does not exist");std::process::exit(2)}
    let rules = match yara_x::compile(RULES) { Ok(r)=>r, Err(e)=>{eprintln!("YARA-X rules failed to compile: {e}");std::process::exit(3)} };
    for path in targets(&root){
        match scan_file(&path,&rules){
            Ok(r)=>println!("{}",serde_json::to_string(&r).unwrap()),
            Err(e)=>eprintln!("{}: {}",path.display(),e),
        }
    }
}
