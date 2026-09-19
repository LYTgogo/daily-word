import type { Word } from './words';
export const decks = ['cet4','cet6','ielts','toefl'] as const;
export type Deck = typeof decks[number];
export type Item = { wordId: string; token: string; retry: boolean };
export type Progress = { stage: number; due: string; firstSeen: string };
export type State = {
 version: 2; settings: { deck: Deck; dailyGoal: number };
 customWords: Word[]; notes: Record<string,string>;
 progress: Record<string,Progress>;
 days: Record<string,{ completed: string[]; newWords: string[] }>;
 answered: string[]; session: { day: string; deck: Deck; queue: Item[] } | null;
};
export const emptyState = (): State => ({version:2,settings:{deck:'cet4',dailyGoal:10},customWords:[],notes:{},progress:{},days:{},answered:[],session:null});
export function allWords(state:State,builtins:Word[]):Word[] {
 const map=new Map(builtins.map(w=>[w.id,w]));
 for(const w of state.customWords){const old=map.get(w.id);map.set(w.id,old?{...old,decks:[...new Set([...old.decks,...w.decks])]}:w);}
 // Personally added words take precedence among new words, after due reviews.
 return [...state.customWords.map(w=>map.get(w.id)!),...builtins.filter(w=>!state.customWords.some(c=>c.id===w.id))];
}
const wordId=(word:string)=>word.trim().toLowerCase().replace(/\s+/g,' ');
export function addWord(state:State,builtins:Word[],input:Omit<Word,'id'|'decks'>,deck:Deck):State {
 const id=wordId(input.word);
 if(!/^[a-z]+(?:[ '-][a-z]+)*$/.test(id)||id.length>100||!input.meaning.trim()||input.meaning.length>500||input.pos.length>50||input.example.length>2000||input.translation.length>2000) throw new Error('请填写有效英文单词和中文释义，并检查输入长度。');
 const s=structuredClone(state),existing=allWords(state,builtins).find(w=>w.id===id);
 const w=existing?{...existing,decks:[...new Set([...existing.decks,deck])]}:{...input,id,word:id,meaning:input.meaning.trim(),decks:[deck]};
 s.customWords=s.customWords.filter(w=>w.id!==id);s.customWords.push(w);s.session=null;
 return s;
}
export function setNote(state:State,id:string,note:string):State {
 if(note.length>2000)throw new Error('备注最多 2000 字。');
 const s=structuredClone(state);
 if(note.trim())s.notes[id]=note.trim();else delete s.notes[id];
 return s;
}
export const dayKey = (date = new Date()): string => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const later = (day: string, days: number) => { const [y,m,d]=day.split('-').map(Number); return dayKey(new Date(y,m-1,d+days,12)); };
export function answer(state: State,id: string,remembered: boolean,token: string,day: string,retry: boolean): State {
 if(state.answered.includes(token)) return state;
 const s=structuredClone(state), old=s.progress[id];
 const record=s.days[day] ??= {completed:[],newWords:[]};
 if(!old) record.newWords.push(id);
 if(!record.completed.includes(id)) record.completed.push(id);
 if(!retry || !remembered) {
  const stage=remembered ? Math.min((old?.stage ?? 0)+1,5) : 0;
  s.progress[id]={stage,due:later(day,remembered ? [1,3,7,14,30][stage-1] : 1),firstSeen:old?.firstSeen ?? day};
 }
 s.answered.push(token);
 return s;
}
export function makeSession(state: State,words: {id:string;decks:readonly string[]}[],deck: Deck,day: string): Item[] {
 const selected=words.filter(w=>w.decks.includes(deck));
 const due=selected.filter(w=>state.progress[w.id]?.due <= day).sort((a,b)=>state.progress[a.id].due.localeCompare(state.progress[b.id].due));
 const allowance=Math.max(0,state.settings.dailyGoal-(state.days[day]?.newWords.length ?? 0));
 const fresh=selected.filter(w=>!state.progress[w.id]).slice(0,allowance);
 return [...due,...fresh].map(w=>({wordId:w.id,token:crypto.randomUUID(),retry:false}));
}
export function submitSession(state: State,remembered: boolean,day: string): State {
 const item=state.session?.queue[0];
 if(!item || state.session?.day!==day) return state;
 const s=answer(state,item.wordId,remembered,item.token,day,item.retry);
 if(s===state) return s;
 s.session!.queue.shift();
 if(!remembered) s.session!.queue.push({wordId:item.wordId,token:crypto.randomUUID(),retry:true});
 return s;
}
export function parseBackup(raw: string,ids: Set<string>): State {
 const s=JSON.parse(raw);
 const fail=()=>{throw new Error('备份格式不正确，或包含当前版本不支持的词条。原有进度未修改。');};
 const obj=(x: unknown): x is Record<string,any> => !!x && typeof x==='object' && !Array.isArray(x);
 if(!obj(s))return fail();
 if(s.version===1){s.version=2;s.customWords=[];s.notes={};}
 if(s.version!==2||!Array.isArray(s.customWords)||!obj(s.notes))return fail();
 ids=new Set(ids);
 const customIds=new Set<string>();
 for(const w of s.customWords){
  if(!obj(w)||typeof w.word!=='string'||w.id!==wordId(w.word)||! /^[a-z]+(?:[ '-][a-z]+)*$/.test(w.id)||w.id.length>100||customIds.has(w.id)||!Array.isArray(w.decks)||!w.decks.length||w.decks.some((d:unknown)=>!decks.includes(d as Deck))||new Set(w.decks).size!==w.decks.length)return fail();
  for(const [field,limit] of [['pos',50],['meaning',500],['example',2000],['translation',2000]] as const)if(typeof w[field]!=='string'||w[field].length>limit)return fail();
  if(!w.meaning.trim())return fail();
  customIds.add(w.id);ids.add(w.id);
 }
 for(const [id,note] of Object.entries(s.notes))if(!ids.has(id)||typeof note!=='string'||note.length>2000)return fail();
 const date=(x: unknown)=>typeof x==='string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && later(x,0)===x;
 const idList=(x: unknown)=>Array.isArray(x)&&x.every(i=>typeof i==='string'&&ids.has(i))&&new Set(x).size===x.length;
 if(!obj(s.settings)||!decks.includes(s.settings.deck)||![5,10,15,20].includes(s.settings.dailyGoal)||!obj(s.progress)||!obj(s.days)||!Array.isArray(s.answered)||!s.answered.every((x:unknown)=>typeof x==='string')||new Set(s.answered).size!==s.answered.length) return fail();
 for(const [id,p] of Object.entries(s.progress)) if(!ids.has(id)||!obj(p)||!Number.isInteger(p.stage)||p.stage<0||p.stage>5||!date(p.due)||!date(p.firstSeen)||p.due<p.firstSeen) return fail();
 for(const [day,r] of Object.entries(s.days)) {
  if(!date(day)||!obj(r)||!idList(r.completed)||!idList(r.newWords)) return fail();
  if(r.newWords.some((id:string)=>!r.completed.includes(id)||s.progress[id]?.firstSeen!==day)||r.completed.some((id:string)=>!s.progress[id])) return fail();
 }
 if(s.session!==null) {
  if(!obj(s.session)||!date(s.session.day)||!decks.includes(s.session.deck)||!Array.isArray(s.session.queue)) return fail();
  const tokens=new Set<string>();
  for(const i of s.session.queue) {
   if(!obj(i)||!ids.has(i.wordId)||typeof i.token!=='string'||!i.token||typeof i.retry!=='boolean'||tokens.has(i.token)||s.answered.includes(i.token)||(i.retry&&!s.progress[i.wordId])) return fail();
   tokens.add(i.token);
  }
 }
 return s as State;
}
