export const decks = ['cet4','cet6','ielts','toefl'] as const;
export type Deck = typeof decks[number];
export type Item = { wordId: string; token: string; retry: boolean };
export type Progress = { stage: number; due: string; firstSeen: string };
export type State = {
 version: 1; settings: { deck: Deck; dailyGoal: number };
 progress: Record<string,Progress>;
 days: Record<string,{ completed: string[]; newWords: string[] }>;
 answered: string[]; session: { day: string; deck: Deck; queue: Item[] } | null;
};
export const emptyState = (): State => ({version:1,settings:{deck:'cet4',dailyGoal:10},progress:{},days:{},answered:[],session:null});
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
 const date=(x: unknown)=>typeof x==='string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && later(x,0)===x;
 const idList=(x: unknown)=>Array.isArray(x)&&x.every(i=>typeof i==='string'&&ids.has(i))&&new Set(x).size===x.length;
 if(!obj(s)||s.version!==1||!obj(s.settings)||!decks.includes(s.settings.deck)||![5,10,15,20].includes(s.settings.dailyGoal)||!obj(s.progress)||!obj(s.days)||!Array.isArray(s.answered)||!s.answered.every((x:unknown)=>typeof x==='string')||new Set(s.answered).size!==s.answered.length) return fail();
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
