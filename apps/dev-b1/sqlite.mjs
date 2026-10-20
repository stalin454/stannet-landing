import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
export function database(path=':memory:'){
 const raw=new DatabaseSync(path);raw.exec(readFileSync(new URL('./schema.sql',import.meta.url),'utf8'));
 function prepare(sql){const stmt=raw.prepare(sql);let params=[];return {sql,bind(...args){params=args;return this;},async first(){return stmt.get(...params)||null;},async all(){return {results:stmt.all(...params)};},_run(){const result=stmt.run(...params);return {meta:{changes:Number(result.changes)}};},async run(){return this._run();}};}
 return {prepare,async batch(stmts){raw.exec('BEGIN IMMEDIATE');try{const result=stmts.map(stmt=>stmt._run());raw.exec('COMMIT');return result;}catch(e){raw.exec('ROLLBACK');throw e;}},raw,close(){raw.close();}};
}
