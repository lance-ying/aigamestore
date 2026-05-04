// utils.js - Utility functions
import { ARENA_CENTER_X, ARENA_CENTER_Y, ARENA_RADIUS } from './globals.js';

export function isInsideArena(x, y) {
  const dx = x - ARENA_CENTER_X;
  const dy = y - ARENA_CENTER_Y;
  const distFromCenter = Math.sqrt(dx * dx + dy * dy);
  return distFromCenter < ARENA_RADIUS;
}

export function getDistanceFromCenter(x, y) {
  const dx = x - ARENA_CENTER_X;
  const dy = y - ARENA_CENTER_Y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clampToArena(x, y) {
  const dx = x - ARENA_CENTER_X;
  const dy = y - ARENA_CENTER_Y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist > ARENA_RADIUS - 5) {
    const angle = Math.atan2(dy, dx);
    return {
      x: ARENA_CENTER_X + Math.cos(angle) * (ARENA_RADIUS - 5),
      y: ARENA_CENTER_Y + Math.sin(angle) * (ARENA_RADIUS - 5)
    };
  }
  return { x, y };
}

export function randomPointInArena(p) {
  const angle = p.random(0, p.TWO_PI);
  const dist = p.random(0, ARENA_RADIUS - 20);
  return {
    x: ARENA_CENTER_X + Math.cos(angle) * dist,
    y: ARENA_CENTER_Y + Math.sin(angle) * dist
  };
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function normalizeAngle(angle) {
  while (angle < 0) angle += Math.PI * 2;
  while (angle > Math.PI * 2) angle -= Math.PI * 2;
  return angle;
}