# 第十一轮：多头布局与交叉注意力

发布范围：新增 3 道中英文可视化题解，累计 32 道。已完成本地复核，按用户确认发布。

## 本轮页面

- `/zh/editorials/attention-split-heads/`：点击矩阵元素，查看连续特征块如何变成 [head][token][feature]；同一元素在两个布局中同时描边，展示来源和目标索引。
- `/zh/editorials/attention-merge-heads/`：按 token 取各头的行，再依头序拼接；展示拼接与求平均的区别。
- `/zh/editorials/transformer-cross-attention/`：多个 Query 分别读取同一组 Key/Value，分四步查看点积与缩放、逐行稳定 Softmax、Value 加权、贡献求和。示例明确包含查询数与源数不相同、Key 与 Value 宽度不同。

英文页面去掉 `/zh` 前缀。保持原题约定、Python 解法和判题测试不变。参考资料仍在完整 Python 与代表性测试之后。

## 准确性与边界

- 拆分和合并只进行布局变换，不包括 Q/K/V 学习投影、注意力计算或输出投影。
- 拆分后立即合并可恢复数值；实际注意力头先计算再合并，通常不会恢复原 embedding。
- 空 token 序列无法推断特征宽度，图中显示 ?；有 token 的空特征行保留行数，宽度为 0。
- Query 每行独立沿 Key 维度归一化；输出形状由 Query 数和 Value 宽度决定。
- 多个 Query 行不等同于共享 K/V 头的 MQA，已补术语说明与原论文。
- 相同位置的 K/V 需要一起重排；归一化不使用 Value 特征宽度。

## 资料

- https://arxiv.org/html/1706.03762v7 ，§3.2.1–3.2.3：缩放点积、多头投影与拼接、编码器—解码器注意力。
- https://d2l.ai/chapter_attention-mechanisms-and-transformers/multihead-attention.html ，§11.5：transpose_qkv / transpose_output；说明教材包含 batch 轴而本题不含。
- https://arxiv.org/abs/1911.02150 ，MQA 原论文，作为术语对照。

矩阵图、交互与数值示例为 TensorDrill 原创。

## 验证

- 正式构建：592 路由、594 HTML 文档。
- 694 组数值与索引用例：现有 Python 参考实现、独立索引方程、60 位 Decimal 注意力、输入不变及非别名行、形状与凸组合范围。
- 736 个双语选择渲染状态：各布局元素选择、各 Query 行；静态示例、底部参考及完整 Python 保持正确。
- 全站检查通过：公式排版、语言、判题、SEO、广告和政策回归。
- 浏览器实测：矩阵元素键盘选择保留焦点；动态头数、6 头空序列、零宽行、重置；Query 查看不影响全输出、配对源重排、均匀权重、单源、大分数、不同维度等。
- 六个中英文页面在 375px 下无页面横向溢出；宽数值表可单独横向滚动。
- 为现有 CI 浏览器套件添加行为回归。当前本地使用浏览器工具实测，新增 Playwright 检查留待 CI 执行。
- 截图和浏览器记录：`artifacts/editorial-round11/`。
