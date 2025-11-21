// player.js - Player entity

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.score = 0;
    this.bubblesShot = 0;
    this.accuracy = 0;
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  addScore(points) {
    this.score += points;
  }

  recordShot() {
    this.bubblesShot++;
  }

  calculateAccuracy(bubblesCleared) {
    if (this.bubblesShot === 0) return 0;
    return Math.floor((bubblesCleared / this.bubblesShot) * 100);
  }
}