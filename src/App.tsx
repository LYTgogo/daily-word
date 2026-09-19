import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, Check, ChevronLeft, Download, Flame, Leaf, Search, Settings2, Sparkles, Sun, Upload, UserRound, Volume2, WifiOff, X } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';
import { addWord, allWords, setNote, dayKey, emptyState, makeSession, parseBackup, submitSession } from './core';
import type { Deck, State } from './core';
import { loadState, saveState } from './storage';
import { words } from './words';
import type { Word } from './words';

const titles: Record<Deck,string>={cet4:'大学英语四级',cet6:'大学英语六级',ielts:'雅思',toefl:'托福'};
const labels: Record<Deck,string>={cet4:'四级 CET-4',cet6:'六级 CET-6',ielts:'雅思 IELTS',toefl:'托福 TOEFL'};
const wordMap=new Map(words.map(w=>[w.id,w]));
const ids=new Set(wordMap.keys());
let updateApp: ((reload?:boolean)=>Promise<void>) | undefined;
function applyUpdate(){
 // The first page load has no controller when Workbox registers, so its
 // isUpdate flag stays false even when a later worker replaces that worker.
 navigator.serviceWorker.addEventListener('controllerchange',()=>window.location.reload(),{once:true});
 void updateApp?.(true);
}

export default function App(){
 const [state,setState]=useState<State>();
 const [page,setPage]=useState<'today'|'library'|'me'|'study'>('today');
 const [revealed,setRevealed]=useState(false),[busy,setBusy]=useState(false);
 const locked=useRef(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [search,setSearch]=useState(''),[detail,setDetail]=useState<Word>();
 const [backup,setBackup]=useState<State>(),[install,setInstall]=useState(false);
 const [offlineReady,setOfflineReady]=useState(false),[needsUpdate,setNeedsUpdate]=useState(false);
 const [today,setToday]=useState(dayKey());
 const [expanded,setExpanded]=useState(false),[adding,setAdding]=useState(false);
 const [note,setNoteDraft]=useState(''),[formError,setFormError]=useState('');
 const [draft,setDraft]=useState({word:'',pos:'',meaning:'',example:'',translation:''});
 useEffect(()=>{setNoteDraft(detail&&state?state.notes[detail.id]??'':'');},[detail]);
 useEffect(()=>{
  loadState().then(s=>setState(s?parseBackup(JSON.stringify(s),ids):emptyState())).catch(()=>setError('无法读取本机进度。请允许浏览器保存网站数据后重新打开；现有数据不会被覆盖。'));
  updateApp=registerSW({onOfflineReady(){setOfflineReady(true);},onNeedRefresh(){setNeedsUpdate(true);},onRegisterError(){setNotice('离线缓存暂未完成，请联网后重新打开。');}});
  if('serviceWorker' in navigator) navigator.serviceWorker.ready.then(()=>setOfflineReady(true));
  const refresh=()=>setToday(dayKey()); const timer=window.setInterval(refresh,15000); window.addEventListener('focus',refresh);
  return ()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};
 },[]);
 useEffect(()=>{if(page==='study'&&state?.session?.day!==today){setPage('today');setRevealed(false);}},[today,page,state?.session?.day]);
 useEffect(()=>{if(!detail&&!install&&!backup)return;const onKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setDetail(undefined);setInstall(false);setBackup(undefined);}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[detail,install,backup]);
 async function commit(next: State){
  if(locked.current)return false;locked.current=true;setBusy(true);setError('');
  try{await saveState(next);setState(next);return true;}catch{setError('进度未能保存，请检查设备空间后重试。当前题目已保留。');return false;}finally{locked.current=false;setBusy(false);}
 }
 function speak(text:string){
  if(!('speechSynthesis' in window)){setNotice('此浏览器暂不支持朗读，你仍可继续文字学习。');return;}
  const voices=speechSynthesis.getVoices().filter(v=>v.lang.toLowerCase().startsWith('en'));
  const voice=voices.find(v=>v.lang==='en-US'&&v.localService)||voices.find(v=>v.lang==='en-US')||voices[0];
  if(!voice){setNotice('未找到英语语音，请在设备设置中添加英语语音后重试。');return;}
  if(!navigator.onLine&&!voice.localService){setNotice('当前英语语音需要网络，请联网后朗读。');return;}
  speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;u.rate=.86;u.onerror=e=>{if(e.error!=='interrupted'&&e.error!=='canceled')setNotice('朗读暂不可用，请检查英语语音或网络后重试。');};speechSynthesis.speak(u);
 }
 if(!state)return <main className="loading"><Leaf size={36}/><h1>每日词记</h1><p role={error?'alert':'status'}>{error||'正在打开你的词记…'}</p></main>;
 const available=allWords(state,words);
 const wordMap=new Map(available.map(w=>[w.id,w]));
 const deck=state.settings.deck;
 const learned=Object.keys(state.progress).length;
 const daily=state.days[today]??{completed:[],newWords:[]};
 const selected=available.filter(w=>w.decks.includes(deck));
 const due=selected.filter(w=>state.progress[w.id]?.due<=today).length;
 const queue=state.session?.day===today&&state.session.deck===deck?state.session.queue:[];
 const current=queue[0]?wordMap.get(queue[0].wordId):undefined;
 const progress=Math.min(100,Math.round(daily.newWords.length/state.settings.dailyGoal*100));
 const studiedDays=Object.values(state.days).filter(d=>d.completed.length>0).length;
 async function start(){
  if(!state)return;
  if(queue.length){setRevealed(false);setPage('study');return;}
  const next={...state,session:{day:today,deck,queue:makeSession(state,available,deck,today)}};
  if(await commit(next)){setRevealed(false);setPage('study');}
 }
 async function respond(remembered:boolean){
  if(!state||!revealed||locked.current)return;
  if(dayKey()!==today){setToday(dayKey());return;}
  if(await commit(submitSession(state,remembered,today))){setRevealed(false);if('speechSynthesis' in window)speechSynthesis.cancel();}
 }
 async function choose(d:Deck){if(!state||d===deck)return;setSearch('');setExpanded(false);await commit({...state,settings:{...state.settings,deck:d},session:null});}
 function exportBackup(){const url=URL.createObjectURL(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=`每日词记-${today}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function importBackup(file?:File){if(!file)return;setError('');try{if(file.size>5_000_000)throw new Error('备份文件过大，请选择小于 5 MB 的每日词记备份。');setBackup(parseBackup(await file.text(),ids));}catch(e){setError(e instanceof Error?e.message:'无法读取备份文件。');}}
 function navigate(p:'today'|'library'|'me'){setPage(p);setRevealed(false);setError('');window.scrollTo(0,0);}
 const cardContent=(w:Word)=><><div className="word-heading"><span className="word-pos">{w.pos}</span><h3>{w.meaning}</h3></div>{w.example&&<div className="example"><div className="eyebrow">放进句子里记住</div><p lang="en">{w.example}</p><p className="translation">{w.translation}</p><button className="text-button" onClick={()=>speak(w.example)}><Volume2 size={16}/>朗读例句</button></div>}{state.notes[w.id]&&<div className="saved-note"><strong>我的备注</strong><p>{state.notes[w.id]}</p></div>}</>;
 return <div className="app-shell">
  <header className="topbar"><button className="brand" onClick={()=>navigate('today')} aria-label="每日词记首页"><span className="brand-icon"><Leaf size={23}/></span><span>每日词记<small>DAILY WORD</small></span></button><div className="top-actions"><span className="local-badge"><span/>进度存于本机</span><button className="icon-button" aria-label="打开设置" onClick={()=>navigate('me')}><Settings2 size={20}/></button></div></header>
  {error&&<div className="message error" role="alert">{error}<button aria-label="关闭错误提示" onClick={()=>setError('')}><X size={16}/></button></div>}
  {notice&&<div className="message" role="status">{notice}<button aria-label="关闭提示" onClick={()=>setNotice('')}><X size={16}/></button></div>}
  {needsUpdate&&<div className="message">新版本已准备好，已保存的进度会保留。<button disabled={busy} onClick={applyUpdate}>更新</button></div>}
  <main>
  {page==='today'&&<>
   <section className="greeting"><div className="eyebrow"><Sun size={15}/>{new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'})} · 给自己一点成长的时间</div><h1>每天一点，<span>记得更久。</span></h1><p>不急着记住所有单词，先记住今天的。</p></section>
   <section className="hero"><div className="hero-copy"><span className="pill light">今日学习计划</span><h2>让好习惯，<br/>慢慢长成你的底气。</h2><p>{titles[deck]} · 每天 {state.settings.dailyGoal} 个新词</p><button className="primary light-button" disabled={busy} onClick={start}>{queue.length?'继续学习':'开始今日学习'}<ArrowRight size={19}/></button><small>先复习，再学新词 · 按自己的节奏来</small></div><div className="botanical" aria-hidden="true"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="floating-word word-one">grow<span>/ɡroʊ/ · 成长</span></div><div className="plant"><div className="stem"/><i/><i/><i/><i/><div className="pot"/></div><span className="spark s1">✦</span><span className="spark s2">✧</span><div className="floating-word word-two"><Check size={17}/> a little, every day.</div></div></section>
   <section className="stats-grid" aria-label="今日统计"><div className="stat-card"><span className="stat-icon peach"><BookOpen size={20}/></span><div><span className="stat-label">今日新词</span><strong>{daily.newWords.length}<small> / {state.settings.dailyGoal}</small></strong></div><div className="tiny-progress"><i style={{width:`${progress}%`}}/></div></div><div className="stat-card"><span className="stat-icon lavender"><Sparkles size={20}/></span><div><span className="stat-label">到期复习</span><strong>{due}<small> 词</small></strong></div><span className="stat-note">当前词库</span></div><div className="stat-card"><span className="stat-icon sage"><Check size={20}/></span><div><span className="stat-label">今日已练</span><strong>{daily.completed.length}<small> 词</small></strong></div><span className="stat-note">每一步都算数</span></div></section>
   <section className="learning-section"><div className="section-heading"><div><span className="eyebrow">YOUR WORD COLLECTION</span><h2>从你的目标开始</h2></div><button className="text-button" onClick={()=>navigate('library')}>查看词库<ArrowUpRight size={16}/></button></div><div className="collection-grid"><button className="collection college" onClick={()=>{void choose('cet4');navigate('library');}}><div className="collection-top"><span className="collection-icon"><BookOpen size={23}/></span><span className="pill">CET-4 / CET-6</span></div><h3>四六级</h3><p>从校园出发，把基础打得更扎实。</p><div className="collection-bottom"><span>2 个精选词库 · 各 150 词</span><ArrowUpRight size={22}/></div></button><button className="collection abroad" onClick={()=>{void choose('ielts');navigate('library');}}><div className="collection-top"><span className="collection-icon"><ArrowUpRight size={24}/></span><span className="pill">IELTS / TOEFL</span></div><h3>雅思托福</h3><p>多认识一个词，多看见一点世界。</p><div className="collection-bottom"><span>2 个精选词库 · 各 150 词</span><ArrowUpRight size={22}/></div></button></div></section>
   <div className="gentle-note"><Leaf size={20}/><p>记不住也没关系。<span>每次重逢，都是在加深印象。</span></p></div>
   <div className="offline-line"><WifiOff size={14}/>{offlineReady?'已准备好离线学习':'首次联网后将缓存全部词库'}<button onClick={()=>setInstall(true)}>添加到 iPhone 主屏幕<ArrowUpRight size={13}/></button></div>
  </>}
  {page==='library'&&<section className="library-page"><div className="page-intro"><span className="eyebrow">WORD COLLECTION</span><h1>选一个目标，<br className="mobile-only"/>慢慢积累。</h1><p>精选版，非完整考试词表。跨词库的相同单词共享进度。</p></div><div className="deck-groups">{([['四六级',['cet4','cet6']],['雅思托福',['ielts','toefl']]] as const).map(([name,list])=><div key={name}><h2>{name}</h2><div className="deck-tabs">{list.map(d=><button key={d} disabled={busy} className={deck===d?'selected':''} onClick={()=>choose(d)}>{labels[d]}<small>{available.filter(w=>w.decks.includes(d)).length} 词</small>{deck===d&&<Check size={16}/>}</button>)}</div></div>)}</div><label className="search-box"><Search size={19}/><input placeholder="搜索单词或中文释义" value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button aria-label="清除搜索" onClick={()=>setSearch('')}><X size={17}/></button>}</label><div className="section-heading"><h2>{titles[deck]}<span className="muted"> · 精选</span></h2><span className="muted">已学 {selected.filter(w=>state.progress[w.id]).length} / {selected.length}</span></div><div className="library-actions"><button className="primary" onClick={()=>{setDraft({word:'',pos:'',meaning:'',example:'',translation:''});setFormError('');setAdding(true);}}>添加单词</button><button className="secondary" aria-expanded={expanded} aria-controls="word-list" onClick={()=>setExpanded(!expanded)}>{expanded?'折叠单词列表':'展开全部单词'}</button></div>{(expanded||search.trim())&&<div id="word-list" className="word-list">{selected.filter(w=>`${w.word} ${w.meaning}`.toLowerCase().includes(search.trim().toLowerCase())).map(w=><button key={w.id} onClick={()=>setDetail(w)}><span><strong lang="en">{w.word}</strong><small>{w.pos} {w.meaning}</small></span><span className={`word-status ${state.progress[w.id]?'seen':''}`}>{state.notes[w.id]?'有备注 · ':''}{state.progress[w.id]?'已学':'未学'}<ArrowUpRight size={16}/></span></button>)}</div>}{expanded&&<button className="secondary collapse-bottom" onClick={()=>{setExpanded(false);document.querySelector('.library-actions')?.scrollIntoView({block:'center'});}}>折叠单词列表</button>}{!selected.some(w=>`${w.word} ${w.meaning}`.toLowerCase().includes(search.trim().toLowerCase()))&&<div className="empty-state">没有找到这个词，试试其他英文或中文关键词。</div>}</section>}
  {page==='study'&&<section className="study-page"><div className="study-toolbar"><button className="text-button" onClick={()=>navigate('today')}><ChevronLeft size={18}/>稍后继续</button><span>{titles[deck]} · 剩余 {queue.length} 次</span></div>{current?<><div className="flashcard"><span className="pill">{queue[0].retry?'再见一次，加深印象':state.progress[current.id]?'到期复习':'认识一个新词'}</span><h1 lang="en">{current.word}</h1><button className="audio-button" aria-label="朗读单词" onClick={()=>speak(current.word)}><Volume2 size={22}/></button>{revealed?cardContent(current):<div className="recall-hint"><span>先想一想</span><p>你还记得这个词的意思吗？</p></div>}</div><div className="answer-actions">{revealed?<><button disabled={busy} className="secondary" onClick={()=>respond(false)}>忘了，再练一次</button><button disabled={busy} className="primary" onClick={()=>respond(true)}><Check size={19}/>记得</button></>:<button className="primary reveal" onClick={()=>setRevealed(true)}>揭晓释义<ArrowRight size={18}/></button>}</div><p className="study-caption">每次回答都会保存 · 诚实地回忆，比答对更重要</p></>:<div className="completion"><span className="completion-icon"><Check size={42}/></span><h1>今天的练习完成了</h1><p>你今天已经练习了 {daily.completed.length} 个词。<br/>让记忆休息一下，我们明天再见。</p><button className="primary" onClick={()=>navigate('today')}>返回首页<ArrowRight size={18}/></button></div>}</section>}
  {page==='me'&&<section className="me-page"><div className="page-intro"><span className="eyebrow">A LITTLE, EVERY DAY</span><h1>看见自己的积累。</h1><p>不用和别人比，每天比昨天多记住一点。</p></div><section className="daily-goal"><div className="section-heading"><div><span className="eyebrow">TODAY’S PROGRESS</span><h2>今日新词目标</h2></div><strong>{progress}%</strong></div><div className="goal-progress" role="progressbar" aria-label="今日新词目标" aria-valuemin={0} aria-valuemax={state.settings.dailyGoal} aria-valuenow={Math.min(daily.newWords.length,state.settings.dailyGoal)}><i style={{width:`${progress}%`}}/></div><p>已学 <strong>{daily.newWords.length}</strong> / {state.settings.dailyGoal} 个新词 · {progress===100?'今日目标达成，真棒！':`还差 ${Math.max(0,state.settings.dailyGoal-daily.newWords.length)} 个，继续积累。`}</p></section><div className="personal-stats"><div><Flame size={24}/><strong>{studiedDays}</strong><span>累计学习天数</span></div><div><BookOpen size={24}/><strong data-testid="learned-count">{learned}</strong><span>已学独立词数</span></div></div><section className="settings-card"><h2>每天学多少新词？</h2><p>到期复习不占新词名额，四个词库共用每日目标。</p><div className="goal-options">{[5,10,15,20].map(n=><button disabled={busy} key={n} className={state.settings.dailyGoal===n?'selected':''} onClick={()=>commit({...state,settings:{...state.settings,dailyGoal:n},session:null})}>{n}<small>词 / 天</small></button>)}</div></section><section className="settings-card"><h2>把积累，好好保存</h2><p>进度只保存在当前设备。清除网站数据会丢失记录，建议定期导出备份。安装到主屏幕后，请确认进度是否一致；需要时可导入备份。</p><div className="backup-actions"><button className="secondary" onClick={exportBackup}><Download size={18}/>导出备份</button><label className="secondary upload"><Upload size={18}/>导入备份<input aria-label="导入备份文件" type="file" accept=".json,application/json" disabled={busy} onChange={e=>{void importBackup(e.target.files?.[0]);e.target.value='';}}/></label></div></section><section className="settings-card install-card"><div><h2>让词记住进你的主屏幕</h2><p>像 App 一样打开，随时学一点。</p></div><button className="icon-button" aria-label="查看安装说明" onClick={()=>setInstall(true)}><ArrowUpRight size={22}/></button></section><p className="about-copy">每日词记 1.1 · 精选版，非完整考试词表<br/>300 个内置独立词条 · 支持自定义扩充词库<br/>原创释义与例句 · 系统英语语音 · 无需账号</p></section>}
  </main>
  <nav className="bottom-nav" aria-label="主导航">{([['today','今日学习',Sun],['library','词库',BookOpen],['me','我的',UserRound]] as const).map(([p,label,Icon])=><button key={p} className={page===p||p==='today'&&page==='study'?'active':''} onClick={()=>navigate(p)}><Icon size={21}/><span>{label}</span></button>)}</nav>
  {adding&&<div className="modal-backdrop"><section className="modal" role="dialog" aria-modal="true" aria-label="添加单词"><button className="modal-close icon-button" aria-label="取消添加" disabled={busy} onClick={()=>setAdding(false)}><X size={21}/></button><span className="eyebrow">MY WORD COLLECTION</span><h2>添加到{titles[deck]}</h2><p>英文和释义必填，其余可选。相同单词会合并，保留已有释义与学习进度。</p><form className="word-form" onSubmit={async e=>{e.preventDefault();setFormError('');try{if(await commit(addWord(state,words,draft,deck))){setAdding(false);setSearch(draft.word.trim());setNotice('单词已添加到当前词库。');}}catch(err){setFormError(err instanceof Error?err.message:'添加失败，请重试。');}}}>{([['word','英文单词',100],['meaning','中文释义',500],['pos','词性（可选）',50],['example','英文例句（可选）',2000],['translation','例句翻译（可选）',2000]] as const).map(([key,label,limit])=><label key={key}>{label}<input autoFocus={key==='word'} required={key==='word'||key==='meaning'} maxLength={limit} value={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.value})}/></label>)}{formError&&<p role="alert">{formError}</p>}<button className="primary" disabled={busy}>保存单词</button></form></section></div>}
  {(detail||install||backup)&&<div className="modal-backdrop" onClick={()=>{setDetail(undefined);setInstall(false);setBackup(undefined);}}><section className="modal" role="dialog" aria-modal="true" aria-label={detail?'单词详情':backup?'确认导入备份':'安装说明'} onClick={e=>e.stopPropagation()}><button autoFocus className="modal-close icon-button" aria-label={detail?'关闭词条':'关闭弹窗'} onClick={()=>{setDetail(undefined);setInstall(false);setBackup(undefined);}}><X size={21}/></button>{detail?<><span className="eyebrow">WORD NOTES</span><h2 className="detail-word" lang="en">{detail.word}</h2><button className="audio-button" aria-label="朗读单词" onClick={()=>speak(detail.word)}><Volume2 size={22}/></button>{cardContent(detail)}<form className="note-editor" onSubmit={async e=>{e.preventDefault();if(await commit(setNote(state,detail.id,note)))setNotice('备注已保存。');}}><label htmlFor="word-note">我的备注</label><textarea id="word-note" maxLength={2000} rows={4} value={note} onChange={e=>setNoteDraft(e.target.value)} placeholder="在哪里学到？有什么记忆技巧？"/><button className="primary" disabled={busy}>保存备注</button></form></>:backup?<><h2>恢复这份学习记录？</h2><p>包含 {backup.customWords.length} 个自定义词条、{Object.keys(backup.notes).length} 条备注、{Object.keys(backup.progress).length} 个已学词、{Object.keys(backup.days).length} 天记录，每日目标为 {backup.settings.dailyGoal} 词。</p><p>确认后将整体替换本机进度，建议先导出当前备份。</p><div className="backup-actions"><button className="secondary" onClick={exportBackup}>先导出当前备份</button><button className="primary" disabled={busy} onClick={async()=>{if(await commit(backup)){setBackup(undefined);setNotice('备份已恢复。');}}}>确认替换</button></div></>:<><span className="brand-icon"><Leaf size={26}/></span><h2>把每日词记<br/>添加到 iPhone 主屏幕</h2><ol className="install-steps"><li>在 <strong>Safari</strong> 中打开本站。</li><li>轻点分享按钮，选择<strong>添加到主屏幕</strong>。</li><li>若有“作为网页 App 打开”选项，请开启，再轻点<strong>添加</strong>。</li><li>首次联网打开，看到“已准备好离线学习”后，即可离线背词。</li></ol><p className="muted">离线朗读取决于设备上的英语语音。更换设备时可通过备份导入进度。</p></>}</section></div>}
 </div>;
}
