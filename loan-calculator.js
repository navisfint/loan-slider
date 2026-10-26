/*!
 * <loan-calculator> — 贷款参数滑块组件
 * 单文件 Web Component，无任何依赖，Shadow DOM 隔离样式
 *
 * 用法：
 *   <script src="loan-calculator.js"></script>
 *   <loan-calculator amount="300000" rate="4.2" years="20"></loan-calculator>
 *
 * 事件：loan-change  detail = { amount, rate, years, monthly, total, interest, periods }
 */
(function () {
  'use strict';
  if (window.customElements.get('loan-calculator')) return;

  var DEFAULTS = {
    amount: 300000,
    rate: 4.2,
    years: 20,
    currency: '¥',
    title: '贷款测算',
    subtitle: '拖动滑块，实时查看还款方案',
    cta: '立即申请',
    // 滑块范围（可被同名属性覆盖）
    'min-amount': 10000,
    'max-amount': 2000000,
    'step-amount': 1000,
    'min-rate': 1,
    'max-rate': 24,
    'step-rate': 0.1,
    'min-years': 1,
    'max-years': 30,
    'step-years': 1
  };

  var STYLE = [
    '*,*::before,*::after{box-sizing:border-box}',

   ':host{',
    '  --lc-bg:#0b0b0d;',
    '  --lc-surface:rgba(255,255,255,.05);',
    '  --lc-line:rgba(255,255,255,.09);',
    '  --lc-text:#f4f4f6;',
    '  --lc-dim:#8a8a93;',
    '  --lc-accent:#5fe8c6;',
    '  --lc-accent-2:#9bee6a;',
    '  --lc-warn:#f5cf6b;',
    '  display:block;',
    '  width:100%;',
    '  max-width:440px;',
    '  margin:0 auto;',
    '  color-scheme:dark;',
    '  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","PingFang SC","HarmonyOS Sans SC","Microsoft YaHei",system-ui,sans-serif;',
    '  color:var(--lc-text);',
    '  -webkit-font-smoothing:antialiased;',
    '  -webkit-tap-highlight-color:transparent;',
    '  user-select:none;',
    '}',

    '.shell{',
    '  position:relative;',
    '  padding:22px 20px 24px;',
    '  border-radius:28px;',
    '  background:',
    '    radial-gradient(120% 90% at 8% -10%,rgba(95,232,198,.11),transparent 62%),',
    '    linear-gradient(180deg,#101014 0%,#0b0b0d 62%);',
    '  border:1px solid var(--lc-line);',
    '  box-shadow:0 24px 60px -24px rgba(0,0,0,.85),inset 0 1px 0 rgba(255,255,255,.05);',
    '  animation:lc-in .45s cubic-bezier(.22,.9,.3,1) both;',
    '}',
    '@keyframes lc-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}',

    /* ---------- 头部 ---------- */
    '.head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:18px}',
    '.head h1{margin:0;font-size:19px;font-weight:600;letter-spacing:-.2px;line-height:1.3}',
    '.head p{margin:5px 0 0;font-size:12.5px;line-height:1.4;color:var(--lc-dim)}',
    '.tag{',
    '  flex:none;margin-top:2px;padding:5px 10px;border-radius:999px;',
    '  font-size:11px;font-weight:500;letter-spacing:.2px;',
    '  color:var(--lc-accent);background:rgba(95,232,198,.12);',
    '  border:1px solid rgba(95,232,198,.18);',
    '}',

    /* ---------- 月供 Hero ---------- */
    '.hero{',
    '  position:relative;overflow:hidden;',
    '  padding:18px 18px 16px;border-radius:22px;',
    '  background:linear-gradient(160deg,rgba(95,232,198,.13),rgba(95,232,198,.02) 62%),var(--lc-surface);',
    '  border:1px solid rgba(95,232,198,.16);',
    '}',
    '.hero::after{',
    '  content:"";position:absolute;right:-46px;top:-58px;width:132px;height:132px;border-radius:50%;',
    '  background:radial-gradient(circle,rgba(95,232,198,.22),transparent 68%);',
    '  pointer-events:none;',
    '}',
    '.hero-label{font-size:12.5px;color:var(--lc-dim);letter-spacing:.2px}',
    '.hero-num{',
    '  display:flex;align-items:baseline;gap:3px;margin:8px 0 10px;',
    '  font-variant-numeric:tabular-nums;font-feature-settings:"tnum" 1;',
    '  letter-spacing:-1.4px;',
    '}',
    '.hero-num .cur{font-size:22px;font-weight:500;color:var(--lc-accent);letter-spacing:0;align-self:flex-start;margin-top:6px}',
    '.hero-num .int{font-size:clamp(34px,10.5vw,44px);font-weight:600;line-height:1.02}',
    '.hero-num .dec{font-size:17px;font-weight:500;color:rgba(244,244,246,.5);letter-spacing:-.3px}',
    '.hero-meta{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--lc-dim)}',
    '.hero-meta b{font-weight:600;color:rgba(244,244,246,.86);font-variant-numeric:tabular-nums}',
    '.sep{width:3px;height:3px;border-radius:50%;background:rgba(255,255,255,.22);flex:none}',

    /* ---------- 滑块组 ---------- */
    '.fields{margin:22px 0 4px}',
    '.field{margin-bottom:20px}',
    '.field:last-child{margin-bottom:0}',
    '.fh{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:0}',
    '.fl{font-size:13.5px;font-weight:500;color:rgba(244,244,246,.82);letter-spacing:.1px}',
    '.fv{',
    '  font-size:13px;font-weight:600;padding:4px 10px;border-radius:9px;',
    '  color:var(--lc-accent);background:rgba(95,232,198,.10);',
    '  font-variant-numeric:tabular-nums;',
    '  transition:background .2s ease,color .2s ease,transform .2s ease;',
    '}',
    '.field.is-dragging .fv{background:rgba(95,232,198,.20);color:#b9fff0;transform:scale(1.02)}',

    /* range 原生控件重塑 */
    '.rng{',
    '  -webkit-appearance:none;appearance:none;',
    '  display:block;width:100%;height:36px;margin:0;',
    '  background:transparent;cursor:grab;',
    '  --pct:50%;',
    '}',
    '.rng:active{cursor:grabbing}',
    '.rng:focus{outline:none}',
    '.rng:focus-visible::-webkit-slider-thumb{box-shadow:0 2px 10px rgba(0,0,0,.55),0 0 0 6px rgba(95,232,198,.28)}',

    '.rng::-webkit-slider-runnable-track{',
    '  height:6px;border-radius:999px;',
    '  background-color:rgba(255,255,255,.13);',
    '  background-image:linear-gradient(90deg,var(--lc-accent),var(--lc-accent-2));',
    '  background-repeat:no-repeat;',
    '  background-size:var(--pct) 100%;',
    '  box-shadow:inset 0 1px 1px rgba(0,0,0,.35);',
    '}',
    '.rng::-webkit-slider-thumb{',
    '  -webkit-appearance:none;appearance:none;',
    '  width:22px;height:22px;margin-top:-8px;border:none;border-radius:50%;',
    '  background:#fff;',
    '  box-shadow:0 2px 8px rgba(0,0,0,.55),0 0 0 0 rgba(95,232,198,.30);',
    '  transition:transform .16s cubic-bezier(.22,.9,.3,1),box-shadow .2s ease;',
    '}',
    '.rng:active::-webkit-slider-thumb,',
    '.field.is-dragging .rng::-webkit-slider-thumb{',
    '  transform:scale(1.16);',
    '  box-shadow:0 2px 12px rgba(0,0,0,.6),0 0 0 7px rgba(95,232,198,.18);',
    '}',

    '.rng::-moz-range-track{height:6px;border-radius:999px;background:rgba(255,255,255,.13)}',
    '.rng::-moz-range-progress{height:6px;border-radius:999px;background:linear-gradient(90deg,var(--lc-accent),var(--lc-accent-2))}',
    '.rng::-moz-range-thumb{',
    '  width:22px;height:22px;border:none;border-radius:50%;background:#fff;',
    '  box-shadow:0 2px 8px rgba(0,0,0,.55);',
    '  transition:transform .16s ease;',
    '}',
    '.field.is-dragging .rng::-moz-range-thumb{transform:scale(1.16)}',

    '.fs{display:flex;justify-content:space-between;margin-top:-2px;font-size:11px;color:rgba(255,255,255,.34);font-variant-numeric:tabular-nums}',

    /* ---------- 明细卡 ---------- */
    '.card{',
    '  margin-top:20px;padding:16px 16px 14px;border-radius:20px;',
    '  background:var(--lc-surface);border:1px solid var(--lc-line);',
    '}',
    '.bar{display:flex;gap:3px;height:8px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.06)}',
    '.bar i{display:block;height:100%;border-radius:999px;transition:width .28s cubic-bezier(.22,.9,.3,1)}',
    '.bar .p{background:linear-gradient(90deg,var(--lc-accent),var(--lc-accent-2))}',
    '.bar .i{background:linear-gradient(90deg,var(--lc-warn),#e0a94f)}',
    '.legend{display:flex;gap:16px;margin:10px 0 14px;font-size:11.5px;color:var(--lc-dim)}',
    '.legend span{display:inline-flex;align-items:center;gap:6px;font-variant-numeric:tabular-nums}',
    '.key{width:6px;height:6px;border-radius:2px;flex:none}',
    '.key.p{background:var(--lc-accent)}',
    '.key.i{background:var(--lc-warn)}',

    '.row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;padding:9px 0}',
    '.row+.row{border-top:1px solid rgba(255,255,255,.055)}',
    '.row span{font-size:12.5px;color:var(--lc-dim)}',
    '.row b{font-size:15px;font-weight:600;letter-spacing:-.2px;font-variant-numeric:tabular-nums}',

    /* ---------- CTA ---------- */
    '.cta{',
    '  display:block;width:100%;height:54px;margin-top:18px;',
    '  border:0;border-radius:17px;cursor:pointer;',
    '  font-family:inherit;font-size:15.5px;font-weight:600;letter-spacing:.3px;',
    '  color:#04241d;',
    '  background:linear-gradient(135deg,#6fefcd,#5fe8c6 45%,#9bee6a 130%);',
    '  box-shadow:0 14px 32px -14px rgba(95,232,198,.7),inset 0 1px 0 rgba(255,255,255,.45);',
    '  transition:transform .14s ease,box-shadow .2s ease,filter .2s ease;',
    '}',
    '.cta:hover{filter:brightness(1.05);box-shadow:0 12px 30px -10px rgba(95,232,198,.7),inset 0 1px 0 rgba(255,255,255,.45)}',
    '.cta:active{transform:scale(.982)}',
    '.cta:focus-visible{outline:2px solid rgba(95,232,198,.65);outline-offset:3px}',

    '@media (prefers-reduced-motion:reduce){',
    '  .shell{animation:none}',
    '  .bar i,.rng::-webkit-slider-thumb,.rng::-moz-range-thumb{transition:none}',
    '}'
  ].join('');

  var TEMPLATE = [
    '<div class="shell">',
    '  <div class="head">',
    '    <div>',
    '      <h1 data-t="title"></h1>',
    '      <p data-t="subtitle"></p>',
    '    </div>',
    '    <div class="tag">等额本息</div>',
    '  </div>',

    '  <div class="hero">',
    '    <div class="hero-label">每月还款</div>',
    '    <div class="hero-num">',
    '      <span class="cur" data-t="currency"></span>',
    '      <span class="int" data-v="monthly-int">0</span>',
    '      <span class="dec" data-v="monthly-dec">.00</span>',
    '    </div>',
    '    <div class="hero-meta">',
    '      <span>共 <b data-v="periods">0</b> 期</span>',
    '      <i class="sep"></i>',
    '      <span>年利率 <b data-v="rate-txt">0</b></span>',
    '    </div>',
    '  </div>',

    '  <div class="fields">',
    '    <div class="field" data-key="amount">',
    '      <div class="fh"><span class="fl">贷款金额</span><span class="fv" data-v="amount-txt">0</span></div>',
    '      <input class="rng" type="range" data-key="amount" aria-label="贷款金额">',
    '      <div class="fs"><span data-v="amount-min">0</span><span data-v="amount-max">0</span></div>',
    '    </div>',
    '    <div class="field" data-key="rate">',
    '      <div class="fh"><span class="fl">年利率</span><span class="fv" data-v="rate-tag">0</span></div>',
    '      <input class="rng" type="range" data-key="rate" aria-label="年利率">',
    '      <div class="fs"><span data-v="rate-min">0</span><span data-v="rate-max">0</span></div>',
    '    </div>',
    '    <div class="field" data-key="years">',
    '      <div class="fh"><span class="fl">贷款期限</span><span class="fv" data-v="years-tag">0</span></div>',
    '      <input class="rng" type="range" data-key="years" aria-label="贷款期限">',
    '      <div class="fs"><span data-v="years-min">0</span><span data-v="years-max">0</span></div>',
    '    </div>',
    '  </div>',

    '  <div class="card">',
    '    <div class="bar"><i class="p" data-v="bar-p"></i><i class="i" data-v="bar-i"></i></div>',
    '    <div class="legend">',
    '      <span><i class="key p"></i>本金 <em data-v="pct-p">0%</em></span>',
    '      <span><i class="key i"></i>利息 <em data-v="pct-i">0%</em></span>',
    '    </div>',
    '    <div class="row"><span>总还款</span><b data-v="total">0</b></div>',
    '    <div class="row"><span>总利息</span><b data-v="interest">0</b></div>',
    '  </div>',

    '  <button class="cta" type="button" data-t="cta"></button>',
    '</div>'
  ].join('');

  /* ---------------- 工具 ---------------- */
  function clamp(v, min, max) {
    return v < min ? min : v > max ? max : v;
  }
  function num(v, fallback) {
    var n = parseFloat(v);
    return isFinite(n) ? n : fallback;
  }
  function fmt(v, digits) {
    return v.toLocaleString('zh-CN', {
      minimumFractionDigits: digits || 0,
      maximumFractionDigits: digits || 0
    });
  }
  // 万元 / 元 的紧凑写法：1万 / 30万 / 200万
  function money(v) {
    if (v >= 10000) {
      var w = v / 10000;
      return (w % 1 === 0 ? w : w.toFixed(1)) + '万';
    }
    return fmt(v);
  }

  /* ---------------- 组件 ---------------- */
  class LoanCalculator extends HTMLElement {
    static get observedAttributes() {
      return ['amount', 'rate', 'years', 'currency', 'title', 'subtitle', 'cta'];
    }

    constructor() {
      super();
      this._built = false;
      this._raf = null;
    }

    connectedCallback() {
      if (this._built) return;
      this._built = true;

      var root = this.attachShadow({ mode: 'open' });
      var style = document.createElement('style');
      style.textContent = STYLE;
      root.appendChild(style);

      var holder = document.createElement('div');
      holder.innerHTML = TEMPLATE;
      while (holder.firstChild) root.appendChild(holder.firstChild);

      this._root = root;
      this._nodes = {};
      root.querySelectorAll('[data-v]').forEach(function (el) {
        this._nodes[el.getAttribute('data-v')] = el;
      }, this);
      root.querySelectorAll('[data-t]').forEach(function (el) {
        this._nodes['t-' + el.getAttribute('data-t')] = el;
      }, this);

      // 范围与步长
      var cfg = {};
      Object.keys(DEFAULTS).forEach(function (k) {
        cfg[k] = num(this.getAttribute(k), DEFAULTS[k]);
      }, this);
      this._cfg = cfg;

      this._s = {
        amount: clamp(num(this.getAttribute('amount'), DEFAULTS.amount), cfg['min-amount'], cfg['max-amount']),
        rate: clamp(num(this.getAttribute('rate'), DEFAULTS.rate), cfg['min-rate'], cfg['max-rate']),
        years: clamp(num(this.getAttribute('years'), DEFAULTS.years), cfg['min-years'], cfg['max-years'])
      };
      // 对齐到步长
      Object.keys(this._s).forEach(function (k) {
        var step = cfg['step-' + k] || 1;
        this._s[k] = Math.round(this._s[k] / step) * step;
        this._s[k] = clamp(this._s[k], cfg['min-' + k], cfg['max-' + k]);
      }, this);

      this._writeStatics();
      this._bindInputs();
      this._render();
    }

    attributeChangedCallback(name, oldV, newV) {
      if (!this._built || oldV === newV) return;
      if (name === 'amount' || name === 'rate' || name === 'years') {
        var raw = num(newV, this._s[name]);
        var step = this._cfg['step-' + name] || 1;
        var v = Math.round(raw / step) * step;
        this._s[name] = clamp(v, this._cfg['min-' + name], this._cfg['max-' + name]);
        var input = this._root.querySelector('input[data-key="' + name + '"]');
        if (input) input.value = String(this._s[name]);
        this._render();
      } else {
        this._writeStatics();
      }
    }

    /* 静态文案 */
    _writeStatics() {
      var cfg = this._cfg, n = this._nodes;
      var cur = this.getAttribute('currency') || DEFAULTS.currency;

      n['t-title'].textContent = this.getAttribute('title') || DEFAULTS.title;
      n['t-subtitle'].textContent = this.getAttribute('subtitle') || DEFAULTS.subtitle;
      n['t-cta'].textContent = this.getAttribute('cta') || DEFAULTS.cta;
      n['t-currency'].textContent = cur;

      n['amount-min'].textContent = cur + money(cfg['min-amount']);
      n['amount-max'].textContent = cur + money(cfg['max-amount']);
      n['rate-min'].textContent = cfg['min-rate'].toFixed(1) + '%';
      n['rate-max'].textContent = cfg['max-rate'].toFixed(1) + '%';
      n['years-min'].textContent = cfg['min-years'] + '年';
      n['years-max'].textContent = cfg['max-years'] + '年';

      var inputs = {
        amount: [cfg['min-amount'], cfg['max-amount'], cfg['step-amount']],
        rate: [cfg['min-rate'], cfg['max-rate'], cfg['step-rate']],
        years: [cfg['min-years'], cfg['max-years'], cfg['step-years']]
      };
      Object.keys(inputs).forEach(function (k) {
        var el = this._root.querySelector('input[data-key="' + k + '"]');
        el.min = inputs[k][0];
        el.max = inputs[k][1];
        el.step = inputs[k][2];
        el.value = this._s[k];
      }, this);
    }

    _bindInputs() {
      var self = this;
      this._root.querySelectorAll('input.rng').forEach(function (input) {
        var key = input.getAttribute('data-key');
        var field = input.closest('.field');

        input.addEventListener('input', function () {
          self._s[key] = parseFloat(input.value);
          self._render();
        });

        input.addEventListener('pointerdown', function () {
          field.classList.add('is-dragging');
        });
        ['pointerup', 'pointercancel', 'blur'].forEach(function (ev) {
          input.addEventListener(ev, function () {
            field.classList.remove('is-dragging');
          });
        });
      });
    }

    /* 核心计算 + 渲染 */
    _render() {
      var self = this;
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(function () {
        self._paint();
      });
      // 事件同步派发（不等下一帧，方便宿主实时联动）
      this._emit();
    }

    _calc() {
      var p = this._s.amount;
      var annual = this._s.rate;
      var n = Math.round(this._s.years * 12);
      var r = annual / 100 / 12;

      var monthly;
      if (r < 1e-9) {
        monthly = p / n;
      } else {
        var f = Math.pow(1 + r, n);
        monthly = (p * r * f) / (f - 1);
      }
      var total = monthly * n;
      return {
        amount: p,
        rate: annual,
        years: this._s.years,
        monthly: monthly,
        total: total,
        interest: total - p,
        periods: n
      };
    }

    _emit() {
      this.dispatchEvent(new CustomEvent('loan-change', {
        detail: this._calc(),
        bubbles: true,
        composed: true
      }));
    }

    _paint() {
      var n = this._nodes, cfg = this._cfg, s = this._s, cur = this.getAttribute('currency') || DEFAULTS.currency;
      var d = this._calc();

      // hero 数字（拆整数 / 小数，避免长数字跳动）
      var monthlyTxt = d.monthly.toFixed(2);
      var parts = monthlyTxt.split('.');
      n['monthly-int'].textContent = fmt(parseInt(parts[0], 10));
      n['monthly-dec'].textContent = '.' + parts[1];
      n['periods'].textContent = d.periods;
      n['rate-txt'].textContent = s.rate.toFixed(2) + '%';

      // 滑块值标签
      n['amount-txt'].textContent = cur + fmt(s.amount);
      n['rate-tag'].textContent = s.rate.toFixed(2) + '%';
      n['years-tag'].textContent = s.years + ' 年';

      // 进度填充
      ['amount', 'rate', 'years'].forEach(function (k) {
        var input = this._root.querySelector('input[data-key="' + k + '"]');
        var min = cfg['min-' + k], max = cfg['max-' + k];
        var pct = max === min ? 0 : ((s[k] - min) / (max - min)) * 100;
        input.style.setProperty('--pct', pct.toFixed(2) + '%');
      }, this);

      // 本金 / 利息构成
      var pPct = d.total > 0 ? (s.amount / d.total) * 100 : 0;
      n['bar-p'].style.width = pPct.toFixed(2) + '%';
      n['bar-i'].style.width = (100 - pPct).toFixed(2) + '%';
      n['pct-p'].textContent = pPct.toFixed(1) + '%';
      n['pct-i'].textContent = (100 - pPct).toFixed(1) + '%';

      // 汇总
      n['total'].textContent = cur + fmt(d.total, 2);
      n['interest'].textContent = cur + fmt(d.interest, 2);
    }

    /* 对外 API */
    get values() {
      return Object.assign({}, this._s);
    }
    set values(v) {
      var self = this;
      ['amount', 'rate', 'years'].forEach(function (k) {
        if (typeof v[k] === 'number') self._s[k] = v[k];
      });
      this._writeStatics();
      this._render();
    }
    get result() {
      return this._calc();
    }
  }

  window.customElements.define('loan-calculator', LoanCalculator);
})();
