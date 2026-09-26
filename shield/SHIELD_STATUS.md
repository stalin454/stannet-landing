# StanNet Shield — estado

Versión: 0.4.0-preview
Fase actual: Release candidate Windows / build automatizado
Rama: main

## Implementado
- Landing Shield aislada en /shield/.
- Scanner web local reutilizando Sentinel.
- SHA-256, metadatos, entropía y YARA-X en navegador.
- Historial web local sin persistir bytes del archivo.
- Core Rust para escaneo bajo demanda de archivos y carpetas.
- Límite defensivo: 10.000 archivos por operación, 1 GiB por archivo y YARA-X en memoria hasta 64 MiB.
- Cuarentena reversible con registro, SHA-256 y restauración.
- Cleaner limitado a temporales del usuario con más de 7 días.
- Cleaner siempre requiere selección y confirmación explícita.
- GUI Windows con Rust + Tauri 2.
- Estado de Microsoft Defender mediante Get-MpComputerStatus.
- Quick Scan mediante Start-MpScan.
- Actualización de firmas mediante Update-MpSignature.
- Historial local de acciones en %LOCALAPPDATA%/StanNetShield.
- Build Windows mediante GitHub Actions.
- Instalador NSIS + archivo SHA-256 automatizados.
- Release rolling `shield-preview` cuando el pipeline de main termina correctamente.

## Modelo de seguridad
Shield 0.4 complementa Microsoft Defender. No desactiva Defender, no cambia exclusiones, no ejecuta archivos analizados y no borra automáticamente detecciones.

## Antes de 1.0
1. Firma de código del instalador.
2. Pruebas adicionales en VM limpia de Windows 10/11.
3. Pruebas de instalación/desinstalación y archivos bloqueados.
4. Mejoras del motor de reglas y actualización firmada.
5. Evaluación de protección residente sin interferir con Defender.
