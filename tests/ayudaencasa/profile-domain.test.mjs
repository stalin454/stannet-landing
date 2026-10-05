import assert from 'node:assert/strict';
import {normalizePublicProfile,normalizeProfessionalProfile} from '../../ayudaencasa/domain/profile.mjs';
const p=normalizePublicProfile({displayName:'Ana',bio:'Experta',city:'Madrid',public:true});
assert.equal(p.displayName,'Ana');
const pp=normalizeProfessionalProfile({headline:'Mantenimiento',experienceYears:5,available:true,services:['reparaciones','reparaciones']});
assert.deepEqual(pp.services,['reparaciones']);
assert.throws(()=>normalizeProfessionalProfile({services:[]}),/At least one service/);
console.log('AyudaEnCasa profile domain tests passed');