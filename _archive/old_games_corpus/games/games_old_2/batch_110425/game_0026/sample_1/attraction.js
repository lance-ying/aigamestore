// attraction.js - Attraction entity

export class Attraction {
  constructor(type, gridX, gridY, data) {
    this.type = type;
    this.gridX = gridX;
    this.gridY = gridY;
    this.name = data.name;
    this.income = data.income;
    this.satisfaction = data.satisfaction;
    this.size = data.size;
    this.color = data.color;
    this.buildTime = data.buildTime;
    this.buildProgress = 0;
    this.isBuilt = false;
    this.animationOffset = Math.random() * 100;
    this.lastIncomeFrame = 0;
    this.visitorCount = 0;
  }

  update(p, frameCount) {
    if (!this.isBuilt) {
      this.buildProgress++;
      if (this.buildProgress >= this.buildTime) {
        this.isBuilt = true;
      }
    }
  }

  render(p, gridSize, cameraOffsetX, cameraOffsetY) {
    const x = this.gridX * gridSize - cameraOffsetX;
    const y = this.gridY * gridSize - cameraOffsetY;
    const size = this.size * gridSize;

    if (!this.isBuilt) {
      // Construction animation
      const progress = this.buildProgress / this.buildTime;
      p.fill(100, 100, 100, 150);
      p.rect(x, y, size, size * progress);
      p.fill(255);
      p.textSize(10);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`${Math.floor(progress * 100)}%`, x + size / 2, y + size / 2);
      return;
    }

    // Draw built attraction
    p.fill(...this.color);
    p.rect(x, y, size, size);

    // Animation effect
    const animPhase = (p.frameCount + this.animationOffset) * 0.05;
    p.fill(255, 255, 255, 50 + 30 * Math.sin(animPhase));
    p.rect(x + 2, y + 2, size - 4, size - 4);

    // Name label
    p.fill(255);
    p.textSize(8);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.name.substring(0, 8), x + size / 2, y + size / 2);

    // Visitor indicator
    if (this.visitorCount > 0) {
      p.fill(255, 200, 0);
      p.ellipse(x + size - 5, y + 5, 8, 8);
      p.fill(0);
      p.textSize(6);
      p.text(this.visitorCount, x + size - 5, y + 5);
    }
  }

  generateIncome(p, frameCount, incomeMultiplier) {
    if (!this.isBuilt) return 0;
    if (frameCount - this.lastIncomeFrame < 120) return 0;
    this.lastIncomeFrame = frameCount;
    return Math.floor(this.income * incomeMultiplier);
  }
}