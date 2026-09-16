use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{collections::HashMap, env, fs::{self, File}, io::{self, Read}, path::{Path, PathBuf}, time::{Duration, SystemTime}};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize)]
pub struct CleanCandidate { pub path:String, pub size:u64, pub category:String, pub age_days:u64, pub selected:bool }
#[derive(Debug, Serialize)] pub struct CategorySummary { pub category:String, pub files:u64, pub bytes:u64 }
#[derive(Debug, Serialize)] pub struct CleanerReport { pub candidates:Vec<CleanCandidate>, pub categories:Vec<CategorySummary>, pub total_files:u64, pub total_bytes:u64 }
#[derive(Debug, Serialize)] pub struct DeleteReport { pub deleted:u64, pub failed:u64, pub freed_bytes:u64, pub errors:Vec<String> }
#[derive(Debug, Serialize)] pub struct LargeFile { pub path:String, pub size:u64 }
#[derive(Debug, Serialize)] pub struct DuplicateGroup { pub sha256:String, pub size:u64, pub paths:Vec<String>, pub reclaimable_bytes:u64 }

fn canonical_allowed(path:&Path, roots:&[PathBuf])->bool { let Ok(p)=path.canonicalize() else{return false}; roots.iter().filter_map(|r|r.canonicalize().ok()).any(|r|p.starts_with(r)) }
fn days_old(meta:&fs::Metadata)->u64 { let now=SystemTime::now(); meta.modified().ok().and_then(|m|now.duration_since(m).ok()).unwrap_or_default().as_secs()/86400 }
fn push_root(v:&mut Vec<(String,PathBuf,u64)>, category:&str, path:PathBuf, min_days:u64){if path.exists(){v.push((category.into(),path,min_days));}}

pub fn safe_clean_roots()->Vec<(String,PathBuf,u64)>{
 let mut v=Vec::new(); push_root(&mut v,"Temporales de usuario",env::temp_dir(),1);
 if let Ok(local)=env::var("LOCALAPPDATA") { let p=PathBuf::from(local); push_root(&mut v,"Cache de miniaturas",p.join("Microsoft/Windows/Explorer"),7); push_root(&mut v,"Crash dumps",p.join("CrashDumps"),7); }
 if let Ok(windir)=env::var("WINDIR") { let p=PathBuf::from(windir); push_root(&mut v,"Temporales de Windows",p.join("Temp"),7); }
 v
}
pub fn allowed_clean_roots()->Vec<PathBuf>{safe_clean_roots().into_iter().map(|(_,p,_)|p).collect()}

pub fn analyze_suite()->io::Result<CleanerReport>{
 let mut candidates=Vec::new();
 for (category,root,min_days) in safe_clean_roots(){
  for e in WalkDir::new(&root).follow_links(false).max_depth(12).into_iter().filter_map(Result::ok){
   if !e.file_type().is_file(){continue} let Ok(meta)=e.metadata() else{continue}; let age=days_old(&meta); if age<min_days{continue}
   candidates.push(CleanCandidate{path:e.path().display().to_string(),size:meta.len(),category:category.clone(),age_days:age,selected:true});
  }
 }
 let mut map:HashMap<String,(u64,u64)>=HashMap::new(); for c in &candidates {let x=map.entry(c.category.clone()).or_default();x.0+=1;x.1+=c.size;}
 let mut categories=map.into_iter().map(|(category,(files,bytes))|CategorySummary{category,files,bytes}).collect::<Vec<_>>(); categories.sort_by(|a,b|b.bytes.cmp(&a.bytes));
 let total_files=candidates.len() as u64; let total_bytes=candidates.iter().map(|c|c.size).sum(); Ok(CleanerReport{candidates,categories,total_files,total_bytes})
}

pub fn analyze_old_files(root:&Path,min_age:Duration)->io::Result<Vec<CleanCandidate>>{let root=root.canonicalize()?;let days=min_age.as_secs()/86400;let mut out=Vec::new();for e in WalkDir::new(&root).follow_links(false).into_iter().filter_map(Result::ok){if !e.file_type().is_file(){continue}let m=e.metadata()?;let age=days_old(&m);if age>=days{out.push(CleanCandidate{path:e.path().display().to_string(),size:m.len(),category:"Personalizado".into(),age_days:age,selected:true})}}Ok(out)}

pub fn delete_safe(paths:&[PathBuf])->DeleteReport { let roots=allowed_clean_roots(); let mut r=DeleteReport{deleted:0,failed:0,freed_bytes:0,errors:vec![]}; for p in paths { if !canonical_allowed(p,&roots){r.failed+=1;r.errors.push(format!("Fuera de rutas seguras: {}",p.display()));continue} let Ok(m)=fs::symlink_metadata(p)else{r.failed+=1;continue}; if !m.file_type().is_file(){r.failed+=1;continue} match fs::remove_file(p){Ok(_)=>{r.deleted+=1;r.freed_bytes+=m.len()},Err(e)=>{r.failed+=1;r.errors.push(format!("{}: {}",p.display(),e))}} } r }
pub fn delete_selected(paths:&[PathBuf],allowed_roots:&[PathBuf])->io::Result<u64>{let mut freed=0;for p in paths{if !canonical_allowed(p,allowed_roots){return Err(io::Error::new(io::ErrorKind::PermissionDenied,"cleaner path is outside allowlisted roots"))}let m=fs::symlink_metadata(p)?;if !m.file_type().is_file(){return Err(io::Error::new(io::ErrorKind::InvalidInput,"cleaner deletes regular files only"))}freed+=m.len();fs::remove_file(p)?;}Ok(freed)}

pub fn find_large_files(root:&Path,min_bytes:u64)->io::Result<Vec<LargeFile>>{let mut out=Vec::new();for e in WalkDir::new(root).follow_links(false).max_depth(32).into_iter().filter_map(Result::ok){if !e.file_type().is_file(){continue}let Ok(m)=e.metadata()else{continue};if m.len()>=min_bytes{out.push(LargeFile{path:e.path().display().to_string(),size:m.len()})}}out.sort_by(|a,b|b.size.cmp(&a.size));out.truncate(500);Ok(out)}
fn file_hash(path:&Path)->io::Result<String>{let mut f=File::open(path)?;let mut h=Sha256::new();let mut buf=[0u8;65536];loop{let n=f.read(&mut buf)?;if n==0{break}h.update(&buf[..n]);}Ok(format!("{:x}",h.finalize()))}
pub fn find_duplicates(root:&Path,min_bytes:u64)->io::Result<Vec<DuplicateGroup>>{let mut by_size:HashMap<u64,Vec<PathBuf>>=HashMap::new();for e in WalkDir::new(root).follow_links(false).max_depth(32).into_iter().filter_map(Result::ok){if !e.file_type().is_file(){continue}let Ok(m)=e.metadata()else{continue};if m.len()>=min_bytes{by_size.entry(m.len()).or_default().push(e.into_path())}}let mut groups=Vec::new();for (size,paths) in by_size.into_iter().filter(|(_,p)|p.len()>1){let mut hashes:HashMap<String,Vec<String>>=HashMap::new();for p in paths{if let Ok(h)=file_hash(&p){hashes.entry(h).or_default().push(p.display().to_string())}}for (sha256,paths) in hashes.into_iter().filter(|(_,p)|p.len()>1){groups.push(DuplicateGroup{sha256,size,reclaimable_bytes:size*((paths.len()-1) as u64),paths})}}groups.sort_by(|a,b|b.reclaimable_bytes.cmp(&a.reclaimable_bytes));Ok(groups)}
pub fn default_user_temp()->PathBuf{env::temp_dir()}

#[cfg(test)] mod tests{use super::*;#[test]fn refuses_file_outside_allowlist(){let base=env::temp_dir().join(format!("stannet-cleaner-test-{}",std::process::id()));let allowed=base.join("allowed");let outside=base.join("outside");fs::create_dir_all(&allowed).unwrap();fs::create_dir_all(&outside).unwrap();let file=outside.join("keep.txt");fs::write(&file,b"keep").unwrap();assert!(delete_selected(&[file.clone()],&[allowed]).is_err());assert!(file.exists());let _=fs::remove_dir_all(base);}}
