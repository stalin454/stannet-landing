export function createD1RateLimiter({db,now=()=>Date.now()}){
 if(!db?.prepare)throw new TypeError('D1 binding required');
 return async function consume(key,{limit,windowMs}){
  const t=now(),start=t-(t%windowMs),expires=start+windowMs*2;
  const row=await db.prepare(`INSERT INTO rate_limit_buckets(bucket_key,window_started_at,hit_count,expires_at)
   VALUES(?1,?2,1,?3)
   ON CONFLICT(bucket_key) DO UPDATE SET
    hit_count=CASE WHEN window_started_at=excluded.window_started_at THEN hit_count+1 ELSE 1 END,
    window_started_at=excluded.window_started_at,
    expires_at=excluded.expires_at
   RETURNING hit_count`).bind(key,start,expires).first();
  const hits=Number(row?.hit_count||limit+1),allowed=hits<=limit;
  return{allowed,remaining:Math.max(0,limit-hits),retryAfter:allowed?0:Math.max(1,Math.ceil((start+windowMs-t)/1000))};
 };
}
