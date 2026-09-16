// StanNet Shield · defensive educational rules
// These rules identify review signals and synthetic fixtures; they are not a complete antivirus signature corpus.

rule Shield_Demo : demo {
 meta:
  author = "StanNet"
  severity = "info"
  score = 0
  description = "Benign StanNet Shield test marker"
 strings:
  $marker = "STANNET_SHIELD_DEMO"
 condition:
  $marker
}

rule PowerShell_Encoded_Command : research {
 meta:
  author = "StanNet"
  severity = "medium"
  score = 30
  description = "PowerShell encoded command indicator; context review required"
 strings:
  $ps = "powershell" ascii wide nocase
  $enc1 = "-encodedcommand" ascii wide nocase
  $enc2 = "-enc " ascii wide nocase
 condition:
  $ps and 1 of ($enc*)
}

rule Script_Download_And_Evaluate : research {
 meta:
  author = "StanNet"
  severity = "medium"
  score = 35
  description = "Download and dynamic evaluation strings in the same file"
 strings:
  $download = "DownloadString" ascii wide nocase
  $eval = "Invoke-Expression" ascii wide nocase
 condition:
  $download and $eval
}
