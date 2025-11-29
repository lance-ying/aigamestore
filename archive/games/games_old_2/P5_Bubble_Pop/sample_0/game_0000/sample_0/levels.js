// levels.js - Level configurations

import { BUBBLE_COLORS, ROCK_COLOR } from './globals.js';

export const levels = [
  {
    level: 1,
    name: "The Basics",
    rows: 4,
    cols: 6,
    shots: 20,
    colors: 3,
    layout: null, // null means random layout
    descendRate: 0, // no descending
    description: "Learn the basics!"
  },
  {
    level: 2,
    name: "First Obstacles",
    rows: 5,
    cols: 7,
    shots: 25,
    colors: 4,
    layout: "pyramid", // special layout
    descendRate: 0,
    description: "Watch out for rocks!"
  },
  {
    level: 3,
    name: "Strategic Pressure",
    rows: 6,
    cols: 8,
    shots: 28,
    colors: 5,
    layout: "complex",
    descendRate: 5, // descend every 5 shots
    description: "The ceiling descends!"
  },
  {
    level: 4,
    name: "Advanced Tactics",
    rows: 7,
    cols: 9,
    shots: 30,
    colors: 5,
    layout: "advanced",
    descendRate: 3, // descend every 3 shots
    description: "Master your skills!"
  }
];

export function generateLevelLayout(levelData, p) {
  const grid = [];
  const { rows, cols, colors, layout } = levelData;
  
  for (let row = 0; row < rows; row++) {
    grid[row] = [];
    for (let col = 0; col < cols; col++) {
      let bubble = null;
      
      if (layout === "pyramid") {
        // Pyramid with center removed
        if (row < 3 || Math.abs(col - cols / 2) > 1) {
          bubble = {
            color: getRandomColor(colors, p),
            type: "normal"
          };
        }
        // Add some rocks
        if (row === 2 && col === Math.floor(cols / 2)) {
          bubble = {
            color: ROCK_COLOR,
            type: "rock"
          };
        }
      } else if (layout === "complex") {
        // T-shape with pockets
        if (row < 2 || (row >= 2 && Math.abs(col - cols / 2) <= 1)) {
          bubble = {
            color: getRandomColor(colors, p),
            type: "normal"
          };
        }
        // Add rocks strategically
        if ((row === 3 && col === Math.floor(cols / 2)) || 
            (row === 1 && (col === 1 || col === cols - 2))) {
          bubble = {
            color: ROCK_COLOR,
            type: "rock"
          };
        }
      } else if (layout === "advanced") {
        // Complex pattern with isolated sections
        const centerDist = Math.abs(col - cols / 2);
        if (row < 4 || centerDist > 2 || (row === 4 && centerDist === 0)) {
          bubble = {
            color: getRandomColor(colors, p),
            type: "normal"
          };
        }
        // More rocks
        if ((row === 2 && col % 3 === 0) || (row === 5 && col === Math.floor(cols / 2))) {
          bubble = {
            color: ROCK_COLOR,
            type: "rock"
          };
        }
      } else {
        // Default random layout
        bubble = {
          color: getRandomColor(colors, p),
          type: "normal"
        };
      }
      
      grid[row][col] = bubble;
    }
  }
  
  return grid;
}

function getRandomColor(numColors, p) {
  const availableColors = BUBBLE_COLORS.slice(0, numColors);
  return availableColors[Math.floor(p.random(availableColors.length))];
}