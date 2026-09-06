import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import innerGreenSource from './sources/inner-green-3d.html?raw';
import threeRuntime from './sources/inner-green-assets/three.min.js?raw';

/**
 * SylvaScene — package-free local port of the Sylva Living World scene-only entry.
 *
 * No dependency on `@designcodeio/threeui`. The authored document
 * (`sources/inner-green-3d.html`, byte-identical, SHA-256
 * 69c3694b…05e197) is reduced to its scene markup at build time and served
 * via `srcDoc` with `sandbox="allow-scripts"`; the local Three.js runtime
 * (`sources/inner-green-assets/three.min.js`) is inlined. No network request.
 *
 * Backdrop adaptations (host boundary only, authored scene untouched):
 * - pointerEvents 'none' so the page beneath stays fully usable. Time-based
 *   life (pollen drift, butterfly, sway, scan-light entrance) continues;
 *   pointer-driven moss BeamNG.Drive and camera parallax sleep while backdrop mode is on.
 * - `dim` prop tunes veil opacity for readability; the scrim lives in CSS.
 */

export const SYLVA_SCENE_VARIANTS = ['living-green'] as const;
export type SylvaSceneVariant = 'living-green';

export type SylvaSceneProps = {
  variant?: SylvaSceneVariant;
  className?: string;
  style?: CSSProperties;
  /** Veil opacity 0..1 over the scene for text readability. Default 0.55. */
  dim?: number;
};

const SCENE_ONLY_MARKUP = `<main class="hero" id="hero"><canvas id="scene" role="img" aria-label="Sylva Living Green"></canvas><div class="stage" id="stage" aria-hidden="true"></div></main>`;
const SCENE_ONLY_STYLE = `<style data-dreamscope-sylva-scene>html,body{width:100%!important;height:100%!important;min-height:0!important;margin:0!important;overflow:hidden!important}body{position:relative!important;background:#4a4d44!important}.hero{height:100%!important;min-height:0!important}#scene{pointer-events:auto!important}</style>`;

function buildSceneDocument(reducedMotion: boolean) {
  const presentationStart = innerGreenSource.indexOf('<main class="hero" id="hero">');
  const runtimeStart = innerGreenSource.indexOf('<script src="inner-green-assets/three.min.js"></script>');
  if (presentationStart < 0 || runtimeStart < 0 || runtimeStart <= presentationStart) {
    throw new Error('Sylva scene adapter could not isolate the authored Three.js scene.');
  }
  let source = `${innerGreenSource.slice(0, presentationStart)}${SCENE_ONLY_MARKUP}\n\n${innerGreenSource.slice(runtimeStart)}`
    .replace('</head>', `${SCENE_ONLY_STYLE}</head>`)
    .replace(
      '<script src="inner-green-assets/three.min.js"></script>',
      `<script data-dreamscope-three-runtime>${threeRuntime}</script>`,
    );
  if (reducedMotion) {
    source = source.replace(
      '(function loop() { requestAnimationFrame(loop); tick(); })();',
      '(function loop() { if (!REDUCED) requestAnimationFrame(loop); tick(); })();',
    );
  }
  return source;
}

export function SylvaScene({ className = '', style, dim = 0.55 }: SylvaSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [hostVisible, setHostVisible] = useState(true);
  const [documentVisible, setDocumentVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden,
  );
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setHostVisible(entry?.isIntersecting ?? true));
    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  const source = useMemo(() => buildSceneDocument(reducedMotion), [reducedMotion]);
  const mounted = hostVisible && documentVisible;
  useEffect(() => setReady(false), [mounted, reducedMotion]);

  return (
    <div
      ref={hostRef}
      className={`sylva-scene${className ? ` ${className}` : ''}`}
      role="img"
      aria-label="Living green dream-forest backdrop with ferns, flowers, pollen, and a butterfly"
      data-variant="living-green"
      data-state={ready ? 'ready' : 'loading'}
      style={{ background: '#4a4d44', pointerEvents: 'none', ...style }}
    >
      {mounted ? (
        <iframe
          key={reducedMotion ? 'reduced' : 'motion'}
          title="Sylva Living Green"
          srcDoc={source}
          sandbox="allow-scripts"
          loading="eager"
          onLoad={() => setReady(true)}
          style={{
            position: 'absolute', inset: 0, display: 'block',
            width: '100%', height: '100%', border: 0, background: '#4a4d44',
          }}
        />
      ) : null}
      <div className="sylva-scrim" aria-hidden="true" style={{ opacity: dim }} />
    </div>
  );
}
