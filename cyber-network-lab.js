document.addEventListener('DOMContentLoaded', () => {
  const lab = document.createElement('section');
  lab.className = 'cyber-shell';
  lab.id = 'cyber-network-lab';
  lab.innerHTML = `<div class="cyber-panel">
    <p class="eyebrow">LABORATORIO INTERACTIVO / DATOS FICTICIOS</p>
    <h2>¿Pasa o se bloquea?</h2>
    <p>Evalua una ACL simplificada: gana la primera regla que coincide. No envia paquetes ni modifica tu red. Objetivo: invitados no deben acceder a nominas; empleados si.</p>
    <ol class="cyber-diagram"><li>Equipo de origen</li><li>Reglas en orden</li><li>Servidor de nominas · TCP 443</li></ol>
    <label for="aclSource">Origen de la conexion</label>
    <select id="aclSource"><option value="guest">Invitados</option><option value="staff">Empleados</option></select>
    <label for="aclPolicy">Politica que quieres probar</label>
    <select id="aclPolicy"><option value="bad">Incorrecta: permitir todos antes de denegar invitados</option><option value="good">Restrictiva: denegar invitados antes de permitir empleados</option></select>
    <pre id="aclRules"></pre>
    <label for="aclPrediction">Predice el resultado antes de comprobar</label>
    <select id="aclPrediction"><option value="">Selecciona</option><option value="allow">Permitido</option><option value="deny">Bloqueado</option></select>
    <button id="aclRun">Evaluar conexion</button>
    <p id="aclFeedback" role="status"></p>
    <details><summary>Entrega del laboratorio</summary><p>Prueba las cuatro combinaciones de origen y politica. Anota regla coincidente y resultado. Explica por que una regla correcta colocada demasiado tarde no protege el destino. Lleva tus resultados al cuaderno de la unidad de listas de control de acceso.</p></details>
  </div>`;
  document.querySelector('main').append(lab);
  const get = id => lab.querySelector('#' + id);
  const render = () => {
    get('aclRules').textContent = get('aclPolicy').value === 'bad'
      ? '1. PERMITIR cualquiera -> nominas TCP 443\n2. DENEGAR invitados -> nominas TCP 443\n3. DENEGAR resto'
      : '1. DENEGAR invitados -> nominas TCP 443\n2. PERMITIR empleados -> nominas TCP 443\n3. DENEGAR resto';
    get('aclPrediction').value = '';
    get('aclFeedback').textContent = '';
  };
  get('aclSource').onchange = render;
  get('aclPolicy').onchange = render;
  get('aclRun').onclick = () => {
    if (!get('aclPrediction').value) { get('aclFeedback').textContent = 'Selecciona tu prediccion primero.'; return; }
    const broad = get('aclPolicy').value === 'bad';
    const guest = get('aclSource').value === 'guest';
    const result = !broad && guest ? 'deny' : 'allow';
    get('aclFeedback').textContent = (result === get('aclPrediction').value ? 'Prediccion correcta. ' : 'Revisa tu prediccion. ')
      + (result === 'allow' ? 'PERMITIDO' : 'BLOQUEADO')
      + ' por la regla ' + (broad || guest ? '1' : '2') + '. '
      + (broad ? 'La regla general permite antes de llegar al bloqueo. La politica no cumple el objetivo, incluso si esta prueba usa empleados.' : 'La politica separa el acceso de invitados y empleados. Prueba tambien el otro origen.');
  };
  render();
});
