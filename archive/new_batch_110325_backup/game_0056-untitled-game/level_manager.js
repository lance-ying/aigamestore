// level_manager.js - Level generation and management

import {
  Girl, Lantern, Stele, Crystal, Platform, LightSwitch, Robot, Core, Exit
} from './entities.js';
import { WATER_LEVEL_HIGH, WATER_LEVEL_MID, WATER_LEVEL_LOW, WATER_LEVEL_NONE } from './globals.js';

export class LevelManager {
  constructor() {
    this.levels = this.createLevels();
  }

  createLevels() {
    const levels = [];

    // Level 1 - Tutorial: Basic movement and lantern activation
    levels.push({
      number: 1,
      name: "First Light",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 2 },
      entities: [
        { type: 'lantern', x: 4, y: 2, reduces: WATER_LEVEL_MID },
        { type: 'lantern', x: 6, y: 2, reduces: WATER_LEVEL_LOW },
        { type: 'core', x: 5, y: 3 },
        { type: 'exit', x: 8, y: 2 }
      ]
    });

    // Level 2 - Steles and multiple paths
    levels.push({
      number: 2,
      name: "Ancient Path",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 3 },
      entities: [
        { type: 'stele', x: 4, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'lantern', x: 4, y: 5, reduces: WATER_LEVEL_LOW },
        { type: 'core', x: 3, y: 4 },
        { type: 'core', x: 5, y: 4 },
        { type: 'robot', x: 6, y: 3 },
        { type: 'exit', x: 7, y: 5 }
      ]
    });

    // Level 3 - Crystals and reflection
    levels.push({
      number: 3,
      name: "Crystal Reflection",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 1, y: 2 },
      entities: [
        { type: 'lantern', x: 3, y: 2, reduces: WATER_LEVEL_MID },
        { type: 'crystal', x: 5, y: 2, reduces: WATER_LEVEL_LOW },
        { type: 'crystal', x: 5, y: 4, reduces: WATER_LEVEL_NONE },
        { type: 'core', x: 4, y: 3 },
        { type: 'core', x: 6, y: 3 },
        { type: 'robot', x: 7, y: 2 },
        { type: 'exit', x: 7, y: 4 }
      ]
    });

    // Level 4 - Platforms introduction
    levels.push({
      number: 4,
      name: "Moving Bridges",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 3 },
      entities: [
        { type: 'lantern', x: 3, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'platform', x: 5, y: 3, targetX: 5, targetY: 5, reduces: WATER_LEVEL_LOW },
        { type: 'stele', x: 5, y: 5, reduces: WATER_LEVEL_NONE },
        { type: 'core', x: 4, y: 4 },
        { type: 'core', x: 6, y: 4 },
        { type: 'robot', x: 5, y: 6 },
        { type: 'exit', x: 7, y: 5 }
      ]
    });

    // Level 5 - Light switches
    levels.push({
      number: 5,
      name: "Light Sensors",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 2 },
      entities: [
        { type: 'lantern', x: 3, y: 2, reduces: WATER_LEVEL_MID },
        { type: 'switch', x: 5, y: 2 },
        { type: 'platform', x: 6, y: 2, targetX: 6, targetY: 4, reduces: WATER_LEVEL_LOW, linkedTo: 'switch' },
        { type: 'core', x: 4, y: 3 },
        { type: 'core', x: 7, y: 3 },
        { type: 'robot', x: 6, y: 4 },
        { type: 'exit', x: 8, y: 4 }
      ]
    });

    // Level 6 - Complex chaining
    levels.push({
      number: 6,
      name: "Chain Reaction",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 1, y: 3 },
      entities: [
        { type: 'lantern', x: 2, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'crystal', x: 4, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'stele', x: 4, y: 5, reduces: WATER_LEVEL_LOW },
        { type: 'switch', x: 6, y: 4 },
        { type: 'crystal', x: 7, y: 4, reduces: WATER_LEVEL_NONE, linkedTo: 'switch' },
        { type: 'core', x: 3, y: 4 },
        { type: 'core', x: 5, y: 3 },
        { type: 'robot', x: 6, y: 5 },
        { type: 'robot', x: 8, y: 4 },
        { type: 'exit', x: 8, y: 5 }
      ]
    });

    // Level 7 - Multi-platform puzzle
    levels.push({
      number: 7,
      name: "Shifting Grounds",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 2, y: 2 },
      entities: [
        { type: 'stele', x: 3, y: 2, reduces: WATER_LEVEL_MID },
        { type: 'platform', x: 5, y: 2, targetX: 5, targetY: 4, reduces: WATER_LEVEL_LOW },
        { type: 'platform', x: 7, y: 3, targetX: 5, targetY: 3, reduces: WATER_LEVEL_LOW },
        { type: 'lantern', x: 5, y: 4, reduces: WATER_LEVEL_NONE },
        { type: 'core', x: 4, y: 3 },
        { type: 'core', x: 6, y: 2 },
        { type: 'core', x: 6, y: 4 },
        { type: 'robot', x: 7, y: 4 },
        { type: 'exit', x: 8, y: 4 }
      ]
    });

    // Level 8 - Advanced combination
    levels.push({
      number: 8,
      name: "Luminous Maze",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 1, y: 2 },
      entities: [
        { type: 'lantern', x: 2, y: 2, reduces: WATER_LEVEL_MID },
        { type: 'switch', x: 3, y: 3 },
        { type: 'crystal', x: 4, y: 2, reduces: WATER_LEVEL_LOW, linkedTo: 'switch' },
        { type: 'platform', x: 6, y: 2, targetX: 6, targetY: 4, reduces: WATER_LEVEL_LOW },
        { type: 'stele', x: 6, y: 4, reduces: WATER_LEVEL_NONE },
        { type: 'switch', x: 7, y: 3 },
        { type: 'crystal', x: 8, y: 4, reduces: WATER_LEVEL_NONE, linkedTo: 'switch' },
        { type: 'core', x: 3, y: 4 },
        { type: 'core', x: 5, y: 3 },
        { type: 'core', x: 7, y: 5 },
        { type: 'robot', x: 4, y: 4 },
        { type: 'robot', x: 8, y: 3 },
        { type: 'exit', x: 9, y: 4 }
      ]
    });

    // Level 9 - Final challenge
    levels.push({
      number: 9,
      name: "Rainy Day's End",
      initialWater: WATER_LEVEL_HIGH,
      playerStart: { x: 1, y: 3 },
      entities: [
        { type: 'lantern', x: 2, y: 3, reduces: WATER_LEVEL_MID },
        { type: 'stele', x: 3, y: 2, reduces: WATER_LEVEL_MID },
        { type: 'crystal', x: 4, y: 3, reduces: WATER_LEVEL_LOW },
        { type: 'switch', x: 5, y: 4 },
        { type: 'platform', x: 6, y: 3, targetX: 6, targetY: 5, reduces: WATER_LEVEL_LOW, linkedTo: 'switch' },
        { type: 'crystal', x: 7, y: 3, reduces: WATER_LEVEL_NONE },
        { type: 'stele', x: 6, y: 5, reduces: WATER_LEVEL_NONE },
        { type: 'lantern', x: 8, y: 4, reduces: WATER_LEVEL_NONE },
        { type: 'core', x: 3, y: 4 },
        { type: 'core', x: 5, y: 2 },
        { type: 'core', x: 7, y: 5 },
        { type: 'robot', x: 4, y: 5 },
        { type: 'robot', x: 8, y: 2 },
        { type: 'exit', x: 9, y: 4 }
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

    // Create player
    const player = new Girl(levelData.playerStart.x, levelData.playerStart.y);
    gameState.player = player;
    gameState.entities.push(player);

    // Count cores and robots
    gameState.totalCores = levelData.entities.filter(e => e.type === 'core').length;
    gameState.totalRobots = levelData.entities.filter(e => e.type === 'robot').length;

    // Create entities
    const entityMap = {};
    for (const entityData of levelData.entities) {
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
        case 'switch':
          entity = new LightSwitch(entityData.x, entityData.y);
          if (entityData.linkedTo) {
            entityMap[entityData.linkedTo] = entityMap[entityData.linkedTo] || [];
            entityMap[entityData.linkedTo].push(entity);
          }
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

    // Link switches to their targets
    for (const entity of gameState.entities) {
      if (entity.type === 'switch') {
        const switchEntities = entityMap['switch'] || [];
        for (const targetEntity of gameState.entities) {
          if (targetEntity.type === 'platform' || targetEntity.type === 'crystal') {
            if (targetEntity.waterReduction !== undefined) {
              entity.linkedEntities.push(targetEntity);
            }
          }
        }
      }
    }

    return true;
  }

  getCurrentLevelData(gameState) {
    return this.levels[gameState.currentLevel - 1];
  }
}