# 验证记录

日期：2026-09-18

## 已通过

- `npm test`：10 / 10，通过规则、日期和词库检查。
- `npm run build`：TypeScript 检查和 Vite 生产构建成功。
- `npm run test:e2e`：6 / 6，通过 Chromium 移动视口端到端测试。
- 浏览器手动检查：桌面和 390px 手机宽度首页正常，无横向溢出。
- 自动检查宽度：320、390、768、1280px，无横向溢出。
- 安装资源：manifest 独立窗口模式、192/512px 图标及 Apple touch icon 均可访问。
- 离线首次缓存后的页面刷新、练习保存与恢复。
- 模拟替换 Service Worker，点击更新，继续未完成学习，再断网验证已有进度。
- 无效备份被拦截；有效备份导入前展示摘要，确认后恢复设置和已学数量，刷新后保持。
- 缺失英语语音时说明原因，仍可继续文字学习。
- 浏览器验证未发现页面脚本运行错误。

## 本次修复

发现首次打开时 Workbox 在注册时记录 isUpdate=false，之后新 worker 激活未触发应用刷新。增加 controllerchange 刷新处理与 clientsClaim 后，更新回归测试通过。

## 线上验收

- 公开仓库：https://github.com/LYTgogo/daily-word
- GitHub Actions 第 1 次部署成功，10 项规则测试、6 项浏览器测试与生产构建均通过。
- 部署记录：https://github.com/LYTgogo/daily-word/actions/runs/35360674162
- HTTPS 地址：https://lytgogo.github.io/daily-word/
- 已直接打开线上首页，进入学习卡片并揭晓双语内容；返回首页确认「已准备好离线学习」。

## 未完成的真机验收

- 真实 iPhone 主屏幕安装、独立窗口冷启动、系统发音与飞行模式检查：需要真机，见 iphone-checklist.md。

浏览器移动视口模拟不代表已完成 iOS 真机测试。离线语音取决于设备可用的英语语音；本项目未预下载朗读音频。
