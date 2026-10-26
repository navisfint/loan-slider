# loan-calculator · 贷款参数滑块组件

单文件 Web Component，**零依赖**，Shadow DOM 完整隔离样式——放进任何 H5 / App WebView / uni-app / Flutter WebView 都不会和宿主 app 的 CSS 打架。

拖动「贷款金额 / 年利率 / 贷款期限」三个滑块，实时算出 **月供 · 总还款 · 总利息**。

---

## 一、引入

```html
<script src="loan-calculator.js"></script>

<loan-calculator amount="300000" rate="4.2" years="20"></loan-calculator>
```

就这两行。组件自带深色卡面（圆角 + 光晕），可直接作为页面主内容块使用。

## 二、属性

| 属性 | 默认 | 说明 |
|---|---|---|
| `amount` | `300000` | 贷款金额（元） |
| `rate` | `4.2` | 年利率（%） |
| `years` | `20` | 贷款期限（年） |
| `currency` | `¥` | 货币符号 |
| `title` | `贷款测算` | 标题 |
| `subtitle` | `拖动滑块，实时查看还款方案` | 副标题 |
| `cta` | `立即申请` | 底部按钮文案 |
| `min-amount` / `max-amount` / `step-amount` | `10000 / 2000000 / 1000` | 金额滑块范围与步长 |
| `min-rate` / `max-rate` / `step-rate` | `1 / 24 / 0.1` | 利率滑块范围与步长 |
| `min-years` / `max-years` / `step-years` | `1 / 30 / 1` | 期限滑块范围与步长 |

改范围不用改代码，属性直接覆盖：

```html
<loan-calculator min-amount="50000" max-amount="800000" max-rate="12" max-years="25"></loan-calculator>
```

## 三、事件（宿主接单）

拖动过程中持续触发，`detail` 就是完整计算结果：

```js
document.addEventListener('loan-change', (e) => {
  const { amount, rate, years, monthly, total, interest, periods } = e.detail;
  // monthly  月供（元，未取整）
  // total    总还款
  // interest 总利息
  // periods  期数（月）
});
```

事件 `bubbles: true` 且 `composed: true`，能从 Shadow DOM 冒泡到外层文档。

## 四、JS API

```js
const el = document.querySelector('loan-calculator');

el.values = { amount: 500000, rate: 3.8, years: 15 };  // 写，滑块同步跳动
el.values;   // => { amount: 500000, rate: 3.8, years: 15 }
el.result;   // => { monthly, total, interest, periods, ... } 只读快照
```

## 五、换主题（不碰组件内部）

组件所有配色走 CSS 变量，宿主直接覆盖：

```css
loan-calculator {
  --lc-bg: #0b0b0d;         /* 卡面底色 */
  --lc-surface: rgba(255,255,255,.05);
  --lc-line: rgba(255,255,255,.09);
  --lc-text: #f4f4f6;
  --lc-dim: #8a8a93;
  --lc-accent: #5fe8c6;     /* 主色：数字 / 滑块 / 按钮 */
  --lc-accent-2: #9bee6a;   /* 滑块渐变终点 */
  --lc-warn: #f5cf6b;       /* 利息色 */
}
```

换银行品牌色只需改 `--lc-accent` / `--lc-accent-2` 两个值。

## 六、计算口径

**等额本息**（银行按揭标准算法）：

```
月利率 r = 年利率 / 12
月供 = P × r × (1+r)^n / ((1+r)^n − 1)     n = 期限(年) × 12
总还款 = 月供 × n
总利息 = 总还款 − P
```

已验算：30 万 / 4.2% / 20 年 → 月供 1,849.71，总还 443,930.93，总息 143,930.93，与各大行房贷计算器一致。

---

## 文件

| 文件 | 用途 |
|---|---|
| `loan-calculator.js` | **组件本体**，交付/集成只需这一个文件 |
| `index.html` | 演示页（手机外框 + 状态栏），看效果用，集成时不需要 |
