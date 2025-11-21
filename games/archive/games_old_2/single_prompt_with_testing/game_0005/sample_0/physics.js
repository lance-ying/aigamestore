// physics.js
import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Events } = Matter;
import { gameState } from './globals.js';

export function setupPhysics() {
  // Handle collision events
  Events.on(gameState.engine, 'collisionStart', (event) => {
    const pairs = event.pairs;
    
    pairs.forEach(pair => {
      const bodyA = pair.bodyA;
      const bodyB = pair.bodyB;
      
      // Check for vehicle collisions with terrain
      if ((bodyA.label === 'vehicle' || bodyA.label === 'wheel') && bodyB.label === 'terrain') {
        // Normal collision handling
      }
      
      if ((bodyB.label === 'vehicle' || bodyB.label === 'wheel') && bodyA.label === 'terrain') {
        // Normal collision handling
      }
    });
  });
}

export function updatePhysics() {
  // Update all segments
  gameState.segments.forEach(segment => {
    segment.update();
  });
  
  // Update all vehicles
  gameState.vehicles.forEach(vehicle => {
    vehicle.update();
  });
  
  // Check win/lose conditions
  checkGameConditions();
}

function checkGameConditions() {
  if (!gameState.isSimulating) return;
  
  // Count crossed and fallen vehicles
  let crossed = 0;
  let fallen = 0;
  
  gameState.vehicles.forEach(vehicle => {
    if (vehicle.crossed) crossed++;
    if (vehicle.fallen) fallen++;
  });
  
  // Check for win
  if (crossed === gameState.totalVehicles) {
    gameState.gamePhase = "GAME_OVER_WIN";
    gameState.isSimulating = false;
  }
  
  // Check for lose (any vehicle fallen or bridge completely broken)
  if (fallen > 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    gameState.isSimulating = false;
  }
  
  // Check if bridge has major structural failure
  const brokenSegments = gameState.segments.filter(s => s.broken).length;
  if (brokenSegments > gameState.segments.length * 0.3 && gameState.segments.length > 0) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    gameState.isSimulating = false;
  }
}