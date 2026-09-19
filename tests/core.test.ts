import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyState, answer, makeSession, dayKey, parseBackup, submitSession } from '../src/core.ts';
const words = [{id:'adapt',decks:['cet4','ielts']},{id:'benefit',decks:['cet4']},{id:'crucial',decks:['ielts']}];
test('recall advances through calendar-day intervals and caps at 30 days',()=>{
 let s=emptyState();
 for(const [i,date,due] of [[0,'2026-09-18','2026-09-19'],[1,'2026-09-19','2026-09-22'],[2,'2026-09-22','2026-09-29'],[3,'2026-09-29','2026-10-13'],[4,'2026-10-13','2026-11-12'],[5,'2026-11-12','2026-12-12']] as const){
 s=answer(s,'adapt',true,`a${i}`,date,false); assert.equal(s.progress.adapt.due,due);
 }
});
test('forget resets interval, retry does not advance it or double count the word',()=>{
 let s=answer(emptyState(),'adapt',true,'a','2026-09-18',false);
 s=answer(s,'adapt',false,'b','2026-09-19',false);
 assert.equal(s.progress.adapt.stage,0); assert.equal(s.progress.adapt.due,'2026-09-20');
 s=answer(s,'adapt',true,'c','2026-09-19',true);
 assert.equal(s.progress.adapt.stage,0); assert.equal(s.progress.adapt.due,'2026-09-20');
 assert.equal(s.days['2026-09-19'].completed.length,1);
});
test('duplicate submission is idempotent',()=>{
 const s=answer(emptyState(),'adapt',true,'a','2026-09-18',false);
 assert.deepEqual(answer(s,'adapt',true,'a','2026-09-18',false),s);
 assert.equal(s.progress.adapt.stage,1); assert.equal(s.days['2026-09-18'].completed.length,1);
});
test('session queues a forgotten word at the end and survives backup restore',()=>{
 let s=emptyState();s.session={day:'2026-09-18',deck:'cet4',queue:makeSession(s,words,'cet4','2026-09-18')};
 s=submitSession(s,false,'2026-09-18');
 assert.deepEqual(s.session!.queue.map(i=>i.wordId),['benefit','adapt']);
 assert.equal(s.session!.queue[1].retry,true);
 const restored=parseBackup(JSON.stringify(s),new Set(['adapt','benefit','crucial']));
 assert.deepEqual(restored,s);
 assert.deepEqual(submitSession(s,true,'2026-09-19'),s);
});
test('month and year boundaries are calendar-correct',()=>{
 const s=answer(emptyState(),'adapt',true,'a','2026-12-31',false);
 assert.equal(s.progress.adapt.due,'2027-01-01');
 assert.equal(answer(emptyState(),'adapt',true,'b','2028-02-28',false).progress.adapt.due,'2028-02-29');
});
test('due words come first and a shared word is not new in another deck',()=>{
 const s=answer(emptyState(),'adapt',true,'a','2026-09-18',false);
 assert.deepEqual(makeSession(s,words,'ielts','2026-09-19').map(x=>x.wordId),['adapt','crucial']);
 assert.deepEqual(makeSession(s,words,'ielts','2026-09-18').map(x=>x.wordId),['crucial']);
});
test('new word allowance is global across decks and respects daily limit',()=>{
 let s=emptyState(); s.settings.dailyGoal=5;
 for(let i=0;i<5;i++) s=answer(s,`word${i}`,true,`a${i}`,'2026-09-18',false);
 assert.deepEqual(makeSession(s,words,'ielts','2026-09-18'),[]);
 assert.equal(makeSession(s,words,'ielts','2026-09-19').length,2);
});
test('day keys use local calendar dates',()=> assert.equal(dayKey(new Date(2026,8,18,0,1)),'2026-09-18'));
test('backup round trip preserves progress and rejects malformed or foreign data',()=>{
 const s=answer(emptyState(),'adapt',true,'a','2026-09-18',false);
 assert.deepEqual(parseBackup(JSON.stringify(s),new Set(['adapt'])),s);
 for(const bad of ['{}','null',JSON.stringify({...s,version:99}),JSON.stringify({...s,settings:{deck:'cet4',dailyGoal:999}}),JSON.stringify({...s,progress:{adapt:{stage:-1,due:'tomorrow'}}})]) assert.throws(()=>parseBackup(bad,new Set(['adapt'])));
 assert.throws(()=>parseBackup(JSON.stringify(s),new Set(['other'])));
});
