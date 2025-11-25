// simulation.js - Simulation of truck movement and collision detection

import { gameState, GAME_PHASES } from './globals.js';
import { checkLevelComplete } from './levelManager.js';

export function startSimulation() {
  // Reset all trucks to start
  gameState.trucks.forEach(truck => {
    truck.x = truck.startX;
    truck.y = truck.startY;
    truck.currentPathIndex = 0;
    truck.hasPackage = false;
    truck.packageColor = null;
    truck.delivered = false;
    truck.crashed = false;
  });
  
  // Reset packages
  gameState.packages.forEach(pkg => {
    pkg.pickedUp = false;
  });
  
  // Reset buttons
  gameState.buttons.forEach(btn => {
    btn.pressed = false;
  });
  
  // Reset barriers (re-activate)
  gameState.barriers.forEach(barrier => {
    barrier.active = true;
  });
  
  gameState.isSimulating = true;
  gameState.simulationStep = 0;
  gameState.deliveredPackages = 0;
  gameState.collisionOccurred = false;
}

export function updateSimulation() {
  if (!gameState.isSimulating) return;
  
  gameState.simulationStep++;
  
  // Move trucks every N frames
  if (gameState.simulationStep % gameState.simulationSpeed === 0) {
    moveAllTrucks();
    checkCollisions();
    checkPickups();
    checkDeliveries();
    checkButtons();
    
    // Check if simulation is complete
    if (isSimulationComplete()) {
      gameState.isSimulating = false;
      checkLevelComplete();
    }
  }
}

function moveAllTrucks() {
  gameState.trucks.forEach(truck => {
    if (!truck.crashed && !truck.delivered) {
      truck.moveToNext();
    }
  });
}

function checkCollisions() {
  // Check if any two trucks are at the same position
  for (let i = 0; i < gameState.trucks.length; i++) {
    for (let j = i + 1; j < gameState.trucks.length; j++) {
      const truck1 = gameState.trucks[i];
      const truck2 = gameState.trucks[j];
      
      if (!truck1.crashed && !truck2.crashed && 
          truck1.x === truck2.x && truck1.y === truck2.y) {
        truck1.crashed = true;
        truck2.crashed = true;
        gameState.collisionOccurred = true;
        gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
      }
    }
  }
  
  // Check barrier collisions
  gameState.trucks.forEach(truck => {
    if (!truck.crashed) {
      gameState.barriers.forEach(barrier => {
        if (barrier.active && truck.x === barrier.x && truck.y === barrier.y) {
          truck.crashed = true;
          gameState.collisionOccurred = true;
          gameState.gamePhase = GAME_PHASES.GAME_OVER_LOSE;
        }
      });
    }
  });
}

function checkPickups() {
  gameState.trucks.forEach(truck => {
    if (!truck.hasPackage) {
      gameState.packages.forEach(pkg => {
        if (!pkg.pickedUp && truck.x === pkg.x && truck.y === pkg.y) {
          pkg.pickedUp = true;
          truck.hasPackage = true;
          truck.packageColor = pkg.color;
        }
      });
    }
  });
}

function checkDeliveries() {
  gameState.trucks.forEach(truck => {
    if (truck.hasPackage && !truck.delivered) {
      gameState.houses.forEach(house => {
        if (truck.x === house.x && truck.y === house.y && 
            truck.packageColor === house.color) {
          truck.delivered = true;
          truck.hasPackage = false;
          gameState.deliveredPackages++;
        }
      });
    }
  });
}

function checkButtons() {
  gameState.buttons.forEach(button => {
    let truckOnButton = false;
    gameState.trucks.forEach(truck => {
      if (truck.x === button.x && truck.y === button.y) {
        truckOnButton = true;
      }
    });
    
    if (truckOnButton && !button.pressed) {
      button.pressed = true;
      // Toggle linked barrier
      gameState.barriers.forEach(barrier => {
        if (barrier.id === button.linkedBarrierId) {
          barrier.active = !barrier.active;
        }
      });
    }
  });
}

function isSimulationComplete() {
  // All trucks have either delivered or crashed or reached end of path
  return gameState.trucks.every(truck => {
    return truck.delivered || truck.crashed || truck.currentPathIndex >= truck.path.length;
  });
}