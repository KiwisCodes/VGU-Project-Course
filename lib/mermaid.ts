'use client';

// Dynamic client-side loader and renderer for Mermaid diagrams
let mermaidLoadingPromise: Promise<any> | null = null;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function loadMermaid(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  
  if ((window as any).mermaid) {
    return Promise.resolve((window as any).mermaid);
  }
  
  if (mermaidLoadingPromise) {
    return mermaidLoadingPromise;
  }

  mermaidLoadingPromise = new Promise((resolve) => {
    const existing = document.getElementById('mermaid-cdn-script');
    if (existing) {
      if ((window as any).mermaid) {
        resolve((window as any).mermaid);
      } else {
        existing.addEventListener('load', () => resolve((window as any).mermaid));
        existing.addEventListener('error', () => resolve(null));
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'mermaid-cdn-script';
    script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).mermaid) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        try {
          (window as any).mermaid.initialize({
            startOnLoad: false,
            theme: isDark ? 'dark' : 'neutral',
            securityLevel: 'loose',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          });
        } catch (e) {}
        resolve((window as any).mermaid);
      } else {
        resolve(null);
      }
    };
    script.onerror = () => {
      console.warn('Failed to load Mermaid CDN script');
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return mermaidLoadingPromise;
}

export async function renderAllMermaidDiagrams(rootElement: HTMLElement | null) {
  if (!rootElement || typeof window === 'undefined') return;
  const containers = rootElement.querySelectorAll<HTMLElement>('.mermaid-container');
  if (containers.length === 0) return;

  const mermaid = await loadMermaid();
  if (!mermaid) {
    containers.forEach((c) => {
      const preview = c.querySelector<HTMLElement>('.mermaid-preview');
      const raw = c.querySelector<HTMLElement>('.mermaid-raw');
      if (preview && raw && !preview.querySelector('svg')) {
        preview.innerHTML = `
          <div class="p-3 text-xs font-mono text-slate-400 bg-black/20 rounded w-full">
            <span class="text-purple-400 font-bold block mb-1">Mermaid Diagram (Offline / Loading):</span>
            <pre class="overflow-x-auto">${escapeHtml(raw.textContent || raw.innerText || '')}</pre>
          </div>
        `;
      }
    });
    return;
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  try {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'neutral',
      securityLevel: 'loose',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });
  } catch (e) {
    // Ignore reinitialization
  }

  for (let i = 0; i < containers.length; i++) {
    const container = containers[i];
    const preview = container.querySelector<HTMLElement>('.mermaid-preview');
    const raw = container.querySelector<HTMLElement>('.mermaid-raw');
    if (!preview || !raw) continue;

    const code = (raw.textContent || raw.innerText || '').trim();
    if (!code) continue;

    // Generate unique container ID
    const uniqueId = `mermaid-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
    try {
      const { svg } = await mermaid.render(uniqueId, code);
      preview.innerHTML = svg;
    } catch (err: any) {
      console.warn('Mermaid rendering notice:', err);
      // Clean up orphaned error DOM nodes created by mermaid.js
      const orphan1 = document.getElementById(uniqueId);
      if (orphan1) orphan1.remove();
      const orphan2 = document.getElementById(`d${uniqueId}`);
      if (orphan2) orphan2.remove();

      preview.innerHTML = `
        <div class="mermaid-error">
          <div class="font-bold mb-1">Diagram Formatting Notice</div>
          <div class="text-[11px] opacity-80">${err?.message || 'Check mermaid diagram syntax'}</div>
        </div>
      `;
    }
  }
}
