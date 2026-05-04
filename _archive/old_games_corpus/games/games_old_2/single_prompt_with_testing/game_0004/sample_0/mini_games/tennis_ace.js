import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../globals.js';

export class TennisAce {
  constructor(p) {
    this.p = p;
    this.state = {
      score: 0,
      opponentScore: 0,
      ballX: CANVAS_WIDTH / 2,
      ballY: CANVAS_HEIGHT / 2,
      ballVX: 0,
      ballVY: 0,
      playerY: CANVAS_HEIGHT - 50,
      opponentY: 50,
      serving: true,
      ballInPlay: false,
      objective: 5
    };
  }

  update() {
    const p = this.p;
    
    if (this.state.ballInPlay) {
      this.state.ballX += this.state.ballVX;
      this.state.ballY += this.state.ballVY;
      
      // Wall bounces
      if (this.state.ballX < 20 || this.state.ballX > CANVAS_WIDTH - 20) {
        this.state.ballVX *= -1;
      }
      
      // Player paddle
      if (this.state.ballY > CANVAS_HEIGHT - 60 && 
          p.abs(this.state.ballX - CANVAS_WIDTH / 2) < 40) {
        this.state.ballVY *= -1;
        this.state.ballVX += p.random(-1, 1);
      }
      
      // Opponent paddle (AI)
      this.state.opponentY = p.lerp(this.state.opponentY, this.state.ballX, 0.05);
      if (this.state.ballY < 60 && 
          p.abs(this.state.ballX - this.state.opponentY) < 40) {
        this.state.ballVY *= -1;
        this.state.ballVX += p.random(-1, 1);
      }
      
      // Score points
      if (this.state.ballY < 0) {
        this.state.score++;
        this.resetBall();
      } else if (this.state.ballY > CANVAS_HEIGHT) {
        this.state.opponentScore++;
        this.resetBall();
      }
    }
    
    return this.checkWinLose();
  }

  checkWinLose() {
    if (this.state.score >= this.state.objective) {
      return "GAME_OVER_WIN";
    }
    if (this.state.opponentScore >= this.state.objective) {
      return "GAME_OVER_LOSE";
    }
    return null;
  }

  resetBall() {
    this.state.ballX = CANVAS_WIDTH / 2;
    this.state.ballY = CANVAS_HEIGHT / 2;
    this.state.ballVX = 0;
    this.state.ballVY = 0;
    this.state.ballInPlay = false;
    this.state.serving = true;
  }

  handleInput(keyCode) {
    if (keyCode === 32 && this.state.serving) {
      this.state.serving = false;
      this.state.ballInPlay = true;
      this.state.ballVX = this.p.random(-3, 3);
      this.state.ballVY = -5;
    }
  }

  handleRelease(keyCode) {}

  render() {
    const p = this.p;
    
    // Court
    p.background(100, 150, 100);
    p.stroke(255);
    p.strokeWeight(2);
    p.line(0, CANVAS_HEIGHT / 2, CANVAS_WIDTH, CANVAS_HEIGHT / 2);
    p.noStroke();
    
    // Opponent paddle
    p.fill(255, 100, 100);
    p.rect(this.state.opponentY - 40, 40, 80, 10, 5);
    
    // Player paddle
    p.fill(100, 100, 255);
    const mouseXClamped = p.constrain(this.state.ballX, 40, CANVAS_WIDTH - 40);
    p.rect(mouseXClamped - 40, CANVAS_HEIGHT - 50, 80, 10, 5);
    
    // Ball
    p.fill(255, 255, 0);
    p.circle(this.state.ballX, this.state.ballY, 15);
    
    // UI
    p.fill(255);
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(20);
    p.text(`${this.state.opponentScore}`, CANVAS_WIDTH / 2, 80);
    p.text(`${this.state.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    
    if (this.state.serving) {
      p.textSize(14);
      p.text("SPACE to serve", CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }
  }
}