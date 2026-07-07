export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function easeInOutSine(value) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

export function getOpacityForTime(time) {
  if (time < 0.5) return 0;
  if (time < 1.5) return 0.12 + easeInOutSine((time - 0.5) / 1) * 0.12;
  if (time < 3.5) return 0.24 + easeInOutSine((time - 1.5) / 2) * 0.16;
  if (time < 6.5) return 0.4 + easeInOutSine((time - 3.5) / 3) * 0.2;
  return 0.6 + easeInOutSine((time - 6.5) / 4) * 0.2;
}

export function getCloudOffset(time) {
  return clamp((time - 4.5) / 6, 0, 1) * 18;
}

export function getWingSpread(time) {
  return clamp((time - 8.5) / 1, 0, 1) * 0.25;
}

export function getRevealProgress(time) {
  return clamp((time - 6.5) / 4, 0, 1);
}
