// entities.js - Player and NPC classes

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.speed = 2.5;
    this.vx = 0;
    this.vy = 0;
    this.color = [100, 200, 255];
    this.facing = 'down';
    this.animationFrame = 0;
    this.interactionRange = 50;
  }
  
  update(walls) {
    const newX = this.x + this.vx;
    const newY = this.y + this.vy;
    
    // Check collisions with walls
    let canMoveX = true;
    let canMoveY = true;
    
    for (const wall of walls) {
      if (this.checkCollision(newX, this.y, wall)) {
        canMoveX = false;
      }
      if (this.checkCollision(this.x, newY, wall)) {
        canMoveY = false;
      }
    }
    
    if (canMoveX) this.x = newX;
    if (canMoveY) this.y = newY;
    
    // Keep within bounds
    this.x = Math.max(this.width/2, Math.min(this.x, 1200 - this.width/2));
    this.y = Math.max(this.height/2, Math.min(this.y, 800 - this.height/2));
    
    // Update animation
    if (this.vx !== 0 || this.vy !== 0) {
      this.animationFrame = (this.animationFrame + 0.15) % 4;
    }
    
    // Update facing direction
    if (this.vx > 0) this.facing = 'right';
    else if (this.vx < 0) this.facing = 'left';
    else if (this.vy > 0) this.facing = 'down';
    else if (this.vy < 0) this.facing = 'up';
  }
  
  checkCollision(x, y, wall) {
    return x - this.width/2 < wall.x + wall.width &&
           x + this.width/2 > wall.x &&
           y - this.height/2 < wall.y + wall.height &&
           y + this.height/2 > wall.y;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    
    // Body
    p.fill(...this.color);
    p.stroke(50, 50, 80);
    p.strokeWeight(2);
    p.rect(-this.width/2, -this.height/2, this.width, this.height, 4);
    
    // Antenna
    p.stroke(...this.color);
    p.strokeWeight(2);
    p.line(0, -this.height/2, 0, -this.height/2 - 8);
    p.noStroke();
    p.fill(255, 200, 100);
    p.circle(0, -this.height/2 - 10, 6);
    
    // Eyes
    p.fill(255);
    const eyeOffset = 8;
    p.circle(-eyeOffset, -5, 8);
    p.circle(eyeOffset, -5, 8);
    
    // Pupils
    p.fill(30);
    let pupilX = 0, pupilY = 0;
    if (this.facing === 'right') pupilX = 2;
    else if (this.facing === 'left') pupilX = -2;
    else if (this.facing === 'down') pupilY = 2;
    else if (this.facing === 'up') pupilY = -2;
    
    p.circle(-eyeOffset + pupilX, -5 + pupilY, 4);
    p.circle(eyeOffset + pupilX, -5 + pupilY, 4);
    
    // Mouth
    p.stroke(50);
    p.strokeWeight(2);
    p.noFill();
    p.arc(0, 5, 12, 8, 0, p.PI);
    
    p.pop();
  }
  
  getNearbyInteractable(npcs, interactables) {
    const all = [...npcs, ...interactables];
    for (const entity of all) {
      const dist = Math.hypot(this.x - entity.x, this.y - entity.y);
      if (dist < this.interactionRange) {
        return entity;
      }
    }
    return null;
  }
}

export class NPC {
  constructor(x, y, name, color, dialogues) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 30;
    this.name = name;
    this.color = color;
    this.dialogues = dialogues; // Array of dialogue trees
    this.currentDialogueIndex = 0;
    this.animationOffset = Math.random() * 100;
    this.hasInteracted = false;
  }
  
  draw(p) {
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    
    // Hover animation
    const hover = Math.sin((gameState.frameCount + this.animationOffset) * 0.05) * 2;
    p.translate(0, hover);
    
    // Body
    p.fill(...this.color);
    p.stroke(40, 40, 60);
    p.strokeWeight(2);
    p.rect(-this.width/2, -this.height/2, this.width, this.height, 4);
    
    // Antenna
    p.stroke(...this.color);
    p.strokeWeight(2);
    p.line(0, -this.height/2, 0, -this.height/2 - 8);
    p.noStroke();
    p.fill(200, 100, 255);
    p.circle(0, -this.height/2 - 10, 6);
    
    // Face
    p.fill(255);
    p.circle(-7, -5, 7);
    p.circle(7, -5, 7);
    p.fill(30);
    p.circle(-7, -5, 3);
    p.circle(7, -5, 3);
    
    // Name tag
    p.fill(255, 255, 255, 200);
    p.noStroke();
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(10);
    p.text(this.name, 0, -this.height/2 - 15);
    
    p.pop();
  }
  
  getNextDialogue() {
    if (this.currentDialogueIndex < this.dialogues.length) {
      const dialogue = this.dialogues[this.currentDialogueIndex];
      this.currentDialogueIndex++;
      this.hasInteracted = true;
      return dialogue;
    }
    return this.dialogues[this.dialogues.length - 1]; // Repeat last dialogue
  }
}

export class Interactable {
  constructor(x, y, type, name, description) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.type = type; // 'puzzle', 'object', 'terminal'
    this.name = name;
    this.description = description;
    this.state = 'inactive'; // 'inactive', 'active', 'solved'
    this.color = [150, 150, 180];
  }
  
  draw(p) {
    p.push();
    p.translate(this.x - gameState.cameraX, this.y - gameState.cameraY);
    
    const stateColor = this.state === 'solved' ? [100, 255, 100] : 
                      this.state === 'active' ? [255, 200, 100] : 
                      this.color;
    
    if (this.type === 'puzzle') {
      // Draw puzzle box
      p.fill(...stateColor);
      p.stroke(60);
      p.strokeWeight(2);
      p.rect(-this.width/2, -this.height/2, this.width, this.height, 4);
      
      // Puzzle icon
      p.fill(255);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(20);
      p.text('?', 0, 0);
    } else if (this.type === 'terminal') {
      // Draw terminal
      p.fill(40, 40, 50);
      p.stroke(100, 200, 255);
      p.strokeWeight(2);
      p.rect(-this.width/2, -this.height/2, this.width, this.height, 2);
      
      // Screen
      p.fill(...stateColor);
      p.noStroke();
      p.rect(-this.width/2 + 5, -this.height/2 + 5, this.width - 10, this.height - 10, 2);
    } else {
      // Generic object
      p.fill(...stateColor);
      p.stroke(60);
      p.strokeWeight(2);
      p.circle(0, 0, this.width);
    }
    
    p.pop();
  }
  
  interact() {
    if (this.state === 'inactive') {
      this.state = 'active';
    } else if (this.state === 'active') {
      this.state = 'solved';
    }
    return {
      text: this.description,
      solved: this.state === 'solved'
    };
  }
}