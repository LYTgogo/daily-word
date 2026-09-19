# 参与每日词记

欢迎修复问题、完善体验、校对词库或提交真机测试结果。不需要仓库写入权限：Fork 本仓库，在自己的分支修改，再向 `LYTgogo/daily-word` 的 `main` 提交 Pull Request（PR）。由维护者 @LYTgogo 审核并决定是否合并、发布。

本项目采用 [MIT 许可证](LICENSE)。提交贡献即表示你有权提供这些内容，并同意按项目的 MIT 许可证发布你的贡献。第三方内容请保留其许可证与来源，并先与维护者确认兼容性。

## 从哪里开始

- 在 [Issues](https://github.com/LYTgogo/daily-word/issues) 报告问题或提出建议；先搜索是否已有类似反馈。
- 初次贡献可从 [good first issue](https://github.com/LYTgogo/daily-word/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22) 开始，在任务下留言说明想认领的范围。
- 大功能先提交建议，确认方向再编码。一次 PR 尽量只解决一个问题。
- 不会写代码也可以校对英文和翻译、改进安装说明、提交 iPhone 验收结果。

## 本地运行和检查

安装 Node.js 24，克隆你的 Fork，进入项目目录后执行：

```sh
npm ci
npm run dev
```

开发地址：`http://127.0.0.1:5173/daily-word/`。提交前执行：

```sh
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Linux 上可用 `npx playwright install --with-deps chromium` 安装浏览器及系统依赖。浏览器测试会启动生产预览。PWA 离线与更新行为请在生产构建验证；开发服务器不能代替离线验收。手动预览使用 `npm run preview`，地址为 `http://127.0.0.1:4173/daily-word/`。

## 修改约定

- 保持中文界面及现有代码风格，不捎带无关重构或新增依赖。
- 修复逻辑问题时先补可复现的测试；修改 UI 时提供前后截图，并检查窄屏和键盘操作。
- 学习进度、备注和自定义词保存在本机。修改数据格式时兼容旧记录与备份，不静默清空 IndexedDB。
- 同词跨词库共享稳定 ID、学习进度和备注。不要随意改动已有词条 ID。
- 每日统计按设备本地日期计算，重复作答不重复计数；复习不占新词目标。
- 保持 GitHub Pages 子路径和离线功能可用。真机测试见 [iPhone 验收清单](docs/iphone-checklist.md)。

## 词库贡献

词库文件为 `src/words.ts`，编辑规则见 [内容来源说明](docs/content-provenance.md)。

- 提供词性、中文释义、自然的英文例句和对应翻译，并说明所属词库。
- 释义与例句应原创或具备适用授权；记录参考来源，不复制商业词典内容。
- 内置词库当前为四个各 150 词的精选版。校对无需扩充数量；扩容请先提 Issue，获确认后同步更新数量测试和页面说明。
- 用户在应用里添加的词只属于本机数据，不会自动成为公共词库贡献。

## 提交与审核

1. 创建自己的工作分支，提交清晰、聚焦的修改。
2. 创建 PR，填写关联 Issue、改动说明、验证结果；界面变化附截图，说明真机测试是否完成。
3. 等待 `PR quality checks` 通过并回应维护者意见。首次外部贡献的 Actions 运行可能需要维护者批准。
4. 维护者审核后合并。PR 测试不会发布网站；合并至 `main` 后才由独立工作流测试并部署。

请尊重其他贡献者。公开 Issue、PR 和截图中不要包含个人备份、私人备注或访问凭据；复现问题请使用虚构学习数据。
