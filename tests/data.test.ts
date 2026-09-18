import { test } from 'node:test';
import assert from 'node:assert/strict';
import { words } from '../src/words.ts';
test('each exam deck has 150 complete unique entries',()=>{
 for(const deck of ['cet4','cet6','ielts','toefl']) {
  const list=words.filter(w=>w.decks.includes(deck));
  assert.equal(list.length,150,deck);assert.equal(new Set(list.map(w=>w.id)).size,150);
 }
 assert.equal(new Set(words.map(w=>w.id)).size,words.length);
 for(const w of words) for(const key of ['id','word','pos','meaning','example','translation'] as const) assert.ok(w[key]?.trim(),`${w.id}: ${key}`);
 for(const w of words) assert.ok(w.example.toLowerCase().includes(w.word),w.word);
});
