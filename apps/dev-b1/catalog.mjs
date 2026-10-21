export const catalog=[
 ['infinity','StanNet Infinity','Creatividad','Cruza el portal: una experiencia cinematográfica interactiva.','∞'],
 ['devtube','DevTube · StanNet Media','Creatividad','Un cine interactivo para tecnología, Astrid Nova y StanNet Music: reproduce, organiza y explora.','▶'],
 ['programming','Programming Academy','Software','Aprende a leer, escribir y depurar código.','</>'],
 ['typing','Typing Academy','Software','Entrena con código real y sigue tu progreso.','⌨'],
 ['languages','Academias de idiomas','Educación','Inglés, danés y nuevas rutas de aprendizaje.','Aa'],
 ['london-english','London English Academy','Educación','Academia de inglés con conversación, escucha y método Callan. Aula privada original en StanNet.Space.','🇬🇧'],
 ['denmark','Ruta Dinamarca','Educación','Guía de llegada, empleo, vivienda y CV danés.','🇩🇰'],
 ['ai','Inteligencia artificial','Herramientas','Herramientas educativas y asistentes de StanNet.','✦'],
 ['cyber','Ciberseguridad','Herramientas','Laboratorios y herramientas de defensa digital.','◇'],
 ['music','StanNet Radio','Creatividad','Escucha la radio de StanNet sin registro, con programación musical y tecnológica.','♫'],
 ['dj','DJ Studio','Creatividad','Mezcla, crea y graba tus sesiones.','◎'],
 ['artists','STAN6IX · Artist Universe','Creatividad','Música original y universo artístico StanNet.','6'],
 ['labs','Aplicaciones y laboratorios','Herramientas','Descubre las próximas herramientas de la plataforma.','⬡']
].map(([id,name,category,description,icon])=>({id,name,category,description,icon,status:id==='typing'?'pilot':'pending'}));
