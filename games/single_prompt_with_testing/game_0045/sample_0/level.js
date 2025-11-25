// level.js - Level generation and management

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Platform, Demon, ExitPortal } from './entities.js';

export function createLevel(p) {
  // Clear existing level
  gameState.platforms = [];
  gameState.demons = [];
  gameState.cards = [];
  gameState.demonsKilled = 0;
  
  // Ground
  gameState.platforms.push(new Platform(p, 0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20));
  
  // Platforms for parkour
  gameState.platforms.push(new Platform(p, 100, 320, 120, 15));
  gameState.platforms.push(new Platform(p, 280, 260, 100, 15));
  gameState.platforms.push(new Platform(p, 450, 200, 120, 15));
  gameState.platforms.push(new Platform(p, 200, 180, 80, 15));
  gameState.platforms.push(new Platform(p, 350, 120, 100, 15));
  
  // Add some mid-level platforms
  gameState.platforms.push(new Platform(p, 50, 240, 80, 12));
  gameState.platforms.push(new Platform(p, 500, 300, 80, 12));
  
  // Demons - ground patrol
  gameState.demons.push(new Demon(p, 150, 305, 100, 220));
  gameState.demons.push(new Demon(p, 300, 245, 280, 380));
  gameState.demons.push(new Demon(p, 500, 185, 450, 570));
  
  // Flying demons
  const flyingDemon1 = new Demon(p, 250, 150, 200, 300);
  flyingDemon1.type = "FLYING";
  gameState.demons.push(flyingDemon1);
  
  const flyingDemon2 = new Demon(p, 400, 100, 350, 450);
  flyingDemon2.type = "FLYING";
  gameState.demons.push(flyingDemon2);
  
  gameState.totalDemons = gameState.demons.length;
  
  // Exit portal
  gameState.exitPortal = new ExitPortal(p, 520, CANVAS_HEIGHT - 80);
  
  // Add demons to entities
  gameState.entities.push(...gameState.demons);
}