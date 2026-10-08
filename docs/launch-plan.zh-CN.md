# FrontierCode 上线与低成本运营计划

更新：2026-10-08。代码仓库：<https://github.com/ymping666/website>。

当前已完成：源码上传、GitHub Pages HTTPS 测试预览发布、根路径与子路径检查、真实 Chrome/Pyodide 的 553 条断言及超时恢复、GitHub 云端浏览器测试。测试站：<https://ymping666.github.io/website/>。尚未购买域名或启用广告、流量分析。

## 定位与文章经验的应用

面向希望掌握 AI 原理和实现细节的学习者，免费、免注册地完成短 Python 实现题，获取可执行测试和独立题解。现有英文内容优先上线验证，语言扩展应由真实用户反馈决定。

[陈然的经验帖](https://ranchen.org/content/20261002-rancheng-article-content-site-ad-revenue)给我们的启发是：免费入口、细分知识目录、静态内容、互动练习，以及用实际反馈改进。它提供个人经验，不能视作本站收益或搜索排名的保证。

本站的可验证价值应是“能独立实现、能识别典型错误、能迁移到研究代码”，因此除停留时长外，必须跟踪开始练习率、完成率、复访率、纠错反馈，以及题目是否真正帮助理解。不要通过干扰操作或多翻页延长时长。

## 第一阶段：GitHub 上测试

代码和 GitHub Actions 保存在此仓库。GitHub Pages 仅作无广告的项目测试预览。首次需在仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**，然后在 Actions 中重新运行 Publish GitHub Pages preview。

预期预览地址：<https://ymping666.github.io/website/>。只有 Actions 部署成功且实际打开验证后，才称为已经上线。

部署前检查：所有参考实现和错误实现回归测试、子路径内部链接、真实 CDN Pyodide 浏览器判题、草稿和完成记录持久化、死循环终止和恢复、移动端布局。浏览器证据及 sitemap 随 Actions 运行保留；生成的 site/ 不入库。

## 第二阶段：正式托管与域名

建议评估 Cloudflare Pages 免费计划作为静态正式托管。仓库 main → Git 集成，构建命令 `npm run build`，输出 `site`，`SITE_BASE=/`，`SITE_ORIGIN=https://实际项目.pages.dev`，Node 22。先使用平台子域名，不购买域名也能完成部署测试。

Cloudflare 静态资源请求目前免费且不限量，构建及文件数量仍受计划限制。当前规模远小于大规模题库，后续扩容前复核限制。

- [Cloudflare 定价](https://developers.cloudflare.com/pages/functions/pricing/)
- [Git 集成](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [平台限制](https://developers.cloudflare.com/pages/platform/limits/)
- [GitHub Pages 使用限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

广告经营阶段应避免把 GitHub Pages 当作免费商业托管。迁移只需改变构建环境变量，无需重写框架。自定义域名的购买需先确定品牌、注册商、首年及续费总价、可用支付方式；当前没有代购或付费订阅。

域名迁移时更新 canonical、sitemap、Search Console 和内链；旧预览避免长期与正式站争夺索引。localStorage 按域名隔离，用户在旧域名上的草稿和进度不会自动迁移。现在可在旧站 Progress 下载备份，再在新站导入。

## 免注册进度与持续练习

已增加 `/progress/`：每日基础题推荐、继续上次练习、每日 1–3 题目标、28 天练习日历、当前和最佳连续天数、完成里程碑、7 个主题与 19 个题单的完成进度。首页提供继续入口，目录可筛选已完成／未完成题，题单显示完成标记。

设计参考了 [OpenExamPrep 的免费练习入口](https://open-exam-prep.com/practice)、[闪卡复习](https://open-exam-prep.com/flashcards)、[LeetCode 的每日挑战](https://leetcode.com/discuss/post/655704/May-LeetCoding-Challenge-and-the-Badge%21/)、[学习计划](https://leetcode.com/discuss/post/1422121/introducing-new-feature-study-plan-by-le-4ojc/)与[洛谷的专题题单及完成状态](https://help.luogu.com.cn/manual/luogu/training)。这些来源用于选择练习节奏和进度反馈，不推断它们未公开的账户或数据存储实现，也不复制题目内容。

本站用完成的测试运行记录练习日，即使失败也认可实际尝试；每日完成目标要求完整 Submit 通过，同一题每天只计一次。打开页面不算签到。日期跟随设备本地时区，今天尚未练习时仍保留截至昨天的连续天数；休息不会清空解题记录或已得里程碑。旧版本解题记录原样保留，不补造过去的练习日期。所有成就是个人学习反馈，不宣称为防作弊竞赛积分。

保存无需账户：沿用旧 localStorage 键，增加目标和历史，并提供 JSON 备份下载／导入。换设备、浏览器或正式域名时由用户携带文件迁移。导入合并完成记录与历史、保留已有草稿、恢复缺失草稿；重复导入不累计虚假次数。文件只在设备上处理，不上传，不执行其中的代码。保存失败时页面明确提示，并暂存内存供离开前导出。无痕模式和清理站点数据可能丢失记录；当前没有账户级自动云同步。

该方案不新增数据库、登录服务或模型 API 成本。后续若用户明确需要自动跨设备同步，再评估账户与云存储；当前优先验证真实使用需求。

## 第三阶段：验证需求和学习效果

先从 CNN、归一化、梯度、AdamW、Attention、RoPE 等稳定需求的知识簇开始。每个概念页连接题目、题解和练习顺序；扩题必须提供明确合约、独立参考实现、边界测试、典型错误和可信来源。不要为页面数量生成薄内容或简单改名重复题。

[Google 垃圾内容政策](https://developers.google.com/search/docs/essentials/spam-policies)明确涉及以操纵排名为目的的大规模低价值内容；“至少一千页”不应作为本站发布门槛。

部署可用后再连接 Search Console，检查索引和真实搜索词。分析工具需由站主账户创建并提供公开站点 ID，启用前更新隐私说明及适用的同意控制。当前代码没有真实广告或流量跟踪脚本。

建议事件：`problem_open`、`run_samples`、`submit_result`（仅题号、通过数量、耗时）、`hint_open`、`editorial_open`。不发送用户代码、题解输入、研究资料。报表按页面和日期记录展现、点击、练习启动、完成和复访；每次改动记录 Git SHA、观察窗口与结果。没有对照或充分样本时，不把流量变化断言为改动效果。

## 第四阶段：广告与收款

优先验证优质教育内容和真实访问，再评估 AdSense。申请、身份和地址验证、付款账户及税务资料由站主在官方账户中完成。通过审核和获得收益均不保证。

Google 当前列出的中国地区 AdSense 付款方式包括电汇及 Hyperwallet；不意味着必须持有海外银行卡。具体国内账户能否接受该类国际电汇、所需 SWIFT 信息及费用，应向开户行确认，并满足 Google 对付款国家和账户的要求。账户界面可用方式为准。

- [按国家列出的 AdSense 收款方式](https://support.google.com/adsense/answer/1714397?hl=en)
- [电汇账户要求](https://support.google.com/adsense/answer/6025222?hl=en)

获得真实发布商 ID 和广告位后再添加广告脚本、ads.txt、隐私与同意控制。首批广告考虑目录或题解的自然间隔，避免代码编辑区、Run/Submit 附近的误点击位置。本文提到的其他广告网络不自动接入，需要检查实际广告品质和收款条件。

收益只能根据实测估算：`收入 = pageviews / 1000 × page RPM`。例如 30,000 月页面浏览、假设 page RPM 为 1/3/5 美元，对应 30/90/150 美元；这是敏感性演示，不是市场报价或本站预测。CPM、page RPM 和访客数不能混用。

## 成本边界

当前无需付费模型调用、数据库、云端判题或 GPU。正式站继续静态化，Python 消耗用户设备算力；不能把浏览器测试宣称为防作弊竞赛判题。免费计划及服务条款可能变化，超出额度前再评估升级。域名、银行费用和税费另计。
