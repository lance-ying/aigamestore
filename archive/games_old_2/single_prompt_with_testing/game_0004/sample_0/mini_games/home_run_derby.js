import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../globals.js';

export class HomeRunDerby {
  constructor(p) {
    this.p = p;
    this.state = {
      score: 0,
      pitches: 10,
      ballX: 100,
      ballY: CANVAS_HEIGHT / 2,
      ballVX: 0,
      ballVY: 0,
      pitching: false,
      swinging: false,
      swingFrame: 0,
      hitBall: false,
      objective: 5
    };
  }

  update() {
    const p = this.p;
    
    // Pitch ball
    if (this.state.pitching && !this.state.hitBall) {
      this.state.ballX += 8;
      this.state.ballY += p.sin(this.state.ballX * 0.05) * 2;
      
      if (this.state.ballX > CANVAS_WIDTH - 100) {
        this.resetPitch();
      }
    }
    
    // Swing animation
    if (this.state.swinging) {
      this.state.swingFrame++;
      
      // Check for hit
      if (this.state.swingFrame === 10 && this.state.pitching) {
        const hitZone = p.abs(this.state.ballX - (CANVAS_WIDTH - 100)) < 30;
        if (hitZone) {
          this.state.hitBall = true;
          this.state.ballVX = 12;
          this.state.ballVY = -10;
          this.state.score++;
        }
      }
      
      if (this.state.swingFrame > 20) {
        this.state.swinging = false;
        this.state.swingFrame = 0;
        if (!this.state.hitBall && this.state.pitching) {
          this.resetPitch();
        }
      }
    }
    
    // Hit ball physics
    if (this.state.hitBall) {
      this.state.ballX += this.state.ballVX;
      this.state.ballY += this.state.ballVY;
      this.state.ballVY += 0.5;
      
      if (this.state.ballY > CANVAS_HEIGHT || this.state.ballX > CANVAS_WIDTH + 50) {
        this.resetPitch();
      }
    }
    
    return this.checkWinLose();
  }

  checkWinLose() {
    if (this.state.score >= this.state.objective) {
      return "GAME_OVER_WIN";
    }
    if (this.state.pitches === 0 && !this.state.pitching && !this.state.hitBall) {
      return this.state.score >= this.state.objective ? "GAME_OVER_WIN" : "GAME_OVER_LOSE";
    }
    return null;
  }

  resetPitch() {
    this.state.pitching = false;
    this.state.hitBall = false;
    this.state.ballX = 100;
    this.state.ballY = CANVAS_HEIGHT / 2;
  }

  handleInput(keyCode) {
    if (keyCode === 32 && !this.state.pitching && !this.state.swinging && this.state.pitches > 0) {
      this.state.pitching = true;
      this.state.pitches--;
    } else if (keyCode === 90 && this.state.pitching && !this.state.swinging && !this.state.hitBall) {
      this.state.swinging = true;
      this.state.swingFrame = 0;
    }
  }

  handleRelease(keyCode) {}

  render() {
    const p = this.p;
    
    // Field
    p.background(70, 150, 70);
    p.fill(150, 100, 50);
    p.ellipse(CANVAS_WIDTH - 100, CANVAS_HEIGHT / 2 + 30, 80, 40);
    
    // Pitcher
    p.fill(200, 50, 50);
    p.ellipse(100, CANVAS_HEIGHT / 2, 20, 30);
    p.fill(255, 220, 180);
    p.circle(100, CANVAS_HEIGHT / 2 - 15, 15);
    
    // Ball
    p.fill(255);
    p.circle(this.state.ballX, this.state.ballY, 15);
    
    // Batter
    const batterX = CANVAS_WIDTH - 100;
    const batterY = CANVAS_HEIGHT / 2;
    p.fill(50, 50, 200);
    p.ellipse(batterX, batterY, 20, 30);
    p.fill(255, 220, 180);
    p.circle(batterX, batterY - 15, 15);
    
    // Bat
    p.push();
    p.translate(batterX, batterY);
    if (this.state.swinging) {
      const angle = p.map(this.state.swingFrame, 0, 20, -p.PI / 4, p.PI / 2);
      p.rotate(angle);
    } else {
      p.rotate(-p.PI / 4);
    }
    p.fill(139, 90, 43);
    p.rect(-5, -40, 8, 50);
    p.pop();
    
    // UI
    p.fill(255);
    p.textAlign(p.LEFT, p.TOP);
    p.textSize(16);
    p.text(`Home Runs: ${this.state.score}/${this.state.objective}`, 10, 10);
    p.text(`Pitches: ${this.state.pitches}`, 10, 30);
    
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(14);
    p.text("SPACE: Pitch | Z: Swing", CANVAS_WIDTH / 2, CANVAS_HEIGHT - 10);
  }
}