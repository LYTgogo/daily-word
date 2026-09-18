import {test,expect} from '@playwright/test';
import {readFile,writeFile} from 'node:fs/promises';
test('mobile learning persists, hides answers, retries forgotten words and works offline',async({page,context})=>{
 await page.goto('./');
 await expect(page.getByRole('heading',{name:'每天一点，记得更久。'})).toBeVisible();
 await page.getByRole('button',{name:'开始今日学习'}).click();
 await expect(page.getByRole('heading',{name:'adapt',exact:true})).toBeVisible();
 await expect(page.getByText('适应；调整',{exact:true})).not.toBeVisible();
 await page.getByRole('button',{name:'揭晓释义'}).click();
 await expect(page.getByText('适应；调整',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'忘了，再练一次'}).click();
 await expect(page.getByRole('heading',{name:'achieve',exact:true})).toBeVisible();
 await page.reload();
 await page.getByRole('button',{name:'继续学习'}).click();
 await expect(page.getByRole('heading',{name:'achieve',exact:true})).toBeVisible();
 for(let i=0;i<9;i++) {await page.getByRole('button',{name:'揭晓释义'}).click();await page.getByRole('button',{name:'记得'}).click();}
 await expect(page.getByRole('heading',{name:'adapt',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'揭晓释义'}).click();await page.getByRole('button',{name:'记得'}).click();
 await expect(page.getByRole('heading',{name:'今天的练习完成了'})).toBeVisible();
 await page.getByRole('button',{name:'返回首页'}).click();
 await expect(page.getByText('已准备好离线学习')).toBeVisible({timeout:20000});
 await context.setOffline(true);await page.reload();
 await expect(page.getByRole('heading',{name:'每天一点，记得更久。'})).toBeVisible();
 await page.getByRole('button',{name:'我的',exact:true}).click();
 await expect(page.getByTestId('learned-count')).toHaveText('10');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});
test('decks, search and backup validation work',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'词库',exact:true}).click();
 await page.getByRole('button',{name:/雅思 IELTS/}).click();
 await page.getByPlaceholder('搜索单词或中文释义').fill('accommodation');
 await page.getByRole('button',{name:/accommodation/}).click();
 await expect(page.getByText('住宿',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'关闭词条'}).click();
 await page.getByRole('button',{name:'我的',exact:true}).click();
 await page.getByLabel('导入备份文件').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{}')});
 await expect(page.getByRole('alert')).toContainText('备份格式不正确');
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'导出备份'}).click();
 expect((await download).suggestedFilename()).toMatch(/每日词记.*json/);
});
test('valid backup requires confirmation, restores settings and survives restart',async({page})=>{
 await page.goto('./');await page.getByRole('button',{name:'我的',exact:true}).click();
 const fixture={version:1,settings:{deck:'ielts',dailyGoal:5},progress:{adapt:{stage:1,due:'2026-09-19',firstSeen:'2026-09-18'}},days:{'2026-09-18':{completed:['adapt'],newWords:['adapt']}},answered:['backup-test'],session:null};
 await page.getByLabel('导入备份文件').setInputFiles({name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
 await expect(page.getByRole('dialog')).toContainText('1 个已学词');
 await expect(page.getByTestId('learned-count')).toHaveText('0');
 await page.getByRole('button',{name:'确认替换'}).click();
 await expect(page.getByTestId('learned-count')).toHaveText('1');
 await page.reload();await page.getByRole('button',{name:'我的',exact:true}).click();
 await expect(page.getByTestId('learned-count')).toHaveText('1');
 await expect(page.getByRole('button',{name:'5 词 / 天',exact:true})).toHaveClass('selected');
 await page.getByRole('button',{name:'词库',exact:true}).click();
 await expect(page.getByRole('button',{name:/雅思 IELTS/})).toHaveClass('selected');
});
test('service worker update preserves progress and offline capability',async({page,context})=>{
 await page.goto('./');await expect(page.getByText('已准备好离线学习')).toBeVisible();
 await page.getByRole('button',{name:'开始今日学习'}).click();await page.getByRole('button',{name:'揭晓释义'}).click();await page.getByRole('button',{name:'记得'}).click();
 await expect(page.getByRole('heading',{name:'achieve',exact:true})).toBeVisible();
 const original=await readFile('dist/sw.js','utf8');
 try {
  await writeFile('dist/sw.js',original+`\n// update lifecycle test ${Date.now()}\n`);
  await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;await r.update();});
  await expect(page.getByRole('button',{name:'更新',exact:true})).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:'更新',exact:true}).click();
  await page.getByRole('button',{name:'继续学习'}).click();
  await expect(page.getByRole('heading',{name:'achieve',exact:true})).toBeVisible();
  await context.setOffline(true);await page.reload();
  await page.getByRole('button',{name:'我的',exact:true}).click();await expect(page.getByTestId('learned-count')).toHaveText('1');
 } finally {await writeFile('dist/sw.js',original);}
});
test('mobile layouts and icon assets are present without runtime errors',async({page,request},testInfo)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('./');await expect(page.getByText('已准备好离线学习')).toBeVisible();
 await page.screenshot({path:testInfo.outputPath('home-mobile.png'),fullPage:true});
 for(const width of [320,390,768,1280]) {await page.setViewportSize({width,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
 await page.screenshot({path:testInfo.outputPath('home-desktop.png'),fullPage:true});
 const m=await (await request.get('manifest.webmanifest')).json();
 expect(m.display).toBe('standalone');
 for(const icon of m.icons) expect((await request.get(icon.src)).status()).toBe(200);
 expect((await request.get('icons/apple-touch-icon.png')).status()).toBe(200);
 expect(errors).toEqual([]);
});
test('missing English voices explains the limitation without blocking study',async({page})=>{
 await page.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],cancel:()=>{}},configurable:true});});
 await page.goto('./');await page.getByRole('button',{name:'开始今日学习'}).click();
 await page.getByRole('button',{name:'朗读单词',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('未找到英语语音');
 await page.getByRole('button',{name:'揭晓释义'}).click();await page.getByRole('button',{name:'记得',exact:true}).click();
 await expect(page.getByRole('heading',{name:'achieve',exact:true})).toBeVisible();
});
