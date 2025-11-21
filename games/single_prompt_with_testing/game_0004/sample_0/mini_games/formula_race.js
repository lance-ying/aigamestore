import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../globals.js';

export class FormulaRace {
  constructor(p) {
    this.p = p;
    this.state = {
      score: 0,
      playerX: CANVAS_WIDTH / 2,
      playerY: CANVAS_HEIGHT - 100,
      speed: 5,
      obstacles: [],
      opponents: [],
      frameCount: 0,
      roadOffset: 0,
      opponentSpeed: 2,
      objective: 1000
    };
    this.spawnInitialOpponents();
  }

  spawnInitialOpponents() {
    for (let i = 0; i < 3; i++) {
      this.state.opponents.push({
        x: this.p.random(100, CANVAS_WIDTH - 100),
        y: -100 - i * 150,
        lane: this.p.floor(this.p.random(3))
      });
    }
  }

  update() {
    const p = this.p;
    this.state.frameCount++;
    this.state.score++;
    
    // Road scrolling
    this.state.roadOffset += this.state.speed;
    if (this.state.roadOffset > 40) this.state.roadOffset = 0;
    
    // Spawn obstacles
    if (this.state.frameCount % 60 === 0) {
      const lane = p.floor(p.random(3));
      const laneX = 150 + lane * 150;
      this.state.obstacles.push({
        x: laneX,
        y: -50,
        type: p.random() > 0.5 ? 'cone' : 'barrier'
      });
    }
    
    // Spawn opponents
    if (this.state.frameCount % 90 === 0 && this.state.opponents.length < 5) {
      this.state.opponents.push({
        x: p.random(100, CANVAS_WIDTH - 100),
        y: -100,
        lane: p.floor(p.random(3))
      });
    }
    
    // Update obstacles
    for (let i = this.state.obstacles.length - 1; i >= 0; i--) {
      this.state.obstacles[i].y += this.state.speed;
      if (this.state.obstacles[i].y > CANVAS_HEIGHT) {
        this.state.obstacles.splice(i, 1);
      }
    }
    
    // Update opponents with dynamic speed
    const scaledSpeed = this.state.opponentSpeed + this.state.score / 500;
    for (let i = this.state.opponents.length - 1; i >= 0; i--) {
      this.state.opponents[i].y += scaledSpeed;
      if (this.state.opponents[i].y > CANVAS_HEIGHT) {
        this.state.opponents.splice(i, 1);
      }
    }
    
    // Collision detection
    for (const obs of this.state.obstacles) {
      if (p.dist(this.state.playerX, this.state.playerY, obs.x, obs.y) < 30) {
        return "GAME_OVER_LOSE";
      }
    }
    
    for (const opp of this.state.opponents) {
      if (p.dist(this.state.playerX, this.state.playerY, opp.x, opp.y) < 35) {
        return "GAME_OVER_LOSE";
      }
    }
    
    // Win condition
    if (this.state.score >= this.state.objective) {
      return "GAME_OVER_WIN";
    }
    
    return null;
  }

  handleInput(keyCode) {
    if (keyCode === 37) { // Left
      this.state.playerX = Math.max(100, this.state.playerX - 15);
    } else if (keyCode === 39) { // Right
      this.state.playerX = Math.min(CANVAS_WIDTH - 100, this.state.playerX + 15);
    }
  }

  handleRelease(keyCode) {}

  render() {
    const p = this.p;
    
    // Sky
    p.background(100, 150, 200);
    
    // Road
    p.fill(60, 60, 70);
    p.rect(50, 0, CANVAS_WIDTH - 100, CANVAS_HEIGHT);
    
    // Road lines
    p.stroke(255, 255, 0);
    p.strokeWeight(3);
    for (let y = -40 + this.state.roadOffset; y < CANVAS_HEIGHT; y += 40) {
      p.line(200, y, 200, y + 20);
      p.line(350, y, 350, y + 20);
    }
    p.noStroke();
    
    // Obstacles
    for (const obs of this.state.obstacles) {
      if (obs.type === 'cone') {
        p.fill(255, 140, 0);
        p.triangle(obs.x, obs.y - 15, obs.x - 10, obs.y + 15, obs.x + 10, obs.y + 15);
      } else {
        p.fill(255, 50, 50);
        p.rect(obs.x - 15, obs.y - 10, 30, 20);
      }
    }
    
    // Opponents
    for (const opp of this.state.opponents) {
      p.fill(200, 50, 50);
      p.rect(opp.x - 15, opp.y - 25, 30, 50, 5);
      p.fill(100, 100, 150);
      p.rect(opp.x - 12, opp.y - 15, 24, 15);
    }
    
    // Player car
    p.fill(50, 100, 255);
    p.rect(this.state.playerX - 15, this.state.playerY - 25, 30, 50, 5);
    p.fill(150, 200, 255);
    p.rect(this.state.playerX - 12, this.state.playerY - 15, 24, 15);
    
    // UI
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Distance: ${this.state.score}/${this.state.objective}`, 10, 10);
  }
}