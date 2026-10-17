"""Evaluador pedagógico de Python de StanNet.
Se ejecuta en un Web Worker con Pyodide; no acepta soluciones por palabras clave.
Los ejercicios prácticos se contrastan con salidas, valores y pruebas de comportamiento.
"""
import ast
import builtins
import contextlib
import io
import logging
import re
import traceback

FIXTURES = {
    "access.log": "GET / HTTP/1.1 200\nGET /admin HTTP/1.1 403\n",
    "eventos.csv": "ip,severity\n10.0.0.5,high\n10.0.0.8,low\n",
}

class ChallengeError(Exception):
    pass

def ensure(condition, message):
    if not condition:
        raise ChallengeError(message)

def calls(tree, name):
    return any(isinstance(node, ast.Call) and (
        isinstance(node.func, ast.Name) and node.func.id == name or
        isinstance(node.func, ast.Attribute) and node.func.attr == name
    ) for node in ast.walk(tree))

def has(tree, cls):
    return any(isinstance(node, cls) for node in ast.walk(tree))

def virtual_open(path, mode="r", *args, **kwargs):
    name = str(path)
    if mode not in ("r", "rt") or name not in FIXTURES:
        raise FileNotFoundError("Este laboratorio solo incluye los archivos de ejemplo: access.log y eventos.csv.")
    return io.StringIO(FIXTURES[name])

def assessment(lesson, scope, tree, output, stderr):
    """Lanza una pista dirigida para el primer criterio que falte."""
    lines = output.strip().splitlines()
    if lesson == "PY01-01":
        ensure(lines == ["Python listo para ciberseguridad"],
               "La salida debe ser exactamente «Python listo para ciberseguridad». Comprueba las comillas y los espacios.")
    elif lesson == "PY01-02":
        ensure(lines == ["Inicio", "Analizando red", "Fin"],
               "Necesitamos tres líneas, en este orden: Inicio, Analizando red y Fin.")
    elif lesson == "PY02-01":
        ensure(scope.get("ip") == "192.168.1.10" and scope.get("puerto") == 22,
               "Declara ip como texto «192.168.1.10» y puerto como número 22.")
        ensure("192.168.1.10" in output and "22" in output, "Después imprime ambas variables.")
    elif lesson == "PY02-02":
        ensure(has(tree, ast.JoinedStr), "Usa una f-string, con la letra f antes de las comillas.")
        ensure(str(scope.get("ip", "")) in output and str(scope.get("puerto", "no definido")) in output and bool(output.strip()),
               "Tu salida debe incluir los valores actuales de ip y puerto.")
    elif lesson == "PY02-03":
        ensure(scope.get("es_ssh") is True, "Crea es_ssh con una comparación que sea True si puerto vale 22.")
        ensure("True" in output, "Muestra el resultado de es_ssh usando print().")
    elif lesson == "PY03-01":
        ensure(any(isinstance(n, ast.If) and n.orelse for n in ast.walk(tree)),
               "Incluye un bloque if y un else para cubrir ambos resultados.")
        ensure(lines == ["HTTPS"], "Con puerto = 443, tu programa debe imprimir HTTPS.")
    elif lesson == "PY03-02":
        ensure(has(tree, ast.For) and calls(tree, "startswith"),
               "Recorre ips con for y comprueba el prefijo con startswith().")
        ensure(lines == ["192.168.1.10", "192.168.1.15"],
               "Imprime solo las dos direcciones que comienzan por 192.168.1.")
    elif lesson == "PY03-03":
        ensure(has(tree, ast.While), "Debes utilizar un bucle while.")
        ensure(scope.get("intentos") == 3, "El contador intentos tiene que acabar en 3.")
        ensure("Finalizado" in lines, "Imprime Finalizado al terminar el bucle.")
    elif lesson == "PY04-01":
        ensure(calls(tree, "append"), "Añade la nueva IP con append().")
        ensure(isinstance(scope.get("ips"), list) and "192.168.1.30" in scope["ips"],
               "La lista ips todavía no contiene 192.168.1.30.")
        ensure("192.168.1.30" in output, "Muestra con print() la lista resultante.")
    elif lesson == "PY04-02":
        ensure(isinstance(scope.get("evento"), dict) and scope["evento"].get("ip") == "10.0.0.9" and scope["evento"].get("puerto") == 443,
               "El diccionario evento debe contener ip = 10.0.0.9 y puerto = 443.")
        ensure("10.0.0.9" in output, "Imprime la dirección IP del diccionario.")
    elif lesson == "PY04-03":
        ensure(isinstance(scope.get("ips_unicas"), set) and scope["ips_unicas"] == {"8.8.8.8", "1.1.1.1"},
               "Crea ips_unicas convirtiendo ips en un conjunto (set).")
        ensure("8.8.8.8" in output and "1.1.1.1" in output, "Imprime el conjunto sin duplicados.")
    elif lesson == "PY04-04":
        ensure(has(tree, ast.ListComp), "Para este ejercicio utiliza una list comprehension.")
        ensure(scope.get("privadas") == ["192.168.1.2", "192.168.1.3"],
               "privadas debe contener solo las dos direcciones que comienzan por 192.168.")
    elif lesson == "PY05-01":
        fn = scope.get("es_web")
        ensure(callable(fn), "Define una función llamada es_web(puerto).")
        ensure(fn(80) is True and fn(443) is True and fn(22) is False and fn(8080) is False,
               "Prueba tu función con 80, 443 y puertos que no sean web. Debe devolver booleanos.")
    elif lesson == "PY05-02":
        fn = scope.get("etiqueta_host")
        ensure(callable(fn), "Define la función etiqueta_host(ip, puerto=22).")
        ensure(fn("10.0.0.1") == "10.0.0.1:22" and fn("8.8.8.8", 443) == "8.8.8.8:443",
               "La función debe devolver la IP y el puerto unidos por «:», y admitir el puerto por defecto.")
        ensure(has(tree, ast.JoinedStr), "Resuélvelo usando una f-string.")
    elif lesson == "PY06-01":
        ensure(has(tree, ast.With) and calls(tree, "open"), "Abre access.log con un bloque with open(...).")
        ensure(scope.get("logs") == FIXTURES["access.log"], "Guarda el contenido leído de access.log en la variable logs.")
    elif lesson == "PY06-02":
        ensure(calls(tree, "loads"), "Convierte texto_json con json.loads().")
        ensure(scope.get("evento") == {"ip": "8.8.8.8", "puerto": 53},
               "Guarda el diccionario resultante en evento.")
    elif lesson == "PY06-03":
        ensure(has(tree, ast.With) and calls(tree, "open"), "Crea un bloque with open('eventos.csv', 'r')...")
        ensure(any(isinstance(n, ast.Import) and any(a.name == "csv" for a in n.names) for n in ast.walk(tree)),
               "Importa el módulo csv.")
    elif lesson == "PY07-01":
        ensure(any(isinstance(n, ast.Try) and any(h.type and isinstance(h.type, ast.Name) and h.type.id == "ValueError" for h in n.handlers) for n in ast.walk(tree)),
               "Incluye try y except ValueError para tratar la conversión fallida.")
        ensure(calls(tree, "int"), "Intenta convertir entrada con int().")
    elif lesson == "PY07-02":
        ensure(calls(tree, "warning"), "Utiliza logging.warning(...) para registrar el aviso.")
        ensure("Intento sospechoso" in stderr, "El mensaje del warning debe ser «Intento sospechoso».")
    elif lesson == "PY08-01":
        cls = scope.get("Alerta")
        ensure(isinstance(cls, type), "Crea una clase llamada Alerta.")
        obj = cls("10.0.0.2", "high")
        ensure(obj.ip == "10.0.0.2" and obj.severity == "high",
               "En __init__ asigna self.ip y self.severity a los valores recibidos.")
    elif lesson == "PY09-01":
        ensure(any(isinstance(n, ast.Import) and any(a.name == "pathlib" for a in n.names) for n in ast.walk(tree)),
               "Importa pathlib.")
        ensure(any(isinstance(n, ast.ImportFrom) and n.module == "datetime" and any(a.name == "datetime" for a in n.names) for n in ast.walk(tree)),
               "Importa datetime desde el módulo datetime.")
    elif lesson == "PY10-01":
        ensure(calls(tree, "findall"), "Utiliza re.findall() para buscar en log.")
        found = any(isinstance(v, list) and "10.0.0.8" in v for v in scope.values())
        ensure(found or "10.0.0.8" in output, "Tu búsqueda debe encontrar la dirección 10.0.0.8.")
    elif lesson == "PY11-01":
        ensure(has(tree, ast.Assert), "Incluye al menos una prueba con assert.")
        fn = scope.get("es_https")
        ensure(callable(fn) and fn(443) is True and fn(80) is False,
               "es_https debe devolver True solo para 443 y False para 80.")
    elif lesson == "PY12-01":
        ensure(has(tree, ast.For) and has(tree, ast.If), "Usa for e if para filtrar los eventos.")
        ensure(lines == ["10.0.0.5"], "Solo debe imprimirse la IP del evento con severity high.")
    else:
        raise ChallengeError("Este ejercicio aún no tiene pruebas verificadas y no puede aprobarse automáticamente.")

def evaluate(code, lesson_id, mode="check"):
    if not isinstance(code, str) or len(code) > 12000:
        return dict(ok=False, output="", feedback="El código debe tener menos de 12.000 caracteres.", kind="error")
    try:
        tree = ast.parse(code, filename="<alumno>")
        compiled = compile(tree, "<alumno>", "exec")
    except SyntaxError as error:
        detail = (error.msg or "sintaxis incorrecta")
        if "invalid syntax" in detail:
            detail = "revisa las comillas, paréntesis y separadores"
        return dict(ok=False, output="", kind="syntax", line=error.lineno,
                    feedback="Error de sintaxis en la línea {}: {}.".format(error.lineno or "?", detail),
                    technical=str(error))
    safe_builtins = builtins.__dict__.copy()
    safe_builtins["open"] = virtual_open
    scope = {"__name__": "__main__", "__builtins__": safe_builtins}
    stdout, stderr = io.StringIO(), io.StringIO()
    # Avoid leaking existing logging handlers into other exercises.
    root = logging.getLogger()
    previous_handlers, previous_level = list(root.handlers), root.level
    handler = logging.StreamHandler(stderr)
    root.handlers = [handler]
    root.setLevel(logging.WARNING)
    try:
        with contextlib.redirect_stdout(stdout), contextlib.redirect_stderr(stderr):
            exec(compiled, scope)
        output = stdout.getvalue().rstrip("\n")
        warnings = stderr.getvalue()
        if mode == "run":
            return dict(ok=True, output=output, kind="run", feedback="El código se ejecutó sin errores.")
        try:
            assessment(lesson_id, scope, tree, output, warnings)
        except ChallengeError as exc:
            return dict(ok=False, output=output, kind="challenge", feedback=str(exc))
        return dict(ok=True, output=output, kind="passed",
                    feedback="¡Muy bien! Tu código se ejecuta y cumple las pruebas de esta lección.")
    except Exception as error:
        frames = traceback.extract_tb(error.__traceback__)
        lines = [frame.lineno for frame in frames if frame.filename == "<alumno>"]
        line = lines[-1] if lines else None
        name = type(error).__name__
        messages = {
            "NameError": "Has utilizado un nombre que Python no reconoce. Comprueba mayúsculas y minúsculas.",
            "TypeError": "Has utilizado un valor o una función con un tipo de dato incompatible.",
            "IndentationError": "Revisa los espacios de indentación del bloque.",
            "ZeroDivisionError": "No se puede dividir entre cero.",
            "ValueError": "Revisa el valor que intentas convertir o utilizar.",
            "FileNotFoundError": str(error),
        }
        feedback = messages.get(name, "Python ha encontrado un error durante la ejecución.")
        if name == "NameError" and "'Print'" in str(error):
            feedback = "La función se escribe print(), con p minúscula."
        return dict(ok=False, output=stdout.getvalue().rstrip("\n"), kind="runtime",
                    line=line, feedback=feedback, technical="{}: {}".format(name, error))
    finally:
        root.handlers = previous_handlers
        root.setLevel(previous_level)
