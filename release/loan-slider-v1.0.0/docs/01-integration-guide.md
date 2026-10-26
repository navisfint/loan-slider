# 集成指南 · 贷款参数滑块组件 v1.0.0

本组件是一个标准 **Web Component（自定义元素）**，原生 JS 实现，**零第三方依赖、无需构建工具、无需 npm install**。

把 `loan-calculator.js` 放进项目，写一行 HTML 标签即可使用。

---

## 一、最快集成（H5 页面 / uni-app / 已有活动页）

```html
<!-- 1. 引入，放 body 底部或 head 里都可以 -->
<script src="./loan-calculator.js"></script>

<!-- 2. 放组件 -->
<loan-calculator amount="300000" rate="4.2" years="20"></loan-calculator>
```

打开页面即完成。组件自带深色卡面（圆角、边框、光晕），可直接作为页面主内容块。

---

## 二、嵌进原生 App（Android / iOS / Flutter / RN）

本质都是 WebView 加载一个本地或远端的 HTML 页面。

### 2.1 页面文件准备

把 `dist/` 下两个文件放到 App 的本地资源目录：

```
assets/www/
├── demo.html          ← 改造成你们的页面，或新建一个 index.html 引用组件
└── loan-calculator.js
```

自己新建页面时最小内容：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <style>
    /* 页面底色跟 App 保持一致即可，组件自己带卡面 */
    html, body { margin: 0; background: #0b0b0d; }
  </style>
</head>
<body>
  <loan-calculator></loan-calculator>
  <script src="loan-calculator.js"></script>
</body>
</html>
```

> `viewport-fit=cover` 建议保留，负责 iPhone 刘海屏的安全区适配。

### 2.2 Android（Kotlin / Java）

必须开启 JavaScript，否则组件不渲染：

```kotlin
webView.settings.apply {
    javaScriptEnabled = true
    domStorageEnabled = true
}
webView.loadUrl("file:///android_asset/www/index.html")
```

若要调用原生能力（跳申请页、埋点），加 JS 桥：

```kotlin
webView.addJavascriptInterface(LoanBridge(), "AndroidLoan")
```

```kotlin
class LoanBridge {
    @JavascriptInterface
    fun onLoanChange(json: String) {
        // 收到用户选择的贷款参数
    }
}
```

### 2.3 iOS（Swift / WKWebView）

```swift
let config = WKWebViewConfiguration()
config.userContentController.add(self, name: "loan")
let webView = WKWebView(frame: .zero, configuration: config)
webView.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
```

### 2.4 Flutter / React Native

用 `webview_flutter` / `react-native-webview` 加载同一个 HTML 文件，配置与上面一致（**必须开 JS**）。

---

## 三、把用户的选择回传给原生

组件在拖动过程中**持续**派发 `loan-change` 事件，数据在 `event.detail` 里：

```js
document.addEventListener('loan-change', (e) => {
  const d = e.detail;
  // d.amount    贷款金额（元）
  // d.rate      年利率（%）
  // d.years     期限（年）
  // d.monthly   月供（元，未取整）
  // d.total     总还款
  // d.interest  总利息
  // d.periods   期数（月）
});
```

接原生桥的完整写法：

```js
document.addEventListener('loan-change', (e) => {
  const d = e.detail;
  const payload = JSON.stringify({
    amount: d.amount,
    rate: d.rate,
    years: d.years,
    monthly: Math.round(d.monthly),
    total: Math.round(d.total),
    interest: Math.round(d.interest)
  });

  if (window.AndroidLoan) window.AndroidLoan.onLoanChange(payload);        // Android
  if (window.webkit?.messageHandlers?.loan) {                              // iOS
    window.webkit.messageHandlers.loan.postMessage(payload);
  }
  if (window.ReactNativeWebView) {                                          // RN
    window.ReactNativeWebView.postMessage(payload);
  }
});
```

注意：拖动时事件是**高频触发**的（每移动一步都发）。如果原生侧要做网络请求或埋点，请在 JS 侧先做防抖：

```js
let timer = null;
document.addEventListener('loan-change', (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => { /* 只在停止拖动 300ms 后上报一次 */ }, 300);
});
```

**点击「立即申请」按钮**由你们接管：在原生侧监听按钮点击区域，或自行给按钮绑事件（组件按钮目前只派发点击，不跳转）。

---

## 四、配置项（写在标签属性上，不用改代码）

| 属性 | 默认值 | 说明 |
|---|---|---|
| `amount` | `300000` | 初始贷款金额（元） |
| `rate` | `4.2` | 初始年利率（%） |
| `years` | `20` | 初始期限（年） |
| `currency` | `¥` | 货币符号 |
| `title` | `贷款测算` | 标题文案 |
| `subtitle` | `拖动滑块，实时查看还款方案` | 副标题文案 |
| `cta` | `立即申请` | 底部按钮文案 |
| `min-amount` / `max-amount` / `step-amount` | `10000 / 2000000 / 1000` | 金额滑块范围与步长 |
| `min-rate` / `max-rate` / `step-rate` | `1 / 24 / 0.1` | 利率滑块范围与步长 |
| `min-years` / `max-years` / `step-years` | `1 / 30 / 1` | 期限滑块范围与步长 |

示例：只看 30 万以内、利率上限 12% 的产品

```html
<loan-calculator
  min-amount="50000" max-amount="300000" step-amount="5000"
  max-rate="12"
  max-years="10"
  cta="去申请"></loan-calculator>
```

运行时也可以用 JS 改：

```js
const el = document.querySelector('loan-calculator');
el.values = { amount: 500000, rate: 3.8, years: 15 };  // 滑块会跟着跳
el.result;  // 读当前计算结果
```

---

## 五、换成银行品牌色

组件内部所有配色都走 CSS 变量，**在组件外部覆盖即可**，不用改 `loan-calculator.js`：

```css
loan-calculator {
  --lc-bg: #0b0b0d;              /* 卡面底色 */
  --lc-surface: rgba(255,255,255,.05);   /* 次级卡片底色 */
  --lc-line: rgba(255,255,255,.09);      /* 描边 */
  --lc-text: #f4f4f6;            /* 主文字 */
  --lc-dim: #8a8a93;             /* 次要文字 */
  --lc-accent: #5fe8c6;          /* 主色：数字 / 进度 / 按钮 */
  --lc-accent-2: #9bee6a;        /* 滑块渐变终点色 */
  --lc-warn: #f5cf6b;            /* 利息色 */
}
```

**最省事的换法**：只改 `--lc-accent` 和 `--lc-accent-2` 两个值，整块配色就会跟着变。

组件当前是深色方案。如需浅色版，需要把上面 8 个变量整体换成浅色值（`--lc-bg: #fff` 等），文字反色，我可以按你们的设计稿另出一版。

---

## 六、样式冲突问题（重要）

组件使用 **Shadow DOM**，内部样式与外部完全隔离：

- 你们 App 的全局 CSS（`*`、`body`、`button` 重写）**不会影响组件内部**
- 组件内部样式也**不会漏出去**污染你们的页面
- 因此**不需要**任何样式重置、不需要加 `!important`

唯一会被外部影响的是 CSS 变量（见第五节），这正是我们预留的换肤入口。

---

## 七、兼容性与已知限制（请如实评估）

| 环境 | 支持情况 |
|---|---|
| Chrome / Edge 67+ | ✅ 完整支持（已实测） |
| Safari / iOS 12.2+ | ✅ 支持（未实机测试，建议自测） |
| Android System WebView 67+（Android 8.0 以上） | ✅ 支持 |
| 微信 / 企业微信内置浏览器 | ⚠️ 多数机型支持，老 X5 内核需自测 |
| Android 6 及以下 / iOS 11 及以下 | ❌ 不支持官方自定义元素，需引 polyfill（见下） |

### 老环境兜底方案

如果是老机型兼容需求，在引入组件**之前**加一行 polyfill：

```html
<script src="https://unpkg.com/@webcomponents/custom-elements@1/custom-elements.min.js"></script>
<script src="./loan-calculator.js"></script>
```

> 若 App 不允许访问外网，需把该 polyfill 文件下载到本地一起打包。

### 已知限制

1. **只支持等额本息**。等额本金需要另加切换逻辑。
2. 滑块基于原生 `input[type=range]` 重塑样式。极老内核（Chrome 40 以下）会退化成系统默认滑块外观——**功能正常，只是样式不精致**。
3. 「立即申请」按钮目前只派发点击，跳转逻辑由你们接管。
4. 组件不做网络请求、不存任何数据，纯前端计算，**不涉及个人信息合规问题**。

---

## 八、联调常见问题

| 现象 | 原因 / 处理 |
|---|---|
| 页面上什么都没有 | ① JS 没加载（路径错）② WebView 没开 `javaScriptEnabled` ③ 用了 `file://` 但路径含中文/空格 |
| 出现 `customElements` is not defined | 内核过老，加第七节的 polyfill |
| 组件宽度不对 | 组件 `max-width: 440px` 并居中。想铺满就给父容器定宽，或改 `:host` 的 `max-width` |
| 拖动时页面跟着滚 | 正常的浏览器行为，可在宿主页面容器加 `overscroll-behavior: contain` |
| 数字被截断 | 通常是外层容器设了 `overflow: hidden` + 固定高度，检查父容器 |

---

需要调整配色、文案、范围或增加功能，直接在对接群里说，改动量都很小。
