import assert from 'node:assert/strict';import {normalizePublicProfile,normalizeProfessionalProfile} from '../../ayudaencasa/domain/profile.mjs';
assert.deepEqual(normalizePublicProfile({displayName:' Ana ',city:'Madrid',public:true}),{displayName:'Ana',bio:'',city:'Madrid',postalPrefix:'',public:true});
const p=normalizeProfessionalProfile({headline:'Cuidados',experienceYears:5,services:['cuidado','cuidado','bogus']});assert.deepEqual(p.services,['cuidado']);assert.equal(p.available,true);
assert.throws(()=>normalizeProfessionalProfile({services:['bogus']}),e=>e.code==='INVALID_INPUT');
console.log('AyudaEnCasa profile domain tests passed');
