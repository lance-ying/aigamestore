// utils.js - Utility functions

import { gameState } from './globals.js';

// Math utilities
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

export function normalizeVector(x, y) {
  const length = Math.sqrt(x * x + y * y);
  if (length === 0) return { x: 0, y: 0 };
  return { x: x / length, y: y / length };
}

// Random utilities (deterministic with seed)
export function randomRange(min, max, p) {
  return p.random(min, max);
}

export function randomInt(min, max, p) {
  return Math.floor(p.random(min, max + 1));
}

export function randomChoice(array, p) {
  return array[Math.floor(p.random(array.length))];
}

// Color utilities
export function colorWithAlpha(color, alpha) {
  return [...color.slice(0, 3), alpha];
}

export function lerpColor(p, c1, c2, t) {
  const r = lerp(c1[0], c2[0], t);
  const g = lerp(c1[1], c2[1], t);
  const b = lerp(c1[2], c2[2], t);
  return [r, g, b];
}

// Camera utilities
export function screenToWorld(screenX, screenY) {
  return {
    x: screenX + gameState.cameraX,
    y: screenY + gameState.cameraY
  };
}

export function worldToScreen(worldX, worldY) {
  return {
    x: worldX - gameState.cameraX + gameState.cameraShakeX,
    y: worldY - gameState.cameraY + gameState.cameraShakeY
  };
}

export function isOnScreen(worldX, worldY, margin = 50) {
  const screen = worldToScreen(worldX, worldY);
  return (
    screen.x > -margin &&
    screen.x < 600 + margin &&
    screen.y > -margin &&
    screen.y < 400 + margin
  );
}

// Collision utilities
export function rectCollision(x1, y1, w1, h1, x2, y2, w2, h2) {
  return (
    x1 < x2 + w2 &&
    x1 + w1 > x2 &&
    y1 < y2 + h2 &&
    y1 + h1 > y2
  );
}

export function circleCollision(x1, y1, r1, x2, y2, r2) {
  const dist = distance(x1, y1, x2, y2);
  return dist < r1 + r2;
}

export function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

// Array utilities
export function shuffleArray(array, p) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(p.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function removeFromArray(array, item) {
  const index = array.indexOf(item);
  if (index > -1) {
    array.splice(index, 1);
    return true;
  }
  return false;
}

// Camera shake
export function addCameraShake(intensity) {
  gameState.cameraShakeIntensity = Math.max(
    gameState.cameraShakeIntensity,
    intensity
  );
}

export function updateCameraShake(p) {
  if (gameState.cameraShakeIntensity > 0) {
    gameState.cameraShakeX = p.random(-gameState.cameraShakeIntensity, gameState.cameraShakeIntensity);
    gameState.cameraShakeY = p.random(-gameState.cameraShakeIntensity, gameState.cameraShakeIntensity);
    gameState.cameraShakeIntensity *= 0.9;
    if (gameState.cameraShakeIntensity < 0.1) {
      gameState.cameraShakeIntensity = 0;
      gameState.cameraShakeX = 0;
      gameState.cameraShakeY = 0;
    }
  }
}