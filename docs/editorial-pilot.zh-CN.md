# 题解可视化试点

本轮只改稳定 Softmax 与缩放点积 Attention 的中英文题解。先展示直觉和可操作的数值例子，再阅读完整参考代码、复杂度与测试示例，最后提供外部参考资料；其他题目的讲解保持原样。

## 本地预览

- [Softmax 中文](http://127.0.0.1:4190/zh/editorials/stable-softmax/)
- [Attention 中文](http://127.0.0.1:4190/zh/editorials/attention-scaled-dot-product/)
- [Softmax English](http://127.0.0.1:4190/editorials/stable-softmax/)
- [Attention English](http://127.0.0.1:4190/editorials/attention-scaled-dot-product/)

服务器命令：PowerShell 设置 `$env:PORT='4190'`，再运行 `node scripts/serve.mjs`。需要先运行 `npm run build`。

## 讲解与参考

Softmax：四步流程、公共平移的因子约消证明、偏移量与温度滑块、数值表与概率条形图、上溢提示、理解自测。

- [Jay Mody：Numerically Stable Softmax and Cross Entropy](https://jaykmody.com/blog/stable-softmax/)。参考 Softmax 推导与上溢/下溢的区分，未扩展交叉熵。

Attention：明确 q/K/V/权重/输出的形状，固定两个 key/value，修改 query，逐步观察点积、缩放、Softmax 与加权汇总。提供等分数与偏向不同 key 的预设。

- [原论文 §3.2.1](https://arxiv.org/html/1706.03762v7#S3.SS2.SSS1)：公式与缩放的统计假设。
- [Jay Alammar：The Illustrated Transformer](https://jalammar.github.io/illustrated-transformer/)：逐步计算的阅读参考。
- [3Blue1Brown 文字版](https://www.3blue1brown.com/lessons/attention/)与[原视频](https://www.youtube.com/watch?v=eMlx5fFNoYc)：几何直觉的补充入口。

本轮没有复制外站插图、嵌入视频播放器或添加外部脚本；图与数值例子自行制作，外部资料仅提供链接。

## 准确性边界

- 明确区分除以 √dₖ 控制分数尺度与减去最大值避免指数上溢。
- 对公共平移的不变性注明精确算术前提与浮点舍入；不会声称能消除下溢。
- √dₖ 的方差解释注明独立、零均值、单位方差假设。
- 权重之和为 1，输出向量的分量之和无需为 1。
- 3Blue1Brown 用列向量排布，本题使用原论文的行向量记号，阅读入口处有转置提醒。
- 人工向量只解释运算，不声称揭示真实词义或模型内部语义。
- 表格与向量最多显示 6 位小数，百分比显示 2 位；计算用未舍入值。
- 题目约定、参考解、原测试与通过记录均未修改。

## 验证

- `npm run check`：通过，包括全部 100 道题的 553 个 Python 断言与站内链接/双语回归。
- `node scripts/test-lessons.mjs`：655 组输出与独立 Python 参考解对照，覆盖所有滑块可达状态；验证平移不变性、温度变化及输出范围。
- `npm run check:lessons`：真实 Chromium 验证中英文交互、已知数值、重置、键盘操作、阶段高亮、375/768 像素布局与禁用 JavaScript 时的静态回退。
- `npm run check:ui`：现有题库、草稿、进度、备份和手机页面回归通过。
- 已人工查看桌面和手机截图，修正手机表格步骤列的可见性。

2026-10-11：本地审阅后，站主批准在内容复核通过后发布。发布前再次通过全站检查、可视化交互与现有 UI 回归，并验证 GitHub Pages 子路径构建。预览服务器只用于本机审阅。
