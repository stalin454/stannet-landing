'use strict';
const {assertText}=require('../domain/model.cjs');
const {unauthorized,forbidden}=require('./errors.cjs');
function createCreateRequest({requests,audit,id=()=>crypto.randomUUID()}){
 return async function createRequest({principal,input,now}){
  if(!principal)throw unauthorized();
  if(principal.role!=='client')throw forbidden();
  const row={id:id(),clientId:principal.userId,category:assertText(input.category,{field:'category',max:64}),title:assertText(input.title,{field:'title',max:120}),description:assertText(input.description,{field:'description',max:4000}),city:assertText(input.city,{field:'city',max:100}),postalPrefix:input.postalPrefix?assertText(input.postalPrefix,{field:'postalPrefix',max:5}):null,status:'open',createdAt:now};
  await requests.create(row);await audit.append({actorUserId:principal.userId,eventType:'request.created',targetType:'service_request',targetId:row.id,createdAt:now});return row;
 };
}
module.exports={createCreateRequest};
