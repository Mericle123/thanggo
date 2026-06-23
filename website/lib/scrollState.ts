// A tiny mutable singleton that bridges the DOM scroll world (Lenis / ScrollTrigger)
// and the R3F render loop. The <Canvas> lives in a separate React tree, so instead of
// threading props/state across it we publish scroll progress here and read it inside
// useFrame. Cheap, allocation-free, and avoids re-rendering the scene on every scroll.

export const scrollState = {
  progress: 0,   // 0..1 over the whole page
  velocity: 0,   // smoothed scroll velocity (for energy/wobble)
  width: 0,      // viewport width, so the scene can simplify on mobile
};

// Returns the active mode index (0=SP, 1=GP, 2=WILD) given overall progress,
// based on where the three pinned sections sit in the page. Tunable thresholds.
export function modeFromProgress(p: number): number {
  if (p < 0.30) return -1;      // hero / intro — neutral
  if (p < 0.46) return 0;       // SP
  if (p < 0.62) return 1;       // GP
  if (p < 0.78) return 2;       // WILD
  return -1;                    // showcase / cta — neutral
}
