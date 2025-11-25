// utils.js - Utility functions

import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function lerp(start, end, amt) {
  return start + (end - start) * amt;
}

export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

export function wrapText(p, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let yOffset = 0;
  
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + ' ';
    const testWidth = p.textWidth(testLine);
    
    if (testWidth > maxWidth && i > 0) {
      p.text(line, x, y + yOffset);
      line = words[i] + ' ';
      yOffset += lineHeight;
    } else {
      line = testLine;
    }
  }
  p.text(line, x, y + yOffset);
}