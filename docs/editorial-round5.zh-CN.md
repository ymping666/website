# 第五轮可视化题解：发布核对记录

核对日期：2026-10-13。经用户确认，本轮通过正式构建与全站复测后进入发布；上线状态以部署结果和正式域名核验为准。

| 题目 | 讲解重点 | 中文预览 |
| --- | --- | --- |
| 稳定 Top-K Token 概率 | 排名与同分索引规则、完整分布与仅清零尾部的错误示例、重归一化、极大 logits | http://127.0.0.1:4190/zh/editorials/llm-topk-softmax/ |
| CFG 噪声预测 | 无条件/有条件预测的差值、强度 0/1/负值/外推、两种尺度记法 | http://127.0.0.1:4190/zh/editorials/diffusion-cfg-epsilon/ |
| 全局 L2 梯度裁剪 | 等比例二维坐标、L2 球边界、统一缩放、逐元素截断的对照、零与空梯度 | http://127.0.0.1:4190/zh/editorials/optimizer-global-norm-clipping/ |

英文路径去掉 `/zh`。完整 Python 实现和代表性测试仍在外部参考资料之前；未修改题目契约、参考实现、canonical、robots、sitemap 或广告逻辑。

## 内容边界

- Top-K 只返回确定性的概率，不随机抽样。图表保留原词表顺序；排名与成员资格明确区分。同分时仅按本题小索引优先，不声称库接口均如此。
- 三组概率条形图共用 0–1 尺度。完整 Softmax 和清零尾部均为对照，绿色条形图才是本题结果。显示数值最多 6 位小数。
- CFG 在同一噪声输入和时间步组合 epsilon 预测，不展示图像生成或去噪轨迹。`u+s(c-u)` 与 `c+w(c-u)` 对齐时 `s=1+w`；负值是契约测试，不是生成设置推荐。
- 裁剪只操作梯度，不执行参数更新。全局裁剪与逐元素截断清楚区分；零向量没有方向。范数相等时返回数值不变的新列表。
- 裁剪图随输入和阈值自动选取显示范围，图下注明；x/y 每单位长度相等，圆保持圆形。空向量不画虚假的二维点。
- 根号使用原生 MathML，平方和全部位于根号内部。控件等待脚本加载后启用，无 JavaScript 时仍可阅读完整默认算例。

## 验证

- `npm run build` 与 `npm run check` 通过。
- 新增并纳入全站检查的 `scripts/test-round5-lessons.mjs`：1,085 组轨迹（185 组全部可达控件设置、900 组固定种子随机对照），同时比对独立 Python 公式与现有参考解；检查输入不变、概率归一化、平移不变性、CFG 端点、裁剪范数与方向。
- 检查六个中英文静态页面、翻译、原生根号、代码及参考资料顺序、运行模块输出；校验裁剪圆和梯度落在两轴范围内。
- 浏览器检查中文 Top-K 同分/单候选/单 token/重置，CFG 负值/外推/相同预测/空向量/重置，以及裁剪不超过上限/相等/零/空/重置。
- 英文三页均检查默认结果、键盘调整与重置。六页在实际 375px 视口下均无页面级横向溢出；代码和表格保留局部横向滚动。
- 截图、浏览器记录位于 `artifacts/editorial-round5/`。本地预览只监听 `127.0.0.1:4190`。
- 发布前再次通过正式构建与全站检查、GitHub Pages 子路径构建的本轮数值测试及站内链接检查，随后恢复正式域名构建；再次在浏览器核验单 token 后恢复、CFG 空输入后恢复和裁剪阈值切换。

## 核对的原始资料

- Hugging Face 解码图解：https://huggingface.co/blog/how-to-generate#top-k-sampling
- CFG 原论文：https://arxiv.org/abs/2207.12598
- Diffusers 官方两种强度记法：https://huggingface.co/docs/diffusers/main/api/modular_diffusers/guiders#diffusers.ClassifierFreeGuidance
- 梯度裁剪论文：https://arxiv.org/abs/1211.5063
- PyTorch 全局范数接口：https://docs.pytorch.org/docs/main/generated/torch.nn.utils.clip_grad_norm_.html
