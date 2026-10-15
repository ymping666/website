# 全站题目数学排版统一

2026-10-15：按用户意见将上一版字号收小，并扩展到其他题。用户已批准上线，发布前复核通过；部署核验另存 `artifacts/practice-typography/deployment.json`。

- 题解正文 15px，独立公式桌面 17px、手机 16px。统一淡灰绿公式框、间距、等号对齐和行内公式基线。
- 检查全部 106 道题的中英文题面、题解，共 424 页。其中 298 页包含原生 MathML，50 个公式框使用统一样式（跨中英文；无需公式的 Agent/协议题保持自然文字或代码表达）。
- 所有现有可视化题解中的代码式公式框均已替换为数学排版，包括因果掩码、Flow、LayerNorm、动量、Adam、Top-k Softmax、CFG、梯度裁剪、VAE、VQ-VAE。
- 用精确白名单处理现有题目中的表达式；普通代数经严格解析器生成分式、根式、幂、下标。求和、Python 生成器或切片用逐项审核的显式公式处理，未把任意正文交给猜测性解析。
- 常见 alpha_bar、x0_hat、eps_hat、beta1 等符号显示为对应上划线、帽子和希腊字母。行内公式可悬停查看原表达式，data-notation 可逆恢复原始约定文字。
- 独立检查 300 组已渲染 MathML 的数值，使用 Python 自己的表达式解析和独立 XML 解释，与原表达式比对；覆盖优先级、负号、右结合幂、嵌套分式、根号、索引、比较和变量符号映射。
- 全部 424 页检查约定可逆、转换幂等、MathML 不嵌套；所有公式 XML 有效。Python 参考实现、起始代码、评测 JSON 保持逐字一致。
- 正式域名构建成功，全站 check 通过，包括所有 106 道题、601 个参考断言、错误实现检测、链接、SEO、描述长度、分享卡片、政策和广告检查。
- 手机 375px 抽查中文矩阵乘法题面、DDPM 后验、Adam、VAE KL、码本困惑度、因果掩码，以及英文 LayerNorm 和 Constitutional 偏好损失。没有页面级横向溢出；长公式在自身容器内滚动。
- 桌面实测 Heun 改为两步，结果 2.640625、调用 4 次；重置后恢复四步与 2.694856。修改不影响计算控件。
- 截图与浏览器记录保存在 `artifacts/practice-typography/`。本轮没有添加外部字体、CDN 或客户端数学库，没有改变 canonical、robots、sitemap、广告代码。

## 本地预览

- http://127.0.0.1:4192/zh/editorials/flow-heun-integration/
- http://127.0.0.1:4192/zh/editorials/optimizer-adam-bias-correction/
- http://127.0.0.1:4192/zh/editorials/diffusion-ddpm-posterior/
- http://127.0.0.1:4192/zh/editorials/vae-standard-normal-kl/

英文地址移除 `/zh`。

## 发布前复核

正式域名构建及全站 check 全部通过；复核全部 424 个中英文题面/题解、300 组渲染后算术比较、1169 个 MathML 片段。GitHub Pages `/website/` 构建、两项数学排版测试与 592 个路由的链接检查通过，之后恢复正式域名构建。发布后核对代表性中英文页面、样式文件与已测构建一致，并在正式站检查实际字号及交互。
