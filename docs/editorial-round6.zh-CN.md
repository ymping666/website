# 第六轮可视化题解：发布核对记录

2026-10-14：新增 3 道题、6 个中英文页面。经用户批准，重新核对公式、正式构建及全站回归后发布；部署结果另存核验记录。

| 题目 | 新增讲解 | 中文本地预览 |
| --- | --- | --- |
| LayerNorm | 输入→减均值→统一分母；共用正负尺度的三张条形图；总体方差、eps、常量与单特征输入 | http://127.0.0.1:4191/zh/editorials/foundation-layer-normalization/ |
| SGD 动量 | 给定梯度逐步回放、状态分解表、无动量对照参数曲线；方向反转、零学习率、传入状态 | http://127.0.0.1:4191/zh/editorials/optimizer-sgd-momentum/ |
| Adam 偏差修正 | 零初始化生成矩估计；修正前后两张独立尺度曲线；分母与步数、恒定/反转梯度及零状态 | http://127.0.0.1:4191/zh/editorials/optimizer-adam-bias-correction/ |

英文页面移除 `/zh`，也可使用页头语言切换。完整代码、复杂度、常见错误及代表性测试保留，外部参考资料放在最后。

## 正确性边界

- LayerNorm 仅处理非空的单个特征向量，采用总体方差且无仿射参数。输出方差为 `variance / (variance + eps)`。图示使用有限的小数值，不声称朴素算法可处理任意极端浮点输入。
- SGD 函数只执行一步。图示连续调用并显式说明固定梯度来源，不把参数曲线当成损失曲线或收敛证据。状态约定为累积梯度，递推式内不含学习率，零学习率仍更新动量。
- Adam 函数只修正已更新的矩。图示的矩递推是为了构造输入，从零开始；不代表本函数执行完整优化器更新。二阶原点矩不等于方差，变化梯度下修正结果不等于当前梯度。
- 两种矩的单位不同，图表独立标注纵轴。坐标刻度最多两位小数，数据表最多六位小数，计算使用未舍入值。
- 默认算例在静态 HTML 中完整输出。控件在脚本成功加载后启用。LayerNorm 根号用原生 MathML，不依赖外部服务。
- 题目契约、参考 Python、评测断言、canonical、robots、sitemap 和广告配置均未修改。

## 验证

- 正式构建成功：548 个中英文路由（描述/广告检查包括额外 HTML，共 550 页）。
- `npm run check` 全站通过，包含原有评测、翻译、链接、SEO、描述长度、分享卡片及广告政策检查。
- 新增 `scripts/test-round6-lessons.mjs` 纳入全站检查。3,855 组对照覆盖 3,555 组可达控件组合及 300 组固定种子随机示例；同时比较既有 Python 参考解和独立公式/闭式求和，验证中间值与输入不变性。
- 六个页面检查静态回退、翻译、脚本资源、公式及资料顺序，确认参考实现逐字不变。
- 真实浏览器：中文 LayerNorm 常量、键盘偏移和重置；SGD 零学习率、无动量、重置；Adam 首步、零状态和重置。英文 LayerNorm eps=1、单特征、重置；SGD 滑块上界和重置；Adam beta 切换、反转梯度和步数上界。
- 六个页面在实际 375px 视口无页面级横向溢出，控件均正常启用；宽表格与代码允许局部横向滚动。
- 可视检查后放大图表文字并缩短坐标刻度，重新构建、本轮数值/结构测试及全站翻译测试通过；浏览器检查极端参数图表的文字边界。
- 预览服务仅监听本机 `127.0.0.1:4191`。本地预览已验证可访问。
- 截图与浏览器结果保存在 `artifacts/editorial-round6/`。

## 核对的参考资料

- LayerNorm 原论文：https://arxiv.org/abs/1607.06450
- PyTorch LayerNorm：https://docs.pytorch.org/docs/stable/generated/torch.nn.LayerNorm.html
- PyTorch SGD：https://docs.pytorch.org/docs/stable/generated/torch.optim.SGD.html
- 动手学深度学习 Momentum：https://d2l.ai/chapter_optimization/momentum.html
- Adam 原论文（Algorithm 1 与 §3）：https://arxiv.org/abs/1412.6980
- PyTorch Adam：https://docs.pytorch.org/docs/stable/generated/torch.optim.Adam.html

## 发布前复核

2026-10-14 再次对照 PyTorch LayerNorm/SGD 官方公式及 Adam 原论文 Algorithm 1、§3，未发现公式或状态递推错误。正式域名构建和全站检查再次通过；GitHub Pages `/website/` 子路径构建、本轮 3,855 组测试及站内链接检查通过，随后恢复正式域名构建。
