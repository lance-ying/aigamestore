import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_CENTER, LANES, LANE_SWITCH_SPEED, JUMP_POWER, JUMP_DURATION, SLIDE_DURATION, OBSTACLE_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y, z) {
    // Create player mesh (capsule-like shape)
    const bodyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00aaff,
      roughness: 0.4,
      metalness: 0.2
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Physics
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.targetLane = LANE_CENTER;
    this.currentLane = LANE_CENTER;
    
    // State
    this.isJumping = false;
    this.isSliding = false;
    this.jumpTime = 0;
    this.slideTime = 0;
    this.health = 100;
    this.score = 0;
    this.normalHeight = 1.5;
    this.slideHeight = 0.8;
    
    // Collision box
    this.boundingBox = new THREE.Box3();
    this.updateBoundingBox();
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Lane switching
    const targetX = this.targetLane;
    const dx = targetX - this.mesh.position.x;
    if (Math.abs(dx) > 0.01) {
      this.mesh.position.x += Math.sign(dx) * Math.min(Math.abs(dx), LANE_SWITCH_SPEED);
      this.currentLane = this.targetLane;
    }
    
    // Jumping
    if (this.isJumping) {
      this.jumpTime += deltaTime;
      const jumpProgress = this.jumpTime / JUMP_DURATION;
      
      if (jumpProgress >= 1) {
        this.isJumping = false;
        this.jumpTime = 0;
        this.mesh.position.y = 0.75;
        this.velocity.y = 0;
      } else {
        // Parabolic jump arc
        const jumpHeight = JUMP_POWER * 4 * jumpProgress * (1 - jumpProgress);
        this.mesh.position.y = 0.75 + jumpHeight;
      }
    }
    
    // Sliding
    if (this.isSliding) {
      this.slideTime += deltaTime;
      if (this.slideTime >= SLIDE_DURATION) {
        this.isSliding = false;
        this.slideTime = 0;
        // Return to normal height
        const geometry = this.mesh.geometry;
        geometry.dispose();
        this.mesh.geometry = new THREE.BoxGeometry(0.6, this.normalHeight, 0.6);
        this.mesh.position.y = 0.75;
      }
    }
    
    // Update bounding box for collision
    this.updateBoundingBox();
    
    // Log position
    this.logPosition();
  }
  
  updateBoundingBox() {
    this.boundingBox.setFromObject(this.mesh);
  }
  
  switchLane(direction) {
    if (this.isJumping || this.isSliding) return;
    
    const currentIndex = LANES.indexOf(this.targetLane);
    const newIndex = Math.max(0, Math.min(LANES.length - 1, currentIndex + direction));
    this.targetLane = LANES[newIndex];
  }
  
  jump() {
    if (this.isJumping || this.isSliding) return;
    this.isJumping = true;
    this.jumpTime = 0;
  }
  
  slide() {
    if (this.isJumping || this.isSliding) return;
    this.isSliding = true;
    this.slideTime = 0;
    
    // Change geometry to sliding shape
    const geometry = this.mesh.geometry;
    geometry.dispose();
    this.mesh.geometry = new THREE.BoxGeometry(0.6, this.slideHeight, 0.6);
    this.mesh.position.y = this.slideHeight / 2;
  }
  
  takeDamage() {
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  logPosition() {
    if (gameState.frameCount % 30 === 0) {
      const screenPos = this.mesh.position.clone().project(gameState.camera);
      window.logs.player_info.push({
        screen_x: (screenPos.x + 1) * CANVAS_WIDTH / 2,
        screen_y: (1 - screenPos.y) * CANVAS_HEIGHT / 2,
        game_x: this.mesh.position.x,
        game_y: this.mesh.position.y,
        game_z: this.mesh.position.z,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export class Obstacle {
  constructor(lane, z, type) {
    this.type = type;
    this.lane = lane;
    
    let geometry, material;
    
    switch(type) {
      case OBSTACLE_TYPES.TRAIN:
        geometry = new THREE.BoxGeometry(1.5, 2, 4);
        material = new THREE.MeshStandardMaterial({ 
          color: 0xff3333,
          roughness: 0.3,
          metalness: 0.6
        });
        break;
      case OBSTACLE_TYPES.LOW_BARRIER:
        geometry = new THREE.BoxGeometry(1.2, 0.8, 0.8);
        material = new THREE.MeshStandardMaterial({ 
          color: 0xffaa00,
          roughness: 0.7
        });
        break;
      case OBSTACLE_TYPES.HIGH_BARRIER:
        geometry = new THREE.BoxGeometry(1.2, 1.8, 0.8);
        material = new THREE.MeshStandardMaterial({ 
          color: 0x8800ff,
          roughness: 0.7
        });
        break;
    }
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(lane, this.getYPosition(), z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    this.boundingBox = new THREE.Box3();
    this.updateBoundingBox();
    
    gameState.scene.add(this.mesh);
  }
  
  getYPosition() {
    switch(this.type) {
      case OBSTACLE_TYPES.TRAIN:
        return 1;
      case OBSTACLE_TYPES.LOW_BARRIER:
        return 0.4;
      case OBSTACLE_TYPES.HIGH_BARRIER:
        return 0.9;
      default:
        return 0;
    }
  }
  
  update(deltaTime) {
    // Move toward player (simulate forward movement)
    this.mesh.position.z -= gameState.gameSpeed * 60 * deltaTime;
    this.updateBoundingBox();
  }
  
  updateBoundingBox() {
    this.boundingBox.setFromObject(this.mesh);
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export class Coin {
  constructor(lane, z, height = 1.5) {
    const geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(lane, height, z);
    this.mesh.rotation.x = Math.PI / 2;
    
    this.rotationSpeed = 0.05;
    this.value = 10;
    
    this.boundingBox = new THREE.Box3();
    this.updateBoundingBox();
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Rotate
    this.mesh.rotation.y += this.rotationSpeed;
    
    // Move toward player
    this.mesh.position.z -= gameState.gameSpeed * 60 * deltaTime;
    
    this.updateBoundingBox();
  }
  
  updateBoundingBox() {
    this.boundingBox.setFromObject(this.mesh);
  }
  
  collect() {
    gameState.score += this.value;
    this.destroy();
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
  }
}

export class TrackSection {
  constructor(z) {
    const group = new THREE.Group();
    
    // Create three lanes
    for (let i = 0; i < 3; i++) {
      const laneGeometry = new THREE.PlaneGeometry(1.5, 20);
      const laneMaterial = new THREE.MeshStandardMaterial({ 
        color: i === 1 ? 0x444444 : 0x555555,
        roughness: 0.9,
        side: THREE.DoubleSide
      });
      const lane = new THREE.Mesh(laneGeometry, laneMaterial);
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(LANES[i], 0, 0);
      lane.receiveShadow = true;
      group.add(lane);
      
      // Add lane markings
      if (i < 2) {
        const lineGeometry = new THREE.PlaneGeometry(0.1, 20);
        const lineMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xffff00,
          side: THREE.DoubleSide
        });
        const line = new THREE.Mesh(lineGeometry, lineMaterial);
        line.rotation.x = -Math.PI / 2;
        line.position.set((LANES[i] + LANES[i + 1]) / 2, 0.01, 0);
        group.add(line);
      }
    }
    
    this.mesh = group;
    this.mesh.position.z = z;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    this.mesh.position.z -= gameState.gameSpeed * 60 * deltaTime;
  }
  
  destroy() {
    this.mesh.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
    gameState.scene.remove(this.mesh);
  }
}