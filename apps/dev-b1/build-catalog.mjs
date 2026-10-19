import {createRequire} from 'node:module';
import {writeFileSync} from 'node:fs';
const require=createRequire(import.meta.url),original=require('../../code-typing-catalog.js');
const exercises=original.languages.flatMap(language=>original.levels.map(level=>original.exercise(language.id,level.id)));
writeFileSync(new URL('./exercises.mjs',import.meta.url),'// Generated from the original read-only code-typing-catalog.js. No code is executed.\nexport const exercises='+JSON.stringify(exercises,null,2)+';\n');
console.log('Generated '+exercises.length+' existing exercises without modifying the original.');
