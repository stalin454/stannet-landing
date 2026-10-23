(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.StanNetTypingAccents=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const drills=[
    {id:'accent-vowels',level:'12',title:'Tildes · vocales',fingers:'á é í ó ú',focus:'Tecla de tilde, soltar y después la vocal',pattern:'á é í ó ú á é í ó ú áá éé íí óó úú á é í ó ú'},
    {id:'accent-words',level:'13',title:'Tildes · palabras',fingers:'á · é · í · ó · ú',focus:'Practica la tilde dentro de palabras reales',pattern:'café canción lápiz árbol corazón música teléfono página código práctica precisión también después menú'},
    {id:'accent-pairs',level:'14',title:'Tilde diacrítica',fingers:'tú / tu · él / el · sí / si',focus:'La tilde distingue palabras: conserva cada signo',pattern:'tú tu él el sí si mí mi té te dé de sé se más mas tú eliges tu ritmo él lee el menú sí puedo si practico'},
    {id:'accent-uppercase',level:'15',title:'Tildes · mayúsculas',fingers:'Á É Í Ó Ú · Ñ Ü',focus:'Las mayúsculas también llevan tilde',pattern:'Á É Í Ó Ú Ñ Ü ÁRBOL ÉXITO ÍNDICE ÓPERA ÚTIL ESPAÑA PINGÜINO Á É Í Ó Ú'},
    {id:'accent-diaeresis',level:'16',title:'Diéresis y eñe',fingers:'ü Ü · ñ Ñ',focus:'Practica los dos puntos y la eñe sin sustituirlos',pattern:'ü Ü ñ Ñ pingüino cigüeña vergüenza bilingüe lingüística niño niña mañana otoño sueño español'},
    {id:'accent-sentences',level:'17',title:'Tildes · frases completas',fingers:'á é í ó ú · ü · ñ',focus:'Mantén precisión al escribir español completo',pattern:'¿Qué canción escuchó Lucía? Mañana estudiaré programación. El pingüino apareció después de la lluvia. Tú también puedes escribir con precisión. ¡Qué alegría!'}
  ].map(drill=>Object.freeze(drill));
  function normalize(value){return String(value??'').normalize('NFC');}
  function baseKey(ch){
    const value=normalize(ch);
    return /^[áéíóúü]$/iu.test(value)?value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase():value.toUpperCase();
  }
  function sequence(ch){
    const value=normalize(ch);if(!/^[áéíóúü]$/iu.test(value))return null;
    return {mark:/ü/iu.test(value)?'¨':'´',base:baseKey(value),upper:value===value.toUpperCase(),diaeresis:/ü/iu.test(value)};
  }
  return Object.freeze({drills:Object.freeze(drills),normalize,baseKey,sequence});
});
