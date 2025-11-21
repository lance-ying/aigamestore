// claw.js
import { CANVAS_WIDTH, CANVAS_HEIGHT, gameState } from './globals.js';

export class Claw {
  constructor(p) {
    this.p = p;
    this.baseX = CANVAS_WIDTH / 2;
    this.baseY = 50;
    this.x = this.baseX;
    this.y = this.baseY;
    this.angle = 0;
    this.angleSpeed = 0.02;
    this.length = 40;
    this.state = "IDLE"; // IDLE, EXTENDING, RETRACTING, GRABBED
    this.speed = 3;
    this.grabbedItem = null;
    this.maxLength = CANVAS_HEIGHT - 80;
  }

  update() {
    if (this.state === "IDLE") {
      this.angle += this.angleSpeed;
      if (this.angle > this.p.PI / 3 || this.angle < -this.p.PI / 3) {
        this.angleSpeed *= -1;
      }
      this.x = this.baseX + this.p.sin(this.angle) * this.length;
      this.y = this.baseY + this.p.cos(this.angle) * this.length;
    } else if (this.state === "EXTENDING") {
      this.length += this.speed;
      this.x = this.baseX + this.p.sin(this.angle) * this.length;
      this.y = this.baseY + this.p.cos(this.angle) * this.length;

      // Check for collision with items
      for (let item of gameState.items) {
        if (!item.grabbed && this.p.dist(this.x, this.y, item.x, item.y) < item.size) {
          this.grabbedItem = item;
          item.grabbed = true;
          this.state = "RETRACTING";
          break;
        }
      }

      // Check boundaries
      if (this.length >= this.maxLength || this.x < 10 || this.x > CANVAS_WIDTH - 10 || this.y > CANVAS_HEIGHT - 20) {
        this.state = "RETRACTING";
      }
    } else if (this.state === "RETRACTING") {
      let retractSpeed = this.speed;
      if (this.grabbedItem) {
        let weight = this.grabbedItem.weight;
        if (gameState.strengthActive) {
          weight *= 0.75; // 25% faster
        }
        retractSpeed = this.speed / weight;
      }
      
      this.length -= retractSpeed;
      this.x = this.baseX + this.p.sin(this.angle) * this.length;
      this.y = this.baseY + this.p.cos(this.angle) * this.length;

      if (this.grabbedItem) {
        this.grabbedItem.x = this.x;
        this.grabbedItem.y = this.y;
      }

      if (this.length <= 40) {
        this.length = 40;
        this.state = "IDLE";
        
        if (this.grabbedItem) {
          // Collect the item
          let value = this.grabbedItem.value;
          if (this.grabbedItem.type === "MYSTERY") {
            value = this.p.floor(this.p.random(50, 300));
          }
          gameState.score += value;
          gameState.levelMoney += value;
          gameState.totalMoney += value;
          
          // Remove item
          gameState.items = gameState.items.filter(item => item !== this.grabbedItem);
          this.grabbedItem = null;
        }
      }
    } else if (this.state === "GRABBED") {
      // Placeholder for grabbed state
    }
  }

  drop() {
    if (this.state === "IDLE") {
      this.state = "EXTENDING";
    }
  }

  useDynamite() {
    if (this.state === "RETRACTING" && this.grabbedItem && gameState.inventory.dynamite > 0) {
      gameState.items = gameState.items.filter(item => item !== this.grabbedItem);
      this.grabbedItem = null;
      gameState.inventory.dynamite--;
      return true;
    }
    return false;
  }

  render() {
    const p = this.p;
    
    // Draw rope
    p.push();
    p.stroke(139, 90, 43);
    p.strokeWeight(2);
    p.line(this.baseX, this.baseY, this.x, this.y);
    p.pop();

    // Draw claw
    p.push();
    p.fill(180, 180, 180);
    p.noStroke();
    p.circle(this.x, this.y, 12);
    
    // Claw prongs
    p.stroke(160, 160, 160);
    p.strokeWeight(3);
    for (let i = 0; i < 3; i++) {
      let clawAngle = (i - 1) * 0.3;
      let clawX = this.x + p.sin(this.angle + clawAngle) * 8;
      let clawY = this.y + p.cos(this.angle + clawAngle) * 8;
      p.line(this.x, this.y, clawX, clawY);
    }
    p.pop();
  }
}