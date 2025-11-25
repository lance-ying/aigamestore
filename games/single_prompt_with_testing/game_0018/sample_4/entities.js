import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANES, PLAYER_SIZE, JUMP_POWER, SLIDE_DURATION, LANE_SWITCH_SPEED, TRAIN_LENGTH, TRAIN_HEIGHT, BARRIER_LOW_HEIGHT, BARRIER_HIGH_HEIGHT, COIN_VALUE } from './globals.js';

export class Player {
  constructor(x, y, z) {
    // Create player mesh (running character)
    const geometry = new THREE.BoxGeometry(PLAYER_SIZE.width, PLAYER_SIZE.height, PLAYER_SIZE.depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      roughness: 0.4,
      metalness: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Physics
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.gravity = -0.02;
    this.onGround = true;
    
    // State
    this.currentLane = 1; // 0=left, 1=center, 2=right
    this.targetX = LANES[this.currentLane];
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.health = 1;
    
    // Animation
    this.bobOffset = 0;
    this.bobSpeed = 0.15;
    this.baseY = y;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Lane switching
    const dx = this.targetX - this.mesh.position.x;
    if (Math.abs(dx) > 0.01) {
      this.mesh.position.x += dx * LANE_SWITCH_SPEED;
    } else {
      this.mesh.position.x = this.targetX;
    }
    
    // Jumping
    if (this.isJumping) {
      this.velocity.y += this.gravity;
      this.mesh.position.y += this.velocity.y;
      
      if (this.mesh.position.y <= this.baseY) {
        this.mesh.position.y = this.baseY;
        this.velocity.y = 0;
        this.isJumping = false;
        this.onGround = true;
      }
    }
    
    // Sliding
    if (this.isSliding) {
      this.slideTimer--;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.mesh.scale.y = 1;
        this.mesh.position.y = this.baseY;
      }
    }
    
    // Running animation (bobbing)
    if (!this.isJumping && !this.isSliding) {
      this.bobOffset += this.bobSpeed;
      this.mesh.position.y = this.baseY + Math.sin(this.bobOffset) * 0.1;
    }
    
    // Log player position
    this.logPosition();
  }
  
  switchLane(direction) {
    const newLane = Math.max(0, Math.min(2, this.currentLane + direction));
    if (newLane !== this.currentLane) {
      this.currentLane = newLane;
      this.targetX = LANES[this.currentLane];
    }
  }
  
  jump() {
    if (this.onGround && !this.isSliding) {
      this.velocity.y = JUMP_POWER;
      this.isJumping = true;
      this.onGround = false;
    }
  }
  
  slide() {
    if (this.onGround && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = SLIDE_DURATION;
      this.mesh.scale.y = 0.4;
      this.mesh.position.y = this.baseY * 0.4;
    }
  }
  
  getBounds() {
    const halfWidth = PLAYER_SIZE.width * 0.5;
    const halfHeight = this.isSliding ? (PLAYER_SIZE.height * 0.4 * 0.5) : (PLAYER_SIZE.height * 0.5);
    const halfDepth = PLAYER_SIZE.depth * 0.5;
    
    return {
      min: new THREE.Vector3(
        this.mesh.position.x - halfWidth,
        this.mesh.position.y - halfHeight,
        this.mesh.position.z - halfDepth
      ),
      max: new THREE.Vector3(
        this.mesh.position.x + halfWidth,
        this.mesh.position.y + halfHeight,
        this.mesh.position.z + halfDepth
      )
    };
  }
  
  takeDamage() {
    this.health = 0;
    gameState.gamePhase = "GAME_OVER_LOSE";
    window.logs.game_info.push({
      game_status: "GAME_OVER_LOSE",
      data: { score: gameState.score, distance: gameState.distance },
      framecount: gameState.frameCount,
      timestamp: Date.now()
    });
  }
  
  logPosition() {
    if (gameState.frameCount % 10 === 0) {
      const screenPos = this.mesh.position.clone().project(gameState.camera);
      window.logs.player_info.push({
        screen_x: (screenPos.x + 1) * 300,
        screen_y: (1 - screenPos.y) * 200,
        game_x: this.mesh.position.x,
        game_y: this.mesh.position.y,
        game_z: this.mesh.position.z,
        lane: this.currentLane,
        isJumping: this.isJumping,
        isSliding: this.isSliding,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export class Train {
  constructor(lane, z) {
    const geometry = new THREE.BoxGeometry(LANE_WIDTH * 0.9, TRAIN_HEIGHT, TRAIN_LENGTH);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      roughness: 0.5,
      metalness: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(LANES[lane], TRAIN_HEIGHT * 0.5, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    this.lane = lane;
    this.type = 'train';
    
    gameState.scene.add(this.mesh);
  }
  
  update(speed) {
    this.mesh.position.z += speed;
  }
  
  getBounds() {
    const halfWidth = LANE_WIDTH * 0.9 * 0.5;
    const halfHeight = TRAIN_HEIGHT * 0.5;
    const halfDepth = TRAIN_LENGTH * 0.5;
    
    return {
      min: new THREE.Vector3(
        this.mesh.position.x - halfWidth,
        this.mesh.position.y - halfHeight,
        this.mesh.position.z - halfDepth
      ),
      max: new THREE.Vector3(
        this.mesh.position.x + halfWidth,
        this.mesh.position.y + halfHeight,
        this.mesh.position.z + halfDepth
      )
    };
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export class Barrier {
  constructor(lane, z, isLow) {
    const height = isLow ? BARRIER_LOW_HEIGHT : BARRIER_HIGH_HEIGHT;
    const geometry = new THREE.BoxGeometry(LANE_WIDTH * 0.8, height, 0.3);
    const material = new THREE.MeshStandardMaterial({ 
      color: isLow ? 0xffaa00 : 0xff00ff,
      roughness: 0.6,
      metalness: 0.1
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(LANES[lane], height * 0.5, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    this.lane = lane;
    this.isLow = isLow;
    this.type = isLow ? 'barrier_low' : 'barrier_high';
    
    gameState.scene.add(this.mesh);
  }
  
  update(speed) {
    this.mesh.position.z += speed;
  }
  
  getBounds() {
    const height = this.isLow ? BARRIER_LOW_HEIGHT : BARRIER_HIGH_HEIGHT;
    const halfWidth = LANE_WIDTH * 0.8 * 0.5;
    const halfHeight = height * 0.5;
    const halfDepth = 0.15;
    
    return {
      min: new THREE.Vector3(
        this.mesh.position.x - halfWidth,
        this.mesh.position.y - halfHeight,
        this.mesh.position.z - halfDepth
      ),
      max: new THREE.Vector3(
        this.mesh.position.x + halfWidth,
        this.mesh.position.y + halfHeight,
        this.mesh.position.z + halfDepth
      )
    };
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export class Coin {
  constructor(lane, z) {
    const geometry = new THREE.TorusGeometry(0.3, 0.1, 8, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(LANES[lane], 1.2, z);
    this.mesh.rotation.x = Math.PI / 2;
    this.mesh.castShadow = true;
    
    this.lane = lane;
    this.rotationSpeed = 0.05;
    this.collected = false;
    
    gameState.scene.add(this.mesh);
  }
  
  update(speed) {
    this.mesh.position.z += speed;
    this.mesh.rotation.y += this.rotationSpeed;
  }
  
  collect() {
    if (!this.collected) {
      this.collected = true;
      gameState.score += COIN_VALUE;
    }
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export class Track {
  constructor(lane) {
    const geometry = new THREE.PlaneGeometry(LANE_WIDTH, 100);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(LANES[lane], 0, -50);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;
    
    gameState.scene.add(this.mesh);
  }
  
  update(speed) {
    this.mesh.position.z += speed;
    if (this.mesh.position.z > 50) {
      this.mesh.position.z = -50;
    }
  }
}