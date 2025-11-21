// level.js - Level generation and management

import { gameState } from './globals.js';
import { Zombie, Human, Obstacle, Exit, Pit } from './entities.js';

export function initializeLevel(levelNumber) {
  // Clear existing entities
  gameState.entities = [];
  gameState.zombies = [];
  gameState.humans = [];
  gameState.obstacles = [];
  gameState.exits = [];
  gameState.pits = [];
  
  const groundY = 350;
  
  // Level 1: Tutorial level
  if (levelNumber === 1) {
    // Spawn initial zombies
    for (let i = 0; i < 3; i++) {
      const zombie = new Zombie(50 + i * 25, groundY - 30);
      gameState.zombies.push(zombie);
      gameState.entities.push(zombie);
    }
    
    // Spawn humans
    const human1 = new Human(300, groundY - 30, false);
    gameState.humans.push(human1);
    gameState.entities.push(human1);
    
    const human2 = new Human(500, groundY - 30, false);
    gameState.humans.push(human2);
    gameState.entities.push(human2);
    
    const criticalHuman = new Human(700, groundY - 30, true);
    gameState.humans.push(criticalHuman);
    gameState.entities.push(criticalHuman);
    
    // Spawn obstacles
    const obstacle1 = new Obstacle(400, groundY - 40, 30, 40, true);
    gameState.obstacles.push(obstacle1);
    gameState.entities.push(obstacle1);
    
    // Spawn pit
    const pit1 = new Pit(600, groundY, 80);
    gameState.pits.push(pit1);
    gameState.entities.push(pit1);
    
    // Spawn exit
    const exit = new Exit(900, groundY - 60);
    gameState.exits.push(exit);
    gameState.entities.push(exit);
    
    gameState.minHordeSize = 5;
    gameState.levelWidth = 1200;
  }
  
  gameState.humanCount = gameState.humans.length;
  gameState.zombieCount = gameState.zombies.length;
}

export function getGroundY() {
  return 350;
}