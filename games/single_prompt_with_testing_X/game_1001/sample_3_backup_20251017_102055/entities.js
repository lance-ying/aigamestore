// entities.js - Entity classes
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { TRACK_POSITIONS, JUMP_POWER, GRAVITY, SLIDE_DURATION, LANE_CHANGE_SPEED } from './globals.js';

export class Player {
  constructor(x, y, z) {
    // Create player mesh (robot-like character)
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.6);
    const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    this.mesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.mesh.position.set(x, y, z);
    
    // Add head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshPhongMaterial({ color: 0x00ffff });
    this.head = new THREE.Mesh(headGeometry, headMaterial);
    this.head.position.set(0, 1.2, 0);
    this.mesh.add(this.head);

    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.targetLane = 1; // Start in center lane (0=left, 1=center, 2=right)
    this.currentLane = 1;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.onGround = true;
    this.normalHeight = 1.6;
    this.slideHeight = 0.8;
  }

  update() {
    // Apply gravity
    if (!this.onGround) {
      this.velocity.y -= GRAVITY;
    }

    // Update vertical position
    this.mesh.position.y += this.velocity.y;

    // Ground collision
    if (this.mesh.position.y <= 0.8) {
      this.mesh.position.y = 0.8;
      this.velocity.y = 0;
      this.onGround = true;
      this.isJumping = false;
    }

    // Handle sliding
    if (this.isSliding) {
      this.slideTimer--;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
        this.mesh.scale.y = 1;
        this.mesh.position.y = 0.8;
      }
    }

    // Smooth lane changing
    const targetX = TRACK_POSITIONS[this.targetLane];
    const dx = targetX - this.mesh.position.x;
    if (Math.abs(dx) > 0.05) {
      this.mesh.position.x += dx * LANE_CHANGE_SPEED;
    } else {
      this.mesh.position.x = targetX;
      this.currentLane = this.targetLane;
    }

    // Bobbing animation when running
    if (this.onGround && !this.isSliding) {
      this.head.position.y = 1.2 + Math.sin(Date.now() * 0.01) * 0.1;
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
    if (this.onGround && !this.isSliding) {
      this.velocity.y = JUMP_POWER;
      this.onGround = false;
      this.isJumping = true;
    }
  }

  slide() {
    if (this.onGround && !this.isSliding) {
      this.isSliding = true;
      this.slideTimer = SLIDE_DURATION;
      this.mesh.scale.y = 0.5;
      this.mesh.position.y = 0.4;
    }
  }

  getBoundingBox() {
    const box = new THREE.Box3().setFromObject(this.mesh);
    return box;
  }
}

export class Obstacle {
  constructor(type, lane, z) {
    this.type = type;
    this.lane = lane;
    this.collected = false;

    const x = TRACK_POSITIONS[lane];
    
    if (type === 'TRAIN') {
      // Large train obstacle
      const geometry = new THREE.BoxGeometry(1.5, 3, 4);
      const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(x, 1.5, z);
      
      // Add train windows
      const windowGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.8);
      const windowMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00, emissive: 0x444400 });
      for (let i = -1; i <= 1; i++) {
        const window = new THREE.Mesh(windowGeometry, windowMaterial);
        window.position.set(0.8, 0.5, i * 1.2);
        this.mesh.add(window);
      }
    } else if (type === 'BARRIER') {
      // High barrier (need to slide under)
      const geometry = new THREE.BoxGeometry(2, 1, 0.5);
      const material = new THREE.MeshPhongMaterial({ color: 0xff8800 });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(x, 2, z);
      
      // Add stripes
      const stripeGeometry = new THREE.BoxGeometry(2.1, 0.2, 0.6);
      const stripeMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
      const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
      this.mesh.add(stripe);
    } else if (type === 'LOW_BARRIER') {
      // Low barrier (need to jump over)
      const geometry = new THREE.BoxGeometry(2, 0.8, 0.5);
      const material = new THREE.MeshPhongMaterial({ color: 0x8800ff });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(x, 0.4, z);
      
      // Add warning pattern
      const topGeometry = new THREE.BoxGeometry(2.1, 0.1, 0.6);
      const topMaterial = new THREE.MeshPhongMaterial({ color: 0xffff00 });
      const top = new THREE.Mesh(topGeometry, topMaterial);
      top.position.y = 0.4;
      this.mesh.add(top);
    } else if (type === 'COIN') {
      // Collectible coin
      const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0xffd700, 
        emissive: 0x886600,
        shininess: 100 
      });
      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.position.set(x, 1.5, z);
      this.mesh.rotation.x = Math.PI / 2;
    }
  }

  update(speed) {
    // Move obstacle towards player
    this.mesh.position.z -= speed;
    
    // Rotate coins for visual effect
    if (this.type === 'COIN') {
      this.mesh.rotation.y += 0.05;
    }
  }

  getBoundingBox() {
    const box = new THREE.Box3().setFromObject(this.mesh);
    return box;
  }

  shouldDespawn() {
    return this.mesh.position.z < -10;
  }
}

export class Track {
  constructor(scene) {
    this.meshes = [];
    
    // Create ground plane segments
    for (let i = 0; i < 10; i++) {
      const geometry = new THREE.PlaneGeometry(15, 10);
      const material = new THREE.MeshPhongMaterial({ 
        color: 0x333333,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0;
      mesh.position.z = i * 10 - 10;
      scene.add(mesh);
      this.meshes.push(mesh);
    }

    // Create track rails
    for (let lane = 0; lane < 3; lane++) {
      const x = TRACK_POSITIONS[lane];
      
      // Left rail
      const leftRailGeometry = new THREE.BoxGeometry(0.1, 0.1, 100);
      const railMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
      const leftRail = new THREE.Mesh(leftRailGeometry, railMaterial);
      leftRail.position.set(x - 1, 0.05, 30);
      scene.add(leftRail);
      
      // Right rail
      const rightRail = new THREE.Mesh(leftRailGeometry, railMaterial);
      rightRail.position.set(x + 1, 0.05, 30);
      scene.add(rightRail);
    }

    // Add side walls
    const wallGeometry = new THREE.BoxGeometry(0.5, 5, 100);
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
    
    const leftWall = new THREE.Mesh(wallGeometry, wallMaterial);
    leftWall.position.set(-8, 2.5, 30);
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(wallGeometry, wallMaterial);
    rightWall.position.set(8, 2.5, 30);
    scene.add(rightWall);
  }

  update(speed) {
    // Scroll ground segments
    this.meshes.forEach(mesh => {
      mesh.position.z -= speed;
      if (mesh.position.z < -15) {
        mesh.position.z += 100;
      }
    });
  }
}