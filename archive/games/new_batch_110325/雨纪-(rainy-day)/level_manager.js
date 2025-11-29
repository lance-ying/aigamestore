// level_manager.js - Level generation and management

import {
  Girl, Lantern, Stele, Crystal, Platform, LightSwitch, Robot, Core, Exit, Terrain
} from './entities.js';
import { WATER_LEVEL_HIGH, WATER_LEVEL_MID, WATER_LEVEL_LOW, WATER_LEVEL_NONE } from './globals.js';

export class LevelManager {
  constructor() {
    this.levels = this.createLevels();
  }

  createLevels() {
    const levels = [];

    // Level 1 - Tutorial: Learn basic movement and light activation
    // Goal: Move to lantern, activate it to lower water, reach exit
    levels.push({
      number: 1,
      name: "First Light",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 3 },
      entities: [
        { type: 'terrain', x: 2, y: 3, height: 3 }, // Start position (high ground)
        { type: 'terrain', x: 3, y: 3, height: 1 },
        { type: 'lantern', x: 4, y: 3, reduces: WATER_LEVEL_MID }, // First light
        { type: 'terrain', x: 5, y: 3, height: 1 },
        { type: 'terrain', x: 6, y: 3, height: 0 }, // Needs lower water
        { type: 'terrain', x: 7, y: 3, height: 0 },
        { type: 'core', x: 6, y: 3 },
        { type: 'exit', x: 8, y: 3 }
      ]
    });

    // Level 2 - Two lights needed
    // Goal: Activate both lights to progressively lower water
    levels.push({
      number: 2,
      name: "Double Illumination",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 3 },
      entities: [
        { type: 'terrain', x: 2, y: 3, height: 3 },
        { type: 'terrain', x: 3, y: 3, height: 1 },
        { type: 'lantern', x: 3, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'terrain', x: 4, y: 3, height: 1 },
        { type: 'terrain', x: 4, y: 4, height: 1 },
        { type: 'stele', x: 4, y: 4, reduces: WATER_LEVEL_LOW },
        { type: 'terrain', x: 5, y: 4, height: 0 },
        { type: 'terrain', x: 6, y: 4, height: 0 },
        { type: 'core', x: 5, y: 4 },
        { type: 'exit', x: 7, y: 4 }
      ]
    });

    // Level 3 - Path choice
    // Goal: Choose which light to activate first, explore branching paths
    levels.push({
      number: 3,
      name: "Branching Waters",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 3 },
      entities: [
        { type: 'terrain', x: 2, y: 3, height: 3 },
        { type: 'terrain', x: 3, y: 3, height: 1 },
        { type: 'terrain', x: 3, y: 2, height: 1 },
        { type: 'terrain', x: 3, y: 4, height: 1 },
        { type: 'lantern', x: 3, y: 2, reduces: WATER_LEVEL_MID },
        { type: 'lantern', x: 3, y: 4, reduces: WATER_LEVEL_MID },
        { type: 'terrain', x: 4, y: 2, height: 0 },
        { type: 'terrain', x: 4, y: 4, height: 0 },
        { type: 'core', x: 4, y: 2 },
        { type: 'core', x: 4, y: 4 },
        { type: 'terrain', x: 5, y: 3, height: 0 },
        { type: 'stele', x: 5, y: 3, reduces: WATER_LEVEL_LOW },
        { type: 'terrain', x: 6, y: 3, height: 0 },
        { type: 'terrain', x: 7, y: 3, height: 0 },
        { type: 'exit', x: 8, y: 3 }
      ]
    });

    // Level 4 - Island hopping
    // Goal: Navigate between elevated areas, activate lights strategically
    levels.push({
      number: 4,
      name: "Island Chain",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 2 },
      entities: [
        { type: 'terrain', x: 2, y: 2, height: 3 },
        { type: 'terrain', x: 3, y: 2, height: 1 },
        { type: 'lantern', x: 3, y: 2, reduces: WATER_LEVEL_MID },
        { type: 'terrain', x: 4, y: 2, height: 1 },
        { type: 'terrain', x: 4, y: 3, height: 1 },
        { type: 'stele', x: 4, y: 3, reduces: WATER_LEVEL_LOW },
        { type: 'terrain', x: 5, y: 3, height: 0 },
        { type: 'terrain', x: 5, y: 4, height: 0 },
        { type: 'crystal', x: 5, y: 4, reduces: WATER_LEVEL_NONE },
        { type: 'terrain', x: 6, y: 4, height: 0 },
        { type: 'core', x: 5, y: 3 },
        { type: 'core', x: 6, y: 4 },
        { type: 'terrain', x: 7, y: 4, height: 0 },
        { type: 'robot', x: 7, y: 4 },
        { type: 'terrain', x: 8, y: 4, height: 0 },
        { type: 'exit', x: 8, y: 4 }
      ]
    });

    // Level 5 - The maze
    // Goal: Navigate a flooded maze, find the right sequence of lights
    levels.push({
      number: 5,
      name: "Flooded Maze",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 1, y: 1 },
      entities: [
        { type: 'terrain', x: 1, y: 1, height: 3 },
        { type: 'terrain', x: 2, y: 1, height: 1 },
        { type: 'terrain', x: 3, y: 1, height: 1 },
        { type: 'lantern', x: 3, y: 1, reduces: WATER_LEVEL_MID },
        { type: 'terrain', x: 3, y: 2, height: 1 },
        { type: 'terrain', x: 3, y: 3, height: 0 },
        { type: 'core', x: 3, y: 3 },
        { type: 'terrain', x: 4, y: 3, height: 0 },
        { type: 'stele', x: 4, y: 3, reduces: WATER_LEVEL_LOW },
        { type: 'terrain', x: 5, y: 3, height: 0 },
        { type: 'terrain', x: 5, y: 2, height: 0 },
        { type: 'terrain', x: 6, y: 2, height: 0 },
        { type: 'core', x: 6, y: 2 },
        { type: 'terrain', x: 7, y: 2, height: 0 },
        { type: 'crystal', x: 7, y: 2, reduces: WATER_LEVEL_NONE },
        { type: 'terrain', x: 7, y: 3, height: 0 },
        { type: 'terrain', x: 8, y: 3, height: 0 },
        { type: 'robot', x: 8, y: 3 },
        { type: 'terrain', x: 8, y: 4, height: 0 },
        { type: 'exit', x: 8, y: 4 }
      ]
    });

    // Level 6 - Multi-level puzzle
    // Goal: Multiple heights, need all lights to reach highest areas
    levels.push({
      number: 6,
      name: "Ascending Tides",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 4 },
      entities: [
        { type: 'terrain', x: 2, y: 4, height: 3 },
        { type: 'terrain', x: 3, y: 4, height: 1 },
        { type: 'lantern', x: 3, y: 4, reduces: WATER_LEVEL_MID },
        { type: 'terrain', x: 4, y: 4, height: 1 },
        { type: 'terrain', x: 4, y: 3, height: 0 },
        { type: 'terrain', x: 5, y: 3, height: 0 },
        { type: 'stele', x: 5, y: 3, reduces: WATER_LEVEL_LOW },
        { type: 'terrain', x: 6, y: 3, height: 0 },
        { type: 'core', x: 4, y: 3 },
        { type: 'core', x: 6, y: 3 },
        { type: 'terrain', x: 6, y: 2, height: 0 },
        { type: 'terrain', x: 7, y: 2, height: 0 },
        { type: 'crystal', x: 7, y: 2, reduces: WATER_LEVEL_NONE },
        { type: 'terrain', x: 7, y: 3, height: 0 },
        { type: 'robot', x: 7, y: 3 },
        { type: 'terrain', x: 8, y: 3, height: 0 },
        { type: 'terrain', x: 8, y: 4, height: 0 },
        { type: 'exit', x: 8, y: 4 }
      ]
    });

    // Level 7 - Return journey
    // Goal: Backtrack after activating distant lights
    levels.push({
      number: 7,
      name: "Return Path",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 3 },
      entities: [
        { type: 'terrain', x: 2, y: 3, height: 3 },
        { type: 'terrain', x: 3, y: 3, height: 1 },
        { type: 'lantern', x: 3, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'terrain', x: 4, y: 3, height: 1 },
        { type: 'terrain', x: 5, y: 3, height: 0 },
        { type: 'stele', x: 5, y: 3, reduces: WATER_LEVEL_LOW },
        { type: 'terrain', x: 6, y: 3, height: 0 },
        { type: 'terrain', x: 7, y: 3, height: 0 },
        { type: 'crystal', x: 7, y: 3, reduces: WATER_LEVEL_NONE },
        { type: 'terrain', x: 7, y: 4, height: 0 },
        { type: 'core', x: 7, y: 4 },
        { type: 'terrain', x: 6, y: 4, height: 0 },
        { type: 'core', x: 6, y: 4 },
        { type: 'terrain', x: 5, y: 4, height: 0 },
        { type: 'robot', x: 5, y: 4 },
        { type: 'terrain', x: 4, y: 4, height: 0 },
        { type: 'terrain', x: 3, y: 4, height: 0 },
        { type: 'terrain', x: 2, y: 4, height: 0 },
        { type: 'exit', x: 2, y: 5 }
      ]
    });

    // Level 8 - Complex interconnections
    // Goal: Multi-path puzzle with strategic choices
    levels.push({
      number: 8,
      name: "Crossroads",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 5, y: 3 },
      entities: [
        { type: 'terrain', x: 5, y: 3, height: 3 },
        { type: 'terrain', x: 4, y: 3, height: 1 },
        { type: 'terrain', x: 6, y: 3, height: 1 },
        { type: 'terrain', x: 5, y: 2, height: 1 },
        { type: 'terrain', x: 5, y: 4, height: 1 },
        { type: 'lantern', x: 4, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'lantern', x: 6, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'terrain', x: 3, y: 3, height: 0 },
        { type: 'terrain', x: 7, y: 3, height: 0 },
        { type: 'stele', x: 5, y: 2, reduces: WATER_LEVEL_LOW },
        { type: 'stele', x: 5, y: 4, reduces: WATER_LEVEL_LOW },
        { type: 'terrain', x: 5, y: 1, height: 0 },
        { type: 'terrain', x: 5, y: 5, height: 0 },
        { type: 'core', x: 3, y: 3 },
        { type: 'core', x: 7, y: 3 },
        { type: 'core', x: 5, y: 1 },
        { type: 'terrain', x: 2, y: 3, height: 0 },
        { type: 'crystal', x: 2, y: 3, reduces: WATER_LEVEL_NONE },
        { type: 'terrain', x: 1, y: 3, height: 0 },
        { type: 'robot', x: 1, y: 3 },
        { type: 'terrain', x: 8, y: 3, height: 0 },
        { type: 'exit', x: 8, y: 3 }
      ]
    });

    // Level 9 - Final challenge
    // Goal: Large complex level using all mechanics
    levels.push({
      number: 9,
      name: "Rainy Day's End",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 1, y: 3 },
      entities: [
        { type: 'terrain', x: 1, y: 3, height: 3 },
        { type: 'terrain', x: 2, y: 3, height: 1 },
        { type: 'lantern', x: 2, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'terrain', x: 3, y: 3, height: 1 },
        { type: 'terrain', x: 3, y: 2, height: 0 },
        { type: 'terrain', x: 4, y: 2, height: 0 },
        { type: 'stele', x: 4, y: 2, reduces: WATER_LEVEL_LOW },
        { type: 'terrain', x: 5, y: 2, height: 0 },
        { type: 'core', x: 3, y: 2 },
        { type: 'core', x: 5, y: 2 },
        { type: 'terrain', x: 3, y: 4, height: 0 },
        { type: 'terrain', x: 4, y: 4, height: 0 },
        { type: 'stele', x: 4, y: 4, reduces: WATER_LEVEL_LOW },
        { type: 'terrain', x: 5, y: 4, height: 0 },
        { type: 'core', x: 3, y: 4 },
        { type: 'core', x: 5, y: 4 },
        { type: 'terrain', x: 5, y: 3, height: 0 },
        { type: 'terrain', x: 6, y: 3, height: 0 },
        { type: 'crystal', x: 6, y: 3, reduces: WATER_LEVEL_NONE },
        { type: 'terrain', x: 6, y: 2, height: 0 },
        { type: 'robot', x: 6, y: 2 },
        { type: 'terrain', x: 6, y: 4, height: 0 },
        { type: 'robot', x: 6, y: 4 },
        { type: 'terrain', x: 7, y: 3, height: 0 },
        { type: 'terrain', x: 8, y: 3, height: 0 },
        { type: 'terrain', x: 9, y: 3, height: 0 },
        { type: 'exit', x: 9, y: 3 }
      ]
    });

    return levels;
  }

  loadLevel(levelNumber, gameState) {
    const levelData = this.levels[levelNumber - 1];
    if (!levelData) return false;

    // Clear existing entities
    gameState.entities = [];
    gameState.waterLevel = levelData.initialWater;
    gameState.currentLevel = levelNumber;
    gameState.moves = 0;
    gameState.collectedCores = 0;
    gameState.activatedRobots = 0;
    gameState.levelComplete = false;

    // Count cores and robots
    gameState.totalCores = levelData.entities.filter(e => e.type === 'core').length;
    gameState.totalRobots = levelData.entities.filter(e => e.type === 'robot').length;

    // Create terrain first
    for (const entityData of levelData.entities) {
      if (entityData.type === 'terrain') {
        const terrain = new Terrain(entityData.x, entityData.y, entityData.height);
        gameState.entities.push(terrain);
      }
    }

    // Create player
    const player = new Girl(levelData.playerStart.x, levelData.playerStart.y);
    gameState.player = player;
    gameState.entities.push(player);

    // Create other entities
    for (const entityData of levelData.entities) {
      if (entityData.type === 'terrain') continue;
      
      let entity;
      switch (entityData.type) {
        case 'lantern':
          entity = new Lantern(entityData.x, entityData.y);
          entity.waterReduction = entityData.reduces;
          break;
        case 'stele':
          entity = new Stele(entityData.x, entityData.y);
          entity.waterReduction = entityData.reduces;
          break;
        case 'crystal':
          entity = new Crystal(entityData.x, entityData.y);
          entity.waterReduction = entityData.reduces;
          break;
        case 'platform':
          entity = new Platform(entityData.x, entityData.y, entityData.targetX, entityData.targetY);
          entity.waterReduction = entityData.reduces;
          break;
        case 'robot':
          entity = new Robot(entityData.x, entityData.y);
          break;
        case 'core':
          entity = new Core(entityData.x, entityData.y);
          break;
        case 'exit':
          entity = new Exit(entityData.x, entityData.y);
          break;
        default:
          continue;
      }
      gameState.entities.push(entity);
    }

    return true;
  }

  getCurrentLevelData(gameState) {
    return this.levels[gameState.currentLevel - 1];
  }
}