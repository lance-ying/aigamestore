// player.js - Player class and movement

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, TILE_SIZE, FARM_WIDTH, FARM_HEIGHT } from './globals.js';
import { TOOL_HOE, TOOL_WATERING_CAN, TOOL_SCYTHE } from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 30;
    this.height = 40;
    
    // Movement
    this.speed = 3;
    this.vx = 0;
    this.vy = 0;
    
    // Visual
    this.facing = 1; // 1 = right, -1 = left
    this.walkCycle = 0;
    this.isMoving = false;
    
    // Tools
    this.currentTool = TOOL_HOE;
    this.toolCooldown = 0;
    this.toolCooldownMax = 15;
    
    // Animation
    this.actionAnimation = 0;
    
    // Last position for logging
    this.lastLoggedX = x;
    this.lastLoggedY = y;
    
    gameState.player = this;
    gameState.entities.push(this);
  }
  
  update(p) {
    // Update cooldowns
    if (this.toolCooldown > 0) {
      this.toolCooldown--;
    }
    
    // Update action animation
    if (this.actionAnimation > 0) {
      this.actionAnimation--;
    }
    
    // Apply movement
    this.x += this.vx;
    this.y += this.vy;
    
    // Keep player in bounds
    this.x = p.constrain(this.x, this.width / 2, FARM_WIDTH * TILE_SIZE - this.width / 2);
    this.y = p.constrain(this.y, this.height / 2, FARM_HEIGHT * TILE_SIZE - this.height / 2);
    
    // Update walk cycle
    if (this.isMoving) {
      this.walkCycle += 0.2;
    } else {
      this.walkCycle = 0;
    }
    
    // Apply friction
    this.vx *= 0.7;
    this.vy *= 0.7;
    
    // Reset moving flag
    this.isMoving = false;
    
    // Log position if changed significantly
    if (Math.abs(this.x - this.lastLoggedX) > 10 || 
        Math.abs(this.y - this.lastLoggedY) > 10) {
      this.logPosition(p);
      this.lastLoggedX = this.x;
      this.lastLoggedY = this.y;
    }
  }
  
  move(dx, dy) {
    this.vx = dx * this.speed;
    this.vy = dy * this.speed;
    this.isMoving = true;
    
    if (dx !== 0) {
      this.facing = dx > 0 ? 1 : -1;
    }
  }
  
  switchTool() {
    const tools = [TOOL_HOE, TOOL_WATERING_CAN, TOOL_SCYTHE];
    const currentIndex = tools.indexOf(this.currentTool);
    const nextIndex = (currentIndex + 1) % tools.length;
    this.currentTool = tools[nextIndex];
  }
  
  useTool() {
    if (this.toolCooldown > 0) return false;
    
    // Check energy
    if (gameState.energy < 5) return false;
    
    this.toolCooldown = this.toolCooldownMax;
    this.actionAnimation = 10;
    
    // Consume energy
    gameState.energy = Math.max(0, gameState.energy - 5);
    
    return true;
  }
  
  logPosition(p) {
    if (p.logs && p.logs.player_info) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        framecount: gameState.frameCount,
        timestamp: Date.now()
      });
    }
  }
  
  render(p) {
    p.push();
    p.translate(this.x, this.y);
    
    // Flip if facing left
    if (this.facing < 0) {
      p.scale(-1, 1);
    }
    
    // Action animation (tool use)
    if (this.actionAnimation > 0) {
      p.rotate(-0.3 * (this.actionAnimation / 10));
    }
    
    // Body
    p.fill(100, 150, 255);
    p.stroke(50, 100, 200);
    p.strokeWeight(2);
    p.rectMode(p.CENTER);
    p.rect(0, 0, this.width, this.height, 5);
    
    // Head
    p.fill(255, 220, 180);
    p.circle(0, -this.height / 2 + 8, 16);
    
    // Eyes
    p.fill(50);
    p.noStroke();
    p.circle(-4, -this.height / 2 + 6, 3);
    p.circle(4, -this.height / 2 + 6, 3);
    
    // Hat
    p.fill(160, 82, 45);
    p.arc(0, -this.height / 2 + 4, 20, 16, p.PI, p.TWO_PI);
    
    // Arms with walk animation
    const armSwing = p.sin(this.walkCycle) * 0.2;
    p.stroke(100, 150, 255);
    p.strokeWeight(4);
    p.line(-8, 0, -12, 8 + armSwing * 5);
    p.line(8, 0, 12, 8 - armSwing * 5);
    
    // Legs with walk animation
    p.line(-6, this.height / 2 - 5, -8, this.height / 2 + 5 + armSwing * 8);
    p.line(6, this.height / 2 - 5, 8, this.height / 2 + 5 - armSwing * 8);
    
    // Tool indicator (small icon)
    p.noStroke();
    p.fill(255, 200);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(12);
    const toolIcon = this.currentTool === TOOL_HOE ? "⚒" : 
                     this.currentTool === TOOL_WATERING_CAN ? "💧" : "⚔";
    p.text(toolIcon, 18, -10);
    
    p.pop();
  }
}