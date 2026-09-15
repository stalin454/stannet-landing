from datetime import datetime
from pathlib import Path
from flask import Flask, request, make_response

app = Flask(__name__)
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
ACCESS_LOG = LOG_DIR / "access.log"

USERS = {
    "ana": {"password": "academy123", "role": "student", "invoice": "INV-1001"},
    "luis": {"password": "stannet2026", "role": "student", "invoice": "INV-1002"},
}

INVOICES = {
    "1001": "Factura educativa INV-1001 - usuario ana - importe 120 EUR",
    "1002": "Factura educativa INV-1002 - usuario luis - importe 240 EUR",
}


def log_event(status):
    line = (
        f"{datetime.utcnow().isoformat()}Z "
        f"ip={request.remote_addr} method={request.method} path={request.path} "
        f"query={request.query_string.decode() or '-'} status={status} "
        f"agent={request.headers.get('User-Agent', '-')}\n"
    )
    ACCESS_LOG.open("a", encoding="utf-8").write(line)


def page(title, body, status=200):
    html = f"""<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} | StanNet Lab</title>
  <style>
    body{{margin:0;background:#070816;color:#e8ecff;font-family:Arial,sans-serif;line-height:1.6}}
    main{{max-width:860px;margin:auto;padding:48px 20px}}
    a{{color:#c8ff4d}}
    input,button{{padding:12px;margin:6px 0;background:#101126;color:#e8ecff;border:1px solid #35405f}}
    button{{cursor:pointer}}
    pre,.panel{{padding:18px;background:#101126;border:1px solid #2d3654;overflow:auto}}
  </style>
</head>
<body><main><h1>{title}</h1>{body}</main></body>
</html>"""
    response = make_response(html, status)
    response.headers["X-StanNet-Lab"] = "training-only"
    response.headers["X-Content-Type-Options"] = "nosniff"
    log_event(status)
    return response


@app.route("/")
def index():
    return page(
        "StanNet Vulnerable Web",
        """<p>Laboratorio local para practicar con alcance autorizado.</p>
<ul>
  <li><a href="/login">Login</a></li>
  <li><a href="/search?q=network">Search</a></li>
  <li><a href="/invoice/1001">Invoice 1001</a></li>
  <li><a href="/invoice/1002">Invoice 1002</a></li>
</ul>
<p>Objetivo: identifica fallos, documenta evidencia y propone remediacion.</p>""",
    )


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username", "")
        password = request.form.get("password", "")
        user = USERS.get(username)
        if user and user["password"] == password:
            return page(
                "Login correcto",
                f"<p>Bienvenido {username}. Rol: {user['role']}.</p><p>Factura asignada: {user['invoice']}</p>",
            )
        return page("Login fallido", "<p>Credenciales no validas.</p><a href='/login'>Reintentar</a>", 401)

    return page(
        "Login",
        """<form method="post">
  <label>Usuario<br><input name="username" autocomplete="username"></label><br>
  <label>Password<br><input name="password" type="password" autocomplete="current-password"></label><br>
  <button>Entrar</button>
</form>
<p>Credenciales educativas en README.md.</p>""",
    )


@app.route("/search")
def search():
    query = request.args.get("q", "")
    return page(
        "Busqueda",
        f"""<form>
  <input name="q" value="{query}">
  <button>Buscar</button>
</form>
<div class="panel">Resultados educativos para: {query}</div>
<p>Mision: identifica por que reflejar entrada sin tratamiento puede ser peligroso.</p>""",
    )


@app.route("/invoice/<invoice_id>")
def invoice(invoice_id):
    content = INVOICES.get(invoice_id)
    if not content:
        return page("Factura no encontrada", "<p>No existe esa factura.</p>", 404)
    return page(
        "Factura",
        f"<pre>{content}</pre><p>Mision: comprueba si un usuario podria ver recursos de otro usuario.</p>",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
