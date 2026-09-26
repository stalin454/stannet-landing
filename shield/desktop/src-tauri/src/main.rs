#[path = "../../src/quarantine.rs"] mod quarantine;
#[path = "../../src/cleaner.rs"] mod cleaner;
mod defender;
mod history;

use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{
    fs::{self, File},
    io::Read,
    path::{Path, PathBuf},
    time::Duration
};
use walkdir::WalkDir;

const RULES: &str = include_str!("../../rules/default.yar");
const MAX_FILE_BYTES: u64 = 1024 * 1024 * 1024;
const MAX_YARA_BYTES: u64 = 64 * 1024 * 1024;
const MAX_SCAN_FILES: usize = 10_000;
const READ_BUFFER_BYTES: usize = 64 * 1024;

#[derive(Serialize)]
struct ScanResult {
    path: String,
    size: u64,
    sha256: String,
    status: String,
    matches: Vec<String>,
    note: String,
}

#[derive(Serialize)]
struct QuarantineListItem {
    record_path: String,
    record: quarantine::QuarantineRecord,
}

fn shield_root() -> PathBuf {
    std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
        .join("StanNetShield")
}

fn quarantine_root() -> PathBuf {
    shield_root().join("quarantine")
}

fn scan_one(path: &Path, rules: &yara_x::Rules) -> Result<ScanResult, String> {
    let meta = fs::symlink_metadata(path).map_err(|e| e.to_string())?;
    if meta.file_type().is_symlink() {
        return Err("symlink targets are not scanned".into());
    }
    if !meta.is_file() {
        return Err("not a regular file".into());
    }
    if meta.len() > MAX_FILE_BYTES {
        return Ok(ScanResult {
            path: path.display().to_string(),
            size: meta.len(),
            sha256: String::new(),
            status: "skipped".into(),
            matches: vec![],
            note: "file exceeds 1 GiB safety limit".into(),
        });
    }

    let yara_enabled = meta.len() <= MAX_YARA_BYTES;
    let mut f = File::open(path).map_err(|e| e.to_string())?;
    let mut h = Sha256::new();
    let mut bytes = if yara_enabled {
        Vec::with_capacity(meta.len() as usize)
    } else {
        Vec::new()
    };
    let mut buf = [0u8; READ_BUFFER_BYTES];

    loop {
        let n = f.read(&mut buf).map_err(|e| e.to_string())?;
        if n == 0 { break; }
        h.update(&buf[..n]);
        if yara_enabled { bytes.extend_from_slice(&buf[..n]); }
    }

    let sha256 = format!("{:x}", h.finalize());
    if !yara_enabled {
        return Ok(ScanResult {
            path: path.display().to_string(),
            size: meta.len(),
            sha256,
            status: "hashed-yara-skipped".into(),
            matches: vec![],
            note: "SHA-256 completed. YARA-X skipped above the 64 MiB in-memory safety limit.".into(),
        });
    }

    let mut scanner = yara_x::Scanner::new(rules);
    scanner.set_timeout(Duration::from_secs(30));
    let result = scanner.scan(&bytes).map_err(|e| e.to_string())?;
    let matches = result.matching_rules().map(|r| r.identifier().to_string()).collect::<Vec<_>>();
    let status = if matches.is_empty() { "no-rule-match" } else { "review" };

    Ok(ScanResult {
        path: path.display().to_string(),
        size: meta.len(),
        sha256,
        status: status.into(),
        matches,
        note: "Static defensive analysis only. No file was executed. A no-match result does not guarantee safety.".into(),
    })
}

#[tauri::command]
fn scan_target(path: String) -> Result<Vec<ScanResult>, String> {
    let root = PathBuf::from(&path);
    if !root.exists() { return Err("target does not exist".into()); }
    let rules = yara_x::compile(RULES).map_err(|e| e.to_string())?;
    let paths = if root.is_file() {
        vec![root]
    } else {
        WalkDir::new(root)
            .follow_links(false)
            .max_depth(64)
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.file_type().is_file())
            .take(MAX_SCAN_FILES)
            .map(|e| e.into_path())
            .collect()
    };
    let results: Result<Vec<_>, _> = paths.iter().map(|p| scan_one(p, &rules)).collect();
    if let Ok(ref items) = results {
        let review_count = items.iter().filter(|x| x.status == "review").count();
        let _ = history::record("scan", &format!("target={path}; files={}; review={review_count}", items.len()));
    }
    results
}

#[tauri::command]
fn quarantine_target(path: String, reason: String) -> Result<quarantine::QuarantineRecord, String> {
    let result = quarantine::quarantine_file(Path::new(&path), &quarantine_root(), &reason).map_err(|e| e.to_string())?;
    let _ = history::record("quarantine", &format!("{} · {}", result.original_path, result.sha256));
    Ok(result)
}

#[tauri::command]
fn list_quarantine() -> Result<Vec<QuarantineListItem>, String> {
    let root = quarantine_root();
    if !root.exists() { return Ok(Vec::new()); }
    let mut out = Vec::new();
    for entry in fs::read_dir(root).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if !entry.path().is_dir() { continue; }
        let record_path = entry.path().join("record.json");
        if !record_path.exists() { continue; }
        if let Ok(bytes) = fs::read(&record_path) {
            if let Ok(record) = serde_json::from_slice::<quarantine::QuarantineRecord>(&bytes) {
                out.push(QuarantineListItem {
                    record_path: record_path.display().to_string(),
                    record,
                });
            }
        }
    }
    out.sort_by(|a, b| b.record.created_unix.cmp(&a.record.created_unix));
    Ok(out)
}

#[tauri::command]
fn restore_quarantine(record_path: String) -> Result<String, String> {
    let restored = quarantine::restore_file(Path::new(&record_path))
        .map(|p| p.display().to_string())
        .map_err(|e| e.to_string())?;
    let _ = history::record("restore", &restored);
    Ok(restored)
}

#[tauri::command]
fn analyze_cleaner() -> Result<Vec<cleaner::CleanCandidate>, String> {
    let mut items = cleaner::analyze_old_files(
        &cleaner::default_user_temp(),
        Duration::from_secs(7 * 24 * 60 * 60),
    ).map_err(|e| e.to_string())?;
    items.sort_by(|a, b| b.size.cmp(&a.size));
    items.truncate(500);
    let total: u64 = items.iter().map(|x| x.size).sum();
    let _ = history::record("cleaner-analyze", &format!("candidates={}; bytes={total}", items.len()));
    Ok(items)
}

#[tauri::command]
fn cleaner_delete_selected(paths: Vec<String>) -> Result<u64, String> {
    if paths.is_empty() { return Err("no cleaner files selected".into()); }
    if paths.len() > 500 { return Err("too many cleaner files selected".into()); }
    let selected = paths.into_iter().map(PathBuf::from).collect::<Vec<_>>();
    let bytes = cleaner::delete_selected(&selected, &[cleaner::default_user_temp()]).map_err(|e| e.to_string())?;
    let _ = history::record("cleaner-delete", &format!("files={}; bytes={bytes}", selected.len()));
    Ok(bytes)
}

#[tauri::command]
fn defender_status() -> Result<serde_json::Value, String> {
    defender::status()
}

#[tauri::command]
fn defender_quick_scan() -> Result<String, String> {
    let result = defender::quick_scan()?;
    let _ = history::record("defender-quick-scan", &result);
    Ok(result)
}

#[tauri::command]
fn defender_update_signatures() -> Result<String, String> {
    let result = defender::update_signatures()?;
    let _ = history::record("defender-update", &result);
    Ok(result)
}

#[tauri::command]
fn history_list() -> Result<Vec<history::HistoryEvent>, String> {
    history::list(250).map_err(|e| e.to_string())
}

#[tauri::command]
fn history_clear() -> Result<(), String> {
    history::clear().map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            scan_target,
            quarantine_target,
            list_quarantine,
            restore_quarantine,
            analyze_cleaner,
            cleaner_delete_selected,
            defender_status,
            defender_quick_scan,
            defender_update_signatures,
            history_list,
            history_clear
        ])
        .run(tauri::generate_context!())
        .expect("error while running StanNet Shield");
}
