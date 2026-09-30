export const motion = {
  duration: { micro: 0.22, interface: 0.4, reveal: 0.85, morph: 1.65 },
  ease: 'power3.out',
  morphEase: 'power3.inOut',
  pixelRatio: { desktop: 1.5, mobile: 1.25 },
  pointerAmplitude: 0.12,
  revealDistance: 34,
} as const;
export type MotionPreference = 'auto' | 'reduced' | 'off';
export function getMotion(): MotionPreference {
  return (document.documentElement.dataset.motion as MotionPreference) || 'reduced';
}
