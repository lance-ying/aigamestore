// entities.js - Game entities: hint coins, hotspots, obstacles

export class HintCoin {
  constructor(p, x, y, id) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.id = id;
    this.collected = false;
    this.radius = 8;
    this.spinAngle = 0;
    this.bobOffset = 0;
  }

  update() {
    if (!this.collected) {
      this.spinAngle += 0.05;
      this.bobOffset = this.p.sin(this.spinAngle * 2) * 2;
    }
  }

  checkCollection(player) {
    if (!this.collected) {
      const dist = this.p.dist(player.x, player.y, this.x, this.y);
      if (dist < this.radius + player.width / 2) {
        this.collected = true;
        return true;
      }
    }
    return false;
  }

  render() {
    if (!this.collected) {
      this.p.push();
      this.p.translate(this.x, this.y + this.bobOffset);
      
      // Coin glow
      this.p.noStroke();
      this.p.fill(255, 215, 0, 100);
      this.p.ellipse(0, 0, this.radius * 3, this.radius * 3);
      
      // Coin body
      this.p.fill(255, 215, 0);
      this.p.stroke(180, 140, 0);
      this.p.strokeWeight(2);
      this.p.ellipse(0, 0, this.radius * 2, this.radius * 2);
      
      // Coin detail
      this.p.fill(255, 235, 100);
      this.p.noStroke();
      this.p.ellipse(-2, -2, 4, 4);
      
      this.p.pop();
    }
  }
}

export class PuzzleHotspot {
  constructor(p, x, y, width, height, puzzleId, mandatory = false) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.puzzleId = puzzleId;
    this.mandatory = mandatory;
    this.solved = false;
    this.glowPhase = 0;
  }

  update() {
    if (!this.solved) {
      this.glowPhase += 0.05;
    }
  }

  checkInteraction(player) {
    return this.p.collideRectRect(
      player.x - player.width / 2,
      player.y - player.height / 2,
      player.width,
      player.height,
      this.x,
      this.y,
      this.width,
      this.height
    );
  }

  render() {
    if (!this.solved) {
      this.p.push();
      
      // Glowing indicator
      const glowAlpha = 100 + this.p.sin(this.glowPhase) * 50;
      this.p.fill(255, 200, 100, glowAlpha);
      this.p.noStroke();
      this.p.rect(this.x - 5, this.y - 5, this.width + 10, this.height + 10, 5);
      
      // Hotspot area
      this.p.fill(this.mandatory ? 255 : 200, this.mandatory ? 100 : 200, 100, 80);
      this.p.stroke(255, 200, 100);
      this.p.strokeWeight(2);
      this.p.rect(this.x, this.y, this.width, this.height, 5);
      
      // Exclamation mark
      this.p.fill(255);
      this.p.noStroke();
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.textSize(20);
      this.p.text("!", this.x + this.width / 2, this.y + this.height / 2);
      
      this.p.pop();
    }
  }
}

export class Obstacle {
  constructor(p, x, y, width, height, type = "wall") {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
  }

  render() {
    this.p.push();
    this.p.fill(80, 70, 60);
    this.p.stroke(60, 50, 40);
    this.p.strokeWeight(2);
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Add texture
    this.p.noStroke();
    this.p.fill(100, 90, 80, 100);
    for (let i = 0; i < 3; i++) {
      this.p.rect(this.x + 5, this.y + 5 + i * 10, this.width - 10, 3);
    }
    this.p.pop();
  }
}