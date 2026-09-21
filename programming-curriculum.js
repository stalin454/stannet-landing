window.stannetProgrammingCurriculum = {
  version: '2.0.0',
  tracks: [
    { id:'web-foundations', title:'Fundamentos Web', level:'Básico', description:'HTML semántico, CSS moderno y JavaScript desde cero hasta una web interactiva.', lessons:[
      {id:'html',title:'HTML: estructura, semántica, formularios y accesibilidad'},
      {id:'css',title:'CSS: box model, Flexbox, Grid, responsive y animaciones'},
      {id:'javascript',title:'JavaScript: lógica, DOM, APIs y asincronía'}
    ]},
    { id:'frontend-pro', title:'Frontend Profesional', level:'Intermedio', description:'Flujo profesional con Git, TypeScript, React, Next.js, testing y despliegue.', lessons:[
      {id:'git',title:'Git y GitHub'}, {id:'typescript',title:'TypeScript'},
      {id:'react',title:'React'}, {id:'nextjs',title:'Next.js'}, {id:'testing',title:'Testing y despliegue'}
    ]},
    { id:'python-core', title:'Python', level:'Básico → Avanzado', description:'Python completo: fundamentos, estructuras, POO, archivos, módulos, testing y automatización.', lessons:[
      {id:'py01',title:'PY01 · Introducción y entorno'}, {id:'py02',title:'PY02 · Variables, tipos y operadores'},
      {id:'py03',title:'PY03 · Control de flujo'}, {id:'py04',title:'PY04 · Estructuras de datos'},
      {id:'py05',title:'PY05 · Funciones'}, {id:'py06',title:'PY06 · Archivos, CSV y JSON'},
      {id:'py07',title:'PY07 · Excepciones, debugging y logging'}, {id:'py08',title:'PY08 · Programación orientada a objetos'},
      {id:'py09',title:'PY09 · Módulos, pip y entornos virtuales'}, {id:'py10',title:'PY10 · Python avanzado'},
      {id:'py11',title:'PY11 · Testing'}, {id:'py12',title:'PY12 · Proyecto final Python'}
    ]},
    { id:'cyber-python', title:'Python para Ciberseguridad', level:'Especialización', description:'Python aplicado a redes, logs, automatización defensiva, APIs, threat intelligence y Blue Team.', lessons:[
      {id:'cp01',title:'CP01 · Sistema operativo y automatización'}, {id:'cp02',title:'CP02 · TCP/IP, sockets e ipaddress'},
      {id:'cp03',title:'CP03 · Automatización defensiva'}, {id:'cp04',title:'CP04 · Parsing y análisis de logs'},
      {id:'cp05',title:'CP05 · Regex e indicadores'}, {id:'cp06',title:'CP06 · APIs de seguridad'},
      {id:'cp07',title:'CP07 · PCAP y análisis de tráfico'}, {id:'cp08',title:'CP08 · Hashing y criptografía aplicada'},
      {id:'cp09',title:'CP09 · Threat Intelligence'}, {id:'cp10',title:'CP10 · SIEM y Splunk'},
      {id:'cp11',title:'CP11 · Blue Team Automation'}, {id:'cp12',title:'CP12 · Proyecto SOC'}
    ]},
    { id:'linux-networking', title:'Linux & Redes', level:'Esencial Cyber', description:'Terminal Linux, permisos, procesos, servicios, TCP/IP, subnetting, DNS, HTTP, Wireshark y Nmap.', lessons:[
      {id:'linux',title:'Linux y Bash'}, {id:'tcpip',title:'TCP/IP y subnetting'}, {id:'wireshark',title:'Wireshark'}, {id:'nmap',title:'Nmap en laboratorio autorizado'}
    ]},
    { id:'backend-data', title:'Backend, APIs & Datos', level:'Intermedio', description:'Node.js, FastAPI, REST, SQL, SQLite y PostgreSQL.', lessons:[
      {id:'node',title:'Node.js'}, {id:'fastapi',title:'FastAPI'}, {id:'rest',title:'APIs REST'}, {id:'sql',title:'SQL y bases de datos'}
    ]},
    { id:'secure-coding', title:'Secure Coding / AppSec', level:'Avanzado', description:'Autenticación, sesiones, validación, secretos, OWASP y desarrollo seguro.', lessons:[
      {id:'auth',title:'Autenticación y autorización'}, {id:'websec',title:'Seguridad web'}, {id:'owasp',title:'OWASP Top 10'}, {id:'sdlc',title:'Secure SDLC'}
    ]}
  ],
  languages: [
    {id:'html-css',name:'HTML & CSS',category:'Frontend',runtime:'Browser',status:'live'},
    {id:'js',name:'JavaScript',category:'Frontend / Fullstack',runtime:'Browser',status:'live'},
    {id:'python',name:'Python',category:'Cybersecurity / Automation / Backend',runtime:'Python 3',status:'live'},
    {id:'typescript',name:'TypeScript',category:'Frontend / Fullstack',runtime:'TypeScript',status:'planned'},
    {id:'react',name:'React',category:'Frontend',runtime:'Browser',status:'planned'},
    {id:'nextjs',name:'Next.js',category:'Fullstack',runtime:'Node.js',status:'planned'},
    {id:'sql',name:'SQL',category:'Bases de datos',runtime:'SQLite / PostgreSQL',status:'planned'}
  ],
  builds: [
    {id:'portfolio',title:'Portfolio profesional',description:'HTML, CSS y JavaScript con Git y despliegue.',requires:['HTML','CSS','JavaScript','Git']},
    {id:'python-automation',title:'Automatizador Python',description:'Procesa archivos, JSON y logs y genera un informe.',requires:['Python','pathlib','JSON','logging']},
    {id:'soc-log-analyzer',title:'Analizador SOC de logs',description:'Proyecto defensivo: parsea eventos, extrae indicadores y genera un reporte.',requires:['Python','Regex','Logs','TCP/IP']},
    {id:'react-dashboard',title:'Dashboard React',description:'Interfaz por componentes que consume una API.',requires:['JavaScript','TypeScript','React','REST']},
    {id:'secure-api',title:'API REST segura',description:'Servicio backend con validación, autenticación, logging y tests.',requires:['Python o Node.js','REST','SQL','Secure Coding']}
  ]
};