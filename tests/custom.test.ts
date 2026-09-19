import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../src/core.ts';
import {words} from '../src/words.ts';
const ids=new Set(words.map(w=>w.id));
const entry={word:'  Serendipity  ',pos:'n.',meaning:'意外发现美好事物的机缘',example:'',translation:''};
test('custom words matching object property names still start as new words',()=>{
 let s=core.addWord(core.emptyState(),words,{...entry,word:'constructor'},'ielts');
 assert.equal(core.makeSession(s,core.allWords(s,words),'ielts','2026-09-18')[0].wordId,'constructor');
 s=core.answer(s,'constructor',true,'constructor-test','2026-09-18',false);
 assert.equal(s.progress.constructor.stage,1);
 assert.equal(s.days['2026-09-18'].newWords[0],'constructor');
 assert.deepEqual(core.parseBackup(JSON.stringify(s),ids),s);
});
test('custom words normalize, join decks, share progress and enter learning queues',()=>{
 assert.equal(typeof core.addWord,'function');
 let s=core.addWord(core.emptyState(),words,entry,'ielts');
 s=core.addWord(s,words,entry,'toefl');
 const all=core.allWords(s,words);
 assert.equal(all.filter(w=>w.id==='serendipity').length,1);
 assert.deepEqual(all.find(w=>w.id==='serendipity')!.decks,['ielts','toefl']);
 assert.equal(core.makeSession(s,all,'ielts','2026-09-18')[0].wordId,'serendipity');
 s=core.answer(s,'serendipity',true,'a','2026-09-18',false);
 assert.ok(!core.makeSession(s,all,'toefl','2026-09-18').some(w=>w.wordId==='serendipity'));
 assert.deepEqual(core.parseBackup(JSON.stringify(s),ids),s);
});
test('existing words keep canonical meaning and share notes across decks',()=>{
 assert.equal(typeof core.addWord,'function');
 let s=core.addWord(core.emptyState(),words,{...entry,word:'ADAPT'},'ielts');
 assert.equal(core.allWords(s,words).filter(w=>w.id==='adapt').length,1);
 assert.equal(core.allWords(s,words).find(w=>w.id==='adapt')!.meaning,'适应；调整');
 s=core.setNote(s,'adapt','在课堂学到；联想 adaptation');
 assert.deepEqual(core.parseBackup(JSON.stringify(s),ids),s);
 assert.equal(core.setNote(s,'adapt','').notes.adapt,undefined);
});
test('legacy backups migrate without losing progress and invalid custom data is rejected',()=>{
 const legacy={...core.answer(core.emptyState(),'adapt',true,'a','2026-09-18',false),version:1};
 delete legacy.customWords;delete legacy.notes;
 const migrated=core.parseBackup(JSON.stringify(legacy),ids);
 assert.equal(migrated.version,2);assert.deepEqual(migrated.customWords,[]);assert.deepEqual(migrated.notes,{});
 assert.equal(migrated.progress.adapt.stage,1);
 for(const extra of [{customWords:[{...entry,id:'wrong',decks:['ielts']}]},{notes:{unknown:'note'}},{notes:{adapt:123}},{customWords:'bad'}]) {
  assert.throws(()=>core.parseBackup(JSON.stringify({...migrated,...extra}),ids));
 }
});
