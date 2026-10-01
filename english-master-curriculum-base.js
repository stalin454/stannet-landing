/* StanNet English Academy — Master Curriculum factory.
   Converts authored module maps into six substantial lessons per module. */
(function(){
  const store={levels:{}};

  const lessonTypes=[
    {id:'concept',label:'01 · Concept & structure',skill:'Grammar'},
    {id:'lexis',label:'02 · Vocabulary & form',skill:'Vocabulary'},
    {id:'listening',label:'03 · Listening & pronunciation',skill:'Listening'},
    {id:'reading',label:'04 · Reading & analysis',skill:'Reading'},
    {id:'production',label:'05 · Speaking & writing',skill:'Production'},
    {id:'mastery',label:'06 · Mastery check',skill:'Assessment'}
  ];

  const buildLessons=function(level,module,moduleIndex){
    return lessonTypes.map(function(type,lessonIndex){
      const number=moduleIndex*6+lessonIndex+1;
      return {
        id:level.toLowerCase()+'-m'+String(moduleIndex+1).padStart(2,'0')+'-l'+String(lessonIndex+1).padStart(2,'0'),
        number:number,
        moduleIndex:moduleIndex,
        lessonIndex:lessonIndex,
        type:type.id,
        typeLabel:type.label,
        skill:type.skill,
        title:
          type.id==='concept' ? module.title+' · foundations' :
          type.id==='lexis' ? module.title+' · language bank' :
          type.id==='listening' ? module.title+' · listen & sound' :
          type.id==='reading' ? module.title+' · read & notice' :
          type.id==='production' ? module.title+' · produce' :
          module.title+' · checkpoint',
        objective:
          type.id==='concept' ? 'Comprender la estructura central y reconocer cuándo usarla.' :
          type.id==='lexis' ? 'Recuperar vocabulario y patrones útiles dentro de frases completas.' :
          type.id==='listening' ? 'Comprender el mensaje, detectar formas clave y practicar pronunciación con shadowing.' :
          type.id==='reading' ? 'Leer por significado, localizar la gramática objetivo y justificar elecciones lingüísticas.' :
          type.id==='production' ? 'Usar el contenido sin copiar modelos: hablar, escribir y reformular.' :
          'Comprobar comprensión y producción antes de avanzar al siguiente módulo.',
        module:module
      };
    });
  };

  window.stannetEnglishMasterCurriculum={
    registerLevel:function(level,meta,modules){
      if(!Array.isArray(modules)||modules.length!==8)throw new Error(level+' must contain exactly 8 master modules');
      const enriched=modules.map(function(module,i){
        const clone=Object.assign({},module,{index:i,level:level});
        clone.lessons=buildLessons(level,clone,i);
        return clone;
      });
      store.levels[level]={meta:meta,modules:enriched,lessons:enriched.flatMap(function(m){return m.lessons;})};
    },
    getLevel:function(level){return store.levels[level]||null;},
    getLevels:function(){return store.levels;},
    count:function(){
      const levels=Object.values(store.levels);
      return {
        levels:levels.length,
        modules:levels.reduce(function(sum,x){return sum+x.modules.length;},0),
        lessons:levels.reduce(function(sum,x){return sum+x.lessons.length;},0)
      };
    }
  };
})();