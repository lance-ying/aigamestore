// player.js - Player entity and controls

import { gameState, CANVAS_WIDTH, CANVAS_HEIGHT, ROOMS } from './globals.js';

export class Player {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 30;
    this.speed = 2.5;
    this.currentRoom = "COCKPIT";
    
    // Animation
    this.walkCycle = 0;
    this.facingRight = true;
  }
  
  update() {
    const p = this.p;
    
    // Movement based on control mode
    if (gameState.controlMode === "HUMAN") {
      this.handleHumanInput();
    } else {
      this.handleTestInput();
    }
    
    // Keep player in bounds
    this.x = p.constrain(this.x, 10, CANVAS_WIDTH - 10);
    this.y = p.constrain(this.y, 10, CANVAS_HEIGHT - 10);
    
    // Update current room
    this.updateCurrentRoom();
    
    // Animation
    if (p.keyIsDown(37) || p.keyIsDown(39) || p.keyIsDown(38) || p.keyIsDown(40)) {
      this.walkCycle += 0.15;
    }
    
    // Log player position periodically
    if (p.frameCount % 60 === 0) {
      p.logs.player_info.push({
        screen_x: this.x,
        screen_y: this.y,
        game_x: this.x,
        game_y: this.y,
        framecount: p.frameCount
      });
    }
  }
  
  handleHumanInput() {
    const p = this.p;
    let moved = false;
    
    if (p.keyIsDown(37)) { // Left
      this.x -= this.speed;
      this.facingRight = false;
      moved = true;
    }
    if (p.keyIsDown(39)) { // Right
      this.x += this.speed;
      this.facingRight = true;
      moved = true;
    }
    if (p.keyIsDown(38)) { // Up
      this.y -= this.speed;
      moved = true;
    }
    if (p.keyIsDown(40)) { // Down
      this.y += this.speed;
      moved = true;
    }
  }
  
  handleTestInput() {
    // Get action from automated testing
    const action = window.get_automated_testing_action ? 
                   window.get_automated_testing_action(gameState) : null;
    
    if (action) {
      if (action.key === 'ArrowLeft') {
        this.x -= this.speed;
        this.facingRight = false;
      }
      if (action.key === 'ArrowRight') {
        this.x += this.speed;
        this.facingRight = true;
      }
      if (action.key === 'ArrowUp') {
        this.y -= this.speed;
      }
      if (action.key === 'ArrowDown') {
        this.y += this.speed;
      }
    }
  }
  
  updateCurrentRoom() {
    for (let [key, room] of Object.entries(ROOMS)) {
      if (this.x > room.x && this.x < room.x + room.width &&
          this.y > room.y && this.y < room.y + room.height) {
        this.currentRoom = key;
        return;
      }
    }
    this.currentRoom = "CORRIDOR";
  }
  
  render() {
    const p = this.p;
    
    p.push();
    
    // Apply hallucination effect
    if (gameState.hallucinationIntensity > 0) {
      const shake = gameState.hallucinationIntensity * 2;
      this.x += p.random(-shake, shake);
      this.y += p.random(-shake, shake);
    }
    
    // Shadow
    p.noStroke();
    p.fill(0, 0, 0, 50);
    p.ellipse(this.x, this.y + this.height / 2 + 3, this.width, 8);
    
    // Body
    p.fill(60, 80, 120);
    p.rect(this.x - this.width / 2, this.y - this.height / 2 + 10, this.width, this.height - 10, 3);
    
    // Head
    p.fill(200, 180, 160);
    p.ellipse(this.x, this.y - this.height / 2 + 5, this.width * 0.7, this.width * 0.7);
    
    // Eyes (affected by sanity)
    const eyeColor = gameState.sanity > 50 ? [40, 40, 40] : [120, 20, 20];
    p.fill(...eyeColor);
    const eyeOffset = this.facingRight ? 3 : -3;
    p.ellipse(this.x + eyeOffset - 3, this.y - this.height / 2 + 5, 3, 4);
    p.ellipse(this.x + eyeOffset + 3, this.y - this.height / 2 + 5, 3, 4);
    
    // Arms with walk animation
    const armSwing = p.sin(this.walkCycle) * 5;
    p.stroke(60, 80, 120);
    p.strokeWeight(3);
    p.line(this.x - this.width / 2, this.y, this.x - this.width / 2 - 5, this.y + 10 + armSwing);
    p.line(this.x + this.width / 2, this.y, this.x + this.width / 2 + 5, this.y + 10 - armSwing);
    
    p.pop();
  }
}