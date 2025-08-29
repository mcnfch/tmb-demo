declare global {
  interface Window {
    G2Plot?: any;
    __g2plotReady?: Promise<boolean>;
  }
}

export function ensureG2Plot(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.G2Plot) return Promise.resolve(true);
  if (window.__g2plotReady) return window.__g2plotReady;

  window.__g2plotReady = new Promise<boolean>((resolve) => {
    const add = (src: string) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve(!!window.G2Plot);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
    };
    // Try jsDelivr first, then unpkg
    add("https://cdn.jsdelivr.net/npm/@antv/g2plot@latest/dist/g2plot.min.js");
    setTimeout(() => {
      if (!window.G2Plot) {
        add("https://unpkg.com/@antv/g2plot@latest/dist/g2plot.min.js");
      }
    }, 1200);
  });

  return window.__g2plotReady;
}

