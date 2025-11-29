/**
 * Entity spawning and world generation
 */
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, ARENA_SIZE, GROUND_Y, ENEMY_MAX_COUNT } from './globals.js';
import { Enemy, Teleporter } from './entities.js';

/**
 * Spawn an enemy at random position
 */
export function spawnEnemy() {
  if (gameState.enemies.length >= ENEMY_MAX_COUNT) return;
  
  // Random position around arena edge
  const angle = Math.random() * Math.PI * 2;
  const distance = ARENA_SIZE / 2 - 2;
  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;
  
  // Choose enemy type based on difficulty
  let type = 'basic';
  const rand = Math.random();
  if (gameState.difficultyMultiplier > 1.5) {
    if (rand < 0.3) type = 'fast';
    else if (rand < 0.5) type = 'tank';
  } else if (gameState.difficultyMultiplier > 1.2) {
    if (rand < 0.2) type = 'fast';
  }
  
  const enemy = new Enemy(x, GROUND_Y + 2, z, type);
  gameState.enemies.push(enemy);
}

/**
 * Spawn teleporter when requirement is met
 */
export function spawnTeleporter() {
  if (gameState.teleporter || gameState.killCount < 25) return;
  
  // Spawn at random position
  const angle = Math.random() * Math.PI * 2;
  const distance = ARENA_SIZE / 3;
  const x = Math.cos(angle) * distance;
  const z = Math.sin(angle) * distance;
  
  gameState.teleporter = new Teleporter(x, GROUND_Y, z);
}

/**
 * Create arena environment
 */
export function createArena() {
  // Ground
  const groundGeometry = new THREE.PlaneGeometry(ARENA_SIZE, ARENA_SIZE);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x333333,
    roughness: 0.9
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = GROUND_Y;
  ground.receiveShadow = true;
  gameState.scene.add(ground);
  
  // Create grid pattern on ground
  const gridSize = 2;
  for (let x = -ARENA_SIZE / 2; x < ARENA_SIZE / 2; x += gridSize) {
    for (let z = -ARENA_SIZE / 2; z < ARENA_SIZE / 2; z += gridSize) {
      if ((Math.floor(x / gridSize) + Math.floor(z / gridSize)) % 2 === 0) {
        const tileGeometry = new THREE.PlaneGeometry(gridSize - 0.1, gridSize - 0.1);
        const tileMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x444444,
          roughness: 0.8
        });
        const tile = new THREE.Mesh(tileGeometry, tileMaterial);
        tile.rotation.x = -Math.PI / 2;
        tile.position.set(x + gridSize / 2, GROUND_Y + 0.01, z + gridSize / 2);
        tile.receiveShadow = true;
        gameState.scene.add(tile);
      }
    }
  }
  
  // Arena walls
  const wallHeight = 3;
  const wallThickness = 0.5;
  const wallMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x666666,
    roughness: 0.7,
    metalness: 0.3
  });
  
  // North wall
  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(ARENA_SIZE, wallHeight, wallThickness),
    wallMaterial
  );
  northWall.position.set(0, GROUND_Y + wallHeight / 2, -ARENA_SIZE / 2);
  northWall.castShadow = true;
  northWall.receiveShadow = true;
  gameState.scene.add(northWall);
  
  // South wall
  const southWall = new THREE.Mesh(
    new THREE.BoxGeometry(ARENA_SIZE, wallHeight, wallThickness),
    wallMaterial
  );
  southWall.position.set(0, GROUND_Y + wallHeight / 2, ARENA_SIZE / 2);
  southWall.castShadow = true;
  southWall.receiveShadow = true;
  gameState.scene.add(southWall);
  
  // East wall
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, ARENA_SIZE),
    wallMaterial
  );
  eastWall.position.set(ARENA_SIZE / 2, GROUND_Y + wallHeight / 2, 0);
  eastWall.castShadow = true;
  eastWall.receiveShadow = true;
  gameState.scene.add(eastWall);
  
  // West wall
  const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(wallThickness, wallHeight, ARENA_SIZE),
    wallMaterial
  );
  westWall.position.set(-ARENA_SIZE / 2, GROUND_Y + wallHeight / 2, 0);
  westWall.castShadow = true;
  westWall.receiveShadow = true;
  gameState.scene.add(westWall);
  
  // Add some decorative elements
  for (let i = 0; i < 8; i++) {
    const pillarGeometry = new THREE.CylinderGeometry(0.5, 0.6, 4, 8);
    const pillarMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.2
    });
    const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
    
    const angle = (i / 8) * Math.PI * 2;
    const distance = ARENA_SIZE / 2 - 3;
    pillar.position.set(
      Math.cos(angle) * distance,
      GROUND_Y + 2,
      Math.sin(angle) * distance
    );
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    gameState.scene.add(pillar);
  }
}