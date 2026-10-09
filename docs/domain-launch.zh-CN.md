# TensorDrill 正式上线操作

更新：2026-10-09。正式域名已购买：`tensordrill.com`。站主已完成 Cloudflare 配置；正式域名的 HTTPS 请求已验证返回 200。GitHub Pages 保留为测试站。

## 1. 检查域名状态

在阿里云「域名控制台 → tensordrill.com」确认**该域名**的实名认证状态为已通过、邮箱验证完成、域名状态正常。账号或信息模板认证通过不等于域名已完成关联认证。

2026-10-09 查询注册局时仍出现 `client hold`，当时 DNS 为 `DNS21.HICHINA.COM`、`DNS22.HICHINA.COM`。这是查询时的状态，不是持续监控。若实名认证已通过仍显示暂停解析，请查看阿里云的锁定原因并按控制台要求解除，不能靠更换 DNS 绕过。

官方排查：[解除 ClientHold / ServerHold](https://help.aliyun.com/zh/dws/support/how-to-unlock-a-domain-name-that-is-in-the-serverhold-or-clienthold-state)。

## 2. Cloudflare Pages 免费部署

Cloudflare「Workers & Pages → Create application → Pages」。新版创建应用页面可能先显示 Workers，选择 **Continue to Pages**。

连接 GitHub，选择 `ymping666/website`；授权页面只选择此仓库。

| 设置 | 值 |
|---|---|
| 项目名 | `tensordrill`（可用时） |
| 生产分支 | `main` |
| 框架预设 | `None` |
| 构建命令 | `npm run build && npm run check` |
| 输出目录 | `site` |
| 根目录 | 仓库根目录，留空 |
| `NODE_VERSION` | `22` |
| `PYTHON_VERSION` | `3.12` |
| `SITE_BASE` | `/` |
| `SITE_ORIGIN` | `https://tensordrill.com` |

本站为静态站，不需要 Workers Functions、数据库或付费订阅。Pages 云端检查验证参考代码、判题逻辑、翻译、导航及进度逻辑；真实 Pyodide 浏览器检查继续由 GitHub Actions 执行。首次发布前确认同一提交的 GitHub 检查成功。

首次部署成功后检查实际分配的 `*.pages.dev` 地址。英文首页在 `/`，中文入口在 `/zh/`；正式站不再带 `/website/`。

官方配置：[Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/) · [构建环境](https://developers.cloudflare.com/pages/configuration/build-image/)。

## 3. 绑定根域名

Cloudflare 添加网站 `tensordrill.com`，选 **Free** 计划，获得该账户为此域名分配的两条 nameserver。

在阿里云「域名控制台 → tensordrill.com → DNS 修改」中，将现有 DNS 服务器替换为这两条 Cloudflare nameserver。这里修改的是 DNS 服务器，不是随便新增两条 NS 解析记录。不要套用其他人的 nameserver，也不需要把域名转移到 Cloudflare 注册商。

Cloudflare 确认域名状态 Active 后，在 Pages 项目「Custom domains → Set up a domain」添加 `tensordrill.com`，由平台配置 DNS 与 HTTPS。需在 Pages 中关联域名，不能只手工创建 CNAME。

若需要 `www.tensordrill.com`，另行添加并统一跳转至根域名。DNS 和证书生效以控制台状态及实际 HTTPS 访问为准。

官方说明：[自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/)。

## 4. 验证正式站与记录迁移

检查英文/中文、搜索和筛选、题目运行与提交、手机页面、备份导入导出、canonical 和 sitemap。原来的 localStorage 键与备份格式保留；**不同域名的浏览器存储仍然隔离**。旧站用户先在 Progress 导出备份，再在新域名导入。

正式站通过检查后，再统一宣传地址；旧预览的索引与重定向按托管能力调整，避免同时推广两个地址。

## 5. Google Search Console

域名正常访问后，用站主自己的 Google 账号打开 [Search Console](https://search.google.com/search-console)。添加「网域资源」`tensordrill.com`，将 Google 给出的 TXT 验证值添加到 Cloudflare DNS，返回验证。TXT 值必须来自该账户的验证页面。

提交 `https://tensordrill.com/sitemap.xml`，并用 URL 检查工具请求首页、题库、几个主要知识点页面的索引。个人进度页保持 noindex。后续看索引错误、真实搜索词、展现和点击，不以 `site:` 搜索代替 Search Console 的索引报告。

官方说明：[添加资源](https://support.google.com/webmasters/answer/34592?hl=zh-Hans) · [提交 sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)。

首发先收集少量学习者的加载、评测及内容反馈，不同时启用登录、数据库或广告服务。
