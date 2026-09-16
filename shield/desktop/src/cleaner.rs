use serde::Serialize;
use std::{fs, io, path::{Path, PathBuf}, time::{Duration, SystemTime}};
use walkdir::WalkDir;

#[derive(Debug, Serialize)]
pub struct CleanCandidate { pub path: String, pub size: u64 }

fn is_allowed(path: &Path, allowed_roots: &[PathBuf]) -> bool {
    let Ok(path) = path.canonicalize() else { return false };
    allowed_roots.iter().filter_map(|r| r.canonicalize().ok()).any(|r| path.starts_with(r))
}

pub fn analyze_old_files(root: &Path, min_age: Duration) -> io::Result<Vec<CleanCandidate>> {
    let root = root.canonicalize()?;
    let now = SystemTime::now();
    let mut out = Vec::new();
    for entry in WalkDir::new(&root).follow_links(false).into_iter().filter_map(Result::ok) {
        if !entry.file_type().is_file() { continue; }
        let meta = entry.metadata()?;
        let modified = meta.modified().unwrap_or(now);
        if now.duration_since(modified).unwrap_or_default() >= min_age {
            out.push(CleanCandidate { path: entry.path().display().to_string(), size: meta.len() });
        }
    }
    Ok(out)
}

pub fn delete_selected(paths: &[PathBuf], allowed_roots: &[PathBuf]) -> io::Result<u64> {
    let mut freed = 0;
    for path in paths {
        if !is_allowed(path, allowed_roots) { return Err(io::Error::new(io::ErrorKind::PermissionDenied, "cleaner path is outside allowlisted roots")); }
        let meta = fs::symlink_metadata(path)?;
        if !meta.file_type().is_file() { return Err(io::Error::new(io::ErrorKind::InvalidInput, "cleaner deletes regular files only")); }
        freed += meta.len(); fs::remove_file(path)?;
    }
    Ok(freed)
}

pub fn default_user_temp() -> PathBuf { std::env::temp_dir() }

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn refuses_file_outside_allowlist() {
        let base = std::env::temp_dir().join(format!("stannet-cleaner-test-{}", std::process::id()));
        let allowed = base.join("allowed"); let outside = base.join("outside");
        fs::create_dir_all(&allowed).unwrap(); fs::create_dir_all(&outside).unwrap();
        let file = outside.join("keep.txt"); fs::write(&file, b"keep").unwrap();
        assert!(delete_selected(&[file.clone()], &[allowed]).is_err()); assert!(file.exists());
        let _ = fs::remove_dir_all(base);
    }
}
