// level.js - Level creation and management

import { Bird, Pig, Block, Ground } from './entities.js';
import { gameState, BIRD_TYPES } from './globals.js';

export function createLevel1(p) {
  // Clear existing entities
  gameState.entities = [];
  gameState.pigs = [];
  gameState.structures = [];
  gameState.availableBirds = [];
  
  // Create ground
  const ground = new Ground(p, 300, 380, 600, 40);
  gameState.ground = ground;
  gameState.entities.push(ground);
  
  // Create structure at x=400
  const structureX = 400;
  const groundY = 360;
  
  // Base platform
  gameState.structures.push(new Block(p, structureX - 40, groundY - 10, 80, 20, 'wood'));
  gameState.structures.push(new Block(p, structureX + 40, groundY - 10, 80, 20, 'wood'));
  
  // Vertical supports
  gameState.structures.push(new Block(p, structureX - 60, groundY - 50, 20, 80, 'wood'));
  gameState.structures.push(new Block(p, structureX + 60, groundY - 50, 20, 80, 'wood'));
  
  // Top platform
  gameState.structures.push(new Block(p, structureX, groundY - 90, 120, 20, 'wood'));
  
  // Roof
  gameState.structures.push(new Block(p, structureX - 30, groundY - 110, 60, 15, 'wood'));
  gameState.structures.push(new Block(p, structureX + 30, groundY - 110, 60, 15, 'wood'));
  
  // Add structures to entities
  gameState.structures.forEach(block => gameState.entities.push(block));
  
  // Add pigs
  const pig1 = new Pig(p, structureX - 20, groundY - 40, 18);
  const pig2 = new Pig(p, structureX + 20, groundY - 40, 18);
  const pig3 = new Pig(p, structureX, groundY - 120, 20);
  
  gameState.pigs.push(pig1, pig2, pig3);
  gameState.entities.push(pig1, pig2, pig3);
  gameState.totalPigs = gameState.pigs.length;
  
  // Add birds
  const birdTypes = [BIRD_TYPES.RED, BIRD_TYPES.BLUE, BIRD_TYPES.YELLOW, BIRD_TYPES.RED];
  birdTypes.forEach(type => {
    gameState.availableBirds.push(type);
  });
  
  // Setup first bird
  setupNextBird(p);
}

export function setupNextBird(p) {
  if (gameState.availableBirds.length > 0) {
    const birdType = gameState.availableBirds.shift();
    const bird = new Bird(p, 80, 300, birdType);
    gameState.currentBird = bird;
    gameState.launchedBird = null;
    gameState.birdInFlight = false;
    gameState.abilityUsed = false;
    gameState.entities.push(bird);
  } else {
    gameState.currentBird = null;
  }
}

export function checkLevelComplete() {
  // Check win condition
  if (gameState.pigsDestroyed >= gameState.totalPigs) {
    // Award bonus for remaining birds
    gameState.score += gameState.availableBirds.length * 500;
    
    // Calculate stars (1-3)
    if (gameState.score >= 5000) {
      gameState.starsEarned = 3;
    } else if (gameState.score >= 3000) {
      gameState.starsEarned = 2;
    } else {
      gameState.starsEarned = 1;
    }
    
    gameState.gamePhase = "GAME_OVER_WIN";
    return true;
  }
  
  // Check lose condition (no birds left and bird not in flight)
  if (gameState.availableBirds.length === 0 && 
      !gameState.currentBird && 
      !gameState.birdInFlight &&
      gameState.pigsDestroyed < gameState.totalPigs) {
    gameState.gamePhase = "GAME_OVER_LOSE";
    return true;
  }
  
  return false;
}