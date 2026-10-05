// Single catalogue consumed by the browser tools and Cloudflare Agent Core.
// Describe existing resources, not promised future capabilities.
export const resources = [
  ['programming','Programming Academy','/pages/programming.html','Teoría, ejercicios y proyectos de JavaScript, Python y HTML/CSS.',['programacion','programming','javascript','curso de codigo']],
  ['fullstack','Full-Stack Engineer Path','/pages/programming-fullstack.html','Laboratorio y proyectos full-stack.',['fullstack','full stack']],
  ['cs','CS Foundations','/pages/programming-cs-lab.html','Fundamentos y laboratorio C++ / C#.',['c++','c#','cs foundations']],
  ['python','Python Code Lab','/pages/programming-lab.html','Práctica de Python con código.',['python']],
  ['web-lab','Web & Languages Lab','/pages/programming-web-lab.html','Práctica de HTML, CSS y lenguajes web.',['html','css','web lab']],
  ['cyber','Cybersecurity / Cyber Defense Academy','/pages/cybersecurity.html','Redes, TCP/IP, Linux, seguridad digital y ruta SOC junior; no es certificación oficial.',['ciberseguridad','cybersecurity','redes','soc']],
  ['cyber-lab','Cyber Defense Lab','/pages/cyber-lab.html','Práctica defensiva con simulaciones y datos ficticios.',['cyber lab','laboratorio de seguridad']],
  ['danish','Danish Academy','/pages/danish.html','Curso propio de danés: 20 capítulos progresivos A1–A2, 17 capítulos de gramática, Danish Core Lab, Sentence Builder, Memory Lab y ruta de dominio B1–C2.',['danes','danish','dansk']],
  ['denmark','Ruta Dinamarca','/pages/ruta-dinamarca.html','Preparación, ciudades, estudios, trabajo, vivienda y llegada; guía informativa.',['dinamarca','denmark','mudarse']],
  ['english','English Academy','/pages/english.html','Inglés progresivo con vocabulario, gramática y práctica interactiva.',['ingles','english','idiomas']],
  ['callan','Callan English Coach','/pages/callan.html','Inglés oral: preguntas, respuestas, diccionario, audio y repetición activa.',['callan','practica oral']],
  ['language-music','Language Music Lab','/pages/language-music.html','Aprender idiomas con canciones, vocabulario y pronunciación.',['idiomas con musica','language music']],
  ['radio','StanNet Radio','/pages/radio.html','Emisora con música y bloques de tecnología.',['radio','emisora']],
  ['studio','StanNet Studio / Vocal Lab','/pages/vocal-studio.html','Estudio de experimentación vocal: cargar audio, herramientas de voz y mezcla.',['studio','vocal lab','vocal studio','separar voz','estudio musical']],
  ['music','Music Lab','/pages/music.html','Música y proyectos creativos de StanNet.',['musica','music']],
  ['guitar','Guitar Academy','/pages/guitar.html','Escalas, acordes, mástil, sonidos y tablatura.',['guitarra','guitar']],
  ['sentinel','StanNet Sentinel','/sentinel/','Proyecto y herramientas de ciberseguridad defensiva.',['sentinel','yara']],
  ['shield','StanNet Shield','/shield/','Proyecto de protección y limpieza del equipo; consulta la página para disponibilidad y versiones.',['shield','limpieza del pc']],
  ['password','Password Security','/pages/password-security.html','Generador y herramientas de seguridad de contraseñas.',['contrasenas','password','boveda']],
  ['web','Web Development / Portfolio','/pages/web-development.html','Portfolio de proyectos web, aplicaciones y proyectos de cliente.',['desarrollo web','web development','portfolio','portafolio','proyectos']],
  ['apps','Apps','/pages/apps.html','Aplicaciones y productos del ecosistema StanNet.',['apps','aplicaciones']],
  ['education','CV y formación / Certificados','/pages/education.html','Formación, certificados y recursos educativos.',['formacion','certificados','recursos educativos']],
  ['cv','Perfil y CV','/pages/cv.html','Perfil profesional y trayectoria de StanNet.',['curriculum','cv','sobre mi']],
  ['youtube','YouTube StanNetOfficial','https://www.youtube.com/@StanNetOfficial','Canal de StanNet.',['youtube','videos']],
  ['typing','Typing Lab','/pages/typing.html','Mecanografía en español, inglés y código; sesiones de 1 a 30 minutos.',['mecanografia','typing']],
  ['shortcuts','Atajos de teclado','/pages/shortcuts.html','Catálogo y práctica de comandos de Windows, macOS, Chrome y VS Code.',['atajos','shortcuts']],
  ['nutri','Nutri IA','/nutri-ia/','Organización personal de nutrición, entrenamiento y seguimiento; sugerencias generales.',['nutri','nutricion']],
  ['marketplace','AyudaEnCasa','/pages/marketplace.html','Proyecto marketplace de servicios domésticos.',['ayuda en casa','ayudaencasa','marketplace']],
  ['client','Proyecto cliente Alfa y Omega','/sanacion/','Trabajo de portfolio para cliente externo; no es una academia StanNet.',['alfa y omega','sanacion']]
].map(([id,title,path,description,keywords])=>Object.freeze({id,title,path,description,keywords}));

export const normalize = text => String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function searchResources(query) {
  const q=normalize(query);
  const words=q.split(/[^a-z0-9+#]+/).filter(w=>w.length>2 && !['hay','curso','quiero','para','tiene','tienes','aprender','abrir','abre','lleva','donde','puedes','como','buscar','busca','muestra','existe'].includes(w));
  return resources.map(resource=>({resource,score:resource.keywords.reduce((n,k)=>n+(q.includes(normalize(k))?10:0),0)+words.filter(w=>normalize(resource.title+' '+resource.description).includes(w)).length}))
    .filter(item=>item.score>0).sort((a,b)=>b.score-a.score).map(item=>item.resource);
}
export const catalogueText = () => resources.map(r=>`${r.title} — ${r.path}\n${r.description}`).join('\n\n');
export function safeResourceUrl(raw,origin='https://www.stannet.space') {
  try {
    const url=new URL(raw,origin);
    if(url.protocol!=='https:' && url.protocol!=='http:')return null;
    if(url.origin===new URL(origin).origin && !String(raw).startsWith('//'))return url.pathname+url.search+url.hash;
    return resources.some(r=>r.path===url.href)?url.href:null;
  }catch{return null;}
}
