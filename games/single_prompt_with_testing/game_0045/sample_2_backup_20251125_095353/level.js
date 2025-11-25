// level.js - Level generation and setup
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState } from './globals.js';
import { Platform, Enemy, SoulCardPickup, GoalPortal } from './entities.js';
import { CARD_TYPES } from './globals.js';

// Create level 1
export function createLevel1() {
  // Set spawn position
  gameState.spawnPosition.set(0, 2, 0);
  
  // Create ground platforms
  const ground = new Platform(0, -0.5, -10, 30, 1, 40, 0x1a1a2e);
  gameState.platforms.push(ground);
  
  // Create platform path
  const platform1 = new Platform(0, 0, -5, 6, 1, 6, 0x2e2e4e);
  gameState.platforms.push(platform1);
  
  const platform2 = new Platform(8, 2, -5, 5, 1, 5, 0x2e2e4e);
  gameState.platforms.push(platform2);
  
  const platform3 = new Platform(15, 4, -5, 5, 1, 5, 0x2e2e4e);
  gameState.platforms.push(platform3);
  
  const platform4 = new Platform(22, 6, -5, 5, 1, 5, 0x2e2e4e);
  gameState.platforms.push(platform4);
  
  const platform5 = new Platform(22, 6, -12, 5, 1, 5, 0x2e2e4e);
  gameState.platforms.push(platform5);
  
  const platform6 = new Platform(22, 8, -19, 6, 1, 6, 0x2e2e4e);
  gameState.platforms.push(platform6);
  
  // Create walls
  const wall1 = new Platform(-15, 5, -10, 1, 10, 40, 0x3a3a5a);
  gameState.platforms.push(wall1);
  
  const wall2 = new Platform(15, 5, -30, 30, 10, 1, 0x3a3a5a);
  gameState.platforms.push(wall2);
  
  // Place Soul Cards
  const card1 = new SoulCardPickup(0, 2, -5, 'PISTOL');
  gameState.collectibles.push(card1);
  
  const card2 = new SoulCardPickup(8, 4, -5, 'RIFLE');
  gameState.collectibles.push(card2);
  
  const card3 = new SoulCardPickup(15, 6, -5, 'SHOTGUN');
  gameState.collectibles.push(card3);
  
  const card4 = new SoulCardPickup(22, 8, -12, 'PISTOL');
  gameState.collectibles.push(card4);
  
  // Place enemies
  const enemy1 = new Enemy(5, 1, -5, [
    new THREE.Vector3(3, 1, -5),
    new THREE.Vector3(7, 1, -5)
  ]);
  gameState.enemies.push(enemy1);
  
  const enemy2 = new Enemy(10, 3, -5, [
    new THREE.Vector3(8, 3, -3),
    new THREE.Vector3(8, 3, -7)
  ]);
  gameState.enemies.push(enemy2);
  
  const enemy3 = new Enemy(18, 5, -5, [
    new THREE.Vector3(15, 5, -3),
    new THREE.Vector3(15, 5, -7)
  ]);
  gameState.enemies.push(enemy3);
  
  const enemy4 = new Enemy(22, 7, -8);
  gameState.enemies.push(enemy4);
  
  gameState.totalEnemies = gameState.enemies.length;
  
  // Place goal portal
  gameState.goalPortal = new GoalPortal(22, 10, -19);
  
  // Add decorative elements
  addNeonPillars();
  addFloatingRings();
}

// Add decorative neon pillars
function addNeonPillars() {
  const pillarPositions = [
    [-12, 5, -5],
    [-12, 5, -15],
    [-12, 5, -25],
    [25, 5, -28],
    [25, 5, -18],
    [25, 5, -8]
  ];
  
  pillarPositions.forEach(pos => {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 10, 8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    const pillar = new THREE.Mesh(geometry, material);
    pillar.position.set(pos[0], pos[1], pos[2]);
    pillar.castShadow = true;
    gameState.scene.add(pillar);
  });
}

// Add floating decorative rings
function addFloatingRings() {
  for (let i = 0; i < 10; i++) {
    const geometry = new THREE.TorusGeometry(0.5, 0.1, 8, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: i % 2 === 0 ? 0xff00ff : 0x00ffff,
      emissive: i % 2 === 0 ? 0xff00ff : 0x00ffff,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.3
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.set(
      (Math.random() - 0.5) * 40,
      Math.random() * 15 + 5,
      (Math.random() - 0.5) * 40 - 10
    );
    ring.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );
    gameState.scene.add(ring);
    
    // Animate rings
    gameState.entities.push({
      mesh: ring,
      update: (deltaTime) => {
        ring.rotation.x += 0.01;
        ring.rotation.y += 0.02;
      }
    });
  }
}

// Clear current level
export function clearLevel() {
  // Remove all platforms
  gameState.platforms.forEach(platform => {
    gameState.scene.remove(platform.mesh);
  });
  gameState.platforms = [];
  
  // Remove all enemies
  gameState.enemies.forEach(enemy => {
    gameState.scene.remove(enemy.mesh);
  });
  gameState.enemies = [];
  
  // Remove all collectibles
  gameState.collectibles.forEach(collectible => {
    gameState.scene.remove(collectible.mesh);
  });
  gameState.collectibles = [];
  
  // Remove all projectiles
  gameState.projectiles.forEach(projectile => {
    gameState.scene.remove(projectile.mesh);
  });
  gameState.projectiles = [];
  
  // Remove goal portal
  if (gameState.goalPortal) {
    gameState.scene.remove(gameState.goalPortal.mesh);
    gameState.scene.remove(gameState.goalPortal.center);
    gameState.goalPortal = null;
  }
  
  // Clear entities
  gameState.entities.forEach(entity => {
    if (entity.mesh && entity.mesh.parent) {
      gameState.scene.remove(entity.mesh);
    }
  });
  gameState.entities = [];
}