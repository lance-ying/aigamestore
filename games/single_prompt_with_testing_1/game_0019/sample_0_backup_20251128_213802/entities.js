// entities.js - Game entity classes
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y, z) {
    // Create 3D mesh - SpongeBob style character
    const geometry = new THREE.BoxGeometry(1, 1.5, 0.8);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffdc00,
      roughness: 0.5,
      metalness: 0.1
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    // Add eyes
    const eyeGeometry = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    
    this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.leftEye.position.set(-0.25, 0.3, 0.41);
    this.mesh.add(this.leftEye);
    
    this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    this.rightEye.position.set(0.25, 0.3, 0.41);
    this.mesh.add(this.rightEye);
    
    // Physics properties
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.acceleration = new THREE.Vector3(0, 0, 0);
    this.speed = 0.08;  // Reduced from 0.15 for slower movement
    this.jumpPower = 0.4;
    this.jumpCount = 0;
    this.maxJumps = 1;
    this.onGround = false;
    this.mass = 1.0;
    
    // Size
    this.size = new THREE.Vector3(1, 1.5, 0.8);
    
    // Game properties
    this.attackCooldown = 0;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
    
    gameState.scene.add(this.mesh);
  }
  
  update() {
    // Apply gravity
    if (!this.onGround) {
      this.acceleration.add(gameState.gravity);
    }
    
    // Update velocity
    this.velocity.add(this.acceleration);
    
    // Apply friction when on ground
    if (this.onGround) {
      this.velocity.x *= 0.85;
      this.velocity.z *= 0.85;
    } else {
      this.velocity.multiplyScalar(0.98);
    }
    
    // Clamp velocity
    const maxSpeed = 0.2;  // Reduced from 0.3
    if (Math.abs(this.velocity.x) > maxSpeed) {
      this.velocity.x = Math.sign(this.velocity.x) * maxSpeed;
    }
    if (Math.abs(this.velocity.z) > maxSpeed) {
      this.velocity.z = Math.sign(this.velocity.z) * maxSpeed;
    }
    
    // Update position
    this.mesh.position.add(this.velocity);
    
    // Update max jumps
    this.maxJumps = gameState.abilities.doubleJump ? 2 : 1;
    
    // Update attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Update invincibility
    if (gameState.invincible) {
      gameState.invincibilityTimer--;
      if (gameState.invincibilityTimer <= 0) {
        gameState.invincible = false;
      }
      
      // Flash effect
      if (gameState.invincibilityTimer % 10 < 5) {
        this.mesh.visible = false;
      } else {
        this.mesh.visible = true;
      }
    } else {
      this.mesh.visible = true;
    }
    
    // Check ground collision
    this.checkGroundCollision();
    
    // Reset acceleration
    this.acceleration.set(0, 0, 0);
    
    // Check for hazard death
    if (this.mesh.position.y < -10) {
      this.respawnAtCheckpoint();
    }
    
    // Log position changes
    const dx = Math.abs(this.mesh.position.x - this.lastLoggedX);
    const dy = Math.abs(this.mesh.position.y - this.lastLoggedY);
    if (dx > 2 || dy > 2) {
      if (window.logs && window.logs.player_info) {
        window.logs.player_info.push({
          screen_x: this.mesh.position.x * 20,
          screen_y: 300 - this.mesh.position.y * 20,
          game_x: this.mesh.position.x,
          game_y: this.mesh.position.y,
          game_z: this.mesh.position.z,
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
      this.lastLoggedX = this.mesh.position.x;
      this.lastLoggedY = this.mesh.position.y;
    }
  }
  
  checkGroundCollision() {
    this.onGround = false;
    const playerBottom = this.mesh.position.y - this.size.y / 2;
    
    // Check collision with platforms
    for (const platform of gameState.platforms) {
      if (this.checkPlatformCollision(platform)) {
        this.onGround = true;
        this.jumpCount = 0;
        break;
      }
    }
  }
  
  checkPlatformCollision(platform) {
    const px = this.mesh.position.x;
    const py = this.mesh.position.y;
    const pz = this.mesh.position.z;
    
    const platX = platform.mesh.position.x;
    const platY = platform.mesh.position.y;
    const platZ = platform.mesh.position.z;
    
    const playerBottom = py - this.size.y / 2;
    const platTop = platY + platform.size.y / 2;
    
    // Check if player is above platform
    if (Math.abs(playerBottom - platTop) < 0.2 &&
        px > platX - platform.size.x / 2 && px < platX + platform.size.x / 2 &&
        pz > platZ - platform.size.z / 2 && pz < platZ + platform.size.z / 2) {
      
      // Snap to platform
      this.mesh.position.y = platTop + this.size.y / 2;
      this.velocity.y = 0;
      return true;
    }
    
    return false;
  }
  
  moveLeft() {
    this.acceleration.x -= this.speed;
  }
  
  moveRight() {
    this.acceleration.x += this.speed;
  }
  
  moveForward() {
    this.acceleration.z -= this.speed;
  }
  
  moveBackward() {
    this.acceleration.z += this.speed;
  }
  
  jump() {
    if (this.jumpCount < this.maxJumps) {
      this.velocity.y = this.jumpPower;
      this.jumpCount++;
      this.onGround = false;
    }
  }
  
  karateKick() {
    if (!gameState.abilities.karateKick || this.attackCooldown > 0) return;
    
    this.attackCooldown = 30;
    
    // Check for barriers in range
    gameState.barriers = gameState.barriers.filter(barrier => {
      const dx = barrier.mesh.position.x - this.mesh.position.x;
      const dz = barrier.mesh.position.z - this.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      
      if (dist < 3) {
        gameState.scene.remove(barrier.mesh);
        return false;
      }
      return true;
    });
  }
  
  hookSwing() {
    if (!gameState.abilities.hookSwing) return;
    
    // Check for swing points in range
    for (let swing of gameState.swingPoints) {
      const dx = swing.mesh.position.x - this.mesh.position.x;
      const dy = swing.mesh.position.y - this.mesh.position.y;
      const dz = swing.mesh.position.z - this.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < 4) {
        // Apply swing force
        this.velocity.x = 0.4;
        this.velocity.y = 0.3;
        return;
      }
    }
  }
  
  respawnAtCheckpoint() {
    gameState.health--;
    
    if (gameState.health <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      if (window.logs && window.logs.game_info) {
        window.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_LOSE", reason: "health_depleted" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
      return;
    }
    
    // Respawn at checkpoint
    this.mesh.position.set(
      gameState.lastCheckpoint.x,
      gameState.lastCheckpoint.y,
      gameState.lastCheckpoint.z
    );
    this.velocity.set(0, 0, 0);
    
    gameState.invincible = true;
    gameState.invincibilityTimer = 120;
  }
  
  takeDamage() {
    if (gameState.invincible) return;
    
    gameState.health--;
    gameState.invincible = true;
    gameState.invincibilityTimer = 120;
    
    // Knockback
    this.velocity.y = 0.3;
    
    if (gameState.health <= 0) {
      gameState.gamePhase = "GAME_OVER_LOSE";
      if (window.logs && window.logs.game_info) {
        window.logs.game_info.push({
          data: { gamePhase: "GAME_OVER_LOSE", reason: "health_depleted" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

export class Platform {
  constructor(x, y, z, width, height, depth, color = 0x64c864) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: color,
      roughness: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    
    this.size = new THREE.Vector3(width, height, depth);
    
    gameState.scene.add(this.mesh);
  }
}

export class Enemy {
  constructor(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xc83232 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Add angry eyes
    const eyeGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.2, 0.1, 0.45);
    this.mesh.add(leftEye);
    
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.2, 0.1, 0.45);
    this.mesh.add(rightEye);
    
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.speed = 0.05;
    this.patrolSpeed = 0.05;
    this.direction = 1;
    this.patrolRange = 3;
    this.startX = x;
    this.radius = 0.5;
    
    gameState.scene.add(this.mesh);
  }
  
  update() {
    // Simple patrol AI
    if (this.mesh.position.x > this.startX + this.patrolRange) {
      this.direction = -1;
    } else if (this.mesh.position.x < this.startX - this.patrolRange) {
      this.direction = 1;
    }
    
    this.mesh.position.x += this.patrolSpeed * this.direction;
    
    // Check collision with player
    if (gameState.player) {
      const dx = this.mesh.position.x - gameState.player.mesh.position.x;
      const dy = this.mesh.position.y - gameState.player.mesh.position.y;
      const dz = this.mesh.position.z - gameState.player.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < 1) {
        gameState.player.takeDamage();
      }
    }
  }
}

export class Coin {
  constructor(x, y, z) {
    const geometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffd700,
      emissive: 0xffd700,
      emissiveIntensity: 0.3
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    this.collected = false;
    this.rotation = 0;
    this.bobOffset = 0;
    
    gameState.scene.add(this.mesh);
  }
  
  update() {
    if (this.collected) return;
    
    this.rotation += 0.05;
    this.mesh.rotation.y = this.rotation;
    
    this.bobOffset += 0.05;
    this.mesh.position.y += Math.sin(this.bobOffset) * 0.01;
    
    // Check collision with player
    if (gameState.player) {
      const dx = this.mesh.position.x - gameState.player.mesh.position.x;
      const dy = this.mesh.position.y - gameState.player.mesh.position.y;
      const dz = this.mesh.position.z - gameState.player.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < 1) {
        this.collect();
      }
    }
  }
  
  collect() {
    this.collected = true;
    gameState.scene.remove(this.mesh);
    gameState.score += 10;
    
    // Check for ability unlocks
    if (!gameState.abilities.karateKick && gameState.score >= gameState.abilityThresholds.karateKick) {
      gameState.abilities.karateKick = true;
      if (window.logs && window.logs.game_info) {
        window.logs.game_info.push({
          data: { event: "ability_unlocked", ability: "karateKick" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (!gameState.abilities.doubleJump && gameState.score >= gameState.abilityThresholds.doubleJump) {
      gameState.abilities.doubleJump = true;
      if (window.logs && window.logs.game_info) {
        window.logs.game_info.push({
          data: { event: "ability_unlocked", ability: "doubleJump" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
    
    if (!gameState.abilities.hookSwing && gameState.score >= gameState.abilityThresholds.hookSwing) {
      gameState.abilities.hookSwing = true;
      if (window.logs && window.logs.game_info) {
        window.logs.game_info.push({
          data: { event: "ability_unlocked", ability: "hookSwing" },
          framecount: gameState.frameCount,
          timestamp: Date.now()
        });
      }
    }
  }
}

export class Barrier {
  constructor(x, y, z, width, height, depth) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x9664c8,
      transparent: true,
      opacity: 0.8
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    
    this.size = new THREE.Vector3(width, height, depth);
    
    gameState.scene.add(this.mesh);
  }
}

export class Checkpoint {
  constructor(x, y, z) {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x646464
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Add flag
    const flagGeometry = new THREE.PlaneGeometry(1, 0.6);
    const flagMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xffff00,
      side: THREE.DoubleSide
    });
    this.flag = new THREE.Mesh(flagGeometry, flagMaterial);
    this.flag.position.set(0.5, 0.7, 0);
    this.mesh.add(this.flag);
    
    this.activated = false;
    
    gameState.scene.add(this.mesh);
  }
  
  update() {
    if (this.activated) return;
    
    if (gameState.player) {
      const dx = this.mesh.position.x - gameState.player.mesh.position.x;
      const dy = this.mesh.position.y - gameState.player.mesh.position.y;
      const dz = this.mesh.position.z - gameState.player.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < 2) {
        this.activate();
      }
    }
  }
  
  activate() {
    this.activated = true;
    this.flag.material.color.setHex(0x00ff00);
    gameState.lastCheckpoint = {
      x: this.mesh.position.x,
      y: this.mesh.position.y + 2,
      z: this.mesh.position.z
    };
    
    if (window.logs && window.logs.game_info) {
      window.logs.game_info.push({
        data: { event: "checkpoint_activated", x: this.mesh.position.x, y: this.mesh.position.y, z: this.mesh.position.z },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export class Portal {
  constructor(x, y, z) {
    const geometry = new THREE.TorusGeometry(1.5, 0.3, 16, 32);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x6496ff,
      emissive: 0x6496ff,
      emissiveIntensity: 0.5
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.rotation.x = Math.PI / 2;
    
    // Add inner glow
    const innerGeometry = new THREE.CircleGeometry(1.2, 32);
    const innerMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x3264c8,
      transparent: true,
      opacity: 0.5
    });
    this.inner = new THREE.Mesh(innerGeometry, innerMaterial);
    this.inner.rotation.x = -Math.PI / 2;
    this.mesh.add(this.inner);
    
    this.rotation = 0;
    
    gameState.scene.add(this.mesh);
  }
  
  update() {
    this.rotation += 0.02;
    this.mesh.rotation.z = this.rotation;
    
    // Check if player reached portal
    if (gameState.player) {
      const dx = this.mesh.position.x - gameState.player.mesh.position.x;
      const dy = this.mesh.position.y - gameState.player.mesh.position.y;
      const dz = this.mesh.position.z - gameState.player.mesh.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      
      if (dist < 2) {
        // Check if all abilities unlocked
        if (gameState.abilities.doubleJump && 
            gameState.abilities.hookSwing && 
            gameState.abilities.karateKick) {
          this.triggerWin();
        }
      }
    }
  }
  
  triggerWin() {
    gameState.gamePhase = "GAME_OVER_WIN";
    if (window.logs && window.logs.game_info) {
      window.logs.game_info.push({
        data: { 
          gamePhase: "GAME_OVER_WIN", 
          score: gameState.score,
          abilities: gameState.abilities 
        },
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
}

export class SwingPoint {
  constructor(x, y, z) {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x646464
    });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(x, y, z);
    this.mesh.castShadow = true;
    
    // Add hook
    const hookGeometry = new THREE.TorusGeometry(0.4, 0.08, 8, 16, Math.PI);
    const hookMaterial = new THREE.MeshStandardMaterial({ color: 0xb4b4b4 });
    this.hook = new THREE.Mesh(hookGeometry, hookMaterial);
    this.hook.position.y = -0.5;
    this.hook.rotation.x = Math.PI;
    this.mesh.add(this.hook);
    
    this.rotation = 0;
    
    gameState.scene.add(this.mesh);
  }
  
  update() {
    this.rotation += 0.02;
    this.hook.rotation.z = Math.sin(this.rotation) * 0.3;
  }
}