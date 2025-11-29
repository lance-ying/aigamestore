// physics.js - Physics simulation and collision handling

import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events, World } = Matter;

import { gameState, GAME_PHASES } from './globals.js';

export function setupCollisionHandling(p) {
  Events.on(gameState.engine, 'collisionStart', (event) => {
    if (gameState.gamePhase !== GAME_PHASES.PLAYING) return;
    
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check fuel canister collection
      if ((bodyA.label === 'chassis' || bodyA.label === 'rearWheel' || bodyA.label === 'frontWheel') && 
          bodyB.label === 'fuel' && !bodyB.collected) {
        collectFuel(p, bodyB);
      } else if ((bodyB.label === 'chassis' || bodyB.label === 'rearWheel' || bodyB.label === 'frontWheel') && 
                 bodyA.label === 'fuel' && !bodyA.collected) {
        collectFuel(p, bodyA);
      }
      
      // Check coin collection
      if ((bodyA.label === 'chassis' || bodyA.label === 'rearWheel' || bodyA.label === 'frontWheel') && 
          bodyB.label === 'coin' && !bodyB.collected) {
        collectCoin(p, bodyB);
      } else if ((bodyB.label === 'chassis' || bodyB.label === 'rearWheel' || bodyB.label === 'frontWheel') && 
                 bodyA.label === 'coin' && !bodyA.collected) {
        collectCoin(p, bodyA);
      }
    });
  });
}

function collectFuel(p, fuelBody) {
  fuelBody.collected = true;
  gameState.fuelLevel = Math.min(gameState.maxFuel, gameState.fuelLevel + 20);
  gameState.currentScore += 50;
  
  // Remove from world
  World.remove(gameState.world, fuelBody);
  
  p.logs.game_info.push({
    data: { event: 'fuel_collected', fuel: gameState.fuelLevel },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}

function collectCoin(p, coinBody) {
  coinBody.collected = true;
  gameState.currentCoins += 1;
  gameState.currentScore += 100;
  
  // Remove from world
  World.remove(gameState.world, coinBody);
  
  p.logs.game_info.push({
    data: { event: 'coin_collected', coins: gameState.currentCoins },
    framecount: p.frameCount,
    timestamp: Date.now()
  });
}