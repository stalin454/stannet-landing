const assert=require('node:assert/strict');
const fs=require('node:fs');
const plan=require('../nutri-plan.js');
for(const n of [7,28]){
 const result=plan.generate({allergies:'',avoid:'',preferences:''},n);
 assert.equal(result.error,null);
 assert.equal(result.days.length,n);
 assert(result.days.every(day=>Object.keys(day).length===4));
 assert(new Set(result.days.map(d=>d.comida.name)).size>=7);
 assert(new Set(result.days.map(d=>d.cena.name)).size>=7);
 assert(plan.shopping(result.days,0,7,2).length>10);
}
const restricted=plan.generate({allergies:'lactosa, huevo, pescado, frutos secos',avoid:'pollo',preferences:'vegetariana'},28);
assert.equal(restricted.days.length,28);
assert(restricted.days.every(day=>Object.values(day).every(meal=>!/(yogur|queso|huevo|salmón|merluza|atún|pollo|pavo|nueces|almendras)/i.test(meal.name+' '+meal.ingredients.join(' ')))));
assert(plan.generate({allergies:'',avoid:'avena, pan, huevo, yogur, pera, manzana, plátano, fresas, frutos rojos, queso',preferences:''},7).error);
const app=fs.readFileSync('nutri-ia.js','utf8');
assert(app.includes('data-add-partner'));
assert(app.includes('data-add-task'));
assert(app.includes('trainingDone[key]'));
console.log('Nutri IA: periodos, variedad, exclusiones y pizarra verificados');
