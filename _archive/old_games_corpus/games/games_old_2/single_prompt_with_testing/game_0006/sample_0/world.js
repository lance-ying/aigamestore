// world.js - World generation and management

import { gameState, GENRE_TYPES } from './globals.js';
import { Player, Enemy, Crystal, NPC, Door, Switch, Portal } from './entities.js';

export function initializeWorld(p) {
  // Clear existing entities
  gameState.entities = [];
  gameState.projectiles = [];
  gameState.enemies = [];
  gameState.npcs = [];
  gameState.collectibles = [];
  gameState.doors = [];
  gameState.switches = [];
  gameState.portals = [];
  
  // Reset game state
  gameState.crystalsCollected = 0;
  gameState.score = 0;
  gameState.playerHealth = gameState.maxHealth;
  gameState.cardBattleActive = false;
  gameState.switchStates = {};
  gameState.currentGenre = GENRE_TYPES.EXPLORATION_2D;
  gameState.cameraX = 0;
  gameState.cameraY = 0;
  
  // Create player
  gameState.player = new Player(100, 200);
  gameState.entities.push(gameState.player);
  
  // Create world zones
  createExplorationZone(p);
  createShooterZone(p);
  createPuzzleZone(p);
  createCardBattleZone(p);
  createFinalZone(p);
}

function createExplorationZone(p) {
  // Starting area with tutorial
  const npc1 = new NPC(150, 200, "tutorial", "Welcome! Use arrows to move");
  gameState.npcs.push(npc1);
  gameState.entities.push(npc1);
  
  // First crystal
  const crystal1 = new Crystal(250, 150, 1);
  gameState.collectibles.push(crystal1);
  gameState.entities.push(crystal1);
  
  // Door to shooter zone
  const door1 = new Door(350, 150, 20, 80, null);
  door1.isOpen = true;
  gameState.doors.push(door1);
  gameState.entities.push(door1);
}

function createShooterZone(p) {
  // Shooter area (400-700, 100-300)
  const npc2 = new NPC(450, 200, "shooter", "Press SPACE to shoot!");
  gameState.npcs.push(npc2);
  gameState.entities.push(npc2);
  
  // Enemies
  for (let i = 0; i < 3; i++) {
    const enemy = new Enemy(500 + i * 80, 150 + (i % 2) * 80, "shooter");
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  
  // Crystal in shooter zone
  const crystal2 = new Crystal(650, 200, 2);
  gameState.collectibles.push(crystal2);
  gameState.entities.push(crystal2);
  
  // Door to puzzle zone
  const door2 = new Door(700, 150, 20, 80, "switch1");
  gameState.doors.push(door2);
  gameState.entities.push(door2);
}

function createPuzzleZone(p) {
  // Puzzle area (750-1000, 100-400)
  const npc3 = new NPC(800, 250, "puzzle", "Activate switches!");
  gameState.npcs.push(npc3);
  gameState.entities.push(npc3);
  
  // Switches
  const switch1 = new Switch(850, 150, "switch1");
  gameState.switches.push(switch1);
  gameState.entities.push(switch1);
  
  const switch2 = new Switch(950, 350, "switch2");
  gameState.switches.push(switch2);
  gameState.entities.push(switch2);
  
  // Crystal
  const crystal3 = new Crystal(900, 250, 3);
  gameState.collectibles.push(crystal3);
  gameState.entities.push(crystal3);
  
  // Door to card battle
  const door3 = new Door(1000, 200, 20, 80, "switch2");
  gameState.doors.push(door3);
  gameState.entities.push(door3);
}

function createCardBattleZone(p) {
  // Card battle area (300-500, 450-650)
  const npc4 = new NPC(400, 550, "card_battle", "Press SPACE to battle!");
  gameState.npcs.push(npc4);
  gameState.entities.push(npc4);
  
  // Crystal after winning card battle
  const crystal4 = new Crystal(450, 600, 4);
  gameState.collectibles.push(crystal4);
  gameState.entities.push(crystal4);
  
  // Door to final zone
  const door4 = new Door(500, 550, 20, 80, null);
  door4.isOpen = true;
  gameState.doors.push(door4);
  gameState.entities.push(door4);
}

function createFinalZone(p) {
  // Final area (600-800, 500-700)
  // Final enemies
  for (let i = 0; i < 2; i++) {
    const enemy = new Enemy(650 + i * 100, 600, "final");
    gameState.enemies.push(enemy);
    gameState.entities.push(enemy);
  }
  
  // Final crystal
  const crystal5 = new Crystal(700, 650, 5);
  gameState.collectibles.push(crystal5);
  gameState.entities.push(crystal5);
  
  // Final portal
  const portal = new Portal(900, 600, true);
  gameState.portals.push(portal);
  gameState.entities.push(portal);
}

export function updateGenreBasedOnPosition(p) {
  const player = gameState.player;
  if (!player) return;
  
  // Update genre based on player position
  if (player.x >= 400 && player.x < 720 && player.y < 350) {
    gameState.currentGenre = GENRE_TYPES.SHOOTER;
  } else if (player.x >= 750 && player.x < 1020) {
    gameState.currentGenre = GENRE_TYPES.PUZZLE;
  } else if (player.y >= 450 && player.y < 700) {
    if (gameState.cardBattleActive) {
      gameState.currentGenre = GENRE_TYPES.CARD_BATTLE;
    } else {
      gameState.currentGenre = GENRE_TYPES.EXPLORATION_2D;
    }
  } else {
    gameState.currentGenre = GENRE_TYPES.EXPLORATION_2D;
  }
}

export function drawWorld(p) {
  // Draw background based on genre
  drawBackground(p);
  
  // Draw grid
  p.push();
  p.stroke(50);
  p.strokeWeight(1);
  for (let x = 0; x < gameState.worldWidth; x += 50) {
    p.line(x, 0, x, gameState.worldHeight);
  }
  for (let y = 0; y < gameState.worldHeight; y += 50) {
    p.line(0, y, gameState.worldWidth, y);
  }
  p.pop();
  
  // Draw zone labels
  drawZoneLabels(p);
}

function drawBackground(p) {
  // Different backgrounds for different zones
  const player = gameState.player;
  if (!player) return;
  
  // Exploration zone (starting area)
  p.fill(40, 60, 40);
  p.noStroke();
  p.rect(0, 0, 380, gameState.worldHeight);
  
  // Shooter zone
  p.fill(60, 40, 40);
  p.rect(380, 0, 340, 400);
  
  // Puzzle zone
  p.fill(40, 40, 60);
  p.rect(720, 0, 480, 400);
  
  // Card battle zone
  p.fill(60, 40, 60);
  p.rect(0, 400, gameState.worldWidth, 400);
}

function drawZoneLabels(p) {
  p.push();
  p.fill(255, 255, 255, 100);
  p.noStroke();
  p.textAlign(p.CENTER, p.CENTER);
  p.textSize(20);
  
  p.text("EXPLORATION", 190, 50);
  p.text("SHOOTER", 550, 50);
  p.text("PUZZLE", 960, 50);
  p.text("CARD BATTLE", 400, 500);
  p.text("FINAL ZONE", 700, 650);
  p.pop();
}