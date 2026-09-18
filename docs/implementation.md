# 实施约定

已获用户确认：PWA、词汇记忆、四六级与雅思托福两个专区、四库各 150 精选词、本机存储、公开代码与 GitHub Pages。

## 模块

- `src/core.ts`：可独立测试的学习状态、日期、复习调度、队列与备份验证。
- `src/storage.ts`：IndexedDB 单条状态的原子读写；事务提交后才前进至下一题。
- `src/words.ts`：原创精选词条及共享词库归属。
- `src/App.tsx`：三个主页面、学习卡片、朗读、备份确认、PWA 更新与安装说明。
- `src/style.css`：手机优先的响应式界面及装饰性植物插画。
- `vite.config.ts`：子路径、主屏幕应用声明、全词库与资源离线缓存。

## 重要行为

新词额度全库共享，到期复习仅从当前词库取出，按最早到期优先；新词使用编辑排序。切换词库或修改目标时重新建立练习队列，已经提交的进度不受影响。

每个作答使用唯一 token 防止重复提交；同一天同一单词只计一次「已练」。忘记后保留次日复习日期，当次重练即使答对也不提升间隔。连续忘记会继续放到队尾，用户可随时退出稍后继续。

跨日自动回到首页，按新一天的本地日期重新建立队列。间隔通过日历加天计算，避免把夏令时的一天当成固定毫秒数。

主屏幕图标为原创书页与新芽，在 Canva 建立可编辑设计；App 使用本地 PNG，首次缓存不依赖 Canva 外链。

缓存更新需用户点击；更新使用 service worker controllerchange 刷新页面，避免首次打开时 Workbox 的初始 isUpdate=false 导致更新按钮无效。缓存切换不修改 IndexedDB。

## 发布

用户已创建公开仓库 `LYTgogo/daily-word` 并将 Pages Source 设为 GitHub Actions。代码使用 GitHub 连接器上传，保留初始 README 提交作为父提交，无强制覆盖历史。

首次应用发布提交：`8afe8547a592c8283c64a46a8d1f16c8418369d6`。

正式网址：https://lytgogo.github.io/daily-word/

首次部署：https://github.com/LYTgogo/daily-word/actions/runs/35360674162

本地 `published` 分支跟踪 `origin/main`，原 `main` 分支保留初始本地实现提交。
