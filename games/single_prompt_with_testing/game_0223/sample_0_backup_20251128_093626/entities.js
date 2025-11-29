// entities.js - Entity classes with three.js meshes

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { 
  gameState, 
  PLAYER_SPEED,
  PLAYER_SPRINT_SPEED,
  PLAYER_TURN_SPEED, 
  PLAYER_RADIUS,
  TATTLETAIL_NEED_DECAY,
  MAMA_BASE_SPEED,
  MAMA_CATCH_DISTANCE,
  MOVEMENT_NOISE
} from './globals.js';
import { 
  distance3D, 
  checkWallCollision3D, 
  clamp
} from './utils.js';

// Player class - first person controller
export class Player {
  constructor(x, z) {
    // Create invisible player mesh (just for collision)
    const geometry = new THREE.CylinderGeometry(PLAYER_RADIUS, PLAYER_RADIUS, 1.6, 8);
    const material = new THREE.MeshBasicMaterial({ visible: false });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0.8, z);
    gameState.scene.add(this.mesh);
    
    this.radius = PLAYER_RADIUS;
    this.alive = true;
    this.angle = 0;
    
    // Movement
    this.velocity = new THREE.Vector3(0, 0, 0);
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update() {
    if (!this.alive) return;
    
    // Apply velocity (velocity is in units per second, so multiply by deltaTime)
    const newX = this.mesh.position.x + this.velocity.x * gameState.deltaTime;
    const newZ = this.mesh.position.z + this.velocity.z * gameState.deltaTime;
    
    // Try combined movement first (allows diagonal movement)
    if (!checkWallCollision3D(newX, newZ, this.radius)) {
      this.mesh.position.x = newX;
      this.mesh.position.z = newZ;
    } else {
      // If combined movement blocked, try sliding along walls
      // Try X movement only
      if (!checkWallCollision3D(newX, this.mesh.position.z, this.radius)) {
        this.mesh.position.x = newX;
      }
      
      // Try Z movement only
      if (!checkWallCollision3D(this.mesh.position.x, newZ, this.radius)) {
        this.mesh.position.z = newZ;
      }
    }
    
    // Add noise if moving
    const speed = this.velocity.length();
    if (speed > 0.1) {
      gameState.noiseLevel += MOVEMENT_NOISE * gameState.deltaTime;
    }
    
    // Decay velocity (frame-rate independent)
    const decayFactor = Math.pow(0.85, gameState.deltaTime * 60);
    this.velocity.multiplyScalar(decayFactor);
    
    // Update camera position
    gameState.camera.position.copy(this.mesh.position);
    gameState.camera.position.y = 1.6; // Eye level
    
    // Log position periodically
    if (gameState.frameCount % 30 === 0) {
      this.logPosition();
    }
  }
  
  moveForward(isSprinting = false) {
    const direction = new THREE.Vector3();
    gameState.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const speed = isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
    // Add to velocity without deltaTime (velocity is in units per second)
    this.velocity.add(direction.multiplyScalar(speed));
  }
  
  moveBackward(isSprinting = false) {
    const direction = new THREE.Vector3();
    gameState.camera.getWorldDirection(direction);
    direction.y = 0;
    direction.normalize();
    const speed = isSprinting ? PLAYER_SPRINT_SPEED : PLAYER_SPEED;
    // Add to velocity without deltaTime (velocity is in units per second)
    this.velocity.sub(direction.multiplyScalar(speed * 0.5));
  }
  
  turnLeft() {
    gameState.camera.rotation.y += PLAYER_TURN_SPEED;
  }
  
  turnRight() {
    gameState.camera.rotation.y -= PLAYER_TURN_SPEED;
  }
  
  die() {
    this.alive = false;
    // Trigger jumpscare
    gameState.gamePhase = "JUMPSCARE";
    gameState.jumpscareTime = Date.now();
  }
  
  logPosition() {
    if (window.logs && window.logs.player_info) {
      window.logs.player_info.push({
        screen_x: this.mesh.position.x,
        screen_y: this.mesh.position.z,
        game_x: this.mesh.position.x,
        game_y: this.mesh.position.z,
        angle: gameState.camera.rotation.y,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

// Tattletail - the annoying toy
export class Tattletail {
  constructor(x, z) {
    // Create Tattletail mesh (pink furry toy)
    const geometry = new THREE.SphereGeometry(0.4, 16, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff64c8,
      roughness: 0.8,
      metalness: 0.1,
      emissive: 0xff64c8,
      emissiveIntensity: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0.4, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    gameState.scene.add(this.mesh);
    
    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.15, 0.1, 0.3);
    this.mesh.add(this.leftEye);
    
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.15, 0.1, 0.3);
    this.mesh.add(this.rightEye);
    
    this.radius = 0.4;
    
    // Needs
    this.hunger = 100;
    this.cleanliness = 100;
    this.battery = 100;
    
    // State
    this.currentNeed = "none";
    this.noiseTimer = 0;
    this.animationTime = 0;
    
    gameState.tattletail = this;
    gameState.entities.push(this);
  }
  
  update() {
    // Decay needs
    this.hunger -= TATTLETAIL_NEED_DECAY * 0.3 * gameState.deltaTime;
    this.cleanliness -= TATTLETAIL_NEED_DECAY * 0.2 * gameState.deltaTime;
    this.battery -= TATTLETAIL_NEED_DECAY * 0.25 * gameState.deltaTime;
    
    // Clamp needs
    this.hunger = clamp(this.hunger, 0, 100);
    this.cleanliness = clamp(this.cleanliness, 0, 100);
    this.battery = clamp(this.battery, 0, 100);
    
    // Update game state
    gameState.tattletailHunger = this.hunger;
    gameState.tattletailCleanliness = this.cleanliness;
    gameState.tattletailBattery = this.battery;
    
    // Determine current need
    if (this.hunger < 30) {
      this.currentNeed = "food";
    } else if (this.cleanliness < 30) {
      this.currentNeed = "brush";
    } else if (this.battery < 30) {
      this.currentNeed = "charge";
    } else {
      this.currentNeed = "none";
    }
    
    gameState.tattletailNeedType = this.currentNeed;
    
    // Generate noise if needs are low
    if (this.currentNeed !== "none") {
      this.noiseTimer += gameState.deltaTime;
      if (this.noiseTimer > 2) { // Every 2 seconds
        gameState.noiseLevel += 2.0;
        this.noiseTimer = 0;
      }
    }
    
    // Animation (bobbing)
    this.animationTime += gameState.deltaTime * 3;
    this.mesh.position.y = 0.4 + Math.sin(this.animationTime) * 0.05;
    this.mesh.rotation.y += 0.01;
    
    // Pulse emissive when unhappy
    if (this.currentNeed !== "none") {
      this.mesh.material.emissiveIntensity = 0.3 + Math.sin(this.animationTime * 2) * 0.2;
    } else {
      this.mesh.material.emissiveIntensity = 0.2;
    }
  }
  
  feed() {
    this.hunger = 100;
    gameState.score += 10;
  }
  
  brush() {
    this.cleanliness = 100;
    gameState.score += 10;
  }
  
  charge() {
    this.battery = 100;
    gameState.score += 10;
  }
}

// Mama Tattletail - the hunter
export class Mama {
  constructor() {
    // Create Mama mesh (larger, darker, scarier)
    const geometry = new THREE.SphereGeometry(0.6, 16, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8b0000,
      roughness: 0.9,
      metalness: 0.1,
      emissive: 0x8b0000,
      emissiveIntensity: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(-100, 0.6, -100); // Off screen initially
    this.mesh.castShadow = true;
    gameState.scene.add(this.mesh);
    
    // Glowing red eyes
    const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 1.0
    });
    
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.2, 0.15, 0.45);
    this.mesh.add(this.leftEye);
    
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.2, 0.15, 0.45);
    this.mesh.add(this.rightEye);
    
    // Eye glow
    const glowGeometry = new THREE.SphereGeometry(0.18, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xff0000,
      transparent: true,
      opacity: 0.3
    });
    
    const leftGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    leftGlow.position.set(-0.2, 0.15, 0.45);
    this.mesh.add(leftGlow);
    
    const rightGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    rightGlow.position.set(0.2, 0.15, 0.45);
    this.mesh.add(rightGlow);
    
    this.radius = 0.6;
    this.active = false;
    this.spawnDelay = 0;
    
    // Wandering
    this.targetX = this.mesh.position.x;
    this.targetZ = this.mesh.position.z;
    this.wanderTimer = 0;
    
    gameState.mama = this;
    gameState.entities.push(this);
  }
  
  getMamaSpeed() {
    // Levels 1-3: Easy (base speed)
    // Levels 4-6: Medium (1.5x speed)
    // Levels 7-9: Hard (2.0x speed)
    const level = gameState.currentLevel;
    if (level <= 3) {
      return MAMA_BASE_SPEED;
    } else if (level <= 6) {
      return MAMA_BASE_SPEED * 1.5;
    } else {
      return MAMA_BASE_SPEED * 2.0;
    }
  }
  
  spawn(x, z) {
    this.mesh.position.set(x, 0.6, z);
    this.active = true;
    gameState.mamaSpawned = true;
    gameState.mamaActive = true;
    this.spawnDelay = 0;
  }
  
  update() {
    if (!this.active) return;
    
    // Spawn delay
    if (this.spawnDelay > 0) {
      this.spawnDelay--;
      return;
    }
    
    if (!gameState.player) return;
    
    // Always chase player slowly
    const direction = new THREE.Vector3();
    direction.subVectors(
      gameState.player.mesh.position,
      this.mesh.position
    );
    direction.y = 0;
    direction.normalize();
    
    const speed = this.getMamaSpeed();
    this.mesh.position.add(direction.multiplyScalar(speed * gameState.deltaTime));
    
    // Face player
    this.mesh.lookAt(gameState.player.mesh.position);
    
    // Avoid walls
    if (checkWallCollision3D(this.mesh.position.x, this.mesh.position.z, this.radius)) {
      const direction = new THREE.Vector3();
      direction.subVectors(
        gameState.player.mesh.position,
        this.mesh.position
      );
      direction.y = 0;
      direction.normalize();
      
      this.mesh.position.sub(direction.multiplyScalar(0.2));
    }
    
    // Keep at ground level
    this.mesh.position.y = 0.6;
    
    // Check if caught player
    const dist = distance3D(
      this.mesh.position.x, 0, this.mesh.position.z,
      gameState.player.mesh.position.x, 0, gameState.player.mesh.position.z
    );
    if (dist < MAMA_CATCH_DISTANCE) {
      gameState.player.die();
    }
    
    // Pulse eyes
    const pulse = 0.8 + Math.sin(gameState.frameCount * 0.1) * 0.2;
    this.leftEye.material.emissiveIntensity = pulse;
    this.rightEye.material.emissiveIntensity = pulse;
  }
}

// Collectible - items to collect
export class Collectible {
  constructor(x, z) {
    // Create collectible mesh (glowing yellow sphere)
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.8,
      metalness: 0.5,
      roughness: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0.5, z);
    this.mesh.castShadow = true;
    gameState.scene.add(this.mesh);
    
    this.collected = false;
    this.animationTime = 0;
    
    gameState.entities.push(this);
  }
  
  update() {
    if (this.collected) return;
    
    // Animation (rotating and bobbing)
    this.animationTime += gameState.deltaTime * 3;
    this.mesh.position.y = 0.5 + Math.sin(this.animationTime) * 0.15;
    this.mesh.rotation.y += 0.02;
    
    // Pulse emissive
    this.mesh.material.emissiveIntensity = 0.6 + Math.sin(this.animationTime * 2) * 0.3;
    
    // Check if player is near
    if (gameState.player) {
      const dist = distance3D(
        this.mesh.position.x, 0, this.mesh.position.z,
        gameState.player.mesh.position.x, 0, gameState.player.mesh.position.z
      );
      
      if (dist < 1.5) {
        this.collect();
      }
    }
  }
  
  collect() {
    this.collected = true;
    gameState.collectiblesCollected++;
    gameState.score += 50;
    
    // Remove from scene
    gameState.scene.remove(this.mesh);
    
    // Remove from collectibles array
    const index = gameState.collectibles.indexOf(this);
    if (index > -1) {
      gameState.collectibles.splice(index, 1);
    }
  }
}

// Goal - the exit point
export class Goal {
  constructor(x, z) {
    // Create goal mesh (glowing green platform)
    const geometry = new THREE.CylinderGeometry(1.5, 1.5, 0.2, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      emissive: 0x00ff00,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.5,
      transparent: true,
      opacity: 0.7
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, 0.1, z);
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = true;
    gameState.scene.add(this.mesh);
    
    this.animationTime = 0;
    
    gameState.goal = this;
    gameState.entities.push(this);
  }
  
  update() {
    // Animation (pulsing)
    this.animationTime += gameState.deltaTime * 2;
    this.mesh.material.emissiveIntensity = 0.4 + Math.sin(this.animationTime) * 0.3;
    this.mesh.rotation.y += 0.01;
    
    // Scale pulse if ready to complete
    if (gameState.collectiblesCollected >= gameState.collectiblesNeeded) {
      const scale = 1.0 + Math.sin(this.animationTime * 3) * 0.1;
      this.mesh.scale.set(scale, 1, scale);
    } else {
      this.mesh.scale.set(1, 1, 1);
    }
  }
  
  isPlayerNear() {
    if (!gameState.player) return false;
    
    const dist = distance3D(
      this.mesh.position.x, 0, this.mesh.position.z,
      gameState.player.mesh.position.x, 0, gameState.player.mesh.position.z
    );
    
    return dist < 2.0;
  }
}