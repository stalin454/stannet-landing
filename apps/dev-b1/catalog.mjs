export const catalog=[
 ['programming','Programming Academy','Software','Aprende a leer, escribir y depurar código.','</>'],
 ['typing','Typing Academy','Software','Entrena con código real y sigue tu progreso.','⌨'],
 ['languages','Academias de idiomas','Educación','Inglés, danés y nuevas rutas de aprendizaje.','Aa'],
 ['ai','Inteligencia artificial','Herramientas','Herramientas educativas y asistentes de StanNet.','✦'],
 ['cyber','Ciberseguridad','Herramientas','Laboratorios y herramientas de defensa digital.','◇'],
 ['music','Producción musical','Creatividad','Studio, Vocal Lab y StanNet Radio.','♫'],
 ['dj','DJ Studio','Creatividad','Mezcla, crea y graba tus sesiones.','◎'],
 ['artists','STAN6IX · Artist Universe','Creatividad','Música original y universo artístico StanNet.','6'],
 ['land','StanNet Land Intelligence','Educación','Academia de tierras, anuncios reales, comparador y verificación territorial.','◇'],
 ['labs','Aplicaciones y laboratorios','Herramientas','Descubre las próximas herramientas de la plataforma.','⬡']
].map(([id,name,category,description,icon])=>({id,name,category,description,icon,status:id==='typing'?'pilot':'pending'}));
