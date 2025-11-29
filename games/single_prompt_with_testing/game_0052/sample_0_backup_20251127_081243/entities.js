// entities.js - All game entity classes

import { 
  gameState, 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT,
  PLAYER_SPEED,
  PLAYER_SPRINT_SPEED,
  PLAYER_SIZE,
  MAX_STAMINA,
  STAMINA_DRAIN,
  STAMINA_REGEN,
  ENEMY_SPEED,
  ENEMY_DETECTION_RANGE,
  ENEMY_DAMAGE,
  ENEMY_SIZE,
  PHASE_GAME_OVER_LOSE,
  CLUE_TYPES,
  GEARBOY_RANGE
} from './globals.js';

// Player class with prosthetic face
export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = PLAYER_SIZE;
    this.height = PLAYER_SIZE;
    this.vx = 0;
    this.vy = 0;
    this.speed = PLAYER_SPEED;
    this.sprintSpeed = PLAYER_SPRINT_SPEED;
    this.facing = 1; // 1 = right, -1 = left
    
    // Health and stamina
    this.health = 100;
    this.maxHealth = 100;
    this.stamina = MAX_STAMINA;
    this.maxStamina = MAX_STAMINA;
    this.isSprinting = false;
    
    // Interaction
    this.canInteract = true;
    this.interactionCooldown = 0;
    
    // Animation
    this.walkCycle = 0;
    this.isMoving = false;
    
    // Last position for logging
    this.lastLoggedX = x;
    this.lastLoggedY = y;
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Reset movement
    this.vx = 0;
    this.vy = 0;
    this.isMoving = false;
    
    // Update interaction cooldown
    if (this.interactionCooldown > 0) {
      this.interactionCooldown--;
    }
    
    // Handle stamina regeneration
    if (!this.isSprinting && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + STAMINA_REGEN);
    }
    
    // Update walk cycle animation
    if (this.isMoving) {
      this.walkCycle += 0.15;
    } else {
      this.walkCycle = 0;
    }
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Keep in bounds
    this.x = Math.max(this.width / 2, Math.min(gameState.rooms[gameState.currentRoom].width - this.width / 2, this.x));
    this.y = Math.max(this.height / 2, Math.min(gameState.rooms[gameState.currentRoom].height - this.height / 2, this.y));
    
    // Log position if changed significantly
    if (Math.abs(this.x - this.lastLoggedX) > 5 || Math.abs(this.y - this.lastLoggedY) > 5) {
      this.logPosition(p);
      this.lastLoggedX = this.x;
      this.lastLoggedY = this.y;
    }
  }
  
  move(dx, dy, isSprinting) {
    this.isMoving = true;
    this.isSprinting = isSprinting && this.stamina > 0;
    
    const currentSpeed = this.isSprinting ? this.sprintSpeed : this.speed;
    
    // Normalize diagonal movement
    const magnitude = Math.sqrt(dx * dx + dy * dy);
    if (magnitude > 0) {
      dx /= magnitude;
      dy /= magnitude;
    }
    
    this.vx = dx * currentSpeed;
    this.vy = dy * currentSpeed;
    
    // Update facing direction
    if (dx !== 0) {
      this.facing = dx > 0 ? 1 : -1;
    }
    
    // Drain stamina when sprinting
    if (this.isSprinting) {
      this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN);
    }
  }
  
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    // Create damage particles
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      gameState.particles.push(new DamageParticle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed
      ));
    }
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    gameState.gamePhase = PHASE_GAME_OVER_LOSE;
  }
  
  interact() {
    if (!this.canInteract || this.interactionCooldown > 0) return;
    
    // Check for nearby clues
    for (const clue of gameState.clues) {
      if (!clue.collected) {
        const dist = Math.sqrt(
          Math.pow(this.x - clue.x, 2) + Math.pow(this.y - clue.y, 2)
        );
        
        if (dist < 50) {
          clue.collect();
          this.interactionCooldown = 30;
          return;
        }
      }
    }
    
    // Check for doors
    for (const door of gameState.doors) {
      const dist = Math.sqrt(
        Math.pow(this.x - door.x, 2) + Math.pow(this.y - door.y, 2)
      );
      
      if (dist < 50) {
        door.tryOpen();
        this.interactionCooldown = 30;
        return;
      }
    }
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x - gameState.cameraX,
        screen_y: this.y - gameState.cameraY,
        game_x: this.x,
        game_y: this.y,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.translate(screenX, screenY);
    
    // Flip if facing left
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Body (worn sweater)
    p.fill(60, 80, 120);
    p.rect(-this.width / 2, -5, this.width, this.height * 0.7, 3);
    
    // Arms with slight animation
    const armSwing = this.isMoving ? Math.sin(this.walkCycle) * 5 : 0;
    p.stroke(60, 80, 120);
    p.strokeWeight(6);
    p.line(-this.width / 2 + 3, 0, -this.width / 2 - 5, 10 + armSwing);
    p.line(this.width / 2 - 3, 0, this.width / 2 + 5, 10 - armSwing);
    p.noStroke();
    
    // Head (pale skin)
    p.fill(220, 200, 190);
    p.ellipse(0, -this.height / 3, this.width * 0.8, this.height * 0.6);
    
    // Prosthetic face (white mask)
    p.fill(255, 255, 255);
    p.ellipse(0, -this.height / 3, this.width * 0.7, this.height * 0.5);
    
    // Eye holes (dark voids)
    p.fill(20, 20, 30);
    p.ellipse(-7, -this.height / 3 - 2, 8, 10);
    p.ellipse(7, -this.height / 3 - 2, 8, 10);
    
    // Prosthetic face straps
    p.stroke(100, 80, 70);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, -this.height / 3, this.width * 0.9, this.height * 0.7, -Math.PI / 6, -5 * Math.PI / 6);
    p.noStroke();
    
    // Hair (dark blue)
    p.fill(40, 60, 100);
    p.arc(0, -this.height / 2, this.width * 0.8, this.height * 0.4, Math.PI, 0, p.CHORD);
    
    // Legs with walk animation
    const legOffset = this.isMoving ? Math.sin(this.walkCycle) * 4 : 0;
    p.fill(50, 60, 90);
    p.rect(-7, this.height / 3, 6, this.height / 3, 2);
    p.rect(1, this.height / 3 + legOffset / 2, 6, this.height / 3, 2);
    
    p.pop();
    
    // Health bar above player
    this.renderHealthBar(p, screenX, screenY);
  }
  
  renderHealthBar(p, screenX, screenY) {
    const barWidth = 35;
    const barHeight = 4;
    const barX = screenX - barWidth / 2;
    const barY = screenY - this.height / 2 - 10;
    
    // Background
    p.fill(60, 20, 20);
    p.noStroke();
    p.rect(barX, barY, barWidth, barHeight);
    
    // Health
    const healthRatio = this.health / this.maxHealth;
    p.fill(200, 50, 50);
    p.rect(barX, barY, barWidth * healthRatio, barHeight);
    
    // Stamina bar (below health)
    const staminaY = barY + barHeight + 2;
    p.fill(40, 40, 80);
    p.rect(barX, staminaY, barWidth, barHeight);
    
    const staminaRatio = this.stamina / this.maxStamina;
    p.fill(100, 150, 255);
    p.rect(barX, staminaY, barWidth * staminaRatio, barHeight);
  }
}

// Shadow enemy class
export class ShadowEnemy {
  constructor(x, y, patrolPoints = []) {
    this.x = x;
    this.y = y;
    this.width = ENEMY_SIZE;
    this.height = ENEMY_SIZE;
    this.vx = 0;
    this.vy = 0;
    this.speed = ENEMY_SPEED;
    
    // AI state
    this.state = 'patrol'; // 'patrol', 'chase', 'idle'
    this.patrolPoints = patrolPoints.length > 0 ? patrolPoints : [{ x, y }];
    this.currentPatrolIndex = 0;
    this.patrolWaitTime = 0;
    
    // Combat
    this.damage = ENEMY_DAMAGE;
    this.detectionRange = ENEMY_DETECTION_RANGE;
    this.attackCooldown = 0;
    
    // Animation
    this.floatOffset = Math.random() * Math.PI * 2;
    this.pulsePhase = Math.random() * Math.PI * 2;
    
    // Visibility (hidden until Gear Boy detects)
    this.visibleToPlayer = false;
    this.opacity = 0;
    
    gameState.enemies.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (!gameState.player) return;
    
    // Update Gear Boy visibility
    if (gameState.gearBoyActive) {
      const dist = Math.sqrt(
        Math.pow(this.x - gameState.player.x, 2) + 
        Math.pow(this.y - gameState.player.y, 2)
      );
      
      if (dist < GEARBOY_RANGE) {
        this.visibleToPlayer = true;
      }
    }
    
    // Fade in/out based on visibility
    if (this.visibleToPlayer) {
      this.opacity = Math.min(1, this.opacity + 0.05);
    } else {
      this.opacity = Math.max(0, this.opacity - 0.02);
    }
    
    // Update animation phases
    this.floatOffset += 0.05;
    this.pulsePhase += 0.08;
    
    // AI behavior
    const playerDist = Math.sqrt(
      Math.pow(gameState.player.x - this.x, 2) + 
      Math.pow(gameState.player.y - this.y, 2)
    );
    
    if (playerDist < this.detectionRange && this.visibleToPlayer) {
      this.state = 'chase';
    } else if (this.state === 'chase' && playerDist > this.detectionRange * 1.5) {
      this.state = 'patrol';
    }
    
    if (this.state === 'chase') {
      this.chasePlayer();
    } else if (this.state === 'patrol') {
      this.patrol();
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Damping
    this.vx *= 0.9;
    this.vy *= 0.9;
    
    // Attack cooldown
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }
    
    // Check collision with player
    if (this.visibleToPlayer) {
      this.checkPlayerCollision();
    }
  }
  
  chasePlayer() {
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist > 0) {
      this.vx += (dx / dist) * this.speed * 0.3;
      this.vy += (dy / dist) * this.speed * 0.3;
    }
  }
  
  patrol() {
    if (this.patrolPoints.length === 0) return;
    
    const target = this.patrolPoints[this.currentPatrolIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < 10) {
      this.patrolWaitTime++;
      if (this.patrolWaitTime > 60) {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        this.patrolWaitTime = 0;
      }
    } else {
      this.vx += (dx / dist) * this.speed * 0.2;
      this.vy += (dy / dist) * this.speed * 0.2;
    }
  }
  
  checkPlayerCollision() {
    const dx = gameState.player.x - this.x;
    const dy = gameState.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    if (dist < (this.width + gameState.player.width) / 2 && this.attackCooldown === 0) {
      gameState.player.takeDamage(this.damage);
      this.attackCooldown = 120;
    }
  }
  
  render(p) {
    if (this.opacity <= 0) return;
    
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    const floatY = Math.sin(this.floatOffset) * 5;
    const pulse = Math.sin(this.pulsePhase) * 5;
    
    p.push();
    p.translate(screenX, screenY + floatY);
    
    // Shadow blob with transparency
    p.fill(20, 10, 30, 200 * this.opacity);
    p.noStroke();
    
    // Main body (amorphous shape)
    p.beginShape();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const offset = Math.sin(this.pulsePhase + i) * 5;
      const radius = this.width / 2 + offset + pulse;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      p.vertex(x, y);
    }
    p.endShape(p.CLOSE);
    
    // Glowing eyes
    if (this.state === 'chase') {
      p.fill(255, 50, 50, 255 * this.opacity);
      p.ellipse(-8, -5, 6, 8);
      p.ellipse(8, -5, 6, 8);
    } else {
      p.fill(150, 150, 200, 180 * this.opacity);
      p.ellipse(-8, -5, 5, 6);
      p.ellipse(8, -5, 5, 6);
    }
    
    // Wispy tendrils
    p.stroke(40, 30, 50, 150 * this.opacity);
    p.strokeWeight(2);
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2 + this.pulsePhase;
      const length = 15 + Math.sin(this.floatOffset + i) * 5;
      p.line(
        Math.cos(angle) * this.width / 3,
        Math.sin(angle) * this.width / 3,
        Math.cos(angle) * length,
        Math.sin(angle) * length
      );
    }
    
    p.pop();
  }
}

// Clue/Evidence class
export class Clue {
  constructor(x, y, type, id, requiredEvidence = []) {
    this.x = x;
    this.y = y;
    this.width = 25;
    this.height = 25;
    this.type = type;
    this.id = id;
    this.collected = false;
    this.requiredEvidence = requiredEvidence;
    
    // Visual
    this.glowPhase = Math.random() * Math.PI * 2;
    this.floatOffset = Math.random() * Math.PI * 2;
    this.rotation = Math.random() * Math.PI * 2;
    
    // Points value
    this.points = 100;
    
    gameState.clues.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.collected) return;
    
    // Check if requirements are met
    const canCollect = this.requiredEvidence.every(req => 
      gameState.evidenceCollected.includes(req)
    );
    
    if (!canCollect) {
      this.glowPhase += 0.02;
      this.floatOffset += 0.03;
      return;
    }
    
    // Animation
    this.glowPhase += 0.05;
    this.floatOffset += 0.04;
    this.rotation += 0.02;
  }
  
  collect() {
    if (this.collected) return;
    
    const canCollect = this.requiredEvidence.every(req => 
      gameState.evidenceCollected.includes(req)
    );
    
    if (!canCollect) return;
    
    this.collected = true;
    gameState.cluesCollected++;
    gameState.score += this.points;
    gameState.evidenceCollected.push(this.id);
    
    // Create collection particles
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = Math.random() * 2 + 1;
      gameState.particles.push(new CollectionParticle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.getColor()
      ));
    }
    
    // Check win condition
    if (gameState.cluesCollected >= gameState.totalClues) {
      gameState.gamePhase = 'GAME_OVER_WIN';
    }
  }
  
  getColor() {
    switch (this.type) {
      case CLUE_TYPES.NOTE: return [255, 255, 200];
      case CLUE_TYPES.PHOTO: return [200, 200, 255];
      case CLUE_TYPES.KEY: return [255, 215, 0];
      case CLUE_TYPES.EVIDENCE: return [255, 100, 100];
      case CLUE_TYPES.SUPERNATURAL: return [150, 100, 255];
      default: return [255, 255, 255];
    }
  }
  
  render(p) {
    if (this.collected) return;
    
    const canCollect = this.requiredEvidence.every(req => 
      gameState.evidenceCollected.includes(req)
    );
    
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    const floatY = Math.sin(this.floatOffset) * 3;
    const glow = Math.sin(this.glowPhase) * 30 + 100;
    
    p.push();
    p.translate(screenX, screenY + floatY);
    p.rotate(this.rotation);
    
    if (!canCollect) {
      // Locked/unavailable appearance
      p.fill(80, 80, 80, 100);
      p.stroke(100, 100, 100);
      p.strokeWeight(2);
      p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 3);
      
      // Lock icon
      p.fill(150, 150, 150);
      p.noStroke();
      p.rect(-5, -3, 10, 8, 2);
      p.arc(0, -3, 8, 8, Math.PI, 0);
    } else {
      // Available - render based on type
      const color = this.getColor();
      
      // Glow effect
      p.fill(color[0], color[1], color[2], 50);
      p.noStroke();
      p.ellipse(0, 0, this.width + glow * 0.3, this.height + glow * 0.3);
      
      // Main icon
      p.fill(color[0], color[1], color[2]);
      p.stroke(255, 255, 255, 200);
      p.strokeWeight(2);
      
      switch (this.type) {
        case CLUE_TYPES.NOTE:
          p.rect(-this.width / 2, -this.height / 2, this.width, this.height, 2);
          p.stroke(100);
          p.strokeWeight(1);
          p.line(-6, -4, 6, -4);
          p.line(-6, 0, 6, 0);
          p.line(-6, 4, 6, 4);
          break;
        case CLUE_TYPES.PHOTO:
          p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
          p.fill(150, 150, 180);
          p.noStroke();
          p.ellipse(-4, -4, 6);
          p.triangle(8, 8, -8, 8, 0, -2);
          break;
        case CLUE_TYPES.KEY:
          p.ellipse(0, -5, 10);
          p.rect(-2, -5, 4, 15);
          p.rect(-4, 6, 8, 3);
          break;
        case CLUE_TYPES.SUPERNATURAL:
          for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const x = Math.cos(angle) * 8;
            const y = Math.sin(angle) * 8;
            p.ellipse(x, y, 4);
          }
          break;
        default:
          p.ellipse(0, 0, this.width, this.height);
      }
    }
    
    p.pop();
  }
}

// Door class
export class Door {
  constructor(x, y, width, height, requiredKeys = [], destinationRoom = null) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.requiredKeys = requiredKeys;
    this.destinationRoom = destinationRoom;
    this.isLocked = requiredKeys.length > 0;
    this.isOpen = false;
    
    gameState.doors.push(this);
  }
  
  tryOpen() {
    if (!this.isLocked) {
      this.open();
      return true;
    }
    
    // Check if player has all required keys
    const hasAllKeys = this.requiredKeys.every(key => 
      gameState.evidenceCollected.includes(key)
    );
    
    if (hasAllKeys) {
      this.isLocked = false;
      gameState.unlockedDoors.push(this);
      this.open();
      return true;
    }
    
    return false;
  }
  
  open() {
    this.isOpen = true;
    
    // Room transition logic could go here
    // For this game, we keep it simple with one large apartment
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    
    // Door frame
    p.fill(80, 60, 40);
    p.stroke(60, 40, 20);
    p.strokeWeight(3);
    p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height);
    
    // Door panel
    if (!this.isOpen) {
      p.fill(100, 80, 60);
      p.rect(screenX - this.width / 2 + 5, screenY - this.height / 2 + 5, this.width - 10, this.height - 10);
      
      // Door knob
      p.fill(180, 160, 100);
      p.noStroke();
      p.ellipse(screenX + this.width / 2 - 15, screenY, 6);
      
      // Lock indicator
      if (this.isLocked) {
        p.fill(200, 50, 50);
        p.ellipse(screenX, screenY - this.height / 4, 15);
        p.fill(255);
        p.textSize(10);
        p.textAlign(p.CENTER, p.CENTER);
        p.text('🔒', screenX, screenY - this.height / 4);
      }
    } else {
      // Open door (partial view)
      p.fill(40, 40, 50);
      p.rect(screenX - this.width / 2 + 5, screenY - this.height / 2 + 5, this.width * 0.3, this.height - 10);
    }
    
    p.pop();
  }
}

// Furniture/Obstacle class
export class Furniture {
  constructor(x, y, width, height, type = 'generic') {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    
    gameState.furniture.push(this);
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    
    switch (this.type) {
      case 'table':
        p.fill(100, 70, 50);
        p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height);
        p.fill(80, 50, 30);
        p.rect(screenX - this.width / 2 + 5, screenY - 5, 5, this.height / 2);
        p.rect(screenX + this.width / 2 - 10, screenY - 5, 5, this.height / 2);
        break;
      case 'couch':
        p.fill(80, 100, 120);
        p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height, 5);
        p.fill(60, 80, 100);
        p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, 10, 5, 5, 0, 0);
        break;
      case 'bookshelf':
        p.fill(90, 60, 40);
        p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height);
        for (let i = 0; i < 3; i++) {
          p.stroke(60, 40, 20);
          p.line(screenX - this.width / 2, screenY - this.height / 2 + (i + 1) * this.height / 4, 
                 screenX + this.width / 2, screenY - this.height / 2 + (i + 1) * this.height / 4);
        }
        p.noStroke();
        break;
      default:
        p.fill(120, 100, 90);
        p.rect(screenX - this.width / 2, screenY - this.height / 2, this.width, this.height);
    }
    
    p.pop();
  }
}

// Particle classes
export class DamageParticle {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.lifetime = 30;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
    
    gameState.particles.push(this);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2;
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.fill(255, 50, 50, alpha * 255);
    p.noStroke();
    p.circle(screenX, screenY, this.size);
  }
}

export class CollectionParticle {
  constructor(x, y, vx, vy, color) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.lifetime = 40;
    this.age = 0;
    this.size = Math.random() * 3 + 2;
    
    gameState.particles.push(this);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.95;
    this.vy *= 0.95;
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.fill(this.color[0], this.color[1], this.color[2], alpha * 255);
    p.noStroke();
    p.circle(screenX, screenY, this.size);
  }
}

export class GhostParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = -Math.random() * 2 - 1;
    this.lifetime = 60;
    this.age = 0;
    this.size = Math.random() * 8 + 4;
    
    gameState.particles.push(this);
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.age++;
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const alpha = 1 - (this.age / this.lifetime);
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.fill(150, 150, 200, alpha * 150);
    p.noStroke();
    p.circle(screenX, screenY, this.size);
  }
}