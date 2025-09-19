// /assets/onx-header.js
class ONXHeader extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._onScroll = this._onScroll.bind(this);
    this._toggleMobile = this._toggleMobile.bind(this);
    this._closeOnEsc = this._closeOnEsc.bind(this);
    this._threshold = parseInt(this.getAttribute("threshold") || "8", 10);
  }

  connectedCallback() {
    // Allow per-instance CSS variable overrides via attributes
    const varMap = {
      "width-flat": "--header-width-flat",
      "max-w": "--header-max-w",
      "pad-flat-top": "--header-flat-pad-top",
      "pad-flat-bottom": "--header-flat-pad-bottom",
      "pad-float-top-mobile": "--header-float-pad-top-mobile",
      "pad-float-bottom-mobile": "--header-float-pad-bottom-mobile",
      "pad-float-top-desktop": "--header-float-pad-top-desktop",
      "pad-float-bottom-desktop": "--header-float-pad-bottom-desktop",
      "pill-inner-x-mobile": "--pill-inner-x-mobile",
      "pill-inner-x-desktop": "--pill-inner-x-desktop",
      "pill-outer-x-mobile": "--pill-outer-x-mobile",
      "pill-outer-x-desktop": "--pill-outer-x-desktop",
      "pill-height-mobile": "--pill-height-mobile",
      "pill-height-desktop": "--pill-height-desktop",
      "logo-size": "--logo-size",
    };
    for (const [attr, cssVar] of Object.entries(varMap)) {
      const v = this.getAttribute(attr);
      if (v) this.style.setProperty(cssVar, v);
    }

    this._root.innerHTML = `
      <style>
        :host{
          /* Single source of truth for gradient animation */
          --grad-from:#0B1B2Bcc; --grad-via:#0E6F5Ccc; --grad-to:#00CFFFcc;
          --angle:135deg; --speed:16s;

          /* Tunables (overridable on the tag) */
          --header-width-flat: 100%;
          --header-max-w: 1200px;
          --header-flat-pad-top: 0rem;
          --header-flat-pad-bottom: 0rem;
          --header-float-pad-top-mobile: .75rem;
          --header-float-pad-bottom-mobile: .25rem;
          --header-float-pad-top-desktop: 1rem;
          --header-float-pad-bottom-desktop: .25rem;

          --pill-inner-x-mobile: 30px;
          --pill-inner-x-desktop: 12px;
          --pill-outer-x-mobile: 16px;
          --pill-outer-x-desktop: 0px;
          --pill-height-mobile: 3.0rem;
          --pill-height-desktop: 3.5rem;

          --logo-pad-left-mobile: 16px;
          --logo-pad-left-desktop: 12px;
          --download-pad-right-mobile: 16px;
          --download-pad-right-desktop: 12px;

          --header-radius: 28px;
          --logo-size: 44px;

          position: sticky; top: 0; z-index: 50;
          display:block;
        }

        a { text-decoration: none; color: inherit; }

        .sr-only {
          position: absolute !important; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
          white-space: nowrap; border: 0;
        }

        /* Gradient animation (shared by logo, nav links, button) */
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .g-grad, .grad-anim{
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
        }
        /* Text variant that uses the SAME tokens/animation as the button/logo */
        .text-grad{
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color: transparent; color: transparent;
        }

        /* Logo mark (animated gradient inside SVG mask) */
        .logo-anim{
          display:inline-block; width: var(--logo-size); height: var(--logo-size);
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%; animation: gradientShift var(--speed,16s) ease-in-out infinite;
          -webkit-mask: url('/logo.svg') no-repeat center / contain; mask: url('/logo.svg') no-repeat center / contain;
        }

        /* ===== Header shell ===== */
        .oc-header{
          background: transparent;
          padding-top: var(--header-flat-pad-top);
          padding-bottom: var(--header-flat-pad-bottom);
          transition: padding .36s cubic-bezier(.2,.8,.2,1);
        }
        .header-bar{
          position: relative; box-sizing: border-box;
          width: var(--header-width-flat);
          margin-inline: auto;
          display:flex; align-items:center; justify-content:space-between; /* centers children vertically */
          height: var(--pill-height-mobile);
          padding-left: var(--pill-inner-x-mobile); padding-right: var(--pill-inner-x-mobile);
          background: transparent; border: 0; border-radius: 0; box-shadow: none;
          line-height: 1; /* removes baseline creep */
          -webkit-backdrop-filter: none; backdrop-filter: none;
          transition:
            width .36s cubic-bezier(.2,.8,.2,1),
            background-color .36s ease,
            border-radius .36s cubic-bezier(.2,.8,.2,1),
            box-shadow .36s ease,
            -webkit-backdrop-filter .36s ease,
            backdrop-filter .36s ease;
        }
        /* Ensure the ONX block is perfectly centered vertically */
        .logo-pad{
          height:100%;
          padding-left: var(--logo-pad-left-mobile);
          display:flex; align-items:center; gap:.75rem;
        }
        .logo-pad a{ display:flex; align-items:center; line-height:1; }

        .right-area{ height:100%; padding-right: var(--download-pad-right-mobile); display:flex; align-items:center; gap:1rem; }

        /* Desktop center nav */
        .center{
          position:absolute; left:50%; transform:translateX(-50%);
          display:none; align-items:center; gap:2rem;
          font-size:.925rem; font-weight:700; letter-spacing:-.01em;
        }
        /* Apply shared gradient to ALL center nav links except the black Pro link */
        .center .nav-link:not(.nav-link--black){ composes: text-grad; }
        /* Fallback if "composes" unsupported (Shadow DOM CSS): duplicate rules */
        .center .nav-link:not(.nav-link--black){
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color: transparent; color: transparent;
        }

        /* Desktop */
        .desktop-actions{ display:none; align-items:center; gap:1rem; }

        @media (min-width:768px){
          .header-bar{
            height: var(--pill-height-desktop);
            padding-left: var(--pill-inner-x-desktop); padding-right: var(--pill-inner-x-desktop);
          }
          .logo-pad{ padding-left: var(--logo-pad-left-desktop); }
          .right-area{ padding-right: var(--download-pad-right-desktop); }
          .center{ display:flex; }
          .hamburger{ display:none !important; }          /* no hamburger on desktop */
          .desktop-actions{ display:flex !important; }    /* show Download + News on desktop */
        }

        /* Pill state on scroll */
        :host(.is-float) .oc-header{
          padding-top: var(--header-float-pad-top-mobile);
          padding-bottom: var(--header-float-pad-bottom-mobile);
        }
        @media (min-width:768px){
          :host(.is-float) .oc-header{
            padding-top: var(--header-float-pad-top-desktop);
            padding-bottom: var(--header-float-pad-bottom-desktop);
          }
        }
        :host(.is-float) .header-bar{
          background: rgba(255,255,255,.96);
          border: 1px solid rgba(0,0,0,0.02);
          border-radius: var(--header-radius);
          box-shadow: 0 18px 38px -18px rgba(0,0,0,.25), 0 1px 0 rgba(0,0,0,.06);
          -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
          width: min(var(--header-max-w), calc(100% - (2 * var(--pill-outer-x-mobile))));
        }
        @media (min-width:768px){
          :host(.is-float) .header-bar{
            width: min(var(--header-max-w), calc(100% - (2 * var(--pill-outer-x-desktop))));
          }
        }

        .nav-link{ font-weight:700; letter-spacing:-.01em; }
        .nav-link--black{ color:#0A0D10 !important; background:none !important; -webkit-text-fill-color: initial !important; }
        .nav-link--pro{ font-weight:800 !important; } /* ONX Pro always bolder/black */

        /* Desktop right-side defaults */
        .news-link{
          display:none; align-items:center; gap:.5rem;
          font-size:.9rem; font-weight:700; color:#0A0D10;
        }
        .btn{
          display:inline-flex; align-items:center; gap:.5rem;
          color:#fff; font-size:.9rem; font-weight:700;
          border-radius: 16px; padding:.55rem 1rem;
          box-shadow: 0 18px 30px rgba(0,0,0,.18);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .btn:hover{ transform: translateY(-1px); box-shadow: 0 26px 40px rgba(0,0,0,.26); }
        .icon{ width: 18px; height: 18px; display:inline-block; }

        @media (min-width:768px){
          .news-link{ display:inline-flex; }
        }

        /* ===== Mobile-specific UI ===== */
        /* Sleek, minimal hamburger — scalable & glitch-free */
        .hamburger{
          --hb-size: clamp(40px, 6vw, 48px);
          --hb-line: 2px;
          --hb-w: calc(var(--hb-size) * .56);
          --hb-h: calc(var(--hb-size) * .38);
          --hb-color:#0A0D10;

          display:inline-flex; align-items:center; justify-content:center;
          width:var(--hb-size); height:var(--hb-size);
          background: transparent; border: none; border-radius: 0; box-shadow: none; padding: 0;
          color: var(--hb-color);
          transition: transform .2s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .hamburger:active{ transform: translateY(1px); }
        .hamburger:focus, .hamburger:focus-visible{ outline: none; box-shadow: none; }

        .hamburger .lines{
          position:relative; width:var(--hb-w); height:var(--hb-h); display:block;
        }
        .hamburger .lines::before,
        .hamburger .lines::after,
        .hamburger .lines span{
          content:""; position:absolute; left:0; right:0;
          height:var(--hb-line); border-radius:1.5px;
          background: currentColor;
          transform-origin: 50% 50%;
          transition: transform .22s cubic-bezier(.2,.8,.2,1), opacity .18s ease;
        }
        .hamburger .lines::before{ top:0; }
        .hamburger .lines span{ top:50%; transform:translateY(-50%); }
        .hamburger .lines::after{ bottom:0; }

        /* X animation — move top/bottom to center then rotate */
        :host(.mobile-open) .hamburger .lines::before{
          top:50%; transform: translateY(calc(-.5 * var(--hb-line))) rotate(45deg);
        }
        :host(.mobile-open) .hamburger .lines span{ opacity:0; }
        :host(.mobile-open) .hamburger .lines::after{
          bottom:auto; top:50%; transform: translateY(calc(-.5 * var(--hb-line))) rotate(-45deg);
        }

        /* Backdrop */
        .backdrop{
          position:fixed; inset:0; background:rgba(15,23,42,0.28);
          opacity:0; pointer-events:none; transition: opacity .18s ease;
        }
        :host(.mobile-open) .backdrop{ opacity:1; pointer-events:auto; }

        /* Sheet */
        .sheet{
          position:fixed;
          top: max(12px, env(safe-area-inset-top));
          left: max(12px, env(safe-area-inset-left));
          right: max(12px, env(safe-area-inset-right));
          background:rgba(255,255,255,.98);
          border-radius: 22px;
          border:1px solid rgba(0,0,0,.06);
          box-shadow: 0 18px 40px rgba(0,0,0,.2);
          transform: translateY(-10px); opacity:0; pointer-events:none;
          transition: transform .22s cubic-bezier(.2,.8,.2,1), opacity .18s ease;
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
        }
        :host(.mobile-open) .sheet{ transform: translateY(0); opacity:1; pointer-events:auto; }

        .sheet-inner{ padding: 14px; }
        .mobile-row{
          display:flex; align-items:center; justify-content:space-between;
          padding: 8px 6px 10px 10px;
        }
        .mobile-title{ display:flex; align-items:center; gap:10px; }
        .mobile-title .logo-anim{ --logo-size: 32px; }

        .mobile-nav{
          display:flex; flex-direction:column; gap:.25rem; padding: 4px;
        }
        .mobile-link{
          display:flex; align-items:center; justify-content:space-between;
          padding: 12px 12px; border-radius: 14px;
          color:#0A0D10; font-weight:700; font-size:1rem;
        }
        .mobile-link:hover{ background:#f7f8f9; }
        .mobile-link .chev{ width:18px; height:18px; opacity:.4; }

        .mobile-link--pro{ font-weight:800 !important; }

        .mobile-actions{
          display:flex; flex-direction:column; gap:.5rem; padding: 10px 8px 12px;
        }
        .mobile-actions .btn{ justify-content:center; width:100%; border-radius:14px; padding:.75rem 1rem; }

        @media (prefers-reduced-motion: reduce){
          .sheet, .backdrop, .hamburger .lines::before,
          .hamburger .lines::after, .hamburger .lines span { transition:none; }
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
            <a href="/oc-pro.html" class="nav-link nav-link--black nav-link--pro">ONX Pro</a>
            <a href="/models.html" class="nav-link">Models</a>
            <slot name="nav"></slot>
          </nav>

          <!-- Right -->
          <div class="right-area">
            <!-- Desktop actions (no hamburger on desktop) -->
            <div class="desktop-actions">
              <a class="news-link" href="/news.html" aria-label="ONX News">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h14a2 2 0 0 1 2 2v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a2 2 0 0 1 2-2Z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>
                <span>ONX-News</span>
              </a>
              <slot name="actions"></slot>
              <a class="btn g-grad grad-anim" href="/download.html" aria-label="Download">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
                <span>Download</span>
              </a>
            </div>

            <!-- Mobile hamburger -->
            <button class="hamburger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="onxMobileMenu">
              <span class="lines"><span></span></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div class="backdrop" part="backdrop"></div>
      <div id="onxMobileMenu" class="sheet" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="sheet-inner">
          <div class="mobile-row">
            <div class="mobile-title">
              <span class="logo-anim" aria-hidden="true"></span>
              <strong>ONX</strong>
            </div>
            <button class="hamburger" type="button" aria-label="Close menu">
              <span class="lines"><span></span></span>
            </button>
          </div>

          <nav class="mobile-nav">
            <!-- built-in defaults -->
            <a class="mobile-link mobile-link--pro" href="/oc-pro.html">ONX Pro <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></a>
            <a class="mobile-link" href="/models.html">Models <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></a>
            <!-- slotted / cloned go here -->
            <div class="mobile-extra"></div>
          </nav>

          <div class="mobile-actions">
            <div class="mobile-extra-actions"></div>
            <a class="btn g-grad grad-anim" href="/download.html" aria-label="Download">
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
              <span>Download</span>
            </a>
          </div>
        </div>
      </div>
    `;

    // Events
    this._btns = this._root.querySelectorAll(".hamburger");
    this._backdrop = this._root.querySelector(".backdrop");
    this._sheet = this._root.getElementById("onxMobileMenu");
    this._btns.forEach(b => b.addEventListener("click", this._toggleMobile));
    this._backdrop.addEventListener("click", this._toggleMobile);
    window.addEventListener("keydown", this._closeOnEsc);

    // Clone slotted nav + actions into mobile panel
    this._cloneSlotted("#onx-slot-nav", 'nav');
    this._cloneSlotted("#onx-slot-actions", 'actions');

    window.addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll(); // initial
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("keydown", this._closeOnEsc);
    if (this._btns) this._btns.forEach(b => b.removeEventListener("click", this._toggleMobile));
    if (this._backdrop) this._backdrop.removeEventListener("click", this._toggleMobile);
  }

  _cloneSlotted(id, name){
    let navSlot = this._root.querySelector(`slot[name="\${name}"]`);
    if (!navSlot) return;
    navSlot.id = name === 'nav' ? "onx-slot-nav" : "onx-slot-actions";
    navSlot.addEventListener('slotchange', () => this._cloneNow(name));
    this._cloneNow(name);
  }

  _cloneNow(name){
    const slot = this._root.querySelector(name === 'nav' ? '#onx-slot-nav' : '#onx-slot-actions');
    if (!slot) return;
    const assigned = slot.assignedElements({ flatten: true });
    if (name === 'nav'){
      const container = this._root.querySelector('.mobile-extra');
      container.innerHTML = '';
      assigned.forEach(node => {
        if (!(node instanceof HTMLAnchorElement)) return;
        const a = document.createElement('a');
        a.className = 'mobile-link';
        a.href = node.getAttribute('href') || '#';
        a.textContent = node.textContent.trim();
        if (node.classList.contains('nav-link--pro')) a.classList.add('mobile-link--pro');
        const chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chev.setAttribute('class','chev'); chev.setAttribute('viewBox','0 0 24 24');
        chev.setAttribute('fill','none'); chev.setAttribute('stroke','currentColor');
        chev.setAttribute('stroke-width','1.8'); chev.setAttribute('stroke-linecap','round'); chev.setAttribute('stroke-linejoin','round');
        const p = document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d','m9 6 6 6-6 6');
        chev.appendChild(p);
        a.appendChild(chev);
        a.addEventListener('click', () => this._toggleMobile(false));
        container.appendChild(a);
      });
    }else{
      const acts = this._root.querySelector('.mobile-extra-actions');
      acts.innerHTML = '';
      assigned.forEach(node => {
        const clone = node.cloneNode(true);
        clone.classList.add('btn');
        clone.style.justifyContent = 'center';
        clone.addEventListener('click', () => this._toggleMobile(false));
        acts.appendChild(clone);
      });
    }
  }

  _toggleMobile(force){
    const open = typeof force === 'boolean' ? force : !this.classList.contains('mobile-open');
    this.classList.toggle('mobile-open', open);
    this._btns?.forEach(b => b.setAttribute('aria-expanded', String(open)));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    document.body.style.overflow = open ? 'hidden' : '';
  }

  _closeOnEsc(e){ if (e.key === 'Escape') this._toggleMobile(false); }

  _onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (y > this._threshold) this.classList.add("is-float");
    else this.classList.remove("is-float");
  }
}

customElements.define("onx-header", ONXHeader);
