import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../globals.js';

export class HoopFever {
  constructor(p) {
    this.p = p;
    this.state = {
      score: 0,
      ballsRemaining: 15,
      powerMeter: 0,
      powerDirection: 1,
      hoopX: CANVAS_WIDTH / 2,
      hoopY: 100,
      hoopSpeed: 1,
      hoopDirection: 1,
      balls: [],
      charging: false,
      objective: 10
    };
  }

  update() {
    const p = this.p;
    
    // Move hoop
    this.state.hoopX += this.state.hoopSpeed * this.state.hoopDirection;
    if (this.state.hoopX < 100 || this.state.hoopX > CANVAS_WIDTH - 100) {
      this.state.hoopDirection *= -1;
    }
    
    // Update power meter when charging
    if (this.state.charging) {
      this.state.powerMeter += this.state.powerDirection * 3;
      if (this.state.powerMeter >= 100 || this.state.powerMeter <= 0) {
        this.state.powerDirection *= -1;
        this.state.powerMeter = p.constrain(this.state.powerMeter, 0, 100);
      }
    }
    
    // Update balls
    for (let i = this.state.balls.length - 1; i >= 0; i--) {
      const ball = this.state.balls[i];
      ball.vy += 0.3; // gravity
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      // Check hoop collision
      const hoopRimY = this.state.hoopY + 20;
      if (!ball.scored && ball.y > hoopRimY - 5 && ball.y < hoopRimY + 5) {
        const distToHoop = p.abs(ball.x - this.state.hoopX);
        if (distToHoop < 25 && ball.vy > 0) {
          ball.scored = true;
          this.state.score++;
          ball.vx *= 0.3;
          ball.vy *= 0.3;
        }
      }
      
      // Remove off-screen balls
      if (ball.y > CANVAS_HEIGHT + 50) {
        this.state.balls.splice(i, 1);
      }
    }
    
    return this.checkWinLose();
  }

  checkWinLose() {
    if (this.state.score >= this.state.objective) {
      return "GAME_OVER_WIN";
    }
    if (this.state.ballsRemaining === 0 && this.state.balls.length === 0) {
      return this.state.score >= this.state.objective ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
    }
    return null;
  }

  handleInput(keyCode) {
    const p = this.p;
    if (keyCode === 32 && !this.state.charging && this.state.ballsRemaining > 0) {
      this.state.charging = true;
      this.state.powerMeter = 0;
      this.state.powerDirection = 1;
    }
  }

  handleRelease(keyCode) {
    if (keyCode === 32 && this.state.charging) {
      this.shoot();
      this.state.charging = false;
    }
  }

  shoot() {
    const p = this.p;
    const power = this.state.powerMeter / 100;
    const angle = p.map(this.state.hoopX, 100, CANVAS_WIDTH - 100, -0.3, 0.3);
    
    this.state.balls.push({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT - 80,
      vx: angle * 8 * power,
      vy: -12 * power - 5,
      scored: false
    });
    
    this.state.ballsRemaining--;
    
    // Increase difficulty
    if (this.state.score > 3) {
      this.state.hoopSpeed = 1.5;
    }
    if (this.state.score > 6) {
      this.state.hoopSpeed = 2;
    }
  }

  render() {
    const p = this.p;
    
    // Background
    p.background(50, 80, 120);
    
    // Court
    p.fill(150, 100, 70);
    p.rect(0, CANVAS_HEIGHT - 100, CANVAS_WIDTH, 100);
    
    // Backboard
    p.fill(200, 50, 50);
    p.rect(this.state.hoopX - 40, this.state.hoopY - 30, 80, 5);
    
    // Hoop
    p.stroke(255, 100, 0);
    p.strokeWeight(3);
    p.noFill();
    p.arc(this.state.hoopX, this.state.hoopY + 20, 50, 20, 0, p.PI);
    p.line(this.state.hoopX - 25, this.state.hoopY + 20, this.state.hoopX - 25, this.state.hoopY + 40);
    p.line(this.state.hoopX + 25, this.state.hoopY + 20, this.state.hoopX + 25, this.state.hoopY + 40);
    p.noStroke();
    
    // Balls
    for (const ball of this.state.balls) {
      p.fill(255, 140, 0);
      p.circle(ball.x, ball.y, 20);
      p.fill(100, 50, 0);
      p.arc(ball.x, ball.y, 20, 20, 0, p.PI);
    }
    
    // Player
    p.fill(100, 150, 255);
    p.ellipse(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60, 30, 40);
    p.fill(255, 200, 150);
    p.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 75, 20);
    
    // Power meter
    if (this.state.charging) {
      p.fill(60);
      p.rect(CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT - 150, 100, 20);
      const meterColor = this.state.powerMeter > 70 ? [50, 255, 50] : 
                        this.state.powerMeter > 40 ? [255, 255, 50] : [255, 100, 100];
      p.fill(...meterColor);
      p.rect(CANVAS_WIDTH / 2 - 50, CANVAS_HEIGHT - 150, this.state.powerMeter, 20);
    }
    
    // UI
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Score: ${this.state.score}/${this.state.objective}`, 10, 10);
    p.text(`Balls: ${this.state.ballsRemaining}`, 10, 30);
    
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(14);
    p.text("Hold SPACE to charge, release to shoot!", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
  }
}