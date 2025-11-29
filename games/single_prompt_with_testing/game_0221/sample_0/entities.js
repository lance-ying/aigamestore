// entities.js - Entity classes for player, NPCs, and objects

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT, logPlayerInfo } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.vx = 0;
    this.vy = 0;
    this.speed = 3;
    this.facing = 1; // 1 = right, -1 = left
    this.isMoving = false;
    this.isSprinting = false;
    this.onGround = false;
    this.lastLoggedX = x;
    this.lastLoggedY = y;
    
    // Animation
    this.walkCycle = 0;
    this.animSpeed = 0.15;
  }
  
  update(p) {
    // Store previous position
    const prevX = this.x;
    const prevY = this.y;
    
    this.isMoving = false;
    
    // Handle movement based on control mode
    if (gameState.controlMode === "HUMAN") {
      this.handleHumanInput();
    }
    
    // Apply velocity
    this.x += this.vx;
    this.y += this.vy;
    
    // Apply friction
    this.vx *= gameState.friction;
    this.vy *= gameState.friction;
    
    // Boundaries
    this.x = p.constrain(this.x, this.width / 2, WORLD_WIDTH - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, WORLD_HEIGHT - this.height / 2);
    
    // Update animation
    if (this.isMoving) {
      this.walkCycle += this.animSpeed;
    }
    
    // Log position if changed significantly
    if (Math.abs(this.x - this.lastLoggedX) > 10 || 
        Math.abs(this.y - this.lastLoggedY) > 10) {
      logPlayerInfo(p, {
        screen_x: this.x - gameState.cameraX,
        screen_y: this.y - gameState.cameraY,
        game_x: this.x,
        game_y: this.y
      });
      this.lastLoggedX = this.x;
      this.lastLoggedY = this.y;
    }
  }
  
  handleHumanInput() {
    const speedMultiplier = this.isSprinting ? gameState.sprintMultiplier : 1;
    const moveSpeed = this.speed * speedMultiplier;
    
    if (gameState.keys[37]) { // Left
      this.vx = -moveSpeed;
      this.facing = -1;
      this.isMoving = true;
    }
    if (gameState.keys[39]) { // Right
      this.vx = moveSpeed;
      this.facing = 1;
      this.isMoving = true;
    }
    if (gameState.keys[38]) { // Up
      this.vy = -moveSpeed;
      this.isMoving = true;
    }
    if (gameState.keys[40]) { // Down
      this.vy = moveSpeed;
      this.isMoving = true;
    }
    
    this.isSprinting = gameState.keys[16]; // Shift
  }
  
  render(p) {
    p.push();
    
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.translate(screenX, screenY);
    
    // Flip if facing left
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Draw character body (Roman toga style)
    p.fill(240, 230, 210);
    p.noStroke();
    p.ellipse(0, -10, this.width, this.height - 10);
    
    // Head
    p.fill(220, 180, 140);
    p.ellipse(0, -20, 14, 16);
    
    // Toga details
    p.fill(200, 50, 50);
    p.arc(0, -5, this.width - 4, this.height - 15, 0, p.PI);
    
    // Eyes
    p.fill(0);
    p.circle(-3, -22, 2);
    p.circle(3, -22, 2);
    
    // Walking animation (legs)
    if (this.isMoving) {
      const leg1Offset = p.sin(this.walkCycle) * 4;
      const leg2Offset = p.sin(this.walkCycle + p.PI) * 4;
      
      p.stroke(220, 180, 140);
      p.strokeWeight(3);
      p.line(-4, 5, -4 + leg1Offset, 12);
      p.line(4, 5, 4 + leg2Offset, 12);
    } else {
      p.stroke(220, 180, 140);
      p.strokeWeight(3);
      p.line(-4, 5, -4, 12);
      p.line(4, 5, 4, 12);
    }
    
    p.pop();
  }
  
  interactWithNearestNPC() {
    let nearest = null;
    let nearestDist = 60;
    
    for (const npc of gameState.npcs) {
      const dist = Math.sqrt(
        Math.pow(this.x - npc.x, 2) + 
        Math.pow(this.y - npc.y, 2)
      );
      if (dist < nearestDist) {
        nearest = npc;
        nearestDist = dist;
      }
    }
    
    if (nearest) {
      nearest.startDialogue();
      return true;
    }
    
    return false;
  }
  
  collectNearestTablet() {
    for (let i = gameState.tablets.length - 1; i >= 0; i--) {
      const tablet = gameState.tablets[i];
      const dist = Math.sqrt(
        Math.pow(this.x - tablet.x, 2) + 
        Math.pow(this.y - tablet.y, 2)
      );
      
      if (dist < 40) {
        tablet.collect();
        return true;
      }
    }
    return false;
  }
}

export class NPC {
  constructor(x, y, name, dialogue, knowledge) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.name = name;
    this.dialogue = dialogue;
    this.knowledge = knowledge; // What clue this NPC provides
    this.color = [150 + Math.random() * 50, 100 + Math.random() * 50, 150 + Math.random() * 50];
    this.idleOffset = Math.random() * Math.PI * 2;
    this.hasSpoken = false;
    
    gameState.npcs.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    // Idle animation
    this.bobY = Math.sin(p.frameCount * 0.05 + this.idleOffset) * 2;
  }
  
  startDialogue() {
    gameState.activeDialogue = {
      npc: this,
      text: this.dialogue,
      lineIndex: 0,
      characterIndex: 0,
      speed: 2
    };
    
    if (!this.hasSpoken) {
      this.hasSpoken = true;
      if (!gameState.npcKnowledge[this.name]) {
        gameState.npcKnowledge[this.name] = this.knowledge;
        if (this.knowledge) {
          gameState.cluesFound.push(this.knowledge);
        }
      }
    }
  }
  
  render(p) {
    p.push();
    
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY + this.bobY;
    
    p.translate(screenX, screenY);
    
    // Body
    p.fill(this.color[0], this.color[1], this.color[2]);
    p.noStroke();
    p.ellipse(0, -10, this.width, this.height - 10);
    
    // Head
    p.fill(200, 160, 120);
    p.ellipse(0, -20, 14, 16);
    
    // Eyes
    p.fill(0);
    p.circle(-3, -22, 2);
    p.circle(3, -22, 2);
    
    // Indicator if can interact
    if (gameState.player) {
      const dist = Math.sqrt(
        Math.pow(this.x - gameState.player.x, 2) + 
        Math.pow(this.y - gameState.player.y, 2)
      );
      
      if (dist < 60) {
        p.fill(255, 255, 0, 150);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(10);
        p.text("SPACE", 0, -35);
      }
    }
    
    // Name tag
    p.fill(255);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(8);
    p.text(this.name, 0, 18);
    
    p.pop();
  }
}

export class Tablet {
  constructor(x, y, id) {
    this.x = x;
    this.y = y;
    this.id = id;
    this.radius = 15;
    this.collected = false;
    this.rotation = 0;
    this.rotSpeed = 0.02;
    this.bobOffset = Math.random() * Math.PI * 2;
    
    gameState.tablets.push(this);
    gameState.entities.push(this);
  }
  
  update(p) {
    if (this.collected) return;
    
    this.rotation += this.rotSpeed;
    this.bobY = Math.sin(p.frameCount * 0.08 + this.bobOffset) * 3;
  }
  
  collect() {
    if (!this.collected) {
      this.collected = true;
      gameState.tabletsCollected++;
      gameState.score += 100;
      
      // Remove from arrays
      const idx = gameState.tablets.indexOf(this);
      if (idx > -1) gameState.tablets.splice(idx, 1);
      const entIdx = gameState.entities.indexOf(this);
      if (entIdx > -1) gameState.entities.splice(entIdx, 1);
      
      // Create collection particles
      for (let i = 0; i < 15; i++) {
        gameState.particles.push(new Particle(this.x, this.y, [255, 215, 0]));
      }
      
      // Check win condition
      if (gameState.tabletsCollected >= gameState.totalTablets) {
        gameState.gamePhase = "GAME_OVER_WIN";
      }
    }
  }
  
  render(p) {
    if (this.collected) return;
    
    p.push();
    
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY + this.bobY;
    
    p.translate(screenX, screenY);
    p.rotate(this.rotation);
    
    // Ancient stone tablet
    p.fill(150, 130, 100);
    p.stroke(100, 80, 60);
    p.strokeWeight(2);
    p.rect(-this.radius, -this.radius * 1.3, this.radius * 2, this.radius * 2.6, 2);
    
    // Ancient markings
    p.stroke(70, 60, 40);
    p.strokeWeight(1);
    for (let i = 0; i < 3; i++) {
      p.line(-this.radius * 0.6, -this.radius + i * 8, this.radius * 0.6, -this.radius + i * 8);
    }
    
    // Glow effect
    p.noStroke();
    p.fill(255, 215, 0, 50);
    p.circle(0, 0, this.radius * 3);
    
    p.pop();
  }
}

export class Building {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type; // 'temple', 'house', 'forum', 'wall'
    
    gameState.buildings.push(this);
  }
  
  checkCollision(entity) {
    return (
      entity.x + entity.width / 2 > this.x &&
      entity.x - entity.width / 2 < this.x + this.width &&
      entity.y + entity.height / 2 > this.y &&
      entity.y - entity.height / 2 < this.y + this.height
    );
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    
    switch (this.type) {
      case 'temple':
        // Grand temple with columns
        p.fill(220, 200, 170);
        p.stroke(150, 130, 100);
        p.strokeWeight(2);
        p.rect(screenX, screenY, this.width, this.height);
        
        // Columns
        p.fill(200, 180, 150);
        const colWidth = this.width / 6;
        for (let i = 1; i < 6; i++) {
          p.rect(screenX + i * colWidth - 5, screenY + 10, 10, this.height - 20);
        }
        
        // Roof
        p.fill(180, 100, 100);
        p.triangle(
          screenX - 10, screenY,
          screenX + this.width / 2, screenY - 30,
          screenX + this.width + 10, screenY
        );
        break;
        
      case 'house':
        // Simple Roman house
        p.fill(200, 180, 150);
        p.stroke(130, 110, 80);
        p.strokeWeight(2);
        p.rect(screenX, screenY, this.width, this.height);
        
        // Door
        p.fill(100, 70, 50);
        p.rect(screenX + this.width / 2 - 15, screenY + this.height - 35, 30, 35);
        
        // Window
        p.fill(50, 70, 100);
        p.rect(screenX + 15, screenY + 15, 25, 20);
        break;
        
      case 'forum':
        // Open forum area with pillars
        p.noFill();
        p.stroke(180, 160, 130);
        p.strokeWeight(3);
        p.rect(screenX, screenY, this.width, this.height);
        
        // Corner pillars
        p.fill(180, 160, 130);
        p.circle(screenX, screenY, 20);
        p.circle(screenX + this.width, screenY, 20);
        p.circle(screenX, screenY + this.height, 20);
        p.circle(screenX + this.width, screenY + this.height, 20);
        break;
        
      case 'wall':
        // City wall
        p.fill(150, 140, 120);
        p.stroke(100, 90, 70);
        p.strokeWeight(2);
        p.rect(screenX, screenY, this.width, this.height);
        
        // Stone texture
        for (let i = 0; i < this.width; i += 30) {
          for (let j = 0; j < this.height; j += 20) {
            p.stroke(120, 110, 90);
            p.strokeWeight(1);
            p.line(screenX + i, screenY + j, screenX + i + 25, screenY + j);
          }
        }
        break;
    }
    
    p.pop();
  }
}

export class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4 - 2;
    this.lifetime = 30;
    this.age = 0;
    this.size = Math.random() * 4 + 2;
    this.color = color || [255, 200, 0];
    this.alpha = 255;
  }
  
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += 0.2; // Gravity
    this.age++;
    this.alpha = 255 * (1 - this.age / this.lifetime);
  }
  
  isDead() {
    return this.age >= this.lifetime;
  }
  
  render(p) {
    const screenX = this.x - gameState.cameraX;
    const screenY = this.y - gameState.cameraY;
    
    p.push();
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    p.circle(screenX, screenY, this.size);
    p.pop();
  }
}