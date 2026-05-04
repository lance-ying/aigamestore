import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../globals.js';

export class SpeedSkate {
  constructor(p) {
    this.p = p;
    this.state = {
      score: 0,
      playerProgress: 0,
      playerSpeed: 0,
      opponents: [],
      raceFinished: false,
      objective: 100,
      boostReady: true,
      boostCooldown: 0
    };
    
    for (let i = 0; i < 3; i++) {
      this.state.opponents.push({
        progress: 0,
        speed: 0.5 + i * 0.1,
        lane: i
      });
    }
  }

  update() {
    const p = this.p;
    
    // Update player
    this.state.playerProgress += this.state.playerSpeed;
    this.state.playerSpeed *= 0.95;
    
    // Boost cooldown
    if (this.state.boostCooldown > 0) {
      this.state.boostCooldown--;
      if (this.state.boostCooldown === 0) {
        this.state.boostReady = true;
      }
    }
    
    // Update opponents
    for (const opp of this.state.opponents) {
      opp.progress += opp.speed;
      opp.speed = Math.min(opp.speed + 0.01, 1.2);
    }
    
    // Check finish
    if (this.state.playerProgress >= this.state.objective) {
      this.state.raceFinished = true;
      let playerPosition = 1;
      for (const opp of this.state.opponents) {
        if (opp.progress > this.state.playerProgress) {
          playerPosition++;
        }
      }
      this.state.score = 5 - playerPosition;
      return playerPosition === 1 ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
    }
    
    return null;
  }

  handleInput(keyCode) {
    if (keyCode === 37 || keyCode === 39) {
      this.state.playerSpeed = Math.min(this.state.playerSpeed + 0.3, 2);
    } else if (keyCode === 16 && this.state.boostReady) {
      this.state.playerSpeed += 3;
      this.state.boostReady = false;
      this.state.boostCooldown = 180;
    }
  }

  handleRelease(keyCode) {}

  render() {
    const p = this.p;
    
    // Ice rink
    p.background(200, 230, 255);
    
    // Track lanes
    for (let i = 0; i < 4; i++) {
      const y = 100 + i * 75;
      p.stroke(150, 180, 200);
      p.strokeWeight(2);
      p.line(0, y, CANVAS_WIDTH, y);
    }
    p.noStroke();
    
    // Start/finish lines
    const startX = 50;
    const finishX = CANVAS_WIDTH - 50;
    p.fill(255, 0, 0);
    p.rect(startX, 80, 5, 280);
    p.rect(finishX, 80, 5, 280);
    
    // Opponents
    for (let i = 0; i < this.state.opponents.length; i++) {
      const opp = this.state.opponents[i];
      const x = p.map(opp.progress, 0, this.state.objective, startX, finishX);
      const y = 120 + i * 75;
      p.fill(255, 100, 100);
      p.ellipse(x, y, 20, 30);
    }
    
    // Player
    const playerX = p.map(this.state.playerProgress, 0, this.state.objective, startX, finishX);
    const playerY = 120 + 3 * 75;
    p.fill(50, 100, 255);
    p.ellipse(playerX, playerY, 20, 30);
    p.fill(255, 220, 180);
    p.circle(playerX, playerY - 15, 15);
    
    // UI
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    const progress = Math.floor(this.state.playerProgress / this.state.objective * 100);
    p.text(`Progress: ${progress}%`, 10, 10);
    
    if (this.state.boostReady) {
      p.fill(0, 255, 0);
      p.text("BOOST READY (SHIFT)", 10, 30);
    } else {
      p.fill(255, 100, 100);
      p.text(`Boost: ${Math.ceil(this.state.boostCooldown / 60)}s`, 10, 30);
    }
    
    p.fill(255);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.text("Left/Right: Skate | SHIFT: Boost", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
}