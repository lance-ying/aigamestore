// utils.js - Utility functions

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function normalize(x, y) {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomChoice(array, p) {
  return array[Math.floor(p.random(array.length))];
}

export function randomRange(min, max, p) {
  return p.random(min, max);
}