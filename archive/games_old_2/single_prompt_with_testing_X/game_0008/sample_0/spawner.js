// spawner.js - Entity spawning logic

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, SPAWN_DISTANCE, LANE_WIDTH, NUM_LANES } from './globals.js';
import { CollectibleBall, Block } from './entities.js';

export function spawnEntities(p) {
  const head = gameState.snakeBalls[0];
  if (!head) return;
  
  // Spawn when head passes spawn threshold
  if (head.y > gameState.nextSpawnY) {
    gameState.nextSpawnY = head.y + SPAWN_DISTANCE;
    
    // Increase difficulty gradually
    gameState.difficulty = 1 + Math.floor(gameState.distance / 500) * 0.5;
    
    // Spawn pattern
    const pattern = p.floor(p.random(3));
    
    if (pattern === 0) {
      // Spawn blocks
      spawnBlockRow(p);
    } else if (pattern === 1) {
      // Spawn collectibles
      spawnCollectibleRow(p);
    } else {
      // Mixed pattern
      spawnMixedRow(p);
    }
  }
}

function spawnBlockRow(p) {
  const numBlocks = p.floor(p.random(1, 4));
  const availableLanes = [];
  
  for (let i = 0; i < NUM_LANES; i++) {
    availableLanes.push(i);
  }
  
  for (let i = 0; i < numBlocks; i++) {
    if (availableLanes.length === 0) break;
    
    const laneIndex = p.floor(p.random(availableLanes.length));
    const lane = availableLanes[laneIndex];
    availableLanes.splice(laneIndex, 1);
    
    const x = lane * LANE_WIDTH + LANE_WIDTH / 2 + (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    const y = gameState.nextSpawnY - CANVAS_HEIGHT;
    
    const baseValue = Math.floor(5 + gameState.difficulty * 5);
    const value = p.floor(p.random(baseValue, baseValue + 10));
    
    const block = new Block(x, y, value);
    gameState.blocks.push(block);
    gameState.entities.push(block);
  }
}

function spawnCollectibleRow(p) {
  const numBalls = p.floor(p.random(3, 6));
  
  for (let i = 0; i < numBalls; i++) {
    const lane = p.floor(p.random(NUM_LANES));
    const x = lane * LANE_WIDTH + LANE_WIDTH / 2 + (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    const y = gameState.nextSpawnY - CANVAS_HEIGHT - p.random(20, 60);
    
    const ball = new CollectibleBall(x, y);
    gameState.collectibles.push(ball);
    gameState.entities.push(ball);
  }
}

function spawnMixedRow(p) {
  // Spawn some blocks
  const numBlocks = p.floor(p.random(1, 3));
  const blockedLanes = [];
  
  for (let i = 0; i < numBlocks; i++) {
    let lane = p.floor(p.random(NUM_LANES));
    while (blockedLanes.includes(lane)) {
      lane = p.floor(p.random(NUM_LANES));
    }
    blockedLanes.push(lane);
    
    const x = lane * LANE_WIDTH + LANE_WIDTH / 2 + (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    const y = gameState.nextSpawnY - CANVAS_HEIGHT;
    
    const baseValue = Math.floor(3 + gameState.difficulty * 3);
    const value = p.floor(p.random(baseValue, baseValue + 8));
    
    const block = new Block(x, y, value);
    gameState.blocks.push(block);
    gameState.entities.push(block);
  }
  
  // Spawn some collectibles in remaining lanes
  const numBalls = p.floor(p.random(2, 5));
  for (let i = 0; i < numBalls; i++) {
    let lane = p.floor(p.random(NUM_LANES));
    const x = lane * LANE_WIDTH + LANE_WIDTH / 2 + (CANVAS_WIDTH - NUM_LANES * LANE_WIDTH) / 2;
    const y = gameState.nextSpawnY - CANVAS_HEIGHT - p.random(20, 60);
    
    const ball = new CollectibleBall(x, y);
    gameState.collectibles.push(ball);
    gameState.entities.push(ball);
  }
}