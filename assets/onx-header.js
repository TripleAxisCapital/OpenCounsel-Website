// /assets/onx-header.js

/* ─────────────────────────────────────────────────────────────────────────────
   EDIT HERE — EASY NAV LINKS (optional)
   Add items to ONX_HEADER_LINKS and they will appear in BOTH:
   • Desktop header center nav
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
      // Global nav controls (apply to header + mobile)
      "nav-font-size": "--nav-font-size",
      "nav-font-weight": "--nav-font-weight",
      "nav-letter-spacing": "--nav-letter-spacing",
      "nav-gap": "--nav-gap",
      "mobile-link-padding": "--mobile-link-padding",
      // NEW: precise line-height control to prevent descender clipping
      "nav-line-height": "--nav-line-height",
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
          --logo-size: 65px;       /* desktop header logo */
          --mobile-logo-size: 32px;/* adjustable mobile logo size */

          /* Global nav controls (header + mobile) */
          --nav-font-size: .95rem;
          --nav-font-weight: 700;
          --nav-letter-spacing: -.01em;
          --nav-gap: 2rem;
          --mobile-link-padding: 12px 12px;
          /* NEW: prevent descender clipping (e.g., "g" in Pricing) */
          --nav-line-height: 1.25;

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

        /* Gradient animation (shared by logo, nav links, button) */
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
          display:flex; align-items:center; justify-content:space-between;
          height: var(--pill-height-mobile);
          padding-left: var(--pill-inner-x-mobile); padding-right: var(--pill-inner-x-mobile);
          background: transparent; border: 0; border-radius: 0; box-shadow: none;
          line-height: 1; /* child links override with --nav-line-height */
          -webkit-backdrop-filter: none; backdrop-filter: none;
          transition:
            width .36s cubic-bezier(.2,.8,.2,1),
            background-color .36s ease,
            border-radius .36s cubic-bezier(.2,.8,.2,1),
            box-shadow .36s ease,
            -webkit-backdrop-filter .36s ease,
            backdrop-filter .36s ease;
        }

        /* Perfect vertical centering for ONX block */
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
          display:none; align-items:center; gap: var(--nav-gap);
          font-size: var(--nav-font-size); font-weight: var(--nav-font-weight); letter-spacing: var(--nav-letter-spacing);
          line-height: var(--nav-line-height); /* NEW */
        }
        .center .nav-link:not(.nav-link--black){
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color: transparent; color: transparent;
          /* NEW: tiny bottom padding ensures descenders aren't visually clipped by WebKit's text clipping with background-clip:text */
          padding-bottom: .06em;
        }
        .center .center-extra{ display: contents; } /* placeholder container for injected links */

        /* Desktop */
        .desktop-actions{ display:none; align-items:center; gap:1rem; }

        @media (min-width:768px){
          .header-bar{ height: var(--pill-height-desktop); padding-left: var(--pill-inner-x-desktop); padding-right: var(--pill-inner-x-desktop); }
          .logo-pad{ padding-left: var(--logo-pad-left-desktop); }
          .right-area{ padding-right: var(--download-pad-right-desktop); }
          .center{ display:flex; }
          .hamburger{ display:none !important; }
          .desktop-actions{ display:flex !important; }
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

        .nav-link{
          font-weight: var(--nav-font-weight);
          letter-spacing: var(--nav-letter-spacing);
          font-size: var(--nav-font-size);
          line-height: var(--nav-line-height); /* NEW */
          display: inline-block; /* helps avoid glyph cropping in some engines */
        }
        .nav-link--black{ color:#0A0D10 !important; background:none !important; -webkit-text-fill-color: initial !important; }
        .nav-link--pro{ font-weight:800 !important; }

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

        /* ===== Mobile-specific UI (Apple-grade) ===== */
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
        /* Remove any outline around the X/hamburger buttons */
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

        /* X animation */
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

        /* Sheet — locked position, NO sliding, NO scroll movement */
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
          opacity:0; pointer-events:none;
          transition: opacity .18s ease;
          -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
          display:flex; flex-direction:column;
          max-height: calc(100dvh - 24px - env(safe-area-inset-top) - env(safe-area-inset-bottom));
          overflow: clip; /* clips shadows/bleed perfectly to rounded corners */
          contain: paint;
          z-index: 2147483647;
        }
        :host(.mobile-open) .sheet{ opacity:1; pointer-events:auto; }

        .sheet-inner{
          padding: 14px;
          /* Hard-disable scrolling and panning */
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
          line-height: var(--nav-line-height); /* NEW */
        }
        .mobile-link:hover{ background:#f7f8f9; }
        .mobile-link .chev{ width:18px; height:18px; opacity:.4; }

        .mobile-link--pro{ font-weight:800 !important; }

        /* Actions area — buttons fully contained, no overflow */
        .mobile-actions{
          display:flex; flex-direction:column; gap:.5rem; padding: 10px 8px 12px;
        }
        .mobile-actions .btn{
          justify-content:center;
          width:100%;
          border-radius:14px;
          padding:.75rem 1rem;
          box-sizing: border-box; /* prevents horizontal bleed */
        }
        /* Hard containment & reset for any cloned/slotted actions */
        .mobile-extra-actions a,
        .mobile-extra-actions button{
          position: static !important;
          float: none !important;
          display: inline-flex !important;
          align-items: center; justify-content: center;
          width: 100% !important; max-width: 100% !important;
          margin: 0 !important; inset: auto !important;
          box-sizing: border-box !important; /* ensure no bleed */
          border-radius: 14px !important;
          padding: .75rem 1rem !important;
          text-align: center !important;
          white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }

        /* Close button in sheet: absolutely no outline/background */
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

        /* ===== ONXPro THEME (page-scoped via theme="ONXPro" | "onxpro" | "pro") ===== */
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

        /* Desktop nav → white */
        :host([theme="ONXPro"]) .center .nav-link,
        :host([theme="onxpro"]) .center .nav-link,
        :host([theme="pro"]) .center .nav-link{
          background:none !important;
          -webkit-text-fill-color: initial !important;
          color:#fff !important;
          padding-bottom: 0 !important; /* ensure no extra offset in Pro theme */
        }
        :host([theme="ONXPro"]) .news-link,
        :host([theme="onxpro"]) .news-link,
        :host([theme="pro"]) .news-link{ color:#fff !important; }

        /* Download button → white bg, black text (desktop + mobile) */
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

        /* Hamburger lines → white on dark header */
        :host([theme="ONXPro"]) .hamburger,
        :host([theme="onxpro"]) .hamburger,
        :host([theme="pro"]) .hamburger{
          color:#fff;
        }

        @media (prefers-reduced-motion: reduce){
          .sheet, .backdrop, .hamburger .lines::before,
          .hamburger .lines::after, .hamburger .lines span { transition:none; }
        }

        /* =====================================================================
           LIGHT / INVERTED VARIANT (Built-in; works with [invert] OR *Light themes)
           - White header (flat + float)
           - Black nav/link text
           - Black buttons with white text
           - Black logo
           - No outline (no border, no box-shadow) on the header pill
           ===================================================================== */
        :host([invert]) .header-bar,
        :host([theme="ONXProLight"]) .header-bar,
        :host([theme="onxpro-light"]) .header-bar,
        :host([theme="pro-light"]) .header-bar{
          background:#ffffff !important;
          color:#0A0D10 !important;
          border:none !important;
          box-shadow:none !important;   /* no outline */
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
          box-shadow:none !important;   /* still no outline when floating */
        }

        /* Center nav (desktop) → black text */
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

        /* Buttons → black bg, white text (desktop + mobile) */
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

        /* Hamburger / icons → black */
        :host([invert]) .hamburger,
        :host([theme="ONXProLight"]) .hamburger,
        :host([theme="onxpro-light"]) .hamburger,
        :host([theme="pro-light"]) .hamburger{
          color:#0A0D10 !important;
        }

        /* Logo → solid black (no gradient, no animation) */
        :host([invert]) .logo-anim,
        :host([theme="ONXProLight"]) .logo-anim,
        :host([theme="onxpro-light"]) .logo-anim,
        :host([theme="pro-light"]) .logo-anim{
          background:#000000 !important;
          animation:none !important;
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
            <a href="/pricing.html" class="nav-link">Pricing</a>
            <!-- injected desktop links go here -->
            <span class="center-extra"></span>
            <!-- per-page slotted links still supported -->
            <slot name="nav"></slot>
          </nav>

          <!-- Right -->
          <div class="right-area">
            <!-- Desktop actions -->
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
      <div class="backdrop" part="backdrop" aria-hidden="true"></div>
      <div id="onxMobileMenu" class="sheet" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="sheet-inner">
          <div class="mobile-row">
            <div class="mobile-title">
              <span class="logo-anim" aria-hidden="true"></span>
              <!-- word "ONX" removed (logo only) -->
            </div>
            <button class="hamburger" type="button" aria-label="Close menu">
              <span class="lines"><span></span></span>
            </button>
          </div>

          <nav class="mobile-nav" aria-label="Mobile">
            <!-- built-in defaults -->
            <a class="mobile-link mobile-link--pro" href="/oc-pro.html">ONX Pro <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></a>
            <a class="mobile-link" href="/pricing.html">Pricing <svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg></a>
            <!-- injected mobile links -->
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

    // Cache important nodes
    this._btns = this._root.querySelectorAll(".hamburger");
    this._backdrop = this._root.querySelector(".backdrop");
    this._sheet = this._root.getElementById("onxMobileMenu");
    this._sheetInner = this._root.querySelector(".sheet-inner");
    this._toggleBtn = this._root.querySelector('.right-area .hamburger');

    // Events
    this._btns.forEach(b => b.addEventListener("click", this._toggleMobile));
    this._backdrop.addEventListener("click", () => this._toggleMobile(false), { passive: true });
    // Prevent background scrolling on iOS behind the sheet
    this._backdrop.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
    window.addEventListener("keydown", this._closeOnEsc);
    window.addEventListener("resize", this._onResize, { passive: true });

    // HARD-disable any scroll/pan inside the mobile sheet (no x/y movement)
    const blockScroll = (e) => { e.preventDefault(); };
    ["touchmove", "wheel"].forEach(evt => {
      this._sheet?.addEventListener(evt, blockScroll, { passive: false });
      this._sheetInner?.addEventListener(evt, blockScroll, { passive: false });
    });

    // Inject global-config links into desktop + mobile
    this._renderExtraLinks(ONX_HEADER_LINKS);

    // Clone slotted nav + actions into mobile panel
    this._cloneSlotted('nav');
    this._cloneSlotted('actions');

    // Scroll + initial state
    window.addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll();
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this._onScroll);
    window.removeEventListener("keydown", this._closeOnEsc);
    window.removeEventListener("resize", this._onResize);
    if (this._btns) this._btns.forEach(b => b.removeEventListener("click", this._toggleMobile));
    if (this._backdrop) this._backdrop.removeEventListener("click", this._toggleMobile);
  }

  /* ===== Inject global-config links ===== */
  _renderExtraLinks(list = []) {
    if (!Array.isArray(list) || !list.length) return;

    const centerExtra = this._root.querySelector('.center-extra');
    const mobileExtra = this._root.querySelector('.mobile-extra');
    if (!centerExtra || !mobileExtra) return;

    // Clear previous (in case of re-connect)
    centerExtra.innerHTML = '';
    mobileExtra.innerHTML = '';

    list.forEach(item => {
      if (!item || !item.label || !item.href) return;

      // Desktop link
      const a = document.createElement('a');
      a.className = 'nav-link' + (item.black ? ' nav-link--black' : '') + (item.pro ? ' nav-link--pro' : '');
      a.href = item.href;
      a.textContent = item.label;
      centerExtra.appendChild(a);

      // Mobile link
      const m = document.createElement('a');
      m.className = 'mobile-link' + (item.pro ? ' mobile-link--pro' : '');
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

  /* ===== Cloning (nav & actions) into the mobile sheet ===== */
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
      // Do not clear here—preserve global-config links; append slotted after them
      assigned.forEach(node => {
        if (!(node instanceof HTMLAnchorElement)) return;
        const a = document.createElement('a');
        a.className = 'mobile-link';
        a.href = node.getAttribute('href') || '#';
        a.textContent = (node.textContent || '').trim();
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

        // Also mirror slotted links into desktop after the injected ones
        const centerExtra = this._root.querySelector('.center-extra');
        if (centerExtra) {
          const d = node.cloneNode(true);
          // normalize class
          if (!d.classList.contains('nav-link')) d.classList.add('nav-link');
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

    // Lock background scroll (html/body) when open
    document.documentElement.style.overflow = open ? 'hidden' : '';
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.style.touchAction = open ? 'none' : '';

    if (open){
      // Save previous focus and trap focus inside sheet
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
    // Auto-close menu on desktop to avoid scroll/overflow lock getting stuck
    if (window.matchMedia('(min-width: 768px)').matches) this._toggleMobile(false);
  }

  _onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (y > this._threshold) this.classList.add("is-float");
    else this.classList.remove("is-float");
  }
}

customElements.define("onx-header", ONXHeader);
