import assert from 'node:assert/strict';import {normalizeReputation} from '../../ayudaencasa/application/reputation.mjs';
assert.deepEqual(normalizeReputation({reviewCount:'3',averageRating:'4.666'}),{reviewCount:3,averageRating:4.7});
assert.deepEqual(normalizeReputation({reviewCount:0,averageRating:5}),{reviewCount:0,averageRating:0});
console.log('AyudaEnCasa reputation tests passed');
