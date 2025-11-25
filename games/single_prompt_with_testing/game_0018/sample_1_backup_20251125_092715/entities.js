import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, LANE_POSITIONS, LANES, GROUND_Y, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y, z) {
    // Create player body (capsule-like shape)
    const bodyGeometry = new THREE.CapsuleGeometry(0.4, 1.2, 8, 16);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6600,
      roughness: 0.4,
      metalness: 0.2
    });
    this.body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.body.castShadow = true;
    
    // Create head
    const headGeometry = new THREE.SphereGeometry(0.35, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffcc99,
      roughness: 0.8
    });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.y = 1.0;
    this.head.castShadow = true;
    
    // Create container
    this.mesh = new THREE.Group();
    this.mesh.add(this.body);
    this.mesh.add(this.head);
    this.mesh.position.set(x, y, z);
    
    // Physics
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.currentLane = LANES.CENTER;
    this.targetLane = LANES.CENTER;
    this.isJumping = false;
    this.isSliding = false;
    this.onGround = true;
    
    // Movement
    this.jumpPower = 0.6;
    this.laneChangeSpeed = 0.15;
    this.slideTimer = 0;
    this.slideDuration = 0.5;
    
    // State
    this.isAlive = true;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    if (!this.isAlive) return;
    
    // Handle lane changes
    const targetX = LANE_POSITIONS[this.targetLane];
    const currentX = this.mesh.position.x;
    
    if (Math.abs(targetX - currentX) > 0.01) {
      const direction = Math.sign(targetX - currentX);
      this.mesh.position.x += direction * this.laneChangeSpeed;
      
      // Snap to target if close enough
      if (Math.abs(targetX - currentX) < this.laneChangeSpeed) {
        this.mesh.position.x = targetX;
        this.currentLane = this.targetLane;
      }
    }
    
    // Apply gravity
    if (!this.onGround) {
      this.velocity.y += gameState.gravity.y;
    }
    
    // Update position
    this.mesh.position.y += this.velocity.y;
    
    // Ground collision
    const groundLevel = this.isSliding ? GROUND_Y + 0.3 : GROUND_Y + 1.0;
    if (this.mesh.position.y <= groundLevel) {
      this.mesh.position.y = groundLevel;
      this.velocity.y = 0;
      this.onGround = true;
      this.isJumping = false;
    } else {
      this.onGround = false;
    }
    
    // Update slide timer
    if (this.isSliding) {
      this.slideTimer += deltaTime;
      if (this.slideTimer >= this.slideDuration) {
        this.endSlide();
      }
      
      // Crouch animation
      this.body.scale.y = 0.5;
      this.head.position.y = 0.5;
    } else {
      this.body.scale.y = 1.0;
      this.head.position.y = 1.0;
    }
    
    // Rotation for visual feedback
    if (this.isJumping) {
      this.mesh.rotation.x = Math.sin(gameState.frameCount * 0.1) * 0.3;
    } else {
      this.mesh.rotation.x = 0;
    }
    
    // Log position
    this.logPosition();
  }
  
  moveLeft() {
    if (this.targetLane > LANES.LEFT) {
      this.targetLane--;
    }
  }
  
  moveRight() {
    if (this.targetLane < LANES.RIGHT) {
      this.targetLane++;
    }
  }
  
  jump() {
    if (this.onGround && !this.isSliding) {
      this.velocity.y = this.jumpPower;
      this.isJumping = true;
      this.onGround = false;
    }
  }
  
  slide() {
    if (!this.isSliding && !this.isJumping) {
      this.isSliding = true;
      this.slideTimer = 0;
    }
  }
  
  endSlide() {
    this.isSliding = false;
    this.slideTimer = 0;
  }
  
  die() {
    this.isAlive = false;
    gameState.gamePhase = "GAME_OVER_LOSE";
  }
  
  getBoundingBox() {
    const size = new THREE.Vector3();
    if (this.isSliding) {
      size.set(0.8, 0.8, 1.0);
    } else {
      size.set(0.8, 2.2, 1.0);
    }
    
    return {
      min: new THREE.Vector3(
        this.mesh.position.x - size.x / 2,
        this.mesh.position.y - size.y / 2,
        this.mesh.position.z - size.z / 2
      ),
      max: new THREE.Vector3(
        this.mesh.position.x + size.x / 2,
        this.mesh.position.y + size.y / 2,
        this.mesh.position.z + size.z / 2
      )
    };
  }
  
  logPosition() {
    if (gameState.frameCount % 10 === 0) {
      window.logs.player_info.push({
        screen_x: 300,
        screen_y: 200,
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
    this.lane = lane;
    this.type = type; // 'low', 'high', 'train'
    
    if (type === 'low') {
      // Low barrier - must jump
      const geometry = new THREE.BoxGeometry(1.5, 0.8, 1.0);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        roughness: 0.6,
        metalness: 0.3
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(LANE_POSITIONS[lane], GROUND_Y + 0.4, z);
      this.height = 0.8;
    } else if (type === 'high') {
      // High barrier - must slide
      const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.0);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0xffff00,
        roughness: 0.6,
        metalness: 0.3
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(LANE_POSITIONS[lane], GROUND_Y + 1.5, z);
      this.height = 1.5;
    } else if (type === 'train') {
      // Train - must avoid lane
      const trainGroup = new THREE.Group();
      
      // Train body
      const bodyGeometry = new THREE.BoxGeometry(2.0, 2.5, 5.0);
      const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e90ff,
        roughness: 0.3,
        metalness: 0.6
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = GROUND_Y + 1.25;
      trainGroup.add(body);
      
      // Train front
      const frontGeometry = new THREE.BoxGeometry(2.0, 1.5, 1.0);
      const frontMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 0.3
      });
      const front = new THREE.Mesh(frontGeometry, frontMaterial);
      front.position.set(0, GROUND_Y + 1.0, 3.0);
      trainGroup.add(front);
      
      this.mesh = trainGroup;
      this.mesh.position.set(LANE_POSITIONS[lane], 0, z);
      this.height = 2.5;
    }
    
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.active = true;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Move towards player
    this.mesh.position.z += gameState.speed;
    
    // Destroy if behind player
    if (this.mesh.position.z > 10) {
      this.destroy();
    }
  }
  
  getBoundingBox() {
    let size;
    if (this.type === 'low') {
      size = new THREE.Vector3(1.5, 0.8, 1.0);
    } else if (this.type === 'high') {
      size = new THREE.Vector3(1.5, 1.5, 1.0);
    } else {
      size = new THREE.Vector3(2.0, 2.5, 5.0);
    }
    
    return {
      min: new THREE.Vector3(
        this.mesh.position.x - size.x / 2,
        this.mesh.position.y - size.y / 2,
        this.mesh.position.z - size.z / 2
      ),
      max: new THREE.Vector3(
        this.mesh.position.x + size.x / 2,
        this.mesh.position.y + size.y / 2,
        this.mesh.position.z + size.z / 2
      )
    };
  }
  
  destroy() {
    this.active = false;
    gameState.scene.remove(this.mesh);
    const index = gameState.obstacles.indexOf(this);
    if (index > -1) {
      gameState.obstacles.splice(index, 1);
    }
  }
}

export class Coin {
  constructor(lane, z, y = GROUND_Y + 2.0) {
    const geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(LANE_POSITIONS[lane], y, z);
    this.mesh.rotation.x = Math.PI / 2;
    
    this.lane = lane;
    this.collected = false;
    this.rotationSpeed = 0.05;
    
    gameState.scene.add(this.mesh);
  }
  
  update(deltaTime) {
    // Rotate
    this.mesh.rotation.y += this.rotationSpeed;
    
    // Move towards player
    this.mesh.position.z += gameState.speed;
    
    // Bob up and down
    this.mesh.position.y += Math.sin(gameState.frameCount * 0.05) * 0.01;
    
    // Check collection
    if (!this.collected && gameState.player) {
      const distance = this.mesh.position.distanceTo(gameState.player.mesh.position);
      if (distance < 1.0) {
        this.collect();
      }
    }
    
    // Destroy if behind player
    if (this.mesh.position.z > 10) {
      this.destroy();
    }
  }
  
  collect() {
    this.collected = true;
    gameState.score += 10;
    gameState.coins_collected++;
    this.destroy();
  }
  
  destroy() {
    gameState.scene.remove(this.mesh);
    const index = gameState.coins.indexOf(this);
    if (index > -1) {
      gameState.coins.splice(index, 1);
    }
  }
}

export class Track {
  constructor() {
    this.meshes = [];
    this.createTracks();
  }
  
  createTracks() {
    // Create three parallel tracks
    for (let i = 0; i < 3; i++) {
      const trackGroup = new THREE.Group();
      
      // Rails
      const railGeometry = new THREE.BoxGeometry(0.1, 0.1, 100);
      const railMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x888888,
        metalness: 0.8,
        roughness: 0.3
      });
      
      const rail1 = new THREE.Mesh(railGeometry, railMaterial);
      rail1.position.set(LANE_POSITIONS[i] - 0.4, GROUND_Y, -25);
      const rail2 = new THREE.Mesh(railGeometry, railMaterial);
      rail2.position.set(LANE_POSITIONS[i] + 0.4, GROUND_Y, -25);
      
      trackGroup.add(rail1);
      trackGroup.add(rail2);
      
      // Ties (sleepers)
      for (let j = 0; j < 50; j++) {
        const tieGeometry = new THREE.BoxGeometry(1.0, 0.05, 0.15);
        const tieMaterial = new THREE.MeshStandardMaterial({ 
          color: 0x5c4033,
          roughness: 0.9
        });
        const tie = new THREE.Mesh(tieGeometry, tieMaterial);
        tie.position.set(LANE_POSITIONS[i], GROUND_Y - 0.05, j * 2 - 25);
        tie.receiveShadow = true;
        trackGroup.add(tie);
      }
      
      gameState.scene.add(trackGroup);
      this.meshes.push(trackGroup);
    }
    
    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(20, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d2d2d,
      roughness: 0.9
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, GROUND_Y - 0.1, -25);
    ground.receiveShadow = true;
    gameState.scene.add(ground);
    this.meshes.push(ground);
  }
}