// building.js
import { gameState, BUILDING_DEFS, BUILDING_TYPES } from './globals.js';

export class Building {
  constructor(type, x, y) {
    const def = BUILDING_DEFS[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.size = def.size;
    this.color = def.color;
    this.produces = def.produces;
    this.productionRate = def.productionRate;
    this.health = def.health;
    this.maxHealth = def.health;
    this.level = 1;
    this.productionTimer = 0;
    this.populationBonus = def.populationBonus || 0;
    this.isAlive = true;
  }

  update() {
    if (!this.isAlive || gameState.gamePhase !== "PLAYING") return;

    // Production
    if (this.produces && this.productionRate > 0) {
      this.productionTimer += gameState.timeScale;
      if (this.productionTimer >= 60) { // Every second
        gameState[this.produces] += this.productionRate * this.level;
        this.productionTimer = 0;
      }
    }

    // Check if destroyed
    if (this.health <= 0) {
      this.isAlive = false;
      if (this.type === BUILDING_TYPES.TOWN_HALL) {
        gameState.gamePhase = "GAME_OVER_LOSE";
      }
      // Remove population bonus if house
      if (this.populationBonus > 0) {
        gameState.maxPopulation -= this.populationBonus;
      }
    }
  }

  takeDamage(amount) {
    this.health -= amount;
  }

  upgrade() {
    const upgradeCost = this.getUpgradeCost();
    if (gameState.food >= upgradeCost.food && 
        gameState.wood >= upgradeCost.wood && 
        gameState.coal >= upgradeCost.coal) {
      gameState.food -= upgradeCost.food;
      gameState.wood -= upgradeCost.wood;
      gameState.coal -= upgradeCost.coal;
      this.level++;
      this.health = this.maxHealth * this.level;
      this.maxHealth = this.health;
      return true;
    }
    return false;
  }

  getUpgradeCost() {
    const baseCost = BUILDING_DEFS[this.type].cost;
    return {
      food: Math.floor(baseCost.food * this.level * 1.5),
      wood: Math.floor(baseCost.wood * this.level * 1.5),
      coal: Math.floor(baseCost.coal * this.level * 1.5)
    };
  }

  render(p) {
    if (!this.isAlive) return;

    p.push();
    
    // Building body
    p.fill(...this.color);
    p.stroke(0);
    p.strokeWeight(2);
    
    if (this.type === BUILDING_TYPES.TOWN_HALL) {
      // Special render for town hall
      p.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
      p.fill(150, 150, 255);
      p.triangle(
        this.x - this.size/2, this.y - this.size/2,
        this.x, this.y - this.size/2 - 15,
        this.x + this.size/2, this.y - this.size/2
      );
    } else if (this.type === BUILDING_TYPES.WALL) {
      p.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
      // Wall pattern
      p.stroke(80, 80, 80);
      for (let i = 0; i < 3; i++) {
        p.line(
          this.x - this.size/2 + i * this.size/3, this.y - this.size/2,
          this.x - this.size/2 + i * this.size/3, this.y + this.size/2
        );
      }
    } else {
      p.rect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
      
      // Add icon/detail
      if (this.produces === "food") {
        p.fill(255, 255, 0);
        p.noStroke();
        p.circle(this.x, this.y - 5, 8);
        p.fill(100, 200, 100);
        p.rect(this.x - 2, this.y - 5, 4, 10);
      } else if (this.produces === "wood") {
        p.fill(90, 60, 30);
        p.noStroke();
        p.rect(this.x - 3, this.y - 8, 6, 16);
        p.fill(50, 150, 50);
        p.ellipse(this.x, this.y - 10, 15, 15);
      } else if (this.produces === "coal") {
        p.fill(30, 30, 30);
        p.noStroke();
        p.rect(this.x - 5, this.y, 10, 8);
      }
    }

    // Health bar
    if (this.health < this.maxHealth) {
      const barWidth = this.size;
      const barHeight = 4;
      p.fill(200, 50, 50);
      p.noStroke();
      p.rect(this.x - barWidth/2, this.y - this.size/2 - 8, barWidth, barHeight);
      p.fill(50, 200, 50);
      const healthPercent = this.health / this.maxHealth;
      p.rect(this.x - barWidth/2, this.y - this.size/2 - 8, barWidth * healthPercent, barHeight);
    }

    // Level indicator
    if (this.level > 1) {
      p.fill(255, 255, 0);
      p.noStroke();
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`L${this.level}`, this.x + this.size/2 - 8, this.y - this.size/2 + 8);
    }

    // Selection highlight
    if (gameState.selectedBuilding === this) {
      p.noFill();
      p.stroke(255, 255, 0);
      p.strokeWeight(3);
      p.rect(this.x - this.size/2 - 5, this.y - this.size/2 - 5, this.size + 10, this.size + 10);
    }

    p.pop();
  }
}