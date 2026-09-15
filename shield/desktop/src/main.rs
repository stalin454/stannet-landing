use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{env, fs::File, io::{self, Read}, path::{Path, PathBuf}};
use walkdir::WalkDir;

const MAX_FILE_BYTES: u64 = 1024 * 1024 * 1024;

#[derive(Serialize)]
struct ScanResult { path: String, size: u64, sha256: String, status: String, note: String }

fn hash_file(path: &Path) -> io::Result<ScanResult> {
    let meta = path.metadata()?;
    if !meta.is_file() { return Err(io::Error::new(io::ErrorKind::InvalidInput, "not a regular file")); }
    if meta.len() > MAX_FILE_BYTES {
        return Ok(ScanResult { path:path.display().to_string(), size:meta.len(), sha256:String::new(), status:"skipped".into(), note:"file exceeds 1 GiB safety limit".into() });
    }
    let mut f=File::open(path)?; let mut hasher=Sha256::new(); let mut buf=[0u8; 1024*1024];
    loop { let n=f.read(&mut buf)?; if n==0 { break; } hasher.update(&buf[..n]); }
    Ok(ScanResult { path:path.display().to_string(), size:meta.len(), sha256:format!("{:x}",hasher.finalize()), status:"hashed".into(), note:"YARA-X evaluation is the next engine stage; no file was executed or modified".into() })
}

fn targets(root:&Path)->Vec<PathBuf>{
    if root.is_file(){return vec![root.to_path_buf()]}
    WalkDir::new(root).follow_links(false).max_depth(64).into_iter().filter_map(Result::ok).filter(|e|e.file_type().is_file()).map(|e|e.into_path()).collect()
}

fn main(){
    let Some(arg)=env::args().nth(1) else { eprintln!("Usage: stannet-shield <file-or-folder>"); std::process::exit(2); };
    let root=PathBuf::from(arg);
    if !root.exists(){eprintln!("Target does not exist");std::process::exit(2)}
    for path in targets(&root){match hash_file(&path){Ok(r)=>println!("{}",serde_json::to_string(&r).unwrap()),Err(e)=>eprintln!("{}: {}",path.display(),e)}}
}
