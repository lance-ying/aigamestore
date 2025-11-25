import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_POSITIONS, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y, z) {
    // Create player mesh (runner character)
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x00ff00,
      roughness: 0.5,
      metalness: 0.1
    });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Add head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 1.2;
    this.mesh.add(this.head);
    
    // Game properties
    this.targetLane = 1; // Start in middle lane (index 1)
    this.currentLane = 1;
    this.state = "running"; // running, jumping, sliding
    this.jumpVelocity = 0;
    this.jumpHeight = 0;
    this.baseY = y;
    
    // Animation
    this.animTimer = 0;
    this.lastPosition = new THREE.Vector3().copy(this.mesh.position);
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Smooth lane transition
    const targetX = LANE_POSITIONS[this.targetLane];
    this.mesh.position.x += (targetX - this.mesh.position.x) * 0.15;
    
    if (Math.abs(targetX - this.mesh.position.x) < 0.01) {
      this.currentLane = this.targetLane;
    }
    
    // Handle jumping
    if (this.state === "jumping") {
      this.jumpVelocity -= 0.03; // Gravity
      this.jumpHeight += this.jumpVelocity;
      
      if (this.jumpHeight <= 0) {
        this.jumpHeight = 0;
        this.jumpVelocity = 0;
        this.state = "running";
        this.mesh.scale.y = 1;
      }
      
      this.mesh.position.y = this.baseY + this.jumpHeight;
    }
    
    // Handle sliding
    if (this.state === "sliding") {
      this.animTimer += deltaTime;
      if (this.animTimer >= 0.5) {
        this.state = "running";
        this.mesh.scale.y = 1;
        this.mesh.position.y = this.baseY;
        this.animTimer = 0;
      }
    }
    
    // Running animation (bob)
    if (this.state === "running") {
      this.animTimer += deltaTime * 10;
      this.mesh.position.y = this.baseY + Math.sin(this.animTimer) * 0.05;
    }
    
    // Log position
    if (this.mesh.position.distanceTo(this.lastPosition) > 0.1) {
      this.logPosition();
      this.lastPosition.copy(this.mesh.position);
    }
  }
  
  moveLeft() {
    if (this.targetLane > 0) {
      this.targetLane--;
    }
  }
  
  moveRight() {
    if (this.targetLane < 2) {
      this.targetLane++;
    }
  }
  
  jump() {
    if (this.state === "running") {
      this.state = "jumping";
      this.jumpVelocity = 0.6;
    }
  }
  
  slide() {
    if (this.state === "running") {
      this.state = "sliding";
      this.mesh.scale.y = 0.5;
      this.mesh.position.y = this.baseY - 0.4;
      this.animTimer = 0;
    }
  }
  
  getBounds() {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z,
      width: 0.8,
      height: this.state === "sliding" ? 0.8 : 1.6,
      depth: 0.8
    };
  }
  
  logPosition() {
    if (window.logs && window.logs.player_info) {
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

export class Train {
  constructor(lane, z) {
    // Create train obstacle
    const geometry = new THREE.BoxGeometry(1.5, 2, 4);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      roughness: 0.3,
      metalness: 0.7
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(LANE_POSITIONS[lane], 1, z);
    this.mesh.castShadow = true;
    
    // Add windows
    const windowGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.5);
    const windowMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
    const window1 = new THREE.Mesh(windowGeometry, windowMaterial);
    window1.position.set(0, 0.4, 1.5);
    this.mesh.add(window1);
    
    this.lane = lane;
    this.type = "train";
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Trains don't move, the world moves
  }
  
  getBounds() {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z,
      width: 1.5,
      height: 2,
      depth: 4
    };
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
  }
}

export class Barrier {
  constructor(lane, z) {
    // Low barrier to jump over
    const geometry = new THREE.BoxGeometry(1.5, 0.6, 0.8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffaa00,
      roughness: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(LANE_POSITIONS[lane], 0.3, z);
    this.mesh.castShadow = true;
    
    this.lane = lane;
    this.type = "barrier";
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Rotate for visual effect
    this.mesh.rotation.y += deltaTime * 2;
  }
  
  getBounds() {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z,
      width: 1.5,
      height: 0.6,
      depth: 0.8
    };
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
  }
}

export class OverheadBarrier {
  constructor(lane, z) {
    // High barrier to slide under
    const geometry = new THREE.BoxGeometry(1.5, 0.6, 0.8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x00aaff,
      roughness: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(LANE_POSITIONS[lane], 2.5, z);
    this.mesh.castShadow = true;
    
    // Support poles
    const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2.5, 8);
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    
    const pole1 = new THREE.Mesh(poleGeometry, poleMaterial);
    pole1.position.set(-0.6, -1.25, 0);
    this.mesh.add(pole1);
    
    const pole2 = new THREE.Mesh(poleGeometry, poleMaterial);
    pole2.position.set(0.6, -1.25, 0);
    this.mesh.add(pole2);
    
    this.lane = lane;
    this.type = "overhead";
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Pulse animation
    const scale = 1 + Math.sin(gameState.frameCount * 0.1) * 0.05;
    this.mesh.scale.y = scale;
  }
  
  getBounds() {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z,
      width: 1.5,
      height: 0.6,
      depth: 0.8
    };
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
  }
}

export class Coin {
  constructor(lane, z) {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      emissive: 0xffff00,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(LANE_POSITIONS[lane], 1, z);
    this.mesh.rotation.x = Math.PI / 2;
    
    this.lane = lane;
    this.value = 10;
    this.collected = false;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Rotate
    this.mesh.rotation.y += deltaTime * 3;
    
    // Bob slightly
    this.mesh.position.y = 1 + Math.sin(gameState.frameCount * 0.05) * 0.1;
    
    // Check collection
    if (!this.collected && gameState.player) {
      const distance = Math.abs(this.mesh.position.x - gameState.player.mesh.position.x);
      const zDistance = Math.abs(this.mesh.position.z - gameState.player.mesh.position.z);
      
      if (distance < 0.8 && zDistance < 1) {
        this.collect();
      }
    }
  }
  
  collect() {
    this.collected = true;
    gameState.score += this.value;
    this.destroy();
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
  }
}

export class TrackSegment {
  constructor(z) {
    const group = new THREE.Group();
    
    // Create three lanes
    for (let i = 0; i < 3; i++) {
      const laneGeometry = new THREE.PlaneGeometry(2, 10);
      const laneMaterial = new THREE.MeshStandardMaterial({ 
        color: i === 1 ? 0x444444 : 0x333333,
        roughness: 0.9
      });
      const lane = new THREE.Mesh(laneGeometry, laneMaterial);
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(LANE_POSITIONS[i], 0, z);
      lane.receiveShadow = true;
      group.add(lane);
      
      // Add lane markings
      const markingGeometry = new THREE.PlaneGeometry(0.2, 1);
      const markingMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
      for (let j = 0; j < 5; j++) {
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(LANE_POSITIONS[i], 0.01, z - 4 + j * 2);
        group.add(marking);
      }
    }
    
    this.mesh = group;
    this.z = z;
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Track segments are managed by the world scroller
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
  }
}

export class TunnelSegment {
  constructor(z) {
    const group = new THREE.Group();
    
    // Tunnel walls
    const wallGeometry = new THREE.PlaneGeometry(10, 10);
    const wallMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      roughness: 0.9,
      side: THREE.DoubleSide
    });
    
    // Left wall
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-5, 5, z);
    leftWall.receiveShadow = true;
    group.add(leftWall);
    
    // Right wall
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(5, 5, z);
    rightWall.receiveShadow = true;
    group.add(rightWall);
    
    // Ceiling
    const ceiling = new THREE.Mesh(wallGeometry, wallMaterial);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, 10, z);
    ceiling.receiveShadow = true;
    group.add(ceiling);
    
    // Add lights along tunnel
    for (let i = 0; i < 3; i++) {
      const lightGeometry = new THREE.SphereGeometry(0.2, 8, 8);
      const lightMaterial = new THREE.MeshBasicMaterial({ color: 0xffffaa });
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set((i - 1) * 3, 9, z);
      group.add(light);
    }
    
    this.mesh = group;
    this.z = z;
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Tunnel segments are managed by the world scroller
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
  }
}