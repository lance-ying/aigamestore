// world_generator.js - Generate the game world

import { Resource, Rabbit, Campfire, Portal } from './entities.js';
import { WORLD_WIDTH, WORLD_HEIGHT, gameState } from './globals.js';

export function generateWorld(p) {
  gameState.resources = [];
  gameState.rabbits = [];
  
  // Generate trees
  for (let i = 0; i < 25; i++) {
    const x = p.random(50, WORLD_WIDTH - 50);
    const y = p.random(50, WORLD_HEIGHT - 50);
    gameState.resources.push(new Resource(x, y, 'tree'));
  }
  
  // Generate rocks
  for (let i = 0; i < 20; i++) {
    const x = p.random(50, WORLD_WIDTH - 50);
    const y = p.random(50, WORLD_HEIGHT - 50);
    gameState.resources.push(new Resource(x, y, 'rock'));
  }
  
  // Generate berry bushes
  for (let i = 0; i < 30; i++) {
    const x = p.random(50, WORLD_WIDTH - 50);
    const y = p.random(50, WORLD_HEIGHT - 50);
    gameState.resources.push(new Resource(x, y, 'berry_bush'));
  }
  
  // Generate rabbits
  for (let i = 0; i < 10; i++) {
    const x = p.random(100, WORLD_WIDTH - 100);
    const y = p.random(100, WORLD_HEIGHT - 100);
    gameState.rabbits.push(new Rabbit(x, y));
  }
  
  // Create campfire near spawn
  gameState.campfire = new Campfire(WORLD_WIDTH / 2 + 80, WORLD_HEIGHT / 2 + 60);
  
  // Create portal (inactive until win condition)
  gameState.portal = new Portal(WORLD_WIDTH - 100, WORLD_HEIGHT - 100);
}