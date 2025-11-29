// utils.js - Utility functions

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function isOnScreen(x, y, margin = 50) {
  return x > -margin && x < CANVAS_WIDTH + margin && 
         y > -margin && y < CANVAS_HEIGHT + margin;
}

export function angleToVector(angle) {
  const rad = angle * Math.PI / 180;
  return { x: Math.cos(rad), y: -Math.sin(rad) };
}

export function randomRange(min, max, p) {
  return p.random(min, max);
}