use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::{fs, io, path::{Path, PathBuf}, time::{SystemTime, UNIX_EPOCH}};

#[derive(Debug, Serialize, Deserialize)]
pub struct QuarantineRecord {
    pub id: String,
    pub original_path: String,
    pub stored_path: String,
    pub sha256: String,
    pub created_unix: u64,
    pub reason: String,
}

fn hash_bytes(bytes: &[u8]) -> String { format!("{:x}", Sha256::digest(bytes)) }

pub fn quarantine_file(source: &Path, root: &Path, reason: &str) -> io::Result<QuarantineRecord> {
    let source = source.canonicalize()?;
    if !source.is_file() { return Err(io::Error::new(io::ErrorKind::InvalidInput, "source is not a regular file")); }
    fs::create_dir_all(root)?;
    let bytes = fs::read(&source)?;
    let sha256 = hash_bytes(&bytes);
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    let id = format!("{}-{}", now, &sha256[..16]);
    let item_dir = root.join(&id);
    fs::create_dir(&item_dir)?;
    let stored = item_dir.join("payload.quarantine");
    fs::write(&stored, &bytes)?;
    let record = QuarantineRecord { id, original_path: source.display().to_string(), stored_path: stored.display().to_string(), sha256, created_unix: now, reason: reason.to_string() };
    fs::write(item_dir.join("record.json"), serde_json::to_vec_pretty(&record)?)?;
    fs::remove_file(&source)?;
    Ok(record)
}

pub fn restore_file(record_path: &Path) -> io::Result<PathBuf> {
    let record: QuarantineRecord = serde_json::from_slice(&fs::read(record_path)?)?;
    let stored = PathBuf::from(&record.stored_path);
    let destination = PathBuf::from(&record.original_path);
    if destination.exists() { return Err(io::Error::new(io::ErrorKind::AlreadyExists, "restore destination already exists")); }
    let bytes = fs::read(&stored)?;
    if hash_bytes(&bytes) != record.sha256 { return Err(io::Error::new(io::ErrorKind::InvalidData, "quarantine integrity check failed")); }
    if let Some(parent) = destination.parent() { fs::create_dir_all(parent)?; }
    fs::write(&destination, bytes)?;
    fs::remove_file(stored)?;
    Ok(destination)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn quarantine_and_restore_roundtrip() {
        let base = std::env::temp_dir().join(format!("stannet-shield-test-{}", std::process::id()));
        let _ = fs::remove_dir_all(&base); fs::create_dir_all(&base).unwrap();
        let source = base.join("fixture.txt"); fs::write(&source, b"benign quarantine fixture").unwrap();
        let qroot = base.join("quarantine");
        let record = quarantine_file(&source, &qroot, "test only").unwrap();
        assert!(!source.exists());
        let record_path = qroot.join(&record.id).join("record.json");
        let restored = restore_file(&record_path).unwrap();
        assert_eq!(restored, source); assert_eq!(fs::read(&source).unwrap(), b"benign quarantine fixture");
        let _ = fs::remove_dir_all(base);
    }
}
