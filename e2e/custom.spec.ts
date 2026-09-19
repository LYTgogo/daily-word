import {test,expect} from '@playwright/test';
test('custom vocabulary and notes persist offline and survive backup import',async({page,context})=>{
 await page.goto('./');await expect(page.getByText('已准备好离线学习')).toBeVisible();
 await page.getByRole('button',{name:'词库',exact:true}).click();
 await expect(page.locator('.word-list')).not.toBeVisible();
 await page.getByRole('button',{name:'展开全部单词'}).click();
 await expect(page.locator('.word-list > button')).toHaveCount(150);
 await page.getByRole('button',{name:'折叠单词列表'}).first().click();
 await page.getByRole('button',{name:'添加单词',exact:true}).click();
 await page.getByLabel('英文单词').fill('serendipity');await page.getByLabel('中文释义').fill('意外的美好发现');
 await page.getByRole('button',{name:'保存单词'}).click();
 await expect(page.getByRole('status')).toContainText('单词已添加');
 await page.getByPlaceholder('搜索单词或中文释义').fill('serendipity');
 await page.getByRole('button',{name:/serendipity/}).click();
 await page.getByLabel('我的备注').fill('在小说里学到，记住一次美好的巧合。');
 await page.getByRole('button',{name:'保存备注'}).click();
 await page.getByRole('button',{name:'关闭词条'}).click();
 await page.getByRole('button',{name:'我的',exact:true}).click();
 const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'导出备份'}).click();
 const path=await (await downloadPromise).path();
 await page.getByRole('button',{name:'今日学习',exact:true}).click();
 await page.getByRole('button',{name:'开始今日学习'}).click();
 await expect(page.getByRole('heading',{name:'serendipity',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'揭晓释义'}).click();await expect(page.getByText('在小说里学到，记住一次美好的巧合。')).toBeVisible();
 await page.getByRole('button',{name:'记得',exact:true}).click();
 await page.getByRole('button',{name:'我的',exact:true}).click();
 await expect(page.getByRole('progressbar',{name:'今日新词目标'})).toHaveAttribute('aria-valuenow','1');
 await page.getByRole('button',{name:'5 词 / 天',exact:true}).click();
 await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax','5');
 await context.setOffline(true);await page.reload();await page.getByRole('button',{name:'我的',exact:true}).click();
 await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow','1');
 await page.getByLabel('导入备份文件').setInputFiles(path!);await expect(page.getByRole('dialog')).toContainText('1 个自定义词条');
 await page.getByRole('button',{name:'确认替换'}).click();
 await page.getByRole('button',{name:'词库',exact:true}).click();await page.getByPlaceholder('搜索单词或中文释义').fill('serendipity');
 await page.getByRole('button',{name:/serendipity/}).click();
 await expect(page.getByLabel('我的备注')).toHaveValue('在小说里学到，记住一次美好的巧合。');
 for(const width of [320,390,835]){await page.setViewportSize({width,height:898});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
});
test('both collection cards have a black hover border',async({page})=>{
 await page.setViewportSize({width:835,height:898});await page.goto('./');
 for(const selector of ['.collection.college','.collection.abroad']){
  await page.locator(selector).hover();await expect(page.locator(selector)).toHaveCSS('border-top-color','rgb(0, 0, 0)');
 }
});
