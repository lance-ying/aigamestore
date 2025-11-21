// level_manager.js - Level creation and management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Pig, Structure } from './entities.js';

export function createLevel(p, levelNumber) {
  gameState.pigs = [];
  gameState.structures = [];
  
  const levelStartX = CANVAS_WIDTH - 200;
  
  if (levelNumber === 1) {
    // Simple introductory level
    gameState.pigs.push(new Pig(p, levelStartX + 50, CANVAS_HEIGHT - 100, 1));
    
    // Simple structure
    gameState.structures.push(new Structure(p, levelStartX + 20, CANVAS_HEIGHT - 80, 60, 15, "WOOD"));
    gameState.structures.push(new Structure(p, levelStartX + 80, CANVAS_HEIGHT - 80, 60, 15, "WOOD"));
    gameState.structures.push(new Structure(p, levelStartX + 50, CANVAS_HEIGHT - 105, 15, 40, "WOOD"));
  } else if (levelNumber === 2) {
    // Tower structure
    gameState.pigs.push(new Pig(p, levelStartX + 50, CANVAS_HEIGHT - 120, 1));
    gameState.pigs.push(new Pig(p, levelStartX + 50, CANVAS_HEIGHT - 80, 1));
    
    // Tower base
    gameState.structures.push(new Structure(p, levelStartX + 30, CANVAS_HEIGHT - 60, 15, 50, "WOOD"));
    gameState.structures.push(new Structure(p, levelStartX + 70, CANVAS_HEIGHT - 60, 15, 50, "WOOD"));
    
    // Floor 1
    gameState.structures.push(new Structure(p, levelStartX + 50, CANVAS_HEIGHT - 90, 50, 10, "WOOD"));
    
    // Floor 2
    gameState.structures.push(new Structure(p, levelStartX + 50, CANVAS_HEIGHT - 130, 50, 10, "WOOD"));
  } else {
    // Advanced level with stone
    gameState.pigs.push(new Pig(p, levelStartX + 40, CANVAS_HEIGHT - 100, 2));
    gameState.pigs.push(new Pig(p, levelStartX + 100, CANVAS_HEIGHT - 100, 2));
    
    // Stone fortress
    gameState.structures.push(new Structure(p, levelStartX + 20, CANVAS_HEIGHT - 80, 15, 70, "STONE"));
    gameState.structures.push(new Structure(p, levelStartX + 120, CANVAS_HEIGHT - 80, 15, 70, "STONE"));
    gameState.structures.push(new Structure(p, levelStartX + 70, CANVAS_HEIGHT - 120, 100, 10, "STONE"));
    gameState.structures.push(new Structure(p, levelStartX + 50, CANVAS_HEIGHT - 70, 40, 10, "WOOD"));
    gameState.structures.push(new Structure(p, levelStartX + 90, CANVAS_HEIGHT - 70, 40, 10, "WOOD"));
  }
}

export function checkLevelComplete() {
  const allPigsDefeated = gameState.pigs.every(pig => !pig.alive);
  return allPigsDefeated && gameState.pigs.length > 0;
}

export function checkLevelFailed() {
  const noBirdsLeft = gameState.birdsRemaining === 0 && !gameState.currentBird;
  const currentBirdInactive = gameState.currentBird && !gameState.currentBird.active;
  const noActiveBirds = gameState.birds.every(bird => !bird.active);
  
  return noBirdsLeft && currentBirdInactive && noActiveBirds && !checkLevelComplete();
}