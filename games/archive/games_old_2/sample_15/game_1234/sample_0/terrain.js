// terrain.js - Terrain generation and management

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World } = Matter;

import { gameState, LEVELS } from './globals.js';

export function generateTerrain(p, level) {
  const levelConfig = LEVELS[level - 1];
  const segments = [];
  const segmentWidth = 50;
  const numSegments = Math.ceil(levelConfig.length / segmentWidth);
  
  let currentX = 0;
  let currentY = 300;
  
  // Starting flat area
  for (let i = 0; i < 3; i++) {
    const nextX = currentX + segmentWidth;
    const nextY = currentY;
    
    const points = [
      { x: currentX, y: currentY },
      { x: nextX, y: nextY },
      { x: nextX, y: 400 },
      { x: currentX, y: 400 }
    ];
    
    const ground = Bodies.fromVertices(
      (currentX + nextX) / 2,
      (currentY + 400) / 2,
      [points],
      {
        isStatic: true,
        label: 'terrain',
        friction: 0.8,
        restitution: 0
      }
    );
    
    if (ground) {
      segments.push(ground);
      World.add(gameState.world, ground);
    }
    
    currentX = nextX;
  }
  
  // Generate varied terrain
  for (let i = 3; i < numSegments + 3; i++) {
    const nextX = currentX + segmentWidth;
    let nextY;
    
    if (levelConfig.terrainDifficulty === "easy") {
      nextY = currentY + p.random(-15, 15);
    } else if (levelConfig.terrainDifficulty === "medium") {
      nextY = currentY + p.random(-25, 25);
    } else { // hard
      nextY = currentY + p.random(-35, 35);
    }
    
    nextY = p.constrain(nextY, 200, 350);
    
    const points = [
      { x: currentX, y: currentY },
      { x: nextX, y: nextY },
      { x: nextX, y: 400 },
      { x: currentX, y: 400 }
    ];
    
    const ground = Bodies.fromVertices(
      (currentX + nextX) / 2,
      (currentY + 400) / 2,
      [points],
      {
        isStatic: true,
        label: 'terrain',
        friction: 0.8,
        restitution: 0
      }
    );
    
    if (ground) {
      segments.push(ground);
      World.add(gameState.world, ground);
    }
    
    currentX = nextX;
    currentY = nextY;
  }
  
  // Ending flat area
  for (let i = 0; i < 5; i++) {
    const nextX = currentX + segmentWidth;
    const nextY = currentY;
    
    const points = [
      { x: currentX, y: currentY },
      { x: nextX, y: nextY },
      { x: nextX, y: 400 },
      { x: currentX, y: 400 }
    ];
    
    const ground = Bodies.fromVertices(
      (currentX + nextX) / 2,
      (currentY + 400) / 2,
      [points],
      {
        isStatic: true,
        label: 'terrain',
        friction: 0.8,
        restitution: 0
      }
    );
    
    if (ground) {
      segments.push(ground);
      World.add(gameState.world, ground);
    }
    
    currentX = nextX;
  }
  
  return segments;
}

export function generateObstacles(p, level) {
  const levelConfig = LEVELS[level - 1];
  const obstacles = [];
  
  for (let i = 0; i < levelConfig.obstacles; i++) {
    const x = 200 + p.random(100, levelConfig.length - 100);
    const y = 200;
    const radius = p.random(20, 40);
    
    const obstacle = Bodies.circle(x, y, radius, {
      isStatic: true,
      label: 'obstacle',
      friction: 0.8,
      restitution: 0.2
    });
    
    obstacles.push(obstacle);
    World.add(gameState.world, obstacle);
  }
  
  return obstacles;
}

export function generateCollectibles(p, level) {
  const levelConfig = LEVELS[level - 1];
  const fuelCanisters = [];
  const coins = [];
  
  // Generate fuel canisters
  const numFuel = Math.floor(levelConfig.length / 100 * levelConfig.itemDensity);
  for (let i = 0; i < numFuel; i++) {
    const x = 150 + p.random(0, levelConfig.length);
    const y = 150;
    
    const canister = Bodies.rectangle(x, y, 15, 20, {
      isStatic: true,
      isSensor: true,
      label: 'fuel',
      collected: false
    });
    
    fuelCanisters.push(canister);
    World.add(gameState.world, canister);
  }
  
  // Generate coins
  const numCoins = Math.floor(levelConfig.length / 50 * levelConfig.itemDensity);
  for (let i = 0; i < numCoins; i++) {
    const x = 150 + p.random(0, levelConfig.length);
    const y = 150;
    
    const coin = Bodies.circle(x, y, 10, {
      isStatic: true,
      isSensor: true,
      label: 'coin',
      collected: false
    });
    
    coins.push(coin);
    World.add(gameState.world, coin);
  }
  
  return { fuelCanisters, coins };
}