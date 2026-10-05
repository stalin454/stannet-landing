import assert from 'node:assert/strict';
import {createProfessionalDiscovery} from '../../ayudaencasa/application/professional-discovery.mjs';

let received;
const discover=createProfessionalDiscovery({professionals:{
  async listPublic(input){received=input;return {items:[],nextCursor:null};}
}});
await discover({city:' Madrid ',postalPrefix:'28-001',category:'limpieza',verifiedOnly:true,minRating:4.5,limit:100,cursor:'abc'});
assert.deepEqual(received,{city:'Madrid',postalPrefix:'28001',category:'limpieza',verifiedOnly:true,minRating:4.5,limit:50,cursor:'abc'});
await discover({city:'',postalPrefix:'',category:'invalida',minRating:'nope',limit:0});
assert.equal(received.city,null);
assert.equal(received.postalPrefix,null);
assert.equal(received.category,null);
assert.equal(received.minRating,0);
assert.equal(received.limit,20);
console.log('AyudaEnCasa professional discovery tests passed');
