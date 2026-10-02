// <l-i n="wallet" sm="1"> — ícono Lucide. Tamaño spacing/icono (o spacing/icono-pequeno con sm) y trazo icono/trazo. Decorativo: aria-hidden.
(function () {
  if (customElements.get('l-i')) return;
  const pascal = s => s.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
  const NS = 'http://www.w3.org/2000/svg';
  const CSS = ':host{display:inline-flex;flex:none;width:var(--spacing-icono);height:var(--spacing-icono);line-height:0}:host([sm]){width:var(--spacing-icono-pequeno);height:var(--spacing-icono-pequeno)}svg{width:100%;height:100%;stroke-width:var(--icono-trazo)}';
  class LI extends HTMLElement {
    static get observedAttributes() { return ['n']; }
    connectedCallback() { this.setAttribute('aria-hidden', 'true'); this.render(); }
    attributeChangedCallback() { this.render(); }
    render() {
      const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
      const lib = window.lucide;
      if (!lib || !lib.icons) {
        if (!root.firstChild) { const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st); }
        if (!LI.wait) { LI.wait = new Set(); const t = setInterval(() => { if (window.lucide) { clearInterval(t); const w = LI.wait; LI.wait = null; w.forEach(el => el.render()); } }, 80); }
        LI.wait.add(this); return;
      }
      let node = lib.icons[pascal(this.getAttribute('n') || 'circle')];
      const st = document.createElement('style'); st.textContent = CSS;
      if (!node) { root.replaceChildren(st); return; }
      if (node[0] === 'svg') node = node[2];
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24'); svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
      for (const [tag, attrs] of node) { const el = document.createElementNS(NS, tag); for (const k in attrs) el.setAttribute(k, attrs[k]); svg.appendChild(el); }
      root.replaceChildren(st, svg);
    }
  }
  customElements.define('l-i', LI);
})();
