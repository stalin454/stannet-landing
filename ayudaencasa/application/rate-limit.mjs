export function createRateLimiter({db,now=()=>Date.now()}){
 return async function consume(key,{limit,windowMs}){
  const t=now(),start=t-(t%windowMs),expires=start+windowMs*2;
  const row=await db.prepare('SELECT window_started_at,hit_count FROM rate_limit_buckets WHERE bucket_key=?1').bind(key).first();
  if(!row||row.window_started_at!==start){
   await db.prepare('INSERT INTO rate_limit_buckets(bucket_key,window_started_at,hit_count,expires_at) VALUES(?1,?2,1,?3) ON CONFLICT(bucket_key) DO UPDATE SET window_started_at=excluded.window_started_at,hit_count=1,expires_at=excluded.expires_at').bind(key,start,expires).run();
   return{allowed:true,remaining:limit-1,retryAfter:0};
  }
  if(row.hit_count>=limit)return{allowed:false,remaining:0,retryAfter:Math.max(1,Math.ceil((start+windowMs-t)/1000))};
  await db.prepare('UPDATE rate_limit_buckets SET hit_count=hit_count+1 WHERE bucket_key=?1').bind(key).run();
  return{allowed:true,remaining:Math.max(0,limit-row.hit_count-1),retryAfter:0};
 };
}
