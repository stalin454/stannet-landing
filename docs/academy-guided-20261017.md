# StanNet Academy — aprendizaje guiado (candidato 2026-10-17)

## Alcance, sin cambios en producción
Rama: \`feat/academy-guided-learning-20261017\`, derivada de \`main\` en \`04cd16c4a4a646d9dc05a73cb3ad6e5a31dea2b5\`. Para volver al estado anterior basta no fusionar el PR. No modifica StanNet AI, su voz o el dominio \`academy.stannet.dev\`. El workflow nuevo solo realiza pruebas y **no despliega**.

## Python
- Problema reproducido: la evaluación antigua aprobaba \`print(Python listo para ciberseguridad)\` porque miraba texto fuente, incluso sin comillas.
- El evaluador \`programming-python-evaluator.py\` interpreta el código y comprueba el resultado por cada una de las 24 lecciones. Las salidas, los valores, la estructura AST y las funciones se contrastan según el objetivo. Una solución incorrecta nunca debe aprobarse solo por contener palabras esperadas en comentarios o cadenas.
- Pyodide se ejecuta en \`programming-python-worker.js\`, separado de la UI. Si el motor no carga o el programa tarda más de 4,5 segundos después de iniciar su ejecución, se termina el Worker y se ofrece reintento.
- La guía muestra errores de sintaxis, detalles técnicos opcionales, tres niveles de pistas sin entregar inmediatamente la solución, historial de intentos y progreso por lección.
- Borradores guardados localmente; los progresos con el antiguo evaluador permanecen intactos en \`stannet-pa-progress-v1\`, pero **no** se transfieren a logros verificados. El registro \`stannet-pa-progress-verified-v2\` solo incluye ejercicios comprobados con el nuevo evaluador. Todavía no hay sincronización con D1/cuentas.
- Editor Python con resaltado superpuesto, interfaz móvil más compacta, lista de lecciones plegable y navegación anterior/siguiente. Se mantiene el botón Ejecutar manual.

## Web Lab
- Interruptor de vista previa automática, desactivado por defecto, con debounce de 650 ms para HTML, CSS y JavaScript.
- Resultado en iframe \`sandbox="allow-scripts"\` sin \`allow-same-origin\`. JavaScript imprime mensajes y errores en un panel separado.
- TypeScript, React, Next.js y SQL no se presentan falsamente como runtimes ejecutables.
- El autograder JavaScript preexistente es de criterios estructurales y **no** se declara verificador de comportamiento. Requerirá pruebas aisladas para ofrecer una garantía equivalente a Python.

## Límites / próximos pasos
- Web Worker y tiempo máximo evitan congelar la interfaz, pero **no constituyen** una frontera de seguridad robusta frente a código hostil que abuse del propio navegador. No transmitir tokens, datos privados ni secretos al entorno de ejercicios.
- Las pistas actuales son didácticas y predefinidas por lección, con orientación basada en el error. No se ha conectado una nueva API de IA de pago; se preserva el Context Bridge existente.
- Antes de publicar: revisar el PR, CI, abrir una preview independiente, comprobar el primer ejercicio con código válido e inválido desde escritorio y móvil, probar bucle infinito, errores de red y errores de JavaScript. Desplegar únicamente previa autorización, con rollback documentado.
- La sincronización D1 debe diseñarse junto a autenticación y permisos, no escribiendo datos privados desde un frontend público.

## Pruebas automatizadas
\`node --check programming-lab.js\`, \`node --check programming-web-lab.js\`, \`node --check programming-python-worker.js\`, \`python3 -m py_compile programming-python-evaluator.py\`, \`node tests/programming-python-evaluator.test.cjs\`, \`npm run test:ci\`.

Caso crítico: rechazar \`print(Python listo para ciberseguridad)\` y aceptar solamente \`print("Python listo para ciberseguridad")\` si la salida coincide exactamente.
