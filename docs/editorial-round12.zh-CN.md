# 世界模型规划题解：第 12 轮

2026-10-17。本轮新增 3 道双语可视化题解，累计 35 道；经用户确认进入发布流程。

## 本轮题目

| 题目 | 讲解与交互 | 主要边界 |
| --- | --- | --- |
| prediction-vs-decision | 两个模型的逐动作预测、平方误差，以及选动作→真实代价→regret 三步；可调整模型 A 对 a 的预测 | 字典序平局、真实最优动作不唯一、单动作、整体偏移 |
| risk-sensitive-planner | 分数随风险权重的曲线；均值、方差、标准差与风险惩罚逐项展示 | λ=0、λ=0.5 精确平局、负代价、零方差、空动作集 |
| cem-categorical-update | 高亮精英序列、选择时间列、次数/E 概率条、完整边缘分布 | 稳定排序、E=1/全部候选、未出现动作、零时域、独立输出行 |

所有数值示例与图示均为本站原创。没有修改题目正文、Python 参考实现、评测代码、canonical、sitemap、robots 或广告代码。完整 Python 与代表性测试位于外部参考资料之前。默认演算结果直接写入静态 HTML，控件待脚本加载后启用。

## 讲解范围

- MSE/regret 示例是有限动作代价表反例，不复现论文 DRPE 指标，不包含学习动力学或 rollout。
- 均值加标准差是本题给定的选择启发式；不宣称校准安全概率，也不等同于完整 PETS。
- CEM 仅实现无平滑的分类分布更新；不采样下一轮，也不保留时间步之间全部相关性。
- 图表最多显示 6 位小数，完整函数输出保留原始精度；比较和选择使用未舍入值。

## 原始参考资料

- https://arxiv.org/abs/2609.32322 — Not All Errors Matter: Decision-Relevant Prediction Error Predicts Planning Quality。
- https://arxiv.org/abs/2606.15032 — 世界模型面向决策的评估立场论文。
- https://underactuated.mit.edu/robust.html — MIT Robust and Stochastic Control。
- https://arxiv.org/abs/1805.12114 — PETS，作为不确定性规划背景，非本小函数的完整实现。
- https://people.smp.uq.edu.au/DirkKroese/ps/CEopt.pdf — 作者提供的 The Cross-Entropy Method for Optimization。

## 验证记录

- `npm run build`：592 条中英文页面路由，106 道题。
- `scripts/test-round12-lessons.mjs`：917 组数值输入，与现有 Python 参考实现一致；独立 Decimal 误差/风险计算、精英稳定排序和逐时间步计数核对通过。
- 348 个中英文控件/时间步渲染状态通过；6 个正式输出题解页面的翻译、MathML、静态回退、Python 不变与底部参考顺序通过。
- `SITE_ORIGIN=https://tensordrill.com` 正式构建与 `npm run check` 全量回归通过，包括全部 106 道参考实现、链接、双语、SEO、广告放置、favicon 与本机 HTTP 检查。
- `/website/` 子路径构建、本轮 917 组数值/348 个双语状态与全站内部链接检查通过，之后恢复正式域名根路径构建。
- 通过浏览器实际检查中英文页面、预测滑块、风险同分阈值、负代价、CEM 同分/空时域/重置，以及 375px 手机视口。桌面模型表不再产生内部横向滚动；手机宽表仅在自身容器滚动，页面无水平溢出。手机曲线坐标标签单独放大以补偿 SVG 缩放。
- `scripts/browser-round12-checks.mjs` 已接入现有 CI 浏览器回归，包括禁用 JS 的 6 页检查；本次未从终端运行 Playwright，实际页面检查通过 CUA 完成。

本地服务：`http://127.0.0.1:4193/`，只监听本机。无需任何新增依赖或付费服务。
