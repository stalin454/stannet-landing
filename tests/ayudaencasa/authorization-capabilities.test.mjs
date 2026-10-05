import assert from 'node:assert/strict';
import {hasRole,canSelfSelectRole,requireActive,requireRole} from '../../ayudaencasa/domain/authorization.mjs';
const active={userId:'u',status:'active',roles:['client','professional']};
assert.equal(hasRole(active,'client'),true);assert.equal(hasRole(active,'professional'),true);
assert.equal(canSelfSelectRole('admin'),false);assert.equal(canSelfSelectRole('client'),true);
assert.throws(()=>requireActive({...active,status:'pending'}),e=>e.code==='ACCOUNT_NOT_ACTIVE');
assert.equal(requireRole(active,'professional'),active);
assert.throws(()=>requireRole({userId:'x',status:'active',roles:['client']},'professional'),e=>e.code==='FORBIDDEN');
console.log('AyudaEnCasa capability authorization tests passed');
