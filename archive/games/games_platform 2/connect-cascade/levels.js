// levels.js - Level configurations
import { DOT_COLORS } from './globals.js';

export const LEVEL_CONFIGS = [
  {
    level: 1,
    gridRows: 6,
    gridCols: 6,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW],
    movesLimit: 20,
    objectives: {
      red: { target: 15, current: 0, description: "Clear 15 Red dots" },
      blue: { target: 15, current: 0, description: "Clear 15 Blue dots" }
    },
    anchors: 0
  },
  {
    level: 2,
    gridRows: 6,
    gridCols: 6,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE],
    movesLimit: 25,
    objectives: {
      green: { target: 20, current: 0, description: "Clear 20 Green dots" },
      purple: { target: 20, current: 0, description: "Clear 20 Purple dots" }
    },
    anchors: 0
  },
  {
    level: 3,
    gridRows: 7,
    gridCols: 7,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.ORANGE],
    movesLimit: 30,
    objectives: {
      anchor: { target: 3, current: 0, description: "Drop 3 Anchors to bottom" },
      yellow: { target: 10, current: 0, description: "Clear 10 Yellow dots" }
    },
    anchors: 3
  },
  {
    level: 4,
    gridRows: 7,
    gridCols: 7,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 25,
    objectives: {
      red: { target: 25, current: 0, description: "Clear 25 Red dots" },
      purple: { target: 25, current: 0, description: "Clear 25 Purple dots" }
    },
    anchors: 0
  },
  {
    level: 5,
    gridRows: 8,
    gridCols: 8,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 35,
    objectives: {
      anchor: { target: 5, current: 0, description: "Drop 5 Anchors to bottom" },
      orange: { target: 15, current: 0, description: "Clear 15 Orange dots" },
      green: { target: 15, current: 0, description: "Clear 15 Green dots" }
    },
    anchors: 5
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