import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../globals.js';

export class PenaltyShot {
  constructor(p) {
    this.p = p;
    this.state = {
      score: 0,
      attempts: 5,
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT - 100,
      targetX: CANVAS_WIDTH / 2,
      targetY: 150,
      kicking: false,
      ballInFlight: false,
      goalieX: CANVAS_WIDTH / 2,
      goalieSpeed: 3,
      objective: 4
    };
  }

  update() {
    const p = this.p;
    
    // Move goalie
    if (!this.state.ballInFlight) {
      this.state.goalieX += this.state.goalieSpeed;
      if (this.state.goalieX < 200 || this.state.goalieX > CANVAS_WIDTH - 200) {
        this.state.goalieSpeed *= -1;
      }
    }
    
    // Ball flight
    if (this.state.ballInFlight) {
      const dx = this.state.targetX - this.state.ballX;
      const dy = this.state.targetY - this.state.ballY;
      this.state.ballX += dx * 0.1;
      this.state.ballY += dy * 0.1;
      
      if (p.dist(this.state.ballX, this.state.ballY, this.state.targetX, this.state.targetY) < 10) {
        // Check if goal
        const goalieReach = 50;
        if (p.abs(this.state.targetX - this.state.goalieX) > goalieReach) {
          this.state.score++;
        }
        this.resetBall();
      }
    }
    
    return this.checkWinLose();
  }

  checkWinLose() {
    if (this.state.score >= this.state.objective) {
      return "GAME_OVER_WIN";
    }
    if (this.state.attempts === 0) {
      return this.state.score >= this.state.objective ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
    }
    return null;
  }

  resetBall() {
    this.state.ballX = CANVAS_WIDTH / 2;
    this.state.ballY = CANVAS_HEIGHT - 100;
    this.state.ballInFlight = false;
    this.state.kicking = false;
    this.state.attempts--;
    
    if (this.state.score > 2) {
      this.state.goalieSpeed = 4;
    }
  }

  handleInput(keyCode) {
    const p = this.p;
    if (!this.state.ballInFlight && !this.state.kicking) {
      if (keyCode === 37) {
        this.state.targetX = Math.max(150, this.state.targetX - 20);
      } else if (keyCode === 39) {
        this.state.targetX = Math.min(CANVAS_WIDTH - 150, this.state.targetX + 20);
      } else if (keyCode === 38) {
        this.state.targetY = Math.max(100, this.state.targetY - 20);
      } else if (keyCode === 40) {
        this.state.targetY = Math.min(200, this.state.targetY + 20);
      } else if (keyCode === 32) {
        this.state.kicking = true;
        this.state.ballInFlight = true;
      }
    }
  }

  handleRelease(keyCode) {}

  render() {
    const p = this.p;
    
    // Field
    p.background(50, 180, 50);
    
    // Goal
    p.stroke(255);
    p.strokeWeight(4);
    p.noFill();
    p.rect(150, 80, CANVAS_WIDTH - 300, 150);
    p.noStroke();
    
    // Goalie
    p.fill(255, 200, 0);
    p.ellipse(this.state.goalieX, 155, 25, 35);
    p.fill(255, 220, 180);
    p.circle(this.state.goalieX, 140, 18);
    
    // Target marker (if not kicking)
    if (!this.state.ballInFlight) {
      p.stroke(255, 0, 0);
      p.strokeWeight(2);
      p.noFill();
      p.circle(this.state.targetX, this.state.targetY, 20);
      p.line(this.state.targetX - 15, this.state.targetY, this.state.targetX + 15, this.state.targetY);
      p.line(this.state.targetX, this.state.targetY - 15, this.state.targetX, this.state.targetY + 15);
      p.noStroke();
    }
    
    // Ball
    p.fill(255);
    p.circle(this.state.ballX, this.state.ballY, 20);
    p.fill(0);
    for (let i = 0; i < 5; i++) {
      const angle = i * p.TWO_PI / 5;
      const x = this.state.ballX + p.cos(angle) * 6;
      const y = this.state.ballY + p.sin(angle) * 6;
      p.ellipse(x, y, 8, 4);
    }
    
    // Player
    if (!this.state.kicking) {
      p.fill(0, 100, 255);
      p.ellipse(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 80, 25, 35);
      p.fill(255, 220, 180);
      p.circle(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 95, 18);
    }
    
    // UI
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Goals: ${this.state.score}/${this.state.objective}`, 10, 10);
    p.text(`Shots Left: ${this.state.attempts}`, 10, 30);
    
    if (!this.state.ballInFlight) {
      p.textAlign(p.CENTER, p.TOP);
      p.textSize(14);
      p.text("Arrows: Aim | SPACE: Shoot", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
    }
  }
}