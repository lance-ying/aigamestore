import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../globals.js';

export class SurfMaster {
  constructor(p) {
    this.p = p;
    this.state = {
      score: 0,
      playerX: CANVAS_WIDTH / 2,
      waves: [],
      waveSpeed: 3,
      wavePhase: 0,
      tricks: 0,
      combo: 0,
      objective: 50
    };
  }

  update() {
    const p = this.p;
    this.state.wavePhase += 0.05;
    
    // Spawn waves
    if (p.frameCount % 120 === 0) {
      this.state.waves.push({
        x: CANVAS_WIDTH,
        height: p.random(40, 80)
      });
    }
    
    // Update waves
    for (let i = this.state.waves.length - 1; i >= 0; i--) {
      this.state.waves[i].x -= this.state.waveSpeed;
      if (this.state.waves[i].x < -50) {
        this.state.waves.splice(i, 1);
      }
    }
    
    this.state.score++;
    
    if (this.state.score >= this.state.objective) {
      return "GAME_OVER_WIN";
    }
    
    return null;
  }

  handleInput(keyCode) {
    if (keyCode === 37) {
      this.state.playerX = Math.max(50, this.state.playerX - 20);
    } else if (keyCode === 39) {
      this.state.playerX = Math.min(CANVAS_WIDTH - 50, this.state.playerX + 20);
    } else if (keyCode === 32) {
      this.state.tricks++;
      this.state.combo++;
    }
  }

  handleRelease(keyCode) {}

  render() {
    const p = this.p;
    
    // Sky
    p.background(135, 206, 235);
    
    // Ocean
    p.fill(30, 144, 255);
    p.rect(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    
    // Waves
    p.fill(70, 170, 255);
    p.noStroke();
    p.beginShape();
    p.vertex(0, CANVAS_HEIGHT);
    for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
      const y = CANVAS_HEIGHT - 100 + p.sin(x * 0.02 + this.state.wavePhase) * 20;
      p.vertex(x, y);
    }
    p.vertex(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.endShape(p.CLOSE);
    
    // Obstacles (waves)
    for (const wave of this.state.waves) {
      p.fill(255, 255, 255, 150);
      p.ellipse(wave.x, CANVAS_HEIGHT - 120, 60, wave.height);
    }
    
    // Surfer
    const surfY = CANVAS_HEIGHT - 120 + p.sin(this.state.playerX * 0.02 + this.state.wavePhase) * 20;
    p.fill(255, 200, 0);
    p.rect(this.state.playerX - 20, surfY, 40, 8, 5);
    p.fill(255, 100, 150);
    p.ellipse(this.state.playerX, surfY - 15, 15, 25);
    p.fill(255, 220, 180);
    p.circle(this.state.playerX, surfY - 30, 12);
    
    // UI
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Time: ${Math.floor(this.state.score / 60)}s`, 10, 10);
    p.text(`Tricks: ${this.state.tricks}`, 10, 30);
    p.text(`Combo: x${this.state.combo}`, 10, 50);
  }
}