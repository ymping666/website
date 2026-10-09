# TensorDrill 的 AdSense 接入准备

核对日期：2026-10-09。当前版本只准备网站说明和可选所有权验证，**没有加载广告或同意管理脚本**。网站页面齐全不等于 AdSense 已批准，也不代表所有地区的法律义务都已履行。

## 已补齐的网站内容

| 内容 | 英文路径 | 中文路径 | 用途 |
| --- | --- | --- | --- |
| 隐私政策 | `/privacy/` | `/zh/privacy/` | 本地记录、托管请求、Google/第三方广告数据、退出选择、联系及权利说明 |
| Cookie 与本地存储 | `/cookies/` | `/zh/cookies/` | 备份、清除浏览器数据、当前广告状态和未来同意流程 |
| 使用条款 | `/terms/` | `/zh/terms/` | 教学用途、内容使用、执行与可用性说明 |
| 广告政策 | `/advertising/` | `/zh/advertising/` | 广告标识、展示边界、编辑独立性、不鼓励点击 |
| 关于、联系、内容标准 | `/about/`、`/contact/`、`/standards/` | 对应 `/zh/` 路径 | 维护者、原创练习、纠错及版权反馈入口 |

这些入口出现在所有页面页脚。联系邮箱为维护者授权公开的 `pym123amingge@gmail.com`。私人请求使用邮件；GitHub Issues 是公开的，不应提交个人资料。

[Google 要求隐私政策披露](https://support.google.com/adsense/answer/1348695?hl=en)广告 Cookie、跨网站访问、Google 和第三方提供方，以及个性化广告退出方式。关于、联系、使用条款和独立的广告政策帮助用户理解网站；不应将它们全部说成 Google 强制要求的固定页面清单。第三方广告启用时，还要通过真实供应商列表提供对应隐私及退出信息，不能只保留笼统声明。

## 1. 在 AdSense 中添加正式域名并验证

在账号的网站列表添加 `tensordrill.com`，取得账号提供的真实发布商 ID。构建支持可选环境变量 `ADSENSE_PUBLISHER_ID`，接受 `pub-` 或 `ca-pub-` 后跟 16 位数字。

配置在 Cloudflare 正式站的构建环境，而非仅本地终端。设置后重新构建会：

- 在 HTML 头部加入 `google-adsense-account` 验证元标签。
- 在站点根目录生成 `ads.txt`，使用该 ID 和 Google 的授权记录格式。
- **不会加载广告代码，也不会启用自动广告或同意弹窗。**

不设置 ID 时，不生成元标签或 `ads.txt`；错误格式使构建失败。没有部署占位发布商 ID。将来接入其他卖方时，需要维护 `ads.txt` 的全部真实授权记录。

[Google 支持元标签、ads.txt 或广告代码验证](https://support.google.com/adsense/answer/12169212?hl=en)。当前采用验证与广告投放分开的方式。[ads.txt 是 Google 推荐的做法，并非加入 AdSense 的强制前提](https://support.google.com/adsense/answer/12171612?hl=en)。这里的支持以正式站根域为目标；GitHub `/website/` 预览路径上的文件不是 `tensordrill.com/ads.txt`。

账号里仍需完成站点审核、付款资料等实际流程。这里只修改网站，不创建虚构账号、身份或付款资料。

## 2. 在广告启用前完成同意管理

在 AdSense 的“隐私权和消息”中配置合适的地区消息及 Google 认证 CMP，可以评估 Google 提供的方案。向欧洲经济区、英国、瑞士用户投放个性化广告，需要 [Google 认证并集成 IAB TCF 的 CMP](https://support.google.com/adsense/answer/13554116?hl=en)。一般 Cookie 提示、政策链接或自己保存一个同意布尔值不能替代它。

配置并测试中英文消息、目的与供应商披露、接受/拒绝或管理选择、撤回和重新打开入口；核实相关存储与广告请求按选择运行。CMP 的认证不等于 Google 对全部法律合规作出认证。非个性化广告也不自动免除存储与同意义务。

根据实际访问地区配置[美国州隐私消息](https://support.google.com/adsense/answer/10960771?hl=en)及适用的出售、共享、定向广告退出处理，并验证广告集成支持的浏览器退出信号。[受限数据处理的官方说明](https://support.google.com/adsense/answer/9560818?hl=en)用于核对相应行为。

当前 Cookie 页面如实说明尚未启用广告，也不假装已经记录广告同意。启用时必须同步更新隐私、Cookie、广告、关于页面中的现状文字，并把页脚选择入口接到真实可重新打开的 CMP 控件。

## 3. 广告位置与内容

优先考虑有充分原创内容的专题和题解页面；广告与正文、题目链接、导航明确区分并标注。避免自动广告侵入代码编辑器、运行/提交控件、测试结果、个人进度、政策页面或 404。首次启用可先限制自动广告区域并逐页检查手机与桌面布局。

免费题解及进度功能保持可访问。不鼓励“点击广告支持我们”，不奖励点击，不使用自动刷新、自动点击或人为制造展示量；测试时也不要点击自己的广告。[AdSense 计划政策](https://support.google.com/adsense/answer/48182?hl=en)和 [Google 发布商政策](https://support.google.com/adsense/answer/10502938?hl=en)还涉及无效流量、内容质量、广告布局和数据处理。增加条款不能替代持续的原创内容和真实访问。

## 4. 抓取和上线检查

1. 正式站中英文页面、元标签、`ads.txt` 均应能通过 HTTPS 直接访问；确认没有构建时遗留的预览域名 canonical。
2. 确保 Cloudflare 的规则和 robots.txt 允许 `Mediapartners-Google` 与 `Google-Display-Ads-Bot`，通过 AdSense 的实际抓取诊断或 Cloudflare 日志确认。普通浏览器返回 200 不证明广告爬虫可访问；脚本请求遭遇 403 也不能单独证明 Google 爬虫被阻止。
3. 审核前提交站点审核；获得批准后，再把广告脚本、真实 CMP 和最新说明一起接入并验证。
4. 在受影响地区测试同意前后、拒绝、撤回、无痕浏览、中英文切换以及广告请求；复核 mobile 控件没有被覆盖。

本次新增页面已进入 sitemap；Google 会在后续抓取时发现它们，通常无需重新提交同一 sitemap 地址。
