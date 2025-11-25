import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { Platform, Demon, SoulCard } from './entities.js';

export function generateLevel() {
  // Create ground
  const ground = new Platform(0, -0.5, 0, gameState.arenaSize, 1, gameState.arenaSize, 0x16213e);
  gameState.platforms.push(ground);
  
  // Create floating platforms for parkour
  createFloatingPlatforms();
  
  // Spawn demons
  spawnDemons();
  
  // Spawn soul cards
  spawnSoulCards();
  
  // Create arena walls with neon outlines
  createArenaWalls();
}

function createFloatingPlatforms() {
  const platforms = [
    { x: -8, y: 2, z: -8, w: 4, h: 0.5, d: 4 },
    { x: 8, y: 3, z: -8, w: 3, h: 0.5, d: 3 },
    { x: -8, y: 4, z: 8, w: 3, h: 0.5, d: 3 },
    { x: 8, y: 2.5, z: 8, w: 4, h: 0.5, d: 4 },
    { x: 0, y: 5, z: 0, w: 5, h: 0.5, d: 5 },
    { x: -10, y: 6, z: 0, w: 3, h: 0.5, d: 3 },
    { x: 10, y: 5.5, z: 0, w: 3, h: 0.5, d: 3 }
  ];
  
  platforms.forEach(p => {
    const platform = new Platform(p.x, p.y, p.z, p.w, p.h, p.d);
    gameState.platforms.push(platform);
  });
}

function spawnDemons() {
  const demonPositions = [
    { x: -10, y: 3, z: -10 },
    { x: 10, y: 4, z: -10 },
    { x: -10, y: 5, z: 10 },
    { x: 10, y: 3.5, z: 10 },
    { x: 0, y: 6.5, z: 0 },
    { x: -12, y: 7, z: 0 },
    { x: 12, y: 6.5, z: 0 },
    { x: 0, y: 4, z: -12 },
    { x: 0, y: 4.5, z: 12 },
    { x: -5, y: 2.5, z: -5 }
  ];
  
  demonPositions.forEach(pos => {
    const demon = new Demon(pos.x, pos.y, pos.z);
    gameState.demons.push(demon);
  });
  
  gameState.totalDemons = gameState.demons.length;
}

function spawnSoulCards() {
  // Spawn cards strategically around the level
  const cardPositions = [
    { x: -6, y: 1.5, z: -6 },
    { x: 6, y: 1.5, z: -6 },
    { x: -6, y: 1.5, z: 6 },
    { x: 6, y: 1.5, z: 6 },
    { x: 0, y: 1.5, z: -10 },
    { x: 0, y: 1.5, z: 10 },
    { x: -10, y: 1.5, z: 0 },
    { x: 10, y: 1.5, z: 0 },
    { x: -8, y: 3, z: -8 },
    { x: 8, y: 4, z: -8 },
    { x: -8, y: 5, z: 8 },
    { x: 8, y: 3.5, z: 8 },
    { x: 0, y: 6, z: 0 },
    { x: -10, y: 7, z: 0 },
    { x: 10, y: 6.5, z: 0 }
  ];
  
  cardPositions.forEach(pos => {
    const card = new SoulCard(pos.x, pos.y, pos.z);
    gameState.cards.push(card);
  });
}

function createArenaWalls() {
  const halfSize = gameState.arenaSize / 2;
  const wallHeight = 10;
  const wallThickness = 0.5;
  
  // Create walls with neon edges
  const walls = [
    { x: 0, y: wallHeight / 2, z: -halfSize, w: gameState.arenaSize, h: wallHeight, d: wallThickness },
    { x: 0, y: wallHeight / 2, z: halfSize, w: gameState.arenaSize, h: wallHeight, d: wallThickness },
    { x: -halfSize, y: wallHeight / 2, z: 0, w: wallThickness, h: wallHeight, d: gameState.arenaSize },
    { x: halfSize, y: wallHeight / 2, z: 0, w: wallThickness, h: wallHeight, d: gameState.arenaSize }
  ];
  
  walls.forEach(w => {
    const wall = new Platform(w.x, w.y, w.z, w.w, w.h, w.d, 0x0a0a15);
    gameState.platforms.push(wall);
  });
}

export function clearLevel() {
  // Remove all entities from scene
  gameState.demons.forEach(demon => gameState.scene.remove(demon.mesh));
  gameState.cards.forEach(card => gameState.scene.remove(card.mesh));
  gameState.projectiles.forEach(proj => gameState.scene.remove(proj.mesh));
  gameState.platforms.forEach(plat => gameState.scene.remove(plat.mesh));
  gameState.particles.forEach(part => gameState.scene.remove(part.mesh));
  
  // Clear arrays
  gameState.demons = [];
  gameState.cards = [];
  gameState.projectiles = [];
  gameState.platforms = [];
  gameState.particles = [];
}