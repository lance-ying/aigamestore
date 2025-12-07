// Procedural level generation
import { gameState, SEGMENT_LENGTH, PATH_WIDTH, LANE_WIDTH, OBSTACLE_TYPES } from './globals.js';
import { PathSegment, Obstacle, Coin } from './entities.js';

let lastSegmentZ = 0;
let segmentCounter = 0;

export function initializeLevelGeneration() {
  lastSegmentZ = 0;
  segmentCounter = 0;
  
  // Generate initial segments
  for (let i = 0; i < 5; i++) {
    generateSegment();
  }
}

export function updateLevelGeneration(p) {
  if (!gameState.player) return;
  
  // Generate new segments as player moves forward
  while (lastSegmentZ < gameState.player.z + 800) {
    generateSegment();
  }
}

function generateSegment() {
  const segment = new PathSegment(lastSegmentZ, PATH_WIDTH);
  
  // Decide if this segment has obstacles/coins
  segmentCounter++;
  
  // Generate coins every 2-3 segments
  if (segmentCounter % 2 === 0) {
    generateCoins(lastSegmentZ);
  }
  
  // Generate obstacles with increasing frequency
  const obstacleChance = Math.min(0.7, 0.3 + (gameState.distanceTraveled / 10000));
  if (Math.random() < obstacleChance && segmentCounter > 2) {
    generateObstacles(lastSegmentZ);
  }
  
  lastSegmentZ += SEGMENT_LENGTH;
}

function generateCoins(z) {
  // Random coin pattern
  const pattern = Math.floor(Math.random() * 5);
  
  switch (pattern) {
    case 0: // Single lane
      const singleLane = Math.floor(Math.random() * 3) - 1;
      for (let i = 0; i < 5; i++) {
        new Coin(z + i * 30, singleLane, 0);
      }
      break;
      
    case 1: // All lanes
      for (let lane = -1; lane <= 1; lane++) {
        for (let i = 0; i < 3; i++) {
          new Coin(z + i * 40, lane, 0);
        }
      }
      break;
      
    case 2: // Zigzag
      for (let i = 0; i < 5; i++) {
        const lane = (i % 2 === 0) ? -1 : 1;
        new Coin(z + i * 30, lane, 0);
      }
      break;
      
    case 3: // High coins (require jump)
      const highLane = Math.floor(Math.random() * 3) - 1;
      for (let i = 0; i < 4; i++) {
        new Coin(z + i * 35, highLane, 40);
      }
      break;
      
    case 4: // Two lanes
      const lane1 = -1;
      const lane2 = 1;
      for (let i = 0; i < 4; i++) {
        new Coin(z + i * 35, lane1, 0);
        new Coin(z + i * 35, lane2, 0);
      }
      break;
  }
}

function generateObstacles(z) {
  // Choose obstacle pattern
  const pattern = Math.floor(Math.random() * 6);
  
  switch (pattern) {
    case 0: // Single gap in random lane
      const gapLane = Math.floor(Math.random() * 3) - 1;
      new Obstacle(z + 50, gapLane, OBSTACLE_TYPES.GAP);
      break;
      
    case 1: // Barrier in two lanes (force lane switch)
      const openLane = Math.floor(Math.random() * 3) - 1;
      for (let lane = -1; lane <= 1; lane++) {
        if (lane !== openLane) {
          new Obstacle(z + 50, lane, OBSTACLE_TYPES.BARRIER);
        }
      }
      break;
      
    case 2: // Low barrier (require slide)
      const lowLane = Math.floor(Math.random() * 3) - 1;
      new Obstacle(z + 50, lowLane, OBSTACLE_TYPES.LOW_BARRIER);
      break;
      
    case 3: // Pillars in alternating pattern
      new Obstacle(z + 30, -1, OBSTACLE_TYPES.PILLAR);
      new Obstacle(z + 60, 1, OBSTACLE_TYPES.PILLAR);
      new Obstacle(z + 90, 0, OBSTACLE_TYPES.PILLAR);
      break;
      
    case 4: // Gap + barrier combo
      const comboLane1 = Math.floor(Math.random() * 3) - 1;
      let comboLane2 = Math.floor(Math.random() * 3) - 1;
      while (comboLane2 === comboLane1) {
        comboLane2 = Math.floor(Math.random() * 3) - 1;
      }
      new Obstacle(z + 40, comboLane1, OBSTACLE_TYPES.GAP);
      new Obstacle(z + 80, comboLane2, OBSTACLE_TYPES.BARRIER);
      break;
      
    case 5: // Mixed challenge
      new Obstacle(z + 30, 0, OBSTACLE_TYPES.LOW_BARRIER);
      new Obstacle(z + 70, -1, OBSTACLE_TYPES.GAP);
      new Obstacle(z + 70, 1, OBSTACLE_TYPES.GAP);
      break;
  }
}

export function resetLevelGeneration() {
  lastSegmentZ = 0;
  segmentCounter = 0;
  gameState.segments = [];
  gameState.obstacles = [];
  gameState.collectibles = [];
}