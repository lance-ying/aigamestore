// levels.js - Level configurations
import { DOT_COLORS } from './globals.js';

export const LEVEL_CONFIGS = [
  // EASY LEVELS (2)
  {
    level: 1,
    gridRows: 8,
    gridCols: 8,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW],
    movesLimit: 30,
    objectives: {
      red: { target: 20, current: 0, description: "Clear 20 Red dots" },
      blue: { target: 20, current: 0, description: "Clear 20 Blue dots" }
    },
    anchors: 0
  },
  {
    level: 2,
    gridRows: 8,
    gridCols: 8,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW],
    movesLimit: 35,
    objectives: {
      green: { target: 20, current: 0, description: "Clear 20 Green dots" },
      yellow: { target: 20, current: 0, description: "Clear 20 Yellow dots" }
    },
    anchors: 0
  },
  // MEDIUM LEVELS (2)
  {
    level: 3,
    gridRows: 9,
    gridCols: 9,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE],
    movesLimit: 40,
    objectives: {
      purple: { target: 25, current: 0, description: "Clear 25 Purple dots" },
      red: { target: 25, current: 0, description: "Clear 25 Red dots" }
    },
    anchors: 0
  },
  {
    level: 4,
    gridRows: 9,
    gridCols: 9,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE],
    movesLimit: 45,
    objectives: {
      anchor: { target: 3, current: 0, description: "Drop 3 Anchors to bottom" },
      blue: { target: 30, current: 0, description: "Clear 30 Blue dots" }
    },
    anchors: 3
  },
  // HARD LEVELS (2)
  {
    level: 5,
    gridRows: 10,
    gridCols: 10,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 50,
    objectives: {
      anchor: { target: 5, current: 0, description: "Drop 5 Anchors to bottom" },
      orange: { target: 25, current: 0, description: "Clear 25 Orange dots" }
    },
    anchors: 5
  },
  {
    level: 6,
    gridRows: 10,
    gridCols: 10,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 60,
    objectives: {
      red: { target: 30, current: 0, description: "Clear 30 Red dots" },
      green: { target: 30, current: 0, description: "Clear 30 Green dots" },
      blue: { target: 30, current: 0, description: "Clear 30 Blue dots" }
    },
    anchors: 0
  }
];

export function getLevelConfig(level) {
  return LEVEL_CONFIGS[level - 1] || LEVEL_CONFIGS[0];
}

export function getColorName(colorArray) {
  const colorStr = colorArray.join(',');
  const entries = Object.entries(DOT_COLORS);
  for (let [name, color] of entries) {
    if (color.join(',') === colorStr) {
      return name.toLowerCase();
    }
  }
  return 'unknown';
}