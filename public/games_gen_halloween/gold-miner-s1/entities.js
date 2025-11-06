import Matter from 'https://cdn.jsdelivr.net/npm/matter-js@0.19.0/+esm';
const { Bodies, World, Body } = Matter;
import { gameState, ITEM_TYPES, CANVAS_WIDTH, CANVAS_HEIGHT } from './globals.js';

export class Miner {
  constructor(p, x, y) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.color = [139, 69, 19];
  }

  render() {
    this.p.push();
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.rect(this.x - 20, this.y - 10, 40, 20);
    // Draw hat
    this.p.fill(255, 215, 0);
    this.p.rect(this.x - 15, this.y - 15, 30, 8);
    this.p.pop();
  }
}

export class Claw {
  constructor(p, x, y) {
    this.p = p;
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.deploySpeed = 3;
    this.retractSpeed = 2;
    this.swingSpeed = 0.02;
    this.swingRange = Math.PI / 3; // 60 degrees total swing
    this.ropeLength = 50;
    this.color = [160, 160, 160];
  }

  update() {
    if (gameState.clawState === "SWINGING") {
      // Swing the claw
      gameState.clawSwingAngle += gameState.clawSwingDirection * this.swingSpeed;
      
      if (gameState.clawSwingAngle > this.swingRange / 2) {
        gameState.clawSwingAngle = this.swingRange / 2;
        gameState.clawSwingDirection = -1;
      } else if (gameState.clawSwingAngle < -this.swingRange / 2) {
        gameState.clawSwingAngle = -this.swingRange / 2;
        gameState.clawSwingDirection = 1;
      }
      
      // Calculate claw position based on swing angle
      this.x = this.startX + Math.sin(gameState.clawSwingAngle) * this.ropeLength;
      this.y = this.startY + Math.cos(gameState.clawSwingAngle) * this.ropeLength;
    } else if (gameState.clawState === "DEPLOYED") {
      // Move claw down
      this.y += this.deploySpeed;
      
      // Check for item collision
      this.checkItemCollision();
      
      // Check if hit bottom
      if (this.y >= CANVAS_HEIGHT - 10) {
        gameState.clawState = "RETRACTING";
      }
    } else if (gameState.clawState === "RETRACTING" || gameState.clawState === "GRABBED") {
      // Move claw up
      let speed = this.retractSpeed;
      
      // Adjust speed based on grabbed item weight
      if (gameState.grabbedItem) {
        const weight = ITEM_TYPES[gameState.grabbedItem.type].weight;
        speed = Math.max(0.5, this.retractSpeed - (weight - 1) * 0.4);
        
        // Apply strength boost if active
        if (gameState.strengthActive) {
          speed *= 1.5;
        }
      }
      
      this.y -= speed;
      
      // Update grabbed item position
      if (gameState.grabbedItem) {
        gameState.grabbedItem.x = this.x;
        gameState.grabbedItem.y = this.y + 15;
      }
      
      // Check if reached top
      if (this.y <= this.startY + Math.cos(gameState.clawSwingAngle) * this.ropeLength) {
        this.collectItem();
        gameState.clawState = "SWINGING";
        this.x = this.startX + Math.sin(gameState.clawSwingAngle) * this.ropeLength;
        this.y = this.startY + Math.cos(gameState.clawSwingAngle) * this.ropeLength;
      }
    }
  }

  checkItemCollision() {
    for (let i = gameState.items.length - 1; i >= 0; i--) {
      const item = gameState.items[i];
      const distance = Math.sqrt(Math.pow(this.x - item.x, 2) + Math.pow(this.y - item.y, 2));
      
      if (distance < item.size + 10) {
        gameState.grabbedItem = item;
        gameState.items.splice(i, 1);
        gameState.clawState = "GRABBED";
        break;
      }
    }
  }

  collectItem() {
    if (gameState.grabbedItem) {
      gameState.score += ITEM_TYPES[gameState.grabbedItem.type].value;
      gameState.grabbedItem = null;
    }
  }

  deploy() {
    if (gameState.clawState === "SWINGING") {
      gameState.clawState = "DEPLOYED";
    }
  }

  render() {
    this.p.push();
    
    // Draw rope
    this.p.stroke(101, 67, 33);
    this.p.strokeWeight(2);
    this.p.line(this.startX, this.startY, this.x, this.y);
    
    // Draw claw
    this.p.fill(this.color);
    this.p.noStroke();
    this.p.push();
    this.p.translate(this.x, this.y);
    this.p.beginShape();
    this.p.vertex(-8, 0);
    this.p.vertex(-4, 12);
    this.p.vertex(0, 8);
    this.p.vertex(4, 12);
    this.p.vertex(8, 0);
    this.p.vertex(0, -8);
    this.p.endShape(this.p.CLOSE);
    this.p.pop();
    
    this.p.pop();
  }
}

export class Item {
  constructor(p, x, y, type) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.size = ITEM_TYPES[type].size;
    this.color = ITEM_TYPES[type].color;
    this.value = ITEM_TYPES[type].value;
    this.weight = ITEM_TYPES[type].weight;
  }

  render() {
    this.p.push();
    this.p.fill(this.color);
    this.p.noStroke();
    
    if (this.type === "DIAMOND") {
      // Draw diamond shape
      this.p.push();
      this.p.translate(this.x, this.y);
      this.p.beginShape();
      this.p.vertex(0, -this.size);
      this.p.vertex(this.size * 0.7, -this.size * 0.3);
      this.p.vertex(this.size * 0.7, this.size * 0.3);
      this.p.vertex(0, this.size);
      this.p.vertex(-this.size * 0.7, this.size * 0.3);
      this.p.vertex(-this.size * 0.7, -this.size * 0.3);
      this.p.endShape(this.p.CLOSE);
      this.p.pop();
    } else {
      // Draw circle for gold and rocks
      this.p.circle(this.x, this.y, this.size * 2);
    }
    
    // Draw value text
    this.p.fill(255);
    this.p.textAlign(this.p.CENTER, this.p.CENTER);
    this.p.textSize(8);
    this.p.text(`$${this.value}`, this.x, this.y);
    
    this.p.pop();
  }
}