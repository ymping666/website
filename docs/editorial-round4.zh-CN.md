# 第四轮可视化题解：发布核对记录

核对日期：2026-10-13。经用户确认，本轮通过正式构建与全站复测后进入发布；上线状态以部署结果和正式域名核验为准。

| 题目 | 讲解重点 | 中文预览 |
| --- | --- | --- |
| 因果 Attention 掩码 | 原始 logits、掩码输出与辅助 Softmax 权重三张矩阵；逐行高亮、对角线、单 token 和空矩阵 | http://127.0.0.1:4190/zh/editorials/attention-causal-mask/ |
| RMSNorm | 原始向量、RMSNorm 与 LayerNorm 对照；平方、分母、均值与平方均值；eps、输入倍数和零向量 | http://127.0.0.1:4190/zh/editorials/norm-rmsnorm/ |
| Flow Matching 线性路径 | 固定二维端点、插值位置、逐分量权重与条件导数；时间端点及重合端点 | http://127.0.0.1:4190/zh/editorials/flow-linear-interpolation/ |

英文地址去掉 `/zh`，也可使用页头语言切换。外部参考资料均在完整 Python 实现和代表性测试之后。

## 核对与边界

- 掩码函数只返回 logits。Softmax 为辅助解释，不混进函数返回值；保留对角线，空输入返回空矩阵。有限 logits 示例的每行都有有效位置，整行被其他掩码屏蔽时不能照搬归一化结论。
- RMSNorm 的 eps 在根号内，本题没有增益、偏置。LayerNorm 对照用相同 eps、总体方差、单位增益和零偏置。
- 纠正原英文 `leaves its mean unchanged`：不减均值不等于均值数值不变；输出均值会随分母缩放。同步更新中文说明，参考 Python 代码和题目契约保持不变。
- RMSNorm 的输出平方均值为 q/(q+eps)；默认示例可能因保留 6 位小数而显示为 1。eps=1 的 [1,3] 示例明确显示 0.833333。
- Flow 图仅展示一对固定样本的条件直线，不代表训练模型、ODE 采样或学习到的边缘向量场的所有轨迹。条件导数只用于解释，不是本题输出。
- 图形原创，无外部图片或 iframe；根号用原生 MathML。默认 HTML 内含完整数值示例，控件等待脚本成功加载后才启用。

## 验证

- `npm run build` 与 `npm run check` 全站通过。
- 新增 `scripts/test-round4-lessons.mjs`，已纳入 `npm run check`：1,124 组数值轨迹，涵盖全部控件数值组合、750 组固定随机种子的对照、独立 Python 公式、现有参考解与输入不变性。
- 检查六个中英文题解的默认示例、翻译、原生根号、代码与资料顺序，以及运行模块的构建输出。
- 使用实际浏览器检查中文三题边界、英文三题交互、键盘滑块与重置；六页在实际 375px 视口下无页面级横向溢出。数值表格和代码块保留局部横向滚动。
- 本地预览仅监听 `127.0.0.1:4190`；截图和浏览器结果保存在 `artifacts/editorial-round4/`。
- 发布前再次通过正式域名构建与全站检查；GitHub Pages 子路径构建也通过本轮数值测试、站内链接和描述检查，随后恢复正式域名构建。

## 已核对资料

- Attention 原论文：https://arxiv.org/html/1706.03762v7#S3.SS2.SSS3
- D2L 图解教材：https://d2l.ai/chapter_attention-mechanisms-and-transformers/transformer.html
- RMSNorm 原论文：https://arxiv.org/abs/1910.07467
- PyTorch RMSNorm 公式：https://docs.pytorch.org/docs/stable/generated/torch.nn.RMSNorm.html
- Flow Matching 原论文：https://arxiv.org/abs/2210.02747
- Meta 官方路径实现文档：https://facebookresearch.github.io/flow_matching/_modules/flow_matching/path/affine.html
