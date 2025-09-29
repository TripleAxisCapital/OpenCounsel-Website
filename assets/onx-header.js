// /assets/onx-header.js

/* ─────────────────────────────────────────────────────────────────────────────
   EDIT HERE — EASY NAV LINKS (optional)
   Add items to ONX_HEADER_LINKS and they will appear in BOTH:
   • Desktop header center nav  (only visible when pill header is active)
   • Mobile sheet menu
   You can also keep using <a slot="nav" ...> per-page; both methods coexist.
   Example:
   ONX_HEADER_LINKS.push({ label: "News", href: "/news.html", black: false, pro: false });
   ──────────────────────────────────────────────────────────────────────────── */
const ONX_HEADER_LINKS = [
  // { label: "News", href: "/news.html", black: false, pro: false },
  // { label: "Docs", href: "/docs.html", black: true,  pro: false },
];

/* Usage for ONX Pro page theme (page-scoped):
   <onx-header theme="ONXPro"></onx-header>
   Accepts: theme="ONXPro" | "onxpro" | "pro"
   NEW:     theme="ONXProLight" | "onxpro-light" | "pro-light"  (or just add the boolean attribute: invert)
*/

class ONXHeader extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._onScroll = this._onScroll.bind(this);
    this._toggleMobile = this._toggleMobile.bind(this);
    this._closeOnEsc = this._closeOnEsc.bind(this);
    this._onResize = this._onResize.bind(this);
    this._trapTab = this._trapTab.bind(this);
    this._threshold = parseInt(this.getAttribute("threshold") || "8", 10);
    this._prevFocus = null;

    // smooth, in-sync scroll → width interpolation (mobile)
    this._scrollRange = parseInt(this.getAttribute("scroll-range") || "140", 10);
    this._raf = null;
    this._outerMobileLarge = null;
    this._outerMobileSmall = null;

    // spacing sync
    this._syncEdgeGaps = this._syncEdgeGaps.bind(this);

    // center nav state
    this._center = null;
    this._centerVisible = false;
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
      "mobile-logo-size": "--mobile-logo-size",
      // Global nav controls
      "nav-font-size": "--nav-font-size",
      "nav-font-weight": "--nav-font-weight",
      "nav-letter-spacing": "--nav-letter-spacing",
      "nav-gap": "--nav-gap",
      "mobile-link-padding": "--mobile-link-padding",
      "nav-line-height": "--nav-line-height",
      "download-btn-pad-y-desktop": "--download-btn-pad-y-desktop",
      "download-btn-pad-y-mobile": "--download-btn-pad-y-mobile",
      // starting (top-of-page) mobile pill outer gap (smaller gap = larger pill)
      "pill-outer-x-mobile-large": "--pill-outer-x-mobile-large",
    };
    for (const [attr, cssVar] of Object.entries(varMap)) {
      const v = this.getAttribute(attr);
      if (v) this.style.setProperty(cssVar, v);
    }

    this._root.innerHTML = `
      <style>
        :host{
          /* gradient */
          --grad-from:#0B1B2Bcc; --grad-via:#0E6F5Ccc; --grad-to:#00CFFFcc;
          --angle:135deg; --speed:16s;

          /* Tunables */
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
          --pill-outer-x-mobile: 16px;             /* smaller pill on scroll */
          --pill-outer-x-mobile-large: 8px;        /* larger pill at top (mobile) */
          --pill-outer-x-desktop: 0px;
          --pill-height-mobile: 2.85rem;
          --pill-height-desktop: 2.85rem;

          --logo-pad-left-mobile: 16px;
          --logo-pad-left-desktop: 12px;
          --download-pad-right-mobile: 16px;
          --download-pad-right-desktop: 12px;

          --header-radius: 28px;
          --logo-size: 48px;
          --mobile-logo-size: 32px;

          /* Global nav controls */
          --nav-font-size: .95rem;
          --nav-font-weight: 400;
          --nav-letter-spacing: -.01em;
          --nav-gap: 2rem;
          --mobile-link-padding: 12px 12px;
          --nav-line-height: 1.25;

          /* download button padding */
          --download-btn-pad-y-desktop: .35rem;
          --download-btn-pad-y-mobile: .50rem;

          /* Dynamic (mobile) — computed in JS for truly in-sync scroll */
          --outer-x-mobile-dyn: var(--pill-outer-x-mobile-large);

          position: sticky; top: 0; z-index: 50;
          display:block;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        }

        a { text-decoration: none; color: inherit; }

        .sr-only {
          position: absolute !important; width: 1px; height: 1px;
          padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
          white-space: nowrap; border: 0;
        }

        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .g-grad, .grad-anim{
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
        }
        .text-grad{
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color: transparent; color: transparent;
        }

        .logo-anim{
          display:inline-block; width: var(--logo-size); height: var(--logo-size);
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%; animation: gradientShift var(--speed,16s) ease-in-out infinite;
          -webkit-mask: url('/logo.svg') no-repeat center / contain; mask: url('/logo.svg') no-repeat center / contain;
          transition: background .2s ease, background-size .2s ease;
        }

        /* ── NEW: Logo behavior — black at top, gradient when pill header is active ── */
        :host(:not(.is-float)) .logo-anim{
          background:#000000;
          animation:none;
        }
        :host(.is-float) .logo-anim{
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300% !important;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
        }

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
          display:flex; align-items:center; justify-content:space-between;
          height: var(--pill-height-mobile);
          padding-left: var(--pill-inner-x-mobile); padding-right: var(--pill-inner-x-mobile);
          background: transparent; border: 0; border-radius: 0; box-shadow: none;
          line-height: 1;
          -webkit-backdrop-filter: none; backdrop-filter: none;
          transition:
            width .36s cubic-bezier(.2,.8,.2,1),
            background-color .36s ease,
            border-radius .36s cubic-bezier(.2,.8,.2,1),
            box-shadow .36s ease,
            -webkit-backdrop-filter .36s ease,
            backdrop-filter .36s ease;
        }

        .logo-pad{
          height:100%;
          padding-left: var(--logo-pad-left-mobile);
          display:flex; align-items:center; gap:.75rem;
        }
        .logo-pad a{ display:flex; align-items:center; line-height:1; }

        .right-area{ height:100%; padding-right: var(--download-pad-right-mobile); display:flex; align-items:center; gap:1rem; }

        /* Center (desktop) — hidden until pill header is active */
        .center{
          position:absolute; left:50%; transform:translateX(-50%);
          display:none; align-items:center; gap: var(--nav-gap);
          font-size: var(--nav-font-size); font-weight: var(--nav-font-weight); letter-spacing: var(--nav-letter-spacing);
          line-height: var(--nav-line-height);
        }
        .center .nav-link:not(.nav-link--black){
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color: transparent; color: transparent;
          padding-bottom: .06em;
        }
        .center .center-extra{ display: contents; }

        .desktop-actions{ display:none; align-items:center; gap:1rem; }

        @media (min-width:768px){
          /* Desktop: prepare center nav for smooth reveal only in pill state */
          .center{
            display:flex;
            opacity:0;
            pointer-events:none;
            transform: translateX(-50%) translateY(-2px);
            transition: opacity .24s cubic-bezier(.2,.8,.2,1), transform .24s cubic-bezier(.2,.8,.2,1);
          }
          :host(.is-float) .center{
            opacity:1;
            transform: translateX(-50%) translateY(0);
            pointer-events:auto;
          }

          .header-bar{ height: var(--pill-height-desktop); padding-left: var(--pill-inner-x-desktop); padding-right: var(--pill-inner-x-desktop); }
          .logo-pad{ padding-left: var(--logo-pad-left-desktop); }
          .right-area{ padding-right: var(--download-pad-right-desktop); }
          .hamburger{ display:none !important; }
          .desktop-actions{ display:flex !important; }
        }

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

        /* === MOBILE: large→small pill synced to scroll; NO OUTLINE on mobile === */
        @media (max-width: 767.98px){
          .header-bar{
            background: rgba(255,255,255,.96);
            /* 🔻 remove outline on mobile pill header */
            border: none !important;
            outline: none !important;
            border-radius: var(--header-radius);
            box-shadow: 0 18px 38px -18px rgba(0,0,0,.25), 0 1px 0 rgba(0,0,0,.06);
            -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);

            /* width tied to --outer-x-mobile-dyn (set by JS on scroll) */
            width: min(var(--header-max-w), calc(100% - (2 * var(--outer-x-mobile-dyn, var(--pill-outer-x-mobile-large)))));

            transition:
              background-color .18s ease,
              border-radius .18s cubic-bezier(.2,.8,.2,1),
              box-shadow .18s ease,
              -webkit-backdrop-filter .18s ease,
              backdrop-filter .18s ease;

            will-change: width;
          }
          :host(.is-float) .header-bar{
            /* keep border removed even when "floating" on mobile */
            border: none !important;
            outline: none !important;
            width: min(var(--header-max-w), calc(100% - (2 * var(--outer-x-mobile-dyn, var(--pill-outer-x-mobile)))));
          }

          /* Ensure theme variants don't reintroduce a border on mobile */
          :host([theme="ONXPro"]) .header-bar,
          :host([theme="onxpro"]) .header-bar,
          :host([theme="pro"]) .header-bar,
          :host([theme="ONXPro"].is-float) .header-bar,
          :host([theme="onxpro"].is-float) .header-bar,
          :host([theme="pro"].is-float) .header-bar{
            border: none !important;
            outline: none !important;
            box-shadow: 0 18px 38px -18px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.06);
          }
        }
        /* === end mobile block === */

        .nav-link{
          font-weight: var(--nav-font-weight);
          letter-spacing: var(--nav-letter-spacing);
          font-size: var(--nav-font-size);
          line-height: var(--nav-line-height);
          display: inline-block;
          position: relative;
          transition: transform .2s cubic-bezier(.2,.8,.2,1);
        }
        .nav-link--black{ color:#0A0D10 !important; background:none !important; -webkit-text-fill-color: initial !important; }
        .nav-link--pro{ font-weight:800 !important; }

        .center .nav-link::after{
          content:""; position:absolute; left:10%; right:10%; bottom:-.28em; height:2px;
          background: currentColor; opacity:.22;
          transform: scaleX(0); transform-origin: 50% 50%;
          transition: transform .28s ease, opacity .28s ease;
        }
        .center .nav-link:hover{ transform: translateY(-1px); }
        .center .nav-link:hover::after{ transform: scaleX(1); opacity:.5; }

        .news-link{
          display:none; align-items:center; gap:.5rem;
          font-size:.9rem; font-weight:700; color:#0A0D10;
        }
        .btn{
          display:inline-flex; align-items:center; gap:.5rem;
          color:#fff; font-size:.9rem; font-weight:700;
          border-radius: 16px; padding:.55rem 1rem;
          box-shadow: 0 18px 30px rgba(0,0,0,.18);
          transition: transform .2s ease, box-shadow .2s ease, background .28s ease;
          box-sizing: border-box;
        }
        .btn:hover{ transform: translateY(-1px); box-shadow: 0 26px 40px rgba(0,0,0,.26); }
        .icon{ width: 18px; height: 18px; display:inline-block; }

        .right-area .btn{ padding-block: var(--download-btn-pad-y-mobile); }
        @media (min-width:768px){
          .desktop-actions .btn{
            height: calc(var(--pill-height-desktop) - (2 * var(--download-btn-pad-y-desktop)));
            padding-block: var(--download-btn-pad-y-desktop);
          }
        }

        @media (min-width:768px){
          .news-link{ display:inline-flex; }
        }

        /* ===== Mobile-specific ===== */
        .hamburger{
          --hb-size: clamp(40px, 6vw, 48px);
          --hb-line: 2px;
          --hb-w: calc(var(--hb-size) * .56);
          --hb-h: calc(var(--hb-size) * .38);
          --hb-color:#0A0D10;
          display:inline-flex; align-items:center; justify-content:center;
          width:var(--hb-size); height:var(--hb-size);
          background: transparent; border: none; border-radius: 12px;
          padding: 0; color: var(--hb-color);
          transition: transform .16s ease, background-color .16s ease;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .hamburger:hover{ background: rgba(0,0,0,.04); }
        .hamburger:active{ transform: translateY(1px) scale(.98); }
        .hamburger:focus{ outline: none; }
        .hamburger:focus-visible{ outline: none; box-shadow: none; }

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

        :host(.mobile-open) .hamburger .lines::before{
          top:50%; transform: translateY(calc(-.5 * var(--hb-line))) rotate(45deg);
        }
        :host(.mobile-open) .hamburger .lines span{ opacity:0; }
        :host(.mobile-open) .hamburger .lines::after{
          bottom:auto; top:50%; transform: translateY(calc(-.5 * var(--hb-line))) rotate(-45deg);
        }

        .backdrop{
          position:fixed; inset:0; background:rgba(15,23,42,0.28);
          opacity:0; pointer-events:none; transition: opacity .18s ease;
        }
        :host(.mobile-open) .backdrop{ opacity:1; pointer-events:auto; }

        .sheet{
          position:fixed;
          top: max(12px, env(safe-area-inset-top));
          left: max(12px, env(safe-area-inset-left));
          right: max(12px, env(safe-area-inset-right));
          margin-bottom: max(12px, env(safe-area-inset-bottom));
          background:rgba(255,255,255,.98);
          border-radius: 22px;
          border:1px solid rgba(0,0,0,.06);
          box-shadow: 0 18px 40px rgba(0,0,0,.2);
          opacity:0; pointer-events:none; transition: opacity .18s ease;
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          display:flex; flex-direction:column;
          max-height: calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
          overflow: clip;
          contain: paint;
          z-index: 2147483647;
        }
        :host(.mobile-open) .sheet{ opacity:1; pointer-events:auto; }

        .sheet-inner{
          padding: 14px;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          -webkit-overflow-scrolling: auto !important;
          touch-action: none !important;
        }

        .mobile-row{
          display:flex; align-items:center; justify-content:space-between;
          padding: 8px 6px 10px 10px;
        }
        .mobile-title{ display:flex; align-items:center; gap:10px; }
        .mobile-title .logo-anim{ --logo-size: var(--mobile-logo-size); }

        .mobile-nav{
          display:flex; flex-direction:column; gap:.25rem; padding: 4px;
        }
        .mobile-link{
          display:flex; align-items:center; justify-content:space-between;
          padding: var(--mobile-link-padding); border-radius: 14px;
          color:#0A0D10; font-weight: var(--nav-font-weight); font-size: var(--nav-font-size); letter-spacing: var(--nav-letter-spacing);
          line-height: var(--nav-line-height);
          transition: background-color .18s ease, transform .18s ease;
        }
        .mobile-link:hover{ background:#f7f8f9; transform: translateY(-1px); }
        .mobile-link .chev{ width:18px; height:18px; opacity:.4; }

        .mobile-link--pro{ font-weight:800 !important; }

        .mobile-actions{
          display:flex; flex-direction:column; gap:.5rem; padding: 10px 8px 12px;
        }
        .mobile-actions .btn{
          justify-content:center;
          width:100%;
          border-radius:14px;
          padding:.75rem 1rem;
          box-sizing: border-box;
        }

        .mobile-extra-actions a,
        .mobile-extra-actions button{
          position: static !important;
          float: none !important;
          display: inline-flex !important;
          align-items: center; justify-content: center;
          width: 100% !important; max-width: 100% !important;
          margin: 0 !important; inset: auto !important;
          box-sizing: border-box !important;
          border-radius: 14px !important;
          padding: .75rem 1rem !important;
          text-align: center !important;
          white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }

        .sheet .hamburger,
        .sheet .hamburger:hover,
        .sheet .hamburger:active,
        .sheet .hamburger:focus,
        .sheet .hamburger:focus-visible{
          background: transparent !important;
          box-shadow: none !important;
          outline: none !important;
          transform: none !important;
        }

        /* ===== ONXPro THEME ===== */
        :host([theme="ONXPro"]) .header-bar,
        :host([theme="onxpro"]) .header-bar,
        :host([theme="pro"]) .header-bar{
          background:#0A0D10;
          border:1px solid rgba(255,255,255,.06);
          box-shadow: 0 18px 38px -18px rgba(0,0,0,.45), 0 1px 0 rgba(255,255,255,.06);
        }
        :host([theme="ONXPro"].is-float) .header-bar,
        :host([theme="onxpro"].is-float) .header-bar,
        :host([theme="pro"].is-float) .header-bar{
          background:#0A0D10;
        }

        :host([theme="ONXPro"]) .center .nav-link,
        :host([theme="onxpro"]) .center .nav-link,
        :host([theme="pro"]) .center .nav-link{
          background:none !important;
          -webkit-text-fill-color: initial !important;
          color:#fff !important;
          padding-bottom: 0 !important;
        }
        :host([theme="ONXPro"]) .news-link,
        :host([theme="onxpro"]) .news-link,
        :host([theme="pro"]) .news-link{ color:#fff !important; }

        :host([theme="ONXPro"]) .desktop-actions .btn,
        :host([theme="onxpro"]) .desktop-actions .btn,
        :host([theme="pro"]) .desktop-actions .btn,
        :host([theme="ONXPro"]) .mobile-actions .btn,
        :host([theme="onxpro"]) .mobile-actions .btn,
        :host([theme="pro"]) .mobile-actions .btn{
          background:#fff !important;
          color:#0A0D10 !important;
          animation:none !important;
        }

        :host([theme="ONXPro"]) .hamburger,
        :host([theme="onxpro"]) .hamburger,
        :host([theme="pro"]) .hamburger{ color:#fff; }

        /* ===== LIGHT / INVERTED VARIANT ===== */
        :host([invert]) .header-bar,
        :host([theme="ONXProLight"]) .header-bar,
        :host([theme="onxpro-light"]) .header-bar,
        :host([theme="pro-light"]) .header-bar{
          background:#ffffff !important;
          color:#0A0D10 !important;
          border:none !important;
          box-shadow:none !important;
          border-radius: var(--header-radius);
          -webkit-backdrop-filter: none !important;
          backdrop-filter: none !important;
        }
        :host([invert].is-float) .header-bar,
        :host([theme="ONXProLight"].is-float) .header-bar,
        :host([theme="onxpro-light"].is-float) .header-bar,
        :host([theme="pro-light"].is-float) .header-bar{
          background:#ffffff !important;
          border:none !important;
          box-shadow:none !important;
        }

        :host(:not([theme="ONXPro"]):not([theme="onxpro"]):not([theme="pro"])) .center .nav-link,
        :host([invert]) .center .nav-link,
        :host([theme="ONXProLight"]) .center .nav-link,
        :host([theme="onxpro-light"]) .center .nav-link,
        :host([theme="pro-light"]) .center .nav-link{
          background:none !important;
          -webkit-text-fill-color: initial !important;
          color:#0A0D10 !important;
          padding-bottom: 0 !important;
        }

        :host([invert]) .news-link,
        :host([theme="ONXProLight"]) .news-link,
        :host([theme="onxpro-light"]) .news-link,
        :host([theme="pro-light"]) .news-link{
          color:#0A0D10 !important;
        }

        :host([invert]) .desktop-actions .btn,
        :host([invert]) .mobile-actions .btn,
        :host([theme="ONXProLight"]) .desktop-actions .btn,
        :host([theme="ONXProLight"]) .mobile-actions .btn,
        :host([theme="onxpro-light"]) .desktop-actions .btn,
        :host([theme="onxpro-light"]) .mobile-actions .btn,
        :host([theme="pro-light"]) .desktop-actions .btn,
        :host([theme="pro-light"]) .mobile-actions .btn{
          background:#0A0D10 !important;
          color:#ffffff !important;
          animation:none !important;
        }

        :host([invert]) .hamburger,
        :host([theme="ONXProLight"]) .hamburger,
        :host([theme="onxpro-light"]) .hamburger,
        :host([theme="pro-light"]) .hamburger{ color:#0A0D10 !important; }

        /* UPDATED: keep light/invert logos black ONLY at top (not floating) */
        :host([invert]:not(.is-float)) .logo-anim,
        :host([theme="ONXProLight"]:not(.is-float)) .logo-anim,
        :host([theme="onxpro-light"]:not(.is-float)) .logo-anim,
        :host([theme="pro-light"]:not(.is-float)) .logo-anim{
          background:#000000 !important;
          animation:none !important;
        }

        /* Force gradient back in pill state even if themes tried to override */
        :host([invert].is-float) .logo-anim,
        :host([theme="ONXProLight"].is-float) .logo-anim,
        :host([theme="onxpro-light"].is-float) .logo-anim,
        :host([theme="pro-light"].is-float) .logo-anim{
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to)) !important;
          background-size: 300% 300% !important;
          animation: gradientShift var(--speed,16s) ease-in-out infinite !important;
        }

        /* ───────────────── NEW: Get Started button behavior ────────────────
           Start black at page top; switch to gradient animation in pill state.
           Applies to BOTH desktop .desktop-actions and mobile .mobile-actions.
           (Keeps theme overrides intact.)
        ------------------------------------------------------------------- */
        :host(:not(.is-float)) .desktop-actions .btn.g-grad.grad-anim,
        :host(:not(.is-float)) .mobile-actions .btn.g-grad.grad-anim{
          background:#0A0D10 !important;   /* solid black at top */
          color:#ffffff !important;
          animation:none !important;        /* stop gradient motion */
        }
        /* When header floats → restore gradient animation automatically */
        :host(.is-float) .desktop-actions .btn.g-grad.grad-anim,
        :host(.is-float) .mobile-actions .btn.g-grad.grad-anim{
          /* no overrides → original gradient animation shows */
        }

        /* ───────────────── FINAL MOBILE OVERRIDE — NO PILL OUTLINE ───────────────── */
        @media (max-width: 767.98px){
          /* At page top (not floating): remove ALL edges */
          :host(:not(.is-float)) .header-bar{
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            -webkit-box-shadow: none !important;
            /* keep the rest of your styling (background, blur, radius) */
          }

          /* Belt-and-suspenders: prevent any theme from re-adding a border */
          :host([theme="ONXPro"]) .header-bar,
          :host([theme="onxpro"]) .header-bar,
          :host([theme="pro"]) .header-bar,
          :host([theme="ONXProLight"]) .header-bar,
          :host([theme="onxpro-light"]) .header-bar,
          :host([theme="pro-light"]) .header-bar,
          :host([invert]) .header-bar,
          :host([theme="ONXPro"].is-float) .header-bar,
          :host([theme="onxpro"].is-float) .header-bar,
          :host([theme="pro"].is-float) .header-bar{
            border: none !important;
            outline: none !important;
          }
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
          <nav class="center" aria-label="Primary" aria-hidden="true">
            <a href="/oc-pro.html" class="nav-link">ONX Pro</a>
            <a href="/pricing.html" class="nav-link">Pricing</a>
            <span class="center-extra"></span>
            <slot name="nav"></slot>
          </nav>

          <!-- Right -->
          <div class="right-area">
            <div class="desktop-actions">
              <slot name="actions"></slot>
              <a class="btn g-grad grad-anim" href="/download.html" aria-label="Download">
                <span>Get Started</span>
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
            <div class="mobile-title">
              <span class="logo-anim" aria-hidden="true"></span>
            </div>
            <button class="hamburger" type="button" aria-label="Close menu">
              <span class="lines"><span></span></span>
            </button>
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
            <a class="btn g-grad grad-anim" href="/download.html" aria-label="Download">
             <span>Get Started</span>
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
    this._center = this._root.querySelector('.center');

    // Events
    this._btns.forEach(b => b.addEventListener("click", this._toggleMobile));
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

    // Clone slotted content
    this._cloneSlotted('nav');
    this._cloneSlotted('actions');

    // Prime CSS var caches for interpolation
    this._cacheDims();

    // Scroll + initial state
    window.addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll(); // sets .is-float + syncs center nav visibility

    // spacing after paint
    requestAnimationFrame(this._syncEdgeGaps);
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("keydown", this._closeOnEsc);
    window.removeEventListener("resize", this._onResize);
    if (this._btns) this._btns.forEach(b => b.removeEventListener("click", this._toggleMobile));
    if (this._backdrop) this._backdrop.removeEventListener("click", this._toggleMobile);
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  /* ===== Inject global-config links ===== */
  _renderExtraLinks(list = []) {
    if (!Array.isArray(list) || !list.length) return;

    const centerExtra = this._root.querySelector('.center-extra');
    const mobileExtra = this._root.querySelector('.mobile-extra');
    if (!centerExtra || !mobileExtra) return;

    // Clear previous
    centerExtra.innerHTML = '';
    mobileExtra.innerHTML = '';

    list.forEach(item => {
      if (!item || !item.label || !item.href) return;

      const isOnxPro = String(item.label).trim().toLowerCase().includes('onx pro');

      // Desktop link
      const a = document.createElement('a');
      a.className =
        'nav-link' +
        (item.black && !isOnxPro ? ' nav-link--black' : '') +
        (item.pro && !isOnxPro ? ' nav-link--pro' : '');
      a.href = item.href;
      a.textContent = item.label;
      centerExtra.appendChild(a);

      // Mobile link
      const m = document.createElement('a');
      m.className = 'mobile-link' + (item.pro && !isOnxPro ? ' mobile-link--pro' : '');
      m.href = item.href;
      m.textContent = item.label;
      const chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chev.setAttribute('class','chev'); chev.setAttribute('viewBox','0 0 24 24');
      chev.setAttribute('fill','none'); chev.setAttribute('stroke','currentColor');
      chev.setAttribute('stroke-width','1.8'); chev.setAttribute('stroke-linecap','round'); chev.setAttribute('stroke-linejoin','round');
      const p = document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d','m9 6 6 6-6 6');
      chev.appendChild(p);
      m.appendChild(chev);
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

        // Mobile clone
        const a = document.createElement('a');
        a.className = 'mobile-link';
        a.href = node.getAttribute('href') || '#';
        a.textContent = text;
        if (node.classList.contains('nav-link--pro') && !isOnxPro) a.classList.add('mobile-link--pro');
        const chev = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        chev.setAttribute('class','chev'); chev.setAttribute('viewBox','0 0 24 24');
        chev.setAttribute('fill','none'); chev.setAttribute('stroke','currentColor');
        chev.setAttribute('stroke-width','1.8'); chev.setAttribute('stroke-linecap','round'); chev.setAttribute('stroke-linejoin','round');
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path'); p.setAttribute('d','m9 6 6 6-6 6');
        chev.appendChild(p);
        a.appendChild(chev);
        a.addEventListener('click', () => this._toggleMobile(false));
        container.appendChild(a);

        // Desktop mirror after injected ones
        const centerExtra = this._root.querySelector('.center-extra');
        if (centerExtra) {
          const d = node.cloneNode(true);
          if (!d.classList.contains('nav-link')) d.classList.add('nav-link');
          if (/onx\s*pro/i.test((d.textContent || ''))) {
            d.classList.remove('nav-link--pro','nav-link--black');
          }
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

  /* ===== Accessibility: focus trap ===== */
  _focusables(){
    return this._sheet?.querySelectorAll(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), input, select, textarea'
    ) || [];
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
    this._cacheDims();
    this._syncEdgeGaps();
    this._onScroll();
  }

  _cacheDims(){
    const styles = getComputedStyle(this);
    const toPx = (v) => parseFloat(String(v).replace('px','')) || 0;
    this._outerMobileLarge = toPx(styles.getPropertyValue('--pill-outer-x-mobile-large'));
    this._outerMobileSmall = toPx(styles.getPropertyValue('--pill-outer-x-mobile'));
    if (!this._outerMobileLarge) this._outerMobileLarge = 8;
    if (!this._outerMobileSmall) this._outerMobileSmall = 16;
  }

  /* ===== Show nav links only when pill header is active (desktop) ===== */
  _syncCenterVisibility(visible){
    if (!this._center) return;
    if (this._centerVisible === visible) return;
    this._centerVisible = visible;

    this._center.setAttribute('aria-hidden', String(!visible));
    // Prefer the inert property if available
    try { this._center.inert = !visible; } catch(_e){ /* noop */ }

    // Make links unfocusable when hidden for perfect a11y
    const nodes = this._root.querySelectorAll('.center a, .center button, .center [tabindex]');
    nodes.forEach(el => {
      if (!visible) el.setAttribute('tabindex','-1');
      else el.removeAttribute('tabindex');
    });
  }

  _onScroll() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      const y = window.scrollY || document.documentElement.scrollTop || 0;
      const isMobile = !window.matchMedia('(min-width: 768px)').matches;

      let floated = false;

      if (isMobile){
        const t = Math.max(0, Math.min(1, y / this._scrollRange));
        const outer = this._outerMobileLarge + (this._outerMobileSmall - this._outerMobileLarge) * t;
        this.style.setProperty('--outer-x-mobile-dyn', `${outer.toFixed(2)}px`);
        this.classList.toggle("is-float", y > 0);
        floated = y > 0;
      } else {
        if (y > this._threshold){ this.classList.add("is-float"); floated = true; }
        else { this.classList.remove("is-float"); floated = false; }
      }

      // Only show desktop center nav when floating (pill) and on desktop
      this._syncCenterVisibility(!isMobile && floated);

      this._raf = null;
    });
  }

  /* ===== Mobile edge spacing sync ===== */
  _syncEdgeGaps(){
    try{
      const isMobile = !window.matchMedia('(min-width: 768px)').matches;
      if (!isMobile){
        this.style.removeProperty('--pill-inner-x-mobile');
        this.style.removeProperty('--logo-pad-left-mobile');
        this.style.removeProperty('--download-pad-right-mobile');
        return;
      }
      const headerBar = this._root.querySelector('.header-bar');
      const logo = this._root.querySelector('.logo-pad .logo-anim');
      if (!headerBar || !logo) return;

      const hbRect = headerBar.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      const topGap = Math.max(0, logoRect.top - hbRect.top);

      const extra = 15; // px
      this.style.setProperty('--pill-inner-x-mobile', `${topGap + extra}px`);
      this.style.setProperty('--logo-pad-left-mobile', `0px`);
      this.style.setProperty('--download-pad-right-mobile', `0px`);
    }catch(_e){
      /* no-op */
    }
  }
}

customElements.define("onx-header", ONXHeader);
