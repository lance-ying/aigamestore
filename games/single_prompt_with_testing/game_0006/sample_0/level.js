import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';
import { Platform, Spike, Key, Door, Exit } from './entities.js';
import { Player } from './player.js';

export function createLevel(p) {
  gameState.platforms = [];
  gameState.spikes = [];
  gameState.keys = [];
  gameState.doors = [];
  gameState.entities = [];
  
  // Ground
  gameState.platforms.push(new Platform(0, 370, 600, 30, p));
  
  // Starting platforms
  gameState.platforms.push(new Platform(50, 310, 80, 15, p));
  gameState.platforms.push(new Platform(180, 310, 80, 15, p));
  
  // Middle section with gaps and spikes
  gameState.platforms.push(new Platform(310, 280, 60, 15, p));
  gameState.spikes.push(new Spike(280, 360, 30, 10, p));
  
  gameState.platforms.push(new Platform(420, 250, 70, 15, p));
  gameState.spikes.push(new Spike(380, 360, 30, 10, p));
  
  // Upper platforms
  gameState.platforms.push(new Platform(100, 200, 100, 15, p));
  gameState.platforms.push(new Platform(250, 170, 100, 15, p));
  gameState.platforms.push(new Platform(400, 140, 100, 15, p));
  
  // Lower path with hazards
  gameState.spikes.push(new Spike(150, 360, 40, 10, p));
  gameState.platforms.push(new Platform(200, 340, 50, 15, p));
  gameState.spikes.push(new Spike(260, 360, 40, 10, p));
  
  // Keys
  gameState.keys.push(new Key(150, 180, 1, p));
  gameState.keys.push(new Key(300, 150, 2, p));
  gameState.keys.push(new Key(450, 120, 3, p));
  
  // Doors
  gameState.doors.push(new Door(370, 250, 15, 100, 1, p));
  gameState.doors.push(new Door(500, 140, 15, 100, 2, p));
  
  // Exit portal
  gameState.exit = new Exit(550, 100, 40, p);
  
  // Create players
  gameState.player1 = new Player(80, 280, [100, 150, 255], 1, p);
  gameState.player2 = new Player(200, 280, [255, 100, 100], 2, p);
  
  gameState.entities.push(gameState.player1);
  gameState.entities.push(gameState.player2);
  
  gameState.keysCollected = 0;
  gameState.score = 0;
}