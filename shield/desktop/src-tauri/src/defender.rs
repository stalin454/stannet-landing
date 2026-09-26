use serde_json::Value;
use std::process::Command;

fn powershell(script: &str) -> Result<String, String> {
    let output = Command::new("powershell.exe")
        .args(["-NoProfile", "-NonInteractive", "-Command", script])
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

pub fn scan_path(path: &str) -> Result<String, String> {
    let target = std::path::Path::new(path);
    if !target.exists() {
        return Err("La ruta para Microsoft Defender no existe.".into());
    }
    let output = Command::new("powershell.exe")
        .args([
            "-NoProfile",
            "-NonInteractive",
            "-Command",
            "$ErrorActionPreference='Stop'; $p=[Environment]::GetEnvironmentVariable('STANNET_SHIELD_SCAN_PATH'); Start-MpScan -ScanType CustomScan -ScanPath $p; 'Análisis personalizado de Microsoft Defender completado.'"
        ])
        .env("STANNET_SHIELD_SCAN_PATH", path)
        .output()
        .map_err(|e| format!("No se pudo iniciar Microsoft Defender: {e}"))?;
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        return Err(if stderr.is_empty() { "Microsoft Defender rechazó el análisis de la ruta.".into() } else { stderr });
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

pub fn update_signatures() -> Result<String, String> {
    powershell("$ErrorActionPreference='Stop'; Update-MpSignature; 'Firmas de Microsoft Defender actualizadas.'")
}
