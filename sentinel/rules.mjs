export const DEFAULT_RULES = `// StanNet Sentinel · reglas originales educativas · versión 1.0
// No representan una biblioteca antivirus ni indicadores confirmados.
rule Sentinel_Demo : demo {
 meta:
  author = "StanNet"
  version = "1.0"
  description = "Marcador benigno de demostración StanNet"
  reference = "StanNet synthetic fixture"
  severity = "info"
  score = 0
 strings:
  $marker = "STANNET_SENTINEL_DEMO"
 condition: $marker
}
rule PowerShell_Encoded_Command : research {
 meta:
  author = "StanNet"
  version = "1.0"
  description = "PowerShell con comando codificado; revisar su contexto"
  reference = "StanNet synthetic fixture"
  severity = "medium"
  score = 30
 strings:
  $ps = "powershell" ascii wide nocase
  $enc1 = "-encodedcommand" ascii wide nocase
  $enc2 = "-enc " ascii wide nocase
 condition: $ps and 1 of ($enc*)
}
rule Script_Download_And_Evaluate : research {
 meta:
  author = "StanNet"
  version = "1.0"
  description = "Cadenas de descarga y evaluación dinámica en el mismo archivo"
  reference = "StanNet synthetic fixture"
  severity = "medium"
  score = 35
 strings:
  $a = "DownloadString" ascii wide nocase
  $b = "Invoke-Expression" ascii wide nocase
 condition: $a and $b
}`;

export const FIXTURES = [
  {id:'demo', name:'Marcador benigno', text:'STANNET_SENTINEL_DEMO\nhttps://example.com/help', expected:['Sentinel_Demo']},
  {id:'plain', name:'Texto ordinario', text:'Documento de prueba benigno. https://example.com 192.0.2.10', expected:[]},
  {id:'ps-plain', name:'PowerShell sin codificación', text:'powershell Get-Date', expected:[]},
  {id:'encoded', name:'Señal sintética de codificación', text:'powershell -encodedcommand PLACEHOLDER', expected:['PowerShell_Encoded_Command']},
  {id:'combo', name:'Dos señales sintéticas', text:'powershell -encodedcommand PLACEHOLDER DownloadString Invoke-Expression', expected:['PowerShell_Encoded_Command','Script_Download_And_Evaluate']},
  {id:'wide', name:'Señal sintética UTF-16LE', text:'powershell -encodedcommand PLACEHOLDER', wide:true, expected:['PowerShell_Encoded_Command']}
];
export function fixtureBytes(fixture) {
  if (!fixture.wide) return new TextEncoder().encode(fixture.text);
  const bytes=new Uint8Array(fixture.text.length*2);
  for(let i=0;i<fixture.text.length;i++)bytes[i*2]=fixture.text.charCodeAt(i);
  return bytes;
}
