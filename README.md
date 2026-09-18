# 每日词记

面向 iPhone 的离线英语词汇 PWA。米白与绿色界面，每天学一点，间隔复习记得更久。

**正式网址：[打开每日词记](https://lytgogo.github.io/daily-word/)**

[GitHub 仓库](https://github.com/LYTgogo/daily-word) · [首次部署与测试记录](https://github.com/LYTgogo/daily-word/actions/runs/35360674162)

## 功能

- 「四六级」「雅思托福」两个专区，四级、六级、雅思、托福各 150 个精选词。
- 共 300 个独立词条：100 个共同基础词 + 各 50 个专项词；重复词共享进度。
- 每词包含词性、中文释义、原创英文例句及中文翻译，支持系统英语朗读。
- 先复习到期词，再学习新词。每日新词目标 5 / 10 / 15 / 20，跨词库共用。
- 记得后间隔为 1、3、7、14、30 天；忘记后在队尾重练并次日再复习。
- IndexedDB 本机保存、练习中断恢复、JSON 备份导入导出、离线缓存。

**精选版，非完整考试词表；不是官方考试机构出品。** 不使用账号、分析统计或付费 AI 服务。

## iPhone 安装

1. 使用 Safari 打开发布后的 HTTPS 网址。
2. 分享 → 添加到主屏幕；若显示“作为网页 App 打开”，请开启。
3. 从主屏幕打开，联网等待首页显示「已准备好离线学习」。
4. 开启飞行模式再打开，验证文字学习可用。离线朗读取决于设备上的英语语音。

进度属于当前浏览器/主屏幕应用的本地存储。安装后如进度不同，可导入之前导出的备份。清除网站数据或更换设备可能丢失本地记录，请定期备份。单词发音由浏览器语音服务处理，非本地语音可能需要网络。

## 本地开发

需要 Node.js 24。

```sh
npm ci
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

开发入口为 `http://127.0.0.1:5173/daily-word/`。生产预览运行 `npm run preview`，入口为 `http://127.0.0.1:4173/daily-word/`。PWA 缓存在生产构建预览中验证。

## GitHub Pages 发布

1. 创建公开仓库 `LYTgogo/daily-word`；如果已有同名项目，则使用 `daily-word-pwa`，不覆盖已有项目。
2. 在仓库 Settings → Pages → Source 选择 GitHub Actions。
3. 推送项目至 `main`；部署工作流先测试、构建，再发布。
4. 以 Actions 部署结果中的 `page_url` 为实际网址，不以预期地址替代发布验证。

`BASE_PATH` 控制部署子目录，默认 `/daily-word/`；Actions 自动根据仓库名设置。没有自定义域名或后端数据库。

## 内容与设计

内容说明见 [词库来源与编辑规则](docs/content-provenance.md)。
图标原稿位于 `design/app-icon.html` 和 `public/icons/icon.svg`。
可编辑的 [Canva 图标设计](https://www.canva.com/d/6Zq02_CXf3vKwv4) 已由原稿导入。App 使用同一原稿的本地 PNG 输出，避免依赖带有效期的远程图片地址。

## 验证与限制

自动测试覆盖间隔复习、日期跨月跨年、重复提交、每日上限、共享进度、备份验证、练习恢复和离线刷新。浏览器模拟不能替代真实 iPhone 验收，详见 [iPhone 验收清单](docs/iphone-checklist.md)。

备份整体替换前会显示摘要并要求确认；无效备份不会写入。保存失败时保留当前题目并提示重试。更新缓存不会清除 IndexedDB。
