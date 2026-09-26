use serde_json::Value;
use std::process::Command;

fn powershell(script: &str) -> Result<String, String> {
    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script])
        .output()
        .map_err(|e| format!("No se pudo iniciar PowerShell: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if stderr.is_empty() { "Microsoft Defender no respondió correctamente.".into() } else { stderr });
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

pub fn status() -> Result<Value, String> {
    let script = r#"
$ErrorActionPreference='Stop'
$s=Get-MpComputerStatus
[pscustomobject]@{
  AntivirusEnabled=$s.AntivirusEnabled
  AntispywareEnabled=$s.AntispywareEnabled
  RealTimeProtectionEnabled=$s.RealTimeProtectionEnabled
  BehaviorMonitorEnabled=$s.BehaviorMonitorEnabled
  IoavProtectionEnabled=$s.IoavProtectionEnabled
  NISEnabled=$s.NISEnabled
  AntivirusSignatureVersion=$s.AntivirusSignatureVersion
  AntivirusSignatureLastUpdated=$s.AntivirusSignatureLastUpdated
  QuickScanAge=$s.QuickScanAge
  FullScanAge=$s.FullScanAge
} | ConvertTo-Json -Compress
"#;
    let text = powershell(script)?;
    serde_json::from_str(&text).map_err(|e| format!("Respuesta de Defender no válida: {e}"))
}

pub fn quick_scan() -> Result<String, String> {
    powershell("$ErrorActionPreference='Stop'; Start-MpScan -ScanType QuickScan; 'Quick scan completado por Microsoft Defender.'")
}

pub fn update_signatures() -> Result<String, String> {
    powershell("$ErrorActionPreference='Stop'; Update-MpSignature; 'Firmas de Microsoft Defender actualizadas.'")
}
