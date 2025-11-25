// world.js - World/level generation and management
import { Platform, Ladder, Spike, TimePiece, Yarn, DestructibleBlock } from './entities.js';
import { gameState } from './globals.js';

export function createWorld() {
  gameState.platforms = [];
  gameState.ladders = [];
  gameState.spikes = [];
  gameState.timePieces = [];
  gameState.yarn = [];
  gameState.destructibleBlocks = [];

  // Ground
  gameState.platforms.push(new Platform(0, 360, 2400, 40, 'ground'));

  // Starting area platforms
  gameState.platforms.push(new Platform(100, 300, 100, 20, 'wood'));
  gameState.platforms.push(new Platform(250, 250, 120, 20, 'wood'));
  gameState.platforms.push(new Platform(400, 200, 100, 20, 'wood'));

  // First ladder
  gameState.ladders.push(new Ladder(140, 200, 100));
  
  // Mid-section platforms
  gameState.platforms.push(new Platform(550, 280, 80, 20, 'wood'));
  gameState.platforms.push(new Platform(680, 240, 100, 20, 'wood'));
  gameState.platforms.push(new Platform(820, 200, 80, 20, 'wood'));
  gameState.platforms.push(new Platform(950, 160, 120, 20, 'wood'));

  // Second ladder
  gameState.ladders.push(new Ladder(720, 120, 120));

  // Upper platforms
  gameState.platforms.push(new Platform(1100, 280, 100, 20, 'wood'));
  gameState.platforms.push(new Platform(1250, 220, 80, 20, 'wood'));
  gameState.platforms.push(new Platform(1380, 180, 100, 20, 'wood'));

  // Tall wall with ladder
  gameState.platforms.push(new Platform(1520, 80, 20, 280, 'wood'));
  gameState.ladders.push(new Ladder(1525, 80, 280));

  // High platforms
  gameState.platforms.push(new Platform(1580, 100, 120, 20, 'wood'));
  gameState.platforms.push(new Platform(1750, 140, 100, 20, 'wood'));
  gameState.platforms.push(new Platform(1900, 180, 80, 20, 'wood'));

  // Final area
  gameState.platforms.push(new Platform(2050, 280, 150, 20, 'wood'));
  gameState.platforms.push(new Platform(2250, 240, 120, 20, 'wood'));
  
  // Spikes
  gameState.spikes.push(new Spike(520, 344, 60));
  gameState.spikes.push(new Spike(900, 344, 48));
  gameState.spikes.push(new Spike(1500, 344, 72));
  gameState.spikes.push(new Spike(2000, 344, 60));

  // Destructible blocks (require brewing hat)
  gameState.destructibleBlocks = [
    new DestructibleBlock(1100, 240, 40, 40),
    new DestructibleBlock(1380, 140, 40, 40),
    new DestructibleBlock(2050, 240, 40, 40)
  ];

  // Time Pieces (5 total to win)
  gameState.timePieces = [
    new TimePiece(280, 210, 0),
    new TimePiece(720, 180, 1),
    new TimePiece(1100, 140, 2), // Behind destructible block
    new TimePiece(1600, 60, 3),
    new TimePiece(2280, 200, 4, true) // Hidden, needs dimension hat
  ];
  
  // Mark last time piece as hidden
  gameState.timePieces[4].hidden = true;

  // Yarn for unlocking hats (need 3 for sprint, 6 for brewing, 9 for dimension)
  gameState.yarn = [
    new Yarn(120, 270, 0),
    new Yarn(270, 220, 1),
    new Yarn(420, 170, 2),
    new Yarn(570, 250, 3),
    new Yarn(840, 170, 4),
    new Yarn(1120, 250, 5),
    new Yarn(1270, 190, 6),
    new Yarn(1600, 70, 7),
    new Yarn(1770, 110, 8),
    new Yarn(2070, 250, 9)
  ];
}

export function updateCamera(player, camera) {
  // Camera follows player horizontally
  const targetX = player.x - 200;
  camera.x += (targetX - camera.x) * 0.1;
  
  // Keep camera in bounds
  if (camera.x < 0) camera.x = 0;
  if (camera.x > gameState.worldWidth - 600) {
    camera.x = gameState.worldWidth - 600;
  }
  
  // Keep camera at ground level
  camera.y = 0;
}