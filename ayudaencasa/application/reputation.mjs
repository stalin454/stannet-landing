export function normalizeReputation(row){
 const count=Number(row?.reviewCount||0),avg=count?Number(row.averageRating||0):0;
 return Object.freeze({reviewCount:count,averageRating:Math.round(avg*10)/10});
}
