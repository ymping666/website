# TensorDrill 搜索入口与收录检查

更新：2026-10-09。下列词按已有题目与访问意图分配，不代表已经验证搜索量、竞争度或排名。保留现有网址，英文在根路径，中文在 `/zh/`。

| 主搜索意图 | 承接页面 | 内容范围 |
|---|---|---|
| AI coding challenges / AI 编程刷题 | 首页、`/problems/` | 100 道题及按主题、难度、进度筛选 |
| 机器学习编程练习 / 深度学习练习题 | `/tracks/ai-foundations/` | 矩阵、CNN、归一化、梯度和优化器 |
| Transformer 编程练习题 | `/tracks/transformer-vision/` | Attention、多头布局、RoPE、SwiGLU 和 ViT |
| Attention 机制代码实现 | `/concepts/attention-fundamentals/` | 缩放点积、因果掩码与交叉注意力 |
| Flow Matching coding exercises | `/concepts/flow-matching/` | 概率路径、速度目标、损失与 ODE 求解器 |
| Diffusion model coding practice | `/practice-sets/diffusion-core-and-sampling/` | 从加噪到 DDPM 后验均值、DDIM 的七步题单 |
| ReAct agent implementation exercises | `/concepts/agent-control/` | 轨迹校验、工具解析、重试和反思控制，不宣称完整 Agent 训练 |
| LLM engineering practice | `/tracks/llm-systems/` | 检索指标、证据组织和解码权重 |

## 已实现

主入口的独立中英文 `<title>`、description、H1 和可见介绍相互对应。首页及题库链接到五个优先专题，专题之间增加相关练习。内容直接包含在静态 HTML 中，不依赖 JavaScript 生成。

全站使用语言独立的 self-canonical、相互对应的 `hreflang`、分享摘要；首页提供 TensorDrill 的 `WebSite` 结构化数据。当前 sitemap 包含 528 个公开页面（含后来补齐的双语条款页），两种语言的个人进度页保持 noindex。没有添加 Google 不使用的 meta keywords，也没有新增重复的关键词落地页。

`npm run check` 包含渲染后的 SEO 检查。正式域名构建须使用 `SITE_BASE=/` 与 `SITE_ORIGIN=https://tensordrill.com`，GitHub Pages 预览继续使用自己的路径和域名。

## Search Console 的账户操作

1. 用站主账号添加并验证 `tensordrill.com` 的网域资源。TXT 值以该账号的验证页面为准。
2. 提交 `https://tensordrill.com/sitemap.xml`。已有提交时查看读取和收录状态即可，不必反复提交。
3. 用 URL 检查工具测试英文、中文首页及上表五个优先专题，确认可抓取和 canonical；请求编入索引。
4. 后续查看真实查询词、展现、点击和页面收录错误，再决定需要补充哪些题目和解释。网站技术检查通过不等于 Google 已收录。

截至本次代码更新，未通过站主 Search Console 账号核实资源验证或索引状态。Google 说明抓取可能需要数天至数周，请求抓取也不保证收录或排名。

## Cloudflare 抓取规则

2026-10-09 实际读取正式站的 `robots.txt`：Cloudflare 管理的内容包含 `User-agent: *` / `Allow: /`，没有对普通 `Googlebot` 的禁止条目；同时明确包含 `User-agent: Baiduspider` / `Disallow: /`。这会阻碍遵守 robots 的百度爬虫。浏览器访问首页和 sitemap 返回 200，部分自动 HTTP 请求返回 403，不能据此断言经过验证的 Googlebot 被阻止。

如果需要百度收录，在 Cloudflare 的 AI Crawl Control 与受管理的 robots 设置中核对百度对应规则，使 robots 声明和实际访问策略都允许该搜索爬虫；调整后重新读取公开 robots，并在搜索引擎站长工具中验证抓取。该规则由 Cloudflare 注入，仓库内追加一条通用 `Allow: /` 不能抵消具体爬虫的 `Disallow: /`。本次代码发布未更改账户中的爬虫策略。

## 官方依据

- [Google 标题建议](https://developers.google.com/search/docs/appearance/title-link)：描述清晰、简洁，标题语言与页面一致。
- [多语言页面](https://developers.google.com/search/docs/specialty/international/localized-versions)：语言独立网址与相互对应的标注。
- [重新抓取与收录](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)：站点地图、URL 检查和等待抓取。
- [网站名称](https://developers.google.com/search/docs/appearance/site-names)：首页的 `WebSite` 名称信号。
- [Cloudflare robots 设置](https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/)与[爬虫访问策略](https://developers.cloudflare.com/ai-crawl-control/features/manage-ai-crawlers/)：区分 robots 声明与实际阻止。
