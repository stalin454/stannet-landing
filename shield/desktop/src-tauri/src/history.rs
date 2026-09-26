use serde::{Deserialize, Serialize};
use std::{fs::{self, OpenOptions}, io::{self, Write}, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct HistoryEvent {
    pub timestamp: u64,
    pub action: String,
    pub detail: String,
}

fn root() -> PathBuf {
    std::env::var_os("LOCALAPPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(std::env::temp_dir)
        .join("StanNetShield")
}

fn file_path() -> PathBuf { root().join("history.jsonl") }

pub fn record(action: &str, detail: &str) -> io::Result<()> {
    fs::create_dir_all(root())?;
    let event = HistoryEvent {
        timestamp: SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs(),
        action: action.to_string(),
        detail: detail.chars().take(1000).collect(),
    };
    let mut file = OpenOptions::new().create(true).append(true).open(file_path())?;
    writeln!(file, "{}", serde_json::to_string(&event)?)?;
    Ok(())
}

pub fn list(limit: usize) -> io::Result<Vec<HistoryEvent>> {
    let path = file_path();
    if !path.exists() { return Ok(Vec::new()); }
    let text = fs::read_to_string(path)?;
    let mut items: Vec<HistoryEvent> = text.lines()
        .filter_map(|line| serde_json::from_str::<HistoryEvent>(line).ok())
        .collect();
    if items.len() > limit { items.drain(0..items.len()-limit); }
    items.reverse();
    Ok(items)
}

pub fn clear() -> io::Result<()> {
    let path = file_path();
    if path.exists() { fs::remove_file(path)?; }
    Ok(())
}
