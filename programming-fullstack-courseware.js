(()=>{const phaseObjectives={
FS01:'Comprender la plataforma web desde la red hasta el navegador y construir interfaces semánticas, accesibles y encontrables.',
FS02:'Dominar CSS como sistema de layout, diseño responsive y arquitectura visual mantenible.',
FS03:'Programar aplicaciones JavaScript robustas, asíncronas, modulares y comprobables.',
FS04:'Usar el sistema de tipos de TypeScript para reducir errores y diseñar contratos explícitos.',
FS05:'Construir interfaces React mantenibles con estado, formularios, datos, rendimiento y pruebas.',
FS06:'Desarrollar aplicaciones Next.js entendiendo límites servidor/cliente, routing, caché y despliegue.',
FS07:'Crear backends Node fiables con configuración, validación, errores, logs y separación de responsabilidades.',
FS08:'Diseñar APIs REST coherentes, documentadas, seguras y preparadas para evolución.',
FS09:'Modelar y operar datos relacionales correctamente con SQL, PostgreSQL, índices y transacciones.',
FS10:'Implementar identidad, autorización y controles de seguridad web con criterio de defensa en profundidad.',
FS11:'Construir una estrategia de calidad automatizada desde unidad hasta E2E y revisión de código.',
FS12:'Empaquetar, automatizar y desplegar software reproducible con Linux, Git, Docker y CI/CD.',
FS13:'Operar software observando salud, rendimiento, fallos y señales de producción.',
FS14:'Razonar sobre arquitectura y trade-offs de sistemas que deben crecer y mantenerse.',
FS15:'Trabajar como ingeniero dentro de equipos: requisitos, documentación, colaboración y código existente.',
FS16:'Integrar el ciclo completo en un producto defendible, desplegado, probado, documentado y observable.'
};
const escId=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
function lesson(phase,topic,n,type){
 const id=phase.phase+'-'+String(n+1).padStart(2,'0')+'-'+type[0].toUpperCase();
 const deep=window.stannetDeepContent.get(phase.phase,topic); const concept=deep.theory;
 const lab=deep.starter+' '+deep.hint;
 const mastery=deep.projectExtension;
 return {id,phase:phase.phase,topic,type,title:(type==='concept'?'Concepto · ':type==='lab'?'Laboratorio · ':'Dominio · ')+topic,minutes:type==='concept'?25:type==='lab'?45:35,body:type==='concept'?concept:type==='lab'?lab:mastery,deliverable:type==='concept'?'Notas técnicas + preguntas de comprensión':type==='lab'?'Código funcional + tests + README':'Integración en proyecto + evidencia',example:deep.example,starter:deep.starter,solution:deep.solution,tests:deep.tests,hint:deep.hint,reading:deep.reading,questions:deep.questions};
}
const phases=(window.stannetFullStack||[]).map(p=>{const lessons=[];p.topics.forEach((t,i)=>['concept','lab','mastery'].forEach(k=>lessons.push(lesson(p,t,i,k))));return {...p,objective:phaseObjectives[p.phase],lessons,exam:{id:p.phase+'-EXAM',title:'Examen de '+p.title,questions:p.topics.slice(0,10).map((t,i)=>({id:i+1,prompt:'Explica '+t+' y aplícalo a un caso de producción. Incluye al menos un riesgo, un trade-off y una comprobación.',points:10})),pass:70},project:{id:p.phase+'-PROJECT',title:'Proyecto de fase · '+p.title,brief:'Construye una entrega que demuestre '+p.topics.join(', ')+'. Debe incluir README, decisiones técnicas, manejo de errores, pruebas pertinentes y evidencia de funcionamiento.',rubric:['Corrección funcional','Diseño y claridad','Pruebas y casos límite','Seguridad y manejo de errores','Documentación y reproducibilidad']}}});
window.stannetCourseware={version:'1.0',phases,lessonCount:phases.reduce((a,p)=>a+p.lessons.length,0),examCount:phases.length,projectCount:phases.length,mastery:{passScore:70,requireAllProjects:true,requireCapstone:true}};
})();