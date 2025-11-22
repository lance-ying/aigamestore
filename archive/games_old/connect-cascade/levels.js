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
  },
  {
    level: 6,
    gridRows: 8,
    gridCols: 8,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 30,
    objectives: {
      blue: { target: 30, current: 0, description: "Clear 30 Blue dots" },
      yellow: { target: 30, current: 0, description: "Clear 30 Yellow dots" },
      red: { target: 20, current: 0, description: "Clear 20 Red dots" }
    },
    anchors: 0
  },
  {
    level: 7,
    gridRows: 9,
    gridCols: 9,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 35,
    objectives: {
      anchor: { target: 4, current: 0, description: "Drop 4 Anchors to bottom" },
      purple: { target: 25, current: 0, description: "Clear 25 Purple dots" },
      orange: { target: 25, current: 0, description: "Clear 25 Orange dots" }
    },
    anchors: 4
  },
  {
    level: 8,
    gridRows: 9,
    gridCols: 9,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 32,
    objectives: {
      red: { target: 35, current: 0, description: "Clear 35 Red dots" },
      green: { target: 35, current: 0, description: "Clear 35 Green dots" },
      blue: { target: 35, current: 0, description: "Clear 35 Blue dots" }
    },
    anchors: 0
  },
  {
    level: 9,
    gridRows: 10,
    gridCols: 10,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 40,
    objectives: {
      anchor: { target: 6, current: 0, description: "Drop 6 Anchors to bottom" },
      yellow: { target: 30, current: 0, description: "Clear 30 Yellow dots" },
      purple: { target: 30, current: 0, description: "Clear 30 Purple dots" },
      orange: { target: 20, current: 0, description: "Clear 20 Orange dots" }
    },
    anchors: 6
  },
  {
    level: 10,
    gridRows: 10,
    gridCols: 10,
    colors: [DOT_COLORS.RED, DOT_COLORS.BLUE, DOT_COLORS.GREEN, DOT_COLORS.YELLOW, DOT_COLORS.PURPLE, DOT_COLORS.ORANGE],
    movesLimit: 45,
    objectives: {
      anchor: { target: 8, current: 0, description: "Drop 8 Anchors to bottom" },
      red: { target: 40, current: 0, description: "Clear 40 Red dots" },
      blue: { target: 40, current: 0, description: "Clear 40 Blue dots" },
      green: { target: 40, current: 0, description: "Clear 40 Green dots" }
    },
    anchors: 8
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