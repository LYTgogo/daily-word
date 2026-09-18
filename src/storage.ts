import type { State } from './core';
let connection: Promise<IDBDatabase> | undefined;
function database() {
 return connection ??= new Promise<IDBDatabase>((resolve,reject)=>{
  const req=indexedDB.open('daily-word',1);
  req.onupgradeneeded=()=>req.result.createObjectStore('app');
  req.onsuccess=()=>resolve(req.result); req.onerror=()=>reject(req.error);
 });
}
export async function loadState(): Promise<State|undefined> {
 const db=await database();
 return new Promise((resolve,reject)=>{const r=db.transaction('app').objectStore('app').get('state');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
}
export async function saveState(state: State) {
 const db=await database();
 return new Promise<void>((resolve,reject)=>{const tx=db.transaction('app','readwrite');tx.objectStore('app').put(state,'state');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});
}
