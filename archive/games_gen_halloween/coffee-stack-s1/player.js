// player.js - Player entity and stack management

import { 
  CANVAS_WIDTH, CANVAS_HEIGHT, PLAYER_START_X, PLAYER_START_Y,
  PLAYER_SPEED, BOOST_SPEED, BOOST_COST, ENERGY_REGEN, MAX_ENERGY,
  CUP_HEIGHT, CUP_WIDTH, NUM_LANES, LANE_WIDTH,
  ITEM_CUP, ITEM_COFFEE, ITEM_MILK, ITEM_SLEEVE, ITEM_LID
} from './globals.js';

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.targetLane = 2; // Center lane (0-indexed)
    this.currentLane = 2;
    this.stack = [];
    this.energy = MAX_ENERGY;
    this.invulnerable = 0;
    this.dodgeCooldown = 0;
  }

  update(p, inputs) {
    // Update cooldowns
    if (this.invulnerable > 0) this.invulnerable--;
    if (this.dodgeCooldown > 0) this.dodgeCooldown--;

    // Energy regeneration
    this.energy = Math.min(MAX_ENERGY, this.energy + ENERGY_REGEN);

    // Lane movement
    let speed = PLAYER_SPEED;
    if (inputs.boost && this.energy >= BOOST_COST) {
      speed = BOOST_SPEED;
      this.energy -= BOOST_COST;
    }

    // Handle lane changes
    if (inputs.left && this.currentLane > 0) {
      this.targetLane = this.currentLane - 1;
    }
    if (inputs.right && this.currentLane < NUM_LANES - 1) {
      this.targetLane = this.currentLane + 1;
    }

    // Quick dodge
    if (inputs.dodgeLeft && this.dodgeCooldown === 0 && this.currentLane > 0) {
      this.targetLane = Math.max(0, this.currentLane - 1);
      this.dodgeCooldown = 30;
      this.invulnerable = 15;
    }
    if (inputs.dodgeRight && this.dodgeCooldown === 0 && this.currentLane < NUM_LANES - 1) {
      this.targetLane = Math.min(NUM_LANES - 1, this.currentLane + 1);
      this.dodgeCooldown = 30;
      this.invulnerable = 15;
    }

    // Smooth lane transition
    const targetX = (this.targetLane + 0.5) * LANE_WIDTH;
    if (Math.abs(this.x - targetX) < speed) {
      this.x = targetX;
      this.currentLane = this.targetLane;
    } else if (this.x < targetX) {
      this.x += speed;
    } else if (this.x > targetX) {
      this.x -= speed;
    }
  }

  addToCup(itemType) {
    // Find the topmost incomplete cup
    for (let i = this.stack.length - 1; i >= 0; i--) {
      const cup = this.stack[i];
      
      if (itemType === ITEM_COFFEE || itemType === ITEM_MILK) {
        if (!cup.hasCoffee) {
          cup.hasCoffee = true;
          cup.coffeeType = itemType;
          return true;
        }
      } else if (itemType === ITEM_SLEEVE) {
        if (cup.hasCoffee && !cup.hasSleeve) {
          cup.hasSleeve = true;
          return true;
        }
      } else if (itemType === ITEM_LID) {
        if (cup.hasCoffee && !cup.hasLid) {
          cup.hasLid = true;
          if (cup.hasSleeve) {
            cup.complete = true;
          }
          return true;
        }
      }
    }
    return false;
  }

  addCup() {
    this.stack.push({
      hasCoffee: false,
      hasSleeve: false,
      hasLid: false,
      coffeeType: null,
      complete: false
    });
  }

  removeFromStack(amount) {
    for (let i = 0; i < amount && this.stack.length > 0; i++) {
      this.stack.pop();
    }
  }

  getCompletedDrinks() {
    return this.stack.filter(cup => cup.complete).length;
  }

  getStackHeight() {
    return this.stack.length;
  }

  render(p, scrollOffset) {
    p.push();
    
    // Draw player base (carrier platform)
    p.fill(139, 69, 19);
    p.stroke(101, 67, 33);
    p.strokeWeight(2);
    p.rect(this.x - 25, this.y - 5, 50, 10, 2);
    
    // Draw stack
    for (let i = 0; i < this.stack.length; i++) {
      const cup = this.stack[i];
      const cupY = this.y - 15 - (i * CUP_HEIGHT);
      
      this.renderCup(p, this.x, cupY, cup);
    }

    // Invulnerability shield
    if (this.invulnerable > 0) {
      p.noFill();
      p.stroke(100, 200, 255, 150);
      p.strokeWeight(2);
      p.ellipse(this.x, this.y, 60, 60);
    }

    // Energy bar
    const energyWidth = 40;
    const energyHeight = 4;
    const energyX = this.x - energyWidth / 2;
    const energyY = this.y + 15;
    
    p.fill(50);
    p.noStroke();
    p.rect(energyX, energyY, energyWidth, energyHeight, 2);
    
    const energyPercent = this.energy / MAX_ENERGY;
    p.fill(100, 200, 255);
    p.rect(energyX, energyY, energyWidth * energyPercent, energyHeight, 2);

    p.pop();
  }

  renderCup(p, x, y, cup) {
    p.push();
    
    // Cup body
    p.fill(255, 250, 240);
    p.stroke(200, 190, 180);
    p.strokeWeight(1);
    
    // Trapezoid shape for cup
    p.beginShape();
    p.vertex(x - CUP_WIDTH / 2 + 2, y);
    p.vertex(x + CUP_WIDTH / 2 - 2, y);
    p.vertex(x + CUP_WIDTH / 2, y + CUP_HEIGHT);
    p.vertex(x - CUP_WIDTH / 2, y + CUP_HEIGHT);
    p.endShape(p.CLOSE);
    
    // Coffee/liquid inside
    if (cup.hasCoffee) {
      const liquidColor = cup.coffeeType === ITEM_MILK ? 
        [245, 235, 220] : [101, 67, 33];
      p.fill(...liquidColor);
      p.noStroke();
      p.beginShape();
      p.vertex(x - CUP_WIDTH / 2 + 3, y + 3);
      p.vertex(x + CUP_WIDTH / 2 - 3, y + 3);
      p.vertex(x + CUP_WIDTH / 2 - 2, y + CUP_HEIGHT - 2);
      p.vertex(x - CUP_WIDTH / 2 + 2, y + CUP_HEIGHT - 2);
      p.endShape(p.CLOSE);
    }
    
    // Sleeve
    if (cup.hasSleeve) {
      p.fill(160, 82, 45);
      p.noStroke();
      const sleeveY = y + CUP_HEIGHT * 0.4;
      const sleeveHeight = CUP_HEIGHT * 0.4;
      p.rect(x - CUP_WIDTH / 2 + 1, sleeveY, CUP_WIDTH - 2, sleeveHeight);
    }
    
    // Lid
    if (cup.hasLid) {
      p.fill(220, 220, 220);
      p.stroke(180, 180, 180);
      p.strokeWeight(1);
      p.ellipse(x, y, CUP_WIDTH + 2, 6);
      
      // Lid drinking hole
      p.fill(100);
      p.noStroke();
      p.ellipse(x, y, 4, 3);
    }
    
    // Completion indicator (glow)
    if (cup.complete) {
      p.noFill();
      p.stroke(255, 215, 0, 100);
      p.strokeWeight(2);
      p.rect(x - CUP_WIDTH / 2 - 2, y - 2, CUP_WIDTH + 4, CUP_HEIGHT + 4, 2);
    }
    
    p.pop();
  }

  getBounds() {
    return {
      x: this.x - 25,
      y: this.y - 15 - (this.stack.length * CUP_HEIGHT),
      width: 50,
      height: 15 + (this.stack.length * CUP_HEIGHT) + 10
    };
  }
}