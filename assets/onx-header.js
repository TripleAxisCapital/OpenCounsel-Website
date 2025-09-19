// /assets/onx-header.js
class ONXHeader extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._onScroll = this._onScroll.bind(this);
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
          /* Brand gradient tokens */
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
          --pill-outer-x-mobile: 35px;
          --pill-outer-x-desktop: 0px;
          --pill-height-mobile: 2.75rem;
          --pill-height-desktop: 3.5rem;

          --logo-pad-left-mobile: 12px;
          --logo-pad-left-desktop: 12px;
          --download-pad-right-mobile: 12px;
          --download-pad-right-desktop: 12px;

          --header-radius: 28px;
          --logo-size: 60px;

          position: sticky; top: 0; z-index: 50;
          display:block;
        }

        /* Reset link underlines inside header */
        a { text-decoration: none; color: inherit; }

        /* Accessibility helper — FIXES the duplicate “ONX” you saw */
        .sr-only {
          position: absolute !important;
          width: 1px; height: 1px;
          padding: 0; margin: -1px;
          overflow: hidden; clip: rect(0,0,0,0);
          white-space: nowrap; border: 0;
        }

        /* Gradient utilities */
        @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .g-grad, .grad-anim{
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
        }
        .grad-text{
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%;
          animation: gradientShift var(--speed,16s) ease-in-out infinite;
          -webkit-background-clip:text; background-clip:text;
          -webkit-text-fill-color: transparent; color: transparent;
        }

        /* Masked ONX logo (animated) */
        .logo-anim{
          display:inline-block; width: var(--logo-size); height: var(--logo-size);
          background: linear-gradient(var(--angle,135deg), var(--grad-from), var(--grad-via), var(--grad-to));
          background-size: 300% 300%; animation: gradientShift var(--speed,16s) ease-in-out infinite;
          -webkit-mask: url('/logo.svg') no-repeat center / contain; mask: url('/logo.svg') no-repeat center / contain;
        }

        /* Header shell */
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
          -webkit-backdrop-filter: none; backdrop-filter: none;
          transition:
            width .36s cubic-bezier(.2,.8,.2,1),
            background-color .36s ease,
            border-radius .36s cubic-bezier(.2,.8,.2,1),
            box-shadow .36s ease,
            -webkit-backdrop-filter .36s ease,
            backdrop-filter .36s ease;
        }

        .center{
          position:absolute; left:50%; transform:translateX(-50%);
          display:flex; align-items:center; gap:2rem;
          font-size:.875rem; font-weight:700; letter-spacing:-.01em;
        }

        .nav-link{ font-weight:700; letter-spacing:-.01em; }
        .logo-pad{ padding-left: var(--logo-pad-left-mobile); }
        .download-pad{ padding-right: var(--download-pad-right-mobile); display:flex; align-items:center; gap:1rem; }

        @media (min-width:768px){
          .header-bar{
            height: var(--pill-height-desktop);
            padding-left: var(--pill-inner-x-desktop); padding-right: var(--pill-inner-x-desktop);
          }
          .logo-pad{ padding-left: var(--logo-pad-left-desktop); }
          .download-pad{ padding-right: var(--download-pad-right-desktop); }
        }

        /* Float (pill) state toggled by JS */
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

        /* Right-side button + text link */
        .news-link{
          display:inline-flex; align-items:center; gap:.5rem;
          font-size:.875rem; font-weight:700; color:#0A0D10;
        }
        .news-link:hover{ opacity:.8; }

        .btn{
          display:inline-flex; align-items:center; gap:.5rem;
          color:#fff; font-size:.875rem; font-weight:700;
          border-radius: 16px; padding:.5rem 1rem;
          box-shadow: 0 18px 30px rgba(0,0,0,.2);
          transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease;
        }
        .btn:hover{ transform: translateY(-1px); box-shadow: 0 26px 40px rgba(0,0,0,.28); }
        .btn:active{ transform: translateY(0); }

        .icon{ width: 18px; height: 18px; display:inline-block; }

        /* --- Slots so you can add links/buttons without editing JS --- */
        ::slotted(a[slot="nav"]) {
          font-size:.875rem; font-weight:700; letter-spacing:-.01em;
          color:#2a5e5b;
        }
        ::slotted([slot="actions"]) {
          display:inline-flex; align-items:center; gap:.5rem;
        }
      </style>

      <div class="oc-header">
        <div class="header-bar">
          <!-- Left -->
          <div class="logo-pad" style="display:flex;align-items:center;gap:.75rem;">
            <a href="/index.html" aria-label="ONX home" style="display:inline-flex;align-items:center;">
              <span class="logo-anim" aria-hidden="true"></span>
              <span class="sr-only">ONX</span>
            </a>
          </div>

          <!-- Center -->
          <nav class="center" aria-label="Primary">
            <a href="/oc-pro.html" class="nav-link grad-text">ONX Pro</a>
            <a href="/models.html" class="nav-link" style="color:#2a5e5b;">Models</a>
            <slot name="nav"></slot>
          </nav>

          <!-- Right -->
          <div class="download-pad">
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
        </div>
      </div>
    `;

    window.addEventListener("scroll", this._onScroll, { passive: true });
    this._onScroll(); // initial
  }

  disconnectedCallback() {
    window.removeEventListener("scroll", this._onScroll);
  }

  _onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop || 0;
    if (y > this._threshold) this.classList.add("is-float");
    else this.classList.remove("is-float");
  }
}

customElements.define("onx-header", ONXHeader);
