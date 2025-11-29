// levels.js - Level definitions
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export const levels = [
  {
    // Level 0 - Tutorial
    id: 0,
    name: "First Steps",
    platforms: [
      { x: 50, y: 350, width: 150, height: 30 },
      { x: 280, y: 350, width: 150, height: 30 },
      { x: 480, y: 280, width: 100, height: 30 }
    ],
    citizenStartPositions: [
      { x: 100, y: 320 },
      { x: 120, y: 320 },
      { x: 140, y: 320 },
      { x: 100, y: 300 },
      { x: 120, y: 300 }
    ],
    staffStart: { x: 100, y: 320 },
    exitPortal: { x: 530, y: 250 },
    minCitizensToWin: 4
  },
  {
    // Level 1 - Simple gap
    id: 1,
    name: "The Gap",
    platforms: [
      { x: 30, y: 350, width: 180, height: 30 },
      { x: 350, y: 350, width: 220, height: 30 }
    ],
    citizenStartPositions: [
      { x: 80, y: 320 },
      { x: 100, y: 320 },
      { x: 120, y: 320 },
      { x: 140, y: 320 },
      { x: 160, y: 320 },
      { x: 80, y: 300 },
      { x: 100, y: 300 }
    ],
    staffStart: { x: 120, y: 320 },
    exitPortal: { x: 520, y: 320 },
    minCitizensToWin: 5
  },
  {
    // Level 2 - Two gaps
    id: 2,
    name: "Double Trouble",
    platforms: [
      { x: 20, y: 360, width: 120, height: 30 },
      { x: 220, y: 360, width: 100, height: 30 },
      { x: 400, y: 360, width: 180, height: 30 }
    ],
    citizenStartPositions: [
      { x: 60, y: 330 },
      { x: 80, y: 330 },
      { x: 100, y: 330 },
      { x: 60, y: 310 },
      { x: 80, y: 310 },
      { x: 100, y: 310 },
      { x: 60, y: 290 },
      { x: 80, y: 290 },
      { x: 100, y: 290 }
    ],
    staffStart: { x: 80, y: 330 },
    exitPortal: { x: 520, y: 330 },
    minCitizensToWin: 6
  }
];

export function getLevel(levelIndex) {
  if (levelIndex >= 0 && levelIndex < levels.length) {
    return levels[levelIndex];
  }
  return levels[0];
}