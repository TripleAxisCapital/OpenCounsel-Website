// /assets/onx-header.js

/* ─────────────────────────────────────────────────────────────────────────────
   OPTIONAL GLOBAL LINKS
   Add items to ONX_HEADER_LINKS and they will render in BOTH:
   • Desktop center nav (after built-ins)
   • Mobile sheet list
   Example:
   ONX_HEADER_LINKS.push({ label: "Docs", href: "/docs.html" });
   Notes:
   • "ONX Pro" is auto-normalized to match "Pricing" styling (no special bold/black).
   ──────────────────────────────────────────────────────────────────────────── */
const ONX_HEADER_LINKS = [
  // { label: "Docs", href: "/docs.html" },
];

class ONXHeader extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });

    // bound handlers
    this._onScroll = this._onScroll.bind(this);
    this._toggleMobile = this._toggleMobile.bind(this);
    this._closeOnEsc = this._closeOnEsc.bind(this);
    this._onResize = this._onResize.bind(this);
    this._trapTab = this._trapTab.bind(this);
    this._syncEdgeGaps = this._syncEdgeGaps.bind(this);

    this._threshold = parseInt(this.getAttribute("threshold") || "24", 10);
    this._edgeExtra = parseInt(this.getAttribute("edge-extra") || "15", 10); // manual tweak (e.g., 6)
    this._prevFocus = null;
  }

  connectedCallback() {
    // Allow per-instance CSS var overrides via attributes
    const varMap = {
      "max-w": "--header-max-w",
      "pill-outer-x-mobile": "--pill-outer-x-mobile",
      "pill-outer-x-desktop": "--pill-outer-x-desktop",
      "pill-height-mobile": "--pill-height-mobile",
      "pill-height-desktop": "--pill-height-desktop",
      "mobile-hero-height": "--mobile-hero-height",
      "logo-size": "--logo-size",
      "mobile-logo-size": "--mobile-logo-size",
      "nav-font-size": "--nav-font-size",
      "nav-font-weight": "--nav-font-weight",
      "nav-letter-spacing": "--nav-letter-spacing",
      "nav-gap": "--nav-gap",
      "nav-line-height": "--nav-line-height",
      "download-btn-pad-y-desktop": "--download-btn-pad-y-desktop",
      "download-btn-pad-y-mobile": "--download-btn-pad-y-mobile",
    };
    for (const [attr, cssVar] of Object.entries(varMap)) {
      const v = this.getAttribute(attr);
      if (v) this.style.setProperty(cssVar, v);
    }

    this._root.innerHTML = `
      <style>
        :host{
          --header-max-w: 1200px;

          /* pill sizing */
          --pill-outer-x-mobile: 16px;
          --pill-outer-x-desktop: 0px;
          --pill-height-mobile: 3.25rem;
          --pill-height-desktop: 2.85rem;

          /* mobile hero */
          --mobile-hero-height: 58vh; /* Full-bleed start; smooth-shrinks to pill */

          /* logo */
          --logo-size: 72px;
          --mobile-logo-size: 36px;

          /* nav */
          --nav-font-size: .95rem;
          --nav-font-weight: 400;
          --nav-letter-spacing: -.01em;
          --nav-gap: 2rem;
          --nav-line-height: 1.25;

          /* download button */
          --download-btn-pad-y-desktop: .35rem;
          --download-btn-pad-y-mobile: .50rem;

          position: sticky; top: 0; z-index: 50; display:block;
          -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
        }
        a { text-decoration: none; color: inherit; }
        .sr-only { position:absolute!important; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }

        /* Gradient (brand) */
        @keyframes gShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        :host{
          --grad-from:#0B1B2Bcc; --grad-via:#0E6F5Ccc; --grad-to:#00CFFFcc;
          --angle:135deg; --speed:16s;
        }
        .g-grad{
          background: linear-gradient(var(--angle), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gShift var(--speed) ease-in-out infinite;
        }
        .text-grad{
          background: linear-gradient(var(--angle), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%; animation: gShift var(--speed) ease-in-out infinite;
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color: transparent; color: transparent;
        }
        .logo-anim{
          display:inline-block; width: var(--logo-size); height: var(--logo-size);
          background: linear-gradient(var(--angle), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%; animation: gShift var(--speed) ease-in-out infinite;
          -webkit-mask: url('/logo.svg') no-repeat center / contain; mask: url('/logo.svg') no-repeat center / contain;
        }
        @media (prefers-reduced-motion: reduce){
          .g-grad, .text-grad, .logo-anim{ animation:none !important; }
        }

        /* Header container */
        .oc-header{ background: transparent; transition: padding .36s cubic-bezier(.2,.8,.2,1); }

        /* Core bar */
        .header-bar{
          position: relative; box-sizing: border-box; margin-inline: auto;
          display:flex; align-items:center; justify-content:space-between;
          height: var(--pill-height-mobile);
          padding-inline: 12px;
          background: transparent; border:0; border-radius:0; box-shadow:none;
          line-height: 1;
          transition:
            height .42s cubic-bezier(.2,.8,.2,1),
            width .36s cubic-bezier(.2,.8,.2,1),
            background-color .36s ease,
            border-radius .36s cubic-bezier(.2,.8,.2,1),
            box-shadow .36s ease,
            -webkit-backdrop-filter .36s ease,
            backdrop-filter .36s ease,
            padding-inline .36s ease;
        }

        /* Left / Center / Right */
        .logo-pad{ height:100%; display:flex; align-items:center; gap:.75rem; }
        .logo-pad a{ display:flex; align-items:center; line-height:1; }
        .right-area{ height:100%; display:flex; align-items:center; gap:1rem; }

        .center{
          position:absolute; left:50%; transform:translateX(-50%);
          display:none; align-items:center; gap: var(--nav-gap);
          font-size: var(--nav-font-size); font-weight: var(--nav-font-weight); letter-spacing: var(--nav-letter-spacing);
          line-height: var(--nav-line-height);
        }
        .nav-link{ font: inherit; letter-spacing: inherit; line-height: inherit; display:inline-block; position:relative; transition: transform .2s cubic-bezier(.2,.8,.2,1); }
        .center .nav-link:not(.nav-link--black){
          /* default gradient look for non-black links */
          background: linear-gradient(var(--angle), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size:300% 300%; animation:gShift var(--speed) ease-in-out infinite;
          -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color: transparent; color: transparent;
        }
        .nav-link--black{ color:#0A0D10 !important; background:none !important; -webkit-text-fill-color: initial !important; }
        .center .nav-link::after{
          content:""; position:absolute; left:10%; right:10%; bottom:-.28em; height:2px;
          background: currentColor; opacity:.22; transform: scaleX(0); transform-origin:50% 50%;
          transition: transform .28s ease, opacity .28s ease;
        }
        .center .nav-link:hover{ transform: translateY(-1px); }
        .center .nav-link:hover::after{ transform: scaleX(1); opacity:.5; }

        /* Desktop actions area */
        .desktop-actions{ display:none; align-items:center; gap:1rem; }
        .btn{
          display:inline-flex; align-items:center; gap:.5rem;
          color:#fff; font-size:.9rem; font-weight:700;
          border-radius: 16px; padding:.55rem 1rem;
          box-shadow: 0 18px 30px rgba(0,0,0,.18);
          transition: transform .2s ease, box-shadow .2s ease;
          box-sizing: border-box;
        }
        .btn:hover{ transform: translateY(-1px); box-shadow: 0 26px 40px rgba(0,0,0,.26); }
        .icon{ width:18px; height:18px; display:inline-block; }
        .right-area .btn{ padding-block: var(--download-btn-pad-y-mobile); }
        @media (min-width:768px){
          .desktop-actions{ display:flex !important; }
          .center{ display:flex; }
          .right-area .btn{
            height: calc(var(--pill-height-desktop) - (2 * var(--download-btn-pad-y-desktop)));
            padding-block: var(--download-btn-pad-y-desktop);
          }
        }

        /* Hamburger */
        .hamburger{
          --hb-size: clamp(40px, 6vw, 48px);
          --hb-line: 2px; --hb-w: calc(var(--hb-size) * .56); --hb-h: calc(var(--hb-size) * .38);
          --hb-color:#0A0D10;
          display:inline-flex; align-items:center; justify-content:center;
          width:var(--hb-size); height:var(--hb-size);
          background: transparent; border: none; border-radius: 12px; padding:0; color:var(--hb-color);
          transition: transform .16s ease, background-color .16s ease;
          -webkit-tap-highlight-color: transparent; touch-action: manipulation;
        }
        .hamburger:hover{ background: rgba(0,0,0,.04); }
        .hamburger:active{ transform: translateY(1px) scale(.98); }
        .hamburger:focus{ outline: none; }
        .hamburger:focus-visible{ outline: none; box-shadow: none; }
        .hamburger .lines{ position:relative; width:var(--hb-w); height:var(--hb-h); display:block; }
        .hamburger .lines::before, .hamburger .lines::after, .hamburger .lines span{
          content:""; position:absolute; left:0; right:0; height:var(--hb-line); border-radius:1.5px;
          background: currentColor; transform-origin:50% 50%; transition: transform .22s cubic-bezier(.2,.8,.2,1), opacity .18s ease;
        }
        .hamburger .lines::before{ top:0; }
        .hamburger .lines span{ top:50%; transform:translateY(-50%); }
        .hamburger .lines::after{ bottom:0; }
        :host(.mobile-open) .hamburger .lines::before{ top:50%; transform: translateY(calc(-.5 * var(--hb-line))) rotate(45deg); }
        :host(.mobile-open) .hamburger .lines span{ opacity:0; }
        :host(.mobile-open) .hamburger .lines::after{ bottom:auto; top:50%; transform: translateY(calc(-.5 * var(--hb-line))) rotate(-45deg); }

        /* Mobile Sheet */
        .backdrop{ position:fixed; inset:0; background:rgba(15,23,42,0.28); opacity:0; pointer-events:none; transition: opacity .18s ease; }
        :host(.mobile-open) .backdrop{ opacity:1; pointer-events:auto; }
        .sheet{
          position:fixed;
          top: max(12px, env(safe-area-inset-top));
          left: max(12px, env(safe-area-inset-left));
          right: max(12px, env(safe-area-inset-right));
          margin-bottom: max(12px, env(safe-area-inset-bottom));
          background:rgba(255,255,255,.98); border-radius: 22px; border:1px solid rgba(0,0,0,.06);
          box-shadow: 0 18px 40px rgba(0,0,0,.2);
          opacity:0; pointer-events:none; transition: opacity .18s ease;
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          display:flex; flex-direction:column;
          max-height: calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
          overflow: clip; contain: paint; z-index: 2147483647;
        }
        :host(.mobile-open) .sheet{ opacity:1; pointer-events:auto; }
        .sheet-inner{ padding:14px; overflow:hidden !important; overscroll-behavior: none !important; -webkit-overflow-scrolling: auto !important; touch-action: none !important; }
        .mobile-row{ display:flex; align-items:center; justify-content:space-between; padding:8px 6px 10px 10px; }
        .mobile-title{ display:flex; align-items:center; gap:10px; }
        .mobile-title .logo-anim{ --logo-size: var(--mobile-logo-size); }
        .mobile-nav{ display:flex; flex-direction:column; gap:.25rem; padding:4px; }
        .mobile-link{
          display:flex; align-items:center; justify-content:space-between;
          padding: 12px; border-radius: 14px; color:#0A0D10;
          font-weight: var(--nav-font-weight); font-size: var(--nav-font-size); letter-spacing: var(--nav-letter-spacing); line-height: var(--nav-line-height);
          transition: background-color .18s ease, transform .18s ease;
        }
        .mobile-link:hover{ background:#f7f8f9; transform: translateY(-1px); }
        .chev{ width:18px; height:18px; opacity:.4; }
        .mobile-actions{ display:flex; flex-direction:column; gap:.5rem; padding:10px 8px 12px; }
        .mobile-actions .btn{ justify-content:center; width:100%; border-radius:14px; padding:.75rem 1rem; box-sizing: border-box; }

        /* THEMES */
        /* Dark pill (ONXPro) */
        :host([theme="ONXPro"]), :host([theme="onxpro"]), :host([theme="pro"]) { color:#fff; }
        :host([theme="ONXPro"]) .header-bar,
        :host([theme="onxpro"]) .header-bar,
        :host([theme="pro"]) .header-bar{ background:#0A0D10; border:1px solid rgba(255,255,255,.06); box-shadow: 0 18px 38px -18px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.06); }
        :host([theme="ONXPro"].is-float) .header-bar,
        :host([theme="onxpro"].is-float) .header-bar,
        :host([theme="pro"].is-float) .header-bar{ background:#0A0D10; }
        :host([theme="ONXPro"]) .center .nav-link,
        :host([theme="onxpro"]) .center .nav-link,
        :host([theme="pro"]) .center .nav-link{ background:none !important; -webkit-text-fill-color: initial !important; color:#fff !important; }

        /* Light pill / inverted */
        :host([invert]), :host([theme="ONXProLight"]), :host([theme="onxpro-light"]), :host([theme="pro-light"]){ color:#0A0D10; }
        :host([invert]) .header-bar,
        :host([theme="ONXProLight"]) .header-bar,
        :host([theme="onxpro-light"]) .header-bar,
        :host([theme="pro-light"]) .header-bar{
          background:#ffffff !important; border:none !important; box-shadow:none !important; border-radius: 28px;
          -webkit-backdrop-filter: none !important; backdrop-filter: none !important;
        }
        :host([invert]) .center .nav-link,
        :host([theme="ONXProLight"]) .center .nav-link,
        :host([theme="onxpro-light"]) .center .nav-link,
        :host([theme="pro-light"]) .center .nav-link{ background:none !important; -webkit-text-fill-color: initial !important; color:#0A0D10 !important; }
        :host([invert]) .hamburger,
        :host([theme="ONXProLight"]) .hamburger,
        :host([theme="onxpro-light"]) .hamburger,
        :host([theme="pro-light"]) .hamburger{ color:#0A0D10 !important; }
        :host([invert]) .logo-anim,
        :host([theme="ONXProLight"]) .logo-anim,
        :host([theme="onxpro-light"]) .logo-anim,
        :host([theme="pro-light"]) .logo-anim{ background:#000 !important; }

        /* ===== Mobile START LARGE (full-bleed) → shrink to pill on scroll ===== */
        /* Initial mobile hero (no pill) */
        :host(.mobile-hero) .header-bar{
          width: 100%;
          height: var(--mobile-hero-height);
          border-radius: 0;
          background: transparent;
          box-shadow: none; border:0;
          -webkit-backdrop-filter: none; backdrop-filter: none;
          padding-inline: clamp(16px, 6vw, 28px);
        }
        :host(.mobile-hero) .logo-anim{ --logo-size: clamp(64px, 14vw, 96px); }
        :host(.mobile-hero) .hamburger{ --hb-size: clamp(46px, 8vw, 56px); }

        /* Floating pill */
        :host(.is-float) .header-bar{
          background: rgba(255,255,255,.96);
          border: 1px solid rgba(0,0,0,0.02);
          border-radius: 28px;
          box-shadow: 0 18px 38px -18px rgba(0,0,0,.25), 0 1px 0 rgba(0,0,0,.06);
          -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
          width: min(var(--header-max-w), calc(100% - (2 * var(--pill-outer-x-mobile))));
          height: var(--pill-height-mobile);
          padding-inline: 12px;
        }
        @media (min-width:768px){
          .header-bar{ height: var(--pill-height-desktop); }
          :host(.is-float) .header-bar{ width: min(var(--header-max-w), calc(100% - (2 * var(--pill-outer-x-desktop)))); height: var(--pill-height-desktop); }
        }
      </style>

      <div class="oc-header">
        <div class="header-bar">
          <!-- Left -->
          <div class="logo-pad">
            <a href="/index.html" aria-label="ONX home">
              <span class="logo-anim" aria-hidden="true"></span>
              <span class="sr-only">ONX</span>
            </a>
          </div>

          <!-- Center (desktop) -->
          <nav class="center" aria-label="Primary">
            <!-- Built-ins: ONX Pro and Pricing (identical styling) -->
            <a href="/oc-pro.html" class="nav-link">ONX Pro</a>
            <a href="/pricing.html" class="nav-link">Pricing</a>
            <span class="center-extra"></span>
            <slot name="nav"></slot>
          </nav>

          <!-- Right -->
          <div class="right-area">
            <div class="desktop-actions">
              <slot name="actions"></slot>
              <a class="btn g-grad" href="/download.html" aria-label="Download">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
                <span>Download</span>
              </a>
            </div>
            <button class="hamburger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="onxMobileMenu">
              <span class="lines"><span></span></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div class="backdrop" part="backdrop" aria-hidden="true"></div>
      <div id="onxMobileMenu" class="sheet" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="sheet-inner">
          <div class="mobile-row">
            <div class="mobile-title"><span class="logo-anim" aria-hidden="true"></span></div>
            <button class="hamburger" type="button" aria-label="Close menu"><span class="lines"><span></span></span></button>
          </div>
          <nav class="mobile-nav" aria-label="Mobile">
            <a class="mobile-link" href="/oc-pro.html">ONX Pro
              <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
            </a>
            <a class="mobile-link" href="/pricing.html">Pricing
              <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>
            </a>
            <div class="mobile-extra"></div>
          </nav>
          <div class="mobile-actions">
            <div class="mobile-extra-actions"></div>
            <a class="btn g-grad" href="/download.html" aria-label="Download">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
    `;

    // Cache nodes
    this._btns = this._root.querySelectorAll(".hamburger");
    this._backdrop = this._root.querySelector(".backdrop");
    this._sheet = this._root.getElementById("onxMobileMenu");
    this._sheetInner = this._root.querySelector(".sheet-inner");
    this._toggleBtn = this._root.querySelector('.right-area .hamburger');

    // Events
    this._btns.forEach(b => b.addEventListener("click", this._toggleMobile, { passive: true }));
    this._backdrop.addEventListener("click", () => this._toggleMobile(false), { passive: true });
    this._backdrop.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    window.addEventListener("keydown", this._closeOnEsc);
    window.addEventListener("resize", this._onResize, { passive: true });

    const blockScroll = (e) => { e.preventDefault(); };
    ["touchmove", "wheel"].forEach(evt => {
      this._sheet?.addEventListener(evt, blockScroll, { passive: false });
      this._sheetInner?.addEventListener(evt, blockScroll, { passive: false });
    });

    // Inject global-config links
    this._renderExtraLinks(ONX_HEADER_LINKS);

    // Mirror slotted content
    this._cloneSlotted('nav');
    this._cloneSlotted('actions');

    // Initial large mobile hero
    this._setMobileHeroState();
    window.addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll();

    // Spacing sync after paint
    requestAnimationFrame(this._syncEdgeGaps);
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("keydown", this._closeOnEsc);
    window.removeEventListener("resize", this._onResize);
    this._btns?.forEach(b => b.removeEventListener("click", this._toggleMobile));
    this._backdrop?.removeEventListener("click", this._toggleMobile);
  }

  /* ===== Inject global-config links ===== */
  _renderExtraLinks(list = []) {
    if (!Array.isArray(list) || !list.length) return;
    const centerExtra = this._root.querySelector('.center-extra');
    const mobileExtra = this._root.querySelector('.mobile-extra');
    if (!centerExtra || !mobileExtra) return;

    centerExtra.innerHTML = '';
    mobileExtra.innerHTML = '';

    list.forEach(item => {
      if (!item?.label || !item?.href) return;
      const isOnxPro = /onx\s*pro/i.test(item.label);

      // Desktop
      const a = document.createElement('a');
      a.className = 'nav-link';           // normalize (no forced black/bold)
      if (item.black && !isOnxPro) a.classList.add('nav-link--black');
      a.href = item.href;
      a.textContent = item.label;
      centerExtra.appendChild(a);

      // Mobile
      const m = document.createElement('a');
      m.className = 'mobile-link';
      m.href = item.href;
      m.textContent = item.label;
      const chev = document.createElementNS('http://www.w3.org/2000/svg','svg');
      chev.setAttribute('class','chev'); chev.setAttribute('viewBox','0 0 24 24');
      chev.setAttribute('fill','none'); chev.setAttribute('stroke','currentColor');
      chev.setAttribute('stroke-width','1.8'); chev.setAttribute('stroke-linecap','round'); chev.setAttribute('stroke-linejoin','round');
      const p = document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d','m9 6 6 6-6 6');
      chev.appendChild(p); m.appendChild(chev);
      m.addEventListener('click', () => this._toggleMobile(false));
      mobileExtra.appendChild(m);
    });
  }

  /* ===== Clone slotted nav/actions into mobile sheet ===== */
  _cloneSlotted(name){
    const slot = this._root.querySelector(`slot[name="${name}"]`);
    if (!slot) return;
    slot.id = name === 'nav' ? "onx-slot-nav" : "onx-slot-actions";
    slot.addEventListener('slotchange', () => this._cloneNow(name));
    this._cloneNow(name);
  }

  _cloneNow(name){
    const slot = this._root.querySelector(name === 'nav' ? '#onx-slot-nav' : '#onx-slot-actions');
    if (!slot) return;
    const assigned = slot.assignedElements({ flatten: true });

    if (name === 'nav'){
      const container = this._root.querySelector('.mobile-extra');
      assigned.forEach(node => {
        if (!(node instanceof HTMLAnchorElement)) return;
        const text = (node.textContent || '').trim();
        const isOnxPro = /onx\s*pro/i.test(text);

        // Mobile clone (normalize ONX Pro)
        const a = document.createElement('a');
        a.className = 'mobile-link';
        a.href = node.getAttribute('href') || '#';
        a.textContent = text;
        const chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chev.setAttribute('class','chev'); chev.setAttribute('viewBox','0 0 24 24');
        chev.setAttribute('fill','none'); chev.setAttribute('stroke','currentColor');
        chev.setAttribute('stroke-width','1.8'); chev.setAttribute('stroke-linecap','round'); chev.setAttribute('stroke-linejoin','round');
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d','m9 6 6 6-6 6');
        chev.appendChild(p); a.appendChild(chev);
        a.addEventListener('click', () => this._toggleMobile(false));
        container.appendChild(a);

        // Desktop mirror after injected ones
        const centerExtra = this._root.querySelector('.center-extra');
        if (centerExtra) {
          const d = node.cloneNode(true);
          if (!d.classList.contains('nav-link')) d.classList.add('nav-link');
          if (isOnxPro) d.classList.remove('nav-link--black');
          centerExtra.appendChild(d);
        }
      });
    } else {
      const acts = this._root.querySelector('.mobile-extra-actions');
      acts.innerHTML = '';
      assigned.forEach(node => {
        const clone = node.cloneNode(true);
        clone.classList.add('btn');
        clone.style.justifyContent = 'center';
        clone.removeAttribute('target');
        clone.addEventListener('click', () => this._toggleMobile(false), { passive: true });
        acts.appendChild(clone);
      });
    }
  }

  /* ===== Accessibility: focus trap in sheet ===== */
  _focusables(){
    return this._sheet?.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea') || [];
  }
  _trapTab(e){
    if (!this.classList.contains('mobile-open') || e.key !== 'Tab') return;
    const nodes = Array.from(this._focusables());
    if (!nodes.length) return;
    const first = nodes[0], last = nodes[nodes.length - 1];
    if (e.shiftKey && document.activeElement === first){ last.focus(); e.preventDefault(); }
    else if (!e.shiftKey && document.activeElement === last){ first.focus(); e.preventDefault(); }
  }

  /* ===== Open/Close ===== */
  _toggleMobile(force){
    const open = typeof force === 'boolean' ? force : !this.classList.contains('mobile-open');
    const wasOpen = this.classList.contains('mobile-open');
    if (open === wasOpen) return;

    this.classList.toggle('mobile-open', open);
    this._btns?.forEach(b => b.setAttribute('aria-expanded', String(open)));

    // Lock background scroll
    document.documentElement.style.overflow = open ? 'hidden' : '';
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.style.touchAction = open ? 'none' : '';

    if (open){
      this._prevFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const first = this._focusables()[0];
      (first instanceof HTMLElement ? first : this._toggleBtn)?.focus({ preventScroll: true });
      window.addEventListener('keydown', this._trapTab);
      this._sheetInner?.scrollTo({ top: 0, behavior: 'auto' });
    }else{
      window.removeEventListener('keydown', this._trapTab);
      (this._toggleBtn || this._prevFocus)?.focus?.({ preventScroll: true });
      this._prevFocus = null;
    }
  }
  _closeOnEsc(e){ if (e.key === 'Escape') this._toggleMobile(false); }

  _onResize(){
    if (window.matchMedia('(min-width: 768px)').matches) this._toggleMobile(false);
    this._setMobileHeroState();
    this._syncEdgeGaps();
  }

  /* Large → Pill on scroll */
  _onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    const shouldFloat = y > this._threshold;
    this.classList.toggle("is-float", shouldFloat);
    // Re-expand hero when back at top on mobile
    if (!shouldFloat) this._setMobileHeroState();
    else this.classList.remove('mobile-hero');
  }

  /* Start as full-bleed hero on mobile only */
  _setMobileHeroState(){
    const isMobile = !window.matchMedia('(min-width: 768px)').matches;
    if (isMobile && !this.classList.contains('is-float')) this.classList.add('mobile-hero');
    else this.classList.remove('mobile-hero');
  }

  /* Mobile edge spacing sync: make left logo pad and right button pad reflect top gap for perfect optics
     Manual adjustment: attribute edge-extra="6" (adds 6px) */
  _syncEdgeGaps(){
    try{
      const isMobile = !window.matchMedia('(min-width: 768px)').matches;
      if (!isMobile) return;

      const headerBar = this._root.querySelector('.header-bar');
      const logo = this._root.querySelector('.logo-pad .logo-anim');
      if (!headerBar || !logo) return;

      const hbRect = headerBar.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const topGap = Math.max(0, logoRect.top - hbRect.top);
      const edge = Math.max(0, topGap + this._edgeExtra);

      // Adjust pill inner padding based on hero top gap to keep edges visually balanced
      headerBar.style.paddingInline = this.classList.contains('is-float') ? '12px' : `${edge}px`;
    }catch(_e){ /* no-op */ }
  }
}

customElements.define("onx-header", ONXHeader);
