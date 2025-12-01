// levels.js - Level configurations
import { DOT_COLORS } from './globals.js';

export const LEVEL_CONFIGS = [
  // EASY LEVELS (2)
  {
    level: 1,
    gridRows: 6,
    gridCols: 6,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW],
    movesLimit: 20,
    objectives: {
      red: { target: 12, current: 0, description: "Clear 12 Red dots" },
      blue: { target: 12, current: 0, description: "Clear 12 Blue dots" }
    },
    anchors: 0
  },
  {
    level: 2,
    gridRows: 6,
    gridCols: 6,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW],
    movesLimit: 22,
    objectives: {
      green: { target: 15, current: 0, description: "Clear 15 Green dots" },
      yellow: { target: 15, current: 0, description: "Clear 15 Yellow dots" }
    },
    anchors: 0
  },
  // MEDIUM LEVELS (2)
  {
    level: 3,
    gridRows: 7,
    gridCols: 7,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE],
    movesLimit: 25,
    objectives: {
      purple: { target: 20, current: 0, description: "Clear 20 Purple dots" },
      red: { target: 20, current: 0, description: "Clear 20 Red dots" }
    },
    anchors: 0
  },
  {
    level: 4,
    gridRows: 7,
    gridCols: 7,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE],
    movesLimit: 28,
    objectives: {
      anchor: { target: 2, current: 0, description: "Drop 2 Anchors to bottom" },
      blue: { target: 25, current: 0, description: "Clear 25 Blue dots" }
    },
    anchors: 2
  },
  // HARD LEVELS (2)
  {
    level: 5,
    gridRows: 8,
    gridCols: 8,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 30,
    objectives: {
      anchor: { target: 4, current: 0, description: "Drop 4 Anchors to bottom" },
      orange: { target: 20, current: 0, description: "Clear 20 Orange dots" }
    },
    anchors: 4
  },
  {
    level: 6,
    gridRows: 8,
    gridCols: 8,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 35,
    objectives: {
      red: { target: 25, current: 0, description: "Clear 25 Red dots" },
      green: { target: 25, current: 0, description: "Clear 25 Green dots" },
      blue: { target: 25, current: 0, description: "Clear 25 Blue dots" }
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